import { PrimaryExamWebRtcPublisher } from '@/components/examinations/PrimaryExamWebRtcPublisher';
import { SecureExamAttemptClient } from '@/components/examinations/SecureExamAttemptClient';
import { SecureExamClientGate } from '@/components/examinations/SecureExamClientGate';
import { getSecureClientGate } from '@/lib/secure-examination-runtime';

export default async function SecureExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const secureClient = await getSecureClientGate(attemptId);

  if (secureClient.required && !secureClient.ready) {
    return <SecureExamClientGate attemptId={attemptId} />;
  }

  return (
    <>
      <PrimaryExamWebRtcPublisher attemptId={attemptId} />
      <SecureExamAttemptClient attemptId={attemptId} />
    </>
  );
}