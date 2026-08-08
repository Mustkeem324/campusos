import { NextResponse } from 'next/server';

import { createSession, signToken } from './auth';
import { prisma } from './db';
import { verifyMfaChallenge } from './mfa-challenge';
import { unsealMfaSecret, verifyTotp } from './phase7';

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * Single source of truth for completing a sign-in after an MFA challenge.
 * Both /api/auth/mfa-verify and the legacy /api/auth/mfa/verify route through
 * here so the two can never drift apart (a previous drift left the legacy
 * route accepting a hardcoded code for an arbitrary user id).
 *
 * The challenge token is a short-lived signed JWT minted at login time; it
 * carries the user and tenant, so no client-controlled identity is trusted.
 */
export async function completeMfaLogin(
  request: Request,
  challengeToken: string,
  code: string,
  includeUserPayload: boolean,
): Promise<NextResponse> {
  const challenge = verifyMfaChallenge(challengeToken);
  if (!challenge) {
    return NextResponse.json(
      { error: 'The MFA challenge is invalid or has expired. Sign in again.' },
      { status: 401 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: challenge.userId, tenantId: challenge.tenantId, isActive: true },
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
        lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
      },
    });
    return NextResponse.json({ error: 'Invalid or expired authentication code.' }, { status: 401 });
  }

  const userAgent = request.headers.get('user-agent') || 'Unknown';
  const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown IP';
  const sessionRecord = await createSession(user.id, userAgent, ipAddress);
  const token = signToken(
    { sessionId: sessionRecord.token, userId: user.id, tenantId: user.tenantId, role: user.role },
    SESSION_TTL_SECONDS,
  );

  await prisma.user.update({
    where: { id: user.id },
    data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  const body = includeUserPayload
    ? {
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
      }
    : { success: true };

  const response = NextResponse.json(body);
  response.cookies.set('campusos_session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}
