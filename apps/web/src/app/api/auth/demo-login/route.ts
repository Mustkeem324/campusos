import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createSession, signToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';

const personaMap: Record<string, string> = {
  ADMIN: 'admin.demo@campusos.local',
  FACULTY: 'faculty.demo@campusos.local',
  STUDENT: 'student.demo@campusos.local',
  PARENT: 'parent.demo@campusos.local',
};

export async function POST(request: Request) {
  try {
    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const persona = typeof body === 'object' && body !== null && 'persona' in body
      ? String(body.persona)
      : '';
    const email = personaMap[persona];

    if (!email) {
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, institution: { code: 'CDU' } },
      include: { institution: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Demo account not found. The production demo dataset has not been prepared yet.' },
        { status: 404 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Demo account is disabled.' }, { status: 403 });
    }

    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'Unknown IP';
    const sessionRecord = await createSession(user.id, userAgent, ipAddress);
    const token = signToken({
      sessionId: sessionRecord.token,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    cookies().set('campusos_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.error('Demo Login database schema missing:', error.meta);
      return NextResponse.json(
        {
          error: 'The database schema is not ready. Redeploy the latest version so CampusOS can create the required tables and demo records.',
          code: 'DATABASE_SCHEMA_NOT_READY',
        },
        { status: 503 },
      );
    }

    console.error('Demo Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
