import { NextResponse } from 'next/server';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getStudentDashboardData } from '@/lib/dashboard/student';

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/student
 *
 * Returns the role-specific StudentDashboardData contract. The payload is
 * derived server-side from real, tenant-scoped records for the authenticated
 * student only. Role and tenant checks happen before any data is fetched.
 */
export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const data = await getStudentDashboardData(context);
    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load student dashboard';
    const status = message.startsWith('Unauthorized') ? 403 : message.startsWith('Your') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
