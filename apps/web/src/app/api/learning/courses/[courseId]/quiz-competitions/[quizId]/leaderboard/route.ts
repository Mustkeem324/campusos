import { NextResponse } from 'next/server';

import { CourseAccessError, requireCourseAccess } from '@/lib/lms/course-access';
import { loadCompetitionConfig, shouldReleaseResult } from '@/lib/lms/quiz-competition';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params: paramsPromise }: { params: Promise<{ courseId: string; quizId: string }>; }) {
  const params = await paramsPromise;

  try {
    const access = await requireCourseAccess(params.courseId);
    const competition = await loadCompetitionConfig(access, params.quizId);
    if (!competition) return NextResponse.json({ error: 'Quiz competition not found.' }, { status: 404 });
    if (!competition.config.leaderboardEnabled) return NextResponse.json({ enabled: false, entries: [] });

    const resultReleased = shouldReleaseResult(competition.config, competition.quiz);
    if (access.accessRole === 'STUDENT' && !competition.config.leaderboardLive && !resultReleased) {
      return NextResponse.json({ enabled: true, visible: false, entries: [] }, { headers: { 'Cache-Control': 'no-store' } });
    }

    const attempts = await access.db.quizAttempt.findMany({
      where: { quizId: params.quizId, completedAt: { not: null } },
      orderBy: [{ score: 'desc' }, { completedAt: 'asc' }],
      select: {
        id: true,
        score: true,
        startedAt: true,
        completedAt: true,
        studentId: true,
        student: { select: { rollNumber: true, user: { select: { name: true } } } },
      },
      take: 2000,
    });

    const bestByStudent = new Map<string, typeof attempts[number]>();
    for (const attempt of attempts) {
      const current = bestByStudent.get(attempt.studentId);
      if (!current || compareAttempt(attempt, current) < 0) bestByStudent.set(attempt.studentId, attempt);
    }
    const ranked = Array.from(bestByStudent.values()).sort(compareAttempt).slice(0, 100);

    return NextResponse.json({
      enabled: true,
      visible: true,
      entries: ranked.map((attempt, index) => ({
        rank: index + 1,
        attemptId: attempt.id,
        name: attempt.student.user.name,
        rollNumber: attempt.student.rollNumber,
        score: attempt.score ?? 0,
        durationSeconds: attempt.completedAt ? Math.max(0, Math.round((attempt.completedAt.getTime() - attempt.startedAt.getTime()) / 1000)) : null,
        completedAt: attempt.completedAt,
      })),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof CourseAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[QUIZ_COMPETITION_LEADERBOARD]', error);
    return NextResponse.json({ error: 'Unable to load competition leaderboard.' }, { status: 500 });
  }
}

function compareAttempt(
  left: { score: number | null; startedAt: Date; completedAt: Date | null },
  right: { score: number | null; startedAt: Date; completedAt: Date | null },
) {
  const scoreDelta = (right.score ?? Number.NEGATIVE_INFINITY) - (left.score ?? Number.NEGATIVE_INFINITY);
  if (scoreDelta !== 0) return scoreDelta;
  const leftDuration = left.completedAt ? left.completedAt.getTime() - left.startedAt.getTime() : Number.POSITIVE_INFINITY;
  const rightDuration = right.completedAt ? right.completedAt.getTime() - right.startedAt.getTime() : Number.POSITIVE_INFINITY;
  if (leftDuration !== rightDuration) return leftDuration - rightDuration;
  return (left.completedAt?.getTime() ?? Number.POSITIVE_INFINITY) - (right.completedAt?.getTime() ?? Number.POSITIVE_INFINITY);
}
