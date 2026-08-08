import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isResearchOperator } from '@/lib/research-policy';

import { ResearchAdminConsole } from '../../../../components/research/ResearchAdminConsole';

export const dynamic = 'force-dynamic';

export default async function ResearchAdminPage() {
  const context = await requireActiveUserContext();
  if (!isResearchOperator(context)) {
    redirect('/research');
  }
  return <ResearchAdminConsole />;
}
