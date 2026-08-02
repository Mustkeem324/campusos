import { describe, it, expect } from 'vitest';
import { checkPlacementEligibility, StudentRecord, PlacementDrive } from '../lib/lifecycle-service';

describe('Phase 7 Placement Eligibility Filter Test Suite', () => {
  it('should reject student whose CGPA is below company drive threshold', () => {
    const student: StudentRecord = {
      id: 's_low_cgpa',
      tenantId: 'inst_apex_univ',
      rollNumber: 'CS01',
      name: 'John',
      email: 'john@apex.edu',
      program: 'B.Tech CS',
      batchYear: 2026,
      cgpa: 3.1, // Below 3.5 cutoff
      backlogs: 0,
      status: 'ACTIVE_STUDENT',
    };

    const drive: PlacementDrive = {
      id: 'd1',
      companyName: 'Google',
      roleTitle: 'SDE',
      ctcPackageLPA: 24,
      minCgpaRequired: 3.5,
      maxBacklogsAllowed: 0,
      eligibleBranches: ['CS'],
    };

    const res = checkPlacementEligibility(student, drive);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Student CGPA is 3.10');
  });

  it('should reject student who has active backlogs exceeding company limit', () => {
    const student: StudentRecord = {
      id: 's_backlogs',
      tenantId: 'inst_apex_univ',
      rollNumber: 'CS02',
      name: 'Jane',
      email: 'jane@apex.edu',
      program: 'B.Tech CS',
      batchYear: 2026,
      cgpa: 3.8,
      backlogs: 2, // Exceeds 0 max allowed
      status: 'ACTIVE_STUDENT',
    };

    const drive: PlacementDrive = {
      id: 'd1',
      companyName: 'Google',
      roleTitle: 'SDE',
      ctcPackageLPA: 24,
      minCgpaRequired: 3.5,
      maxBacklogsAllowed: 0,
      eligibleBranches: ['CS'],
    };

    const res = checkPlacementEligibility(student, drive);
    expect(res.eligible).toBe(false);
    expect(res.reason).toContain('Student has 2 active backlogs');
  });
});
