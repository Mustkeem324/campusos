import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { publishOfficialResult, ResultPublicationError } from '@/lib/result-publication';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params: paramsPromise }: { params: Promise<{ resultId: string }>; }) {
  const params = await paramsPromise;

  try {
    const context = await requireActiveUserContext();
    const result = await publishOfficialResult(context, params.resultId);
    return NextResponse.json({ success: true, result }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error: unknown) {
    if (error instanceof ResultPublicationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[RESULT_PUBLICATION]', error);
    return NextResponse.json({ error: 'Official result publication could not be completed.' }, { status: 500 });
  }
}
