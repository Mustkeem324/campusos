import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';
import type { ActiveUserContext } from '../lib/active-user-context';

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    // In-memory tenant-scoped fake that only ever returns rows for the tenant
    // and student id it was asked about.
    return {
      student: {
        findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string; tenantId: string } }) => {
          if (where.tenantId !== 'tenant-1' || where.id !== 'student-1' || where.userId !== 'user-1') return null;
          return {
            id: 'student-1',
            userId: 'user-1',
            tenantId: 'tenant-1',
            rollNumber: 'CDU-2024-0001',
            cgpa: 3.8,
            creditsEarned: 45,
            user: { name: 'Rohan Verma', email: 'student.demo@campusos.local' },
            batch: { name: 'Batch 2024-2028', program: { name: 'B.Tech Computer Science' } },
            section: { name: 'Section A' },
          };
        }),
      },
      user: {
        findUnique: vi.fn(async () => ({ name: 'Rohan Verma', email: 'student.demo@campusos.local' })),
      },
      attendanceRecord: { findMany: vi.fn(async () => []) },
      enrollment: { findMany: vi.fn(async () => []) },
      invoice: { findMany: vi.fn(async () => []) },
      notice: { findMany: vi.fn(async () => []) },
      exam: { findMany: vi.fn(async () => []) },
      studentSemesterResult: { findMany: vi.fn(async () => []) },
      supportCase: { findMany: vi.fn(async () => []) },
      allocation: { findFirst: vi.fn(async () => null) },
      notification: { findMany: vi.fn(async () => []) },
      auditLog: { findMany: vi.fn(async () => []) },
    };
  },
}));

import { getStudentDashboardData } from '../lib/dashboard/student';

function studentContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.STUDENT,
    roleAssignmentId: 'ra-1',
    studentProfileId: 'student-1',
    permissions: [],
    ...overrides,
  };
}

describe('Phase 95: Student dashboard server-side authorization', () => {
  it('rejects non-student roles before any data is fetched', async () => {
    await expect(
      getStudentDashboardData(studentContext({ activeRole: RoleType.FACULTY, studentProfileId: undefined })),
    ).rejects.toThrow('Unauthorized');
  });

  it('rejects when the student profile id is missing', async () => {
    await expect(
      getStudentDashboardData(studentContext({ studentProfileId: undefined })),
    ).rejects.toThrow('Unauthorized');
  });

  it('returns a typed contract with only authorised student fields', async () => {
    const data = await getStudentDashboardData(studentContext());
    expect(data.role).toBe('STUDENT');
    expect(data.identity.name).toBe('Rohan Verma');
    expect(data.identity.rollNumber).toBe('CDU-2024-0001');
    expect(data.cgpa).toBe(3.8);
    expect(data.creditsEarned).toBe(45);

    // No other-role payload fields may leak.
    expect(data).not.toHaveProperty('adminUser');
    expect(data).not.toHaveProperty('financeData');
    expect(data).not.toHaveProperty('facultyData');
    expect(data).not.toHaveProperty('linkedStudent');

    // Arrays are allowed to be empty (legitimate empty states).
    expect(Array.isArray(data.todayClasses)).toBe(true);
    expect(Array.isArray(data.assignments)).toBe(true);
    expect(Array.isArray(data.examinations)).toBe(true);
    expect(Array.isArray(data.publishedResults)).toBe(true);
    expect(Array.isArray(data.studentServices)).toBe(true);
    expect(Array.isArray(data.notices)).toBe(true);
    expect(Array.isArray(data.notifications)).toBe(true);
    expect(Array.isArray(data.quickActions)).toBe(true);
  });

  it('quick actions come from the registry and resolve to real routes', async () => {
    const data = await getStudentDashboardData(studentContext());
    expect(data.quickActions.length).toBeGreaterThan(0);
    for (const action of data.quickActions) {
      expect(action.href).not.toBe('#');
      expect(action.href).toMatch(/^\//);
    }
  });

  describe('Explicit role-leakage negatives', () => {
    it('does not expose another student’s records (identity is always the authenticated student)', async () => {
      const data = await getStudentDashboardData(studentContext());
      // Identity is the authenticated persona only — never a linked or other student.
      expect(data.identity.id).toBe('user-1');
      expect(data.identity.rollNumber).toBe('CDU-2024-0001');
      // No collection of other students may exist in the contract.
      expect(data).not.toHaveProperty('otherStudents');
      expect(data).not.toHaveProperty('studentDirectory');
    });

    it('does not expose admin/settings or tenant-configuration data', async () => {
      const data = await getStudentDashboardData(studentContext());
      expect(data).not.toHaveProperty('tenantConfiguration');
      expect(data).not.toHaveProperty('users');
      expect(data).not.toHaveProperty('accessRequests');
      expect(data).not.toHaveProperty('integrationStatus');
      expect(data).not.toHaveProperty('workflowExceptions');
    });

    it('does not expose finance reconciliation data', async () => {
      const data = await getStudentDashboardData(studentContext());
      expect(data).not.toHaveProperty('reconciliationQueue');
      expect(data).not.toHaveProperty('refunds');
      expect(data).not.toHaveProperty('concessions');
      expect(data).not.toHaveProperty('paymentSettlements');
      // The fee summary is the student's own invoices only.
      expect(data.feeSummary.invoiceCount).toBe(0);
    });

    it('does not expose faculty grading or workload data', async () => {
      const data = await getStudentDashboardData(studentContext());
      expect(data).not.toHaveProperty('gradingQueue');
      expect(data).not.toHaveProperty('facultyWorkload');
      expect(data).not.toHaveProperty('marksEntryBatches');
      expect(data).not.toHaveProperty('courseDelivery');
    });

    it('never surfaces unpublished results (only published=true semester results)', async () => {
      const data = await getStudentDashboardData(studentContext());
      // The loader only queries with published: true; a draft must never reach the contract.
      expect(data.publishedResults).toEqual([]);
      expect(data).not.toHaveProperty('draftResults');
      expect(data).not.toHaveProperty('resultPublicationControls');
    });

    it('does not expose result-publication or examination-office controls', async () => {
      const data = await getStudentDashboardData(studentContext());
      expect(data).not.toHaveProperty('moderationQueue');
      expect(data).not.toHaveProperty('withheldResults');
      expect(data).not.toHaveProperty('revaluationRequests');
      expect(data).not.toHaveProperty('examinationAudit');
    });

    it('rejects a cross-tenant student profile before fetching data', async () => {
      // A context pointing at a profile in another tenant must not resolve.
      await expect(
        getStudentDashboardData(studentContext({ tenantId: 'tenant-2' })),
      ).rejects.toThrow('profile could not be resolved');
    });
  });
});
