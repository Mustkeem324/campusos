import { describe, expect, it } from 'vitest';

import {
  attendancePercentage,
  classesNeededForTarget,
  isAttendanceDay,
  isWithinCheckInWindow,
  selfCheckInMode,
  timetableDayMatches,
} from './smart-attendance-policy';

const settings = { allowOfflineSelfCheckIn: true, allowHybridDailyCheckIn: true };

describe('smart attendance policy', () => {
  it('requires online students to verify each class', () => {
    expect(selfCheckInMode('ONLINE', settings)).toBe('CLASS');
  });

  it('uses one daily self check-in for offline students', () => {
    expect(selfCheckInMode('OFFLINE', settings)).toBe('DAY');
    expect(selfCheckInMode('OFFLINE', { ...settings, allowOfflineSelfCheckIn: false })).toBe('NONE');
  });

  it('respects the institution hybrid attendance policy', () => {
    expect(selfCheckInMode('HYBRID', settings)).toBe('DAY');
    expect(selfCheckInMode('HYBRID', { ...settings, allowHybridDailyCheckIn: false })).toBe('CLASS');
  });

  it('calculates the 75 percent recovery requirement', () => {
    expect(attendancePercentage(16, 0, 24)).toBeCloseTo(66.666, 2);
    expect(classesNeededForTarget(16, 24, 75)).toBe(8);
    expect(classesNeededForTarget(19, 24, 75)).toBe(0);
  });

  it('excludes holidays and closures from attendance days', () => {
    expect(isAttendanceDay('HOLIDAY')).toBe(false);
    expect(isAttendanceDay('INSTITUTION_CLOSED')).toBe(false);
    expect(isAttendanceDay('SPECIAL_WORKING')).toBe(true);
    expect(isAttendanceDay(null)).toBe(true);
  });

  it('supports both JS and ISO weekday conventions', () => {
    expect(timetableDayMatches(1, 1)).toBe(true);
    expect(timetableDayMatches(7, 0)).toBe(true);
  });

  it('enforces the timetable check-in window', () => {
    expect(isWithinCheckInWindow(9 * 60, '09:00', 15, 20)).toBe(true);
    expect(isWithinCheckInWindow(8 * 60 + 40, '09:00', 15, 20)).toBe(false);
    expect(isWithinCheckInWindow(9 * 60 + 25, '09:00', 15, 20)).toBe(false);
  });
});
