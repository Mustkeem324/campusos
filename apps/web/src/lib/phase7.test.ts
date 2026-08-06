import { describe, expect, it } from 'vitest';

import {
  reportToCsv,
  reportToPdf,
  sealMfaSecret,
  unsealMfaSecret,
  validatePasswordStrength,
} from './phase7';

describe('Phase 7 security and reporting helpers', () => {
  it('enforces the Phase 7 password policy', () => {
    expect(validatePasswordStrength('weak').valid).toBe(false);
    expect(validatePasswordStrength('CampusOS@2026!').valid).toBe(true);
  });

  it('encrypts and decrypts MFA secrets', () => {
    const sealed = sealMfaSecret('JBSWY3DPEHPK3PXP');
    expect(sealed).not.toContain('JBSWY3DPEHPK3PXP');
    expect(unsealMfaSecret(sealed)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('escapes CSV cells and creates a PDF document', () => {
    const report = {
      title: 'Test report',
      headers: ['Name', 'Value'],
      rows: [['Campus, OS', '"secure"']],
    };
    const csv = reportToCsv(report);
    expect(csv).toContain('"Campus, OS"');
    expect(csv).toContain('""secure""');

    const pdf = reportToPdf(report);
    expect(pdf.subarray(0, 8).toString()).toBe('%PDF-1.4');
    expect(pdf.toString()).toContain('startxref');
  });
});
