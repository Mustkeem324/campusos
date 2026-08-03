import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/db';
import { signToken, createSession } from '../../../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { userId, code } = await request.json();

    if (!userId || !code) {
      return NextResponse.json({ error: 'User ID and code are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { institution: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Invalid user state' }, { status: 400 });
    }

    // In a real production environment, we would use otplib:
    // const isValid = authenticator.check(code, user.mfaSecret);
    // For this demonstration, we'll accept '123456' as the mock valid TOTP code
    const isValid = code === '123456'; 

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid 2FA code' }, { status: 401 });
    }

    // Capture basic request metadata securely
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for') || 'Unknown IP';

    // Create a real DB session
    const sessionRecord = await createSession(user.id, userAgent, ipAddress);

    // Sign the JWT bridging the Session ID
    const token = signToken({
      sessionId: sessionRecord.token,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    const cookieStore = cookies();
    cookieStore.set('campusos_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('MFA Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
