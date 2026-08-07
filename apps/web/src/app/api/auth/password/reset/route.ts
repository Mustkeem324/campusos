import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashOneTimeToken, validatePasswordStrength } from '@/lib/phase7';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '@/lib/public-rate-limit';

const RESET_BODY_LIMIT_BYTES = 8 * 1024;
const resetSchema = z.object({
  token: z.string().min(20).max(256),
  newPassword: z.string().min(1).max(256),
});

class InvalidResetTokenError extends Error {}

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `password-reset:${ipAddress}`, limit: 30, windowMs: 60 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many password reset attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const payload = resetSchema.parse(await readJsonWithLimit(request, RESET_BODY_LIMIT_BYTES));
    const strength = validatePasswordStrength(payload.newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reasons.join(' ') }, { status: 400 });
    }

    const resetToken = hashOneTimeToken(payload.token);
    const now = new Date();
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpiry: { gt: now },
        isActive: true,
      },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await prisma.$transaction(async (tx) => {
      // Consume the token and change the password in the same conditional write.
      // If two requests race with one token, exactly one is allowed to win.
      const consumed = await tx.user.updateMany({
        where: {
          id: user.id,
          resetToken,
          resetTokenExpiry: { gt: now },
          isActive: true,
        },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });
      if (consumed.count !== 1) throw new InvalidResetTokenError();

      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: 'PHASE7_PASSWORD_RESET_COMPLETED',
          entity: 'User',
          diffJson: JSON.stringify({ allSessionsRevoked: true }),
          ipAddress,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset completed. Sign in again on every device.',
    });
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }
    if (error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'The reset request is incomplete.' }, { status: 400 });
    }
    if (error instanceof InvalidResetTokenError) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }
    console.error('Password reset failed:', error);
    return NextResponse.json({ error: 'Unable to reset the password.' }, { status: 500 });
  }
}
