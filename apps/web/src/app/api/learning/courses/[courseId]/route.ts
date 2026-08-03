import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: { courseId: string } }) {
  try {
    const { db, session } = await requireTenantContext();
    const offering = await db.courseOffering.findFirst({
      where: { courseId: params.courseId },
      orderBy: { id: 'asc' },
      select: {
        id: true,
        course: { select: { code: true, title: true } },
        facultyId: true,
        faculty: { select: { user: { select: { name: true } } } },
        CourseModule: { orderBy: { sequence: 'asc' }, select: { id: true, title: true, description: true, sequence: true, lessons: { where: { isPublished: true }, orderBy: { sequence: 'asc' }, select: { id: true, title: true, contentType: true, contentUrl: true, contentBody: true, sequence: true } } } },
        assignments: { orderBy: { dueDate: 'asc' }, select: { id: true, title: true, description: true, dueDate: true, maxMarks: true } },
        Quiz: { orderBy: { startTime: 'asc' }, select: { id: true, title: true, description: true, startTime: true, endTime: true, timeLimitMins: true } },
      },
    });
    if (!offering) return NextResponse.json({ error: 'Course not found' }, { status: 404 });

    const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
    const privilegedRoles: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR];
    const privileged = privilegedRoles.includes(session.role);
    const isFaculty = staff?.id === offering.facultyId;
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    const enrollment = student ? await db.enrollment.findFirst({ where: { studentId: student.id, courseOfferingId: offering.id }, select: { id: true } }) : null;
    if (!privileged && !isFaculty && !enrollment) return NextResponse.json({ error: 'You are not enrolled in this course' }, { status: 403 });

    return NextResponse.json({ course: offering.course, instructor: offering.faculty.user.name, modules: offering.CourseModule, assignments: offering.assignments, quizzes: offering.Quiz });
  } catch (error: unknown) {
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Unable to load course' }, { status });
  }
}
