import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import { signToken, createSession } from '../../../../lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const { persona } = await request.json();

    const personaMap: Record<string, string> = {
      ADMIN: 'admin.demo@campusos.local',
      FACULTY: 'faculty.demo@campusos.local',
      STUDENT: 'student.demo@campusos.local',
      PARENT: 'parent.demo@campusos.local',
      FINANCE: 'finance.demo@campusos.local',
    };

    const email = personaMap[persona];

    if (!email) {
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, institution: { code: 'CDU' } },
      include: {
        institution: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Demo account not found in database. Please run the seed script.' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Demo account is disabled.' }, { status: 403 });
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
    console.error('Demo Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
