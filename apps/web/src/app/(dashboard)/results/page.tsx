import { redirect } from 'next/navigation';

import { GradeCardMarksheet } from '../../../components/exams/GradeCardMarksheet';
import { requireActiveUserContext } from '../../../lib/active-user-context';
import {
  loadLatestOfficialResultForViewer,
  RESULT_APPROVAL_ROLES,
  RESULT_PUBLICATION_ROLES,
  ResultPublicationError,
} from '../../../lib/result-publication';

export const dynamic = 'force-dynamic';

export default async function ResultsPage() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  if ([...RESULT_APPROVAL_ROLES, ...RESULT_PUBLICATION_ROLES].includes(context.activeRole)) {
    redirect('/result-publication');
  }

  try {
    const result = await loadLatestOfficialResultForViewer(context);
    return <GradeCardMarksheet result={result} />;
  } catch (error: unknown) {
    if (error instanceof ResultPublicationError && error.status === 403) redirect('/dashboard');
    throw error;
  }
}
