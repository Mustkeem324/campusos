import { redirect } from 'next/navigation';

import { OperationalDashboard } from '@/components/dashboard/OperationalDashboard';
import { RoleWorkspaceDashboard } from '@/components/dashboard/RoleWorkspaceDashboard';
import { StudentDashboardError } from '@/components/dashboard/StudentDashboardStates';
import { dashboardPathForRole, requireActiveUserContext } from '@/lib/active-user-context';
import { getOperationalDashboardData } from '@/lib/dashboard/operational';
import { isOperationalDashboardRole } from '@/lib/dashboard/operational-contracts';
import { dashboardRouteForRole } from '@/lib/dashboard/registry';
import { roleWorkspaceProfileForRole } from '@/lib/dashboard/role-workspace';

/**
 * Role-aware dashboard landing.
 *
 * Roles with dedicated dashboards are redirected to their server-authorised
 * composition. Registrar, Finance Officer, Examination Controller and
 * Admissions Counsellor receive real tenant-scoped operational dashboards.
 * Remaining recognised roles receive a professional navigation workspace.
 */
export default async function DashboardPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const route = dashboardRouteForRole(context.activeRole);
  if (route !== '/dashboard') {
    redirect(dashboardPathForRole(context.activeRole));
  }

  if (isOperationalDashboardRole(context.activeRole)) {
    try {
      const data = await getOperationalDashboardData(context);
      return <OperationalDashboard data={data} />;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load your operational dashboard.';
      return <StudentDashboardError message={message} />;
    }
  }

  const profile = roleWorkspaceProfileForRole(context.activeRole);

  return (
    <RoleWorkspaceDashboard
      role={context.activeRole}
      profile={profile}
      permissionCount={context.permissions.length}
    />
  );
}
