import type { Metadata } from 'next';

import { QuizCompetitionStudio } from '../../../../../../../components/lms/QuizCompetitionStudio';

export const metadata: Metadata = {
  title: 'Create Quiz Competition | CampusOS',
  description: 'Create advanced timed quiz competitions with large question banks, scoring rules and leaderboards.',
};

export const dynamic = 'force-dynamic';

export default async function NewQuizCompetitionPage({ params: paramsPromise }: { params: Promise<{ courseId: string }>; }) {
  const params = await paramsPromise;

  return <QuizCompetitionStudio courseId={params.courseId} />;
}
