import { NextResponse } from 'next/server';

import { poll3DEyesSignals, SecureExaminationError } from '@/lib/secure-examination';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId') ?? '';
    const after = Number(url.searchParams.get('after') ?? 0);
    const signals = await poll3DEyesSignals(sessionId, Number.isFinite(after) ? after : 0);
    return NextResponse.json({ signals }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SecureExaminationError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error('3D Eyes signal polling failed:', error);
    return NextResponse.json({ error: 'Unable to poll 3D Eyes signalling.' }, { status: 500 });
  }
}
