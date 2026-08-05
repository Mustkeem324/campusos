import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';

const COURSE_CS101 = '00000000-000b-0000-0000-000000000000';
const COURSE_NOPE = '00000000-000b-0000-0000-0000000000ff';

const offering = {
  id: '00000000-000c-0000-0000-000000000000',
  courseId: COURSE_CS101,
  facultyId: 'staff-faculty-1',
  course: { code: 'CS-101', title: 'Data Structures and Algorithms' },
  faculty: { user: { name: 'Dr. Priya Sharma' } },
};

type TestSession = { userId: string; tenantId: string; role: RoleType } | null;
let testSession: TestSession = null;
let tenantMatches = true;

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    const rows = tenantMatches;
    return {
      courseOffering: {
        findFirst: vi.fn(async ({ where }) => (rows && where.courseId === offering.courseId ? offering : null)),
        findUnique: vi.fn(async () => (rows ? { ...offering, CourseModule: [], assignments: [], Quiz: [] } : null)),
        findMany: vi.fn(async ({ where }) => {
          if (!rows) return [];
          if (where.facultyId) return where.facultyId === offering.facultyId ? [offering] : [];
          return [offering];
        }),
      },
      staff: { findUnique: vi.fn(async ({ where }) => (where.userId === 'user-faculty-1' ? { id: 'staff-faculty-1' } : null)) },
      student: { findUnique: vi.fn(async ({ where }) => (where.userId === 'user-student-1' ? { id: 'student-1' } : null)) },
      enrollment: {
        findFirst: vi.fn(async ({ where }) => (where.studentId === 'student-1' && where.courseOfferingId === offering.id ? { id: 'enroll-1' } : null)),
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

import { requireCourseAccess, CourseAccessError } from '../lib/lms/course-access';

async function expectAccessError(promise: Promise<unknown>, status: number, messagePart: string) {
  try {
    await promise;
    expect.unreachable('expected CourseAccessError to be thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(CourseAccessError);
    if (error instanceof CourseAccessError) {
      expect(error.status).toBe(status);
      expect(error.message).toContain(messagePart);
    }
  }
}

describe('Phase 97: LMS course access authorization', () => {
  beforeEach(() => {
    testSession = null;
    tenantMatches = true;
  });

  it('throws 401 when no session exists', async () => {
    await expectAccessError(requireCourseAccess(COURSE_CS101), 401, 'Authentication required');
  });

  it('lets an enrolled student access their course', async () => {
    testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
    const access = await requireCourseAccess(COURSE_CS101);
    expect(access.accessRole).toBe('STUDENT');
    expect(access.offering.course.code).toBe('CS-101');
  });

  it('lets the assigned faculty access the course they teach', async () => {
    testSession = { userId: 'user-faculty-1', tenantId: 'tenant-1', role: RoleType.FACULTY };
    const access = await requireCourseAccess(COURSE_CS101);
    expect(access.accessRole).toBe('FACULTY');
  });

  it('lets privileged roles access any tenant course', async () => {
    testSession = { userId: 'user-admin-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
    const access = await requireCourseAccess(COURSE_CS101);
    expect(access.accessRole).toBe('PRIVILEGED');
  });

  describe('Explicit Phase 97 permission negatives', () => {
    it('rejects a student who is not enrolled in the course', async () => {
      testSession = { userId: 'user-student-2', tenantId: 'tenant-1', role: RoleType.STUDENT };
      await expectAccessError(requireCourseAccess(COURSE_CS101), 403, 'not enrolled');
    });

    it('rejects a faculty member who does not teach the course', async () => {
      testSession = { userId: 'user-faculty-2', tenantId: 'tenant-1', role: RoleType.FACULTY };
      await expectAccessError(requireCourseAccess(COURSE_CS101), 403, 'not enrolled');
    });

    it('returns 404 for a cross-tenant course (existence concealed)', async () => {
      tenantMatches = false;
      testSession = { userId: 'user-student-1', tenantId: 'tenant-2', role: RoleType.STUDENT };
      await expectAccessError(requireCourseAccess(COURSE_CS101), 404, 'not available');
    });

    it('returns 404 when the course does not exist', async () => {
      testSession = { userId: 'user-admin-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
      await expectAccessError(requireCourseAccess(COURSE_NOPE), 404, 'not available');
    });

    it('returns 404 for a malformed course id without touching the database', async () => {
      testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
      await expectAccessError(requireCourseAccess('not-a-uuid'), 404, 'not available');
    });

    it('never exposes module/lesson content through the access helper alone', async () => {
      testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
      const access = await requireCourseAccess(COURSE_CS101);
      expect(access.offering).not.toHaveProperty('CourseModule');
      expect(access.offering).not.toHaveProperty('contentBody');
    });
  });
});
