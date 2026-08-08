import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireCourseAccess, CourseAccessError } from '../../../../../../lib/lms/course-access';

export const dynamic = 'force-dynamic';

/**
 * GET /api/learning/courses/[courseId]/assignments
 *
 * Role-aware assignment listing for a course, tenant-scoped:
 *   - STUDENT → assignments + the student's own submission (marks, rubric scores, grade)
 *   - FACULTY → assignments + every submission with student identity (for grading)
 *   - privileged → assignments + every submission
 *
 * Access is enforced server-side by requireCourseAccess (enrolled / teaches / privileged).
 */
export async function GET(_: Request, { params: paramsPromise }: { params: Promise<{ courseId: string }>; }) {
  const params = await paramsPromise;

  try {
    const access = await requireCourseAccess(params.courseId);
    const { db, offering, session } = access;

    if (session.role === RoleType.STUDENT) {
      const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
      if (!student) {
        return NextResponse.json({ error: 'Your student profile could not be resolved.' }, { status: 403 });
      }
      const assignments = await db.assignment.findMany({
        where: { courseOfferingId: offering.id },
        orderBy: { dueDate: 'asc' },
        select: {
          id: true,
          title: true,
          description: true,
          dueDate: true,
          maxMarks: true,
          rubrics: { orderBy: { id: 'asc' }, select: { id: true, criterion: true, maxPoints: true } },
          submissions: {
            where: { studentId: student.id },
            select: { id: true, submittedAt: true, marksObtained: true, rubricScores: true, fileUrl: true },
          },
        },
      });
      return NextResponse.json({
        assignments: assignments.map((assignment) => ({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          dueDate: assignment.dueDate,
          maxMarks: assignment.maxMarks,
          rubric: assignment.rubrics,
          submission: assignment.submissions[0] ?? null,
        })),
      });
    }

    // FACULTY or PRIVILEGED: full roster with submissions for grading
    const assignments = await db.assignment.findMany({
      where: { courseOfferingId: offering.id },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        title: true,
        description: true,
        dueDate: true,
        maxMarks: true,
        rubrics: { orderBy: { id: 'asc' }, select: { id: true, criterion: true, maxPoints: true } },
        submissions: {
          orderBy: { submittedAt: 'asc' },
          select: {
            id: true,
            submittedAt: true,
            marksObtained: true,
            rubricScores: true,
            fileUrl: true,
            student: { select: { user: { select: { name: true } } } },
            grades: { select: { gradeLetter: true, feedback: true } },
          },
        },
      },
    });
    return NextResponse.json({
      assignments: assignments.map((assignment) => ({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        dueDate: assignment.dueDate,
        maxMarks: assignment.maxMarks,
        rubric: assignment.rubrics,
        submissions: assignment.submissions,
        submissionCount: assignment.submissions.length,
      })),
    });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to load assignments' }, { status: 500 });
  }
}
