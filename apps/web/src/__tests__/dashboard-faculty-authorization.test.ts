import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';
import type { ActiveUserContext } from '../lib/active-user-context';

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    // In-memory tenant-scoped fake. Only returns data when the caller is in
    // tenant-1 with staff id staff-1 and user user-faculty-1. The two taught
    // offerings carry real aggregates; everything else is empty.
    return {
      staff: {
        findFirst: vi.fn(async ({ where }: { where: { id: string; userId: string; tenantId: string } }) => {
          if (where.tenantId !== 'tenant-1' || where.id !== 'staff-1' || where.userId !== 'user-faculty-1') return null;
          return {
            id: 'staff-1',
            userId: 'user-faculty-1',
            tenantId: 'tenant-1',
            designation: 'Professor',
            departmentId: 'dept-1',
            user: { name: 'Dr. Priya Sharma', email: 'faculty.demo@campusos.local' },
          };
        }),
      },
      user: {
        findUnique: vi.fn(async () => ({ name: 'Dr. Priya Sharma', email: 'faculty.demo@campusos.local' })),
      },
      courseOffering: {
        findMany: vi.fn(async ({ where }: { where: { tenantId: string; facultyId: string } }) => {
          if (where.tenantId !== 'tenant-1' || where.facultyId !== 'staff-1') return [];
          return [
            {
              id: 'offering-1',
              course: { code: 'CS-101', title: 'Data Structures and Algorithms' },
              section: { name: 'Section A' },
              term: { name: 'Fall Semester 2026' },
              _count: { enrollments: 25, assignments: 3 },
              assignments: [
                { id: 'a1', submissions: [{ id: 's1' }] },
                { id: 'a2', submissions: [] },
              ],
            },
          ];
        }),
      },
      timetableSlot: { findMany: vi.fn(async () => []) },
      submission: { count: vi.fn(async () => 1) },
      attendanceSession: { findMany: vi.fn(async () => []) },
      auditLog: { findMany: vi.fn(async () => []) },
    };
  },
}));

import { getFacultyDashboardData } from '../lib/dashboard/faculty';
import { DashboardError } from '../lib/dashboard/errors';

function facultyContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: 'user-faculty-1',
    tenantId: 'tenant-1',
    activeRole: RoleType.FACULTY,
    roleAssignmentId: 'ra-1',
    staffProfileId: 'staff-1',
    departmentId: 'dept-1',
    permissions: [],
    ...overrides,
  };
}

describe('Faculty dashboard server-side authorization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects non-faculty roles before any data is fetched', async () => {
    await expect(
      getFacultyDashboardData(facultyContext({ activeRole: RoleType.STUDENT, staffProfileId: undefined })),
    ).rejects.toThrow('Unauthorized');
  });

  it('rejects when the staff profile id is missing', async () => {
    await expect(getFacultyDashboardData(facultyContext({ staffProfileId: undefined }))).rejects.toThrow('Unauthorized');
  });

  it('rejects a cross-tenant staff profile before fetching data', async () => {
    await expect(getFacultyDashboardData(facultyContext({ tenantId: 'tenant-2' }))).rejects.toThrow('profile could not be resolved');
  });

  it('throws a typed 403 DashboardError for role rejection', async () => {
    try {
      await getFacultyDashboardData(facultyContext({ activeRole: RoleType.PARENT, staffProfileId: undefined }));
      expect.unreachable('expected DashboardError');
    } catch (error) {
      expect(error).toBeInstanceOf(DashboardError);
      if (error instanceof DashboardError) expect(error.status).toBe(403);
    }
  });

  it('returns a typed contract with only authorised faculty fields', async () => {
    const data = await getFacultyDashboardData(facultyContext());
    expect(data.role).toBe('FACULTY');
    expect(data.identity.name).toBe('Dr. Priya Sharma');
    expect(data.identity.designation).toBe('Professor');

    // Identity is the authenticated faculty persona — never a student.
    expect(data.identity.id).toBe('user-faculty-1');
    expect(data).not.toHaveProperty('studentIdentity');

    // Real assigned courses with real aggregates.
    expect(data.assignedCourses.length).toBe(1);
    expect(data.assignedCourses[0].code).toBe('CS-101');
    expect(data.assignedCourses[0].studentCount).toBe(25);
    expect(data.assignedCourses[0].assignmentCount).toBe(3);
    expect(data.assignedCourses[0].ungradedSubmissionCount).toBe(1);

    expect(Array.isArray(data.todayClasses)).toBe(true);
    expect(Array.isArray(data.metrics)).toBe(true);
    expect(Array.isArray(data.riskAlerts)).toBe(true);
    expect(Array.isArray(data.quickActions)).toBe(true);
    expect(Array.isArray(data.recentActivity)).toBe(true);
  });

  it('quick actions come from the registry and resolve to real routes', async () => {
    const data = await getFacultyDashboardData(facultyContext());
    expect(data.quickActions.length).toBeGreaterThan(0);
    for (const action of data.quickActions) {
      expect(action.href).not.toBe('#');
      expect(action.href).toMatch(/^\//);
    }
  });

  describe('Explicit role-leakage negatives', () => {
    it('does not expose admin/settings or tenant-configuration data', async () => {
      const data = await getFacultyDashboardData(facultyContext());
      expect(data).not.toHaveProperty('tenantConfiguration');
      expect(data).not.toHaveProperty('users');
      expect(data).not.toHaveProperty('accessRequests');
      expect(data).not.toHaveProperty('roleManagement');
      expect(data).not.toHaveProperty('integrationStatus');
    });

    it('does not expose finance reconciliation or payroll data', async () => {
      const data = await getFacultyDashboardData(facultyContext());
      expect(data).not.toHaveProperty('reconciliationQueue');
      expect(data).not.toHaveProperty('refunds');
      expect(data).not.toHaveProperty('concessions');
      expect(data).not.toHaveProperty('payroll');
      expect(data).not.toHaveProperty('paymentSettlements');
    });

    it('does not expose institution-wide student directories or leadership analytics', async () => {
      const data = await getFacultyDashboardData(facultyContext());
      expect(data).not.toHaveProperty('studentDirectory');
      expect(data).not.toHaveProperty('institutionAnalytics');
      expect(data).not.toHaveProperty('financialHealth');
      expect(data).not.toHaveProperty('admissionsFunnel');
    });

    it('only surfaces the courses the faculty member actually teaches', async () => {
      const data = await getFacultyDashboardData(facultyContext());
      for (const course of data.assignedCourses) {
        expect(course.code).toBe('CS-101'); // the fake only returns taught offerings
      }
      expect(data.assignedCourses.every((course) => course.code === 'CS-101')).toBe(true);
    });
  });
});
