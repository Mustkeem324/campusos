import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { comparePassword, signToken, createSession } from '../../../../lib/auth';
import { cookies } from 'next/headers';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email },
      include: {
        institution: true,
      },
    });

    if (!user) {
      // Do not reveal if the account exists or not for security
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Account is locked or deactivated. Contact your institution.' }, { status: 403 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: 'Account is temporarily locked due to too many failed attempts. Please try again later.' }, { status: 429 });
    }

    const isValid = await comparePassword(password, user.passwordHash);

    if (!isValid) {
      const attempts = user.loginAttempts + 1;
      const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS ? new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000) : null;
      
      await prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: attempts, lockedUntil }
      });

      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Reset login attempts on success
    await prisma.user.update({
      where: { id: user.id },
      data: { loginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() }
    });

    // Check MFA
    if (user.mfaEnabled) {
      // We would return a response requiring MFA token verification
      // For now, return a state indicating MFA is needed
      return NextResponse.json({ mfaRequired: true, userId: user.id });
    }

    // Capture basic request metadata securely
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    // Use x-forwarded-for if behind proxy, otherwise we can't easily get IP in standard Next.js route without specific headers
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

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        institutionName: user.institution.name,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
