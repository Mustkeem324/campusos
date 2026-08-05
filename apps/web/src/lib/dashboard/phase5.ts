import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../active-user-context';
import { prisma } from '../db';
import { DashboardError } from './errors';
import {
  clampPercentage,
  isPhase5DashboardRole,
  type Phase5DashboardData,
  type Phase5Insight,
  type Phase5QueueItem,
} from './phase5-contracts';
import { roleWorkspaceProfileForRole } from './role-workspace';

export async function getPhase5DashboardData(
  context: ActiveUserContext,
): Promise<Phase5DashboardData> {
  if (!isPhase5DashboardRole(context.activeRole)) {
    throw new DashboardError('Unauthorized: Phase 5 dashboard role required', 403);
  }

  const [user, notices, activityLogs] = await Promise.all([
    prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId, isActive: true },
      select: { id: true, name: true, email: true },
    }),
    prisma.notice.findMany({
      where: {
        tenantId: context.tenantId,
        OR: [{ targetRole: 'ALL' }, { targetRole: context.activeRole }],
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, content: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      where: { tenantId: context.tenantId, userId: context.userId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, action: true, entity: true, createdAt: true },
    }),
  ]);

  if (!user) {
    throw new DashboardError('Your active Phase 5 profile could not be resolved.', 403);
  }

  const rolePayload = await loadRolePayload(context);
  const profile = roleWorkspaceProfileForRole(context.activeRole);

  return {
    role: context.activeRole,
    identity: {
      id: user.id,
      name: user.name,
      email: user.email,
      title: roleTitle(context.activeRole),
    },
    ...rolePayload,
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

type RolePayload = Omit<
  Phase5DashboardData,
  'role' | 'identity' | 'quickActions' | 'notices' | 'recentActivity'
>;

async function loadRolePayload(context: ActiveUserContext): Promise<RolePayload> {
  switch (context.activeRole) {
    case RoleType.DEAN:
      return loadDeanDashboard(context.tenantId);
    case RoleType.HOD:
      return loadHodDashboard(context.tenantId, context.userId);
    case RoleType.HR_ADMIN:
      return loadHrDashboard(context.tenantId);
    case RoleType.WARDEN:
      return loadWardenDashboard(context.tenantId);
    case RoleType.TRANSPORT_MANAGER:
      return loadTransportDashboard(context.tenantId);
    case RoleType.PLACEMENT_OFFICER:
      return loadPlacementDashboard(context.tenantId);
  }
}

async function loadDeanDashboard(tenantId: string): Promise<RolePayload> {
  const [departmentCount, programCount, courseCount, studentCount, resultCount, departments, programs] = await Promise.all([
    prisma.department.count({ where: { tenantId } }),
    prisma.program.count({ where: { tenantId } }),
    prisma.course.count({ where: { tenantId } }),
    prisma.student.count({ where: { tenantId } }),
    prisma.result.count({ where: { tenantId } }),
    prisma.department.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        _count: { select: { programs: true, courses: true } },
      },
    }),
    prisma.program.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      take: 8,
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

  const insights: Phase5Insight[] = departments.map((department) => ({
    id: department.id,
    label: department.name,
    value: `${department._count.programs} programme${department._count.programs === 1 ? '' : 's'}`,
    detail: `${department.code} · ${department._count.courses} course${department._count.courses === 1 ? '' : 's'}`,
    percentage: programCount > 0
      ? clampPercentage((department._count.programs / programCount) * 100)
      : 0,
    href: '/departments',
  }));

  const queue: Phase5QueueItem[] = programs.map((program) => ({
    id: program.id,
    title: program.name,
    reference: program.code,
    detail: `${program.department.name} · ${program.durationYears} year${program.durationYears === 1 ? '' : 's'} · ${program._count.batches} batch${program._count.batches === 1 ? '' : 'es'}`,
    status: program._count.batches > 0 ? 'CONFIGURED' : 'NEEDS_BATCH',
    href: '/departments',
  }));

  const risks: RolePayload['riskAlerts'] = [];
  if (programCount === 0) {
    risks.push({ id: 'dean-no-programmes', level: 'warning', message: 'No academic programmes are configured.', href: '/departments' });
  }
  if (programs.some((program) => program._count.batches === 0)) {
    risks.push({ id: 'dean-programme-batches', level: 'warning', message: 'One or more programmes do not have an active batch configuration.', href: '/departments' });
  }

  return {
    heading: {
      eyebrow: 'Academic leadership command centre',
      title: 'Programme portfolio, delivery scale and academic evidence',
      description: 'Review the active institution’s academic structure and outcome volume from a leadership perspective without exposing individual student records.',
      assurance: 'Phase 5 reports tenant-scoped portfolio indicators. Academic decisions still require approved programme, department and examination workflows.',
    },
    metrics: [
      { id: 'dean-departments', label: 'Departments', value: departmentCount, detail: 'Academic organisational units', tone: departmentCount > 0 ? 'positive' : 'warning' },
      { id: 'dean-programmes', label: 'Programmes', value: programCount, detail: 'Configured academic programmes', tone: programCount > 0 ? 'positive' : 'warning' },
      { id: 'dean-courses', label: 'Courses', value: courseCount, detail: 'Institution course catalogue', tone: 'neutral' },
      { id: 'dean-results', label: 'Result records', value: resultCount, detail: `${studentCount} student records`, tone: 'neutral' },
    ],
    insights: {
      title: 'Academic portfolio by department',
      description: 'Programme and course distribution across the current institution.',
      items: insights,
    },
    queue: {
      title: 'Programme readiness register',
      description: 'Configured programmes and their current batch coverage.',
      items: queue,
      emptyMessage: 'No programme records are available.',
    },
    riskAlerts: risks,
  };
}

async function loadHodDashboard(tenantId: string, userId: string): Promise<RolePayload> {
  const staff = await prisma.staff.findFirst({
    where: { tenantId, userId },
    select: { departmentId: true, departmentId: true },
  });

  if (!staff?.departmentId) {
    throw new DashboardError('Department profile unresolved for this HOD account.', 403);
  }

  const department = await prisma.department.findFirst({
    where: { id: staff.departmentId, tenantId },
    select: { id: true, name: true, code: true },
  });

  if (!department) {
    throw new DashboardError('The assigned department is not available in this institution.', 403);
  }

  const [programs, courses, facultyCount, studentCount, offerings] = await Promise.all([
    prisma.program.findMany({
      where: { tenantId, departmentId: department.id },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, code: true, _count: { select: { batches: true } } },
    }),
    prisma.course.findMany({
      where: { tenantId, departmentId: department.id },
      orderBy: { title: 'asc' },
      select: { id: true, title: true, code: true, _count: { select: { offerings: true } } },
    }),
    prisma.staff.count({ where: { tenantId, departmentId: department.id } }),
    prisma.student.count({
      where: {
        tenantId,
        batch: { program: { departmentId: department.id } },
      },
    }),
    prisma.courseOffering.count({
      where: { tenantId, course: { departmentId: department.id } },
    }),
  ]);

  const insights = courses.slice(0, 8).map((course) => ({
    id: course.id,
    label: course.title,
    value: course.code,
    detail: `${course._count.offerings} active offering${course._count.offerings === 1 ? '' : 's'}`,
    percentage: offerings > 0
      ? clampPercentage((course._count.offerings / offerings) * 100)
      : 0,
    href: '/lms',
  }));

  const queue = programs.map((program) => ({
    id: program.id,
    title: program.name,
    reference: program.code,
    detail: `${program._count.batches} configured batch${program._count.batches === 1 ? '' : 'es'}`,
    status: program._count.batches > 0 ? 'READY' : 'NEEDS_CONFIGURATION',
    href: '/departments',
  }));

  const risks: RolePayload['riskAlerts'] = [];
  if (courses.length === 0) {
    risks.push({ id: 'hod-no-courses', level: 'warning', message: `${department.name} has no configured courses.`, href: '/departments' });
  }
  if (offerings === 0 && courses.length > 0) {
    risks.push({ id: 'hod-no-offerings', level: 'warning', message: 'Courses exist but no active course offerings are configured.', href: '/lms' });
  }

  return {
    heading: {
      eyebrow: `${department.code} department command centre`,
      title: `${department.name} delivery and programme readiness`,
      description: 'Coordinate department courses, programme coverage, faculty capacity and student delivery within the assigned institutional scope.',
      assurance: 'This view is constrained to the department assigned to the signed-in HOD staff profile.',
    },
    metrics: [
      { id: 'hod-programmes', label: 'Programmes', value: programs.length, detail: 'Department programme portfolio', tone: programs.length > 0 ? 'positive' : 'warning' },
      { id: 'hod-courses', label: 'Courses', value: courses.length, detail: 'Department course catalogue', tone: courses.length > 0 ? 'positive' : 'warning' },
      { id: 'hod-faculty', label: 'Staff profiles', value: facultyCount, detail: 'Staff assigned to the department', tone: facultyCount > 0 ? 'positive' : 'warning' },
      { id: 'hod-students', label: 'Students', value: studentCount, detail: `${offerings} course offerings`, tone: 'neutral' },
    ],
    insights: {
      title: 'Course delivery coverage',
      description: 'Relative offering coverage for the department’s course catalogue.',
      items: insights,
    },
    queue: {
      title: 'Programme readiness',
      description: 'Department programmes and batch configuration state.',
      items: queue,
      emptyMessage: 'No programmes are assigned to this department.',
    },
    riskAlerts: risks,
  };
}

async function loadHrDashboard(tenantId: string): Promise<RolePayload> {
  const [activeUsers, inactiveUsers, staffCount, departmentCount, roleGroups, inactiveAccounts, unassignedStaff] = await Promise.all([
    prisma.user.count({ where: { tenantId, isActive: true } }),
    prisma.user.count({ where: { tenantId, isActive: false } }),
    prisma.staff.count({ where: { tenantId } }),
    prisma.department.count({ where: { tenantId } }),
    prisma.user.groupBy({
      by: ['role'],
      where: { tenantId },
      _count: { _all: true },
      orderBy: { _count: { role: 'desc' } },
    }),
    prisma.user.findMany({
      where: { tenantId, isActive: false },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: { id: true, name: true, email: true, role: true },
    }),
    prisma.staff.findMany({
      where: { tenantId, departmentId: null },
      orderBy: { employeeId: 'asc' },
      take: 8,
      select: { id: true, employeeId: true, designation: true },
    }),
  ]);

  const totalUsers = activeUsers + inactiveUsers;
  const insights = roleGroups.slice(0, 10).map((group) => ({
    id: group.role,
    label: formatStatus(group.role),
    value: group._count._all,
    detail: `${totalUsers > 0 ? clampPercentage((group._count._all / totalUsers) * 100) : 0}% of institution accounts`,
    percentage: totalUsers > 0
      ? clampPercentage((group._count._all / totalUsers) * 100)
      : 0,
    href: '/settings',
  }));

  const queue: Phase5QueueItem[] = [
    ...inactiveAccounts.map((account) => ({
      id: `inactive-${account.id}`,
      title: account.name,
      reference: maskEmail(account.email),
      detail: formatStatus(account.role),
      status: 'INACTIVE',
      href: '/settings',
    })),
    ...unassignedStaff.map((staff) => ({
      id: `unassigned-${staff.id}`,
      title: staff.designation,
      reference: staff.employeeId,
      detail: 'No department assignment is recorded',
      status: 'UNASSIGNED',
      href: '/departments',
    })),
  ].slice(0, 10);

  const risks: RolePayload['riskAlerts'] = [];
  if (inactiveUsers > 0) {
    risks.push({ id: 'hr-inactive-users', level: 'warning', message: `${inactiveUsers} inactive account${inactiveUsers === 1 ? '' : 's'} require review.`, href: '/settings' });
  }
  if (unassignedStaff.length > 0) {
    risks.push({ id: 'hr-unassigned-staff', level: 'warning', message: `${unassignedStaff.length} staff profile${unassignedStaff.length === 1 ? '' : 's'} have no department assignment.`, href: '/departments' });
  }

  return {
    heading: {
      eyebrow: 'People operations command centre',
      title: 'Workforce coverage, account status and organisational readiness',
      description: 'Review institution account distribution, staff coverage and actionable people-operation exceptions without exposing sensitive personnel records.',
      assurance: 'The dashboard shows operational account metadata only. Sensitive HR records require dedicated authorised workflows.',
    },
    metrics: [
      { id: 'hr-active-users', label: 'Active accounts', value: activeUsers, detail: `${totalUsers} total institution accounts`, tone: activeUsers > 0 ? 'positive' : 'warning' },
      { id: 'hr-staff', label: 'Staff profiles', value: staffCount, detail: `${departmentCount} departments`, tone: staffCount > 0 ? 'positive' : 'warning' },
      { id: 'hr-inactive', label: 'Inactive accounts', value: inactiveUsers, detail: 'Accounts currently blocked from sign-in', tone: inactiveUsers > 0 ? 'warning' : 'positive' },
      { id: 'hr-role-coverage', label: 'Role coverage', value: roleGroups.length, detail: 'Distinct persisted role types', tone: roleGroups.length >= 8 ? 'positive' : 'neutral' },
    ],
    insights: {
      title: 'Account distribution by role',
      description: 'Persisted institution accounts grouped by active role.',
      items: insights,
    },
    queue: {
      title: 'People operations exception queue',
      description: 'Inactive accounts and staff profiles missing department ownership.',
      items: queue,
      emptyMessage: 'No people-operation exceptions are currently available.',
    },
    riskAlerts: risks,
  };
}

async function loadWardenDashboard(tenantId: string): Promise<RolePayload> {
  const [hostels, rooms, allocationCount, messAggregate, messBillCount] = await Promise.all([
    prisma.hostel.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        building: true,
        rooms: {
          select: {
            id: true,
            roomNumber: true,
            capacity: true,
            _count: { select: { allocations: true } },
          },
        },
      },
    }),
    prisma.roomHostel.findMany({
      where: { hostel: { tenantId } },
      orderBy: { roomNumber: 'asc' },
      select: {
        id: true,
        roomNumber: true,
        capacity: true,
        hostel: { select: { name: true } },
        _count: { select: { allocations: true } },
      },
    }),
    prisma.allocation.count({ where: { roomHostel: { hostel: { tenantId } } } }),
    prisma.messBill.aggregate({ where: { tenantId }, _sum: { amount: true }, _avg: { amount: true } }),
    prisma.messBill.count({ where: { tenantId } }),
  ]);

  const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
  const occupancyRate = totalCapacity > 0
    ? clampPercentage((allocationCount / totalCapacity) * 100)
    : 0;

  const insights = hostels.map((hostel) => {
    const capacity = hostel.rooms.reduce((sum, room) => sum + room.capacity, 0);
    const occupied = hostel.rooms.reduce((sum, room) => sum + room._count.allocations, 0);
    return {
      id: hostel.id,
      label: hostel.name,
      value: `${occupied}/${capacity}`,
      detail: `${hostel.building} · ${hostel.rooms.length} room${hostel.rooms.length === 1 ? '' : 's'}`,
      percentage: capacity > 0 ? clampPercentage((occupied / capacity) * 100) : 0,
      href: '/hostel',
    };
  });

  const queue = rooms.slice(0, 12).map((room) => ({
    id: room.id,
    title: `${room.hostel.name} · Room ${room.roomNumber}`,
    detail: `${room._count.allocations} of ${room.capacity} bed space${room.capacity === 1 ? '' : 's'} allocated`,
    status: room._count.allocations >= room.capacity ? 'FULL' : 'AVAILABLE',
    href: '/hostel',
  }));

  const risks: RolePayload['riskAlerts'] = [];
  if (hostels.length === 0) {
    risks.push({ id: 'warden-no-hostels', level: 'warning', message: 'No hostel buildings are configured.', href: '/hostel' });
  }
  if (occupancyRate >= 95) {
    risks.push({ id: 'warden-capacity', level: 'danger', message: `Residential occupancy is ${occupancyRate}%; available capacity is critically low.`, href: '/hostel' });
  } else if (occupancyRate >= 85) {
    risks.push({ id: 'warden-capacity-watch', level: 'warning', message: `Residential occupancy is ${occupancyRate}%; review upcoming allocation demand.`, href: '/hostel' });
  }

  return {
    heading: {
      eyebrow: 'Residential operations command centre',
      title: 'Hostel occupancy, room readiness and residential services',
      description: 'Monitor tenant-scoped residence capacity, allocations and mess-bill volume without exposing student identity in the dashboard.',
      assurance: 'The current schema records rooms and allocations but does not model check-in dates, disciplinary cases or live welfare status.',
    },
    metrics: [
      { id: 'warden-hostels', label: 'Hostels', value: hostels.length, detail: `${rooms.length} rooms`, tone: hostels.length > 0 ? 'positive' : 'warning' },
      { id: 'warden-capacity', label: 'Total capacity', value: totalCapacity, detail: 'Recorded residential bed spaces', tone: 'neutral' },
      { id: 'warden-allocations', label: 'Allocations', value: allocationCount, detail: `${occupancyRate}% occupancy`, tone: occupancyRate >= 95 ? 'danger' : occupancyRate >= 85 ? 'warning' : 'positive' },
      { id: 'warden-mess', label: 'Mess bill records', value: messBillCount, detail: formatCurrency(messAggregate._sum.amount ?? 0), tone: 'neutral' },
    ],
    insights: {
      title: 'Occupancy by residence',
      description: 'Allocated bed spaces compared with recorded room capacity.',
      items: insights,
    },
    queue: {
      title: 'Room readiness register',
      description: 'Current room utilisation without resident identity exposure.',
      items: queue,
      emptyMessage: 'No hostel rooms are configured.',
    },
    riskAlerts: risks,
  };
}

async function loadTransportDashboard(tenantId: string): Promise<RolePayload> {
  const transportFilter = { tenantId, subject: { contains: 'Transport', mode: 'insensitive' as const } };
  const [routes, openTickets, inProgressTickets, resolvedTickets, announcements, tickets] = await Promise.all([
    prisma.transportRoute.findMany({ where: { tenantId }, orderBy: { routeName: 'asc' } }),
    prisma.ticket.count({ where: { ...transportFilter, status: 'OPEN' } }),
    prisma.ticket.count({ where: { ...transportFilter, status: 'IN_PROGRESS' } }),
    prisma.ticket.count({ where: { ...transportFilter, status: 'RESOLVED' } }),
    prisma.announcement.count({ where: { tenantId } }),
    prisma.ticket.findMany({
      where: { ...transportFilter, status: { in: ['OPEN', 'IN_PROGRESS'] } },
      orderBy: { subject: 'asc' },
      take: 10,
    }),
  ]);

  const ticketTotal = openTickets + inProgressTickets + resolvedTickets;
  const insights: Phase5Insight[] = [
    { id: 'transport-open', label: 'Open', value: openTickets, detail: 'Awaiting operational action', percentage: ticketTotal > 0 ? clampPercentage((openTickets / ticketTotal) * 100) : 0, href: '/helpdesk' },
    { id: 'transport-progress', label: 'In progress', value: inProgressTickets, detail: 'Currently being handled', percentage: ticketTotal > 0 ? clampPercentage((inProgressTickets / ticketTotal) * 100) : 0, href: '/helpdesk' },
    { id: 'transport-resolved', label: 'Resolved', value: resolvedTickets, detail: 'Completed transport requests', percentage: ticketTotal > 0 ? clampPercentage((resolvedTickets / ticketTotal) * 100) : 0, href: '/helpdesk' },
  ];

  const queue = tickets.map((ticket) => ({
    id: ticket.id,
    title: ticket.subject,
    detail: 'Tenant-scoped transport support request',
    status: ticket.status,
    href: '/helpdesk',
  }));

  const risks: RolePayload['riskAlerts'] = [];
  if (routes.length === 0) {
    risks.push({ id: 'transport-no-routes', level: 'warning', message: 'No transport routes are configured.', href: '/transport' });
  }
  if (openTickets >= 10) {
    risks.push({ id: 'transport-ticket-backlog', level: 'warning', message: `${openTickets} open transport requests indicate a service backlog.`, href: '/helpdesk' });
  }

  return {
    heading: {
      eyebrow: 'Transport operations command centre',
      title: 'Route coverage, service requests and operational communication',
      description: 'Review configured routes and transport-related support demand inside the active institution.',
      assurance: 'The current schema does not contain vehicles, live GPS, stops or passenger allocations; Phase 5 does not invent those metrics.',
    },
    metrics: [
      { id: 'transport-routes', label: 'Configured routes', value: routes.length, detail: 'Institution transport routes', tone: routes.length > 0 ? 'positive' : 'warning' },
      { id: 'transport-open', label: 'Open requests', value: openTickets, detail: 'Transport tickets awaiting action', tone: openTickets > 0 ? 'warning' : 'positive' },
      { id: 'transport-progress', label: 'In progress', value: inProgressTickets, detail: 'Transport tickets under review', tone: 'neutral' },
      { id: 'transport-announcements', label: 'Announcements', value: announcements, detail: `${resolvedTickets} resolved transport requests`, tone: 'neutral' },
    ],
    insights: {
      title: 'Transport request status',
      description: 'Distribution of tenant-scoped transport service tickets.',
      items: insights,
    },
    queue: {
      title: 'Transport service queue',
      description: 'Open and in-progress transport support records.',
      items: queue,
      emptyMessage: 'No open transport requests are available.',
    },
    riskAlerts: risks,
  };
}

async function loadPlacementDashboard(tenantId: string): Promise<RolePayload> {
  const [placements, applications, alumniCount] = await Promise.all([
    prisma.placement.findMany({
      where: { tenantId },
      orderBy: { companyName: 'asc' },
      select: { id: true, companyName: true, _count: { select: { applications: true } } },
    }),
    prisma.application.findMany({
      where: { placement: { tenantId } },
      select: { id: true, placementId: true, status: true },
    }),
    prisma.alumni.count({ where: { tenantId } }),
  ]);

  const statusCounts = new Map<string, number>();
  for (const application of applications) {
    statusCounts.set(application.status, (statusCounts.get(application.status) ?? 0) + 1);
  }

  const selected = statusCounts.get('SELECTED') ?? 0;
  const interviews = statusCounts.get('INTERVIEW') ?? 0;
  const shortlisted = statusCounts.get('SHORTLISTED') ?? 0;
  const total = applications.length;

  const insights = Array.from(statusCounts.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([status, count]) => ({
      id: status,
      label: formatStatus(status),
      value: count,
      detail: `${total > 0 ? clampPercentage((count / total) * 100) : 0}% of recorded applications`,
      percentage: total > 0 ? clampPercentage((count / total) * 100) : 0,
      href: '/community',
    }));

  const queue = placements.slice(0, 12).map((placement) => ({
    id: placement.id,
    title: placement.companyName,
    detail: `${placement._count.applications} application${placement._count.applications === 1 ? '' : 's'} recorded`,
    status: placement._count.applications > 0 ? 'ACTIVE' : 'NO_APPLICATIONS',
    href: '/community',
  }));

  const selectionRate = total > 0 ? clampPercentage((selected / total) * 100) : 0;
  const risks: RolePayload['riskAlerts'] = [];
  if (placements.length === 0) {
    risks.push({ id: 'placement-no-companies', level: 'warning', message: 'No placement companies are configured.', href: '/community' });
  }
  if (total > 0 && selectionRate < 10) {
    risks.push({ id: 'placement-low-selection', level: 'warning', message: `Recorded selection rate is ${selectionRate}%; review pipeline support and opportunity alignment.`, href: '/community' });
  }

  return {
    heading: {
      eyebrow: 'Career outcomes command centre',
      title: 'Opportunity coverage, application pipeline and placement outcomes',
      description: 'Review tenant-scoped employer and application activity using only the fields supported by the current placement schema.',
      assurance: 'Applications are aggregate records in the current schema and are not linked to individual students; Phase 5 does not infer candidate identity.',
    },
    metrics: [
      { id: 'placement-companies', label: 'Companies', value: placements.length, detail: 'Configured opportunity providers', tone: placements.length > 0 ? 'positive' : 'warning' },
      { id: 'placement-applications', label: 'Applications', value: total, detail: `${shortlisted} shortlisted`, tone: total > 0 ? 'positive' : 'neutral' },
      { id: 'placement-interviews', label: 'Interviews', value: interviews, detail: 'Applications at interview stage', tone: interviews > 0 ? 'positive' : 'neutral' },
      { id: 'placement-selected', label: 'Selected', value: selected, detail: `${selectionRate}% selection rate`, tone: selectionRate >= 20 ? 'positive' : selectionRate >= 10 ? 'neutral' : 'warning' },
    ],
    insights: {
      title: 'Application pipeline distribution',
      description: 'Recorded application status across all configured placement companies.',
      items: insights,
    },
    queue: {
      title: 'Employer activity register',
      description: `Company-level application volume with ${alumniCount} alumni records available to the institution.`,
      items: queue,
      emptyMessage: 'No placement companies are available.',
    },
    riskAlerts: risks,
  };
}

function roleTitle(role: Phase5DashboardData['role']): string {
  switch (role) {
    case RoleType.DEAN:
      return 'Dean';
    case RoleType.HOD:
      return 'Head of Department';
    case RoleType.HR_ADMIN:
      return 'HR Administrator';
    case RoleType.WARDEN:
      return 'Hostel Warden';
    case RoleType.TRANSPORT_MANAGER:
      return 'Transport Manager';
    case RoleType.PLACEMENT_OFFICER:
      return 'Placement Officer';
  }
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function maskEmail(value: string): string {
  const [localPart, domain] = value.split('@');
  if (!domain) return 'hidden';
  return `${localPart.slice(0, 2)}•••@${domain}`;
}
