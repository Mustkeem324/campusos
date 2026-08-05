import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { scanScopedStudentSuccess } from '@/lib/phase7-student-success';

export async function POST() {
  try {
    const context = await requireActiveUserContext();
    const result = await scanScopedStudentSuccess(context);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to run the student-success scan.' },
      { status: 403 },
    );
  }
}
