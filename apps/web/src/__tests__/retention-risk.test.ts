import { describe, it, expect } from 'vitest';
import { calculateStudentRiskScore } from '../lib/retention-engine';

describe('Phase 8 Early-Warning Student Retention Risk Score Test Suite', () => {
  it('should categorize student as CRITICAL risk when attendance is under 75% and CGPA is low', () => {
    const studentData = {
      attendancePct: 66.6, // +40 pts
      latestCgpa: 2.3,      // +30 pts
      hasFeeDues: true,     // +15 pts
      lmsLoginDaysLastMonth: 2, // +15 pts
    };

    const res = calculateStudentRiskScore(studentData);

    expect(res.riskScore).toBe(100);
    expect(res.riskLevel).toBe('CRITICAL');
    expect(res.suggestedIntervention).toContain('Immediate Mentor Assignment');
  });

  it('should categorize student as LOW risk when metrics are healthy', () => {
    const studentData = {
      attendancePct: 92,
      latestCgpa: 3.8,
      hasFeeDues: false,
      lmsLoginDaysLastMonth: 20,
    };

    const res = calculateStudentRiskScore(studentData);

    expect(res.riskScore).toBe(0);
    expect(res.riskLevel).toBe('LOW');
  });
});
