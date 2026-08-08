import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, getEmployeeSelfService } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const workspace = await getEmployeeSelfService(context);
    return NextResponse.json(workspace);
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load the workforce workspace.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
