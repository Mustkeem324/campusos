import 'server-only';

export class ExamIdentityProviderError extends Error {
  status: number;
  code: 'INVALID_CAPTURE' | 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'REJECTED';

  constructor(
    message: string,
    status: number,
    code: ExamIdentityProviderError['code'],
  ) {
    super(message);
    this.name = 'ExamIdentityProviderError';
    this.status = status;
    this.code = code;
  }
}

type ProviderResponse = {
  state?: 'MATCH' | 'POSSIBLE_MATCH' | 'REVIEW_REQUIRED' | 'FAILED';
  verified?: boolean;
  confidence?: number;
  verificationId?: string;
  reason?: string;
};

function validateCapture(value: string, label: string) {
  if (!/^data:image\/(jpeg|webp);base64,/i.test(value)) {
    throw new ExamIdentityProviderError(`${label} must be a JPEG or WebP camera image.`, 400, 'INVALID_CAPTURE');
  }
  if (value.length > 2_100_000) {
    throw new ExamIdentityProviderError(`${label} is too large.`, 413, 'INVALID_CAPTURE');
  }
}

/**
 * Sends short-lived captures to an institution-configured verification provider.
 * NAVEMORA does not persist the raw captures in this path; only the provider
 * reference and confidence can be stored by the exam service.
 */
export async function verifyExamIdentity(input: {
  tenantId: string;
  userId: string;
  studentId: string;
  enrollmentNumber: string;
  idCaptureDataUrl: string;
  selfieDataUrl: string;
}) {
  validateCapture(input.idCaptureDataUrl, 'ID capture');
  validateCapture(input.selfieDataUrl, 'Selfie capture');

  const endpoint = process.env.NAVEMORA_EXAM_ID_VERIFY_URL?.trim();
  const secret = process.env.NAVEMORA_EXAM_ID_VERIFY_SECRET?.trim();
  if (!endpoint || !secret) {
    throw new ExamIdentityProviderError(
      'Exam identity verification service is not configured. A human examiner can review the student instead.',
      503,
      'NOT_CONFIGURED',
    );
  }

  if (process.env.NODE_ENV === 'production' && !endpoint.startsWith('https://')) {
    throw new ExamIdentityProviderError(
      'Exam identity verification service must use HTTPS in production.',
      503,
      'NOT_CONFIGURED',
    );
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        tenantId: input.tenantId,
        userId: input.userId,
        studentId: input.studentId,
        enrollmentNumber: input.enrollmentNumber,
        purpose: 'EXAM_IDENTITY',
        idCaptureDataUrl: input.idCaptureDataUrl,
        selfieDataUrl: input.selfieDataUrl,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(12_000),
    });
  } catch {
    throw new ExamIdentityProviderError('Exam identity verification service is unavailable.', 503, 'UNAVAILABLE');
  }

  let body: ProviderResponse = {};
  try {
    body = (await response.json()) as ProviderResponse;
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new ExamIdentityProviderError(
      body.reason || 'Exam identity verification service rejected the request.',
      502,
      'REJECTED',
    );
  }

  const state = body.state ?? (body.verified ? 'MATCH' : 'REVIEW_REQUIRED');
  const confidence = typeof body.confidence === 'number' && Number.isFinite(body.confidence)
    ? Math.max(0, Math.min(1, body.confidence))
    : null;

  if (!body.verificationId) {
    throw new ExamIdentityProviderError(
      'Exam identity provider returned an incomplete verification result.',
      502,
      'REJECTED',
    );
  }

  return {
    state,
    confidence,
    providerVerificationId: body.verificationId,
  } as const;
}
