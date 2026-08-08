import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isFinanceOperator } from '@/lib/finance-policy';

import { FinanceAdminConsole } from '../../../../components/finance/FinanceAdminConsole';

export const dynamic = 'force-dynamic';

export default async function FinanceAdminPage() {
  const context = await requireActiveUserContext();
  if (!isFinanceOperator(context)) {
    redirect('/finance');
  }
  return <FinanceAdminConsole />;
}
