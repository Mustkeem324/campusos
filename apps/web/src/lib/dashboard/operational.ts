import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../active-user-context';
import { getTenantDb } from '../db';
import { DashboardError } from './errors';
import type { OperationalDashboardData, OperationalRecord } from './operational-contracts';
import { isOperationalDashboardRole } from './operational-contracts';
import { roleWorkspaceProfileForRole } from './role-workspace';

/**
 * Server-side operational dashboard loader.
 *
 * The active user and tenant are resolved before this function is called. Every
 * query uses the tenant-scoped Prisma extension, and recent audit activity is
 * limited to the authenticated user rather than exposing institution-wide logs.
 */
export async function getOperationalDashboardData(
  context: ActiveUserContext,
): Promise<OperationalDashboardData> {
  if (!isOperationalDashboardRole(context.activeRole)) {
    throw new DashboardError('Unauthorized: operational dashboard role required', 403);
  }

  const db = getTenantDb(context.tenantId);
  const profile = roleWorkspaceProfileForRole(context.activeRole);

  const [user, notices, activityLogs] = await Promise.all([
    db.user.findUnique({
      where: { id: context.userId },
      select: { name: true, email: true },
    }),
    db.notice.findMany({
      where: {
        OR: [{ targetRole: 'ALL' }, { targetRole: context.activeRole }],
      },
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
    db.auditLog.findMany({
      where: { userId: context.userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, action: true, entity: true, createdAt: true },
    }),
  ]);

  if (!user) {
    throw new DashboardError('Your operational profile could not be resolved.', 403);
  }

  const roleData = await loadRoleData(context.activeRole, db);

  return {
    role: context.activeRole,
    identity: {
      id: context.userId,
      name: user.name,
      email: user.email,
      title: roleTitle(context.activeRole),
    },
    heading: roleData.heading,
    metrics: roleData.metrics,
    summary: roleData.summary,
    recordsTitle: roleData.recordsTitle,
    recordsDescription: roleData.recordsDescription,
    records: roleData.records,
    notices: notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt.toISOString(),
    })),
    riskAlerts: roleData.riskAlerts,
    quickActions: profile.actions.map((action) => ({
      label: action.label,
      href: action.href,
    })),
    recentActivity: activityLogs.map((activity) => ({
      id: activity.id,
      action: activity.action,
      entity: activity.entity,
      createdAt: activity.createdAt.toISOString(),
    })),
  };
}

type TenantDb = ReturnType<typeof getTenantDb>;
type RoleData = Pick<
  OperationalDashboardData,
  | 'heading'
  | 'metrics'
  | 'summary'
  | 'recordsTitle'
  | 'recordsDescription'
  | 'records'
  | 'riskAlerts'
>;

async function loadRoleData(
  role: OperationalDashboardData['role'],
  db: TenantDb,
): Promise<RoleData> {
  switch (role) {
    case RoleType.REGISTRAR:
      return loadRegistrarData(db);
    case RoleType.FINANCE_OFFICER:
      return loadFinanceData(db);
    case RoleType.EXAMINATION_CONTROLLER:
      return loadExaminationData(db);
    case RoleType.ADMISSIONS_COUNSELLOR:
      return loadAdmissionsData(db);
  }
}

async function loadRegistrarData(db: TenantDb): Promise<RoleData> {
  const [
    studentCount,
    enrollmentCount,
    programCount,
    resultCount,
    departmentCount,
    batchCount,
    sectionCount,
    currentAcademicYear,
    programs,
  ] = await Promise.all([
    db.student.count(),
    db.enrollment.count(),
    db.program.count(),
    db.result.count(),
    db.department.count(),
    db.batch.count(),
    db.section.count(),
    db.academicYear.findFirst({
      where: { isCurrent: true },
      select: { name: true },
    }),
    db.program.findMany({
      orderBy: { name: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        durationYears: true,
        department: { select: { name: true } },
        _count: { select: { batches: true } },
      },
    }),
  ]);

  const riskAlerts: RoleData['riskAlerts'] = [];
  if (!currentAcademicYear) {
    riskAlerts.push({
      id: 'registrar-current-year-missing',
      level: 'warning',
      message: 'No current academic year is configured for this institution.',
      href: '/settings',
    });
  }
  if (programCount === 0) {
    riskAlerts.push({
      id: 'registrar-programs-empty',
      level: 'info',
      message: 'No academic programmes are currently configured.',
      href: '/departments',
    });
  }

  return {
    heading: {
      eyebrow: 'Registrar operations',
      title: 'Academic records and institutional coordination',
      description:
        'Review real tenant-scoped academic structure, enrolment volume and recorded results without exposing individual student records on the dashboard.',
    },
    metrics: [
      { id: 'registrar-students', label: 'Student records', value: studentCount, detail: 'Tenant-scoped student profiles', tone: 'neutral' },
      { id: 'registrar-enrollments', label: 'Course enrolments', value: enrollmentCount, detail: 'Recorded enrolment relationships', tone: 'neutral' },
      { id: 'registrar-programs', label: 'Programmes', value: programCount, detail: `${departmentCount} departments`, tone: 'neutral' },
      { id: 'registrar-results', label: 'Recorded results', value: resultCount, detail: 'Exam result records', tone: 'positive' },
    ],
    summary: [
      { id: 'registrar-year', label: 'Current academic year', value: currentAcademicYear?.name ?? 'Not configured', detail: 'Institution-level academic period', href: '/settings' },
      { id: 'registrar-batches', label: 'Batches', value: batchCount, detail: 'Configured programme cohorts', href: '/departments' },
      { id: 'registrar-sections', label: 'Sections', value: sectionCount, detail: 'Configured student sections', href: '/departments' },
      { id: 'registrar-departments', label: 'Departments', value: departmentCount, detail: 'Academic organisational units', href: '/departments' },
    ],
    recordsTitle: 'Programme register',
    recordsDescription: 'A limited view of configured programmes; individual student records remain inside authorised modules.',
    records: programs.map((program) => ({
      id: program.id,
      title: `${program.code} · ${program.name}`,
      detail: `${program.department.name} · ${program.durationYears} year${program.durationYears === 1 ? '' : 's'} · ${program._count.batches} batch${program._count.batches === 1 ? '' : 'es'}`,
      href: '/departments',
    })),
    riskAlerts,
  };
}

async function loadFinanceData(db: TenantDb): Promise<RoleData> {
  const [
    invoiceCount,
    outstandingInvoiceCount,
    paidPaymentCount,
    failedPaymentCount,
    collectedAggregate,
    outstandingAggregate,
    outstandingInvoices,
  ] = await Promise.all([
    db.invoice.count(),
    db.invoice.count({ where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
    db.payment.count({ where: { status: 'PAID' } }),
    db.payment.count({ where: { status: 'FAILED' } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    db.invoice.aggregate({ _sum: { amount: true }, where: { status: { in: ['PENDING', 'PARTIAL'] } } }),
    db.invoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      orderBy: { dueDate: 'asc' },
      take: 5,
      select: { id: true, amount: true, dueDate: true, status: true },
    }),
  ]);

  const collectedAmount = collectedAggregate._sum.amount ?? 0;
  const outstandingAmount = outstandingAggregate._sum.amount ?? 0;
  const riskAlerts: RoleData['riskAlerts'] = [];

  if (outstandingAmount > 0) {
    riskAlerts.push({
      id: 'finance-outstanding-balance',
      level: 'warning',
      message: `${formatCurrency(outstandingAmount)} remains outstanding across ${outstandingInvoiceCount} invoice${outstandingInvoiceCount === 1 ? '' : 's'}.`,
      href: '/receipts',
    });
  }
  if (failedPaymentCount > 0) {
    riskAlerts.push({
      id: 'finance-failed-payments',
      level: 'danger',
      message: `${failedPaymentCount} failed payment${failedPaymentCount === 1 ? '' : 's'} require review.`,
      href: '/payments',
    });
  }

  return {
    heading: {
      eyebrow: 'Finance operations',
      title: 'Collections, dues and transaction oversight',
      description:
        'Review real billing and collection aggregates for the active institution. Dashboard totals support operations but do not replace ledger reconciliation.',
    },
    metrics: [
      { id: 'finance-collected', label: 'Recorded collections', value: formatCurrency(collectedAmount), detail: `${paidPaymentCount} paid transactions`, tone: 'positive' },
      { id: 'finance-outstanding', label: 'Outstanding fees', value: formatCurrency(outstandingAmount), detail: `${outstandingInvoiceCount} pending or partial invoices`, tone: outstandingAmount > 0 ? 'warning' : 'positive' },
      { id: 'finance-invoices', label: 'Invoices issued', value: invoiceCount, detail: 'All tenant-scoped invoices', tone: 'neutral' },
      { id: 'finance-failed', label: 'Failed payments', value: failedPaymentCount, detail: 'Recorded failed payment attempts', tone: failedPaymentCount > 0 ? 'danger' : 'positive' },
    ],
    summary: [
      { id: 'finance-paid-count', label: 'Paid transactions', value: paidPaymentCount, detail: 'Transactions with PAID status', href: '/payments' },
      { id: 'finance-open-count', label: 'Open invoices', value: outstandingInvoiceCount, detail: 'Pending and partial invoices', href: '/receipts' },
      { id: 'finance-average', label: 'Average paid transaction', value: paidPaymentCount > 0 ? formatCurrency(collectedAmount / paidPaymentCount) : formatCurrency(0), detail: 'Calculated from recorded paid transactions', href: '/payments' },
      { id: 'finance-reconciliation', label: 'Reconciliation source', value: 'Payments & receipts', detail: 'Use source records for final reconciliation', href: '/receipts' },
    ],
    recordsTitle: 'Upcoming outstanding invoices',
    recordsDescription: 'The earliest due pending or partial invoices, without displaying student identity on the dashboard.',
    records: outstandingInvoices.map((invoice) => ({
      id: invoice.id,
      title: formatCurrency(invoice.amount),
      detail: `Due ${formatDate(invoice.dueDate)} · ${formatStatus(invoice.status)}`,
      status: invoice.status,
      date: invoice.dueDate.toISOString(),
      href: '/receipts',
    })),
    riskAlerts,
  };
}

async function loadExaminationData(db: TenantDb): Promise<RoleData> {
  const [examCount, resultCount, studentCount, courseOfferingCount, exams, currentTerm] = await Promise.all([
    db.exam.count(),
    db.result.count(),
    db.student.count(),
    db.courseOffering.count(),
    db.exam.findMany({
      take: 8,
      select: {
        id: true,
        name: true,
        type: true,
        schedules: {
          orderBy: { examDate: 'asc' },
          select: { id: true, examDate: true },
        },
      },
    }),
    db.term.findFirst({
      where: { academicYear: { isCurrent: true } },
      orderBy: { number: 'asc' },
      select: { name: true, academicYear: { select: { name: true } } },
    }),
  ]);

  const now = Date.now();
  const scheduledRecords: OperationalRecord[] = exams
    .flatMap((exam) =>
      exam.schedules.map((schedule) => ({
        id: schedule.id,
        title: exam.name,
        detail: `${exam.type} · ${formatDateTime(schedule.examDate)}`,
        status: schedule.examDate.getTime() >= now ? 'UPCOMING' : 'COMPLETED',
        date: schedule.examDate.toISOString(),
        href: '/examinations',
      })),
    )
    .sort((left, right) => new Date(left.date ?? 0).getTime() - new Date(right.date ?? 0).getTime());

  const upcomingRecords = scheduledRecords.filter((record) => record.status === 'UPCOMING').slice(0, 5);
  const unscheduledExamCount = exams.filter((exam) => exam.schedules.length === 0).length;
  const riskAlerts: RoleData['riskAlerts'] = [];

  if (unscheduledExamCount > 0) {
    riskAlerts.push({
      id: 'exam-unscheduled',
      level: 'warning',
      message: `${unscheduledExamCount} examination${unscheduledExamCount === 1 ? '' : 's'} in the reviewed set have no schedule.`,
      href: '/examinations',
    });
  }
  if (!currentTerm) {
    riskAlerts.push({
      id: 'exam-current-term-missing',
      level: 'info',
      message: 'No current academic term could be resolved.',
      href: '/settings',
    });
  }

  return {
    heading: {
      eyebrow: 'Examination control',
      title: 'Assessment scheduling and result operations',
      description:
        'Review real examination, schedule and result aggregates while keeping marks and individual candidate information inside authorised examination workflows.',
    },
    metrics: [
      { id: 'exam-definitions', label: 'Examinations', value: examCount, detail: 'Tenant-scoped exam definitions', tone: 'neutral' },
      { id: 'exam-upcoming', label: 'Upcoming schedules', value: scheduledRecords.filter((record) => record.status === 'UPCOMING').length, detail: 'Future recorded exam schedules', tone: 'neutral' },
      { id: 'exam-results', label: 'Result records', value: resultCount, detail: 'Recorded student exam results', tone: 'positive' },
      { id: 'exam-students', label: 'Student records', value: studentCount, detail: 'Institution candidate population', tone: 'neutral' },
    ],
    summary: [
      { id: 'exam-term', label: 'Current term', value: currentTerm ? `${currentTerm.academicYear.name} · ${currentTerm.name}` : 'Not configured', detail: 'Resolved from the current academic year', href: '/settings' },
      { id: 'exam-offerings', label: 'Course offerings', value: courseOfferingCount, detail: 'Potential assessment delivery scope', href: '/examinations' },
      { id: 'exam-scheduled', label: 'Scheduled items reviewed', value: scheduledRecords.length, detail: 'Schedules attached to the latest exam definitions', href: '/examinations' },
      { id: 'exam-unscheduled', label: 'Unscheduled exams reviewed', value: unscheduledExamCount, detail: 'Exam definitions without a schedule', href: '/examinations' },
    ],
    recordsTitle: 'Upcoming examination schedule',
    recordsDescription: 'The next recorded examination schedules. Candidate and marks data are intentionally excluded.',
    records: upcomingRecords,
    riskAlerts,
  };
}

async function loadAdmissionsData(db: TenantDb): Promise<RoleData> {
  const [
    programCount,
    batchCount,
    sectionCount,
    activeStudentCount,
    departmentCount,
    currentAcademicYear,
    programs,
  ] = await Promise.all([
    db.program.count(),
    db.batch.count(),
    db.section.count(),
    db.user.count({ where: { role: 'STUDENT', isActive: true } }),
    db.department.count(),
    db.academicYear.findFirst({ where: { isCurrent: true }, select: { name: true } }),
    db.program.findMany({
      orderBy: { name: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        code: true,
        durationYears: true,
        department: { select: { name: true } },
        _count: { select: { batches: true } },
      },
    }),
  ]);

  const riskAlerts: RoleData['riskAlerts'] = [];
  if (!currentAcademicYear) {
    riskAlerts.push({
      id: 'admissions-year-missing',
      level: 'warning',
      message: 'Admissions readiness is limited because no current academic year is configured.',
      href: '/settings',
    });
  }
  if (programCount === 0) {
    riskAlerts.push({
      id: 'admissions-programs-empty',
      level: 'warning',
      message: 'No programmes are configured for applicant guidance.',
      href: '/platform/admissions',
    });
  }

  return {
    heading: {
      eyebrow: 'Admissions operations',
      title: 'Programme readiness and applicant guidance',
      description:
        'Review current programme, batch and section configuration using real institutional data. An applicant funnel is not shown until a reviewed admissions-pipeline model exists.',
    },
    metrics: [
      { id: 'admissions-programs', label: 'Programmes', value: programCount, detail: `${departmentCount} departments`, tone: 'neutral' },
      { id: 'admissions-batches', label: 'Batches', value: batchCount, detail: 'Configured programme cohorts', tone: 'neutral' },
      { id: 'admissions-sections', label: 'Sections', value: sectionCount, detail: 'Configured delivery sections', tone: 'neutral' },
      { id: 'admissions-students', label: 'Active student accounts', value: activeStudentCount, detail: 'Current institutional student users', tone: 'positive' },
    ],
    summary: [
      { id: 'admissions-year', label: 'Current academic year', value: currentAcademicYear?.name ?? 'Not configured', detail: 'Used for admissions readiness', href: '/settings' },
      { id: 'admissions-departments', label: 'Departments', value: departmentCount, detail: 'Academic units offering programmes', href: '/departments' },
      { id: 'admissions-pipeline', label: 'Applicant pipeline', value: 'Not available', detail: 'No reviewed applicant-pipeline data contract exists yet', href: '/platform/admissions' },
      { id: 'admissions-source', label: 'Data source', value: 'Institution configuration', detail: 'No invented enquiry or conversion metrics', href: '/platform/admissions' },
    ],
    recordsTitle: 'Programmes available for guidance',
    recordsDescription: 'Configured programmes that admissions staff can reference when guiding prospective applicants.',
    records: programs.map((program) => ({
      id: program.id,
      title: `${program.code} · ${program.name}`,
      detail: `${program.department.name} · ${program.durationYears} year${program.durationYears === 1 ? '' : 's'} · ${program._count.batches} batch${program._count.batches === 1 ? '' : 'es'}`,
      href: '/platform/admissions',
    })),
    riskAlerts,
  };
}

function roleTitle(role: OperationalDashboardData['role']): string {
  switch (role) {
    case RoleType.REGISTRAR:
      return 'Registrar';
    case RoleType.FINANCE_OFFICER:
      return 'Finance Officer';
    case RoleType.EXAMINATION_CONTROLLER:
      return 'Examination Controller';
    case RoleType.ADMISSIONS_COUNSELLOR:
      return 'Admissions Counsellor';
  }
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value);
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
