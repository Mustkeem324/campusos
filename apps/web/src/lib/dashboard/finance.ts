import { RoleType } from '@prisma/client';
import { getTenantDb } from '../db';
import type { ActiveUserContext } from '../active-user-context';
import type { FinanceDashboardData } from './contracts';
import { dashboardDefinitionForRole } from './registry';
import { DashboardError } from './errors';

const FINANCE_ROLES: RoleType[] = [RoleType.FINANCE_OFFICER, RoleType.ACCOUNTANT];

const formatCurrency = (amount: number | null) =>
  amount === null
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

/**
 * Server-side Finance dashboard loader.
 *
 * Authorization chain:
 *   authenticated session → active tenant → role must be FINANCE_OFFICER or
 *   ACCOUNTANT → tenant-scoped finance records only (invoices, payments,
 *   scholarships, fee structures all carry tenantId).
 *
 * Identity always represents the authenticated finance officer. Students
 * appear only as tenant-scoped aggregates on invoices/payments — never as
 * the current-user profile, and no finance payload carries grading,
 * attendance or administrative configuration data.
 */
export async function getFinanceDashboardData(context: ActiveUserContext): Promise<FinanceDashboardData> {
  if (!FINANCE_ROLES.includes(context.activeRole)) {
    throw new DashboardError('Unauthorized: Finance role required', 403);
  }

  const { tenantId, userId } = context;
  const db = getTenantDb(tenantId);

  const user = await db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
  if (!user) {
    throw new DashboardError('Your finance account could not be resolved.', 403);
  }

  // Optional staff profile — designation only; the finance officer may exist
  // without a staff record on older tenants.
  const staff = await db.staff.findFirst({
    where: { userId, tenantId },
    select: { designation: true },
  });

  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  const [todayPayments, overallPayments, outstandingAgg, outstandingInvoices, statusGroups, scholarshipCount, feeStructureCount, recentPayments, latestDueDate] =
    await Promise.all([
      db.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { tenantId, status: 'PAID', paidAt: { gte: dayStart } },
      }),
      db.payment.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { tenantId, status: 'PAID' },
      }),
      db.invoice.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } },
      }),
      db.invoice.findMany({
        where: { tenantId, status: { in: ['PENDING', 'PARTIAL'] } },
        orderBy: { amount: 'desc' },
        take: 5,
        select: {
          id: true,
          amount: true,
          dueDate: true,
          status: true,
          student: { select: { user: { select: { name: true } } } },
        },
      }),
      db.invoice.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: { _all: true },
      }),
      db.scholarship.count({ where: { tenantId } }),
      db.feeStructure.count({ where: { tenantId } }),
      db.payment.findMany({
        where: { tenantId, status: 'PAID' },
        orderBy: { paidAt: 'desc' },
        take: 6,
        select: {
          id: true,
          amount: true,
          method: true,
          status: true,
          paidAt: true,
          invoice: { select: { student: { select: { user: { select: { name: true } } } } } },
        },
      }),
      db.invoice.aggregate({ _max: { dueDate: true }, where: { tenantId } }),
    ]);

  const todayTotal = todayPayments._sum.amount ?? 0;
  const overallTotal = overallPayments._sum.amount ?? 0;
  const outstandingValue = outstandingAgg._sum.amount ?? 0;
  const outstandingCount = outstandingAgg._count ?? 0;

  const financialPeriod = latestDueDate._max.dueDate
    ? { label: `FY ${latestDueDate._max.dueDate.getFullYear()}` }
    : null;

  const metrics: FinanceDashboardData['metrics'] = [
    {
      id: 'collections-today',
      label: "Today's Collections",
      value: formatCurrency(todayTotal),
      detail: `${todayPayments._count} payment${todayPayments._count === 1 ? '' : 's'} recorded today`,
    },
    {
      id: 'collections-overall',
      label: 'Total Collections',
      value: formatCurrency(overallTotal),
      detail: `${overallPayments._count} paid payment${overallPayments._count === 1 ? '' : 's'} in this tenant`,
    },
    {
      id: 'outstanding-value',
      label: 'Outstanding Fees',
      value: formatCurrency(outstandingValue),
      detail: `${outstandingCount} invoice${outstandingCount === 1 ? '' : 's'} pending or partial`,
      tone: outstandingCount > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'schemes',
      label: 'Schemes',
      value: scholarshipCount + feeStructureCount,
      detail: `${scholarshipCount} scholarship · ${feeStructureCount} fee structure`,
    },
  ];

  const invoiceStatusBreakdown: FinanceDashboardData['invoiceStatusBreakdown'] = statusGroups.map((group) => ({
    status: group.status,
    count: group._count._all,
  }));

  const recentActivity: FinanceDashboardData['recentActivity'] = (
    await db.auditLog.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, action: true, entity: true, createdAt: true },
    })
  ).map((log) => ({ id: log.id, action: log.action, entity: log.entity, createdAt: log.createdAt.toISOString() }));

  const definition = dashboardDefinitionForRole(context.activeRole);
  const quickActions = definition.quickActions.map((action) => ({ label: action.label, href: action.href }));

  return {
    role: context.activeRole as FinanceDashboardData['role'],
    identity: {
      id: userId,
      name: user.name,
      email: user.email,
      designation: staff?.designation ?? null,
    },
    financialPeriod,
    metrics,
    collections: {
      todayTotal,
      overallTotal,
      paymentCount: overallPayments._count,
    },
    outstanding: {
      totalValue: outstandingValue,
      invoiceCount: outstandingCount,
      topInvoices: outstandingInvoices.map((invoice) => ({
        id: invoice.id,
        studentName: invoice.student.user.name,
        amount: invoice.amount,
        dueDate: invoice.dueDate.toISOString(),
        status: invoice.status,
      })),
    },
    invoiceStatusBreakdown,
    schemes: {
      scholarshipCount,
      feeStructureCount,
    },
    recentPayments: recentPayments.map((payment) => ({
      id: payment.id,
      studentName: payment.invoice.student.user.name,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      paidAt: payment.paidAt.toISOString(),
    })),
    quickActions,
    recentActivity,
  };
}
