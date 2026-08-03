import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { hashPassword } from '../../../../lib/auth';

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
    }

    if (password.length < 12) {
      return NextResponse.json({ error: 'Password must be at least 12 characters' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { verificationToken: token }, // We reuse verificationToken for invitations
    });

    if (!user) {
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
    console.error('Activate account error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
