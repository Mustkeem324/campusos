import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../active-user-context';
import { getTenantDb, prisma } from '../db';
import { DashboardError } from './errors';
import {
  isPhase4DashboardRole,
  normalisePercentage,
  type Phase4BreakdownItem,
  type Phase4DashboardData,
  type Phase4QueueItem,
} from './phase4-contracts';
import { roleWorkspaceProfileForRole } from './role-workspace';

/**
 * Dashboard UI Phase 4 server loader.
 *
 * Finance and accounting queries use the tenant-scoped Prisma client. Library
 * records are explicitly constrained through LibraryItem.tenantId because the
 * legacy Loan model has no tenant column; borrower identities are never exposed
 * by this dashboard. User activity remains limited to the signed-in account.
 */
export async function getPhase4DashboardData(
  context: ActiveUserContext,
): Promise<Phase4DashboardData> {
  if (!isPhase4DashboardRole(context.activeRole)) {
    throw new DashboardError('Unauthorized: Phase 4 dashboard role required', 403);
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
    throw new DashboardError('Your active dashboard profile could not be resolved.', 403);
  }

  const roleData = context.activeRole === RoleType.LIBRARIAN
    ? await loadLibraryDashboard(context.tenantId)
    : await loadFinanceDashboard(db, context.tenantId, context.activeRole);

  return {
    role: context.activeRole,
    identity: {
      id: context.userId,
      name: user.name,
      email: user.email,
      title: roleTitle(context.activeRole),
    },
    ...roleData,
    quickActions: profile.actions.map((action) => ({
      label: action.label,
      href: action.href,
    })),
    notices: notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt.toISOString(),
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
type RolePayload = Omit<
  Phase4DashboardData,
  'role' | 'identity' | 'quickActions' | 'notices' | 'recentActivity'
>;

async function loadFinanceDashboard(
  db: TenantDb,
  tenantId: string,
  role: Exclude<Phase4DashboardData['role'], 'LIBRARIAN'>,
): Promise<RolePayload> {
  const now = new Date();
  const dueSoon = new Date(now);
  dueSoon.setDate(dueSoon.getDate() + 7);

  const [
    invoiceCount,
    totalInvoiceAggregate,
    outstandingAggregate,
    collectedAggregate,
    paidPaymentCount,
    failedPaymentCount,
    refundedPaymentCount,
    overdueInvoiceCount,
    dueSoonInvoiceCount,
    methodGroups,
    outstandingInvoices,
    failedPayments,
    scholarshipCount,
    refundAggregate,
  ] = await Promise.all([
    db.invoice.count(),
    db.invoice.aggregate({ _sum: { amount: true } }),
    db.invoice.aggregate({
      _sum: { amount: true },
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
    }),
    db.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'PAID' },
    }),
    db.payment.count({ where: { status: 'PAID' } }),
    db.payment.count({ where: { status: 'FAILED' } }),
    db.payment.count({ where: { status: 'REFUNDED' } }),
    db.invoice.count({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { lt: now },
      },
    }),
    db.invoice.count({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
        dueDate: { gte: now, lte: dueSoon },
      },
    }),
    db.payment.groupBy({
      by: ['method'],
      where: { status: 'PAID' },
      _sum: { amount: true },
      _count: { _all: true },
      orderBy: { _sum: { amount: 'desc' } },
    }),
    db.invoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      orderBy: { dueDate: 'asc' },
      take: 8,
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        student: { select: { rollNumber: true } },
      },
    }),
    db.payment.findMany({
      where: { status: 'FAILED' },
      orderBy: { paidAt: 'desc' },
      take: 4,
      select: {
        id: true,
        amount: true,
        status: true,
        paidAt: true,
        transactionId: true,
        invoice: {
          select: {
            id: true,
            student: { select: { rollNumber: true } },
          },
        },
      },
    }),
    prisma.scholarship.count({ where: { tenantId } }),
    prisma.refund.aggregate({
      _sum: { amount: true },
      where: { payment: { tenantId } },
    }),
  ]);

  const totalInvoiced = totalInvoiceAggregate._sum.amount ?? 0;
  const outstandingAmount = outstandingAggregate._sum.amount ?? 0;
  const collectedAmount = collectedAggregate._sum.amount ?? 0;
  const refundedAmount = refundAggregate._sum.amount ?? 0;
  const collectionRate = totalInvoiced > 0
    ? normalisePercentage((collectedAmount / totalInvoiced) * 100)
    : 0;

  const methodTotal = methodGroups.reduce(
    (sum, group) => sum + (group._sum.amount ?? 0),
    0,
  );
  const breakdownItems: Phase4BreakdownItem[] = methodGroups.map((group) => {
    const amount = group._sum.amount ?? 0;
    return {
      id: group.method,
      label: formatStatus(group.method),
      value: amount,
      formattedValue: formatCurrency(amount),
      percentage: methodTotal > 0
        ? normalisePercentage((amount / methodTotal) * 100)
        : 0,
      detail: `${group._count._all} paid transaction${group._count._all === 1 ? '' : 's'}`,
    };
  });

  const queueItems: Phase4QueueItem[] = [
    ...failedPayments.map((payment) => ({
      id: `failed-${payment.id}`,
      title: 'Failed payment review',
      reference: payment.transactionId
        ? maskReference(payment.transactionId)
        : maskReference(payment.invoice.id),
      detail: `${formatCurrency(payment.amount)} · ${maskReference(payment.invoice.student.rollNumber)}`,
      status: payment.status,
      date: payment.paidAt.toISOString(),
      href: '/payments',
    })),
    ...outstandingInvoices.map((invoice) => ({
      id: `invoice-${invoice.id}`,
      title: invoice.dueDate < now ? 'Overdue invoice' : 'Upcoming invoice',
      reference: maskReference(invoice.id),
      detail: `${formatCurrency(invoice.amount)} · ${maskReference(invoice.student.rollNumber)} · due ${formatDate(invoice.dueDate)}`,
      status: invoice.dueDate < now ? 'OVERDUE' : invoice.status,
      date: invoice.dueDate.toISOString(),
      href: '/receipts',
    })),
  ]
    .sort((left, right) => new Date(left.date ?? 0).getTime() - new Date(right.date ?? 0).getTime())
    .slice(0, 10);

  const riskAlerts: RolePayload['riskAlerts'] = [];
  if (overdueInvoiceCount > 0) {
    riskAlerts.push({
      id: 'phase4-overdue-invoices',
      level: 'danger',
      message: `${overdueInvoiceCount} invoice${overdueInvoiceCount === 1 ? '' : 's'} are past their recorded due date.`,
      href: '/receipts',
    });
  }
  if (failedPaymentCount > 0) {
    riskAlerts.push({
      id: 'phase4-failed-payments',
      level: 'warning',
      message: `${failedPaymentCount} failed payment${failedPaymentCount === 1 ? '' : 's'} require operational review.`,
      href: '/payments',
    });
  }
  if (invoiceCount === 0) {
    riskAlerts.push({
      id: 'phase4-no-invoices',
      level: 'info',
      message: 'No invoice records are available for the active institution.',
      href: '/receipts',
    });
  }

  const isAccountant = role === RoleType.ACCOUNTANT;

  return {
    heading: {
      eyebrow: isAccountant ? 'Accounting command centre' : 'Finance command centre',
      title: isAccountant
        ? 'Reconciliation, exceptions and transaction evidence'
        : 'Collections, dues and financial performance',
      description: isAccountant
        ? 'Prioritise failed transactions, overdue invoices and supporting evidence while keeping every action inside the active institution.'
        : 'Monitor collection performance, payment channels, outstanding exposure and operational finance queues using real tenant-scoped records.',
      assurance: 'Financial totals are operational indicators. Final close and statutory reporting must use approved ledger and reconciliation workflows.',
    },
    metrics: [
      {
        id: 'phase4-collected',
        label: 'Recorded collections',
        value: formatCurrency(collectedAmount),
        detail: `${paidPaymentCount} successful payment${paidPaymentCount === 1 ? '' : 's'}`,
        tone: 'positive',
      },
      {
        id: 'phase4-outstanding',
        label: 'Outstanding exposure',
        value: formatCurrency(outstandingAmount),
        detail: `${overdueInvoiceCount} overdue · ${dueSoonInvoiceCount} due in 7 days`,
        tone: outstandingAmount > 0 ? 'warning' : 'positive',
      },
      {
        id: 'phase4-collection-rate',
        label: 'Collection coverage',
        value: `${collectionRate}%`,
        detail: 'Recorded collections divided by invoiced value',
        tone: collectionRate >= 80 ? 'positive' : collectionRate >= 50 ? 'warning' : 'danger',
      },
      {
        id: 'phase4-exceptions',
        label: 'Payment exceptions',
        value: failedPaymentCount + refundedPaymentCount,
        detail: `${failedPaymentCount} failed · ${refundedPaymentCount} refunded`,
        tone: failedPaymentCount > 0 ? 'danger' : 'neutral',
      },
    ],
    summaries: [
      {
        id: 'phase4-invoiced',
        label: 'Total invoiced',
        value: formatCurrency(totalInvoiced),
        detail: `${invoiceCount} tenant-scoped invoice${invoiceCount === 1 ? '' : 's'}`,
        href: '/receipts',
      },
      {
        id: 'phase4-refunds',
        label: 'Refund value',
        value: formatCurrency(refundedAmount),
        detail: 'Recorded refund records linked to tenant payments',
        href: '/payments',
      },
      {
        id: 'phase4-scholarships',
        label: 'Scholarship schemes',
        value: scholarshipCount,
        detail: 'Configured tenant scholarship records',
        href: '/scholarships',
      },
      {
        id: 'phase4-reconciliation',
        label: 'Priority queue',
        value: queueItems.length,
        detail: 'Failed and time-sensitive records surfaced below',
        href: '/payments',
      },
    ],
    breakdown: {
      title: 'Collections by payment method',
      description: 'Distribution of successful payment value across recorded channels.',
      items: breakdownItems,
      emptyMessage: 'No successful payment-method data is available yet.',
    },
    queue: {
      title: isAccountant ? 'Reconciliation work queue' : 'Finance action queue',
      description: 'Failed payments and earliest outstanding invoices, with student references masked on the dashboard.',
      items: queueItems,
      emptyMessage: 'No failed or outstanding finance records require attention.',
    },
    riskAlerts,
  };
}

async function loadLibraryDashboard(tenantId: string): Promise<RolePayload> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [items, recentLoans, totalLoanCount, issuedTitleCount, lastThirtyDayCount] = await Promise.all([
    prisma.libraryItem.findMany({
      where: { tenantId },
      orderBy: { title: 'asc' },
      select: {
        id: true,
        title: true,
        isbn: true,
        _count: { select: { loans: true } },
      },
    }),
    prisma.loan.findMany({
      where: { libraryItem: { tenantId } },
      orderBy: { borrowedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        borrowedAt: true,
        libraryItem: { select: { id: true, title: true, isbn: true } },
      },
    }),
    prisma.loan.count({ where: { libraryItem: { tenantId } } }),
    prisma.libraryItem.count({ where: { tenantId, loans: { some: {} } } }),
    prisma.loan.count({
      where: {
        libraryItem: { tenantId },
        borrowedAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const itemCount = items.length;
  const titlesWithIsbn = items.filter((item) => Boolean(item.isbn?.trim())).length;
  const idleTitleCount = itemCount - issuedTitleCount;
  const catalogueCoverage = itemCount > 0
    ? normalisePercentage((titlesWithIsbn / itemCount) * 100)
    : 0;
  const circulationCoverage = itemCount > 0
    ? normalisePercentage((issuedTitleCount / itemCount) * 100)
    : 0;
  const averageLoans = itemCount > 0 ? totalLoanCount / itemCount : 0;
  const maxLoanCount = Math.max(0, ...items.map((item) => item._count.loans));

  const breakdownItems: Phase4BreakdownItem[] = items
    .filter((item) => item._count.loans > 0)
    .sort((left, right) => right._count.loans - left._count.loans)
    .slice(0, 6)
    .map((item) => ({
      id: item.id,
      label: item.title,
      value: item._count.loans,
      formattedValue: `${item._count.loans} issue${item._count.loans === 1 ? '' : 's'}`,
      percentage: maxLoanCount > 0
        ? normalisePercentage((item._count.loans / maxLoanCount) * 100)
        : 0,
      detail: item.isbn ? `ISBN ${item.isbn}` : 'ISBN not recorded',
    }));

  const queueItems: Phase4QueueItem[] = recentLoans.map((loan) => ({
    id: loan.id,
    title: loan.libraryItem.title,
    reference: loan.libraryItem.isbn
      ? maskReference(loan.libraryItem.isbn)
      : maskReference(loan.libraryItem.id),
    detail: `Circulation record created ${formatDateTime(loan.borrowedAt)}`,
    status: 'ISSUED',
    date: loan.borrowedAt.toISOString(),
    href: '/opac',
  }));

  const riskAlerts: RolePayload['riskAlerts'] = [];
  if (itemCount === 0) {
    riskAlerts.push({
      id: 'phase4-library-empty',
      level: 'warning',
      message: 'No library catalogue items are available for this institution.',
      href: '/opac',
    });
  }
  if (itemCount > 0 && catalogueCoverage < 80) {
    riskAlerts.push({
      id: 'phase4-library-isbn',
      level: 'info',
      message: `${itemCount - titlesWithIsbn} catalogue title${itemCount - titlesWithIsbn === 1 ? '' : 's'} do not have an ISBN recorded.`,
      href: '/opac',
    });
  }
  if (itemCount >= 5 && circulationCoverage < 40) {
    riskAlerts.push({
      id: 'phase4-library-idle',
      level: 'warning',
      message: `${idleTitleCount} catalogue title${idleTitleCount === 1 ? '' : 's'} have no circulation record.`,
      href: '/opac',
    });
  }

  return {
    heading: {
      eyebrow: 'Library operations command centre',
      title: 'Catalogue health, discovery and circulation activity',
      description: 'Review real catalogue coverage, issue activity and collection-use signals without exposing borrower identities on the dashboard.',
      assurance: 'The legacy circulation model does not yet store due dates, returns, reservations or borrower links; this dashboard reports only supported catalogue and issue data.',
    },
    metrics: [
      {
        id: 'phase4-library-titles',
        label: 'Catalogue titles',
        value: itemCount,
        detail: `${titlesWithIsbn} with recorded ISBN`,
        tone: itemCount > 0 ? 'positive' : 'warning',
      },
      {
        id: 'phase4-library-circulation',
        label: 'Circulation records',
        value: totalLoanCount,
        detail: `${lastThirtyDayCount} created in the last 30 days`,
        tone: totalLoanCount > 0 ? 'positive' : 'neutral',
      },
      {
        id: 'phase4-library-coverage',
        label: 'Collection usage',
        value: `${circulationCoverage}%`,
        detail: `${issuedTitleCount} titles have at least one issue record`,
        tone: circulationCoverage >= 60 ? 'positive' : circulationCoverage >= 30 ? 'warning' : 'neutral',
      },
      {
        id: 'phase4-library-idle-count',
        label: 'Never issued',
        value: idleTitleCount,
        detail: 'Titles without a circulation record',
        tone: idleTitleCount > 0 ? 'warning' : 'positive',
      },
    ],
    summaries: [
      {
        id: 'phase4-library-isbn-coverage',
        label: 'ISBN coverage',
        value: `${catalogueCoverage}%`,
        detail: 'Titles with a recorded ISBN',
        href: '/opac',
      },
      {
        id: 'phase4-library-average',
        label: 'Average issues per title',
        value: averageLoans.toFixed(1),
        detail: 'All issue records divided by catalogue titles',
        href: '/opac',
      },
      {
        id: 'phase4-library-active-titles',
        label: 'Circulated titles',
        value: issuedTitleCount,
        detail: 'Titles with one or more issue records',
        href: '/opac',
      },
      {
        id: 'phase4-library-recent',
        label: 'Recent activity',
        value: lastThirtyDayCount,
        detail: 'Issue records created in the previous 30 days',
        href: '/opac',
      },
    ],
    breakdown: {
      title: 'Most circulated titles',
      description: 'Relative issue volume across the most-used catalogue records.',
      items: breakdownItems,
      emptyMessage: 'No title has a circulation record yet.',
    },
    queue: {
      title: 'Recent circulation activity',
      description: 'Latest issue records. Borrower identity is intentionally excluded from this dashboard.',
      items: queueItems,
      emptyMessage: 'No library circulation activity is available.',
    },
    riskAlerts,
  };
}

function roleTitle(role: Phase4DashboardData['role']): string {
  switch (role) {
    case RoleType.FINANCE_OFFICER:
      return 'Finance Officer';
    case RoleType.ACCOUNTANT:
      return 'Accountant';
    case RoleType.LIBRARIAN:
      return 'Librarian';
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function maskReference(value: string): string {
  const compact = value.replace(/\s+/g, '');
  if (compact.length <= 4) return `••${compact}`;
  return `••••${compact.slice(-4)}`;
}
