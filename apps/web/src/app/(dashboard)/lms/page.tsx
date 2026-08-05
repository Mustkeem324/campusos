import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../../../lib/tenant-context';
import { PageHeader } from '../../../components/layout/PageHeader';
import { BookOpen, Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

const PRIVILEGED_ROLES: RoleType[] = [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR];

/**
 * LMS home — server component (Phase 97).
 *
 * Lists only the courses the authenticated user is authorised to access,
 * resolved server-side with tenant scope:
 *   - STUDENT → enrolled offerings
 *   - FACULTY → taught offerings
 *   - privileged roles → all tenant offerings
 */
export default async function LMSHomePage() {
  let context;
  try {
    context = await requireTenantContext();
  } catch {
    redirect('/login');
  }

  const { db, session } = context;
  const tenantId = session.tenantId;

  const select = {
    id: true,
    courseId: true,
    course: { select: { code: true, title: true } },
    faculty: { select: { user: { select: { name: true } } } },
    section: { select: { name: true } },
    term: { select: { name: true } },
    _count: { select: { CourseModule: true, enrollments: true } },
  } as const;

  let courses: Array<{
    id: string;
    courseId: string;
    course: { code: string; title: string };
    faculty: { user: { name: string } };
    section: { name: string } | null;
    term: { name: string };
    _count: { CourseModule: number; enrollments: number };
  }> = [];

  if (PRIVILEGED_ROLES.includes(session.role)) {
    courses = await db.courseOffering.findMany({ where: { tenantId }, orderBy: { id: 'asc' }, select });
  } else if (session.role === RoleType.FACULTY) {
    const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (staff) {
      courses = await db.courseOffering.findMany({ where: { tenantId, facultyId: staff.id }, orderBy: { id: 'asc' }, select });
    }
  } else if (session.role === RoleType.STUDENT) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (student) {
      const enrollments = await db.enrollment.findMany({
        where: { studentId: student.id, tenantId },
        select: { courseOffering: { select } },
      });
      courses = enrollments.map((enrollment) => enrollment.courseOffering);
    }
  }

  const heading =
    session.role === RoleType.STUDENT ? 'My courses' : session.role === RoleType.FACULTY ? 'Courses I teach' : 'All course offerings';

  return (
    <div className="space-y-6">
      <PageHeader title="Learning (LMS)" description={heading} />

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <BookOpen className="mx-auto h-8 w-8 text-text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-text-primary">No courses are available for your account yet.</p>
          <p className="mt-1 text-xs text-text-secondary">
            {session.role === RoleType.STUDENT
              ? 'Courses you are enrolled in will appear here once registrations are confirmed.'
              : session.role === RoleType.FACULTY
                ? 'Offerings assigned to you will appear here.'
                : 'No course offerings exist for this institution yet.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/learning/courses/${encodeURIComponent(course.courseId)}`}
              className="group flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {course.course.code}
                </span>
                <span className="text-[11px] font-medium text-text-muted">{course.term.name}</span>
              </div>
              <h2 className="mt-3 text-base font-bold text-text-primary group-hover:text-primary">{course.course.title}</h2>
              <p className="mt-1 text-xs text-text-secondary">Instructor: {course.faculty.user.name}</p>
              <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" aria-hidden="true" /> {course._count.CourseModule} modules
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" /> {course._count.enrollments} students
                </span>
                {course.section && <span className="ml-auto">{course.section.name}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
