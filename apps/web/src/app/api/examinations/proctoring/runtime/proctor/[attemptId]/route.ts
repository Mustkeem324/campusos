import { NextResponse } from 'next/server';

import { SecureExaminationError } from '@/lib/secure-examination';
import { getProctorRuntimeView } from '@/lib/secure-examination-runtime';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await params;
    const view = await getProctorRuntimeView(attemptId);
    return NextResponse.json(view, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Live proctor runtime view failed:', error);
    return NextResponse.json({ error: 'Unable to load live proctor runtime.' }, { status: 500 });
  }
}
