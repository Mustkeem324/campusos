import { RoleType } from '@prisma/client';
import { getTenantDb } from '../db';
import type { ActiveUserContext } from '../active-user-context';
import type { StudentDashboardData } from './contracts';
import { dashboardDefinitionForRole } from './registry';

const ATTENDANCE_THRESHOLD = 75;

/**
 * Server-side Student dashboard loader (Phase 95).
 *
 * Authorization chain:
 *   authenticated session → active tenant → role must be STUDENT →
 *   student record scoped by id + userId + tenantId → real aggregates only.
 *
 * No fabricated values are ever returned. Empty collections are legitimate and
 * rendered by the UI as empty states.
 */
export async function getStudentDashboardData(context: ActiveUserContext): Promise<StudentDashboardData> {
  if (context.activeRole !== RoleType.STUDENT || !context.studentProfileId) {
    throw new Error('Unauthorized: Student role required');
  }

  const { tenantId, userId, studentProfileId } = context;
  const db = getTenantDb(tenantId);

  const student = await db.student.findFirst({
    where: { id: studentProfileId, userId, tenantId },
    include: {
      user: { select: { name: true, email: true } },
      batch: { include: { program: true } },
      section: true,
    },
  });

  if (!student) {
    throw new Error('Your student profile could not be resolved.');
  }

  const [user, attendanceRecords, enrollments, invoices, notices, activityLogs] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true } }),
    db.attendanceRecord.findMany({
      where: { studentId: student.id, tenantId },
      select: { status: true, id: true },
    }),
    db.enrollment.findMany({
      where: { studentId: student.id, tenantId },
      select: {
        id: true,
        courseOffering: {
          select: {
            id: true,
            course: { select: { code: true, title: true } },
            timetableSlots: {
              select: { id: true, dayOfWeek: true, startTime: true, endTime: true, room: { select: { roomNumber: true, building: true } } },
            },
            assignments: {
              select: {
                id: true,
                title: true,
                dueDate: true,
                submissions: { where: { studentId: student.id }, select: { marksObtained: true } },
              },
            },
          },
        },
      },
    }),
    db.invoice.findMany({
      where: { studentId: student.id, tenantId },
      select: { id: true, amount: true, status: true, dueDate: true },
    }),
    db.notice.findMany({
      where: { tenantId, OR: [{ targetRole: 'ALL' }, { targetRole: 'STUDENT' }] },
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

  // Today's classes from real timetable slots (may legitimately be empty).
  const todayIndex = new Date().getDay(); // 0 = Sunday
  const todayClasses = enrollments.flatMap((enrollment) =>
    enrollment.courseOffering.timetableSlots
      .filter((slot) => slot.dayOfWeek === todayIndex)
      .map((slot) => ({
        id: slot.id,
        code: enrollment.courseOffering.course.code,
        title: enrollment.courseOffering.course.title,
        time: `${slot.startTime} – ${slot.endTime}`,
        room: slot.room ? `${slot.room.building} ${slot.room.roomNumber}` : 'Room not assigned',
        status: 'UPCOMING' as const,
      })),
  );

  // Real attendance percentage (null when no sessions recorded).
  const present = attendanceRecords.filter((record) => record.status === 'PRESENT' || record.status === 'LATE').length;
  const total = attendanceRecords.length;
  const attendance =
    total === 0
      ? null
      : { present, total, percentage: Math.round((present / total) * 100) };

  // Real assignments and submission status for this student only.
  const assignments = enrollments.flatMap((enrollment) =>
    enrollment.courseOffering.assignments.map((assignment) => ({
      id: assignment.id,
      title: assignment.title,
      courseCode: enrollment.courseOffering.course.code,
      dueDate: assignment.dueDate.toISOString(),
      submitted: assignment.submissions.length > 0,
      marksObtained: assignment.submissions[0]?.marksObtained ?? null,
    })),
  );

  // Real fee aggregates.
  const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  const outstandingAmount = invoices
    .filter((invoice) => invoice.status === 'PENDING' || invoice.status === 'PARTIAL')
    .reduce((sum, invoice) => sum + invoice.amount, 0);
  const nextDueDate = invoices
    .filter((invoice) => invoice.status !== 'PAID')
    .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0]?.dueDate ?? null;

  const feeStatus: StudentDashboardData['feeSummary'] = {
    outstandingAmount: invoices.length === 0 ? null : outstandingAmount,
    totalInvoiced: invoices.length === 0 ? null : totalInvoiced,
    nextDueDate: nextDueDate ? nextDueDate.toISOString() : null,
    invoiceCount: invoices.length,
    status: invoices.length === 0
      ? 'UNKNOWN'
      : outstandingAmount <= 0
        ? 'CLEAR'
        : outstandingAmount < totalInvoiced
          ? 'PARTIAL'
          : 'OUTSTANDING',
  };

  // Risk alerts derived from real data only.
  const riskAlerts: StudentDashboardData['riskAlerts'] = [];
  if (attendance && attendance.percentage < ATTENDANCE_THRESHOLD) {
    riskAlerts.push({
      id: 'attendance-shortage',
      level: 'danger',
      message: `Your attendance is ${attendance.percentage}%, below the ${ATTENDANCE_THRESHOLD}% examination threshold.`,
      href: '/attendance',
    });
  }
  if (feeStatus.status === 'OUTSTANDING' || feeStatus.status === 'PARTIAL') {
    riskAlerts.push({
      id: 'fee-due',
      level: 'warning',
      message: `You have an outstanding fee balance of ${formatCurrency(feeStatus.outstandingAmount ?? 0)}.`,
      href: '/payments',
    });
  }

  const definition = dashboardDefinitionForRole(RoleType.STUDENT);
  const quickActions = definition.quickActions.map((action) => ({ label: action.label, href: action.href }));

  return {
    role: 'STUDENT',
    identity: {
      id: userId,
      name: user?.name ?? student.user.name,
      email: user?.email ?? student.user.email,
      rollNumber: student.rollNumber,
      programme: student.batch.program.name,
      batch: student.batch.name,
      section: student.section?.name ?? null,
    },
    academicPeriod: null,
    cgpa: student.cgpa,
    creditsEarned: student.creditsEarned,
    todayClasses,
    attendance,
    assignments,
    feeSummary: feeStatus,
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
