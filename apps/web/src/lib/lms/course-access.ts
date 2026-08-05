import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../tenant-context';

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

const PRIVILEGED_ROLES: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR];

/**
 * Server-side course permission gate (Phase 97).
 *
 * Resolves the authenticated session → active tenant → course offering, then
 * verifies the caller's relationship to that offering:
 *   - STUDENT must hold an enrollment in the offering
 *   - FACULTY/STAFF must be the offering's assigned faculty
 *   - SUPER_ADMIN / INSTITUTION_ADMIN / REGISTRAR are privileged
 *
 * Throws a typed CourseAccessError (401 unauthenticated, 403 unauthorised,
 * 404 concealed) so API routes never leak whether a course exists.
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  const offering = await db.courseOffering.findFirst({
    where: { courseId },
    orderBy: { id: 'asc' },
    select: {
      id: true,
      courseId: true,
      facultyId: true,
      course: { select: { code: true, title: true } },
      faculty: { select: { user: { select: { name: true } } } },
    },
  });

  // 404 (not 403) when the course is not visible: we do not confirm existence
  // of courses the caller cannot access.
  if (!offering) {
    throw new CourseAccessError(404, 'This course is not available.');
  }

  if (PRIVILEGED_ROLES.includes(session.role)) {
    return { ...context, offering, accessRole: 'PRIVILEGED' };
  }

  const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (staff && staff.id === offering.facultyId) {
    return { ...context, offering, accessRole: 'FACULTY' };
  }

  const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
  if (student) {
    const enrollment = await db.enrollment.findFirst({
      where: { studentId: student.id, courseOfferingId: offering.id },
      select: { id: true },
    });
    if (enrollment) {
      return { ...context, offering, accessRole: 'STUDENT' };
    }
  }

  throw new CourseAccessError(403, 'You are not enrolled in this course.');
}
