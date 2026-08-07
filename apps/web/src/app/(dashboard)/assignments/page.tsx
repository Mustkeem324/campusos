import { redirect } from 'next/navigation';

import { AssignmentsDashboard } from '@/components/assignments/AssignmentsDashboard';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { loadAssignmentDashboard } from '@/lib/assignment-data';

export const dynamic = 'force-dynamic';

export default async function AssignmentsPage() {
  try {
    const context = await requireActiveUserContext();
    const data = await loadAssignmentDashboard(context);
    return <AssignmentsDashboard data={data} />;
  } catch {
    redirect('/login');
  }
}
