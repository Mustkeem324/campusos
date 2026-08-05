import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { comparePassword, createSession, signToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { createMfaChallenge } from '../../../../lib/mfa-challenge';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const email = typeof body === 'object' && body && 'email' in body
      ? String(body.email).trim().toLowerCase()
      : '';
    const password = typeof body === 'object' && body && 'password' in body
      ? String(body.password)
      : '';

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // Email is unique inside a tenant, not globally. Reject an ambiguous global
    // match rather than signing into an arbitrary institution account.
    const candidates = await prisma.user.findMany({
      where: { email: { equals: email, mode: 'insensitive' } },
      include: { institution: true },
      take: 2,
    });
    const user = candidates.length === 1 ? candidates[0] : null;

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json(
        { error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' },
        { status: 429 },
      );
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.loginAttempts + 1;
      const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS
        ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockedUntil },
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.mfaEnabled) {
      // Preserve the legacy response field used by the current login UI, but
      // store a signed five-minute challenge instead of exposing a raw user ID.
      const challenge = createMfaChallenge(user.id, user.tenantId);
      return NextResponse.json({ mfaRequired: true, userId: challenge });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown IP';
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

    const cookieStore = cookies();
    cookieStore.set('campusos_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_TTL_SECONDS,
    });

    return NextResponse.json({
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
        mfaEnabled: false,
        lastLoginAt: new Date().toISOString(),
        createdAt: user.createdAt.toISOString(),
        activeSessionCount: 1,
      },
    });
  } catch (error: unknown) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
