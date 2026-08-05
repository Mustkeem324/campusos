import { redirect } from 'next/navigation';

import { OperationalDashboard } from '@/components/dashboard/OperationalDashboard';
import { Phase4Dashboard } from '@/components/dashboard/Phase4Dashboard';
import { Phase5Dashboard } from '@/components/dashboard/Phase5Dashboard';
import { RoleWorkspaceDashboard } from '@/components/dashboard/RoleWorkspaceDashboard';
import { StudentDashboardError } from '@/components/dashboard/StudentDashboardStates';
import { dashboardPathForRole, requireActiveUserContext } from '@/lib/active-user-context';
import { getOperationalDashboardData } from '@/lib/dashboard/operational';
import { isOperationalDashboardRole } from '@/lib/dashboard/operational-contracts';
import { getPhase4DashboardData } from '@/lib/dashboard/phase4';
import { isPhase4DashboardRole } from '@/lib/dashboard/phase4-contracts';
import { getPhase5DashboardData } from '@/lib/dashboard/phase5';
import { isPhase5DashboardRole } from '@/lib/dashboard/phase5-contracts';
import { dashboardRouteForRole } from '@/lib/dashboard/registry';
import { roleWorkspaceProfileForRole } from '@/lib/dashboard/role-workspace';

/**
 * Role-aware dashboard landing.
 *
 * Dedicated Student, Faculty, Parent and Administrator dashboards keep their
 * existing server-authorised routes. Phase 4 handles Finance Officer,
 * Accountant and Librarian. Phase 5 adds deeper command centres for Dean, HOD,
 * HR Admin, Warden, Transport Manager and Placement Officer. Remaining
 * operational roles continue through the reviewed Phase 3 composition.
 */
export default async function DashboardPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const route = dashboardRouteForRole(context.activeRole);
  if (route !== '/dashboard') {
    redirect(dashboardPathForRole(context.activeRole));
  }

  if (isPhase5DashboardRole(context.activeRole)) {
    try {
      const data = await getPhase5DashboardData(context);
      return <Phase5Dashboard data={data} />;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load your Phase 5 dashboard.';
      return <StudentDashboardError message={message} />;
    }
  }

  if (isPhase4DashboardRole(context.activeRole)) {
    try {
      const data = await getPhase4DashboardData(context);
      return <Phase4Dashboard data={data} />;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to load your Phase 4 dashboard.';
      return <StudentDashboardError message={message} />;
    }
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
