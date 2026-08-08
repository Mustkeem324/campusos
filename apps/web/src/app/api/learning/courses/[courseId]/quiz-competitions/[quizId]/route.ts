import { NextResponse } from 'next/server';

import { CourseAccessError, requireCourseAccess } from '@/lib/lms/course-access';
import { loadCompetitionConfig, quizWindowState, shouldReleaseResult } from '@/lib/lms/quiz-competition';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ courseId: string; quizId: string }>; }) {
  const params = await paramsPromise;

  try {
    const access = await requireCourseAccess(params.courseId);
    const competition = await loadCompetitionConfig(access, params.quizId);
    if (!competition) return NextResponse.json({ error: 'Quiz competition not found.' }, { status: 404 });

    const state = quizWindowState(competition.quiz);
    const base = {
      quiz: {
        id: competition.quiz.id,
        title: competition.quiz.title,
        description: competition.quiz.description,
        timeLimitMins: competition.quiz.timeLimitMins,
        startTime: competition.quiz.startTime,
        endTime: competition.quiz.endTime,
      },
      competition: {
        instructions: competition.config.instructions,
        questionCount: competition.config.questionCount,
        totalMarks: competition.config.totalMarks,
        maxAttempts: competition.config.maxAttempts,
        shuffleQuestions: competition.config.shuffleQuestions,
        shuffleOptions: competition.config.shuffleOptions,
        negativeMarking: competition.config.negativeMarking,
        leaderboardEnabled: competition.config.leaderboardEnabled,
        leaderboardLive: competition.config.leaderboardLive,
        resultRelease: competition.config.resultRelease,
      },
      state,
      accessRole: access.accessRole,
      serverNow: new Date().toISOString(),
    };

    if (access.accessRole !== 'STUDENT') {
      const [attempts, completedAttempts] = await Promise.all([
        access.db.quizAttempt.count({ where: { quizId: params.quizId } }),
        access.db.quizAttempt.count({ where: { quizId: params.quizId, completedAt: { not: null } } }),
      ]);
      return NextResponse.json({
        ...base,
        faculty: { attempts, completedAttempts, resultReleased: shouldReleaseResult(competition.config, competition.quiz) },
      }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const student = await access.db.student.findUnique({ where: { userId: access.session.userId }, select: { id: true } });
    if (!student) return NextResponse.json({ error: 'Student profile is unavailable.' }, { status: 403 });
    const attempts = await access.db.quizAttempt.findMany({
      where: { quizId: params.quizId, studentId: student.id },
      orderBy: { startedAt: 'desc' },
      select: { id: true, score: true, startedAt: true, completedAt: true },
      take: Math.max(competition.config.maxAttempts, 10),
    });
    const activeAttempt = attempts.find((attempt) => !attempt.completedAt) ?? null;
    const completed = attempts.filter((attempt) => attempt.completedAt);
    const best = completed.slice().sort((a, b) => (b.score ?? Number.NEGATIVE_INFINITY) - (a.score ?? Number.NEGATIVE_INFINITY))[0] ?? null;

    return NextResponse.json({
      ...base,
      student: {
        attemptsUsed: attempts.length,
        attemptsRemaining: Math.max(0, competition.config.maxAttempts - attempts.length),
        activeAttemptId: activeAttempt?.id ?? null,
        bestAttempt: best ? { id: best.id, score: best.score, completedAt: best.completedAt } : null,
        canStart: state === 'OPEN' && Boolean(activeAttempt || attempts.length < competition.config.maxAttempts),
        resultReleased: shouldReleaseResult(competition.config, competition.quiz),
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[QUIZ_COMPETITION_OVERVIEW]', error);
    return NextResponse.json({ error: 'Unable to load quiz competition.' }, { status: 500 });
  }
}
