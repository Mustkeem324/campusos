import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createSession, signToken } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { verifyMfaChallenge } from '@/lib/mfa-challenge';
import { unsealMfaSecret, verifyTotp } from '@/lib/phase7';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '@/lib/public-rate-limit';

const verifySchema = z.object({
  // The existing MFA page sends this field name. Its value is now a signed,
  // short-lived challenge rather than a raw user identifier.
  userId: z.string().min(40),
  code: z.string().regex(/^\d{6}$/),
});

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const MFA_BODY_LIMIT_BYTES = 8 * 1024;
const BLOCKED_INSTITUTION_STATUSES = new Set(['SUSPENDED', 'INACTIVE', 'DISABLED']);

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `mfa:${ipAddress}`, limit: 30, windowMs: 10 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait and sign in again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const { userId: challengeToken, code } = verifySchema.parse(
      await readJsonWithLimit(request, MFA_BODY_LIMIT_BYTES),
    );
    const challenge = verifyMfaChallenge(challengeToken);
    if (!challenge) {
      return NextResponse.json(
        { error: 'The MFA challenge is invalid or has expired. Sign in again.' },
        { status: 401 },
      );
    }

    const user = await prisma.user.findFirst({
      where: {
        id: challenge.userId,
        tenantId: challenge.tenantId,
        isActive: true,
      },
      include: { institution: true },
    });

    if (!user || !user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: 'Multi-factor verification is unavailable.' }, { status: 401 });
    }
    if (
      user.role !== 'SUPER_ADMIN' &&
      BLOCKED_INSTITUTION_STATUSES.has(user.institution.status.toUpperCase())
    ) {
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
      const failed = await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: { increment: 1 } },
        select: { loginAttempts: true },
      });
      if (failed.loginAttempts >= MAX_ATTEMPTS) {
        await prisma.user.update({
          where: { id: user.id },
          data: { lockedUntil: new Date(Date.now() + LOCK_MINUTES * 60_000) },
        });
      }
      return NextResponse.json({ error: 'Invalid or expired authentication code.' }, { status: 401 });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const sessionRecord = await createSession(user.id, userAgent, ipAddress);
    const token = signToken({
      sessionId: sessionRecord.token,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    }, SESSION_TTL_SECONDS);

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
      maxAge: SESSION_TTL_SECONDS,
    });
    return response;
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }
    if (error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });
    }
    console.error('MFA verification failed:', error);
    return NextResponse.json({ error: 'Unable to verify the authentication code.' }, { status: 500 });
  }
}
