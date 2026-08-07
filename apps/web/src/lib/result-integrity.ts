import crypto from 'crypto';

export type ResultSnapshotCourse = {
  courseOfferingId: string;
  totalMarks: number;
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

const RESULT_TOKEN_PREFIX = 'campusos-result-v1';

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

export function createResultVerificationToken(resultId: string, secret = resultVerificationSecret()) {
  const signature = crypto
    .createHmac('sha256', secret)
    .update(`${RESULT_TOKEN_PREFIX}:${resultId}`)
    .digest('base64url')
    .slice(0, 27);
  return `${resultId}.${signature}`;
}

export function verifyResultVerificationToken(token: string, secret = resultVerificationSecret()) {
  const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\.([A-Za-z0-9_-]{20,40})$/i.exec(token);
  if (!match) return null;
  const resultId = match[1];
  const supplied = match[2];
  const expected = createResultVerificationToken(resultId, secret).split('.')[1];
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length) return null;
  return crypto.timingSafeEqual(suppliedBuffer, expectedBuffer) ? resultId : null;
}

export function resultVerificationSecret() {
  const dedicated = process.env.RESULT_VERIFICATION_SECRET?.trim();
  if (dedicated && dedicated.length >= 32) return dedicated;
  const fallback = process.env.JWT_SECRET?.trim();
  if (fallback && fallback.length >= 32) return fallback;
  throw new Error('Result verification is not configured. Set RESULT_VERIFICATION_SECRET to at least 32 characters.');
}

export function resultPublicOrigin() {
  const raw = process.env.APP_PUBLIC_URL?.trim() || 'http://localhost:3000';
  try {
    const url = new URL(raw);
    if (!['http:', 'https:'].includes(url.protocol)) throw new Error('unsupported protocol');
    return url.origin;
  } catch {
    return 'http://localhost:3000';
  }
}

function stableNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(4)) : 0;
}
