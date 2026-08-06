import { RoleType } from '@prisma/client';
import { getTenantDb } from '../db';
import type { ActiveUserContext } from '../active-user-context';
import type { AdminDashboardData } from './contracts';
import { dashboardDefinitionForRole } from './registry';
import { DashboardError } from './errors';

/**
 * Server-side Administrator dashboard loader (Phase 95).
 *
 * Authorization chain:
 *   authenticated session → active tenant → role must be INSTITUTION_ADMIN or
 *   SUPER_ADMIN → tenant-scoped aggregates only.
 *
 * Only real aggregates are returned. The authenticated administrator's own
 * profile is the identity; student records appear solely as institution-level
 * counts, never as the admin's personal data.
 */
export async function getAdminDashboardData(context: ActiveUserContext): Promise<AdminDashboardData> {
  if (context.activeRole !== RoleType.INSTITUTION_ADMIN && context.activeRole !== RoleType.SUPER_ADMIN) {
    throw new DashboardError('Unauthorized: Admin role required', 403);
  }

  const { tenantId, userId } = context;
  const db = getTenantDb(tenantId);

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  if (!user) {
    throw new DashboardError('Your administrator profile could not be resolved.', 403);
  }

  const [
    studentCount,
    facultyCount,
    parentCount,
    adminCount,
    departmentCount,
    courseCount,
    offeringCount,
    enrollmentCount,
    invoiceCount,
    paymentCount,
    collectedAgg,
    outstandingAgg,
    notices,
    supportCases,
    activityLogs,
  ] = await Promise.all([
    db.user.count({ where: { role: 'STUDENT' } }),
    db.user.count({ where: { role: 'FACULTY' } }),
    db.user.count({ where: { role: 'PARENT' } }),
    db.user.count({ where: { role: { in: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'] } } }),
    db.department.count(),
    db.course.count(),
    db.courseOffering.count(),
    db.enrollment.count(),
    db.invoice.count(),
    db.payment.count({ where: { status: 'PAID' } }),
    db.payment.aggregate({ _sum: { amount: true }, where: { status: 'PAID' } }),
    db.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
    }),
    db.notice.findMany({
      orderBy: { createdAt: 'desc' },
      take: 4,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
    db.supportCase.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, caseNumber: true, title: true, category: true, status: true, priority: true, createdAt: true },
    }),
    db.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, action: true, entity: true, createdAt: true },
    }),
  ]);

  const collectedAmount = collectedAgg._sum.amount ?? 0;
  const outstandingAmount = outstandingAgg._sum.amount ?? 0;

  const definition = dashboardDefinitionForRole(context.activeRole);
  const configuredQuickActions = definition.quickActions.map((action) => ({ label: action.label, href: action.href }));
  const quickActions = [
    { label: 'Payments & verification', href: '/payments' },
    ...configuredQuickActions.filter((action) => action.href !== '/payments'),
  ];

  // Risk alerts derived from real aggregates only.
  const riskAlerts: AdminDashboardData['riskAlerts'] = [];
  if (outstandingAmount > 0) {
    riskAlerts.push({
      id: 'outstanding-fees',
      level: 'warning',
      message: `${formatCurrency(outstandingAmount)} in fees is outstanding across ${invoiceCount} invoices.`,
      href: '/payments',
    });
  }
  const openCases = supportCases.filter((c) => c.status === 'NEW' || c.status === 'IN_PROGRESS').length;
  if (openCases > 0) {
    riskAlerts.push({
      id: 'open-support-cases',
      level: 'info',
      message: `${openCases} support case${openCases === 1 ? '' : 's'} awaiting follow-up.`,
      href: '/support/cases',
    });
  }

  return {
    role: context.activeRole === RoleType.SUPER_ADMIN ? 'SUPER_ADMIN' : 'INSTITUTION_ADMIN',
    identity: {
      id: userId,
      name: user.name,
      email: user.email,
      title: context.activeRole === RoleType.SUPER_ADMIN ? 'Platform Administrator' : 'Institution Administrator',
    },
    metrics: [
      { id: 'admin-students', label: 'Enrolled students', value: studentCount, detail: 'Active student accounts', tone: 'neutral' },
      { id: 'admin-faculty', label: 'Faculty members', value: facultyCount, detail: 'Assigned teaching staff', tone: 'neutral' },
      { id: 'admin-courses', label: 'Courses offered', value: courseCount, detail: `${offeringCount} active offerings`, tone: 'neutral' },
      { id: 'admin-collections', label: 'Fee collection', value: formatCurrency(collectedAmount), detail: 'Recorded collections', tone: 'positive' },
    ],
    userSummary: {
      students: studentCount,
      faculty: facultyCount,
      parents: parentCount,
      administrators: adminCount,
      total: studentCount + facultyCount + parentCount + adminCount,
    },
    academicsSummary: {
      departments: departmentCount,
      courses: courseCount,
      courseOfferings: offeringCount,
      enrollments: enrollmentCount,
    },
    financeSummary: {
      invoiceCount,
      paymentCount,
      collectedAmount,
      outstandingAmount,
    },
    supportCases: supportCases.map((supportCase) => ({
      id: supportCase.id,
      caseNumber: supportCase.caseNumber,
      title: supportCase.title,
      category: supportCase.category,
      status: supportCase.status,
      priority: supportCase.priority,
      createdAt: supportCase.createdAt.toISOString(),
    })),
    notices: notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt.toISOString(),
    })),
    riskAlerts,
    quickActions,
    recentActivity: activityLogs.map((log) => ({
      id: log.id,
      action: log.action,
      entity: log.entity,
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
