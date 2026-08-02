export interface StudentRiskProfile {
  studentId: string;
  studentName: string;
  rollNumber: string;
  attendancePct: number;
  latestCgpa: number;
  hasFeeDues: boolean;
  lmsLoginDaysLastMonth: number;
  riskScore: number; // 0 to 100 (Higher = Higher Risk)
  riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL';
  suggestedIntervention: string;
}

export function calculateStudentRiskScore(input: {
  attendancePct: number;
  latestCgpa: number;
  hasFeeDues: boolean;
  lmsLoginDaysLastMonth: number;
}): { riskScore: number; riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL'; suggestedIntervention: string } {
  let score = 0;

  // Attendance factor (Max 40 pts)
  if (input.attendancePct < 75) score += 40;
  else if (input.attendancePct < 80) score += 20;

  // CGPA factor (Max 30 pts)
  if (input.latestCgpa < 2.5) score += 30;
  else if (input.latestCgpa < 3.0) score += 15;

  // Fee dues factor (Max 15 pts)
  if (input.hasFeeDues) score += 15;

  // LMS engagement factor (Max 15 pts)
  if (input.lmsLoginDaysLastMonth < 5) score += 15;

  let riskLevel: 'LOW' | 'MEDIUM' | 'CRITICAL' = 'LOW';
  let suggestedIntervention = 'Routine academic monitoring';

  if (score >= 60) {
    riskLevel = 'CRITICAL';
    suggestedIntervention = 'Immediate Mentor Assignment & Parent Consultation';
  } else if (score >= 35) {
    riskLevel = 'MEDIUM';
    suggestedIntervention = 'Academic Counseling & Attendance Remediation';
  }

  return { riskScore: score, riskLevel, suggestedIntervention };
}
