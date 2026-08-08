import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';
import { validatePasswordStrength } from '../../../../lib/phase7';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const ACTIVATE_BODY_LIMIT_BYTES = 4 * 1024;
const ACTIVATE_RATE_LIMIT_PER_IP = 10;
const ACTIVATE_RATE_WINDOW_MS = 60 * 60_000;

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    const rateLimit = checkPublicRateLimit({
      key: `activate-account:${ip}`,
      limit: ACTIVATE_RATE_LIMIT_PER_IP,
      windowMs: ACTIVATE_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many activation attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonWithLimit(request, ACTIVATE_BODY_LIMIT_BYTES);
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const token = typeof payload.token === 'string' ? payload.token : '';
    const password = typeof payload.password === 'string' ? payload.password : '';

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reasons.join(' ') }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token }, // We reuse verificationToken for invitations
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired activation link' }, { status: 400 });
    }

    // Activation links must not be valid indefinitely. Tokens are minted at
    // account creation, so enforce a generous window from createdAt that still
    // covers institution invitations (which reuse verificationToken).
    const TOKEN_VALID_FOR_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (user.createdAt.getTime() + TOKEN_VALID_FOR_MS < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired activation link' }, { status: 400 });
    }

    const newHash = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          verificationToken: null,
          emailVerified: new Date(),
          isActive: true,
        },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: 'ACCOUNT_ACTIVATION',
          entity: 'User',
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Activate account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
