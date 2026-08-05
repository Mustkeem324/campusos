import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireAssignmentAccess, AssignmentAccessError } from '../../../../../../../../../../lib/lms/gradebook-access';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * PUT /api/learning/courses/[courseId]/assignments/[assignmentId]/submissions/[submissionId]/grade
 *
 * Faculty-only rubric grading. Server-enforced: only the faculty member
 * assigned to the offering may grade; the submission must belong to the
 * assignment; marks must be within [0, maxMarks].
 *
 * Body: { marksObtained: number, rubricScores?: Record<string, number>, gradeLetter?: string, feedback?: string }
 */
export async function PUT(request: Request, { params }: { params: { courseId: string; assignmentId: string; submissionId: string } }) {
  try {
    const access = await requireAssignmentAccess(params.assignmentId);
    const { db, session, assignment } = access;

    if (session.role !== RoleType.FACULTY) {
      return NextResponse.json({ error: 'Only the assigned faculty can grade submissions.' }, { status: 403 });
    }
    if (!UUID_RE.test(params.submissionId)) {
      return NextResponse.json({ error: 'This submission is not available.' }, { status: 404 });
    }

    const submission = await db.submission.findFirst({
      where: { id: params.submissionId, assignmentId: assignment.id },
      select: { id: true },
    });
    if (!submission) {
      return NextResponse.json({ error: 'This submission is not available.' }, { status: 404 });
    }

    // Validate rubric scores against the assignment's actual criteria so
    // arbitrary keys/values cannot be stored.
    const rubrics = await db.rubric.findMany({
      where: { assignmentId: assignment.id },
      select: { criterion: true, maxPoints: true },
    });

    const body = (await request.json().catch(() => ({}))) as {
      marksObtained?: number;
      rubricScores?: Record<string, number>;
      gradeLetter?: string;
      feedback?: string;
    };

    const marksObtained = Number(body.marksObtained);
    if (!Number.isFinite(marksObtained) || marksObtained < 0 || marksObtained > assignment.maxMarks) {
      return NextResponse.json({ error: `Marks must be between 0 and ${assignment.maxMarks}.` }, { status: 400 });
    }

    let rubricScores: Record<string, number> | null = null;
    if (body.rubricScores !== undefined) {
      if (typeof body.rubricScores !== 'object' || body.rubricScores === null || Array.isArray(body.rubricScores)) {
        return NextResponse.json({ error: 'Rubric scores must be an object keyed by rubric criterion.' }, { status: 400 });
      }
      const byCriterion = new Map(rubrics.map((rubric) => [rubric.criterion, rubric.maxPoints]));
      const entries = Object.entries(body.rubricScores);
      for (const [key, value] of entries) {
        const maxPoints = byCriterion.get(key);
        if (maxPoints === undefined) {
          return NextResponse.json({ error: `Unknown rubric criterion: ${key.slice(0, 80)}.` }, { status: 400 });
        }
        const numeric = Number(value);
        if (!Number.isFinite(numeric) || numeric < 0 || numeric > maxPoints) {
          return NextResponse.json({ error: `Rubric score for "${key.slice(0, 80)}" must be between 0 and ${maxPoints}.` }, { status: 400 });
        }
      }
      rubricScores = Object.fromEntries(entries.map(([key, value]) => [key.slice(0, 120), Number(value)]));
    }

    const gradeLetter = typeof body.gradeLetter === 'string' && body.gradeLetter.trim() ? body.gradeLetter.trim().slice(0, 2) : deriveGradeLetter(marksObtained, assignment.maxMarks);
    const feedback = typeof body.feedback === 'string' ? body.feedback.trim().slice(0, 2000) : null;

    const updated = await db.submission.update({
      where: { id: submission.id },
      data: { marksObtained, rubricScores },
      select: { id: true, marksObtained: true, rubricScores: true },
    });

    await db.grade.upsert({
      where: { submissionId: submission.id },
      update: { gradeLetter, feedback },
      create: { submissionId: submission.id, gradeLetter, feedback },
    });

    return NextResponse.json({ submission: updated, grade: { gradeLetter, feedback } });
  } catch (error: unknown) {
    if (error instanceof AssignmentAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to save the grade' }, { status: 500 });
  }
}

function deriveGradeLetter(marks: number, maxMarks: number): string {
  const pct = (marks / maxMarks) * 100;
  if (pct >= 90) return 'A';
  if (pct >= 80) return 'B';
  if (pct >= 70) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}
