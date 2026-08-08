import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { comparePassword, getSessionFromCookies, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';
import {
  generateTotpSecret,
  sealMfaSecret,
  totpUri,
  unsealMfaSecret,
  validatePasswordStrength,
  verifyTotp,
  writePhase7Audit,
} from '@/lib/phase7';

const securitySchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('change-password'),
    currentPassword: z.string().min(1),
    newPassword: z.string().min(1),
  }),
  z.object({ action: z.literal('mfa-setup') }),
  z.object({
    action: z.literal('mfa-confirm'),
    code: z.string().regex(/^\d{6}$/),
  }),
  z.object({
    action: z.literal('mfa-disable'),
    currentPassword: z.string().min(1),
    code: z.string().regex(/^\d{6}$/),
  }),
]);

export async function POST(request: Request) {
  try {
    const [context, session] = await Promise.all([
      requireActiveUserContext(),
      getSessionFromCookies(),
    ]);
    if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

    const payload = securitySchema.parse(await request.json());
    const user = await prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId, isActive: true },
      include: { institution: { select: { name: true } } },
    });
    if (!user) return NextResponse.json({ error: 'Account not found.' }, { status: 404 });

    if (payload.action === 'change-password') {
      const currentValid = await comparePassword(payload.currentPassword, user.passwordHash);
      if (!currentValid) {
        return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
      }
      const strength = validatePasswordStrength(payload.newPassword);
      if (!strength.valid) {
        return NextResponse.json({ error: strength.reasons.join(' ') }, { status: 400 });
      }
      if (await comparePassword(payload.newPassword, user.passwordHash)) {
        return NextResponse.json({ error: 'Choose a password different from the current password.' }, { status: 400 });
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
        prisma.session.deleteMany({
          where: { userId: user.id, token: { not: session.sessionId } },
        }),
      ]);

      await writePhase7Audit(context, 'PHASE7_PASSWORD_CHANGED', 'User', {
        otherSessionsRevoked: true,
      }, request.headers.get('x-forwarded-for'));
      return NextResponse.json({ success: true, message: 'Password updated. Other sessions were revoked.' });
    }

    if (payload.action === 'mfa-setup') {
      // Never let an authenticated browser session silently replace an active
      // MFA secret. Otherwise a stolen session could call the setup action and
      // downgrade an MFA-protected account without proving the current factor.
      if (user.mfaEnabled) {
        return NextResponse.json(
          {
            error: 'Multi-factor authentication is already enabled. Disable it with your current password and authenticator code before starting a new setup.',
          },
          { status: 409 },
        );
      }

      const secret = generateTotpSecret();
      await prisma.user.update({
        where: { id: user.id },
        data: { mfaSecret: sealMfaSecret(secret), mfaEnabled: false },
      });
      await writePhase7Audit(context, 'PHASE7_MFA_SETUP_STARTED', 'User');
      return NextResponse.json({
        success: true,
        secret,
        uri: totpUri(secret, user.email, user.institution.name),
        message: 'Add this key to an authenticator app, then confirm the current 6-digit code.',
      });
    }

    if (payload.action === 'mfa-confirm') {
      if (!user.mfaSecret) {
        return NextResponse.json({ error: 'Start MFA setup before confirming a code.' }, { status: 400 });
      }
      const secret = unsealMfaSecret(user.mfaSecret);
      if (!verifyTotp(secret, payload.code)) {
        return NextResponse.json({ error: 'The authenticator code is invalid or expired.' }, { status: 400 });
      }
      await prisma.user.update({ where: { id: user.id }, data: { mfaEnabled: true } });
      await writePhase7Audit(context, 'PHASE7_MFA_ENABLED', 'User');
      return NextResponse.json({ success: true, message: 'Multi-factor authentication is enabled.' });
    }

    const passwordValid = await comparePassword(payload.currentPassword, user.passwordHash);
    if (!passwordValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 400 });
    }
    if (!user.mfaEnabled || !user.mfaSecret) {
      return NextResponse.json({ error: 'Multi-factor authentication is not enabled.' }, { status: 400 });
    }
    if (!verifyTotp(unsealMfaSecret(user.mfaSecret), payload.code)) {
      return NextResponse.json({ error: 'The authenticator code is invalid or expired.' }, { status: 400 });
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { mfaEnabled: false, mfaSecret: null },
      }),
      prisma.session.deleteMany({
        where: { userId: user.id, token: { not: session.sessionId } },
      }),
    ]);
    await writePhase7Audit(context, 'PHASE7_MFA_DISABLED', 'User', {
      otherSessionsRevoked: true,
    });
    return NextResponse.json({ success: true, message: 'Multi-factor authentication is disabled.' });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? 'Invalid security request.' }, { status: 400 });
    }
    console.error('Account security update failed:', error);
    return NextResponse.json({ error: 'Unable to update account security.' }, { status: 500 });
  }
}
