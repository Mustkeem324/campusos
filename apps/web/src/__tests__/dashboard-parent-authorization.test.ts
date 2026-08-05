import { describe, it, expect, vi } from 'vitest';
import { RoleType } from '@prisma/client';
import type { ActiveUserContext } from '../lib/active-user-context';

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    // In-memory tenant-scoped fake. Guardian + links only exist for tenant-1.
    const isTenant1 = tenantId === 'tenant-1';
    const linkedStudentIds = ['stu-rohan', 'stu-meera'];

    return {
      guardian: {
        findFirst: vi.fn(async ({ where }) => {
          if (!isTenant1) return null;
          if (where.id !== 'guardian-anita' || where.userId !== 'user-anita') return null;
          return {
            id: 'guardian-anita',
            relationship: 'Mother',
            students: [
              {
                id: 'stu-rohan',
                rollNumber: 'CS2024-001',
                cgpa: 2.94,
                user: { name: 'Rohan Verma', email: 'student.demo@campusos.local' },
                batch: { name: 'Batch 2024-2028', program: { name: 'B.Tech Computer Science' } },
              },
              {
                id: 'stu-meera',
                rollNumber: 'ME2022-011',
                cgpa: 3.69,
                user: { name: 'Meera Menon', email: 'meera.menon@demo.local' },
                batch: { name: 'Batch 2022-2026', program: { name: 'B.Tech Mechanical Engineering' } },
              },
            ],
          };
        }),
      },
      user: {
        findUnique: vi.fn(async () => (isTenant1 ? { name: 'Anita Verma', email: 'parent.demo@campusos.local' } : null)),
      },
      attendanceRecord: {
        findMany: vi.fn(async ({ where }) => {
          if (!isTenant1 || where.studentId !== 'stu-rohan') return [];
          return [
            { id: 'att-1', status: 'PRESENT' },
            { id: 'att-2', status: 'ABSENT' },
            { id: 'att-3', status: 'PRESENT' },
            { id: 'att-4', status: 'LATE' },
          ];
        }),
      },
      invoice: {
        findMany: vi.fn(async ({ where }) => {
          if (!isTenant1 || where.studentId !== 'stu-rohan') return [];
          return [
            { id: 'inv-1', amount: 200000, status: 'PAID', dueDate: new Date('2026-01-15') },
            { id: 'inv-2', amount: 100000, status: 'PENDING', dueDate: new Date('2026-04-30') },
          ];
        }),
      },
      studentSemesterResult: {
        findMany: vi.fn(async ({ where }) => {
          if (!isTenant1 || where.studentId !== 'stu-rohan') return [];
          if (where.published !== true) return [];
          return [
            {
              id: 'res-1',
              sgpa: 3.8,
              cgpa: 2.94,
              status: 'PASS',
              updatedAt: new Date('2026-06-01'),
              examination: { name: 'Semester 3 Examination' },
            },
          ];
        }),
      },
      notice: { findMany: vi.fn(async () => []) },
      auditLog: { findMany: vi.fn(async () => []) },
    };
  },
}));

import { getParentDashboardData } from '../lib/dashboard/parent';
import { DashboardError } from '../lib/dashboard/errors';

function parentContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-anita',
    tenantId: 'tenant-1',
    activeRole: RoleType.PARENT,
    roleAssignmentId: 'ra-anita-1',
    guardianProfileId: 'guardian-anita',
    permissions: [],
    ...overrides,
  };
}

async function expectDashboardError(promise: Promise<unknown>, status: number, messagePart: string) {
  try {
    await promise;
    expect.unreachable('expected DashboardError to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(DashboardError);
    if (error instanceof DashboardError) {
      expect(error.status).toBe(status);
      expect(error.message).toContain(messagePart);
    }
  }
}

describe('Phase 95: Parent dashboard server-side authorization', () => {
  it('rejects non-parent roles before any data is fetched', async () => {
    await expectDashboardError(
      getParentDashboardData(parentContext({ activeRole: RoleType.STUDENT })),
      403,
      'Parent role required',
    );
    await expectDashboardError(
      getParentDashboardData(parentContext({ activeRole: RoleType.FACULTY })),
      403,
      'Parent role required',
    );
    await expectDashboardError(
      getParentDashboardData(parentContext({ activeRole: RoleType.INSTITUTION_ADMIN })),
      403,
      'Parent role required',
    );
  });

  it('rejects a parent without a resolved guardian profile', async () => {
    await expectDashboardError(
      getParentDashboardData(parentContext({ guardianProfileId: undefined })),
      403,
      'Parent role required',
    );
  });

  it('returns guardian identity with the ward shown separately', async () => {
    const data = await getParentDashboardData(parentContext());
    expect(data.identity.name).toBe('Anita Verma');
    expect(data.identity.title).toBe('Parent / Guardian');
    // The guardian is never the student.
    expect(data.selectedStudent.name).toBe('Rohan Verma');
    expect(data.selectedStudent.name).not.toBe(data.identity.name);
  });

  it('lists all verified linked students and supports selection', async () => {
    const data = await getParentDashboardData(parentContext());
    expect(data.linkedStudents.map((s) => s.id).sort()).toEqual(['stu-meera', 'stu-rohan']);
    expect(data.selectedStudentId).toBe('stu-rohan'); // defaults to first link

    const meera = await getParentDashboardData(parentContext(), 'stu-meera');
    expect(meera.selectedStudent.name).toBe('Meera Menon');
    expect(meera.selectedStudent.programme).toBe('B.Tech Mechanical Engineering');
  });

  describe('Explicit guardian role-leakage negatives', () => {
    it('rejects a request for a student who is not linked to this guardian', async () => {
      await expectDashboardError(
        getParentDashboardData(parentContext(), 'stu-unrelated-999'),
        403,
        'not linked to this guardian',
      );
    });

    it('rejects a cross-tenant guardian before any ward data is fetched', async () => {
      await expectDashboardError(
        getParentDashboardData(parentContext({ tenantId: 'tenant-2' })),
        403,
        'guardian profile could not be resolved',
      );
    });

    it('only exposes published results — drafts are never queried', async () => {
      const data = await getParentDashboardData(parentContext());
      expect(data.selectedStudent.publishedResults.length).toBe(1);
      expect(data.selectedStudent.publishedResults[0].examinationName).toBe('Semester 3 Examination');
      // Draft results must not appear anywhere in the contract.
      expect(JSON.stringify(data)).not.toContain('draft');
    });

    it('returns real attendance and fee aggregates for the linked student only', async () => {
      const data = await getParentDashboardData(parentContext());
      expect(data.selectedStudent.attendance).toEqual({ present: 3, total: 4, percentage: 75 });
      expect(data.selectedStudent.feeSummary.totalInvoiced).toBe(300000);
      expect(data.selectedStudent.feeSummary.outstandingAmount).toBe(100000);
      expect(data.selectedStudent.feeSummary.status).toBe('PARTIAL');
    });

    it('does not expose other guardian families, staff data or tenant configuration', async () => {
      const data = await getParentDashboardData(parentContext());
      expect(data).not.toHaveProperty('otherFamilies');
      expect(data).not.toHaveProperty('staff');
      expect(data).not.toHaveProperty('tenantSettings');
      expect(data).not.toHaveProperty('internalDisciplinaryNotes');
      expect(data).not.toHaveProperty('draftResults');
    });
  });
});
