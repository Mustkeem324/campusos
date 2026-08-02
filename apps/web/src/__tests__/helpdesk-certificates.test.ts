import { describe, it, expect } from 'vitest';
import { generateBonafideCertificate } from '../lib/campus-life-service';

describe('Phase 6 Student Helpdesk & Certificate Issuance Test Suite', () => {
  it('should issue Bonafide Certificate with unique public verification hash', () => {
    const cert = generateBonafideCertificate('s1', 'Alex Vance', 'CS2026-01', 'BONAFIDE');

    expect(cert.studentName).toBe('Alex Vance');
    expect(cert.certificateType).toBe('BONAFIDE');
    expect(cert.verificationHash).toContain('CERT-');
  });
});
