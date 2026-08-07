import { redirect } from 'next/navigation';

import { DashboardLayoutBuilder } from '@/components/dashboard/DashboardLayoutBuilder';
import { requireActiveUserContext } from '@/lib/active-user-context';

export const dynamic = 'force-dynamic';

function formatRole(role: string) {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default async function DashboardCustomizationPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  return <DashboardLayoutBuilder roleLabel={formatRole(context.activeRole)} />;
}
