import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isLibraryOperator } from '@/lib/library-policy';

import { LibraryWorkspace } from '../../../components/library/LibraryWorkspace';

export const dynamic = 'force-dynamic';

export default async function LibraryPage() {
  const context = await requireActiveUserContext();
  if (isLibraryOperator(context)) {
    redirect('/library/admin');
  }
  if (context.activeRole !== 'STUDENT' && context.activeRole !== 'FACULTY') {
    redirect('/dashboard');
  }
  return <LibraryWorkspace />;
}
