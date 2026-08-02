import { describe, it, expect } from 'vitest';
import { AdmissionLead, convertLeadToStudent } from '../lib/lifecycle-service';

describe('Phase 7 Admissions Lead-to-Student Conversion Test Suite', () => {
  it('should convert an admission lead into an active student record without leaving platform', () => {
    const lead: AdmissionLead = {
      id: 'lead_999',
      tenantId: 'inst_apex_univ',
      applicantName: 'David Miller',
      email: 'david.m@gmail.com',
      phone: '+1 555-0199',
      programInterested: 'B.Tech CS',
      leadScore: 95,
      entranceScore: 92,
      status: 'OFFER_ISSUED',
    };

    const student = convertLeadToStudent(lead, 'CS2026-105', 2026);

    expect(lead.status).toBe('CONVERTED_STUDENT');
    expect(student.rollNumber).toBe('CS2026-105');
    expect(student.name).toBe('David Miller');
    expect(student.status).toBe('ACTIVE_STUDENT');
    expect(student.leadId).toBe('lead_999');
  });
});
