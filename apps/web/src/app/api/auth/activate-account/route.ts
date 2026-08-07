import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';
import { hashOneTimeToken, validatePasswordStrength } from '../../../../lib/phase7';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const ACTIVATION_BODY_LIMIT_BYTES = 8 * 1024;
const activationSchema = z.object({
  token: z.string().min(20).max(256),
  password: z.string().min(1).max(256),
});

export async function POST(request: Request) {
  try {
    const ipAddress = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `activate:${ipAddress}`, limit: 30, windowMs: 60 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many activation attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const { token, password } = activationSchema.parse(
      await readJsonWithLimit(request, ACTIVATION_BODY_LIMIT_BYTES),
    );
    const strength = validatePasswordStrength(password);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reasons.join(' ') }, { status: 400 });
    }

    // New registrations store a one-way token hash. The plaintext lookup is kept
    // temporarily for older invitation records created before this hardening.
    const tokenHash = hashOneTimeToken(token);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { verificationToken: tokenHash },
          { verificationToken: token },
        ],
      },
      include: { institution: { select: { status: true } } },
    });

    if (!user || user.emailVerified || user.isActive) {
      return NextResponse.json({ error: 'Invalid or already-used activation link.' }, { status: 400 });
    }

    const newHash = await hashPassword(password);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          verificationToken: null,
          emailVerified: new Date(),
          isActive: true,
          loginAttempts: 0,
          lockedUntil: null,
        },
      });

      // Only the original institution-admin registration may advance an
      // institution awaiting email verification. Staff/student invitations must
      // never change an institution's commercial or security lifecycle state.
      if (
        user.role === 'INSTITUTION_ADMIN' &&
        user.institution.status === 'EMAIL_VERIFICATION_PENDING'
      ) {
        await tx.institution.updateMany({
          where: { id: user.tenantId, status: 'EMAIL_VERIFICATION_PENDING' },
          data: { status: 'ACTIVE' },
        });
      }

      await tx.session.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: 'ACCOUNT_ACTIVATION',
          entity: 'User',
          diffJson: JSON.stringify({ institutionActivated: user.role === 'INSTITUTION_ADMIN' }),
          ipAddress,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }
    if (error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Token and a valid new password are required.' }, { status: 400 });
    }
    console.error('Activate account error:', error);
    return NextResponse.json({ error: 'Unable to activate the account.' }, { status: 500 });
  }
}
