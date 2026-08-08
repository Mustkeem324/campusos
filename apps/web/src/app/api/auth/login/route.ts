import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { comparePassword, createSession, signToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { createMfaChallenge } from '../../../../lib/mfa-challenge';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const WORKSPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const LOGIN_BODY_LIMIT_BYTES = 4 * 1024;
const BLOCKED_INSTITUTION_STATUSES = new Set(['SUSPENDED', 'INACTIVE', 'DISABLED']);

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `login:${ipAddress}`, limit: 30, windowMs: 10 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many sign-in attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonWithLimit(request, LOGIN_BODY_LIMIT_BYTES);
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const email = String(payload.email ?? '').trim().toLowerCase();
    const password = String(payload.password ?? '');
    const rememberMe = payload.rememberMe === true;
    const workspace = String(payload.workspace ?? '').trim().toLowerCase();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }
    if (workspace && !WORKSPACE_PATTERN.test(workspace)) {
      return NextResponse.json({ error: 'Invalid institution workspace' }, { status: 400 });
    }

    let user = null;

    if (workspace) {
      const institution = await prisma.institution.findUnique({ where: { subdomain: workspace }, select: { id: true } });
      if (!institution) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
      }
      user = await prisma.user.findFirst({
        where: { tenantId: institution.id, email: { equals: email, mode: 'insensitive' } },
        include: { institution: true },
      });
    } else {
      const candidates = await prisma.user.findMany({
        where: { email: { equals: email, mode: 'insensitive' } },
        include: { institution: true },
        take: 2,
      });

      if (candidates.length > 1) {
        return NextResponse.json(
          { error: 'Invalid credentials. Select your institution workspace and try again.' },
          { status: 401 },
        );
      }
      user = candidates[0] ?? null;
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Customer access follows the institution lifecycle regardless of which
    // login entry point was used. SUPER_ADMIN is the CampusOS company role and
    // is intentionally not disabled by its required tenant relation.
    if (
      user.role !== 'SUPER_ADMIN' &&
      BLOCKED_INSTITUTION_STATUSES.has(user.institution.status.toUpperCase())
    ) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' }, { status: 429 });
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      const attempts = user.loginAttempts + 1;
      const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60_000) : null;
      await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: attempts, lockedUntil } });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.mfaEnabled) {
      const challenge = createMfaChallenge(user.id, user.tenantId);
      return NextResponse.json({ mfaRequired: true, userId: challenge });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const sessionRecord = await createSession(user.id, userAgent, ipAddress);
    const token = signToken({ sessionId: sessionRecord.token, userId: user.id, tenantId: user.tenantId, role: user.role }, SESSION_TTL_SECONDS);

    await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() } });

    const cookieStore = await cookies();
    cookieStore.set('campusos_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(rememberMe ? { maxAge: SESSION_TTL_SECONDS } : {}),
    });
    cookieStore.set('campusos_workspace', user.institution.subdomain, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      ...(rememberMe ? { maxAge: SESSION_TTL_SECONDS } : {}),
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
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
