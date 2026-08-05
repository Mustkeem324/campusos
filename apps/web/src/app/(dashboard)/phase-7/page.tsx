import { redirect } from 'next/navigation';

import { Phase7CommandCentre } from '@/components/phase7/Phase7CommandCentre';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { loadPhase7Overview } from '@/lib/phase7';

export const dynamic = 'force-dynamic';

export default async function Phase7Page() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const overview = await loadPhase7Overview(context);
  return <Phase7CommandCentre overview={overview} />;
}
