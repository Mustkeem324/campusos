import { NextResponse } from 'next/server';
import { z } from 'zod';

import { selfAttendanceCheckOut, SmartAttendanceError } from '@/lib/smart-attendance';

const schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DAY') }),
  z.object({ kind: z.literal('CLASS'), sessionId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the checkout request.' }, { status: 400 });
    const result = parsed.data.kind === 'CLASS'
      ? await selfAttendanceCheckOut({ kind: 'CLASS', sessionId: parsed.data.sessionId })
      : await selfAttendanceCheckOut({ kind: 'DAY' });
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SmartAttendanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Attendance checkout failed:', error);
    return NextResponse.json({ error: 'Unable to complete attendance checkout.' }, { status: 500 });
  }
}
