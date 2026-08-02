export interface SOSPanicAlert {
  alertId: string;
  studentId: string;
  studentName: string;
  lat: number;
  lng: number;
  broadcastTime: Date;
  status: 'ACTIVE_EMERGENCY' | 'SECURITY_DISPATCHED' | 'RESOLVED';
}

export interface POSHComplaintCase {
  caseId: string;
  isAnonymous: boolean;
  complainantHash: string; // Masked identity hash
  category: 'POSH_HARASSMENT' | 'RAGGING' | 'SAFETY_HAZARD';
  description: string;
  iccCommitteeStatus: 'RECEIVED' | 'UNDER_Confidential_INVESTIGATION' | 'RESOLUTION_ISSUED';
  filedAt: Date;
}

export interface DisabilityAccommodation {
  studentId: string;
  udidNumber: string;
  disabilityType: string;
  extraTimeMinutesPerExamHour: number; // e.g. +20 mins per hour
  scribeAssigned: boolean;
  groundFloorRoomRequired: boolean;
}

// 1. Trigger Mobile SOS Panic Alert with Live GPS Location (Phase 15 Exit Criteria 1)
export function triggerMobileSOSGPSAlert(
  studentId: string,
  studentName: string,
  lat = 12.9716,
  lng = 77.5946
): SOSPanicAlert {
  return {
    alertId: `SOS_GPS_${Date.now()}`,
    studentId,
    studentName,
    lat,
    lng,
    broadcastTime: new Date(),
    status: 'ACTIVE_EMERGENCY',
  };
}

// 2. File Confidential POSH / ICC Complaint Workflow (Phase 15 Exit Criteria 2)
export function fileConfidentialPOSHComplaint(
  category: 'POSH_HARASSMENT' | 'RAGGING' | 'SAFETY_HAZARD',
  description: string,
  isAnonymous = true
): POSHComplaintCase {
  const complainantHash = `ANON_HASH_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

  return {
    caseId: `ICC-CASE-2026-${Math.floor(Math.random() * 10000)}`,
    isAnonymous,
    complainantHash,
    category,
    description,
    iccCommitteeStatus: 'UNDER_Confidential_INVESTIGATION',
    filedAt: new Date(),
  };
}

// 3. Evaluate Exam Extra Time for UDID PwD Disability Accommodations
export function calculateExamExtraTime(
  baseExamMinutes: number,
  accommodation: DisabilityAccommodation
): number {
  const examHours = baseExamMinutes / 60;
  const extraMinutes = Math.round(examHours * accommodation.extraTimeMinutesPerExamHour);
  return baseExamMinutes + extraMinutes;
}
