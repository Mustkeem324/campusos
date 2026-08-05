import { redirect } from 'next/navigation';

import { Phase7CommandCentre } from '@/components/phase7/Phase7CommandCentre';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { canReviewPhase7Proposal } from '@/lib/phase7-approval-policy';
import { loadPhase7Overview } from '@/lib/phase7';

export const dynamic = 'force-dynamic';

export default async function Phase7Page() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');

  const overview = await loadPhase7Overview(context);
  const visibleActions = overview.actions.canApprove
    ? overview.actions.items.filter((item) =>
        canReviewPhase7Proposal(context.activeRole, item.requiredPermission),
      )
    : overview.actions.items;
  const safeOverview = {
    ...overview,
    actions: {
      ...overview.actions,
      items: visibleActions,
      proposed: visibleActions.filter((item) => item.status === 'PROPOSED').length,
      approved: visibleActions.filter((item) => item.status === 'APPROVED').length,
      rejected: visibleActions.filter((item) => item.status === 'REJECTED').length,
    },
  };

  return <Phase7CommandCentre overview={safeOverview} />;
}
