import { describe, expect, it } from 'vitest';

import { buildOfficialResultPdf } from './official-result-pdf';
import type { OfficialResult } from './result-publication';

function officialResult(): OfficialResult {
  return {
    id: '12345678-1234-1234-1234-123456789abc',
    institution: { name: 'Nexus Institute of Technology', code: 'NIT01', logoUrl: null },
    student: {
      name: 'Rohan Verma',
      rollNumber: 'NIT-2026-CS-001',
      programme: 'B.Tech Computer Science and Engineering',
      programmeCode: 'BT-CSE',
      batch: '2023-2027',
      section: 'A',
      department: 'Computer Science and Engineering',
    },
    examination: {
      name: 'End-Semester Examination 2026',
      type: 'END_SEMESTER',
      term: 'Semester VI',
      termNumber: 6,
      academicYear: '2025-2026',
      year: 2026,
    },
    courses: [
      {
        courseOfferingId: '22345678-1234-1234-1234-123456789abc',
        code: 'CS401',
        title: 'Advanced Data Structures',
        department: 'Computer Science and Engineering',
        departmentId: '42345678-1234-1234-1234-123456789abc',
        credits: 4,
        marksObtained: 92,
        maxMarks: 100,
        percentage: 92,
        grade: 'O',
        gradePoints: 10,
        isPass: true,
        facultyName: 'Dr. Asha Mehta',
        facultyId: '52345678-1234-1234-1234-123456789abc',
      },
      {
        courseOfferingId: '32345678-1234-1234-1234-123456789abc',
        code: 'CS405',
        title: 'Machine Learning',
        department: 'Computer Science and Engineering',
        departmentId: '42345678-1234-1234-1234-123456789abc',
        credits: 4,
        marksObtained: 87,
        maxMarks: 100,
        percentage: 87,
        grade: 'A+',
        gradePoints: 9,
        isPass: true,
        facultyName: 'Dr. Sameer Iyer',
        facultyId: '62345678-1234-1234-1234-123456789abc',
      },
    ],
    academicIndex: {
      sgpa: 9.5,
      cgpa: 8.72,
      totalCredits: 8,
      earnedCredits: 8,
      resultStatus: 'PASS',
      marksObtained: 179,
      maxMarks: 200,
      percentage: 89.5,
    },
    approvals: [
      { stage: 'FACULTY', scopeKey: '22345678-1234-1234-1234-123456789abc', label: 'CS401', approved: true, approverName: 'Dr. Asha Mehta', approverRole: 'FACULTY', approvedAt: '2026-06-15T09:00:00.000Z', comment: null },
      { stage: 'FACULTY', scopeKey: '32345678-1234-1234-123456789abc', label: 'CS405', approved: true, approverName: 'Dr. Sameer Iyer', approverRole: 'FACULTY', approvedAt: '2026-06-15T09:05:00.000Z', comment: null },
      { stage: 'HOD', scopeKey: '42345678-1234-1234-1234-123456789abc', label: 'CSE HOD', approved: true, approverName: 'Dr. Ananya Sharma', approverRole: 'HOD', approvedAt: '2026-06-16T10:00:00.000Z', comment: null },
      { stage: 'DEAN', scopeKey: 'FINAL', label: 'Dean', approved: true, approverName: 'Prof. Arvind Rao', approverRole: 'DEAN', approvedAt: '2026-06-17T11:15:00.000Z', comment: null },
    ],
    approvalSummary: { facultyApproved: 2, facultyRequired: 2, hodApproved: 1, hodRequired: 1, deanApproved: true, readyToPublish: true },
    publication: {
      published: true,
      publishedAt: '2026-06-18T14:30:00.000Z',
      publisherName: 'Dr. Kavita Menon',
      publisherRole: 'EXAMINATION_CONTROLLER',
      documentNumber: 'NIT01/COE/2026/RSLT/123456781234',
      verificationToken: 'test-token',
      verificationUrl: 'https://campus.example.edu/verify/result/12345678123412341234123456789abc.0123456789.ABCDEFGHIJKLMNOP',
      verificationFingerprint: '0123456789',
      integrity: 'VERIFIED',
    },
  };
}

describe('official result PDF', () => {
  it('emits a complete PDF containing the institution and document number', () => {
    const bytes = buildOfficialResultPdf(officialResult());
    const text = new TextDecoder().decode(bytes);
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('NEXUS INSTITUTE OF TECHNOLOGY');
    expect(text).toContain('NIT01/COE/2026/RSLT/123456781234');
    expect(text).toContain('OFFICIAL STATEMENT OF MARKS AND GRADE CARD');
    expect(text.trimEnd().endsWith('%%EOF')).toBe(true);
  });

  it('refuses an unverified publication', () => {
    const result = officialResult();
    result.publication.integrity = 'LEGACY';
    expect(() => buildOfficialResultPdf(result)).toThrow(/integrity-verified/i);
  });
});
