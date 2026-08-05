import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../active-user-context';
import { prisma } from '../db';
import { getAdminDashboardData } from './admin';
import { DashboardError } from './errors';
import { getFacultyDashboardData } from './faculty';
import { getOperationalDashboardData } from './operational';
import { isOperationalDashboardRole } from './operational-contracts';
import { getParentDashboardData } from './parent';
import { getPhase4DashboardData } from './phase4';
import { isPhase4DashboardRole } from './phase4-contracts';
import { getPhase5DashboardData } from './phase5';
import { isPhase5DashboardRole } from './phase5-contracts';
import {
  clampPhase6Percentage,
  phase6BlueprintForRole,
  type Phase6ExperienceData,
  type Phase6Metric,
  type Phase6QueueItem,
  type Phase6Signal,
} from './phase6-contracts';
import { getStudentDashboardData } from './student';

/**
 * Dashboard UI Phase 6 orchestration layer.
 *
 * Phase 6 does not replace the reviewed role loaders. It composes their
 * server-authorised, tenant-scoped contracts into a compact command layer that
 * is unique for every known role. This avoids a second source of truth for
 * metrics while ensuring the student, guardian, faculty, finance, academic and
 * operational scopes remain exactly as strict as their existing loaders.
 */
export async function getPhase6ExperienceData(
  context: ActiveUserContext,
): Promise<Phase6ExperienceData> {
  const [user, institution, unreadNotifications, openSupportCases, relevantNotices, recentActivity] = await Promise.all([
    prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId, isActive: true },
      select: { name: true, email: true },
    }),
    prisma.institution.findFirst({
      where: { id: context.tenantId },
      select: { name: true },
    }),
    prisma.notification.count({
      where: { tenantId: context.tenantId, userId: context.userId, isRead: false },
    }),
    prisma.supportCase.count({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        status: { in: ['NEW', 'IN_PROGRESS'] },
      },
    }),
    prisma.notice.count({
      where: {
        tenantId: context.tenantId,
        OR: [{ targetRole: 'ALL' }, { targetRole: context.activeRole }],
      },
    }),
    prisma.auditLog.count({
      where: { tenantId: context.tenantId, userId: context.userId },
    }),
  ]);

  if (!user || !institution) {
    throw new DashboardError('Your Phase 6 workspace context could not be resolved.', 403);
  }

  const rolePayload = await loadRoleExperience(context);

  return {
    role: context.activeRole,
    identity: {
      name: user.name,
      email: user.email,
      institution: institution.name,
    },
    blueprint: phase6BlueprintForRole(context.activeRole),
    ...rolePayload,
    context: {
      unreadNotifications,
      openSupportCases,
      relevantNotices,
      recentActivity,
      refreshedAt: new Date().toISOString(),
    },
  };
}

type RoleExperiencePayload = Pick<Phase6ExperienceData, 'metrics' | 'signals' | 'queue'>;

type MetricLike = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  tone?: string;
};

type SignalLike = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  percentage?: number;
  href?: string;
};

type QueueLike = {
  id: string;
  title: string;
  detail: string;
  status?: string;
  href?: string;
};

async function loadRoleExperience(context: ActiveUserContext): Promise<RoleExperiencePayload> {
  if (context.activeRole === RoleType.SUPER_ADMIN || context.activeRole === RoleType.INSTITUTION_ADMIN) {
    const data = await getAdminDashboardData(context);
    const totalUsers = Math.max(1, data.userSummary.total);

    return {
      metrics: normaliseMetrics(data.metrics),
      signals: [
        {
          id: 'phase6-admin-students',
          label: 'Student account share',
          value: data.userSummary.students,
          detail: `${data.userSummary.total} tracked role accounts`,
          percentage: clampPhase6Percentage((data.userSummary.students / totalUsers) * 100),
          href: '/settings',
        },
        {
          id: 'phase6-admin-faculty',
          label: 'Faculty account share',
          value: data.userSummary.faculty,
          detail: `${data.academicsSummary.courseOfferings} course offerings`,
          percentage: clampPhase6Percentage((data.userSummary.faculty / totalUsers) * 100),
          href: '/departments',
        },
        {
          id: 'phase6-admin-academics',
          label: 'Academic configuration',
          value: data.academicsSummary.courses,
          detail: `${data.academicsSummary.departments} departments`,
          percentage: clampPhase6Percentage(
            data.academicsSummary.courses > 0
              ? (data.academicsSummary.courseOfferings / data.academicsSummary.courses) * 100
              : 0,
          ),
          href: '/departments',
        },
        {
          id: 'phase6-admin-finance',
          label: 'Collection coverage',
          value: formatCurrency(data.financeSummary.collectedAmount),
          detail: `${data.financeSummary.invoiceCount} invoices`,
          percentage: clampPhase6Percentage(
            data.financeSummary.collectedAmount + data.financeSummary.outstandingAmount > 0
              ? (data.financeSummary.collectedAmount /
                  (data.financeSummary.collectedAmount + data.financeSummary.outstandingAmount)) *
                  100
              : 0,
          ),
          href: '/receipts',
        },
      ],
      queue: {
        title: context.activeRole === RoleType.SUPER_ADMIN ? 'Platform service watch' : 'Institution service watch',
        description: 'Latest support records already authorised by the administrator dashboard loader.',
        items: data.supportCases.slice(0, 5).map((item) => ({
          id: item.id,
          title: item.title,
          detail: `${item.caseNumber} · ${formatStatus(item.priority)}`,
          status: item.status,
          href: '/support/cases',
        })),
        emptyMessage: 'No support cases are currently available.',
      },
    };
  }

  if (context.activeRole === RoleType.STUDENT) {
    const data = await getStudentDashboardData(context);
    const pendingAssignments = data.assignments.filter((assignment) => !assignment.submitted);
    const attendanceValue = data.attendance ? `${data.attendance.percentage}%` : 'Not recorded';
    const outstanding = data.feeSummary.outstandingAmount ?? 0;

    return {
      metrics: [
        {
          id: 'phase6-student-classes',
          label: "Today's classes",
          value: data.todayClasses.length,
          detail: 'Timetable slots for today',
          tone: 'neutral',
        },
        {
          id: 'phase6-student-attendance',
          label: 'Attendance',
          value: attendanceValue,
          detail: data.attendance ? `${data.attendance.present}/${data.attendance.total} present or late` : 'No attendance records',
          tone: data.attendance && data.attendance.percentage < 75 ? 'warning' : 'positive',
        },
        {
          id: 'phase6-student-assignments',
          label: 'Pending assignments',
          value: pendingAssignments.length,
          detail: `${data.assignments.length} assigned items`,
          tone: pendingAssignments.length > 0 ? 'warning' : 'positive',
        },
        {
          id: 'phase6-student-fees',
          label: 'Outstanding fees',
          value: formatCurrency(outstanding),
          detail: `${data.feeSummary.invoiceCount} invoices`,
          tone: outstanding > 0 ? 'warning' : 'positive',
        },
      ],
      signals: [
        {
          id: 'phase6-student-progress',
          label: 'Academic credit progress',
          value: data.creditsEarned,
          detail: data.cgpa === null ? 'CGPA not yet recorded' : `CGPA ${data.cgpa.toFixed(2)}`,
          percentage: clampPhase6Percentage(data.creditsEarned),
          href: '/results',
        },
        {
          id: 'phase6-student-submission',
          label: 'Submission completion',
          value: `${data.assignments.length - pendingAssignments.length}/${data.assignments.length}`,
          detail: 'Submitted assignments',
          percentage: data.assignments.length > 0
            ? clampPhase6Percentage(((data.assignments.length - pendingAssignments.length) / data.assignments.length) * 100)
            : 0,
          href: '/assignments',
        },
        {
          id: 'phase6-student-attendance-signal',
          label: 'Attendance coverage',
          value: attendanceValue,
          detail: 'Recorded attendance percentage',
          percentage: data.attendance?.percentage ?? 0,
          href: '/attendance',
        },
      ],
      queue: {
        title: 'Next academic actions',
        description: 'Pending submissions ordered by their recorded due date.',
        items: pendingAssignments
          .slice()
          .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())
          .slice(0, 5)
          .map((assignment) => ({
            id: assignment.id,
            title: assignment.title,
            detail: `${assignment.courseCode} · due ${formatDateTime(assignment.dueDate)}`,
            status: 'PENDING',
            href: '/assignments',
          })),
        emptyMessage: 'No pending assignments require action.',
      },
    };
  }

  if (context.activeRole === RoleType.FACULTY) {
    const data = await getFacultyDashboardData(context);
    const maxStudents = Math.max(1, ...data.assignedCourses.map((course) => course.studentCount));

    return {
      metrics: normaliseMetrics(data.metrics),
      signals: data.assignedCourses.slice(0, 5).map((course) => ({
        id: course.id,
        label: `${course.code} · ${course.title}`,
        value: course.studentCount,
        detail: `${course.assignmentCount} assignments · ${course.ungradedSubmissionCount} ungraded`,
        percentage: clampPhase6Percentage((course.studentCount / maxStudents) * 100),
        href: '/lms',
      })),
      queue: {
        title: data.todayClasses.length > 0 ? "Today's teaching timeline" : 'Grading priority queue',
        description: data.todayClasses.length > 0
          ? 'Real timetable slots assigned to the authenticated faculty profile.'
          : 'Courses with submissions awaiting evaluation.',
        items: data.todayClasses.length > 0
          ? data.todayClasses.slice(0, 5).map((item) => ({
              id: item.id,
              title: `${item.code} · ${item.title}`,
              detail: `${item.time} · ${item.room}`,
              status: item.status,
              href: '/timetable',
            }))
          : data.pendingGrading.perCourse.slice(0, 5).map((item) => ({
              id: item.courseCode,
              title: item.courseCode,
              detail: `${item.count} submissions await grading`,
              status: 'PENDING',
              href: '/assignments',
            })),
        emptyMessage: 'No teaching or grading actions are currently available.',
      },
    };
  }

  if (context.activeRole === RoleType.PARENT) {
    const data = await getParentDashboardData(context);
    const attendance = data.selectedStudent.attendance;
    const outstanding = data.selectedStudent.feeSummary.outstandingAmount ?? 0;

    return {
      metrics: [
        {
          id: 'phase6-parent-linked',
          label: 'Linked students',
          value: data.linkedStudents.length,
          detail: `Viewing ${data.selectedStudent.name}`,
          tone: 'neutral',
        },
        {
          id: 'phase6-parent-attendance',
          label: 'Ward attendance',
          value: attendance ? `${attendance.percentage}%` : 'Not recorded',
          detail: attendance ? `${attendance.present}/${attendance.total} present or late` : 'No attendance records',
          tone: attendance && attendance.percentage < 75 ? 'warning' : 'positive',
        },
        {
          id: 'phase6-parent-results',
          label: 'Published results',
          value: data.selectedStudent.publishedResults.length,
          detail: data.selectedStudent.cgpa === null ? 'CGPA not recorded' : `CGPA ${data.selectedStudent.cgpa.toFixed(2)}`,
          tone: 'neutral',
        },
        {
          id: 'phase6-parent-fees',
          label: 'Outstanding fees',
          value: formatCurrency(outstanding),
          detail: `${data.selectedStudent.feeSummary.invoiceCount} invoices`,
          tone: outstanding > 0 ? 'warning' : 'positive',
        },
      ],
      signals: data.linkedStudents.slice(0, 5).map((student, index) => ({
        id: student.id,
        label: student.name,
        value: student.rollNumber,
        detail: `${student.programme} · ${student.batch}`,
        percentage: student.id === data.selectedStudentId ? 100 : Math.max(20, 80 - index * 15),
        href: '/dashboard/parent',
      })),
      queue: {
        title: 'Guardian information watch',
        description: 'Latest notices visible to the authenticated guardian role.',
        items: data.notices.slice(0, 5).map((notice) => ({
          id: notice.id,
          title: notice.title,
          detail: formatDateTime(notice.createdAt),
          status: 'NOTICE',
          href: '/community',
        })),
        emptyMessage: 'No guardian-relevant notices are available.',
      },
    };
  }

  if (isPhase5DashboardRole(context.activeRole)) {
    const data = await getPhase5DashboardData(context);
    return {
      metrics: normaliseMetrics(data.metrics),
      signals: normaliseSignals(data.insights.items),
      queue: {
        title: data.queue.title,
        description: data.queue.description,
        items: normaliseQueue(data.queue.items),
        emptyMessage: data.queue.emptyMessage,
      },
    };
  }

  if (isPhase4DashboardRole(context.activeRole)) {
    const data = await getPhase4DashboardData(context);
    return {
      metrics: normaliseMetrics(data.metrics),
      signals: normaliseSignals(data.breakdown.items),
      queue: {
        title: data.queue.title,
        description: data.queue.description,
        items: normaliseQueue(data.queue.items),
        emptyMessage: data.queue.emptyMessage,
      },
    };
  }

  if (isOperationalDashboardRole(context.activeRole)) {
    const data = await getOperationalDashboardData(context);
    return {
      metrics: normaliseMetrics(data.metrics),
      signals: signalsFromOperationalSummary(data.summary),
      queue: {
        title: data.recordsTitle,
        description: data.recordsDescription,
        items: normaliseQueue(data.records),
        emptyMessage: 'No operational records are available for this role.',
      },
    };
  }

  throw new DashboardError(`No Phase 6 adapter is configured for role ${context.activeRole}.`, 403);
}

function normaliseMetrics(metrics: MetricLike[]): Phase6Metric[] {
  return metrics.slice(0, 4).map((metric) => ({
    id: metric.id,
    label: metric.label,
    value: metric.value,
    detail: metric.detail,
    tone: normaliseTone(metric.tone),
  }));
}

function normaliseSignals(items: SignalLike[]): Phase6Signal[] {
  const numericValues = items
    .map((item) => (typeof item.value === 'number' ? item.value : 0))
    .filter((value) => value > 0);
  const max = Math.max(1, ...numericValues);

  return items.slice(0, 5).map((item) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    detail: item.detail,
    percentage: clampPhase6Percentage(
      item.percentage ?? (typeof item.value === 'number' ? (item.value / max) * 100 : 0),
    ),
    href: item.href,
  }));
}

function signalsFromOperationalSummary(
  items: Array<{ id: string; label: string; value: string | number; detail: string; href?: string }>,
): Phase6Signal[] {
  const numeric = items
    .map((item) => (typeof item.value === 'number' ? item.value : 0))
    .filter((value) => value > 0);
  const max = Math.max(1, ...numeric);

  return items.slice(0, 5).map((item, index) => ({
    id: item.id,
    label: item.label,
    value: item.value,
    detail: item.detail,
    percentage: typeof item.value === 'number'
      ? clampPhase6Percentage((item.value / max) * 100)
      : Math.max(25, 100 - index * 18),
    href: item.href,
  }));
}

function normaliseQueue(items: QueueLike[]): Phase6QueueItem[] {
  return items.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title,
    detail: item.detail,
    status: item.status,
    href: item.href ?? '/dashboard',
  }));
}

function normaliseTone(value?: string): Phase6Metric['tone'] {
  if (value === 'positive' || value === 'warning' || value === 'danger') return value;
  return 'neutral';
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
