import { describe, it, expect } from 'vitest';
import {
  StudentRegistrationProfile,
  registerCourseOptimistic,
} from '../lib/registration-engine';

describe('Phase 2 Course Registration Rules Engine', () => {
  it('should reject enrollment when prerequisite is missing', () => {
    const student: StudentRegistrationProfile = {
      studentId: 'student_noprereq',
      tenantId: 'inst_apex_univ',
      cgpa: 3.5,
      completedCourseCodes: [], // Missing CS201 prerequisite for CS401
      enrolledOfferingIds: [],
      totalEnrolledCredits: 0,
    };

    const result = registerCourseOptimistic(student, 'offering_cs401_secA');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Prerequisite missing: CS201');
  });

  it('should reject enrollment if total credits exceed maximum allowed (26)', () => {
    const student: StudentRegistrationProfile = {
      studentId: 'student_maxcredits',
      tenantId: 'inst_apex_univ',
      cgpa: 3.8,
      completedCourseCodes: ['CS201'],
      enrolledOfferingIds: [],
      totalEnrolledCredits: 24, // Enrolling 4 credits would exceed 26
    };

    const result = registerCourseOptimistic(student, 'offering_cs401_secA', 12, 26);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Credit limit exceeded');
  });

  it('should detect timetable schedule clash against already enrolled offerings', () => {
    const student: StudentRegistrationProfile = {
      studentId: 'student_clash',
      tenantId: 'inst_apex_univ',
      cgpa: 3.8,
      completedCourseCodes: ['CS201', 'CS305'],
      enrolledOfferingIds: ['offering_cs401_secA'], // Enrolled on Day 1 at 09:00
      totalEnrolledCredits: 4,
    };

    // CS410 section is also on Day 1 at 09:00 -> Schedule clash!
    const result = registerCourseOptimistic(student, 'offering_cs410_secA');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Schedule Clash');
  });
});
