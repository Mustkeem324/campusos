import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

const PRIVILEGED_ROLES: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR];

/**
 * GET /api/learning/courses
 *
 * Role-aware course listing, fully tenant-scoped. Each role receives only the
 * offerings it is authorised to see:
 *   - STUDENT → offerings the student is enrolled in
 *   - FACULTY/STAFF → offerings the faculty member teaches
 *   - SUPER_ADMIN / INSTITUTION_ADMIN / REGISTRAR → all tenant offerings
 *
 * Status: 401 unauthenticated · 403 no profile/role resolution · 200 list.
 */
export async function GET() {
  try {
    const { db, session } = await requireTenantContext();
    const tenantId = session.tenantId;

    const select = {
      id: true,
      courseId: true,
      capacity: true,
      course: { select: { code: true, title: true } },
      faculty: { select: { user: { select: { name: true } } } },
      section: { select: { name: true } },
      term: { select: { name: true } },
      _count: { select: { CourseModule: true, enrollments: true } },
    } as const;

    if (PRIVILEGED_ROLES.includes(session.role)) {
      const offerings = await db.courseOffering.findMany({
        where: { tenantId },
        orderBy: { id: 'asc' },
        select,
      });
      return NextResponse.json({ courses: offerings });
    }

    if (session.role === RoleType.FACULTY) {
      const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!staff) {
        return NextResponse.json({ error: 'Your faculty profile could not be resolved.' }, { status: 403 });
      }
      const offerings = await db.courseOffering.findMany({
        where: { tenantId, facultyId: staff.id },
        orderBy: { id: 'asc' },
        select,
      });
      return NextResponse.json({ courses: offerings });
    }

    if (session.role === RoleType.STUDENT) {
      const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!student) {
        return NextResponse.json({ error: 'Your student profile could not be resolved.' }, { status: 403 });
      }
      const enrollments = await db.enrollment.findMany({
        where: { studentId: student.id, tenantId },
        select: { courseOffering: { select } },
      });
      return NextResponse.json({
        courses: enrollments.map((enrollment) => enrollment.courseOffering),
      });
    }

    return NextResponse.json({ error: 'Your role does not have access to course listings.' }, { status: 403 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Unauthorized')) {
      return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Unable to load courses' }, { status: 500 });
  }
}
