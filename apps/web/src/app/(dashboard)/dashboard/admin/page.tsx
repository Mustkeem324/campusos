import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { requireActiveUserContext, dashboardPathForRole } from '@/lib/active-user-context';
import { getAdminDashboardData } from '@/lib/dashboard/admin';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StudentDashboardError } from '@/components/dashboard/StudentDashboardStates';

export const dynamic = 'force-dynamic';

/**
 * Administrator dashboard — server component.
 *
 * Authorization is enforced here, on the server, before any UI renders:
 *   session → active tenant → role must be INSTITUTION_ADMIN or SUPER_ADMIN →
 *   tenant-scoped aggregates only. The client never decides access.
 */
export default async function AdminDashboardPage() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  if (context.activeRole !== RoleType.INSTITUTION_ADMIN && context.activeRole !== RoleType.SUPER_ADMIN) {
    redirect(dashboardPathForRole(context.activeRole));
  }

  try {
    const data = await getAdminDashboardData(context);
    return <AdminDashboard data={data} />;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load the administration dashboard.';
    return <StudentDashboardError message={message} />;
  }
}
