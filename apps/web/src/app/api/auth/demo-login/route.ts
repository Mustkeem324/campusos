import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { createSession, signToken } from '../../../../lib/auth';
import { prisma } from '../../../../lib/db';

const personaMap: Record<string, string> = {
  ADMIN: 'admin@nexus-campus.local',
  FACULTY: 'faculty@nexus-campus.local',
  STUDENT: 'student@nexus-campus.local',
  PARENT: 'parent@nexus-campus.local',
};

export async function POST(request: Request) {
  try {
    if (process.env.CAMPUSOS_SYNTHETIC_ACCESS !== 'true') {
      return NextResponse.json({ error: 'Synthetic sample access is currently disabled' }, { status: 403 });
    }

    const body: unknown = await request.json();
    const persona = typeof body === 'object' && body !== null && 'persona' in body
      ? String(body.persona)
      : '';
    const email = personaMap[persona];

    if (!email) {
      return NextResponse.json({ error: 'Invalid sample persona' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { email, institution: { code: 'NITX' } },
      include: { institution: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Synthetic account not found. Run the approved CampusOS synthetic campus seed first.' },
        { status: 404 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Synthetic account is disabled.' }, { status: 403 });
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
      console.error('Synthetic access database schema missing:', error.meta);
      return NextResponse.json(
        {
          error: 'The database schema is not ready. Deploy the latest version and run the approved synthetic campus seed.',
          code: 'DATABASE_SCHEMA_NOT_READY',
        },
        { status: 503 },
      );
    }

    console.error('Synthetic sample access error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
