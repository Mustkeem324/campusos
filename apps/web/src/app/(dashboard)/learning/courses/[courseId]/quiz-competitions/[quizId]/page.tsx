import type { Metadata } from 'next';

import { QuizCompetitionWorkspace } from '../../../../../../../components/lms/QuizCompetitionWorkspace';

export const metadata: Metadata = {
  title: 'Quiz Competition | CampusOS',
  description: 'Secure timed quiz competition workspace with autosave, scoring and leaderboards.',
};

export const dynamic = 'force-dynamic';

export default function QuizCompetitionPage({ params }: { params: { courseId: string; quizId: string } }) {
  return <QuizCompetitionWorkspace courseId={params.courseId} quizId={params.quizId} />;
}
