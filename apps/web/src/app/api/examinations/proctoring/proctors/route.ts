import { NextResponse } from 'next/server';

import { listAssignableProctors, SecureExaminationError } from '@/lib/secure-examination';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const proctors = await listAssignableProctors();
    return NextResponse.json({ proctors }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Assignable proctors load failed:', error);
    return NextResponse.json({ error: 'Unable to load proctors.' }, { status: 500 });
  }
}
