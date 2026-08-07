import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { approveResultPublication, ResultPublicationError } from '@/lib/result-publication';

export const dynamic = 'force-dynamic';

export async function POST(_request: Request, { params }: { params: { resultId: string } }) {
  try {
    const context = await requireActiveUserContext();
    const result = await approveResultPublication(context, params.resultId);
    return NextResponse.json(result, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error: unknown) {
    if (error instanceof ResultPublicationError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[RESULT_APPROVAL]', error);
    return NextResponse.json({ error: 'Result approval could not be completed.' }, { status: 500 });
  }
}
