import { ExamScreenWebRtcPublisher } from '@/components/examinations/ExamScreenWebRtcPublisher';
import { PrimaryExamWebRtcPublisher } from '@/components/examinations/PrimaryExamWebRtcPublisher';
import { SecureExamAttemptClient } from '@/components/examinations/SecureExamAttemptClient';
import { SecureExamClientGate } from '@/components/examinations/SecureExamClientGate';
import { getExamRuntimePolicyForAttempt, getSecureClientGate } from '@/lib/secure-examination-runtime';

export default async function SecureExamAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const secureClient = await getSecureClientGate(attemptId);
  let mediaPolicy: { primaryStreamRequired: boolean; screenStreamRequired: boolean } = {
    primaryStreamRequired: false,
    screenStreamRequired: false,
  };
  try {
    const runtime = await getExamRuntimePolicyForAttempt(attemptId);
    mediaPolicy = {
      primaryStreamRequired: runtime.primaryStreamRequired,
      screenStreamRequired: runtime.screenStreamRequired,
    };
  } catch {
    // Backward-compatible fallback while runtime storage is being provisioned.
  }

  if (secureClient.required && !secureClient.ready) {
    return <SecureExamClientGate attemptId={attemptId} />;
  }

  return (
    <>
      {mediaPolicy.primaryStreamRequired && <PrimaryExamWebRtcPublisher attemptId={attemptId} />}
      {mediaPolicy.screenStreamRequired && <ExamScreenWebRtcPublisher attemptId={attemptId} />}
      <SecureExamAttemptClient attemptId={attemptId} />
    </>
  );
}