import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';

const ASSIGNMENT_CS101 = '00000000-0010-0000-0000-000000000000';
const ASSIGNMENT_NOPE = '00000000-0010-0000-0000-0000000000ff';
const OFFERING_CS101 = '00000000-000c-0000-0000-000000000000';

const assignment = {
  id: ASSIGNMENT_CS101,
  courseOfferingId: OFFERING_CS101,
  title: 'Assignment 1: Fundamentals of Course',
  maxMarks: 100,
  courseOffering: {
    course: { code: 'CS-101', title: 'Data Structures and Algorithms' },
    faculty: { user: { name: 'Dr. Priya Sharma' } },
  },
};

type TestSession = { userId: string; tenantId: string; role: RoleType } | null;
let testSession: TestSession = null;
let tenantMatches = true;

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    const rows = tenantMatches;
    return {
      assignment: {
        findUnique: vi.fn(async ({ where }) => (rows && where.id === ASSIGNMENT_CS101 ? assignment : null)),
        findMany: vi.fn(async () => []),
      },
      courseOffering: {
        findFirst: vi.fn(async ({ where }) => {
          if (!rows) return null;
          if (where.id !== OFFERING_CS101) return null;
          if (where.facultyId !== undefined && where.facultyId !== 'staff-faculty-1') return null;
          return { id: OFFERING_CS101 };
        }),
        findMany: vi.fn(async () => []),
      },
      staff: { findUnique: vi.fn(async ({ where }) => (where.userId === 'user-faculty-1' ? { id: 'staff-faculty-1' } : null)) },
      student: { findUnique: vi.fn(async ({ where }) => (where.userId === 'user-student-1' ? { id: 'student-1' } : null)) },
      enrollment: {
        findFirst: vi.fn(async ({ where }) =>
          where.studentId === 'student-1' && where.courseOfferingId === OFFERING_CS101 ? { id: 'enroll-1' } : null,
        ),
        findMany: vi.fn(async () => []),
      },
    };
  },
}));

vi.mock('../lib/tenant-context', async () => {
  const { getTenantDb } = await import('../lib/db');
  return {
    requireTenantContext: vi.fn(async () => {
      if (!testSession) throw new Error('Unauthorized: No valid tenant context found in session.');
      return { db: getTenantDb(testSession.tenantId), session: testSession };
    }),
  };
});

import { requireAssignmentAccess, AssignmentAccessError } from '../lib/lms/gradebook-access';

async function expectAccessError(promise: Promise<unknown>, status: number, messagePart: string) {
  try {
    await promise;
    expect.unreachable('expected AssignmentAccessError to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(AssignmentAccessError);
    if (error instanceof AssignmentAccessError) {
      expect(error.status).toBe(status);
      expect(error.message).toContain(messagePart);
    }
  }
}

describe('Phase 98: assignment access authorization', () => {
  beforeEach(() => {
    testSession = null;
    tenantMatches = true;
  });

  it('throws 401 when no session exists', async () => {
    await expectAccessError(requireAssignmentAccess(ASSIGNMENT_CS101), 401, 'Authentication required');
  });

  it('lets an enrolled student access an assignment in their course', async () => {
    testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
    const access = await requireAssignmentAccess(ASSIGNMENT_CS101);
    expect(access.accessRole).toBe('STUDENT');
    expect(access.assignment.courseOffering.course.code).toBe('CS-101');
  });

  it('lets the assigned faculty access the assignment', async () => {
    testSession = { userId: 'user-faculty-1', tenantId: 'tenant-1', role: RoleType.FACULTY };
    const access = await requireAssignmentAccess(ASSIGNMENT_CS101);
    expect(access.accessRole).toBe('FACULTY');
  });

  it('lets privileged roles access any tenant assignment', async () => {
    testSession = { userId: 'user-admin-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
    const access = await requireAssignmentAccess(ASSIGNMENT_CS101);
    expect(access.accessRole).toBe('PRIVILEGED');
  });

  describe('Explicit Phase 98 permission negatives', () => {
    it('rejects a student who is not enrolled in the assignment course', async () => {
      testSession = { userId: 'user-student-2', tenantId: 'tenant-1', role: RoleType.STUDENT };
      await expectAccessError(requireAssignmentAccess(ASSIGNMENT_CS101), 403, 'not enrolled');
    });

    it('rejects a faculty member who does not teach the assignment course', async () => {
      testSession = { userId: 'user-faculty-2', tenantId: 'tenant-1', role: RoleType.FACULTY };
      await expectAccessError(requireAssignmentAccess(ASSIGNMENT_CS101), 403, 'not assigned');
    });

    it('returns 404 for a cross-tenant assignment (existence concealed)', async () => {
      tenantMatches = false;
      testSession = { userId: 'user-student-1', tenantId: 'tenant-2', role: RoleType.STUDENT };
      await expectAccessError(requireAssignmentAccess(ASSIGNMENT_CS101), 404, 'not available');
    });

    it('returns 404 when the assignment does not exist', async () => {
      testSession = { userId: 'user-admin-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
      await expectAccessError(requireAssignmentAccess(ASSIGNMENT_NOPE), 404, 'not available');
    });

    it('returns 404 for a malformed assignment id without touching the database', async () => {
      testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
      await expectAccessError(requireAssignmentAccess('not-a-uuid'), 404, 'not available');
    });

    it('never exposes other students through the access helper alone', async () => {
      testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
      const access = await requireAssignmentAccess(ASSIGNMENT_CS101);
      expect(access.assignment).not.toHaveProperty('submissions');
      expect(access.assignment).not.toHaveProperty('rubrics');
    });
  });
});
