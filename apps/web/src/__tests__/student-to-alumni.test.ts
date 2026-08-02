import { describe, it, expect } from 'vitest';
import { StudentRecord, convertStudentToAlumnus } from '../lib/lifecycle-service';

describe('Phase 7 Student-to-Alumnus Conversion Test Suite', () => {
  it('should transition active student to verified alumnus record upon graduation', () => {
    const student: StudentRecord = {
      id: 'stud_101',
      tenantId: 'inst_apex_univ',
      rollNumber: 'CS2026-01',
      name: 'Alex Vance',
      email: 'alex.vance@apex.edu',
      program: 'B.Tech CS',
      batchYear: 2026,
      cgpa: 3.84,
      backlogs: 0,
      status: 'ACTIVE_STUDENT',
    };

    const alumnus = convertStudentToAlumnus(student, 2026, 'Google Cloud', 'Senior SDE');

    expect(student.status).toBe('ALUMNI');
    expect(alumnus.studentId).toBe('stud_101');
    expect(alumnus.name).toBe('Alex Vance');
    expect(alumnus.companyName).toBe('Google Cloud');
    expect(alumnus.isVerified).toBe(true);
  });
});
