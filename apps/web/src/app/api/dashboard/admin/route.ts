import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getAdminDashboardData } from '@/lib/dashboard/admin';
import { DashboardError } from '@/lib/dashboard/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/admin
 *
 * Returns the role-specific AdminDashboardData contract. The payload is derived
 * server-side from real, tenant-scoped aggregates only — the authenticated
 * administrator's own profile is the identity; student records appear only as
 * institution-level counts.
 *
 * Status semantics:
 *   - 401 → no valid session context
 *   - 403 → authenticated but not an administrator, or profile unresolved
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
    const data = await getAdminDashboardData(context);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Unable to load admin dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
