import Link from 'next/link';
import { redirect } from 'next/navigation';
import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../../../lib/tenant-context';
import { PRIVILEGED_ROLES } from '../../../lib/lms/course-listing';
import { PageHeader } from '../../../components/layout/PageHeader';
import { CalendarDays, CheckCircle2, ClipboardList } from 'lucide-react';

export const dynamic = 'force-dynamic';

/**
 * Assignments — server component (Phase 98).
 *
 * Lists only the assignments the authenticated user is authorised to see,
 * resolved server-side with tenant scope:
 *   - STUDENT → assignments across enrolled courses with own submission status
 *   - FACULTY → assignments across taught courses with submission counts
 *   - privileged → all tenant assignments
 */
export default async function AssignmentsPage() {
  let context;
  try {
    context = await requireTenantContext();
  } catch {
    redirect('/login');
  }
  const { db, session } = context;
  const tenantId = session.tenantId;

  type AssignmentRow = {
    id: string;
    title: string;
    description: string;
    dueDate: Date;
    maxMarks: number;
    courseOffering: { courseId: string; course: { code: string; title: string } };
    submissions: { id: string; submittedAt: Date; marksObtained: number | null }[];
    _count: { submissions: number };
  };

  let rows: AssignmentRow[] = [];

  if (PRIVILEGED_ROLES.includes(session.role)) {
    rows = await db.assignment.findMany({
      where: { tenantId },
      orderBy: { dueDate: 'asc' },
      select: assignmentSelect,
    });
  } else if (session.role === RoleType.FACULTY) {
    const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (staff) {
      rows = await db.assignment.findMany({
        where: { tenantId, courseOffering: { facultyId: staff.id } },
        orderBy: { dueDate: 'asc' },
        select: assignmentSelect,
      });
    }
  } else if (session.role === RoleType.STUDENT) {
    const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true } });
    if (student) {
      // All assignments across the student's enrolled courses — including
      // ones not yet submitted, so the submission-status states are reachable.
      rows = await db.assignment.findMany({
        where: { tenantId, courseOffering: { enrollments: { some: { studentId: student.id } } } },
        orderBy: { dueDate: 'asc' },
        select: { ...assignmentSelect, submissions: { where: { studentId: student.id }, take: 1 } },
      });
    }
  }

  const heading =
    session.role === RoleType.STUDENT ? 'Your assignments across enrolled courses' : session.role === RoleType.FACULTY ? 'Assignments in courses you teach' : 'All tenant assignments';

  return (
    <div className="space-y-6">
      <PageHeader title="Assignments" description={heading} />

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-white p-8 text-center shadow-sm">
          <ClipboardList className="mx-auto h-8 w-8 text-text-muted" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-text-primary">No assignments are available for your account yet.</p>
          <p className="mt-1 text-xs text-text-secondary">Assignments will appear here once they are published for your courses.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => {
            const mine = row.submissions[0];
            const isGraded = mine?.marksObtained !== null && mine?.marksObtained !== undefined;
            return (
              <Link
                key={row.id}
                href={`/learning/courses/${encodeURIComponent(row.courseOffering.courseId)}`}
                className="group flex flex-col rounded-2xl border border-border bg-white p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {row.courseOffering.course.code}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-text-muted">
                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" /> Due {formatDate(row.dueDate)}
                  </span>
                </div>
                <h2 className="mt-3 text-base font-bold text-text-primary group-hover:text-primary">{row.title}</h2>
                <p className="mt-1 line-clamp-2 text-xs text-text-secondary">{row.description}</p>
                <div className="mt-4 flex items-center gap-4 border-t border-border pt-3 text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{row.maxMarks} marks</span>
                  {session.role === RoleType.STUDENT ? (
                    mine ? (
                      <span className={`flex items-center gap-1.5 font-medium ${isGraded ? 'text-success' : 'text-text-secondary'}`}>
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {isGraded ? `${mine.marksObtained}/${row.maxMarks} graded` : 'Submitted'}
                      </span>
                    ) : (
                      <span className="font-medium text-warning">Not submitted</span>
                    )
                  ) : (
                    <span>{row._count.submissions} submissions</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

const assignmentSelect = {
  id: true,
  title: true,
  description: true,
  dueDate: true,
  maxMarks: true,
  courseOffering: { select: { courseId: true, course: { select: { code: true, title: true } } } },
  _count: { select: { submissions: true } },
} as const;

function formatDate(value: Date) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(value);
}
