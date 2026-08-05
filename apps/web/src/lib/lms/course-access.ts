import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../tenant-context';
import { COURSE_LISTING_SELECT, PRIVILEGED_ROLES, resolveAuthorisedCourses } from './course-listing';

export class CourseAccessError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = 'CourseAccessError';
  }
}

export type CourseAccessContext = Awaited<ReturnType<typeof requireTenantContext>>;
export type CourseAccessRole = 'STUDENT' | 'FACULTY' | 'PRIVILEGED';

export type CourseAccess = CourseAccessContext & {
  offering: {
    id: string;
    courseId: string;
    facultyId: string;
    course: { code: string; title: string };
    faculty: { user: { name: string } };
  };
  accessRole: CourseAccessRole;
};

const OFFERING_SELECT = {
  id: true,
  courseId: true,
  facultyId: true,
  course: { select: { code: true, title: true } },
  faculty: { select: { user: { select: { name: true } } } },
} as const;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Server-side course permission gate (Phase 97).
 *
 * Resolves the authenticated session → active tenant → the caller's real
 * relationship to a course, then serves that exact offering:
 *   - STUDENT → the offering the student is actually enrolled in
 *   - FACULTY → the offering the faculty member actually teaches
 *   - SUPER_ADMIN / INSTITUTION_ADMIN / REGISTRAR → the tenant offering
 *
 * The offering is resolved through the caller's relationship (never by
 * first-match courseId) so that a student enrolled in one section can never
 * be authorised against another section's offering content, and is never
 * falsely denied when multiple offerings exist for the same course.
 *
 * Throws a typed CourseAccessError (401 unauthenticated, 403 unauthorised,
 * 404 concealed) so API routes never leak whether a course exists.
 */
export async function requireCourseAccess(courseId: string): Promise<CourseAccess> {
  let context: CourseAccessContext;
  try {
    context = await requireTenantContext();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Unauthorized')) {
      throw new CourseAccessError(401, 'Authentication required.');
    }
    throw error;
  }
  const { db, session } = context;

  // Reject malformed identifiers before hitting the database so a bad id
  // cannot surface a Prisma validation error (500). Conceal with 404.
  if (!UUID_RE.test(courseId)) {
    throw new CourseAccessError(404, 'This course is not available.');
  }

  // Existence probe: any offering of this course within the active tenant.
  // 404 (not 403) when the course is not visible: we do not confirm existence
  // of courses the caller cannot access.
  const exists = await db.courseOffering.findFirst({
    where: { courseId },
    select: { id: true },
  });
  if (!exists) {
    throw new CourseAccessError(404, 'This course is not available.');
  }

  if (PRIVILEGED_ROLES.includes(session.role)) {
    const offering = await db.courseOffering.findFirst({
      where: { courseId },
      orderBy: { id: 'asc' },
      select: OFFERING_SELECT,
    });
    if (!offering) {
      throw new CourseAccessError(404, 'This course is not available.');
    }
    return { ...context, offering, accessRole: 'PRIVILEGED' };
  }

  // FACULTY: resolve through the offering the caller actually teaches.
  if (session.role === RoleType.FACULTY) {
    const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (staff) {
      const taught = await db.courseOffering.findFirst({
        where: { courseId, facultyId: staff.id },
        orderBy: { id: 'asc' },
        select: OFFERING_SELECT,
      });
      if (taught) {
        return { ...context, offering: taught, accessRole: 'FACULTY' };
      }
    }
    throw new CourseAccessError(403, 'You are not assigned to teach this course.');
  }

  // STUDENT: resolve through the offering the caller is actually enrolled in.
  if (session.role === RoleType.STUDENT) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (student) {
      const enrollment = await db.enrollment.findFirst({
        where: { studentId: student.id, courseOffering: { courseId } },
        select: { courseOffering: { select: OFFERING_SELECT } },
      });
      if (enrollment) {
        return { ...context, offering: enrollment.courseOffering, accessRole: 'STUDENT' };
      }
    }
    throw new CourseAccessError(403, 'You are not enrolled in this course.');
  }

  throw new CourseAccessError(403, 'Your role cannot access this course.');
}

export { PRIVILEGED_ROLES, resolveAuthorisedCourses, COURSE_LISTING_SELECT };
