import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../tenant-context';
import { PRIVILEGED_ROLES } from './course-listing';

export class AssignmentAccessError extends Error {
  constructor(
    public readonly status: 401 | 403 | 404,
    message: string,
  ) {
    super(message);
    this.name = 'AssignmentAccessError';
  }
}

export type AssignmentAccessContext = Awaited<ReturnType<typeof requireTenantContext>>;
export type AssignmentAccessRole = 'STUDENT' | 'FACULTY' | 'PRIVILEGED';

export type AssignmentAccess = AssignmentAccessContext & {
  assignment: {
    id: string;
    courseOfferingId: string;
    title: string;
    maxMarks: number;
    courseOffering: {
      course: { code: string; title: string };
      faculty: { user: { name: string } };
    };
  };
  accessRole: AssignmentAccessRole;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ASSIGNMENT_SELECT = {
  id: true,
  courseOfferingId: true,
  title: true,
  maxMarks: true,
  courseOffering: {
    select: {
      course: { select: { code: true, title: true } },
      faculty: { select: { user: { select: { name: true } } } },
    },
  },
} as const;

/**
 * Server-side assignment permission gate (Phase 98).
 *
 * Resolves the authenticated session → active tenant → the caller's real
 * relationship to the assignment's course offering:
 *   - STUDENT → must hold an enrollment in the offering
 *   - FACULTY → must be the offering's assigned faculty
 *   - SUPER_ADMIN / INSTITUTION_ADMIN / REGISTRAR → privileged
 *
 * The assignment is always resolved through its tenant-scoped offering.
 * Throws a typed AssignmentAccessError (401/403/404, existence concealed).
 */
export async function requireAssignmentAccess(assignmentId: string): Promise<AssignmentAccess> {
  let context: AssignmentAccessContext;
  try {
    context = await requireTenantContext();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '';
    if (message.startsWith('Unauthorized')) {
      throw new AssignmentAccessError(401, 'Authentication required.');
    }
    throw error;
  }
  const { db, session } = context;

  if (!UUID_RE.test(assignmentId)) {
    throw new AssignmentAccessError(404, 'This assignment is not available.');
  }

  const assignment = await db.assignment.findUnique({
    where: { id: assignmentId },
    select: ASSIGNMENT_SELECT,
  });
  if (!assignment) {
    throw new AssignmentAccessError(404, 'This assignment is not available.');
  }
  const offeringId = assignment.courseOfferingId;

  if (PRIVILEGED_ROLES.includes(session.role)) {
    return { ...context, assignment, accessRole: 'PRIVILEGED' };
  }

  if (session.role === RoleType.FACULTY) {
    const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (staff) {
      const teaching = await db.courseOffering.findFirst({
        where: { id: offeringId, facultyId: staff.id },
        select: { id: true },
      });
      if (teaching) {
        return { ...context, assignment, accessRole: 'FACULTY' };
      }
    }
    throw new AssignmentAccessError(403, 'You are not assigned to teach this course.');
  }

  if (session.role === RoleType.STUDENT) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (student) {
      const enrollment = await db.enrollment.findFirst({
        where: { studentId: student.id, courseOfferingId: offeringId },
        select: { id: true },
      });
      if (enrollment) {
        return { ...context, assignment, accessRole: 'STUDENT' };
      }
    }
    throw new AssignmentAccessError(403, 'You are not enrolled in this course.');
  }

  throw new AssignmentAccessError(403, 'Your role cannot access this assignment.');
}
