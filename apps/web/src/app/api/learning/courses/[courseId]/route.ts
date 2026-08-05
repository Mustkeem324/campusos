import { NextResponse } from 'next/server';
import { requireCourseAccess, CourseAccessError } from '../../../../../lib/lms/course-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/courses/[courseId]
 *
 * Course detail. Access is enforced server-side by requireCourseAccess:
 * enrolled student, assigned faculty, or privileged role only (tenant-scoped).
 * Status: 401 unauthenticated · 403 unauthorised · 404 course not visible.
 */
export async function GET(_: Request, { params }: { params: { courseId: string } }) {
  try {
    const access = await requireCourseAccess(params.courseId);
    const { db, offering } = access;

    const detail = await db.courseOffering.findUnique({
      where: { id: offering.id },
      select: {
        id: true,
        course: { select: { code: true, title: true } },
        faculty: { select: { user: { select: { name: true } } } },
        CourseModule: { orderBy: { sequence: 'asc' }, select: { id: true, title: true, description: true, sequence: true, lessons: { where: { isPublished: true }, orderBy: { sequence: 'asc' }, select: { id: true, title: true, contentType: true, contentUrl: true, contentBody: true, sequence: true } } } },
        assignments: { orderBy: { dueDate: 'asc' }, select: { id: true, title: true, description: true, dueDate: true, maxMarks: true } },
        Quiz: { orderBy: { startTime: 'asc' }, select: { id: true, title: true, description: true, startTime: true, endTime: true, timeLimitMins: true } },
        announcements: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 20,
          select: {
            id: true,
            title: true,
            content: true,
            isPinned: true,
            createdAt: true,
            author: { select: { user: { select: { name: true } } } },
          },
        },
      },
    });

    if (!detail) {
      return NextResponse.json({ error: 'This course is not available.' }, { status: 404 });
    }

    return NextResponse.json({
      course: detail.course,
      instructor: detail.faculty.user.name,
      modules: detail.CourseModule,
      assignments: detail.assignments,
      quizzes: detail.Quiz,
      announcements: detail.announcements,
      canPostAnnouncement: access.accessRole !== 'STUDENT',
    });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to load course' }, { status: 500 });
  }
}
