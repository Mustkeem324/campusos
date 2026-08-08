import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isWorkforceOperator } from '@/lib/workforce-policy';

import { WorkforceAdminConsole } from '../../../../components/workforce/WorkforceAdminConsole';

export const dynamic = 'force-dynamic';

export default async function WorkforceAdminPage() {
  const context = await requireActiveUserContext();
  if (!isWorkforceOperator(context)) {
    redirect('/workforce');
  }
  return <WorkforceAdminConsole />;
}
