import { RoleType } from '@prisma/client';
import { getTenantDb } from '../db';
import type { ActiveUserContext } from '../active-user-context';
import type { StudentDashboardData } from './contracts';
import { dashboardDefinitionForRole } from './registry';
import { DashboardError } from './errors';

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
    throw new DashboardError('Unauthorized: Student role required', 403);
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
    throw new DashboardError('Your student profile could not be resolved.', 403);
  }

  const [user, attendanceRecords, enrollments, invoices, notices, semesterResults, supportCases, hostelAllocation, notifications, activityLogs] = await Promise.all([
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
            termId: true,
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
    db.studentSemesterResult.findMany({
      where: { studentId: student.id, tenantId, published: true },
      include: { examination: { select: { name: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    }),
    db.supportCase.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, caseNumber: true, title: true, category: true, status: true, priority: true, createdAt: true },
    }),
    db.allocation.findFirst({
      where: { studentId: student.id },
      include: { roomHostel: { include: { hostel: true } } },
    }),
    db.notification.findMany({
      where: { tenantId, userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, body: true, type: true, isRead: true, createdAt: true },
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

  // Examinations: real schedules scoped to the terms the student is enrolled in.
  // The query itself filters by the student's enrolled term ids, so exams from
  // unrelated programmes or departments can never reach the contract.
  const enrolledTermIds = Array.from(new Set(enrollments.map((enrollment) => enrollment.courseOffering.termId)));
  const examinations = enrolledTermIds.length > 0
    ? await db.exam.findMany({
        where: { tenantId, termId: { in: enrolledTermIds } },
        include: { schedules: { select: { id: true, examDate: true } } },
        orderBy: { id: 'asc' },
      })
    : [];
  const now = new Date();
  const examinationItems: StudentDashboardData['examinations'] = examinations.flatMap((exam) =>
    exam.schedules.map((schedule) => ({
      id: schedule.id,
      name: exam.name,
      type: exam.type,
      examDate: schedule.examDate.toISOString(),
      status: schedule.examDate.getTime() < now.getTime() ? ('COMPLETED' as const) : ('UPCOMING' as const),
    })),
  );

  // publishedAt: there is no dedicated publication timestamp on the result row,
  // so the last-verified (updatedAt) timestamp is used as a close proxy.
  const publishedResults: StudentDashboardData['publishedResults'] = semesterResults.map((result) => ({
    id: result.id,
    examinationName: result.examination.name,
    sgpa: result.sgpa,
    cgpa: result.cgpa,
    status: result.status,
    publishedAt: result.updatedAt.toISOString(),
  }));

  // Hostel allocation: the Allocation model has no tenant column; it is
  // transitively scoped because the student was already resolved by
  // id + userId + tenantId above.
  const hostel: StudentDashboardData['hostel'] = hostelAllocation
    ? {
        hostelName: hostelAllocation.roomHostel.hostel.name,
        building: hostelAllocation.roomHostel.hostel.building,
        roomNumber: hostelAllocation.roomHostel.roomNumber,
      }
    : null;

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
    examinations: examinationItems,
    publishedResults,
    studentServices: supportCases.map((supportCase) => ({
      id: supportCase.id,
      caseNumber: supportCase.caseNumber,
      title: supportCase.title,
      category: supportCase.category,
      status: supportCase.status,
      priority: supportCase.priority,
      createdAt: supportCase.createdAt.toISOString(),
    })),
    hostel,
    notices: notices.map((notice) => ({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      createdAt: notice.createdAt.toISOString(),
    })),
    notifications: notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
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
