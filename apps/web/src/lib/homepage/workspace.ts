import type { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../active-user-context';
import { prisma } from '../db';
import { getAdminDashboardData } from '../dashboard/admin';
import type { DashboardMetric, QuickAction, RiskAlert } from '../dashboard/contracts';
import { getFacultyDashboardData } from '../dashboard/faculty';
import { getOperationalDashboardData } from '../dashboard/operational';
import { isOperationalDashboardRole } from '../dashboard/operational-contracts';
import { getParentDashboardData } from '../dashboard/parent';
import { getPhase4DashboardData } from '../dashboard/phase4';
import { isPhase4DashboardRole } from '../dashboard/phase4-contracts';
import { getPhase5DashboardData } from '../dashboard/phase5';
import { isPhase5DashboardRole } from '../dashboard/phase5-contracts';
import { dashboardDefinitionForRole } from '../dashboard/registry';
import { getStudentDashboardData } from '../dashboard/student';

export type EnterpriseHomeMetric = DashboardMetric & {
  progress?: number | null;
};

export type EnterpriseHomeSummary = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  href?: string;
  progress?: number;
};

export type EnterpriseHomeWorkItem = {
  id: string;
  title: string;
  detail: string;
  status?: string;
  date?: string;
  href?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
};

export type EnterpriseHomeActivity = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
};

export type EnterpriseHomeNotice = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type EnterpriseHomeData = {
  role: RoleType;
  identity: {
    name: string;
    email: string;
    title: string;
  };
  heading: {
    eyebrow: string;
    title: string;
    description: string;
    assurance?: string;
  };
  metrics: EnterpriseHomeMetric[];
  summaries: EnterpriseHomeSummary[];
  work: {
    title: string;
    description: string;
    items: EnterpriseHomeWorkItem[];
  };
  upcoming: EnterpriseHomeWorkItem[];
  alerts: RiskAlert[];
  actions: QuickAction[];
  notices: EnterpriseHomeNotice[];
  activity: EnterpriseHomeActivity[];
  generatedAt: string;
  dataScopeLabel: string;
};

function currency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function percentage(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function nowIso() {
  return new Date().toISOString();
}

export async function getEnterpriseHomepageData(context: ActiveUserContext): Promise<EnterpriseHomeData> {
  const definition = dashboardDefinitionForRole(context.activeRole);

  if (context.activeRole === 'INSTITUTION_ADMIN') {
    const data = await getAdminDashboardData(context);
    return {
      role: context.activeRole,
      identity: data.identity,
      heading: {
        eyebrow: 'Institution command centre',
        title: 'Institution operations at a glance',
        description: 'A live, tenant-scoped view of people, academics, finance, service cases and institutional activity.',
        assurance: 'Every figure below is derived from the active institution context.',
      },
      metrics: data.metrics,
      summaries: [
        { id: 'users-total', label: 'Total authorised users', value: data.userSummary.total, detail: `${data.userSummary.students} students · ${data.userSummary.faculty} faculty` },
        { id: 'academics-departments', label: 'Academic structure', value: data.academicsSummary.departments, detail: `${data.academicsSummary.courses} courses · ${data.academicsSummary.courseOfferings} offerings` },
        { id: 'academics-enrolments', label: 'Course enrolments', value: data.academicsSummary.enrollments, detail: 'Current institution enrolment records' },
        { id: 'finance-outstanding', label: 'Outstanding fees', value: currency(data.financeSummary.outstandingAmount), detail: `${data.financeSummary.invoiceCount} recorded invoices`, href: '/payments' },
        { id: 'finance-payments', label: 'Recorded payments', value: data.financeSummary.paymentCount, detail: currency(data.financeSummary.collectedAmount), href: '/payments' },
      ],
      work: {
        title: 'Operational follow-up',
        description: 'Recent support and service cases that are visible to institution administration.',
        items: data.supportCases.map((item) => ({
          id: item.id,
          title: item.title,
          detail: `${item.caseNumber} · ${item.category}`,
          status: item.status,
          date: item.createdAt,
          href: '/support/cases',
          priority: /critical|urgent/i.test(item.priority) ? 'critical' : /high/i.test(item.priority) ? 'high' : 'normal',
        })),
      },
      upcoming: [],
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: data.notices,
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Institution scoped',
    };
  }

  // The company SUPER_ADMIN has a separate cross-institution control plane.
  // Do not reuse tenant administrator aggregates for a platform-wide homepage.
  if (context.activeRole === 'SUPER_ADMIN') {
    const user = await prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId },
      select: { name: true, email: true },
    });
    if (!user) throw new Error('Unable to resolve the platform administrator profile.');
    return {
      role: context.activeRole,
      identity: { name: user.name, email: user.email, title: 'CampusOS Company Administrator' },
      heading: {
        eyebrow: 'CampusOS company control plane',
        title: 'Platform portfolio and customer operations',
        description: 'Use the dedicated company administration console for institutions, contracts, lifecycle controls and portfolio operations.',
        assurance: 'Cross-institution information remains inside the SUPER_ADMIN control plane.',
      },
      metrics: [
        { id: 'permissions', label: 'Authorised capabilities', value: context.permissions.length, detail: 'Capabilities attached to the active SUPER_ADMIN role', tone: 'neutral' },
      ],
      summaries: [
        { id: 'company-admin', label: 'Company control centre', value: 'Available', detail: 'Institutions, contracts, renewals and operations', href: '/company-admin' },
        { id: 'role-scope', label: 'Active role', value: 'SUPER_ADMIN', detail: 'Platform administration scope' },
      ],
      work: {
        title: 'Company operations',
        description: 'Open the dedicated control centre to work with customer institutions and commercial lifecycle records.',
        items: [{ id: 'open-company-admin', title: 'CampusOS Company Control Center', detail: 'Manage institutions, contracts, renewals, lifecycle status and portfolio activity.', status: 'AVAILABLE', href: '/company-admin' }],
      },
      upcoming: [],
      alerts: [],
      actions: [{ label: 'Open company control center', href: '/company-admin' }, { label: 'Open platform dashboard', href: '/dashboard/admin' }],
      notices: [],
      activity: [],
      generatedAt: nowIso(),
      dataScopeLabel: 'Platform administrator',
    };
  }

  if (context.activeRole === 'STUDENT') {
    const data = await getStudentDashboardData(context);
    const metrics: EnterpriseHomeMetric[] = [];
    if (data.cgpa !== null) metrics.push({ id: 'cgpa', label: 'CGPA', value: data.cgpa.toFixed(2), detail: 'Published academic record', tone: 'neutral' });
    if (data.attendance?.percentage !== null && data.attendance?.percentage !== undefined) {
      metrics.push({ id: 'attendance', label: 'Attendance', value: `${data.attendance.percentage.toFixed(1)}%`, detail: `${data.attendance.present} of ${data.attendance.total} marked present`, tone: data.attendance.percentage >= 75 ? 'positive' : 'warning', progress: percentage(data.attendance.percentage) });
    }
    if (data.feeSummary.outstandingAmount !== null) metrics.push({ id: 'fees', label: 'Outstanding fees', value: currency(data.feeSummary.outstandingAmount), detail: `${data.feeSummary.invoiceCount} invoice records`, tone: data.feeSummary.outstandingAmount > 0 ? 'warning' : 'positive' });
    metrics.push({ id: 'assignments', label: 'Open assignments', value: data.assignments.filter((item) => !item.submitted).length, detail: `${data.assignments.length} assignments visible`, tone: 'neutral' });

    return {
      role: data.role,
      identity: { name: data.identity.name, email: data.identity.email, title: `${data.identity.programme} · ${data.identity.rollNumber}` },
      heading: {
        eyebrow: 'Student workspace',
        title: 'Your academic day, organised',
        description: 'Classes, assignments, attendance, fees, published results and student services from your authorised student record.',
        assurance: 'Only your own student data and published institutional information is shown.',
      },
      metrics,
      summaries: [
        { id: 'academic-period', label: 'Academic period', value: data.academicPeriod?.label ?? 'Not configured', detail: 'Current academic context' },
        { id: 'today-classes', label: 'Classes today', value: data.todayClasses.length, detail: data.todayClasses.length ? 'From your active timetable' : 'No class records for today' },
        { id: 'exams', label: 'Upcoming examinations', value: data.examinations.filter((item) => item.status === 'UPCOMING').length, detail: 'Published examination schedule' },
        { id: 'services', label: 'Service requests', value: data.studentServices.length, detail: 'Requests visible to your account' },
      ],
      work: {
        title: 'Priority learning work',
        description: 'Assignments from your authorised course enrolments.',
        items: data.assignments.slice(0, 8).map((item) => ({
          id: item.id,
          title: item.title,
          detail: item.courseCode,
          status: item.submitted ? 'SUBMITTED' : 'PENDING',
          date: item.dueDate,
          priority: item.submitted ? 'normal' : 'high',
        })),
      },
      upcoming: [
        ...data.todayClasses.map((item) => ({ id: `class-${item.id}`, title: `${item.code} · ${item.title}`, detail: `${item.time} · ${item.room}`, status: item.status })),
        ...data.examinations.filter((item) => item.status === 'UPCOMING').slice(0, 5).map((item) => ({ id: `exam-${item.id}`, title: item.name, detail: item.type, status: 'UPCOMING', date: item.examDate })),
      ],
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: data.notices,
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Personal student record',
    };
  }

  if (context.activeRole === 'FACULTY') {
    const data = await getFacultyDashboardData(context);
    return {
      role: data.role,
      identity: { name: data.identity.name, email: data.identity.email, title: data.identity.designation ?? data.identity.title },
      heading: {
        eyebrow: 'Faculty command centre',
        title: 'Teaching work that needs attention',
        description: 'Assigned courses, today’s teaching schedule, grading workload and attendance responsibilities.',
        assurance: 'Student information is limited to the courses and sections assigned to this faculty account.',
      },
      metrics: data.metrics,
      summaries: [
        { id: 'courses', label: 'Assigned courses', value: data.assignedCourses.length, detail: 'Current authorised teaching assignments' },
        { id: 'grading', label: 'Pending grading', value: data.pendingGrading.total, detail: 'Ungraded submissions in assigned courses' },
        { id: 'attendance', label: 'Attendance sessions today', value: `${data.attendance.recordedToday}/${data.attendance.sessionCount}`, detail: 'Recorded / scheduled sessions' },
        { id: 'period', label: 'Academic period', value: data.academicPeriod?.label ?? 'Not configured', detail: 'Current teaching context' },
      ],
      work: {
        title: 'Teaching portfolio',
        description: 'Compact view of assigned courses and outstanding grading work.',
        items: data.assignedCourses.slice(0, 8).map((course) => ({
          id: course.id,
          title: `${course.code} · ${course.title}`,
          detail: `${course.studentCount} students · ${course.assignmentCount} assignments`,
          status: course.ungradedSubmissionCount > 0 ? `${course.ungradedSubmissionCount} TO GRADE` : 'CURRENT',
          priority: course.ungradedSubmissionCount > 0 ? 'high' : 'normal',
        })),
      },
      upcoming: data.todayClasses.map((item) => ({ id: item.id, title: `${item.code} · ${item.title}`, detail: `${item.time} · ${item.room}`, status: item.status })),
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: [],
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Assigned teaching scope',
    };
  }

  if (context.activeRole === 'PARENT') {
    const data = await getParentDashboardData(context);
    const selected = data.selectedStudent;
    const metrics: EnterpriseHomeMetric[] = [
      { id: 'linked', label: 'Linked students', value: data.linkedStudents.length, detail: 'Verified guardian relationships', tone: 'neutral' },
    ];
    if (selected?.attendance?.percentage !== null && selected?.attendance?.percentage !== undefined) {
      metrics.push({ id: 'attendance', label: 'Attendance', value: `${selected.attendance.percentage.toFixed(1)}%`, detail: `For ${selected.name}`, tone: selected.attendance.percentage >= 75 ? 'positive' : 'warning', progress: percentage(selected.attendance.percentage) });
    }
    if (selected?.feeSummary.outstandingAmount !== null && selected?.feeSummary.outstandingAmount !== undefined) {
      metrics.push({ id: 'fees', label: 'Outstanding fees', value: currency(selected.feeSummary.outstandingAmount), detail: selected.name, tone: selected.feeSummary.outstandingAmount > 0 ? 'warning' : 'positive' });
    }
    metrics.push({ id: 'results', label: 'Published results', value: selected?.publishedResults.length ?? 0, detail: selected ? `For ${selected.name}` : 'No linked student selected', tone: 'neutral' });

    return {
      role: data.role,
      identity: data.identity,
      heading: {
        eyebrow: 'Guardian overview',
        title: selected ? `${selected.name} · authorised family view` : 'Linked student overview',
        description: 'Attendance, fees, published results and institutional notices for verified linked students.',
        assurance: 'Only verified guardian relationships and published student information are exposed.',
      },
      metrics,
      summaries: selected ? [
        { id: 'programme', label: 'Programme', value: selected.programme, detail: selected.batch },
        { id: 'roll', label: 'Roll number', value: selected.rollNumber, detail: selected.relationship },
        { id: 'cgpa', label: 'Published CGPA', value: selected.cgpa?.toFixed(2) ?? 'Not published', detail: 'Published academic result only' },
        { id: 'fees-state', label: 'Fee status', value: selected.feeSummary.status, detail: `${selected.feeSummary.invoiceCount} invoice records`, href: '/payments' },
      ] : [],
      work: {
        title: 'Published academic information',
        description: 'Results visible for the currently selected linked student.',
        items: selected?.publishedResults.slice(0, 8).map((item) => ({ id: item.id, title: item.examinationName, detail: `SGPA ${item.sgpa.toFixed(2)} · CGPA ${item.cgpa.toFixed(2)}`, status: item.status, date: item.publishedAt })) ?? [],
      },
      upcoming: [],
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: data.notices,
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Verified guardian scope',
    };
  }

  if (isPhase5DashboardRole(context.activeRole)) {
    const data = await getPhase5DashboardData(context);
    return {
      role: data.role,
      identity: data.identity,
      heading: data.heading,
      metrics: data.metrics,
      summaries: data.insights.items.map((item) => ({ id: item.id, label: item.label, value: item.value, detail: item.detail, progress: item.percentage, href: item.href })),
      work: { title: data.queue.title, description: data.queue.description, items: data.queue.items.map((item) => ({ id: item.id, title: item.title, detail: item.detail, status: item.status, href: item.href, priority: /risk|late|critical|urgent/i.test(item.status) ? 'high' : 'normal' })) },
      upcoming: [],
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: data.notices,
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Role-authorised operational scope',
    };
  }

  if (isPhase4DashboardRole(context.activeRole)) {
    const data = await getPhase4DashboardData(context);
    return {
      role: data.role,
      identity: data.identity,
      heading: data.heading,
      metrics: data.metrics,
      summaries: data.summaries.map((item) => ({ id: item.id, label: item.label, value: item.value, detail: item.detail, href: item.href })),
      work: { title: data.queue.title, description: data.queue.description, items: data.queue.items.map((item) => ({ id: item.id, title: item.title, detail: item.detail, status: item.status, date: item.date, href: item.href })) },
      upcoming: [],
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: data.notices,
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Role-authorised operational scope',
    };
  }

  if (isOperationalDashboardRole(context.activeRole)) {
    const data = await getOperationalDashboardData(context);
    return {
      role: data.role,
      identity: data.identity,
      heading: data.heading,
      metrics: data.metrics,
      summaries: data.summary.map((item) => ({ id: item.id, label: item.label, value: item.value, detail: item.detail, href: item.href })),
      work: { title: data.recordsTitle, description: data.recordsDescription, items: data.records.map((item) => ({ id: item.id, title: item.title, detail: item.detail, status: item.status, date: item.date, href: item.href })) },
      upcoming: [],
      alerts: data.riskAlerts,
      actions: data.quickActions,
      notices: data.notices,
      activity: data.recentActivity,
      generatedAt: nowIso(),
      dataScopeLabel: 'Role-authorised operational scope',
    };
  }

  const user = await prisma.user.findFirst({
    where: { id: context.userId, tenantId: context.tenantId },
    select: { name: true, email: true },
  });
  if (!user) throw new Error('Unable to resolve the active user profile.');

  return {
    role: context.activeRole,
    identity: { name: user.name, email: user.email, title: definition.title },
    heading: {
      eyebrow: 'Role workspace',
      title: definition.title,
      description: definition.description,
      assurance: 'The homepage only exposes navigation and capability information authorised for your active role.',
    },
    metrics: [{ id: 'permissions', label: 'Authorised capabilities', value: context.permissions.length, detail: 'Permissions resolved for the active role', tone: 'neutral' }],
    summaries: definition.navigation.map((group, index) => ({ id: `nav-${index}`, label: group.label, value: group.items.length, detail: 'Available navigation destinations' })),
    work: { title: 'Workspace navigation', description: 'Role-approved destinations from the central dashboard registry.', items: definition.navigation.flatMap((group) => group.items).slice(0, 10).map((item, index) => ({ id: `route-${index}`, title: item.label, detail: groupLabelForHref(definition.navigation, item.href), href: item.href, status: 'AVAILABLE' })) },
    upcoming: [],
    alerts: [],
    actions: definition.quickActions,
    notices: [],
    activity: [],
    generatedAt: nowIso(),
    dataScopeLabel: 'Role-authorised navigation scope',
  };
}

function groupLabelForHref(groups: ReturnType<typeof dashboardDefinitionForRole>['navigation'], href: string) {
  return groups.find((group) => group.items.some((item) => item.href === href))?.label ?? 'Workspace';
}
