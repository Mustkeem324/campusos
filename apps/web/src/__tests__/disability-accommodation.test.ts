import { describe, it, expect } from 'vitest';
import { calculateExamExtraTime, DisabilityAccommodation } from '../lib/wellness-safety-service';

describe('Phase 15 Disability UDID Exam Extra Time Accommodation Test Suite', () => {
  it('should add extra time to base exam minutes based on UDID accommodation rate', () => {
    const acc: DisabilityAccommodation = {
      studentId: 's1',
      udidNumber: 'UDID-101',
      disabilityType: 'Visual Impairment',
      extraTimeMinutesPerExamHour: 20, // +20 mins per hour
      scribeAssigned: true,
      groundFloorRoomRequired: true,
    };

    // 180 mins (3 hrs) + (3 * 20) = 240 mins total!
    const totalTime = calculateExamExtraTime(180, acc);
    expect(totalTime).toBe(240);
  });
});
