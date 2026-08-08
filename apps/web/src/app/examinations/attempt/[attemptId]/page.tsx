import { SecureExamAttempt } from '@/components/examinations/SecureExamAttempt';

export default async function SecureExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <SecureExamAttempt attemptId={attemptId} />;
}
