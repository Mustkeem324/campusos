import { describe, it, expect } from 'vitest';
import {
  calculateAttendanceShortage,
  validateQRCheckIn,
  APEX_CAMPUS_GEOFENCE,
  QRCheckInToken,
} from '../lib/attendance-service';

describe('Phase 3 Attendance Shortage & Anti-Proxy Geofence Test Suite', () => {
  it('should correctly calculate lectures needed to reach 75% target', () => {
    // Student attended 16 / 24 classes = 66.6% (< 75%)
    const summary = {
      studentId: 'stud_01',
      courseCode: 'CS401',
      courseTitle: 'Data Structures',
      totalClassesHeld: 24,
      classesAttended: 16,
      currentAttendancePct: 66.6,
      requiredAttendancePct: 75,
    };

    const result = calculateAttendanceShortage(summary);
    expect(result.isShortage).toBe(true);
    expect(result.statusAlert).toBe('SHORTAGE_75');
    // Formula: (0.75 * 24 - 16) / 0.25 = (18 - 16) / 0.25 = 8 lectures needed!
    expect(result.lecturesNeededForTarget).toBe(8);
  });

  it('should reject check-in when student location is outside geofence radius', () => {
    const token: QRCheckInToken = {
      sessionToken: 'token_101',
      courseOfferingId: 'offering_101',
      generatedAt: Date.now(),
      expiresAt: Date.now() + 15000,
      geofence: APEX_CAMPUS_GEOFENCE,
    };

    // Simulate student located 5 km away (lat: 13.0, lon: 77.6)
    const res = validateQRCheckIn(token, 13.0, 77.6, 'fingerprint_xyz');
    expect(res.valid).toBe(false);
    expect(res.reason).toContain('Geofence Check Failed');
  });
});
