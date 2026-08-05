import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { dashboardPathForRole } from '@/lib/active-user-context';
import { getStudentDashboardData } from '@/lib/dashboard/student';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { StudentDashboardError } from '@/components/dashboard/StudentDashboardStates';

export const dynamic = 'force-dynamic';

/**
 * Student dashboard — server component.
 *
 * Authorization is enforced here, on the server, before any UI renders:
 *   session → active tenant → role must be STUDENT → student record scoped by
 *   id + userId + tenantId. The client never decides access.
 */
export default async function StudentDashboardPage() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  if (context.activeRole !== RoleType.STUDENT) {
    redirect(dashboardPathForRole(context.activeRole));
  }

  try {
    const data = await getStudentDashboardData(context);
    return <StudentDashboard data={data} />;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load your dashboard.';
    return <StudentDashboardError message={message} />;
  }
}
