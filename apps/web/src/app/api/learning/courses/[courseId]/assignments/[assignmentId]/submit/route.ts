import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireAssignmentAccess, AssignmentAccessError } from '../../../../../../../../lib/lms/gradebook-access';

export const dynamic = 'force-dynamic';

/**
 * POST /api/learning/courses/[courseId]/assignments/[assignmentId]/submit
 *
 * Creates or updates the authenticated STUDENT's own submission for an
 * assignment. Server-enforced: only an enrolled student may submit, and only
 * their own submission is ever written. Faculty/privileged roles cannot
 * submit on a student's behalf through this route.
 *
 * Body: { fileUrl?: string }
 */
export async function POST(request: Request, { params }: { params: { courseId: string; assignmentId: string } }) {
  try {
    const access = await requireAssignmentAccess(params.assignmentId);
    const { db, session, assignment } = access;

    if (session.role !== RoleType.STUDENT) {
      return NextResponse.json({ error: 'Only students can submit assignments.' }, { status: 403 });
    }

    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!student) {
      return NextResponse.json({ error: 'Your student profile could not be resolved.' }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as { fileUrl?: string };
    const fileUrl = typeof body.fileUrl === 'string' && body.fileUrl.trim() ? body.fileUrl.trim().slice(0, 500) : null;

    const submission = await db.submission.upsert({
      where: {
        // Only the student's own submission can ever be matched.
        assignmentId_studentId: { assignmentId: assignment.id, studentId: student.id },
      },
      update: { fileUrl, submittedAt: new Date() },
      create: {
        tenantId: session.tenantId,
        assignmentId: assignment.id,
        studentId: student.id,
        fileUrl,
        submittedAt: new Date(),
      },
      select: { id: true, submittedAt: true, fileUrl: true, marksObtained: true },
    });

    return NextResponse.json({ submission, submitted: true });
  } catch (error: unknown) {
    if (error instanceof AssignmentAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to save your submission' }, { status: 500 });
  }
}
