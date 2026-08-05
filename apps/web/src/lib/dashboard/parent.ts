import { RoleType } from '@prisma/client';
import { getTenantDb } from '../db';
import type { ActiveUserContext } from '../active-user-context';
import type { ParentDashboardData } from './contracts';
import { dashboardDefinitionForRole } from './registry';
import { DashboardError } from './errors';

const ATTENDANCE_THRESHOLD = 75;

/**
 * Server-side Parent / Guardian dashboard loader (Phase 95).
 *
 * Authorization chain for EVERY linked-student request:
 *   authenticated session → active tenant → role must be PARENT →
 *   guardian profile resolved by id + userId + tenantId → the requested
 *   student must be a verified link of THIS guardian in THIS tenant.
 *
 * The guardian is never the student: identity always represents the
 * authenticated guardian, and ward data is returned under `selectedStudent`.
 * Only published academic information is exposed (published=true results;
 * drafts are never queried).
 */
export async function getParentDashboardData(
  context: ActiveUserContext,
  requestedStudentId?: string,
): Promise<ParentDashboardData> {
  if (context.activeRole !== RoleType.PARENT || !context.guardianProfileId) {
    throw new DashboardError('Unauthorized: Parent role required', 403);
  }

  const { tenantId, userId, guardianProfileId } = context;
  const db = getTenantDb(tenantId);

  const guardian = await db.guardian.findFirst({
    where: { id: guardianProfileId, userId, tenantId },
    include: {
      students: {
        include: {
          user: { select: { name: true, email: true } },
          batch: { include: { program: { select: { name: true } } } },
        },
      },
    },
  });

  if (!guardian) {
    throw new DashboardError('Your guardian profile could not be resolved.', 403);
  }

  const linkedStudents = guardian.students;
  if (linkedStudents.length === 0) {
    throw new DashboardError('No linked student is currently available for this guardian account.', 403);
  }

  // The selected student MUST be a verified link of this guardian. A request
  // for any other student id (another guardian's ward, or any random student)
  // is rejected here, server-side, with 403 before any ward data is fetched.
  if (requestedStudentId && !linkedStudents.some((student) => student.id === requestedStudentId)) {
    throw new DashboardError('Unauthorized: the requested student is not linked to this guardian account.', 403);
  }
  const selected = linkedStudents.find((student) => student.id === requestedStudentId) ?? linkedStudents[0];

  const [user, attendanceRecords, invoices, semesterResults, notices, activityLogs] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    db.attendanceRecord.findMany({
      where: { studentId: selected.id, tenantId },
      select: { status: true, id: true },
    }),
    db.invoice.findMany({
      where: { studentId: selected.id, tenantId },
      select: { id: true, amount: true, status: true, dueDate: true },
    }),
    db.studentSemesterResult.findMany({
      // published=true only: draft results must never reach a guardian.
      where: { studentId: selected.id, tenantId, published: true },
      include: { examination: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    db.notice.findMany({
      where: { tenantId, OR: [{ targetRole: 'ALL' }, { targetRole: 'PARENT' }] },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
    db.auditLog.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, action: true, entity: true, createdAt: true },
    }),
  ]);

  // Real attendance for the linked student only.
  const present = attendanceRecords.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length;
  const total = attendanceRecords.length;
  const attendance = total === 0 ? null : { present, total, percentage: Math.round((present / total) * 100) };

  // Real fee aggregates for the linked student only.
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const outstandingAmount = invoices
    .filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'PARTIAL')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const nextDueDate =
    invoices
      .filter((invoice) => invoice.status !== 'PAID')
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate ?? null;

  const feeSummary: ParentDashboardData['selectedStudent']['feeSummary'] = {
    outstandingAmount: invoices.length === 0 ? null : outstandingAmount,
    totalInvoiced: invoices.length === 0 ? null : totalInvoiced,
    nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
    invoiceCount: invoices.length,
    status:
      invoices.length === 0
        ? 'UNKNOWN'
        : outstandingAmount <= 0
          ? 'CLEAR'
          : outstandingAmount < totalInvoiced
            ? 'PARTIAL'
            : 'OUTSTANDING',
  };

  // Risk alerts derived from real data only.
  const riskAlerts: ParentDashboardData['riskAlerts'] = [];
  if (attendance && attendance.percentage < ATTENDANCE_THRESHOLD) {
    riskAlerts.push({
      id: 'ward-attendance-shortage',
      level: 'warning',
      message: `${selected.user.name}'s attendance is ${attendance.percentage}%, below the ${ATTENDANCE_THRESHOLD}% examination threshold.`,
      href: '/attendance',
    });
  }
  if (feeSummary.status === 'OUTSTANDING' || feeSummary.status === 'PARTIAL') {
    riskAlerts.push({
      id: 'ward-fee-due',
      level: 'warning',
      message: `${selected.user.name} has an outstanding fee balance of ${formatCurrency(feeSummary.outstandingAmount ?? 0)}.`,
      href: '/payments',
    });
  }

  const definition = dashboardDefinitionForRole(RoleType.PARENT);
  const quickActions = definition.quickActions.map((action) => ({ label: action.label, href: action.href }));

  return {
    role: 'PARENT',
    identity: {
      id: userId,
      name: user?.name ?? 'Parent or Guardian',
      email: user?.email ?? '',
      title: 'Parent / Guardian',
    },
    linkedStudents: linkedStudents.map((student) => ({
      id: student.id,
      name: student.user.name,
      rollNumber: student.rollNumber,
      programme: student.batch.program.name,
      batch: student.batch.name,
      relationship: guardian.relationship,
    })),
    selectedStudentId: selected.id,
    selectedStudent: {
      id: selected.id,
      name: selected.user.name,
      rollNumber: selected.rollNumber,
      programme: selected.batch.program.name,
      batch: selected.batch.name,
      relationship: guardian.relationship,
      cgpa: selected.cgpa,
      attendance,
      // publishedAt: no dedicated publication timestamp; last-verified
      // (updatedAt) is used as a close proxy, matching the student loader.
      publishedResults: semesterResults.map((result) => ({
        id: result.id,
        examinationName: result.examination.name,
        sgpa: result.sgpa,
        cgpa: result.cgpa,
        status: result.status,
        publishedAt: result.updatedAt.toISOString(),
      })),
      feeSummary,
    },
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
