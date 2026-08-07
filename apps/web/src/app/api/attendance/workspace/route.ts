import { NextResponse } from 'next/server';

import { getAttendanceWorkspace, SmartAttendanceError } from '@/lib/smart-attendance';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getAttendanceWorkspace();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    if (error instanceof SmartAttendanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Attendance workspace load failed:', error);
    return NextResponse.json({ error: 'Unable to load attendance workspace.' }, { status: 500 });
  }
}
