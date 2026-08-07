import { redirect } from 'next/navigation';

import { ResultPublicationWorkspace } from '../../../components/exams/ResultPublicationWorkspace';
import { requireActiveUserContext } from '../../../lib/active-user-context';
import {
  loadResultPublicationWorkspace,
  ResultPublicationError,
} from '../../../lib/result-publication';

export const dynamic = 'force-dynamic';

export default async function ResultPublicationPage() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  try {
    const workspace = await loadResultPublicationWorkspace(context);
    return <ResultPublicationWorkspace workspace={workspace} />;
  } catch (error: unknown) {
    if (error instanceof ResultPublicationError && error.status === 403) redirect('/dashboard');
    throw error;
  }
}
