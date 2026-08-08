import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, getAdminFinanceOverview, getStudentFinanceWorkspace } from '@/lib/finance-operations';
import { isFinanceOperator } from '@/lib/finance-policy';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    if (isFinanceOperator(context)) {
      const data = await getAdminFinanceOverview(context);
      return NextResponse.json(data);
    }
    if (context.activeRole === 'STUDENT' || context.activeRole === 'PARENT') {
      const data = await getStudentFinanceWorkspace(context);
      return NextResponse.json(data);
    }
    return NextResponse.json(
      { error: 'Forbidden: the finance workspace is not available for this role.' },
      { status: 403 },
    );
  } catch (error) {
    if (error instanceof FinanceError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Unable to load the finance workspace.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
