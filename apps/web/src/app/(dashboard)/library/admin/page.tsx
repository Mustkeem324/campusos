import { redirect } from 'next/navigation';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { isLibraryOperator } from '@/lib/library-policy';

import { LibraryAdminConsole } from '../../../../components/library/LibraryAdminConsole';

export const dynamic = 'force-dynamic';

export default async function LibraryAdminPage() {
  const context = await requireActiveUserContext();
  if (!isLibraryOperator(context)) {
    redirect('/library');
  }
  return <LibraryAdminConsole />;
}
