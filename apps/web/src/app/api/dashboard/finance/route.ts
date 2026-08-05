import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getFinanceDashboardData } from '@/lib/dashboard/finance';
import { DashboardError } from '@/lib/dashboard/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/finance
 *
 * Returns the role-specific FinanceDashboardData contract for the
 * authenticated FINANCE_OFFICER or ACCOUNTANT. Every aggregate is derived
 * server-side from tenant-scoped invoice, payment, scholarship and fee
 * structure records — never from client state, and never across tenants.
 *
 * Status semantics:
 *   - 401 → no valid session context
 *   - 403 → authenticated but not a finance role
 *   - 500 → unexpected server failure
 */
export async function GET() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    const data = await getFinanceDashboardData(context);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Unable to load finance dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
