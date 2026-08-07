import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AssignmentCreateForm } from '@/components/assignments/AssignmentCreateForm';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { loadAssignmentCreationCourses } from '@/lib/assignment-data';
import { isAssignmentManager } from '@/lib/assignment-workspace';

export const metadata: Metadata = {
  title: 'Create Assignment | CampusOS',
  description: 'Create a structured assignment with resources, deadline and submission policy.',
};

export const dynamic = 'force-dynamic';

export default async function NewAssignmentPage() {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) redirect('/login');
  if (!isAssignmentManager(context.activeRole)) redirect('/assignments');
  const courses = await loadAssignmentCreationCourses(context);
  return <AssignmentCreateForm courses={courses} />;
}
