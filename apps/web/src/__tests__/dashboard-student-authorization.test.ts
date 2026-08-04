import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';
import type { ActiveUserContext } from '../lib/active-user-context';

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    // In-memory tenant-scoped fake that only ever returns rows for the tenant
    // and student id it was asked about.
    const rows = new Map<string, unknown[]>();
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
    expect(Array.isArray(data.notices)).toBe(true);
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
});
