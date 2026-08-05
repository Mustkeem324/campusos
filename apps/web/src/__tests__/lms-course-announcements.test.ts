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
let lastCreateData: { title: string; content: string; authorId: string | null; isPinned: boolean } | null = null;

vi.mock('../lib/db', () => ({
  getTenantDb: (tenantId: string) => {
    const rows = tenantMatches;
    return {
      courseOffering: {
        findFirst: vi.fn(async ({ where }: { where: { courseId: string; facultyId?: string } }) => {
          if (!rows || where.courseId !== offering.courseId) return null;
          if (where.facultyId !== undefined && where.facultyId !== offering.facultyId) return null;
          return offering;
        }),
        findMany: vi.fn(async ({ where }: { where: { facultyId?: string } }) => {
          if (!rows) return [];
          if (where.facultyId) return where.facultyId === offering.facultyId ? [offering] : [];
          return [offering];
        }),
      },
      staff: {
        findUnique: vi.fn(async ({ where }: { where: { userId: string } }) =>
          where.userId === 'user-faculty-1' ? { id: 'staff-faculty-1' } : null,
        ),
      },
      student: {
        findUnique: vi.fn(async ({ where }: { where: { userId: string } }) =>
          where.userId === 'user-student-1' ? { id: 'student-1' } : null,
        ),
      },
      enrollment: {
        findFirst: vi.fn(async ({ where }: { where: { studentId: string; courseOffering?: { courseId: string } } }) =>
          where.studentId === 'student-1' && where.courseOffering?.courseId === offering.courseId
            ? { courseOffering: offering }
            : null,
        ),
      },
      courseAnnouncement: {
        create: vi.fn(async ({ data }: { data: { title: string; content: string; authorId: string | null; isPinned: boolean } }) => {
          lastCreateData = data;
          return {
            id: 'announcement-1',
            title: data.title,
            content: data.content,
            isPinned: data.isPinned ?? false,
            createdAt: new Date('2026-08-01T00:00:00Z'),
            author: data.authorId ? { user: { name: 'Dr. Priya Sharma' } } : null,
          };
        }),
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
import {
  createCourseAnnouncement,
  sanitizeAnnouncementField,
  CourseAnnouncementPermissionError,
  CourseAnnouncementValidationError,
} from '../lib/lms/course-announcements';

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

describe('Phase 99: course announcement authorization', () => {
  beforeEach(() => {
    testSession = null;
    tenantMatches = true;
    lastCreateData = null;
  });

  it('throws 401 when no session exists', async () => {
    await expectAccessError(requireCourseAccess(COURSE_CS101), 401, 'Authentication required');
  });

  it('rejects a student posting an announcement (permission error)', async () => {
    testSession = { userId: 'user-student-1', tenantId: 'tenant-1', role: RoleType.STUDENT };
    const access = await requireCourseAccess(COURSE_CS101);
    await expect(createCourseAnnouncement(access, { title: 'Update', content: 'Details' })).rejects.toBeInstanceOf(
      CourseAnnouncementPermissionError,
    );
    expect(lastCreateData).toBeNull();
  });

  it('lets the assigned faculty post with their staff id as author', async () => {
    testSession = { userId: 'user-faculty-1', tenantId: 'tenant-1', role: RoleType.FACULTY };
    const access = await requireCourseAccess(COURSE_CS101);
    const created = await createCourseAnnouncement(access, { title: '  Class update  ', content: ' Please review module one. ' });
    expect(created.title).toBe('Class update');
    expect(lastCreateData).toMatchObject({
      title: 'Class update',
      content: 'Please review module one.',
      authorId: 'staff-faculty-1',
      courseOfferingId: offering.id,
      tenantId: 'tenant-1',
      isPinned: false,
    });
  });

  it('lets a privileged admin post with a null author when no staff profile exists', async () => {
    testSession = { userId: 'user-admin-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
    const access = await requireCourseAccess(COURSE_CS101);
    const created = await createCourseAnnouncement(access, { title: 'Admin notice', content: 'Institutional update.' });
    expect(created.author).toBeNull();
    expect(lastCreateData?.authorId).toBeNull();
  });

  it('attributes a privileged author who holds a tenant staff profile', async () => {
    testSession = { userId: 'user-faculty-1', tenantId: 'tenant-1', role: RoleType.INSTITUTION_ADMIN };
    const access = await requireCourseAccess(COURSE_CS101);
    const created = await createCourseAnnouncement(access, { title: 'Admin update', content: 'From a staff profile.' });
    expect(created.author?.user.name).toBe('Dr. Priya Sharma');
    expect(lastCreateData?.authorId).toBe('staff-faculty-1');
  });

  it('rejects a faculty member who does not teach the course', async () => {
    testSession = { userId: 'user-faculty-2', tenantId: 'tenant-1', role: RoleType.FACULTY };
    await expectAccessError(requireCourseAccess(COURSE_CS101), 403, 'not assigned');
  });

  it('returns 404 for a cross-tenant course (existence concealed)', async () => {
    tenantMatches = false;
    testSession = { userId: 'user-faculty-1', tenantId: 'tenant-2', role: RoleType.FACULTY };
    await expectAccessError(requireCourseAccess(COURSE_CS101), 404, 'not available');
  });

  describe('validation', () => {
    it('rejects an empty title', async () => {
      testSession = { userId: 'user-faculty-1', tenantId: 'tenant-1', role: RoleType.FACULTY };
      const access = await requireCourseAccess(COURSE_CS101);
      await expect(createCourseAnnouncement(access, { title: '   ', content: 'Body' })).rejects.toBeInstanceOf(
        CourseAnnouncementValidationError,
      );
    });

    it('rejects a title over the length limit', async () => {
      expect(() => sanitizeAnnouncementField('x'.repeat(121), 120)).toThrow(CourseAnnouncementValidationError);
    });

    it('rejects content over the length limit', async () => {
      testSession = { userId: 'user-faculty-1', tenantId: 'tenant-1', role: RoleType.FACULTY };
      const access = await requireCourseAccess(COURSE_CS101);
      await expect(createCourseAnnouncement(access, { title: 'Title', content: 'y'.repeat(2001) })).rejects.toBeInstanceOf(
        CourseAnnouncementValidationError,
      );
    });

    it('rejects control characters in titles (header injection)', () => {
      expect(() => sanitizeAnnouncementField('Hello\u0007X-Injected', 120)).toThrow(CourseAnnouncementValidationError);
      expect(() => sanitizeAnnouncementField('Hello\r\nX-Injected: true', 120)).toThrow(CourseAnnouncementValidationError);
    });

    it('allows newlines in message content but rejects other control characters', () => {
      expect(sanitizeAnnouncementField('Line one\r\nLine two', 2000, true)).toBe('Line one\nLine two');
      expect(() => sanitizeAnnouncementField('Bad\u001bESC', 2000, true)).toThrow(CourseAnnouncementValidationError);
    });

    it('trims whitespace from valid fields', () => {
      expect(sanitizeAnnouncementField('  Welcome  ', 120)).toBe('Welcome');
    });
  });
});
