import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isResearchOperator } from '@/lib/research-policy';

import { ResearchWorkspace } from '../../../components/research/ResearchWorkspace';

export const dynamic = 'force-dynamic';

export default async function ResearchPage() {
  const context = await requireActiveUserContext();
  if (isResearchOperator(context)) {
    redirect('/research/admin');
  }
  if (context.activeRole !== 'STUDENT' && context.activeRole !== 'FACULTY') {
    redirect('/dashboard');
  }
  return <ResearchWorkspace />;
}
