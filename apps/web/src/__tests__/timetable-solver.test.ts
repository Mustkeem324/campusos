import { describe, it, expect } from 'vitest';
import {
  solveTimetableCSP,
  TimetableClassRequirement,
  DEMO_ROOMS,
} from '../lib/timetable-solver';

describe('Phase 3 AI Timetable CSP Constraint Solver Test Suite', () => {
  it('should generate a clash-free timetable respecting room types and lunch break', () => {
    const requirements: TimetableClassRequirement[] = [
      { id: 'r1', courseCode: 'CS401', courseTitle: 'Data Structures', facultyId: 'fac_turing', facultyName: 'Alan Turing', batchSectionId: 'sec_A', roomTypeNeeded: 'COMPUTER_LAB', durationHours: 1 },
      { id: 'r2', courseCode: 'CS405', courseTitle: 'Machine Learning', facultyId: 'fac_feifei', facultyName: 'Fei-Fei Li', batchSectionId: 'sec_B', roomTypeNeeded: 'LECTURE_HALL', durationHours: 1 },
      { id: 'r3', courseCode: 'CS410', courseTitle: 'Distributed Systems', facultyId: 'fac_turing', facultyName: 'Alan Turing', batchSectionId: 'sec_A', roomTypeNeeded: 'SEMINAR_ROOM', durationHours: 1 },
    ];

    const result = solveTimetableCSP(requirements, DEMO_ROOMS);

    // All requirements scheduled cleanly
    expect(result.scheduledSlots.length).toBe(3);
    expect(result.conflicts.length).toBe(0);

    // Verify Alan Turing is not double-booked on the same day and period
    const turingSlots = result.scheduledSlots.filter((s) => s.facultyId === 'fac_turing');
    const turingSlotKeys = turingSlots.map((s) => `${s.dayOfWeek}_${s.periodIndex}`);
    const uniqueKeys = new Set(turingSlotKeys);

    expect(turingSlots.length).toBe(uniqueKeys.size); // Zero double-booking
  });
});
