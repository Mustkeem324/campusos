import { SecureExamAttemptClient } from '@/components/examinations/SecureExamAttemptClient';

export default async function SecureExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <SecureExamAttemptClient attemptId={attemptId} />;
}
