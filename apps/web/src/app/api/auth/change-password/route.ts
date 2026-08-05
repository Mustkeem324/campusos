import { NextResponse } from 'next/server';

import { comparePassword, getSessionFromCookies, hashPassword } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const currentPassword = 'currentPassword' in body ? String(body.currentPassword) : '';
  const newPassword = 'newPassword' in body ? String(body.newPassword) : '';

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 });
  }

  if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
    return NextResponse.json(
      { error: 'Use at least 12 characters with uppercase, lowercase, number and symbol' },
      { status: 400 },
    );
  }

  const user = await prisma.user.findFirst({
    where: { id: session.userId, tenantId: session.tenantId, isActive: true },
    select: { id: true, passwordHash: true },
  });

  if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 });
  }

  if (await comparePassword(newPassword, user.passwordHash)) {
    return NextResponse.json({ error: 'New password must be different from the current password' }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);

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
      where: {
        userId: user.id,
        token: { not: session.sessionId },
      },
    }),
    prisma.auditLog.create({
      data: {
        tenantId: session.tenantId,
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        diffJson: JSON.stringify({ revokedOtherSessions: true }),
      },
    }),
  ]);

  return NextResponse.json({ success: true, revokedOtherSessions: true });
}
