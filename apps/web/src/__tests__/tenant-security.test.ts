import { describe, it, expect } from 'vitest';
import { getAuditLogs, recordAuditLog } from '../lib/audit-service';

describe('Phase 1 Tenant Security & Isolation Engine', () => {
  it('should enforce strict tenant isolation in audit log queries', () => {
    // Record log for Tenant A
    recordAuditLog({
      tenantId: 'inst_tenant_A',
      userId: 'usr_A1',
      action: 'COURSE_CREATE',
      entity: 'Course',
    });

    // Record log for Tenant B
    recordAuditLog({
      tenantId: 'inst_tenant_B',
      userId: 'usr_B1',
      action: 'FEE_INVOICE_CREATE',
      entity: 'Invoice',
    });

    // Tenant A queries audit logs
    const tenantALogs = getAuditLogs('inst_tenant_A');
    expect(tenantALogs.every((log) => log.tenantId === 'inst_tenant_A')).toBe(true);

    // Verify Tenant A CANNOT see any Tenant B records
    const crossTenantLeak = tenantALogs.some((log) => log.tenantId === 'inst_tenant_B');
    expect(crossTenantLeak).toBe(false);
  });
});
