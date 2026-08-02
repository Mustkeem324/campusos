import { describe, it, expect } from 'vitest';
import { ResearchGrant, generateUtilizationCertificate } from '../lib/research-service';

describe('Phase 12 Research Grant & Utilization Certificate (UC) Test Suite', () => {
  it('should track grant lifecycle and generate official Utilization Certificate (UC)', () => {
    const grant: ResearchGrant = {
      id: 'grant_serb_404',
      title: 'Quantum Computing Simulators',
      piFacultyId: 'fac_01',
      piFacultyName: 'Dr. Alan Turing',
      agency: 'SERB',
      sanctionedAmount: 100000,
      releasedAmount: 60000,
      spentAmount: 52000,
      status: 'SANCTIONED',
    };

    const uc = generateUtilizationCertificate(grant);

    expect(grant.status).toBe('UTILIZATION_CERT_ISSUED');
    expect(uc.grantId).toBe('grant_serb_404');
    expect(uc.spentAmount).toBe(52000);
    expect(uc.unspentBalance).toBe(8000); // 60000 - 52000 = 8000
    expect(uc.ucId).toContain('UC-2026-');
  });
});
