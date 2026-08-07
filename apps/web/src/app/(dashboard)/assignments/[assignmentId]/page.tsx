import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';

import { AssignmentWorkspace } from '@/components/assignments/AssignmentWorkspace';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { loadAssignmentDetail } from '@/lib/assignment-data';

export const metadata: Metadata = {
  title: 'Assignment Workspace | CampusOS',
  description: 'Assignment instructions, resources, deadline, submission and review workspace.',
};

export const dynamic = 'force-dynamic';

export default async function AssignmentDetailPage({ params }: { params: { assignmentId: string } }) {
  try {
    const context = await requireActiveUserContext();
    const detail = await loadAssignmentDetail(context, params.assignmentId);
    return <AssignmentWorkspace detail={detail} />;
  } catch (error: unknown) {
    const code = error instanceof Error ? error.message : '';
    if (code === 'ASSIGNMENT_NOT_FOUND') notFound();
    if (code === 'ASSIGNMENT_FORBIDDEN') redirect('/assignments');
    redirect('/login');
  }
}
