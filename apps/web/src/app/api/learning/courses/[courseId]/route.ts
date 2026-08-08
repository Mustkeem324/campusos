import { NextResponse } from 'next/server';

import { CourseAccessError, requireCourseAccess } from '../../../../../lib/lms/course-access';
import { getCompletedLessonIds } from '../../../../../lib/lms/progress';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/courses/[courseId]
 *
 * Premium course workspace payload. Access is still enforced by
 * requireCourseAccess, so the richer UI never broadens course visibility.
 */
export async function GET(_: Request, { params: paramsPromise }: { params: Promise<{ courseId: string }>; }) {
  const params = await paramsPromise;

  try {
    const access = await requireCourseAccess(params.courseId);
    const { db, offering, session } = access;

    const detail = await db.courseOffering.findUnique({
      where: { id: offering.id },
      select: {
        id: true,
        course: { select: { code: true, title: true } },
        faculty: { select: { user: { select: { name: true } } } },
        section: { select: { name: true } },
        term: { select: { name: true, startDate: true, endDate: true } },
        _count: { select: { enrollments: true } },
        CourseModule: {
          orderBy: { sequence: 'asc' },
          select: {
            id: true,
            title: true,
            description: true,
            sequence: true,
            lessons: {
              where: { isPublished: true },
              orderBy: { sequence: 'asc' },
              select: {
                id: true,
                title: true,
                contentType: true,
                contentUrl: true,
                contentBody: true,
                sequence: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          },
        },
        assignments: {
          orderBy: { dueDate: 'asc' },
          select: { id: true, title: true, description: true, dueDate: true, maxMarks: true },
        },
        Quiz: {
          orderBy: { startTime: 'asc' },
          select: { id: true, title: true, description: true, startTime: true, endTime: true, timeLimitMins: true },
        },
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

    const lessonIds = detail.CourseModule.flatMap((module) => module.lessons.map((lesson) => lesson.id));
    const completedLessonIds =
      access.accessRole === 'STUDENT'
        ? await getCompletedLessonIds(db, { tenantId: session.tenantId, userId: session.userId })
        : new Set<string>();
    const completedInCourse = lessonIds.filter((lessonId) => completedLessonIds.has(lessonId));

    let studentId: string | null = null;
    if (access.accessRole === 'STUDENT') {
      const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
      studentId = student?.id ?? null;
    }

    const submissionRows = studentId
      ? await db.submission.findMany({
          where: { tenantId: session.tenantId, studentId, assignmentId: { in: detail.assignments.map((assignment) => assignment.id) } },
          select: { id: true, assignmentId: true, submittedAt: true, marksObtained: true },
        })
      : [];
    const submissionsByAssignment = new Map(submissionRows.map((row) => [row.assignmentId, row]));

    const sessions = await db.learningSession.findMany({
      where: { tenantId: session.tenantId, courseOfferingId: detail.id },
      orderBy: { scheduledAt: 'asc' },
      take: 8,
      select: { id: true, title: true, description: true, scheduledAt: true, startedAt: true, endedAt: true, status: true, recordingUrl: true },
    });

    const now = Date.now();
    const assignments = detail.assignments.map((assignment) => {
      const submission = submissionsByAssignment.get(assignment.id) ?? null;
      const isLate = Boolean(submission && submission.submittedAt.getTime() > assignment.dueDate.getTime());
      const state = submission
        ? submission.marksObtained !== null
          ? 'GRADED'
          : isLate
            ? 'SUBMITTED_LATE'
            : 'SUBMITTED'
        : assignment.dueDate.getTime() < now
          ? 'OVERDUE'
          : 'PENDING';
      return { ...assignment, submission, state };
    });

    const nextLesson = detail.CourseModule.flatMap((module) => module.lessons).find((lesson) => !completedLessonIds.has(lesson.id)) ?? null;
    const progressPercent = lessonIds.length === 0 ? 0 : Math.round((completedInCourse.length / lessonIds.length) * 100);

    return NextResponse.json(
      {
        course: detail.course,
        offering: {
          id: detail.id,
          section: detail.section?.name ?? null,
          term: detail.term.name,
          termStart: detail.term.startDate,
          termEnd: detail.term.endDate,
          enrolledStudents: detail._count.enrollments,
        },
        instructor: detail.faculty.user.name,
        accessRole: access.accessRole,
        modules: detail.CourseModule.map((module) => ({
          ...module,
          lessons: module.lessons.map((lesson) => ({ ...lesson, completed: completedLessonIds.has(lesson.id) })),
        })),
        progress: {
          completedLessons: completedInCourse.length,
          totalLessons: lessonIds.length,
          percent: progressPercent,
          nextLessonId: nextLesson?.id ?? null,
        },
        assignments,
        quizzes: detail.Quiz,
        announcements: detail.announcements,
        learningSessions: sessions,
        canPostAnnouncement: access.accessRole !== 'STUDENT',
        canManageCourse: access.accessRole !== 'STUDENT',
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[LMS_COURSE_DETAIL]', error);
    return NextResponse.json({ error: 'Unable to load course' }, { status: 500 });
  }
}
