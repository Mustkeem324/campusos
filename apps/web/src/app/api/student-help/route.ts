import { RoleType } from '@prisma/client';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
} from '@/lib/public-rate-limit';
import { answerStudentHelp, StudentHelpError, type StudentHelpHistoryMessage } from '@/lib/student-help';

export const dynamic = 'force-dynamic';

const BODY_LIMIT_BYTES = 48 * 1024;
const RATE_LIMIT = 40;
const RATE_WINDOW_MS = 10 * 60_000;

const historyMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().trim().min(1).max(3000),
});

const requestSchema = z.object({
  message: z.string().trim().min(2).max(4000),
  mode: z.enum(['AUTO', 'CAMPUS', 'STUDY', 'PRACTICE']).default('AUTO'),
  history: z.array(historyMessageSchema).max(12).default([]),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    if (context.activeRole !== RoleType.STUDENT || !context.studentProfileId) {
      return NextResponse.json({ error: 'Student Help is available to authenticated students.' }, { status: 403 });
    }

    const rateLimit = checkPublicRateLimit({
      key: `student-help:${context.tenantId}:${context.userId}`,
      limit: RATE_LIMIT,
      windowMs: RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Student Help is receiving too many requests. Please wait a moment and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const input = requestSchema.parse(await readJsonWithLimit(request, BODY_LIMIT_BYTES));
    const history: StudentHelpHistoryMessage[] = input.history.map((item) => ({
      role: item.role!,
      content: item.content!,
    }));
    const result = await answerStudentHelp(context, {
      message: input.message,
      requestedMode: input.mode,
      history,
    });

    return NextResponse.json(
      { success: true, ...result },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
          'X-RateLimit-Remaining': String(rateLimit.remaining),
        },
      },
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError || error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Enter a valid Student Help question.' }, { status: 400 });
    }
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'The Student Help request is too large.' }, { status: 413 });
    }
    if (error instanceof StudentHelpError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[STUDENT_HELP]', error);
    return NextResponse.json({ error: 'Student Help is temporarily unavailable.' }, { status: 500 });
  }
}
