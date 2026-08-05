import { RoleType } from '@prisma/client';
import { getTenantDb } from '../db';
import type { ActiveUserContext } from '../active-user-context';
import type { FacultyDashboardData } from './contracts';
import { dashboardDefinitionForRole } from './registry';
import { DashboardError } from './errors';

type ClassStatus = 'LIVE NOW' | 'UPCOMING' | 'COMPLETED';

/**
 * Derives a class status from the timetable's real start/end times.
 * Returns UPCOMING when the times cannot be parsed — it never fabricates
 * a LIVE or COMPLETED state.
 */
function deriveClassStatus(startTime: string, endTime: string): ClassStatus {
  const now = new Date();

  const parse = (value: string): Date | null => {
    const [hours, minutes] = value.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    return date;
  };

  const start = parse(startTime);
  const end = parse(endTime);
  if (!start || !end) return 'UPCOMING';
  if (now < start) return 'UPCOMING';
  if (now > end) return 'COMPLETED';
  return 'LIVE NOW';
}

/**
 * Server-side Faculty dashboard loader.
 *
 * Authorization chain:
 *   authenticated session → active tenant → role must be FACULTY →
 *   staff record scoped by id + userId + tenantId →
 *   only the offerings the faculty member actually teaches →
 *   real aggregates only (course, section, term, enrollments, assignments,
 *   ungraded submissions, attendance sessions).
 *
 * Identity always represents the authenticated faculty member. Students
 * appear only as tenant-scoped aggregates within taught courses. No
 * fabricated values are returned; empty collections are legitimate.
 */
export async function getFacultyDashboardData(context: ActiveUserContext): Promise<FacultyDashboardData> {
  if (context.activeRole !== RoleType.FACULTY || !context.staffProfileId) {
    throw new DashboardError('Unauthorized: Faculty role required', 403);
  }

  const { tenantId, userId, staffProfileId } = context;
  const db = getTenantDb(tenantId);

  const staff = await db.staff.findFirst({
    where: { id: staffProfileId, userId, tenantId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!staff) {
    throw new DashboardError('Your faculty profile could not be resolved.', 403);
  }

  const [offerings, ungradedSubmissions, attendanceSessions] = await Promise.all([
    db.courseOffering.findMany({
      where: { tenantId, facultyId: staff.id },
      select: {
        id: true,
        course: { select: { code: true, title: true } },
        section: { select: { name: true } },
        term: { select: { name: true } },
        _count: { select: { enrollments: true, assignments: true } },
        assignments: {
          select: {
            id: true,
            submissions: { where: { marksObtained: null }, select: { id: true } },
          },
        },
      },
    }),
    db.submission.count({
      where: { tenantId, marksObtained: null, assignment: { courseOffering: { facultyId: staff.id } } },
    }),
    db.attendanceSession.findMany({
      where: { tenantId, courseOffering: { facultyId: staff.id } },
      select: { id: true, courseOfferingId: true, sessionDate: true, _count: { select: { records: true } } },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayIndex = today.getDay();

  // Real assigned courses with real aggregates.
  const assignedCourses = offerings.map((offering) => {
    const ungraded = offering.assignments.reduce((sum, assignment) => sum + assignment.submissions.length, 0);
    return {
      id: offering.id,
      code: offering.course.code,
      title: offering.course.title,
      section: offering.section?.name ?? null,
      term: offering.term.name,
      studentCount: offering._count.enrollments,
      assignmentCount: offering._count.assignments,
      ungradedSubmissionCount: ungraded,
      attendanceSessionCount: attendanceSessions.filter((session) => session.courseOfferingId === offering.id).length,
    };
  });

  // Today's classes from real timetable slots (may legitimately be empty).
  // Single query across all taught offerings — no N+1 loop.
  const offeringIds = offerings.map((offering) => offering.id);
  const allSlots = await db.timetableSlot.findMany({
    where: { courseOfferingId: { in: offeringIds } },
    select: {
      id: true,
      courseOfferingId: true,
      dayOfWeek: true,
      startTime: true,
      endTime: true,
      room: { select: { roomNumber: true, building: true } },
    },
  });
  const slotsByOfferingId = new Map<string, typeof allSlots>();
  for (const slot of allSlots) {
    const list = slotsByOfferingId.get(slot.courseOfferingId) ?? [];
    list.push(slot);
    slotsByOfferingId.set(slot.courseOfferingId, list);
  }

  const todayClasses = offerings.flatMap((offering) => {
    const slots = slotsByOfferingId.get(offering.id) ?? [];
    return slots
      .filter((slot) => slot.dayOfWeek === todayIndex)
      .map((slot) => ({
        id: slot.id,
        code: offering.course.code,
        title: offering.course.title,
        time: `${slot.startTime} – ${slot.endTime}`,
        room: slot.room ? `${slot.room.building} ${slot.room.roomNumber}` : 'Room not assigned',
        status: deriveClassStatus(slot.startTime, slot.endTime),
      }));
  });

  const attendanceSessionsToday = attendanceSessions.filter(
    (session) => session.sessionDate >= today && session.sessionDate < tomorrow,
  );
  const recordedToday = attendanceSessionsToday.reduce((sum, session) => sum + session._count.records, 0);

  const metrics: FacultyDashboardData['metrics'] = [
    {
      id: 'assigned-courses',
      label: 'Assigned Courses',
      value: assignedCourses.length,
      detail: 'Offerings you teach this term',
    },
    {
      id: 'enrolled-students',
      label: 'Enrolled Students',
      value: assignedCourses.reduce((sum, course) => sum + course.studentCount, 0),
      detail: 'Across all assigned sections',
    },
    {
      id: 'grading-pending',
      label: 'Grading Pending',
      value: ungradedSubmissions,
      detail: ungradedSubmissions === 0 ? 'All submissions graded' : 'Submissions awaiting evaluation',
      tone: ungradedSubmissions > 0 ? 'warning' : 'neutral',
    },
    {
      id: 'attendance-sessions',
      label: 'Attendance Sessions',
      value: attendanceSessions.length,
      detail: `${recordedToday} records today`,
    },
  ];

  // Risk alerts derived from real data only.
  const riskAlerts: FacultyDashboardData['riskAlerts'] = [];
  if (ungradedSubmissions > 0) {
    riskAlerts.push({
      id: 'grading-backlog',
      level: 'warning',
      message: `${ungradedSubmissions} submission${ungradedSubmissions === 1 ? '' : 's'} across your courses await grading.`,
      href: '/assignments',
    });
  }

  // Real recent activity: recent audit events authored by this faculty member.
  const auditLogs = await db.auditLog.findMany({
    where: { tenantId, userId },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: { id: true, action: true, entity: true, createdAt: true },
  });
  const recentActivity: FacultyDashboardData['recentActivity'] = auditLogs.map((log) => ({
    id: log.id,
    action: log.action,
    entity: log.entity,
    createdAt: log.createdAt.toISOString(),
  }));

  const definition = dashboardDefinitionForRole(RoleType.FACULTY);
  const quickActions = definition.quickActions.map((action) => ({ label: action.label, href: action.href }));

  return {
    role: 'FACULTY',
    identity: {
      id: userId,
      name: staff.user.name,
      email: staff.user.email,
      title: 'Faculty Member',
      designation: staff.designation,
      departmentId: staff.departmentId,
    },
    academicPeriod: offerings[0]?.term ? { label: offerings[0].term.name } : null,
    assignedCourses,
    todayClasses,
    pendingGrading: {
      total: ungradedSubmissions,
      perCourse: assignedCourses
        .filter((course) => course.ungradedSubmissionCount > 0)
        .map((course) => ({ courseCode: course.code, count: course.ungradedSubmissionCount })),
    },
    attendance: {
      sessionCount: attendanceSessions.length,
      recordedToday,
    },
    metrics,
    riskAlerts,
    quickActions,
    recentActivity,
  };
}
