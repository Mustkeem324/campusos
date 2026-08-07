import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { Trophy } from 'lucide-react';

import { LmsProHome, type LmsCourseCard } from '../../../components/lms/LmsProHome';
import { requireTenantContext } from '../../../lib/tenant-context';
import { resolveAuthorisedCourses } from '../../../lib/lms/course-listing';
import { getCompletedLessonIds } from '../../../lib/lms/progress';

export const dynamic = 'force-dynamic';

export default async function LMSHomePage() {
  let context;
  try {
    context = await requireTenantContext();
  } catch {
    redirect('/login');
  }

  const { db, session } = context;
  const authorised = await resolveAuthorisedCourses(context);
  const offeringIds = authorised.map((course) => course.id);

  const offerings = offeringIds.length
    ? await db.courseOffering.findMany({
        where: { id: { in: offeringIds } },
        orderBy: [{ term: { startDate: 'desc' } }, { course: { code: 'asc' } }],
        select: {
          id: true,
          courseId: true,
          course: { select: { code: true, title: true } },
          faculty: { select: { user: { select: { name: true } } } },
          section: { select: { name: true } },
          term: { select: { name: true } },
          _count: { select: { enrollments: true } },
          CourseModule: {
            orderBy: { sequence: 'asc' },
            select: {
              id: true,
              lessons: {
                where: { isPublished: true },
                orderBy: { sequence: 'asc' },
                select: { id: true, title: true },
              },
            },
          },
          assignments: {
            orderBy: { dueDate: 'asc' },
            select: { id: true, title: true, dueDate: true },
          },
          Quiz: {
            orderBy: { startTime: 'asc' },
            select: { id: true, title: true, startTime: true, endTime: true },
          },
          announcements: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { title: true, createdAt: true },
          },
        },
      })
    : [];

  const isStudent = session.role === RoleType.STUDENT;
  const completedLessonIds = isStudent
    ? await getCompletedLessonIds(db, { tenantId: session.tenantId, userId: session.userId })
    : new Set<string>();

  let studentId: string | null = null;
  if (isStudent) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    studentId = student?.id ?? null;
  }

  const allAssignmentIds = offerings.flatMap((offering) => offering.assignments.map((assignment) => assignment.id));
  const submissions = studentId && allAssignmentIds.length
    ? await db.submission.findMany({
        where: { tenantId: session.tenantId, studentId, assignmentId: { in: allAssignmentIds } },
        select: { assignmentId: true, submittedAt: true },
      })
    : [];
  const submittedAssignments = new Map(submissions.map((submission) => [submission.assignmentId, submission.submittedAt]));
  const now = Date.now();

  const courses: LmsCourseCard[] = offerings.map((offering) => {
    const lessons = offering.CourseModule.flatMap((module) => module.lessons);
    const completed = lessons.filter((lesson) => completedLessonIds.has(lesson.id));
    const openAssignments = offering.assignments.filter((assignment) => !submittedAssignments.has(assignment.id));
    const overdueAssignments = isStudent ? openAssignments.filter((assignment) => assignment.dueDate.getTime() < now).length : 0;
    const pendingAssignments = isStudent ? openAssignments.filter((assignment) => assignment.dueDate.getTime() >= now).length : offering.assignments.length;
    const nextDue = openAssignments.find((assignment) => assignment.dueDate.getTime() >= now) ?? openAssignments[0] ?? null;
    const upcomingQuizRows = offering.Quiz.filter((quiz) => !quiz.endTime || quiz.endTime.getTime() >= now);
    const nextQuiz = upcomingQuizRows.find((quiz) => !quiz.startTime || quiz.startTime.getTime() >= now) ?? upcomingQuizRows[0] ?? null;
    const nextLesson = isStudent ? lessons.find((lesson) => !completedLessonIds.has(lesson.id)) ?? null : lessons[0] ?? null;
    const progressPercent = isStudent ? (lessons.length ? Math.round((completed.length / lessons.length) * 100) : 0) : null;

    return {
      id: offering.id,
      courseId: offering.courseId,
      code: offering.course.code,
      title: offering.course.title,
      instructor: offering.faculty.user.name,
      term: offering.term.name,
      section: offering.section?.name ?? null,
      students: offering._count.enrollments,
      modules: offering.CourseModule.length,
      lessons: lessons.length,
      completedLessons: completed.length,
      progressPercent,
      pendingAssignments,
      overdueAssignments,
      totalAssignments: offering.assignments.length,
      upcomingQuizzes: upcomingQuizRows.length,
      nextDue: nextDue ? { id: nextDue.id, title: nextDue.title, dueDate: nextDue.dueDate.toISOString() } : null,
      nextQuiz: nextQuiz ? { id: nextQuiz.id, title: nextQuiz.title, startTime: nextQuiz.startTime?.toISOString() ?? null } : null,
      latestAnnouncement: offering.announcements[0]
        ? { title: offering.announcements[0].title, createdAt: offering.announcements[0].createdAt.toISOString() }
        : null,
      nextLesson: nextLesson ? { id: nextLesson.id, title: nextLesson.title } : null,
    };
  });

  const heading =
    session.role === RoleType.STUDENT
      ? 'Your enrolled courses, progress and upcoming academic work'
      : session.role === RoleType.FACULTY
        ? 'Your teaching portfolio, course content and assessment workload'
        : 'Institution-wide course offerings and learning activity';

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Link href="/lms/quiz-competitions" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C8D7EA] bg-white px-4 text-sm font-black text-[#173A70] shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition hover:border-[#9DB8D8] hover:bg-[#F7FAFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF]/30">
          <Trophy className="h-4 w-4" aria-hidden="true" /> Quiz competitions
        </Link>
      </div>
      <LmsProHome
        role={session.role}
        heading={heading}
        courses={courses}
        totals={{
          courses: courses.length,
          lessons: courses.reduce((sum, course) => sum + course.lessons, 0),
          assignments: courses.reduce((sum, course) => sum + course.totalAssignments, 0),
          attention: courses.reduce((sum, course) => sum + course.pendingAssignments + course.overdueAssignments, 0),
          upcomingQuizzes: courses.reduce((sum, course) => sum + course.upcomingQuizzes, 0),
          students: courses.reduce((sum, course) => sum + course.students, 0),
        }}
      />
    </div>
  );
}
