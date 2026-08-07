import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db';
import { CourseAccessError, requireCourseAccess } from '@/lib/lms/course-access';
import { attemptDeadline, loadCompetitionConfig, quizWindowState } from '@/lib/lms/quiz-competition';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { courseId: string; quizId: string } }) {
  try {
    const access = await requireCourseAccess(params.courseId);
    if (access.accessRole !== 'STUDENT') return NextResponse.json({ error: 'Only enrolled students can start a competition attempt.' }, { status: 403 });
    const competition = await loadCompetitionConfig(access, params.quizId);
    if (!competition) return NextResponse.json({ error: 'Quiz competition not found.' }, { status: 404 });
    if (quizWindowState(competition.quiz) !== 'OPEN') return NextResponse.json({ error: 'This competition is not currently open.' }, { status: 409 });

    const student = await access.db.student.findUnique({ where: { userId: access.session.userId }, select: { id: true } });
    if (!student) return NextResponse.json({ error: 'Student profile is unavailable.' }, { status: 403 });

    let attempt: { id: string; startedAt: Date; completedAt: Date | null } | null = null;
    let lastError: unknown = null;
    for (let retry = 0; retry < 3 && !attempt; retry += 1) {
      try {
        attempt = await prisma.$transaction(async (tx) => {
          const quiz = await tx.quiz.findFirst({
            where: { id: params.quizId, tenantId: access.session.tenantId, courseOfferingId: access.offering.id },
            select: { id: true },
          });
          if (!quiz) throw new Error('QUIZ_NOT_FOUND');
          const active = await tx.quizAttempt.findFirst({
            where: { quizId: params.quizId, studentId: student.id, completedAt: null },
            orderBy: { startedAt: 'desc' },
            select: { id: true, startedAt: true, completedAt: true },
          });
          if (active) return active;
          const used = await tx.quizAttempt.count({ where: { quizId: params.quizId, studentId: student.id } });
          if (used >= competition.config.maxAttempts) throw new Error('MAX_ATTEMPTS');
          return tx.quizAttempt.create({
            data: { quizId: params.quizId, studentId: student.id },
            select: { id: true, startedAt: true, completedAt: true },
          });
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error: unknown) {
        lastError = error;
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
      }
    }
    if (!attempt) throw lastError ?? new Error('Unable to start attempt.');

    const deadline = attemptDeadline(competition.quiz, attempt);
    return NextResponse.json({
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      deadline,
      resumed: false,
    }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof Error && error.message === 'MAX_ATTEMPTS') return NextResponse.json({ error: 'You have used all allowed attempts for this competition.' }, { status: 409 });
    if (error instanceof Error && error.message === 'QUIZ_NOT_FOUND') return NextResponse.json({ error: 'Quiz competition not found.' }, { status: 404 });
    console.error('[QUIZ_COMPETITION_START]', error);
    return NextResponse.json({ error: 'Unable to start competition attempt.' }, { status: 500 });
  }
}
