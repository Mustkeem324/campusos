import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { resetToken: token },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    if (user.resetTokenExpiry && user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 400 });
    }

    const newHash = await hashPassword(password);

    await prisma.$transaction([
      // Update password and invalidate token
      prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newHash,
          resetToken: null,
          resetTokenExpiry: null,
          // If they were locked out, unlock them since they successfully reset
          lockedUntil: null,
          loginAttempts: 0,
        },
      }),
      // Session invalidation after password change
      prisma.session.deleteMany({
        where: { userId: user.id },
      }),
      // Audit log
      prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          userId: user.id,
          action: 'PASSWORD_RESET',
          entity: 'User',
          ipAddress: request.headers.get('x-forwarded-for') || 'Unknown',
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
