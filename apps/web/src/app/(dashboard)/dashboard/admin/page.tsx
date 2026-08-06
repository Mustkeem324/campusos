import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { requireActiveUserContext, dashboardPathForRole } from '@/lib/active-user-context';
import { getAdminDashboardData } from '@/lib/dashboard/admin';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { StudentDashboardError } from '@/components/dashboard/StudentDashboardStates';

export const dynamic = 'force-dynamic';

/**
 * Institution administrator dashboard — server component.
 *
 * SUPER_ADMIN is intentionally routed to the CampusOS company control plane.
 * Institution administrators remain strictly tenant-scoped here.
 */
export default async function AdminDashboardPage() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  if (context.activeRole === RoleType.SUPER_ADMIN) {
    redirect('/company-admin');
  }

  if (context.activeRole !== RoleType.INSTITUTION_ADMIN) {
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
