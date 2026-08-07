import { NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db';
import { CourseAccessError, requireCourseAccess } from '@/lib/lms/course-access';
import {
  attemptDeadline,
  finalizeCompetitionAttempt,
  loadAttemptAnswers,
  loadCompetitionConfig,
  loadCompetitionQuestions,
  publicQuestionsForAttempt,
  recordIntegrityEvent,
  saveAttemptAnswer,
  shouldReleaseResult,
} from '@/lib/lms/quiz-competition';

export const dynamic = 'force-dynamic';

const answerSchema = z.object({ questionId: z.string().min(1).max(80), selectedOptionIds: z.array(z.string().min(1).max(80)).max(8) });
const actionSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('submit') }),
  z.object({ action: z.literal('integrity'), eventType: z.enum(['TAB_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'COPY_ATTEMPT', 'PASTE_ATTEMPT']) }),
]);

async function resolveAttempt(courseId: string, quizId: string, attemptId: string) {
  const access = await requireCourseAccess(courseId);
  if (access.accessRole !== 'STUDENT') throw new Error('STUDENT_ONLY');
  const competition = await loadCompetitionConfig(access, quizId);
  if (!competition) throw new Error('QUIZ_NOT_FOUND');
  const student = await access.db.student.findUnique({ where: { userId: access.session.userId }, select: { id: true } });
  if (!student) throw new Error('STUDENT_PROFILE');
  const attempt = await prisma.quizAttempt.findFirst({
    where: { id: attemptId, quizId, studentId: student.id, quiz: { tenantId: access.session.tenantId, courseOfferingId: access.offering.id } },
    select: { id: true, score: true, startedAt: true, completedAt: true },
  });
  if (!attempt) throw new Error('ATTEMPT_NOT_FOUND');
  return { access, competition, attempt };
}

export async function GET(_request: Request, { params }: { params: { courseId: string; quizId: string; attemptId: string } }) {
  try {
    const { access, competition, attempt } = await resolveAttempt(params.courseId, params.quizId, params.attemptId);
    const deadline = attemptDeadline(competition.quiz, attempt);
    let completedAt = attempt.completedAt;
    let result: Awaited<ReturnType<typeof finalizeCompetitionAttempt>> = null;
    if (!completedAt && deadline && new Date() >= deadline) {
      result = await finalizeCompetitionAttempt(access, params.quizId, params.attemptId);
      completedAt = result?.submittedAt ? new Date(result.submittedAt) : new Date();
    }

    const questions = await loadCompetitionQuestions(access, params.quizId);
    const answers = await loadAttemptAnswers(access, params.attemptId);
    const released = shouldReleaseResult(competition.config, competition.quiz);

    if (completedAt && !result) {
      result = await finalizeCompetitionAttempt(access, params.quizId, params.attemptId);
    }

    return NextResponse.json({
      attempt: { id: attempt.id, startedAt: attempt.startedAt, completedAt, deadline },
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
        negativeMarking: competition.config.negativeMarking,
        leaderboardEnabled: competition.config.leaderboardEnabled,
      },
      questions: publicQuestionsForAttempt(questions, competition.config, attempt.id),
      answers: Object.fromEntries(answers),
      result: completedAt && result ? {
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        unansweredCount: result.unansweredCount,
        submittedAt: result.submittedAt,
        released,
        review: released ? questions.map((question) => ({
          questionId: question.id,
          correctOptionIds: question.correctOptionIds,
          explanation: question.explanation ?? null,
        })) : null,
      } : null,
      serverNow: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    return attemptError(error, 'Unable to load competition attempt.');
  }
}

export async function PATCH(request: Request, { params }: { params: { courseId: string; quizId: string; attemptId: string } }) {
  try {
    const input = answerSchema.parse(await request.json());
    const { access, competition, attempt } = await resolveAttempt(params.courseId, params.quizId, params.attemptId);
    if (attempt.completedAt) return NextResponse.json({ error: 'This attempt has already been submitted.' }, { status: 409 });
    const deadline = attemptDeadline(competition.quiz, attempt);
    if (deadline && new Date() >= deadline) {
      await finalizeCompetitionAttempt(access, params.quizId, params.attemptId);
      return NextResponse.json({ error: 'Time expired. Your saved answers have been submitted automatically.', expired: true }, { status: 409 });
    }
    const questions = await loadCompetitionQuestions(access, params.quizId);
    const question = questions.find((item) => item.id === input.questionId);
    if (!question) return NextResponse.json({ error: 'Question is not part of this competition.' }, { status: 404 });
    await saveAttemptAnswer(access, params.attemptId, question, input.selectedOptionIds);
    return NextResponse.json({ saved: true, savedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Answer data is invalid.' }, { status: 400 });
    return attemptError(error, 'Unable to save answer.');
  }
}

export async function POST(request: Request, { params }: { params: { courseId: string; quizId: string; attemptId: string } }) {
  try {
    const input = actionSchema.parse(await request.json());
    const { access, competition, attempt } = await resolveAttempt(params.courseId, params.quizId, params.attemptId);
    if (input.action === 'integrity') {
      if (!attempt.completedAt) await recordIntegrityEvent(access, params.attemptId, input.eventType);
      return NextResponse.json({ recorded: true });
    }
    const result = await finalizeCompetitionAttempt(access, params.quizId, params.attemptId);
    if (!result) return NextResponse.json({ error: 'Unable to calculate the competition result.' }, { status: 500 });
    const released = shouldReleaseResult(competition.config, competition.quiz);
    return NextResponse.json({
      submitted: true,
      result: {
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        unansweredCount: result.unansweredCount,
        submittedAt: result.submittedAt,
        released,
      },
    }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Competition action is invalid.' }, { status: 400 });
    return attemptError(error, 'Unable to complete competition action.');
  }
}

function attemptError(error: unknown, fallback: string) {
  if (error instanceof CourseAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
  if (error instanceof Error) {
    if (error.message === 'STUDENT_ONLY') return NextResponse.json({ error: 'This attempt belongs to the student competition experience.' }, { status: 403 });
    if (error.message === 'QUIZ_NOT_FOUND') return NextResponse.json({ error: 'Quiz competition not found.' }, { status: 404 });
    if (error.message === 'STUDENT_PROFILE') return NextResponse.json({ error: 'Student profile is unavailable.' }, { status: 403 });
    if (error.message === 'ATTEMPT_NOT_FOUND') return NextResponse.json({ error: 'Competition attempt not found.' }, { status: 404 });
    if (error.message === 'This competition attempt no longer accepts answers.') return NextResponse.json({ error: error.message }, { status: 409 });
    if (error.message.includes('invalid option') || error.message.includes('Only one option')) return NextResponse.json({ error: error.message }, { status: 400 });
  }
  console.error('[QUIZ_COMPETITION_ATTEMPT]', error);
  return NextResponse.json({ error: fallback }, { status: 500 });
}
