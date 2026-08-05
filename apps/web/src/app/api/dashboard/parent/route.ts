import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getParentDashboardData } from '@/lib/dashboard/parent';
import { DashboardError } from '@/lib/dashboard/errors';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/parent?studentId=<linked-student-id>
 *
 * Returns the role-specific ParentDashboardData contract. Identity always
 * represents the authenticated guardian; the requested student must be a
 * verified, active, same-tenant link of this guardian.
 *
 * Status semantics:
 *   - 401 → no valid session context
 *   - 403 → not a parent role, guardian profile unresolved, no verified link,
 *           or the requested student is not linked to this guardian
 *   - 500 → unexpected server failure
 */
export async function GET(request: Request) {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  let requestedStudentId: string | undefined;
  try {
    const url = new URL(request.url);
    const param = url.searchParams.get('studentId');
    if (param) requestedStudentId = param;
  } catch {
    // Malformed URL — fall through with no requested student (defaults to first link).
  }

  try {
    const data = await getParentDashboardData(context, requestedStudentId);
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof DashboardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : 'Unable to load parent dashboard';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
