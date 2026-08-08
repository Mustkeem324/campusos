import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isFinanceOperator } from '@/lib/finance-policy';

import { Finance2Workspace } from '../../../components/finance/Finance2Workspace';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const context = await requireActiveUserContext();
  if (isFinanceOperator(context)) {
    redirect('/finance/admin');
  }
  if (context.activeRole !== 'STUDENT' && context.activeRole !== 'PARENT') {
    redirect('/dashboard');
  }
  return <Finance2Workspace />;
}
