import { NextResponse } from 'next/server';
import { requireTenantContext } from '@/lib/tenant-context';
import { prisma } from '@/lib/db';
import { signToken, createSession } from '@/lib/auth';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(
  req: Request,
  { params }: { params: { instanceId: string } }
) {
  try {
    const { db, tenantId } = await requireTenantContext();

    if (process.env.DEMO_MODE !== 'true') {
      return NextResponse.json({ error: 'Demo mode is currently disabled' }, { status: 403 });
    }

    const { targetPersona } = await req.json();
    if (!['ADMIN', 'FACULTY', 'STUDENT', 'PARENT'].includes(targetPersona)) {
      return NextResponse.json({ error: 'Invalid persona' }, { status: 400 });
    }

    const instance = await db.demoScenarioInstance.findUnique({
      where: { id: params.instanceId, tenantId },
    });

    if (!instance) {
      return NextResponse.json({ error: 'Scenario instance not found' }, { status: 404 });
    }

    const emailMap: Record<string, string> = {
      ADMIN: 'admin.demo@campusos.local',
      FACULTY: 'faculty.demo@campusos.local',
      STUDENT: 'student.demo@campusos.local',
      PARENT: 'parent.demo@campusos.local',
    };

    const targetEmail = emailMap[targetPersona];
    const user = await prisma.user.findFirst({
      where: { email: targetEmail, institution: { code: 'CDU' } },
      include: { institution: true },
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: `Demo account for ${targetPersona} not found.` }, { status: 404 });
    }

    // Session rotation
    const userAgent = req.headers.get('user-agent') || 'Demo Scenario Switch';
    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const sessionRecord = await createSession(user.id, userAgent, ipAddress);

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
      maxAge: 60 * 60 * 24 * 7,
    });

    // Update scenario instance persona
    await db.demoScenarioInstance.update({
      where: { id: instance.id },
      data: {
        currentPersona: user.name,
        status: 'ACTION_REQUIRED',
      },
    });

    // Record Event
    await db.demoScenarioEvent.create({
      data: {
        instanceId: instance.id,
        tenantId,
        stepIndex: instance.currentStep,
        actorPersona: user.name,
        actorRole: user.role,
        action: 'SWITCH_ROLE',
        module: 'Role Switcher',
        result: `Switched session to ${user.name} (${user.role})`,
      },
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
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to switch demo role';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
