import { NextResponse } from 'next/server';

import { CourseAccessError, requireCourseAccess } from '../../../../../../../../lib/lms/course-access';
import { markLessonCompleted } from '../../../../../../../../lib/lms/progress';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: Request,
  { params }: { params: { courseId: string; lessonId: string } },
) {
  try {
    const access = await requireCourseAccess(params.courseId);
    if (access.accessRole !== 'STUDENT') {
      return NextResponse.json({ error: 'Lesson completion is available to enrolled students.' }, { status: 403 });
    }

    const lesson = await access.db.courseLesson.findFirst({
      where: {
        id: params.lessonId,
        isPublished: true,
        courseModule: { courseOfferingId: access.offering.id },
      },
      select: { id: true, courseModuleId: true },
    });

    if (!lesson) {
      return NextResponse.json({ error: 'This lesson is not available in your course.' }, { status: 404 });
    }

    const result = await markLessonCompleted(access.db, {
      tenantId: access.session.tenantId,
      userId: access.session.userId,
      courseId: params.courseId,
      courseOfferingId: access.offering.id,
      lessonId: lesson.id,
      moduleId: lesson.courseModuleId,
    });

    return NextResponse.json({
      completed: true,
      alreadyCompleted: result.alreadyCompleted,
      completedAt: result.completedAt.toISOString(),
    });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[LMS_LESSON_COMPLETE]', error);
    return NextResponse.json({ error: 'Unable to update lesson progress.' }, { status: 500 });
  }
}
