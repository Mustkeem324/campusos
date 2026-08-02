import { describe, it, expect } from 'vitest';
import {
  ExamStudent,
  generateAntiCheatingSeatingPlan,
} from '../lib/exam-engine';

describe('Phase 4 Anti-Cheating Seating Generator Test Suite', () => {
  it('should generate a seating plan where adjacent seats belong to different branches', () => {
    const students: ExamStudent[] = [
      { studentId: 's1', rollNumber: 'CS01', name: 'Alex', branch: 'CS', attendancePct: 90, hasFeeDues: false, cgpa: 3.8 },
      { studentId: 's2', rollNumber: 'ME01', name: 'David', branch: 'ME', attendancePct: 90, hasFeeDues: false, cgpa: 3.6 },
      { studentId: 's3', rollNumber: 'CS02', name: 'Sarah', branch: 'CS', attendancePct: 90, hasFeeDues: false, cgpa: 3.7 },
      { studentId: 's4', rollNumber: 'ME02', name: 'Michael', branch: 'ME', attendancePct: 90, hasFeeDues: false, cgpa: 3.5 },
    ];

    const plan = generateAntiCheatingSeatingPlan(students, 2, 2);

    expect(plan.length).toBe(4);

    // Verify Seat R1C1 (CS) and Seat R1C2 (ME) belong to different branches
    const seat1 = plan.find((s) => s.seatNumber === 'R1C1');
    const seat2 = plan.find((s) => s.seatNumber === 'R1C2');

    expect(seat1?.branch).not.toBe(seat2?.branch);
  });
});
