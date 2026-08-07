import 'server-only';

import { prisma } from './db';

export class AttendanceFaceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AttendanceFaceError';
    this.status = status;
  }
}

type VerificationResponse = {
  verified?: boolean;
  confidence?: number;
  verificationId?: string;
  reason?: string;
};

function validateCapture(captureDataUrl: string) {
  if (!/^data:image\/(jpeg|webp);base64,/i.test(captureDataUrl)) {
    throw new AttendanceFaceError('Capture must be a JPEG or WebP camera image.', 400);
  }
  if (captureDataUrl.length > 2_100_000) {
    throw new AttendanceFaceError('Face capture is too large.', 413);
  }
}

export async function verifyAttendanceFace(input: {
  tenantId: string;
  userId: string;
  studentId: string;
  purpose: 'CLASS_CHECKIN' | 'DAY_CHECKIN';
  captureDataUrl: string;
}) {
  validateCapture(input.captureDataUrl);

  const [consent, enrollment] = await Promise.all([
    prisma.biometricConsent.findFirst({
      where: { tenantId: input.tenantId, userId: input.userId, consentGiven: true },
      select: { id: true },
    }),
    prisma.biometricEnrollment.findFirst({
      where: { tenantId: input.tenantId, userId: input.userId },
      select: { id: true },
    }),
  ]);

  if (!consent) throw new AttendanceFaceError('Biometric consent is required before Face ID attendance.', 403);
  if (!enrollment) throw new AttendanceFaceError('Face ID enrollment is required before self attendance.', 403);

  const endpoint = process.env.NAVEMORA_FACE_VERIFY_URL?.trim();
  const secret = process.env.NAVEMORA_FACE_VERIFY_SECRET?.trim();
  if (!endpoint || !secret) {
    throw new AttendanceFaceError('Face verification service is not configured for this deployment.', 503);
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
        enrollmentId: enrollment.id,
        purpose: input.purpose,
        captureDataUrl: input.captureDataUrl,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new AttendanceFaceError('Face verification service is unavailable.', 503);
  }

  let body: VerificationResponse = {};
  try {
    body = (await response.json()) as VerificationResponse;
  } catch {
    body = {};
  }

  if (!response.ok) {
    throw new AttendanceFaceError(body.reason || 'Face verification service rejected the request.', 502);
  }
  if (!body.verified || !body.verificationId) {
    throw new AttendanceFaceError(body.reason || 'Face could not be verified.', 401);
  }

  const confidence = typeof body.confidence === 'number' && Number.isFinite(body.confidence)
    ? Math.max(0, Math.min(1, body.confidence))
    : null;

  // The image is intentionally never persisted. Only the provider audit ID and
  // confidence score are returned to the attendance service for an audit record.
  return {
    providerVerificationId: body.verificationId,
    confidence,
    enrollmentId: enrollment.id,
  };
}
