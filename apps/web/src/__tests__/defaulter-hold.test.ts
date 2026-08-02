import { describe, it, expect } from 'vitest';
import { checkExamEligibility, ExamStudent } from '../lib/exam-engine';

describe('Phase 5 Fee Defaulter Hold Flag Security Test Suite', () => {
  it('should enforce hold flag and block exam registration for fee defaulter', () => {
    const defaulterStudent: ExamStudent = {
      studentId: 'usr_defaulter_01',
      rollNumber: 'CS2026-99',
      name: 'John Doe',
      branch: 'CS',
      attendancePct: 90, // Excellent attendance
      hasFeeDues: true,  // PENDING FEE DUES DEFAULTER
      cgpa: 3.5,
    };

    const res = checkExamEligibility(defaulterStudent);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Pending tuition/hostel fee dues');
  });
});
