import { NextResponse } from 'next/server';
import { z } from 'zod';

import { AttendanceFaceError } from '@/lib/attendance-face-verification';
import { selfAttendanceCheckIn, SmartAttendanceError } from '@/lib/smart-attendance';

const schema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('DAY'), captureDataUrl: z.string().min(100).max(2_100_000) }),
  z.object({ kind: z.literal('CLASS'), timetableSlotId: z.string().uuid(), captureDataUrl: z.string().min(100).max(2_100_000) }),
]);

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get('content-length') ?? 0);
    if (contentLength > 2_300_000) return NextResponse.json({ error: 'Face capture payload is too large.' }, { status: 413 });
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the attendance check-in request.' }, { status: 400 });
    const result = parsed.data.kind === 'CLASS'
      ? await selfAttendanceCheckIn({ kind: 'CLASS', timetableSlotId: parsed.data.timetableSlotId, captureDataUrl: parsed.data.captureDataUrl })
      : await selfAttendanceCheckIn({ kind: 'DAY', captureDataUrl: parsed.data.captureDataUrl });
    return NextResponse.json(result, { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof AttendanceFaceError || error instanceof SmartAttendanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Attendance self check-in failed:', error);
    return NextResponse.json({ error: 'Unable to complete attendance check-in.' }, { status: 500 });
  }
}
