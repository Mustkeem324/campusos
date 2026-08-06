import { NextResponse } from 'next/server';
import { z } from 'zod';

import { hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { hashOneTimeToken, validatePasswordStrength } from '@/lib/phase7';

const resetSchema = z.object({
  token: z.string().min(20),
  newPassword: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const payload = resetSchema.parse(await request.json());
    const strength = validatePasswordStrength(payload.newPassword);
    if (!strength.valid) {
      return NextResponse.json({ error: strength.reasons.join(' ') }, { status: 400 });
    }

    const resetToken = hashOneTimeToken(payload.token);
    const user = await prisma.user.findFirst({
      where: {
        resetToken,
        resetTokenExpiry: { gt: new Date() },
        isActive: true,
      },
      select: { id: true, tenantId: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'This reset link is invalid or has expired.' }, { status: 400 });
    }

    const passwordHash = await hashPassword(payload.newPassword);
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          resetToken: null,
          resetTokenExpiry: null,
          loginAttempts: 0,
          lockedUntil: null,
        },
      }),
      prisma.session.deleteMany({ where: { userId: user.id } }),
      prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: 'PHASE7_PASSWORD_RESET_COMPLETED',
          entity: 'User',
          diffJson: JSON.stringify({ allSessionsRevoked: true }),
          ipAddress: request.headers.get('x-forwarded-for'),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: 'Password reset completed. Sign in again on every device.',
    });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'The reset request is incomplete.' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Unable to reset the password.' }, { status: 500 });
  }
}
