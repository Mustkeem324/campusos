import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const VERIFY_BODY_LIMIT_BYTES = 2 * 1024;
const VERIFY_RATE_LIMIT_PER_IP = 20;
const VERIFY_RATE_WINDOW_MS = 60 * 60_000;

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    const rateLimit = checkPublicRateLimit({
      key: `verify-email:${ip}`,
      limit: VERIFY_RATE_LIMIT_PER_IP,
      windowMs: VERIFY_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonWithLimit(request, VERIFY_BODY_LIMIT_BYTES);
    const payload = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const token = typeof payload.token === 'string' ? payload.token : '';

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token },
      include: { institution: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Verify tokens must not be valid indefinitely.
    const TOKEN_VALID_FOR_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (user.createdAt.getTime() + TOKEN_VALID_FOR_MS < Date.now()) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    // Mark user active and email verified, clear token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerified: new Date(),
          verificationToken: null,
          isActive: true,
        },
      }),
      // Move institution out of ONBOARDING to ACTIVE if this was the admin
      prisma.institution.update({
        where: { id: user.tenantId },
        data: { status: 'ACTIVE' }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
