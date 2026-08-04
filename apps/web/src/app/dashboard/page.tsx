import { redirect } from 'next/navigation';
import { dashboardPathForRole, requireActiveUserContext } from '@/lib/active-user-context';

/** Generic dashboard routes only after server-side identity verification. */
export default async function DashboardPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');
  redirect(dashboardPathForRole(context.activeRole));
}
