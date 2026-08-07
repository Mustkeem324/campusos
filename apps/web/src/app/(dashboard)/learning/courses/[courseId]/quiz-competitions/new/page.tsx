import type { Metadata } from 'next';

import { QuizCompetitionStudio } from '../../../../../../../components/lms/QuizCompetitionStudio';

export const metadata: Metadata = {
  title: 'Create Quiz Competition | CampusOS',
  description: 'Create advanced timed quiz competitions with large question banks, scoring rules and leaderboards.',
};

export const dynamic = 'force-dynamic';

export default function NewQuizCompetitionPage({ params }: { params: { courseId: string } }) {
  return <QuizCompetitionStudio courseId={params.courseId} />;
}
