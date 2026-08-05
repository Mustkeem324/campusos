import { describe, it, expect, vi } from 'vitest';
import { RoleType } from '@prisma/client';
import type { ActiveUserContext } from '../lib/active-user-context';

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    // In-memory tenant-scoped fake. Row data only exists for tenant-1.
    const rows = tenantId === 'tenant-1';
    return {
      user: {
        findUnique: vi.fn(async () => (rows ? { name: 'Aarav Mehta', email: 'admin.demo@campusos.local' } : null)),
        count: vi.fn(async () => (rows ? 100 : 0)),
      },
      department: { count: vi.fn(async () => (rows ? 7 : 0)) },
      course: { count: vi.fn(async () => (rows ? 29 : 0)) },
      courseOffering: { count: vi.fn(async () => (rows ? 29 : 0)) },
      enrollment: { count: vi.fn(async () => (rows ? 166 : 0)) },
      invoice: {
        count: vi.fn(async () => (rows ? 100 : 0)),
        aggregate: vi.fn(async () => ({ _sum: { amount: 250000 } })),
      },
      payment: {
        count: vi.fn(async () => (rows ? 80 : 0)),
        aggregate: vi.fn(async () => ({ _sum: { amount: 6650000 } })),
      },
      notice: { findMany: vi.fn(async () => []) },
      supportCase: { findMany: vi.fn(async () => []) },
      auditLog: { findMany: vi.fn(async () => []) },
    };
  },
}));

import { getAdminDashboardData } from '../lib/dashboard/admin';

function adminContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-admin-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.INSTITUTION_ADMIN,
    roleAssignmentId: 'ra-admin-1',
    permissions: [],
    ...overrides,
  };
}

describe('Phase 95: Administrator dashboard server-side authorization', () => {
  it('rejects non-admin roles before any data is fetched', async () => {
    await expect(getAdminDashboardData(adminContext({ activeRole: RoleType.STUDENT }))).rejects.toThrow('Unauthorized');
    await expect(getAdminDashboardData(adminContext({ activeRole: RoleType.FACULTY }))).rejects.toThrow('Unauthorized');
    await expect(getAdminDashboardData(adminContext({ activeRole: RoleType.PARENT }))).rejects.toThrow('Unauthorized');
  });

  it('accepts INSTITUTION_ADMIN and SUPER_ADMIN roles', async () => {
    const admin = await getAdminDashboardData(adminContext());
    expect(admin.role).toBe('INSTITUTION_ADMIN');

    const superAdmin = await getAdminDashboardData(adminContext({ activeRole: RoleType.SUPER_ADMIN }));
    expect(superAdmin.role).toBe('SUPER_ADMIN');
  });

  it('returns real tenant-scoped aggregates in a typed contract', async () => {
    const data = await getAdminDashboardData(adminContext());
    expect(data.identity.name).toBe('Aarav Mehta');
    expect(data.userSummary.students).toBe(100);
    expect(data.userSummary.faculty).toBe(100); // mock counts all roles as 100
    expect(data.academicsSummary.departments).toBe(7);
    expect(data.financeSummary.collectedAmount).toBe(6650000);
    expect(data.financeSummary.outstandingAmount).toBe(250000);
    expect(Array.isArray(data.metrics)).toBe(true);
  });

  it('rejects a cross-tenant admin profile before fetching aggregates', async () => {
    await expect(getAdminDashboardData(adminContext({ tenantId: 'tenant-2' }))).rejects.toThrow(
      'profile could not be resolved',
    );
  });

  describe('Explicit admin role-leakage negatives', () => {
    it('identity is always the administrator — never a student profile', async () => {
      const data = await getAdminDashboardData(adminContext());
      expect(data.identity.name).toBe('Aarav Mehta');
      expect(data).not.toHaveProperty('studentProfile');
      expect(data).not.toHaveProperty('linkedStudent');
      expect(data).not.toHaveProperty('studentAssignments');
      // Students exist only as institution-level counts.
      expect(typeof data.userSummary.students).toBe('number');
    });

    it('does not expose the student personal dashboard payload', async () => {
      const data = await getAdminDashboardData(adminContext());
      expect(data).not.toHaveProperty('todayClasses');
      expect(data).not.toHaveProperty('attendance');
      expect(data).not.toHaveProperty('assignments');
      expect(data).not.toHaveProperty('feeSummary');
    });

    it('does not expose faculty teaching or grading workspace data', async () => {
      const data = await getAdminDashboardData(adminContext());
      expect(data).not.toHaveProperty('gradingQueue');
      expect(data).not.toHaveProperty('facultyWorkload');
      expect(data).not.toHaveProperty('teachingSchedule');
    });

    it('does not expose parent-portal or guardian data', async () => {
      const data = await getAdminDashboardData(adminContext());
      expect(data).not.toHaveProperty('parentUser');
      expect(data).not.toHaveProperty('linkedStudentSelector');
    });

    it('never fabricates admissions counts or compliance claims', async () => {
      const data = await getAdminDashboardData(adminContext());
      // No hard-coded admissions or compliance numbers may exist.
      expect(data).not.toHaveProperty('pendingAdmissionsCount');
      expect(data).not.toHaveProperty('complianceClaim');
      // Real aggregate fields exist instead.
      expect(Array.isArray(data.metrics)).toBe(true);
    });
  });
});
