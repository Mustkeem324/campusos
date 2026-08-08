import { NextResponse } from 'next/server';

import { getExamAttemptSession, SecureExaminationError } from '@/lib/secure-examination';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const session = await getExamAttemptSession(attemptId);
    return NextResponse.json(session, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Secure examination attempt load failed:', error);
    return NextResponse.json({ error: 'Unable to load examination attempt.' }, { status: 500 });
  }
}
