import { SecureExamAttemptV2 } from '@/components/examinations/SecureExamAttemptV2';

export default async function SecureExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  return <SecureExamAttemptV2 attemptId={attemptId} />;
}
