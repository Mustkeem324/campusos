import crypto from 'crypto';

import { prisma } from '../db';
import type { CourseAccess } from './course-access';

export const QUIZ_COMPETITION_CONFIG_ACTION = 'QUIZ_COMPETITION_CONFIG';
export const QUIZ_COMPETITION_QUESTION_ACTION = 'QUIZ_COMPETITION_QUESTION';
export const QUIZ_COMPETITION_ANSWER_ACTION = 'QUIZ_COMPETITION_ANSWER';
export const QUIZ_COMPETITION_RESULT_ACTION = 'QUIZ_COMPETITION_RESULT';
export const QUIZ_COMPETITION_INTEGRITY_ACTION = 'QUIZ_COMPETITION_INTEGRITY';
export const MAX_COMPETITION_QUESTIONS = 1000;

export type CompetitionQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type CompetitionResultRelease = 'IMMEDIATE' | 'AFTER_END';

export type CompetitionOption = { id: string; text: string };
export type CompetitionQuestion = {
  id: string;
  prompt: string;
  type: CompetitionQuestionType;
  options: CompetitionOption[];
  correctOptionIds: string[];
  points: number;
  negativePoints: number;
  explanation?: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
  sequence: number;
};

export type CompetitionConfig = {
  version: 1;
  instructions: string;
  maxAttempts: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  negativeMarking: boolean;
  leaderboardEnabled: boolean;
  leaderboardLive: boolean;
  resultRelease: CompetitionResultRelease;
  questionCount: number;
  totalMarks: number;
  createdByUserId: string;
  createdAt: string;
};

export type CompetitionPublicQuestion = Omit<CompetitionQuestion, 'correctOptionIds' | 'explanation'>;
export type CompetitionScore = ReturnType<typeof scoreCompetition> & { submittedAt: string };

export function configEntity(quizId: string) {
  return `QUIZ_COMPETITION:${quizId}`;
}

export function questionEntity(quizId: string, questionId: string) {
  return `QUIZ_QUESTION:${quizId}:${questionId}`;
}

export function answerEntity(attemptId: string, questionId: string) {
  return `QUIZ_ANSWER:${attemptId}:${questionId}`;
}

export function answerPrefix(attemptId: string) {
  return `QUIZ_ANSWER:${attemptId}:`;
}

export function resultEntity(attemptId: string) {
  return `QUIZ_RESULT:${attemptId}`;
}

export function normalizeQuestion(input: Omit<CompetitionQuestion, 'id' | 'sequence'> & { id?: string; sequence?: number }, sequence: number): CompetitionQuestion {
  const id = input.id?.trim() || crypto.randomUUID();
  const prompt = input.prompt.trim();
  if (!prompt || prompt.length > 4000) throw new Error(`Question ${sequence + 1} must contain a prompt under 4,000 characters.`);
  if (!['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE'].includes(input.type)) throw new Error(`Question ${sequence + 1} has an unsupported type.`);
  const options = input.options.map((option) => ({ id: option.id.trim() || crypto.randomUUID(), text: option.text.trim() })).filter((option) => option.text);
  if (options.length < 2 || options.length > 8) throw new Error(`Question ${sequence + 1} must have between 2 and 8 options.`);
  const optionIds = new Set(options.map((option) => option.id));
  if (optionIds.size !== options.length) throw new Error(`Question ${sequence + 1} contains duplicate option identifiers.`);
  const correctOptionIds = Array.from(new Set(input.correctOptionIds)).filter((optionId) => optionIds.has(optionId));
  if (correctOptionIds.length === 0) throw new Error(`Question ${sequence + 1} must have at least one correct option.`);
  if (input.type !== 'MULTIPLE_CHOICE' && correctOptionIds.length !== 1) throw new Error(`Question ${sequence + 1} must have exactly one correct option.`);
  const points = Number(input.points);
  const negativePoints = Number(input.negativePoints);
  if (!Number.isFinite(points) || points <= 0 || points > 100) throw new Error(`Question ${sequence + 1} has invalid marks.`);
  if (!Number.isFinite(negativePoints) || negativePoints < 0 || negativePoints > points) throw new Error(`Question ${sequence + 1} has invalid negative marks.`);
  return {
    id,
    prompt,
    type: input.type,
    options,
    correctOptionIds,
    points,
    negativePoints,
    explanation: input.explanation?.trim().slice(0, 3000) || undefined,
    difficulty: input.difficulty,
    topic: input.topic?.trim().slice(0, 120) || undefined,
    sequence: input.sequence ?? sequence,
  };
}

export async function loadCompetitionConfig(access: CourseAccess, quizId: string) {
  const quiz = await access.db.quiz.findFirst({
    where: { id: quizId, tenantId: access.session.tenantId, courseOfferingId: access.offering.id },
    select: { id: true, title: true, description: true, timeLimitMins: true, startTime: true, endTime: true, createdAt: true, updatedAt: true },
  });
  if (!quiz) return null;
  const row = await access.db.auditLog.findFirst({
    where: { tenantId: access.session.tenantId, action: QUIZ_COMPETITION_CONFIG_ACTION, entity: configEntity(quizId) },
    orderBy: { createdAt: 'desc' },
    select: { diffJson: true },
  });
  if (!row?.diffJson) return null;
  try {
    const config = JSON.parse(row.diffJson) as CompetitionConfig;
    if (config.version !== 1 || !Number.isInteger(config.questionCount)) return null;
    return { quiz, config };
  } catch {
    return null;
  }
}

export async function loadCompetitionQuestions(access: CourseAccess, quizId: string): Promise<CompetitionQuestion[]> {
  const rows = await access.db.auditLog.findMany({
    where: { tenantId: access.session.tenantId, action: QUIZ_COMPETITION_QUESTION_ACTION, entity: { startsWith: `QUIZ_QUESTION:${quizId}:` } },
    orderBy: { createdAt: 'asc' },
    select: { diffJson: true },
  });
  return rows.flatMap((row) => {
    if (!row.diffJson) return [];
    try { return [JSON.parse(row.diffJson) as CompetitionQuestion]; } catch { return []; }
  }).sort((a, b) => a.sequence - b.sequence);
}

export function quizWindowState(quiz: { startTime: Date | null; endTime: Date | null }, now = new Date()) {
  if (quiz.startTime && now < quiz.startTime) return 'UPCOMING' as const;
  if (quiz.endTime && now > quiz.endTime) return 'CLOSED' as const;
  return 'OPEN' as const;
}

export function attemptDeadline(quiz: { timeLimitMins: number | null; endTime: Date | null }, attempt: { startedAt: Date }) {
  const timed = quiz.timeLimitMins ? new Date(attempt.startedAt.getTime() + quiz.timeLimitMins * 60_000) : null;
  if (timed && quiz.endTime) return timed < quiz.endTime ? timed : quiz.endTime;
  return timed ?? quiz.endTime ?? null;
}

function hash32(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableShuffle<T extends { id: string }>(items: T[], seed: string) {
  return [...items].sort((left, right) => hash32(`${seed}:${left.id}`) - hash32(`${seed}:${right.id}`));
}

export function publicQuestionsForAttempt(questions: CompetitionQuestion[], config: CompetitionConfig, attemptId: string): CompetitionPublicQuestion[] {
  const ordered = config.shuffleQuestions ? stableShuffle(questions, attemptId) : [...questions].sort((a, b) => a.sequence - b.sequence);
  return ordered.map((question) => ({
    id: question.id,
    prompt: question.prompt,
    type: question.type,
    options: config.shuffleOptions ? stableShuffle(question.options, `${attemptId}:${question.id}`) : question.options,
    points: question.points,
    negativePoints: config.negativeMarking ? question.negativePoints : 0,
    difficulty: question.difficulty,
    topic: question.topic,
    sequence: question.sequence,
  }));
}

export function isAnswerCorrect(question: CompetitionQuestion, selectedOptionIds: string[]) {
  const selected = [...new Set(selectedOptionIds)].sort();
  const correct = [...question.correctOptionIds].sort();
  return selected.length === correct.length && selected.every((value, index) => value === correct[index]);
}

export function scoreCompetition(questions: CompetitionQuestion[], answers: Map<string, string[]>, negativeMarking: boolean) {
  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const review = questions.map((question) => {
    const selectedOptionIds = answers.get(question.id) ?? [];
    if (selectedOptionIds.length === 0) {
      unansweredCount += 1;
      return { questionId: question.id, selectedOptionIds, isCorrect: false, awardedMarks: 0 };
    }
    const isCorrect = isAnswerCorrect(question, selectedOptionIds);
    const awardedMarks = isCorrect ? question.points : negativeMarking ? -question.negativePoints : 0;
    score += awardedMarks;
    if (isCorrect) correctCount += 1; else wrongCount += 1;
    return { questionId: question.id, selectedOptionIds, isCorrect, awardedMarks };
  });
  const totalMarks = questions.reduce((sum, question) => sum + question.points, 0);
  const percentage = totalMarks > 0 ? Math.max(0, Math.round((score / totalMarks) * 10_000) / 100) : 0;
  return { score: Math.round(score * 100) / 100, totalMarks, percentage, correctCount, wrongCount, unansweredCount, review };
}

function answersFromRows(rows: Array<{ entity: string; diffJson: string | null }>, attemptId: string) {
  const prefix = answerPrefix(attemptId);
  const answers = new Map<string, string[]>();
  rows.forEach((row) => {
    const questionId = row.entity.slice(prefix.length);
    if (!questionId || !row.diffJson) return;
    try {
      const parsed = JSON.parse(row.diffJson) as { selectedOptionIds?: unknown };
      if (Array.isArray(parsed.selectedOptionIds)) answers.set(questionId, parsed.selectedOptionIds.filter((item): item is string => typeof item === 'string'));
    } catch { /* ignore malformed stale state */ }
  });
  return answers;
}

export async function loadAttemptAnswers(access: CourseAccess, attemptId: string) {
  const rows = await access.db.auditLog.findMany({
    where: { tenantId: access.session.tenantId, userId: access.session.userId, action: QUIZ_COMPETITION_ANSWER_ACTION, entity: { startsWith: answerPrefix(attemptId) } },
    select: { entity: true, diffJson: true },
  });
  return answersFromRows(rows, attemptId);
}

export async function saveAttemptAnswer(access: CourseAccess, attemptId: string, question: CompetitionQuestion, selectedOptionIds: string[]) {
  const allowed = new Set(question.options.map((option) => option.id));
  const unique = Array.from(new Set(selectedOptionIds));
  if (unique.length !== selectedOptionIds.length || unique.some((id) => !allowed.has(id))) throw new Error('Answer contains an invalid option.');
  if (question.type !== 'MULTIPLE_CHOICE' && unique.length > 1) throw new Error('Only one option can be selected for this question.');
  const entity = answerEntity(attemptId, question.id);
  const payload = JSON.stringify({ selectedOptionIds: unique, savedAt: new Date().toISOString() });
  const existing = await access.db.auditLog.findFirst({
    where: { tenantId: access.session.tenantId, userId: access.session.userId, action: QUIZ_COMPETITION_ANSWER_ACTION, entity },
    select: { id: true },
  });
  if (existing) {
    await access.db.auditLog.update({ where: { id: existing.id }, data: { diffJson: payload } });
  } else {
    await access.db.auditLog.create({ data: { tenantId: access.session.tenantId, userId: access.session.userId, action: QUIZ_COMPETITION_ANSWER_ACTION, entity, diffJson: payload } });
  }
}

export async function finalizeCompetitionAttempt(access: CourseAccess, quizId: string, attemptId: string): Promise<CompetitionScore | null> {
  const competition = await loadCompetitionConfig(access, quizId);
  if (!competition) throw new Error('Quiz competition configuration is unavailable.');
  const questions = await loadCompetitionQuestions(access, quizId);
  const student = await access.db.student.findUnique({ where: { userId: access.session.userId }, select: { id: true } });
  if (!student) throw new Error('Student profile is unavailable.');

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "quiz_attempts" WHERE "id" = ${attemptId}::uuid FOR UPDATE`;
    const attempt = await tx.quizAttempt.findFirst({
      where: { id: attemptId, quizId, studentId: student.id, quiz: { tenantId: access.session.tenantId, courseOfferingId: access.offering.id } },
      select: { id: true, completedAt: true },
    });
    if (!attempt) throw new Error('Attempt not found.');

    const existingResult = await tx.auditLog.findFirst({
      where: {
        tenantId: access.session.tenantId,
        userId: access.session.userId,
        action: QUIZ_COMPETITION_RESULT_ACTION,
        entity: resultEntity(attemptId),
      },
      orderBy: { createdAt: 'asc' },
      select: { diffJson: true },
    });
    if (attempt.completedAt) return parseStoredResult(existingResult?.diffJson ?? null);
    if (existingResult?.diffJson) return parseStoredResult(existingResult.diffJson);

    const answerRows = await tx.auditLog.findMany({
      where: {
        tenantId: access.session.tenantId,
        userId: access.session.userId,
        action: QUIZ_COMPETITION_ANSWER_ACTION,
        entity: { startsWith: answerPrefix(attemptId) },
      },
      select: { entity: true, diffJson: true },
    });
    const answers = answersFromRows(answerRows, attemptId);
    const scored = scoreCompetition(questions, answers, competition.config.negativeMarking);
    const submittedAt = new Date();
    const result: CompetitionScore = { ...scored, submittedAt: submittedAt.toISOString() };

    await tx.quizAttempt.update({ where: { id: attemptId }, data: { score: scored.score, completedAt: submittedAt } });
    await tx.auditLog.create({
      data: {
        tenantId: access.session.tenantId,
        userId: access.session.userId,
        action: QUIZ_COMPETITION_RESULT_ACTION,
        entity: resultEntity(attemptId),
        diffJson: JSON.stringify(result),
      },
    });
    return result;
  });
}

function parseStoredResult(diffJson: string | null): CompetitionScore | null {
  if (!diffJson) return null;
  try { return JSON.parse(diffJson) as CompetitionScore; } catch { return null; }
}

export function shouldReleaseResult(config: CompetitionConfig, quiz: { endTime: Date | null }, now = new Date()) {
  return config.resultRelease === 'IMMEDIATE' || Boolean(quiz.endTime && now >= quiz.endTime);
}

export async function recordIntegrityEvent(access: CourseAccess, attemptId: string, eventType: string) {
  await access.db.auditLog.create({
    data: {
      tenantId: access.session.tenantId,
      userId: access.session.userId,
      action: QUIZ_COMPETITION_INTEGRITY_ACTION,
      entity: `QUIZ_INTEGRITY:${attemptId}:${crypto.randomUUID()}`,
      diffJson: JSON.stringify({ eventType, at: new Date().toISOString() }),
    },
  });
}
