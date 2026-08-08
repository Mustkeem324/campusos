import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, checkIn, checkOut, listMyAttendance } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['CHECK_IN', 'CHECK_OUT']),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const records = await listMyAttendance(context, 30);
    return NextResponse.json({ records });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load attendance records.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid attendance action.' }, { status: 400 });
    const record = parsed.data.action === 'CHECK_IN'
      ? await checkIn(context)
      : await checkOut(context);
    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update attendance.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
