import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSession, signToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { unsealMfaSecret, verifyTotp } from '@/lib/phase7';

const verifySchema = z.object({
  userId: z.string().uuid(),
  code: z.string().regex(/^\d{6}$/),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const { userId, code } = verifySchema.parse(await request.json());
    const user = await prisma.user.findFirst({
      where: { id: userId, isActive: true },
      include: { institution: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: 'Multi-factor verification is unavailable.' }, { status: 401 });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked. Try again later.' }, { status: 429 });
    }

    let secret: string;
    try {
      secret = unsealMfaSecret(user.mfaSecret);
    } catch {
      // Backward-compatible read for a legacy base32 secret; new setup always encrypts it.
      if (!/^[A-Z2-7]{16,}$/i.test(user.mfaSecret)) {
        return NextResponse.json({ error: 'Stored MFA configuration is invalid.' }, { status: 401 });
      }
      secret = user.mfaSecret;
    }

    if (!verifyTotp(secret, code)) {
      const attempts = user.loginAttempts + 1;
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: attempts,
          lockedUntil: attempts >= MAX_ATTEMPTS
            ? new Date(Date.now() + LOCK_MINUTES * 60_000)
            : null,
        },
      });
      return NextResponse.json({ error: 'Invalid or expired authentication code.' }, { status: 401 });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown IP';
    const sessionRecord = await createSession(user.id, userAgent, ipAddress);
    const token = signToken({
      sessionId: sessionRecord.token,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    }, 60 * 60 * 24 * 7);

    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        institutionName: user.institution.name,
        avatarUrl: user.avatarUrl,
        phone: user.phone,
        emailVerified: Boolean(user.emailVerified),
        mfaEnabled: true,
        lastLoginAt: new Date().toISOString(),
        createdAt: user.createdAt.toISOString(),
        activeSessionCount: 1,
      },
    });
    response.cookies.set('campusos_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });
    }
    console.error('MFA verification failed:', error);
    return NextResponse.json({ error: 'Unable to verify the authentication code.' }, { status: 500 });
  }
}
