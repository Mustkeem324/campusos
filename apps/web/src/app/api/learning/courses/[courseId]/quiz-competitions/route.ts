import crypto from 'crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { CourseAccessError, requireCourseAccess } from '@/lib/lms/course-access';
import {
  MAX_COMPETITION_QUESTIONS,
  QUIZ_COMPETITION_CONFIG_ACTION,
  QUIZ_COMPETITION_QUESTION_ACTION,
  configEntity,
  normalizeQuestion,
  questionEntity,
  type CompetitionConfig,
  type CompetitionQuestion,
} from '@/lib/lms/quiz-competition';

export const dynamic = 'force-dynamic';

const optionSchema = z.object({ id: z.string().min(1).max(80), text: z.string().min(1).max(1000) });
const questionSchema = z.object({
  id: z.string().min(1).max(80).optional(),
  prompt: z.string().min(1).max(4000),
  type: z.enum(['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE']),
  options: z.array(optionSchema).min(2).max(8),
  correctOptionIds: z.array(z.string().min(1).max(80)).min(1).max(8),
  points: z.number().positive().max(100),
  negativePoints: z.number().min(0).max(100).default(0),
  explanation: z.string().max(3000).optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).default('MEDIUM'),
  topic: z.string().max(120).optional(),
});

const createSchema = z.object({
  title: z.string().min(3).max(160),
  description: z.string().max(3000).optional(),
  instructions: z.string().max(5000).default(''),
  timeLimitMins: z.number().int().min(1).max(720),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  maxAttempts: z.number().int().min(1).max(10).default(1),
  shuffleQuestions: z.boolean().default(true),
  shuffleOptions: z.boolean().default(true),
  negativeMarking: z.boolean().default(false),
  leaderboardEnabled: z.boolean().default(true),
  leaderboardLive: z.boolean().default(false),
  resultRelease: z.enum(['IMMEDIATE', 'AFTER_END']).default('AFTER_END'),
  questions: z.array(questionSchema).min(1).max(MAX_COMPETITION_QUESTIONS),
});

type NormalizableQuestion = Omit<CompetitionQuestion, 'id' | 'sequence'> & { id?: string; sequence?: number };

export async function POST(request: Request, { params: paramsPromise }: { params: Promise<{ courseId: string }>; }) {
  const params = await paramsPromise;

  let createdQuizId: string | null = null;
  try {
    const access = await requireCourseAccess(params.courseId);
    if (access.accessRole === 'STUDENT') {
      return NextResponse.json({ error: 'Only authorised teaching staff can publish quiz competitions.' }, { status: 403 });
    }

    const input = createSchema.parse(await request.json());
    const startTime = input.startTime ? new Date(input.startTime) : null;
    const endTime = input.endTime ? new Date(input.endTime) : null;
    if (startTime && endTime && endTime <= startTime) {
      return NextResponse.json({ error: 'Competition end time must be after the start time.' }, { status: 400 });
    }
    if (input.resultRelease === 'AFTER_END' && !endTime) {
      return NextResponse.json({ error: 'An end time is required when results are released after the competition closes.' }, { status: 400 });
    }

    const questions = input.questions.map((question, index) => {
      // Zod has already performed the runtime validation. The explicit output
      // cast keeps this hand-off stable under the repository's non-strict root
      // TypeScript config, where Zod object outputs may otherwise appear optional.
      const validated = question as NormalizableQuestion;
      return normalizeQuestion({
        ...validated,
        id: validated.id ?? crypto.randomUUID(),
        negativePoints: input.negativeMarking ? validated.negativePoints : 0,
      }, index);
    });
    const totalMarks = questions.reduce((sum, question) => sum + question.points, 0);

    const quiz = await access.db.quiz.create({
      data: {
        tenantId: access.session.tenantId,
        courseOfferingId: access.offering.id,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        timeLimitMins: input.timeLimitMins,
        startTime,
        endTime,
      },
      select: { id: true },
    });
    createdQuizId = quiz.id;

    const config: CompetitionConfig = {
      version: 1,
      instructions: input.instructions.trim(),
      maxAttempts: input.maxAttempts,
      shuffleQuestions: input.shuffleQuestions,
      shuffleOptions: input.shuffleOptions,
      negativeMarking: input.negativeMarking,
      leaderboardEnabled: input.leaderboardEnabled,
      leaderboardLive: input.leaderboardLive,
      resultRelease: input.resultRelease,
      questionCount: questions.length,
      totalMarks,
      createdByUserId: access.session.userId,
      createdAt: new Date().toISOString(),
    };

    await access.db.auditLog.create({
      data: {
        tenantId: access.session.tenantId,
        userId: access.session.userId,
        action: QUIZ_COMPETITION_CONFIG_ACTION,
        entity: configEntity(quiz.id),
        diffJson: JSON.stringify(config),
      },
    });
    await access.db.auditLog.createMany({
      data: questions.map((question) => ({
        tenantId: access.session.tenantId,
        userId: access.session.userId,
        action: QUIZ_COMPETITION_QUESTION_ACTION,
        entity: questionEntity(quiz.id, question.id),
        diffJson: JSON.stringify(question),
      })),
    });

    const enrollments = await access.db.enrollment.findMany({
      where: { tenantId: access.session.tenantId, courseOfferingId: access.offering.id },
      select: { student: { select: { userId: true } } },
    });
    if (enrollments.length) {
      await access.db.notification.createMany({
        data: enrollments.map((enrollment) => ({
          tenantId: access.session.tenantId,
          userId: enrollment.student.userId,
          title: `Quiz competition: ${input.title.trim()}`,
          body: `${questions.length} questions · ${input.timeLimitMins} minutes${startTime ? ` · opens ${startTime.toLocaleString('en-IN')}` : ''}`,
          type: 'QUIZ_COMPETITION',
          actionUrl: `/learning/courses/${params.courseId}/quiz-competitions/${quiz.id}`,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      questionCount: questions.length,
      totalMarks,
      url: `/learning/courses/${params.courseId}/quiz-competitions/${quiz.id}`,
    }, { status: 201 });
  } catch (error: unknown) {
    if (createdQuizId) {
      try {
        const access = await requireCourseAccess(params.courseId);
        await access.db.auditLog.deleteMany({ where: { tenantId: access.session.tenantId, entity: { contains: createdQuizId } } });
        await access.db.quiz.deleteMany({ where: { id: createdQuizId, tenantId: access.session.tenantId, courseOfferingId: access.offering.id } });
      } catch { /* best-effort rollback */ }
    }
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Competition data is invalid.', details: error.errors }, { status: 400 });
    if (error instanceof CourseAccessError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('[QUIZ_COMPETITION_CREATE]', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create quiz competition.' }, { status: 500 });
  }
}
