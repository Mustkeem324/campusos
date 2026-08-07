import { describe, expect, it } from 'vitest';

import {
  canonicalResultSnapshot,
  createResultVerificationToken,
  resultDocumentNumber,
  resultSnapshotFingerprint,
  resultSnapshotHash,
  verifyResultVerificationToken,
  type ResultSnapshot,
} from './result-integrity';

const SECRET = 'test-result-verification-secret-1234567890';

function snapshot(): ResultSnapshot {
  return {
    resultId: '12345678-1234-1234-1234-123456789abc',
    tenantId: '22345678-1234-1234-1234-123456789abc',
    studentId: '32345678-1234-1234-1234-123456789abc',
    examinationId: '42345678-1234-1234-1234-123456789abc',
    sgpa: 8.75,
    cgpa: 8.61,
    totalCredits: 24,
    earnedCredits: 24,
    status: 'PASS',
    courses: [
      {
        courseOfferingId: '62345678-1234-1234-1234-123456789abc',
        totalMarks: 87,
        marksObtained: 87,
        maxMarks: 100,
        grade: 'A+',
        gradePoints: 9,
        credits: 4,
        isPass: true,
      },
      {
        courseOfferingId: '52345678-1234-1234-1234-123456789abc',
        totalMarks: 92,
        marksObtained: 92,
        maxMarks: 100,
        grade: 'O',
        gradePoints: 10,
        credits: 4,
        isPass: true,
      },
    ],
  };
}

describe('official result integrity', () => {
  it('round-trips a signed public verification token for the exact snapshot version', () => {
    const current = snapshot();
    const hash = resultSnapshotHash(current);
    const token = createResultVerificationToken(current.resultId, hash, SECRET);
    expect(verifyResultVerificationToken(token, SECRET)).toEqual({
      resultId: current.resultId,
      snapshotFingerprint: resultSnapshotFingerprint(hash),
    });
  });

  it('rejects tampered verification tokens', () => {
    const current = snapshot();
    const token = createResultVerificationToken(current.resultId, resultSnapshotHash(current), SECRET);
    const tampered = `${token.slice(0, -1)}${token.endsWith('A') ? 'B' : 'A'}`;
    expect(verifyResultVerificationToken(tampered, SECRET)).toBeNull();
  });

  it('creates a different QR token after an authorised result correction', () => {
    const original = snapshot();
    const changed: ResultSnapshot = {
      ...original,
      courses: original.courses.map((course, index) => index === 0 ? { ...course, marksObtained: 88, totalMarks: 88 } : course),
    };
    const originalToken = createResultVerificationToken(original.resultId, resultSnapshotHash(original), SECRET);
    const changedToken = createResultVerificationToken(changed.resultId, resultSnapshotHash(changed), SECRET);
    expect(changedToken).not.toBe(originalToken);
  });

  it('produces the same academic hash regardless of course row ordering', () => {
    const original = snapshot();
    const reversed: ResultSnapshot = { ...original, courses: [...original.courses].reverse() };
    expect(canonicalResultSnapshot(reversed)).toBe(canonicalResultSnapshot(original));
    expect(resultSnapshotHash(reversed)).toBe(resultSnapshotHash(original));
  });

  it('detects a changed published grade', () => {
    const original = snapshot();
    const changed: ResultSnapshot = {
      ...original,
      courses: original.courses.map((course, index) => index === 0 ? { ...course, grade: 'A', gradePoints: 8 } : course),
    };
    expect(resultSnapshotHash(changed)).not.toBe(resultSnapshotHash(original));
  });

  it('detects a change to marks or maximum marks shown on the official grade card', () => {
    const original = snapshot();
    const changedMarks: ResultSnapshot = {
      ...original,
      courses: original.courses.map((course, index) => index === 0 ? { ...course, marksObtained: 86 } : course),
    };
    const changedMaximum: ResultSnapshot = {
      ...original,
      courses: original.courses.map((course, index) => index === 0 ? { ...course, maxMarks: 90 } : course),
    };
    expect(resultSnapshotHash(changedMarks)).not.toBe(resultSnapshotHash(original));
    expect(resultSnapshotHash(changedMaximum)).not.toBe(resultSnapshotHash(original));
  });

  it('creates a deterministic university-style document number', () => {
    expect(resultDocumentNumber('NIT-01', 2026, snapshot().resultId)).toBe('NIT01/COE/2026/RSLT/123456781234');
  });
});
