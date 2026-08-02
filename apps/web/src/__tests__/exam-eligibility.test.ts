import { describe, it, expect } from 'vitest';
import { checkExamEligibility, ExamStudent } from '../lib/exam-engine';

describe('Phase 4 Exam Hall Ticket Eligibility Gatekeeper Test Suite', () => {
  it('should block exam hall ticket if student attendance is under 75%', () => {
    const student: ExamStudent = {
      studentId: 's_shortage',
      rollNumber: 'CS01',
      name: 'John',
      branch: 'CS',
      attendancePct: 68, // Under 75% cutoff
      hasFeeDues: false,
      cgpa: 3.5,
    };

    const res = checkExamEligibility(student);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Attendance is 68.0%');
  });

  it('should block exam hall ticket if student has pending fee dues', () => {
    const student: ExamStudent = {
      studentId: 's_dues',
      rollNumber: 'CS02',
      name: 'Jane',
      branch: 'CS',
      attendancePct: 90,
      hasFeeDues: true, // Pending fee dues
      cgpa: 3.8,
    };

    const res = checkExamEligibility(student);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Pending tuition/hostel fee dues');
  });

  it('should issue exam hall ticket when student meets attendance and fee criteria', () => {
    const student: ExamStudent = {
      studentId: 's_valid',
      rollNumber: 'CS03',
      name: 'Alex',
      branch: 'CS',
      attendancePct: 88,
      hasFeeDues: false,
      cgpa: 3.9,
    };

    const res = checkExamEligibility(student);
    expect(res.eligible).toBe(true);
  });
});
