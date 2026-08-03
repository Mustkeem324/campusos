import { NextResponse } from 'next/server';
import { requireTenantContext } from '../../../../lib/tenant-context';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { db, session } = await requireTenantContext();
    const student = await db.student.findUnique({
      where: { userId: session.userId },
      select: { id: true },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id },
      orderBy: { enrolledAt: 'desc' },
      select: {
        id: true,
        courseOffering: {
          select: {
            id: true,
            course: { select: { id: true, code: true, title: true } },
            faculty: { select: { user: { select: { name: true } } } },
            CourseModule: {
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                title: true,
                sequence: true,
                lessons: {
                  where: { isPublished: true },
                  orderBy: { sequence: 'asc' },
                  select: { id: true, title: true, contentType: true, sequence: true },
                },
              },
            },
            assignments: {
              orderBy: { dueDate: 'asc' },
              select: {
                id: true,
                title: true,
                dueDate: true,
                maxMarks: true,
                submissions: {
                  where: { studentId: student.id },
                  select: { id: true, submittedAt: true, marksObtained: true },
                  take: 1,
                },
              },
            },
            Quiz: {
              orderBy: { startTime: 'asc' },
              select: {
                id: true,
                title: true,
                startTime: true,
                endTime: true,
                timeLimitMins: true,
                attempts: {
                  where: { studentId: student.id },
                  select: { id: true, score: true, completedAt: true },
                  orderBy: { startedAt: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ courses: enrollments.map(({ courseOffering }) => courseOffering) });
  } catch (error: unknown) {
    const status = error instanceof Error && error.message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Unable to load learning data' }, { status });
  }
}
