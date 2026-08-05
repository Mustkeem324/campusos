import { redirect } from 'next/navigation';

import { RoleWorkspaceDashboard } from '@/components/dashboard/RoleWorkspaceDashboard';
import { dashboardPathForRole, requireActiveUserContext } from '@/lib/active-user-context';
import { dashboardRouteForRole } from '@/lib/dashboard/registry';
import { roleWorkspaceProfileForRole } from '@/lib/dashboard/role-workspace';

/**
 * Role-aware dashboard landing.
 *
 * Roles with dedicated dashboards are redirected to their server-authorised
 * composition. Every other recognised role receives a professional,
 * role-specific workspace instead of an empty placeholder or another role's
 * dashboard.
 */
export default async function DashboardPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const route = dashboardRouteForRole(context.activeRole);
  if (route !== '/dashboard') {
    redirect(dashboardPathForRole(context.activeRole));
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
