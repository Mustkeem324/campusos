import { redirect } from 'next/navigation';

import { PersonalDashboardView } from '@/components/dashboard/PersonalDashboardView';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { loadAccountSidebarOverview } from '@/lib/account-sidebar';
import { loadDashboardLayouts } from '@/lib/dashboard-layouts';

export const dynamic = 'force-dynamic';

function formatRole(role: string) {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function PersonalizedDashboardPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const [layouts, account] = await Promise.all([
    loadDashboardLayouts(context, 'main'),
    loadAccountSidebarOverview(context),
  ]);

  return (
    <PersonalDashboardView
      roleLabel={formatRole(context.activeRole)}
      activeLayout={layouts.activeLayout}
      catalog={layouts.catalog}
      account={account}
    />
  );
}
