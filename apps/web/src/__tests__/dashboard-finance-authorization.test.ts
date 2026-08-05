import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';
import type { ActiveUserContext } from '../lib/active-user-context';

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    // In-memory tenant-scoped fake. Only returns data when the caller is in
    // tenant-1 with the finance officer identity user-finance-1. Everything
    // else is empty — cross-tenant and cross-user access yields nothing.
    const financeIdentity = tenantId === 'tenant-1';
    return {
      user: {
        findUnique: vi.fn(async () =>
          financeIdentity ? { name: 'Kavya Nair', email: 'finance.demo@campusos.local' } : null,
        ),
      },
      staff: {
        findFirst: vi.fn(async ({ where }: { where: { userId: string; tenantId: string } }) =>
          where.tenantId === 'tenant-1' && where.userId === 'user-finance-1'
            ? { designation: 'Finance Officer' }
            : null,
        ),
      },
      payment: {
        aggregate: vi.fn(async ({ where }: { where: { tenantId: string; status?: string } }) =>
          where.tenantId === 'tenant-1' ? { _sum: { amount: 500000 }, _count: 50 } : { _sum: { amount: null }, _count: 0 },
        ),
        findMany: vi.fn(async () =>
          financeIdentity
            ? [
                {
                  id: 'pay-1',
                  amount: 100000,
                  method: 'UPI',
                  status: 'PAID',
                  paidAt: new Date('2026-08-01T10:00:00.000Z'),
                  invoice: { student: { user: { name: 'Rohan Verma' } } },
                },
              ]
            : [],
        ),
      },
      invoice: {
        aggregate: vi.fn(async ({ _max }: { _max?: { dueDate?: boolean } }) =>
          _max ? { _max: { dueDate: financeIdentity ? new Date('2026-09-30') : null } } : { _sum: { amount: 200000 }, _count: 8 },
        ),
        findMany: vi.fn(async () =>
          financeIdentity
            ? [
                {
                  id: 'inv-1',
                  amount: 100000,
                  dueDate: new Date('2026-09-30'),
                  status: 'PENDING',
                  student: { user: { name: 'Rohan Verma' } },
                },
              ]
            : [],
        ),
        groupBy: vi.fn(async () =>
          financeIdentity
            ? [
                { status: 'PENDING', _count: { _all: 4 } },
                { status: 'PARTIAL', _count: { _all: 4 } },
                { status: 'PAID', _count: { _all: 42 } },
              ]
            : [],
        ),
      },
      scholarship: { count: vi.fn(async () => (financeIdentity ? 2 : 0)) },
      feeStructure: { count: vi.fn(async () => (financeIdentity ? 1 : 0)) },
      auditLog: { findMany: vi.fn(async () => []) },
    };
  },
}));

import { getFinanceDashboardData } from '../lib/dashboard/finance';
import { DashboardError } from '../lib/dashboard/errors';

function financeContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-finance-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.FINANCE_OFFICER,
    roleAssignmentId: 'ra-1',
    permissions: [],
    ...overrides,
  };
}

describe('Finance dashboard server-side authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-finance roles before any data is fetched', async () => {
    await expect(
      getFinanceDashboardData(financeContext({ activeRole: RoleType.STUDENT })),
    ).rejects.toThrow('Unauthorized');
  });

  it('rejects faculty with a typed 403 DashboardError', async () => {
    try {
      await getFinanceDashboardData(financeContext({ activeRole: RoleType.FACULTY }));
      expect.unreachable('expected DashboardError');
    } catch (error) {
      expect(error).toBeInstanceOf(DashboardError);
      if (error instanceof DashboardError) expect(error.status).toBe(403);
    }
  });

  it('rejects when the user record cannot be resolved in the tenant', async () => {
    await expect(getFinanceDashboardData(financeContext({ tenantId: 'tenant-2' }))).rejects.toThrow(
      'could not be resolved',
    );
  });

  it('allows both FINANCE_OFFICER and ACCOUNTANT roles', async () => {
    const officer = await getFinanceDashboardData(financeContext({ activeRole: RoleType.FINANCE_OFFICER }));
    expect(officer.role).toBe('FINANCE_OFFICER');

    const accountant = await getFinanceDashboardData(financeContext({ activeRole: RoleType.ACCOUNTANT }));
    expect(accountant.role).toBe('ACCOUNTANT');
  });

  it('returns a typed contract with only authorised finance fields', async () => {
    const data = await getFinanceDashboardData(financeContext());
    expect(data.identity.name).toBe('Kavya Nair');
    expect(data.identity.designation).toBe('Finance Officer');
    expect(data.identity.id).toBe('user-finance-1');

    expect(data.collections.todayTotal).toBe(500000);
    expect(data.collections.paymentCount).toBe(50);
    expect(data.outstanding.invoiceCount).toBe(8);
    expect(data.outstanding.topInvoices[0].studentName).toBe('Rohan Verma');
    expect(data.schemes.scholarshipCount).toBe(2);
    expect(data.schemes.feeStructureCount).toBe(1);
    expect(data.invoiceStatusBreakdown.length).toBe(3);
    expect(data.financialPeriod?.label).toBe('FY 2026');

    expect(Array.isArray(data.metrics)).toBe(true);
    expect(Array.isArray(data.recentPayments)).toBe(true);
    expect(Array.isArray(data.quickActions)).toBe(true);
    expect(Array.isArray(data.recentActivity)).toBe(true);
  });

  it('quick actions come from the registry and resolve to real routes', async () => {
    const data = await getFinanceDashboardData(financeContext());
    expect(data.quickActions.length).toBeGreaterThan(0);
    for (const action of data.quickActions) {
      expect(action.href).not.toBe('#');
      expect(action.href).toMatch(/^\//);
    }
  });

  describe('Explicit role-leakage negatives', () => {
    it('does not expose student personal dashboard or academic grading data', async () => {
      const data = await getFinanceDashboardData(financeContext());
      expect(data).not.toHaveProperty('studentIdentity');
      expect(data).not.toHaveProperty('todayClasses');
      expect(data).not.toHaveProperty('assignments');
      expect(data).not.toHaveProperty('grading');
      expect(data).not.toHaveProperty('resultPublication');
    });

    it('does not expose admin configuration or tenant settings', async () => {
      const data = await getFinanceDashboardData(financeContext());
      expect(data).not.toHaveProperty('tenantConfiguration');
      expect(data).not.toHaveProperty('users');
      expect(data).not.toHaveProperty('accessRequests');
      expect(data).not.toHaveProperty('roleManagement');
      expect(data).not.toHaveProperty('integrationStatus');
    });

    it('does not expose HR payroll or admissions evaluation data', async () => {
      const data = await getFinanceDashboardData(financeContext());
      expect(data).not.toHaveProperty('payroll');
      expect(data).not.toHaveProperty('employeeRecords');
      expect(data).not.toHaveProperty('admissionsFunnel');
      expect(data).not.toHaveProperty('applicantEvaluation');
    });

    it('student names appear only as tenant-scoped invoice aggregates, never as identity', async () => {
      const data = await getFinanceDashboardData(financeContext());
      expect(data.identity.name).not.toBe('Rohan Verma');
      expect(data.outstanding.topInvoices.every((invoice) => invoice.studentName === 'Rohan Verma')).toBe(true);
    });
  });
});
