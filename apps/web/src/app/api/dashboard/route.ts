import { NextResponse } from 'next/server';
import { RoleType } from '@prisma/client';
import { requireTenantContext } from '../../../lib/tenant-context';
import { prisma } from '../../../lib/db';

export const dynamic = 'force-dynamic';

type Metric = { label: string; value: string | number | null; detail: string };
type DashboardPayload = {
  role: RoleType;
  metrics: Metric[];
  activity: Array<{ id: string; action: string; entity: string; createdAt: string }>;
};

const formatCurrency = (amount: number | null) =>
  amount === null ? null : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const attendancePercentage = (records: Array<{ status: string }>) => {
  if (records.length === 0) return null;
  const attended = records.filter(({ status }) => status !== 'ABSENT').length;
  return Math.round((attended / records.length) * 100);
};

export async function GET() {
  try {
    const { db, role, tenantId, session } = await requireTenantContext();
    const metrics: Metric[] = [];
    let activity: DashboardPayload['activity'] = [];

    if (role === 'SUPER_ADMIN') {
      const [activeInstitutions, totalUsers, audits] = await Promise.all([
        prisma.institution.count({ where: { status: 'ACTIVE' } }),
        prisma.user.count(),
        prisma.auditLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, action: true, entity: true, createdAt: true } }),
      ]);
      metrics.push(
        { label: 'Active institutions', value: activeInstitutions, detail: 'Current platform tenants' },
        { label: 'Platform users', value: totalUsers, detail: 'Active and inactive accounts' },
      );
      activity = audits.map((audit) => ({ ...audit, createdAt: audit.createdAt.toISOString() }));
    } else if (role === 'INSTITUTION_ADMIN') {
      const [students, faculty, courses, paid] = await Promise.all([
        db.user.count({ where: { role: 'STUDENT', tenantId } }),
        db.user.count({ where: { role: 'FACULTY', tenantId } }),
        db.course.count({ where: { department: { institution: { id: tenantId } } } }),
        db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
      ]);
      metrics.push(
        { label: 'Students enrolled', value: students, detail: 'Student accounts in this institution' },
        { label: 'Faculty', value: faculty, detail: 'Faculty accounts in this institution' },
        { label: 'Course offerings', value: courses, detail: 'Courses configured for this institution' },
        { label: 'Fee collection', value: formatCurrency(paid._sum.amount), detail: 'Recorded paid payments' },
      );
    } else if (role === 'HOD') {
      const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { departmentId: true } });
      const [courses, faculty] = staff?.departmentId
        ? await Promise.all([
            db.course.count({ where: { departmentId: staff.departmentId } }),
            db.staff.count({ where: { departmentId: staff.departmentId } }),
          ])
        : [null, null];
      metrics.push(
        { label: 'Department courses', value: courses, detail: 'Courses in your assigned department' },
        { label: 'Department faculty', value: faculty, detail: 'Staff assigned to your department' },
      );
    } else if (role === 'FACULTY') {
      const staff = await db.staff.findUnique({ where: { userId: session.userId }, select: { id: true } });
      const dayStart = startOfToday();
      const tomorrow = new Date(dayStart);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const [todaySessions, submissions] = staff
        ? await Promise.all([
            db.attendanceSession.count({ where: { courseOffering: { facultyId: staff.id }, sessionDate: { gte: dayStart, lt: tomorrow } } }),
            db.submission.count({ where: { assignment: { courseOffering: { facultyId: staff.id } }, marksObtained: null } }),
          ])
        : [null, null];
      metrics.push(
        { label: 'Attendance sessions today', value: todaySessions, detail: 'Sessions assigned to you today' },
        { label: 'Submissions awaiting grading', value: submissions, detail: 'Unmarked submissions in your courses' },
      );
    } else if (role === 'STUDENT') {
      const student = await db.student.findUnique({ where: { userId: session.userId }, select: { id: true, cgpa: true, creditsEarned: true } });
      const [records, invoices] = student
        ? await Promise.all([
            db.attendanceRecord.findMany({ where: { studentId: student.id }, select: { status: true } }),
            db.invoice.aggregate({ _sum: { amount: true }, where: { studentId: student.id, status: { in: ['PENDING', 'PARTIAL'] } } }),
          ])
        : [[], { _sum: { amount: null } }];
      metrics.push(
        { label: 'Current CGPA', value: student?.cgpa ?? null, detail: 'Published academic record' },
        { label: 'Attendance', value: attendancePercentage(records) === null ? null : `${attendancePercentage(records)}%`, detail: 'Recorded attendance only' },
        { label: 'Credits earned', value: student?.creditsEarned ?? null, detail: 'Published academic record' },
        { label: 'Outstanding fees', value: formatCurrency(invoices._sum.amount), detail: 'Pending or partial invoices' },
      );
    } else if (role === 'PARENT') {
      const guardian = await db.guardian.findFirst({ where: { userId: session.userId }, include: { students: { take: 1, select: { id: true, cgpa: true } } } });
      const child = guardian?.students[0];
      const [records, invoices] = child
        ? await Promise.all([
            db.attendanceRecord.findMany({ where: { studentId: child.id }, select: { status: true } }),
            db.invoice.aggregate({ _sum: { amount: true }, where: { studentId: child.id, status: { in: ['PENDING', 'PARTIAL'] } } }),
          ])
        : [[], { _sum: { amount: null } }];
      metrics.push(
        { label: 'Linked student attendance', value: attendancePercentage(records) === null ? null : `${attendancePercentage(records)}%`, detail: 'Recorded attendance for linked student' },
        { label: 'Current CGPA', value: child?.cgpa ?? null, detail: 'Published academic record' },
        { label: 'Outstanding fees', value: formatCurrency(invoices._sum.amount), detail: 'Pending or partial invoices' },
      );
    } else if (role === 'WARDEN') {
      const [rooms, capacity, allocations, openTickets] = await Promise.all([
        db.roomHostel.count({ where: { hostel: { tenantId } } }),
        db.roomHostel.aggregate({ _sum: { capacity: true }, where: { hostel: { tenantId } } }),
        db.allocation.count({ where: { roomHostel: { hostel: { tenantId } } } }),
        db.ticket.count({ where: { status: 'OPEN' } }),
      ]);
      const occupancy = capacity._sum.capacity && capacity._sum.capacity > 0 ? Math.round((allocations / capacity._sum.capacity) * 100) : null;
      metrics.push(
        { label: 'Hostel rooms', value: rooms, detail: 'Configured rooms in this institution' },
        { label: 'Occupancy', value: occupancy === null ? null : `${occupancy}%`, detail: 'Allocated beds against configured capacity' },
        { label: 'Open service requests', value: openTickets, detail: 'Institution tickets currently open' },
      );
    } else if (role === 'ACCOUNTANT' || role === 'FINANCE_OFFICER') {
      const dayStart = startOfToday();
      const [todayPayments, outstandingInvoices, scholarshipCount] = await Promise.all([
        db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID', paidAt: { gte: dayStart } } }),
        db.invoice.aggregate({ _sum: { amount: true }, where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
        db.scholarship.count(),
      ]);
      metrics.push(
        { label: "Today's collections", value: formatCurrency(todayPayments._sum.amount), detail: 'Paid payments recorded today' },
        { label: 'Outstanding invoices', value: formatCurrency(outstandingInvoices._sum.amount), detail: 'Pending or partial invoice value' },
        { label: 'Scholarship schemes', value: scholarshipCount, detail: 'Scholarship schemes configured' },
      );
    } else {
      // Every authenticated role should receive real institutional context rather
      // than an empty dashboard. Detailed metrics remain limited to roles with
      // an explicitly scoped operational view above.
      const [users, offerings, notices] = await Promise.all([
        db.user.count(),
        db.courseOffering.count(),
        db.notice.count(),
      ]);
      metrics.push(
        { label: 'Institution users', value: users, detail: 'Accounts in your institution' },
        { label: 'Course offerings', value: offerings, detail: 'Offerings available in your institution' },
        { label: 'Institution notices', value: notices, detail: 'Notices available in your institution' },
      );
    }

    if (activity.length === 0) {
      const audits = await db.auditLog.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
        select: { id: true, action: true, entity: true, createdAt: true },
      });
      activity = audits.map((audit) => ({ ...audit, createdAt: audit.createdAt.toISOString() }));
    }

    return NextResponse.json({ role, metrics, activity } satisfies DashboardPayload);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unable to load dashboard data';
    const status = message.startsWith('Unauthorized') ? 401 : 500;
    return NextResponse.json({ error: status === 401 ? 'Unauthorized' : 'Unable to load dashboard data' }, { status });
  }
}
