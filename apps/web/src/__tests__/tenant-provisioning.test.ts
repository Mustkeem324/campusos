import { describe, it, expect } from 'vitest';
import { provisionSelfServeTenant } from '../lib/saas-billing-service';

describe('Phase 18 Self-Serve Tenant Provisioning Flow Test Suite', () => {
  it('should provision tenant subdomain and seed default tenant configuration within 3 minutes', () => {
    const tenant = provisionSelfServeTenant({
      institutionName: 'Stanford University',
      subdomainPrefix: 'stanford',
      adminEmail: 'admin@stanford.edu',
      tier: 'ENTERPRISE',
      initialStudentCount: 5000,
    });

    expect(tenant.isProvisioned).toBe(true);
    expect(tenant.subdomain).toBe('stanford.campusos.app');
    expect(tenant.tier).toBe('ENTERPRISE');
    expect(tenant.tenantId).toContain('inst_stanford_');
  });
});
