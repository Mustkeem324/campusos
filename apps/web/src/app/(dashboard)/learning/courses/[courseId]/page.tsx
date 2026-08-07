import type { Metadata } from 'next';

import { CourseWorkspacePro } from '../../../../../components/lms/CourseWorkspacePro';

export const metadata: Metadata = {
  title: 'Course Workspace | CampusOS',
  description: 'Course curriculum, lessons, progress, assessments, announcements and live learning in CampusOS.',
};

export const dynamic = 'force-dynamic';

export default function CourseWorkspacePage({ params }: { params: { courseId: string } }) {
  return <CourseWorkspacePro courseId={params.courseId} />;
}
