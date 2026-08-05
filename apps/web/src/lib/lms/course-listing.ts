import { RoleType } from '@prisma/client';

export const PRIVILEGED_ROLES: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR];

export const COURSE_LISTING_SELECT = {
  id: true,
  courseId: true,
  capacity: true,
  course: { select: { code: true, title: true } },
  faculty: { select: { user: { select: { name: true } } } },
  section: { select: { name: true } },
  term: { select: { name: true } },
  _count: { select: { CourseModule: true, enrollments: true } },
} as const;

export type CourseListingItem = {
  id: string;
  courseId: string;
  capacity: number;
  course: { code: string; title: string };
  faculty: { user: { name: string } };
  section: { name: string } | null;
  term: { name: string };
  _count: { CourseModule: number; enrollments: number };
};

type CourseOfferingDelegate = {
  findMany(args: { where: object; orderBy: object; select: typeof COURSE_LISTING_SELECT }): Promise<CourseListingItem[]>;
};
type StaffDelegate = { findUnique(args: { where: { userId: string }; select: { id: true } }): Promise<{ id: string } | null> };
type StudentDelegate = { findUnique(args: { where: { userId: string }; select: { id: true } }): Promise<{ id: string } | null> };
type EnrollmentDelegate = {
  findMany(args: {
    where: { studentId: string; tenantId: string };
    select: { courseOffering: { select: typeof COURSE_LISTING_SELECT } };
  }): Promise<Array<{ courseOffering: CourseListingItem }>>;
};

export type CourseListingDb = {
  courseOffering: CourseOfferingDelegate;
  staff: StaffDelegate;
  student: StudentDelegate;
  enrollment: EnrollmentDelegate;
};

export type CourseListingContext = {
  db: CourseListingDb;
  session: {
    userId: string;
    tenantId: string;
    role: RoleType;
  };
};

/**
 * Shared role-aware course listing resolver (Phase 97).
 *
 * Returns only the offerings the authenticated user is authorised to see,
 * fully tenant-scoped:
 *   - STUDENT → offerings the student is enrolled in
 *   - FACULTY → offerings the faculty member teaches
 *   - SUPER_ADMIN / INSTITUTION_ADMIN / REGISTRAR → all tenant offerings
 *
 * Used by both GET /api/learning/courses and the /lms server page so the
 * two surfaces can never drift apart again (they already did once: the API
 * omitted courseId while the page included it, breaking drill-down).
 */
export async function resolveAuthorisedCourses(context: CourseListingContext): Promise<CourseListingItem[]> {
  const { db, session } = context;
  const tenantId = session.tenantId;

  if (PRIVILEGED_ROLES.includes(session.role)) {
    return db.courseOffering.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, select: COURSE_LISTING_SELECT });
  }

  if (session.role === RoleType.FACULTY) {
    const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!staff) {
      return [];
    }
    return db.courseOffering.findMany({ where: { tenantId, facultyId: staff.id }, orderBy: { id: 'asc' }, select: COURSE_LISTING_SELECT });
  }

  if (session.role === RoleType.STUDENT) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (!student) {
      return [];
    }
    const enrollments = await db.enrollment.findMany({
      where: { studentId: student.id, tenantId },
      select: { courseOffering: { select: COURSE_LISTING_SELECT } },
    });
    return enrollments.map((enrollment) => enrollment.courseOffering);
  }

  return [];
}
