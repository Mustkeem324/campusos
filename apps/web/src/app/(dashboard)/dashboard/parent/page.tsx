import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { requireActiveUserContext, dashboardPathForRole } from '@/lib/active-user-context';
import { getParentDashboardData } from '@/lib/dashboard/parent';
import { ParentDashboard } from '@/components/dashboard/ParentDashboard';
import { StudentDashboardError } from '@/components/dashboard/StudentDashboardStates';

export const dynamic = 'force-dynamic';

/**
 * Parent / Guardian dashboard — server component.
 *
 * Authorization is enforced here, on the server, before any UI renders:
 *   session → active tenant → role must be PARENT → guardian profile scoped by
 *   id + userId + tenantId → the requested studentId (when provided) must be a
 *   verified link of this guardian.
 */
export default async function ParentDashboardPage({
  searchParams: searchParamsPromise,
}: { searchParams: Promise<{ studentId?: string }>; }) {
  const searchParams = await searchParamsPromise;

  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  if (context.activeRole !== RoleType.PARENT) {
    redirect(dashboardPathForRole(context.activeRole));
  }

  try {
    const data = await getParentDashboardData(context, searchParams.studentId);
    return <ParentDashboard data={data} />;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load your dashboard.';
    return <StudentDashboardError message={message} />;
  }
}
