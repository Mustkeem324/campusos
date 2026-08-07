import crypto from 'crypto';

export type ResultSnapshotCourse = {
  courseOfferingId: string;
  totalMarks: number;
  marksObtained?: number;
  maxMarks?: number | null;
  grade: string;
  gradePoints: number;
  credits: number;
  isPass: boolean;
};

export type ResultSnapshot = {
  resultId: string;
  tenantId: string;
  studentId: string;
  examinationId: string;
  sgpa: number;
  cgpa: number;
  totalCredits: number;
  earnedCredits: number;
  status: string;
  courses: ResultSnapshotCourse[];
};

const RESULT_TOKEN_PREFIX = 'campusos-result-v2';
const SNAPSHOT_FINGERPRINT_LENGTH = 10;
const TOKEN_SIGNATURE_LENGTH = 16;
// Version 6-L supports 134 byte-mode payload bytes. The compact result token is
// 60 ASCII bytes and `/r/` is 3 bytes, leaving 71 bytes for the public origin.
// Keep one byte of margin so official PDFs never silently render without a QR.
const MAX_RESULT_ORIGIN_BYTES = 70;

export function canonicalResultSnapshot(snapshot: ResultSnapshot) {
  const normalized = {
    resultId: snapshot.resultId,
    tenantId: snapshot.tenantId,
    studentId: snapshot.studentId,
    examinationId: snapshot.examinationId,
    sgpa: stableNumber(snapshot.sgpa),
    cgpa: stableNumber(snapshot.cgpa),
    totalCredits: snapshot.totalCredits,
    earnedCredits: snapshot.earnedCredits,
    status: snapshot.status,
    courses: [...snapshot.courses]
      .sort((left, right) => left.courseOfferingId.localeCompare(right.courseOfferingId))
      .map((course) => ({
        courseOfferingId: course.courseOfferingId,
        totalMarks: stableNumber(course.totalMarks),
        marksObtained: stableNumber(course.marksObtained ?? course.totalMarks),
        maxMarks: course.maxMarks == null ? null : stableNumber(course.maxMarks),
        grade: course.grade,
        gradePoints: stableNumber(course.gradePoints),
        credits: course.credits,
        isPass: course.isPass,
      })),
  };
  return JSON.stringify(normalized);
}

export function resultSnapshotHash(snapshot: ResultSnapshot) {
  return crypto.createHash('sha256').update(canonicalResultSnapshot(snapshot)).digest('hex');
}

export function resultDocumentNumber(institutionCode: string, examinationYear: number, resultId: string) {
  const code = institutionCode.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 12) || 'CAMPUS';
  const serial = resultId.replace(/-/g, '').toUpperCase().slice(0, 12);
  return `${code}/COE/${examinationYear}/RSLT/${serial}`;
}

export function resultSnapshotFingerprint(snapshotHash: string) {
  if (!/^[0-9a-f]{64}$/i.test(snapshotHash)) throw new Error('Result snapshot hash is invalid.');
  return snapshotHash.slice(0, SNAPSHOT_FINGERPRINT_LENGTH).toLowerCase();
}

export function createResultVerificationToken(
  resultId: string,
  snapshotHash: string,
  secret = resultVerificationSecret(),
) {
  const compactResultId = resultId.replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(compactResultId)) throw new Error('Result identifier is invalid.');
  const fingerprint = resultSnapshotFingerprint(snapshotHash);
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${RESULT_TOKEN_PREFIX}:${compactResultId}:${fingerprint}`)
    .digest('base64url')
    .slice(0, TOKEN_SIGNATURE_LENGTH);
  return `${compactResultId}.${fingerprint}.${signature}`;
}

export function verifyResultVerificationToken(token: string, secret = resultVerificationSecret()) {
  const match = /^([0-9a-f]{32})\.([0-9a-f]{10})\.([A-Za-z0-9_-]{16})$/i.exec(token);
  if (!match) return null;

  const compactResultId = match[1].toLowerCase();
  const snapshotFingerprint = match[2].toLowerCase();
  const supplied = match[3];
  const resultId = expandUuid(compactResultId);
  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${RESULT_TOKEN_PREFIX}:${compactResultId}:${snapshotFingerprint}`)
    .digest('base64url')
    .slice(0, TOKEN_SIGNATURE_LENGTH);

  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) return null;
  return { resultId, snapshotFingerprint };
}

export function resultVerificationSecret() {
  const dedicated = process.env.RESULT_VERIFICATION_SECRET?.trim();
  if (dedicated && dedicated.length >= 32) return dedicated;
  const fallback = process.env.JWT_SECRET?.trim();
  if (fallback && fallback.length >= 32) return fallback;
  throw new Error('Result verification is not configured. Set RESULT_VERIFICATION_SECRET to at least 32 characters.');
}

export function resultPublicOrigin() {
  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim() || process.env.VERCEL_URL?.trim();
  const configured = process.env.APP_PUBLIC_URL?.trim();
  const raw = configured || (vercelHost ? `https://${vercelHost.replace(/^https?:\/\//, '')}` : '');

  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Result verification is not configured. Set APP_PUBLIC_URL or a Vercel public URL.');
    }
    return 'http://localhost:3000';
  }

  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      throw new Error('production verification origin must use HTTPS');
    }
    if (Buffer.byteLength(url.origin, 'utf8') > MAX_RESULT_ORIGIN_BYTES) {
      throw new Error(`verification origin exceeds ${MAX_RESULT_ORIGIN_BYTES} bytes`);
    }
    return url.origin;
  } catch (error: unknown) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Result verification public origin is invalid: ${raw}`, { cause: error });
    }
    return 'http://localhost:3000';
  }
}

function stableNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}

function expandUuid(compact: string) {
  return `${compact.slice(0, 8)}-${compact.slice(8, 12)}-${compact.slice(12, 16)}-${compact.slice(16, 20)}-${compact.slice(20)}`;
}
