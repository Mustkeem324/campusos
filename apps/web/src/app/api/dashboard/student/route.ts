import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getStudentDashboardData } from '@/lib/dashboard/student';
import { DashboardError } from '@/lib/dashboard/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/student
 *
 * Returns the role-specific StudentDashboardData contract. The payload is
 * derived server-side from real, tenant-scoped records for the authenticated
 * student only. Role and tenant checks happen before any data is fetched.
 *
 * Status semantics:
 *   - 401 → no valid session context
 *   - 403 → authenticated but not a Student, or student profile unresolved
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
    const data = await getStudentDashboardData(context);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Unable to load student dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
