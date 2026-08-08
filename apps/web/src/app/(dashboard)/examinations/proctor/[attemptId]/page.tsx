import { LiveProctorAttempt } from '@/components/examinations/LiveProctorAttempt';

export default async function LiveProctorAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <LiveProctorAttempt attemptId={attemptId} />;
}
