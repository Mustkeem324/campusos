import { describe, it, expect } from 'vitest';
import { fileConfidentialPOSHComplaint } from '../lib/wellness-safety-service';

describe('Phase 15 Confidential POSH / ICC Complaint Workflow Test Suite', () => {
  it('should mask complainant identity and route report to ICC investigation status', () => {
    const complaint = fileConfidentialPOSHComplaint('POSH_HARASSMENT', 'Incident description', true);

    expect(complaint.isAnonymous).toBe(true);
    expect(complaint.complainantHash).toContain('ANON_HASH_');
    expect(complaint.iccCommitteeStatus).toBe('UNDER_Confidential_INVESTIGATION');
    expect(complaint.caseId).toContain('ICC-CASE-2026-');
  });
});
