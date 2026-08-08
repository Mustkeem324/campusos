import type { Metadata } from 'next';

import { CourseWorkspacePro } from '../../../../../components/lms/CourseWorkspacePro';

export const metadata: Metadata = {
  title: 'Course Workspace | CampusOS',
  description: 'Course curriculum, lessons, progress, assessments, announcements and live learning in CampusOS.',
};

export const dynamic = 'force-dynamic';

export default async function CourseWorkspacePage({ params: paramsPromise }: { params: Promise<{ courseId: string }>; }) {
  const params = await paramsPromise;

  return <CourseWorkspacePro courseId={params.courseId} />;
}
