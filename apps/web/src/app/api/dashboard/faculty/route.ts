import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getFacultyDashboardData } from '@/lib/dashboard/faculty';
import { DashboardError } from '@/lib/dashboard/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/faculty
 *
 * Returns the role-specific FacultyDashboardData contract. The payload is
 * derived server-side from real, tenant-scoped records for the authenticated
 * faculty member only — their identity, the offerings they actually teach,
 * and real grading/attendance aggregates. Role and tenant checks happen
 * before any data is fetched.
 *
 * Status semantics:
 *   - 401 → no valid session context
 *   - 403 → authenticated but not Faculty, or faculty profile unresolved
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
    const data = await getFacultyDashboardData(context);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Unable to load faculty dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
