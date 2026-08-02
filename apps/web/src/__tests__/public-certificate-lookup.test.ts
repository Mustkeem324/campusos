import { describe, it, expect } from 'vitest';
import { verifyPublicCertificateByHash } from '../lib/public-portal-service';

describe('Phase 20 Public Tamper-Evident Certificate Verification Test Suite', () => {
  it('should return verified status and student degree record for valid certificate hashes', () => {
    const res = verifyPublicCertificateByHash('CERT-2026-9941');

    expect(res.isVerified).toBe(true);
    expect(res.studentName).toBe('Alex Vance');
    expect(res.degreeOrCourse).toContain('Bachelor of Technology');
    expect(res.tamperEvidentHash).toContain('SHA256:');
  });

  it('should reject unverified or invalid certificate hashes', () => {
    const res = verifyPublicCertificateByHash('FAKE-HASH-0000');

    expect(res.isVerified).toBe(false);
  });
});
