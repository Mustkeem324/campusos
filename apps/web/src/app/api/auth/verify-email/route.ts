import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

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
    console.error('Verify email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
