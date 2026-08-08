import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, requestAttendanceCorrection } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const correctionSchema = z.object({
  attendanceId: z.string().uuid().optional(),
  attendanceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  proposedCheckIn: z.string().optional(),
  proposedCheckOut: z.string().optional(),
  proposedStatus: z.enum(['PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'OFFICIAL_DUTY', 'WORK_FROM_HOME']).optional(),
  reason: z.string().min(3).max(1000),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = correctionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid attendance correction payload.' }, { status: 400 });
    const correction = await requestAttendanceCorrection(context, parsed.data as Parameters<typeof requestAttendanceCorrection>[1]);
    return NextResponse.json({ correction }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to request the attendance correction.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
