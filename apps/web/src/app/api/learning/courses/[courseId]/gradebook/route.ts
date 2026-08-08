import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireCourseAccess, CourseAccessError } from '../../../../../../lib/lms/course-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/courses/[courseId]/gradebook
 *
 * Role-aware gradebook, tenant-scoped:
 *   - STUDENT → their own scores across gradebook items (+ computed percentage)
 *   - FACULTY → full class gradebook: items + scores per enrolled student
 *   - privileged → full class gradebook
 *
 * Access enforced server-side by requireCourseAccess.
 */
export async function GET(_: Request, { params: paramsPromise }: { params: Promise<{ courseId: string }>; }) {
  const params = await paramsPromise;

  try {
    const access = await requireCourseAccess(params.courseId);
    const { db, offering, session } = access;

    const gradebook = await db.gradebook.findUnique({
      where: { courseOfferingId: offering.id },
      include: {
        items: {
          orderBy: { id: 'asc' },
          include: {
            scores: {
              include: { student: { select: { user: { select: { name: true } } } } },
            },
          },
        },
      },
    });

    const course = offering.course;

    if (!gradebook) {
      return NextResponse.json({ course, items: [], scores: [], studentView: null, empty: true });
    }

    if (session.role === RoleType.STUDENT) {
      const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
      const items = gradebook.items.map((item) => {
        const mine = item.scores.find((s) => s.studentId === student?.id);
        return { id: item.id, title: item.title, maxScore: item.maxScore, score: mine?.score ?? null };
      });
      const earned = items.reduce((sum, item) => sum + (item.score ?? 0), 0);
      const possible = items.reduce((sum, item) => sum + item.maxScore, 0);
      const percentage = possible > 0 ? Math.round((earned / possible) * 1000) / 10 : null;
      return NextResponse.json({
        course,
        items,
        percentage,
        empty: items.length === 0,
        studentView: true,
      });
    }

    // FACULTY / PRIVILEGED: full class gradebook
    const items = gradebook.items.map((item) => ({
      id: item.id,
      title: item.title,
      maxScore: item.maxScore,
      scores: item.scores.map((s) => ({ studentName: s.student.user.name, score: s.score })),
    }));
    return NextResponse.json({
      course,
      items,
      empty: items.length === 0,
      studentView: false,
    });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to load the gradebook' }, { status: 500 });
  }
}
