import { describe, it, expect } from 'vitest';
import { pushMarksheetToDigiLocker } from '../lib/govt-compliance-service';

describe('Phase 11 DigiLocker Marksheet Push Adapter Test Suite', () => {
  it('should push marksheet to DigiLocker mock and generate valid SHA-256 hash', () => {
    const payload = {
      studentRollNumber: 'CS2026-01',
      documentType: 'MARKSHEET' as const,
      yearOfPassing: 2026,
      documentData: { sgpa: 9.5, cgpa: 3.84 },
    };

    const res = pushMarksheetToDigiLocker(payload);

    expect(res.success).toBe(true);
    expect(res.digiLockerUri).toBe('in.gov.digilocker.marksheet.CS2026-01.2026');
    expect(res.sha256Hash.length).toBe(64); // 64 hex characters for SHA-256
  });
});
