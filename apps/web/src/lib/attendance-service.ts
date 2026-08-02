export interface GeofenceLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface QRCheckInToken {
  sessionToken: string;
  courseOfferingId: string;
  generatedAt: number;
  expiresAt: number; // Rotating every 15 seconds to prevent proxy screenshots
  geofence: GeofenceLocation;
}

export interface StudentAttendanceSummary {
  studentId: string;
  courseCode: string;
  courseTitle: string;
  totalClassesHeld: number;
  classesAttended: number;
  currentAttendancePct: number;
  requiredAttendancePct: number; // 75%
}

export const APEX_CAMPUS_GEOFENCE: GeofenceLocation = {
  latitude: 12.9716, // Example university latitude
  longitude: 77.5946, // Example university longitude
  radiusMeters: 100,  // 100-meter radius around classroom
};

// Calculate distance between two lat/lng coordinates in meters (Haversine Formula)
export function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Anti-Proxy QR Code Check-In Validation
export function validateQRCheckIn(
  scannedToken: QRCheckInToken,
  studentLat: number,
  studentLng: number,
  deviceFingerprint: string
): { valid: boolean; reason?: string } {
  // 1. Check token expiry (15s rotation)
  if (Date.now() > scannedToken.expiresAt) {
    return { valid: false, reason: 'QR Code Expired. Please scan the live rotating QR on classroom screen.' };
  }

  // 2. Geofence Distance Validation
  const distance = calculateDistanceMeters(
    studentLat,
    studentLng,
    scannedToken.geofence.latitude,
    scannedToken.geofence.longitude
  );

  if (distance > scannedToken.geofence.radiusMeters) {
    return {
      valid: false,
      reason: `Geofence Check Failed! You are ${Math.round(distance)}m away from classroom (Allowed radius: ${scannedToken.geofence.radiusMeters}m).`,
    };
  }

  return { valid: true };
}

// Shortage Projection Calculator: "Attend N more lectures to reach 75% target"
export function calculateAttendanceShortage(summary: StudentAttendanceSummary): {
  isShortage: boolean;
  statusAlert: 'SAFE' | 'WARNING_85' | 'WARNING_80' | 'SHORTAGE_75';
  lecturesNeededForTarget: number;
} {
  const currentPct = summary.totalClassesHeld > 0 ? (summary.classesAttended / summary.totalClassesHeld) * 100 : 100;

  let statusAlert: 'SAFE' | 'WARNING_85' | 'WARNING_80' | 'SHORTAGE_75' = 'SAFE';

  if (currentPct < 75) {
    statusAlert = 'SHORTAGE_75';
  } else if (currentPct < 80) {
    statusAlert = 'WARNING_80';
  } else if (currentPct < 85) {
    statusAlert = 'WARNING_85';
  }

  // Formula to find required consecutive lectures to reach 75%:
  // (Attended + N) / (Total + N) >= 0.75
  // Attended + N >= 0.75 * Total + 0.75 * N
  // 0.25 * N >= 0.75 * Total - Attended
  // N >= (0.75 * Total - Attended) / 0.25
  let lecturesNeededForTarget = 0;
  if (currentPct < 75) {
    const requiredNumerator = 0.75 * summary.totalClassesHeld - summary.classesAttended;
    lecturesNeededForTarget = Math.ceil(requiredNumerator / 0.25);
  }

  return {
    isShortage: currentPct < 75,
    statusAlert,
    lecturesNeededForTarget,
  };
}
