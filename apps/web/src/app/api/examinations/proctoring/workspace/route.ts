import { NextResponse } from 'next/server';

import { SecureExaminationError } from '@/lib/secure-examination';
import { getSecureExamWorkspaceForRequest } from '@/lib/secure-examination-workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const workspace = await getSecureExamWorkspaceForRequest();
    return NextResponse.json(workspace, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('Secure examination workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load secure examination workspace.' }, { status: 500 });
  }
}
