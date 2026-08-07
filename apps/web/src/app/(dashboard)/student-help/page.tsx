import { RoleType } from '@prisma/client';
import { redirect } from 'next/navigation';

import { StudentHelpAssistant } from '../../../components/student/StudentHelpAssistant';
import { requireActiveUserContext } from '../../../lib/active-user-context';

export const dynamic = 'force-dynamic';

export default async function StudentHelpPage() {
  let context;
  try {
    context = await requireActiveUserContext();
  } catch {
    redirect('/login');
  }

  if (context.activeRole !== RoleType.STUDENT || !context.studentProfileId) {
    redirect('/dashboard');
  }

  return <StudentHelpAssistant />;
}
