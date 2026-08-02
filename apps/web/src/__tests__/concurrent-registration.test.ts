import { describe, it, expect } from 'vitest';
import {
  OFFERING_SEATS,
  StudentRegistrationProfile,
  registerCourseOptimistic,
} from '../lib/registration-engine';

describe('Phase 2 Concurrent Registration Engine Load Test', () => {
  it('should guarantee ZERO overbooking during 1,000 simulated concurrent registration attempts', async () => {
    // Reset test offering seat capacity
    const testOfferingId = 'offering_loadtest_sec1';
    OFFERING_SEATS[testOfferingId] = {
      offeringId: testOfferingId,
      courseCode: 'CS999',
      title: 'High Concurrency Load Test',
      capacity: 50, // STRICT MAX CAPACITY LIMIT = 50 SEATS
      enrolledCount: 0,
      version: 1,
      timeSlot: { dayOfWeek: 5, startTime: '14:00', endTime: '15:30' },
      prerequisites: [],
      credits: 3,
    };

    const CONCURRENT_REQUESTS = 1000;
    const registrationPromises: Promise<ReturnType<typeof registerCourseOptimistic>>[] = [];

    // Simulate 1,000 students hitting the registration API concurrently at the exact same millisecond
    for (let i = 0; i < CONCURRENT_REQUESTS; i++) {
      const student: StudentRegistrationProfile = {
        studentId: `simulated_student_${i}`,
        tenantId: 'inst_apex_univ',
        cgpa: 3.5 + (i % 50) * 0.01,
        completedCourseCodes: [],
        enrolledOfferingIds: [],
        totalEnrolledCredits: 0,
      };

      registrationPromises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            const res = registerCourseOptimistic(student, testOfferingId);
            resolve(res);
          }, Math.floor(Math.random() * 5)); // Microsecond jitter
        })
      );
    }

    const results = await Promise.all(registrationPromises);

    const successfulRegistrations = results.filter((r) => r.success);
    const failedRegistrations = results.filter((r) => !r.success);

    // ZERO OVERBOOKING GUARANTEE PROOF:
    // Exactly 50 students should get enrolled, zero extra!
    expect(successfulRegistrations.length).toBe(50);
    expect(failedRegistrations.length).toBe(950);
    expect(OFFERING_SEATS[testOfferingId].enrolledCount).toBe(50);
    expect(OFFERING_SEATS[testOfferingId].enrolledCount).toBeLessThanOrEqual(
      OFFERING_SEATS[testOfferingId].capacity
    );
  });
});
