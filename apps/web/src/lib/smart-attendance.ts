import 'server-only';

import { Prisma, type AttendanceStatus, type RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { verifyAttendanceFace } from './attendance-face-verification';
import { prisma } from './db';
import {
  attendancePercentage,
  classesNeededForTarget,
  isAttendanceDay,
  isWithinCheckInWindow,
  selfCheckInMode,
  timetableDayMatches,
} from './smart-attendance-policy';
import type {
  AttendanceAdminData,
  AttendanceCalendarEntry,
  AttendanceClass,
  AttendanceCourseSummary,
  AttendanceFacultySession,
  AttendanceMarkStatus,
  AttendanceSettings,
  AttendanceStudyMode,
  AttendanceStudentView,
  AttendanceWorkspace,
  CalendarDayType,
} from './smart-attendance-types';

const DEFAULT_SETTINGS: AttendanceSettings = {
  storeReady: false,
  requiredPercentage: 75,
  timezone: 'Asia/Kolkata',
  allowOfflineSelfCheckIn: true,
  requireOnlineFace: true,
  requireOfflineSelfFace: true,
  allowHybridDailyCheckIn: true,
  checkinEarlyMinutes: 15,
  checkinLateMinutes: 20,
  checkoutEnabled: true,
};

const VIEW_ROLES = new Set<RoleType>([
  'STUDENT', 'PARENT', 'FACULTY', 'HOD', 'DEAN', 'REGISTRAR',
  'EXAMINATION_CONTROLLER', 'INSTITUTION_ADMIN',
]);
const CALENDAR_ADMIN_ROLES = new Set<RoleType>(['REGISTRAR', 'INSTITUTION_ADMIN']);
const ATTENDANCE_OVERSIGHT_ROLES = new Set<RoleType>(['HOD', 'DEAN', 'REGISTRAR', 'EXAMINATION_CONTROLLER', 'INSTITUTION_ADMIN']);

export class SmartAttendanceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'SmartAttendanceError';
    this.status = status;
  }
}

type SettingsRow = {
  required_percentage: unknown;
  timezone: string;
  allow_offline_self_checkin: boolean;
  require_online_face: boolean;
  require_offline_self_face: boolean;
  allow_hybrid_daily_checkin: boolean;
  checkin_early_minutes: number;
  checkin_late_minutes: number;
  checkout_enabled: boolean;
};

type TimetableRow = {
  timetable_slot_id: string;
  course_offering_id: string;
  course_code: string;
  course_title: string;
  faculty_name: string;
  room_number: string;
  building: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

type SessionRow = {
  id: string;
  timetable_slot_id: string | null;
  course_offering_id: string;
  session_date: Date | string;
  start_time: string;
  end_time: string;
  status: 'SCHEDULED' | 'OPEN' | 'SUBMITTED' | 'CANCELLED';
  core_session_id: string | null;
};

type MarkRow = {
  session_id: string;
  student_id: string;
  status: AttendanceMarkStatus;
  method: 'MANUAL' | 'FACE_CLASS' | 'FACE_DAILY' | 'OVERRIDE';
  checked_in_at: Date | null;
  checked_out_at: Date | null;
};

type SummaryRow = {
  course_offering_id: string;
  course_code: string;
  course_title: string;
  held: bigint | number;
  present: bigint | number;
  absent: bigint | number;
  late: bigint | number;
  excused: bigint | number;
};

type StudentIdentity = {
  student_id: string;
  user_id: string;
  name: string;
  roll_number: string;
  batch_id: string;
  section_id: string | null;
  program_id: string;
  program_name: string;
  batch_name: string;
  section_name: string | null;
};

type CalendarRow = {
  id: string;
  calendar_date: Date | string;
  day_type: CalendarDayType;
  title: string;
  description: string | null;
  program_id: string | null;
  batch_id: string | null;
  section_id: string | null;
  program_name?: string | null;
  batch_name?: string | null;
  section_name?: string | null;
};

function settingsFromRow(row: SettingsRow | undefined, storeReady: boolean): AttendanceSettings {
  if (!row) return { ...DEFAULT_SETTINGS, storeReady };
  return {
    storeReady,
    requiredPercentage: Number(row.required_percentage),
    timezone: row.timezone,
    allowOfflineSelfCheckIn: row.allow_offline_self_checkin,
    requireOnlineFace: row.require_online_face,
    requireOfflineSelfFace: row.require_offline_self_face,
    allowHybridDailyCheckIn: row.allow_hybrid_daily_checkin,
    checkinEarlyMinutes: row.checkin_early_minutes,
    checkinLateMinutes: row.checkin_late_minutes,
    checkoutEnabled: row.checkout_enabled,
  };
}

function normalizeMode(value?: string | null): AttendanceStudyMode | 'UNCLASSIFIED' {
  return value === 'ONLINE' || value === 'OFFLINE' || value === 'HYBRID' ? value : 'UNCLASSIFIED';
}

function localClock(timezone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? '';
  const dateString = `${value('year')}-${value('month')}-${value('day')}`;
  const hour = Number(value('hour'));
  const minute = Number(value('minute'));
  const jsDay = new Date(`${dateString}T12:00:00Z`).getUTCDay();
  return { dateString, minutes: hour * 60 + minute, jsDay };
}

async function readSettings(tenantId: string) {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT required_percentage, timezone, allow_offline_self_checkin,
             require_online_face, require_offline_self_face,
             allow_hybrid_daily_checkin, checkin_early_minutes,
             checkin_late_minutes, checkout_enabled
      FROM campusos_attendance.settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return settingsFromRow(rows[0], true);
  } catch (error) {
    console.error('Smart attendance storage is unavailable:', error);
    return DEFAULT_SETTINGS;
  }
}

async function resolveStudentMode(tenantId: string, studentId: string): Promise<AttendanceStudyMode | 'UNCLASSIFIED'> {
  try {
    const own = await prisma.$queryRaw<Array<{ study_mode: string }>>`
      SELECT study_mode FROM campusos_attendance.student_profiles
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid LIMIT 1
    `;
    if (own[0]?.study_mode) return normalizeMode(own[0].study_mode);
  } catch { /* optional store may not yet exist */ }

  try {
    const transport = await prisma.$queryRaw<Array<{ study_mode: string }>>`
      SELECT study_mode FROM campusos_transport.student_profiles
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid LIMIT 1
    `;
    if (transport[0]?.study_mode) return normalizeMode(transport[0].study_mode);
  } catch { /* compatibility fallback */ }

  try {
    const hostel = await prisma.$queryRaw<Array<{ study_mode: string }>>`
      SELECT study_mode FROM campusos_hostel.student_profiles
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid LIMIT 1
    `;
    if (hostel[0]?.study_mode) return normalizeMode(hostel[0].study_mode);
  } catch { /* compatibility fallback */ }

  return 'UNCLASSIFIED';
}

async function studentIdentity(tenantId: string, studentId: string): Promise<StudentIdentity> {
  const rows = await prisma.$queryRaw<StudentIdentity[]>`
    SELECT s.id AS student_id, s.user_id, u.name, s."rollNumber" AS roll_number,
           s.batch_id, s.section_id, b.program_id, p.name AS program_name,
           b.name AS batch_name, sec.name AS section_name
    FROM public.students s
    JOIN public.users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.programs p ON p.id = b.program_id
    LEFT JOIN public.sections sec ON sec.id = s.section_id
    WHERE s.tenant_id = ${tenantId}::uuid AND s.id = ${studentId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new SmartAttendanceError('Student profile could not be resolved.', 404);
  return rows[0];
}

async function studentCalendarDay(tenantId: string, identity: StudentIdentity, dateString: string) {
  try {
    const rows = await prisma.$queryRaw<CalendarRow[]>`
      SELECT id, calendar_date, day_type, title, description, program_id, batch_id, section_id
      FROM campusos_attendance.calendar_days
      WHERE tenant_id = ${tenantId}::uuid
        AND calendar_date = ${dateString}::date
        AND (
          (program_id IS NULL AND batch_id IS NULL AND section_id IS NULL)
          OR program_id = ${identity.program_id}::uuid
          OR batch_id = ${identity.batch_id}::uuid
          OR section_id = ${identity.section_id ?? null}::uuid
        )
      ORDER BY
        CASE WHEN section_id IS NOT NULL THEN 3 WHEN batch_id IS NOT NULL THEN 2 WHEN program_id IS NOT NULL THEN 1 ELSE 0 END DESC
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function timetableForStudent(tenantId: string, studentId: string): Promise<TimetableRow[]> {
  return prisma.$queryRaw<TimetableRow[]>`
    SELECT ts.id AS timetable_slot_id, co.id AS course_offering_id,
           c.code AS course_code, c.title AS course_title, fu.name AS faculty_name,
           r."roomNumber" AS room_number, r.building,
           ts."dayOfWeek" AS day_of_week, ts."startTime" AS start_time, ts."endTime" AS end_time
    FROM public.enrollments e
    JOIN public.course_offerings co ON co.id = e.course_offering_id AND co.tenant_id = e.tenant_id
    JOIN public.courses c ON c.id = co.course_id
    JOIN public.staff st ON st.id = co.faculty_id
    JOIN public.users fu ON fu.id = st.user_id
    JOIN public.timetable_slots ts ON ts.course_offering_id = co.id AND ts.tenant_id = co.tenant_id
    JOIN public.rooms r ON r.id = ts.room_id
    WHERE e.tenant_id = ${tenantId}::uuid AND e.student_id = ${studentId}::uuid
    ORDER BY ts."startTime" ASC
  `;
}

async function timetableForFaculty(tenantId: string, staffId: string): Promise<TimetableRow[]> {
  return prisma.$queryRaw<TimetableRow[]>`
    SELECT ts.id AS timetable_slot_id, co.id AS course_offering_id,
           c.code AS course_code, c.title AS course_title, fu.name AS faculty_name,
           r."roomNumber" AS room_number, r.building,
           ts."dayOfWeek" AS day_of_week, ts."startTime" AS start_time, ts."endTime" AS end_time
    FROM public.course_offerings co
    JOIN public.courses c ON c.id = co.course_id
    JOIN public.staff st ON st.id = co.faculty_id
    JOIN public.users fu ON fu.id = st.user_id
    JOIN public.timetable_slots ts ON ts.course_offering_id = co.id AND ts.tenant_id = co.tenant_id
    JOIN public.rooms r ON r.id = ts.room_id
    WHERE co.tenant_id = ${tenantId}::uuid AND co.faculty_id = ${staffId}::uuid
    ORDER BY ts."startTime" ASC
  `;
}

async function readSessionMap(tenantId: string, dateString: string) {
  try {
    const rows = await prisma.$queryRaw<SessionRow[]>`
      SELECT id, timetable_slot_id, course_offering_id, session_date, start_time::text,
             end_time::text, status, core_session_id
      FROM campusos_attendance.sessions
      WHERE tenant_id = ${tenantId}::uuid AND session_date = ${dateString}::date
    `;
    return new Map(rows.filter((row) => row.timetable_slot_id).map((row) => [row.timetable_slot_id as string, row]));
  } catch {
    return new Map<string, SessionRow>();
  }
}

async function readStudentMarks(tenantId: string, studentId: string, dateString: string) {
  try {
    const rows = await prisma.$queryRaw<MarkRow[]>`
      SELECT m.session_id, m.student_id, m.status, m.method, m.checked_in_at, m.checked_out_at
      FROM campusos_attendance.marks m
      JOIN campusos_attendance.sessions s ON s.id = m.session_id AND s.tenant_id = m.tenant_id
      WHERE m.tenant_id = ${tenantId}::uuid AND m.student_id = ${studentId}::uuid
        AND s.session_date = ${dateString}::date
    `;
    return new Map(rows.map((row) => [row.session_id, row]));
  } catch {
    return new Map<string, MarkRow>();
  }
}

async function readDailyPresence(tenantId: string, studentId: string, dateString: string) {
  try {
    const rows = await prisma.$queryRaw<Array<{ checked_in_at: Date; checked_out_at: Date | null; status: 'ACTIVE' | 'COMPLETED' | 'VOID' }>>`
      SELECT checked_in_at, checked_out_at, status
      FROM campusos_attendance.daily_presence
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid
        AND attendance_date = ${dateString}::date
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

async function biometricState(tenantId: string, userId: string) {
  const [consent, enrollment] = await Promise.all([
    prisma.biometricConsent.findFirst({ where: { tenantId, userId, consentGiven: true }, select: { id: true } }),
    prisma.biometricEnrollment.findFirst({ where: { tenantId, userId }, select: { id: true } }),
  ]);
  return { consent: Boolean(consent), ready: Boolean(consent && enrollment) };
}

async function studentSummaries(tenantId: string, studentId: string, threshold: number): Promise<AttendanceCourseSummary[]> {
  try {
    const rows = await prisma.$queryRaw<SummaryRow[]>`
      SELECT co.id AS course_offering_id, c.code AS course_code, c.title AS course_title,
             COUNT(*) FILTER (WHERE s.status = 'SUBMITTED') AS held,
             COUNT(*) FILTER (WHERE s.status = 'SUBMITTED' AND m.status = 'PRESENT') AS present,
             COUNT(*) FILTER (WHERE s.status = 'SUBMITTED' AND m.status = 'ABSENT') AS absent,
             COUNT(*) FILTER (WHERE s.status = 'SUBMITTED' AND m.status = 'LATE') AS late,
             COUNT(*) FILTER (WHERE s.status = 'SUBMITTED' AND m.status = 'EXCUSED') AS excused
      FROM public.enrollments e
      JOIN public.course_offerings co ON co.id = e.course_offering_id AND co.tenant_id = e.tenant_id
      JOIN public.courses c ON c.id = co.course_id
      LEFT JOIN campusos_attendance.sessions s ON s.course_offering_id = co.id AND s.tenant_id = co.tenant_id
      LEFT JOIN campusos_attendance.marks m ON m.session_id = s.id AND m.student_id = e.student_id
      WHERE e.tenant_id = ${tenantId}::uuid AND e.student_id = ${studentId}::uuid
      GROUP BY co.id, c.code, c.title
      ORDER BY c.code ASC
    `;
    return rows.map((row) => {
      const held = Number(row.held);
      const present = Number(row.present);
      const late = Number(row.late);
      const absent = Number(row.absent);
      const excused = Number(row.excused);
      const pct = attendancePercentage(present, late, held);
      return {
        courseOfferingId: row.course_offering_id,
        courseCode: row.course_code,
        courseTitle: row.course_title,
        held, present, absent, late, excused,
        percentage: pct,
        threshold,
        shortage: pct < threshold,
        classesNeededForTarget: classesNeededForTarget(present + late, held, threshold),
        missedClasses: absent,
      };
    });
  } catch {
    return [];
  }
}

async function studentView(context: ActiveUserContext, settings: AttendanceSettings): Promise<AttendanceStudentView> {
  if (!context.studentProfileId) throw new SmartAttendanceError('Student profile is required.', 403);
  const identity = await studentIdentity(context.tenantId, context.studentProfileId);
  const mode = await resolveStudentMode(context.tenantId, context.studentProfileId);
  const clock = localClock(settings.timezone);
  const calendar = await studentCalendarDay(context.tenantId, identity, clock.dateString);
  const [slots, sessionMap, dailyPresence, bio, summaries] = await Promise.all([
    timetableForStudent(context.tenantId, context.studentProfileId),
    readSessionMap(context.tenantId, clock.dateString),
    readDailyPresence(context.tenantId, context.studentProfileId, clock.dateString),
    biometricState(context.tenantId, context.userId),
    studentSummaries(context.tenantId, context.studentProfileId, settings.requiredPercentage),
  ]);
  const marks = await readStudentMarks(context.tenantId, context.studentProfileId, clock.dateString);
  const today = slots.filter((slot) => timetableDayMatches(slot.day_of_week, clock.jsDay));
  const attendanceAllowedToday = isAttendanceDay(calendar?.day_type);
  const modeAction = selfCheckInMode(mode, settings);

  const todayClasses: AttendanceClass[] = today.map((slot) => {
    const session = sessionMap.get(slot.timetable_slot_id);
    const mark = session ? marks.get(session.id) : undefined;
    const canCheckIn = attendanceAllowedToday && bio.ready && modeAction === 'CLASS' &&
      isWithinCheckInWindow(clock.minutes, slot.start_time, settings.checkinEarlyMinutes, settings.checkinLateMinutes) &&
      session?.status !== 'SUBMITTED' && session?.status !== 'CANCELLED';
    return {
      timetableSlotId: slot.timetable_slot_id,
      courseOfferingId: slot.course_offering_id,
      courseCode: slot.course_code,
      courseTitle: slot.course_title,
      facultyName: slot.faculty_name,
      roomLabel: `${slot.building} · ${slot.room_number}`,
      startTime: slot.start_time,
      endTime: slot.end_time,
      sessionId: session?.id ?? null,
      sessionStatus: session?.status ?? 'SCHEDULED',
      markStatus: mark?.status ?? null,
      method: mark?.method ?? null,
      checkedInAt: mark?.checked_in_at?.toISOString() ?? null,
      checkedOutAt: mark?.checked_out_at?.toISOString() ?? null,
      canCheckIn,
      canCheckOut: Boolean(settings.checkoutEnabled && mark?.checked_in_at && !mark.checked_out_at),
    };
  });

  return {
    studentId: identity.student_id,
    studentName: identity.name,
    rollNumber: identity.roll_number,
    studyMode: mode,
    todayLabel: clock.dateString,
    calendarDay: calendar ? { type: calendar.day_type, title: calendar.title } : null,
    todayClasses,
    dailyPresence: dailyPresence ? {
      checkedInAt: dailyPresence.checked_in_at.toISOString(),
      checkedOutAt: dailyPresence.checked_out_at?.toISOString() ?? null,
      status: dailyPresence.status,
    } : null,
    summaries,
    faceReady: bio.ready,
    faceConsent: bio.consent,
    selfCheckInAllowed: attendanceAllowedToday && bio.ready && modeAction !== 'NONE',
  };
}

async function ensureSession(tenantId: string, timetableSlotId: string, dateString: string, actorUserId?: string) {
  const rows = await prisma.$queryRaw<Array<{ course_offering_id: string; start_time: string; end_time: string }>>`
    SELECT course_offering_id, "startTime" AS start_time, "endTime" AS end_time
    FROM public.timetable_slots
    WHERE id = ${timetableSlotId}::uuid AND tenant_id = ${tenantId}::uuid
    LIMIT 1
  `;
  const slot = rows[0];
  if (!slot) throw new SmartAttendanceError('Timetable class was not found.', 404);
  await prisma.$executeRaw`
    INSERT INTO campusos_attendance.sessions (
      tenant_id, course_offering_id, timetable_slot_id, session_date, start_time, end_time, status, opened_by, updated_at
    ) VALUES (
      ${tenantId}::uuid, ${slot.course_offering_id}::uuid, ${timetableSlotId}::uuid,
      ${dateString}::date, ${slot.start_time}::time, ${slot.end_time}::time, 'OPEN',
      ${actorUserId ?? null}::uuid, now()
    )
    ON CONFLICT (tenant_id, timetable_slot_id, session_date)
    DO UPDATE SET status = CASE WHEN campusos_attendance.sessions.status = 'SCHEDULED' THEN 'OPEN' ELSE campusos_attendance.sessions.status END,
                  updated_at = now()
  `;
  const session = await prisma.$queryRaw<SessionRow[]>`
    SELECT id, timetable_slot_id, course_offering_id, session_date, start_time::text, end_time::text, status, core_session_id
    FROM campusos_attendance.sessions
    WHERE tenant_id = ${tenantId}::uuid AND timetable_slot_id = ${timetableSlotId}::uuid AND session_date = ${dateString}::date
    LIMIT 1
  `;
  return session[0];
}

async function recordFaceVerification(input: {
  tenantId: string; userId: string; studentId: string;
  purpose: 'CLASS_CHECKIN' | 'DAY_CHECKIN'; captureDataUrl: string;
}) {
  const verified = await verifyAttendanceFace(input);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_attendance.face_verifications (
      tenant_id, user_id, student_id, purpose, provider_verification_id,
      confidence, verified_at, expires_at
    ) VALUES (
      ${input.tenantId}::uuid, ${input.userId}::uuid, ${input.studentId}::uuid,
      ${input.purpose}, ${verified.providerVerificationId}, ${verified.confidence}, now(), now() + interval '10 minutes'
    ) RETURNING id
  `;
  return rows[0]?.id;
}

export async function selfAttendanceCheckIn(input: {
  kind: 'CLASS' | 'DAY';
  timetableSlotId?: string;
  captureDataUrl: string;
}) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'STUDENT' || !context.studentProfileId) throw new SmartAttendanceError('Student access required.', 403);
  const settings = await readSettings(context.tenantId);
  if (!settings.storeReady) throw new SmartAttendanceError('Attendance storage is unavailable.', 503);
  const identity = await studentIdentity(context.tenantId, context.studentProfileId);
  const mode = await resolveStudentMode(context.tenantId, context.studentProfileId);
  const allowed = selfCheckInMode(mode, settings);
  if (allowed === 'NONE' || allowed !== input.kind) {
    throw new SmartAttendanceError(mode === 'ONLINE'
      ? 'Online students must verify attendance for each timetable class.'
      : 'Offline self attendance uses one verified daily check-in.', 403);
  }

  const clock = localClock(settings.timezone);
  const calendar = await studentCalendarDay(context.tenantId, identity, clock.dateString);
  if (!isAttendanceDay(calendar?.day_type)) throw new SmartAttendanceError(calendar?.title || 'Attendance is closed for this calendar day.', 409);
  const slots = (await timetableForStudent(context.tenantId, context.studentProfileId))
    .filter((slot) => timetableDayMatches(slot.day_of_week, clock.jsDay));
  if (slots.length === 0) throw new SmartAttendanceError('There are no timetable classes scheduled today.', 409);

  if (input.kind === 'CLASS') {
    const slot = slots.find((item) => item.timetable_slot_id === input.timetableSlotId);
    if (!slot) throw new SmartAttendanceError('This class is not in your timetable today.', 403);
    if (!isWithinCheckInWindow(clock.minutes, slot.start_time, settings.checkinEarlyMinutes, settings.checkinLateMinutes)) {
      throw new SmartAttendanceError('Class check-in is outside the allowed timetable window.', 409);
    }
    const faceId = await recordFaceVerification({
      tenantId: context.tenantId, userId: context.userId, studentId: context.studentProfileId,
      purpose: 'CLASS_CHECKIN', captureDataUrl: input.captureDataUrl,
    });
    const session = await ensureSession(context.tenantId, slot.timetable_slot_id, clock.dateString, context.userId);
    if (!session || session.status === 'SUBMITTED' || session.status === 'CANCELLED') {
      throw new SmartAttendanceError('This attendance session is closed.', 409);
    }
    await prisma.$executeRaw`
      INSERT INTO campusos_attendance.marks (
        tenant_id, session_id, student_id, status, method, face_verification_id, checked_in_at, marked_by, updated_at
      ) VALUES (
        ${context.tenantId}::uuid, ${session.id}::uuid, ${context.studentProfileId}::uuid,
        'PRESENT', 'FACE_CLASS', ${faceId}::uuid, now(), ${context.userId}::uuid, now()
      )
      ON CONFLICT (session_id, student_id) DO UPDATE SET
        status = 'PRESENT', method = 'FACE_CLASS', face_verification_id = EXCLUDED.face_verification_id,
        checked_in_at = now(), marked_by = EXCLUDED.marked_by, updated_at = now()
    `;
    return { success: true, kind: 'CLASS', sessionId: session.id, checkedInAt: new Date().toISOString() };
  }

  const faceId = await recordFaceVerification({
    tenantId: context.tenantId, userId: context.userId, studentId: context.studentProfileId,
    purpose: 'DAY_CHECKIN', captureDataUrl: input.captureDataUrl,
  });
  const presence = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_attendance.daily_presence (
      tenant_id, student_id, attendance_date, study_mode, face_verification_id, checked_in_at, status, updated_at
    ) VALUES (
      ${context.tenantId}::uuid, ${context.studentProfileId}::uuid, ${clock.dateString}::date,
      ${mode}, ${faceId}::uuid, now(), 'ACTIVE', now()
    )
    ON CONFLICT (tenant_id, student_id, attendance_date) DO UPDATE SET
      face_verification_id = EXCLUDED.face_verification_id, checked_in_at = now(), status = 'ACTIVE', updated_at = now()
    RETURNING id
  `;
  const presenceId = presence[0]?.id;
  for (const slot of slots) {
    const session = await ensureSession(context.tenantId, slot.timetable_slot_id, clock.dateString, context.userId);
    if (!session || session.status === 'SUBMITTED' || session.status === 'CANCELLED') continue;
    await prisma.$executeRaw`
      INSERT INTO campusos_attendance.marks (
        tenant_id, session_id, student_id, status, method, face_verification_id, daily_presence_id,
        checked_in_at, marked_by, updated_at
      ) VALUES (
        ${context.tenantId}::uuid, ${session.id}::uuid, ${context.studentProfileId}::uuid,
        'PRESENT', 'FACE_DAILY', ${faceId}::uuid, ${presenceId}::uuid, now(), ${context.userId}::uuid, now()
      )
      ON CONFLICT (session_id, student_id) DO UPDATE SET
        status = CASE WHEN campusos_attendance.marks.method IN ('MANUAL','OVERRIDE') THEN campusos_attendance.marks.status ELSE 'PRESENT' END,
        method = CASE WHEN campusos_attendance.marks.method IN ('MANUAL','OVERRIDE') THEN campusos_attendance.marks.method ELSE 'FACE_DAILY' END,
        face_verification_id = CASE WHEN campusos_attendance.marks.method IN ('MANUAL','OVERRIDE') THEN campusos_attendance.marks.face_verification_id ELSE EXCLUDED.face_verification_id END,
        daily_presence_id = EXCLUDED.daily_presence_id,
        checked_in_at = COALESCE(campusos_attendance.marks.checked_in_at, now()), updated_at = now()
    `;
  }
  return { success: true, kind: 'DAY', coveredClasses: slots.length, checkedInAt: new Date().toISOString() };
}

export async function selfAttendanceCheckOut(input: { kind: 'CLASS' | 'DAY'; sessionId?: string }) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'STUDENT' || !context.studentProfileId) throw new SmartAttendanceError('Student access required.', 403);
  const settings = await readSettings(context.tenantId);
  if (!settings.checkoutEnabled) throw new SmartAttendanceError('Checkout tracking is disabled by the institution.', 409);
  const clock = localClock(settings.timezone);

  if (input.kind === 'DAY') {
    const changed = await prisma.$executeRaw`
      UPDATE campusos_attendance.daily_presence
      SET checked_out_at = now(), status = 'COMPLETED', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND student_id = ${context.studentProfileId}::uuid
        AND attendance_date = ${clock.dateString}::date AND status <> 'VOID'
    `;
    if (!changed) throw new SmartAttendanceError('No active daily attendance was found.', 404);
    await prisma.$executeRaw`
      UPDATE campusos_attendance.marks m SET checked_out_at = now(), updated_at = now()
      FROM campusos_attendance.sessions s
      WHERE m.session_id = s.id AND m.tenant_id = ${context.tenantId}::uuid
        AND m.student_id = ${context.studentProfileId}::uuid AND s.session_date = ${clock.dateString}::date
        AND m.method = 'FACE_DAILY'
    `;
    return { success: true, completedAt: new Date().toISOString() };
  }

  if (!input.sessionId) throw new SmartAttendanceError('Class attendance session is required.', 400);
  const changed = await prisma.$executeRaw`
    UPDATE campusos_attendance.marks m SET checked_out_at = now(), updated_at = now()
    FROM campusos_attendance.sessions s
    WHERE m.session_id = s.id AND m.session_id = ${input.sessionId}::uuid
      AND m.tenant_id = ${context.tenantId}::uuid AND m.student_id = ${context.studentProfileId}::uuid
      AND m.method = 'FACE_CLASS'
  `;
  if (!changed) throw new SmartAttendanceError('No active class check-in was found.', 404);
  return { success: true, completedAt: new Date().toISOString() };
}

async function facultyOwnsOffering(context: ActiveUserContext, courseOfferingId: string) {
  if (context.activeRole === 'INSTITUTION_ADMIN') return true;
  if (context.activeRole !== 'FACULTY' || !context.staffProfileId) return false;
  const count = await prisma.courseOffering.count({ where: { id: courseOfferingId, tenantId: context.tenantId, facultyId: context.staffProfileId } });
  return count > 0;
}

async function sessionById(tenantId: string, sessionId: string) {
  const rows = await prisma.$queryRaw<SessionRow[]>`
    SELECT id, timetable_slot_id, course_offering_id, session_date, start_time::text, end_time::text, status, core_session_id
    FROM campusos_attendance.sessions
    WHERE tenant_id = ${tenantId}::uuid AND id = ${sessionId}::uuid LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function manualMarkAttendance(input: {
  timetableSlotId: string;
  sessionDate: string;
  studentId: string;
  status: AttendanceMarkStatus;
  note?: string;
}) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'FACULTY' && context.activeRole !== 'INSTITUTION_ADMIN') throw new SmartAttendanceError('Faculty attendance authority required.', 403);
  const session = await ensureSession(context.tenantId, input.timetableSlotId, input.sessionDate, context.userId);
  if (!session || !(await facultyOwnsOffering(context, session.course_offering_id))) throw new SmartAttendanceError('You do not own this attendance session.', 403);
  if (session.status === 'SUBMITTED' || session.status === 'CANCELLED') throw new SmartAttendanceError('Submitted attendance cannot be edited here.', 409);
  const enrolled = await prisma.enrollment.count({ where: { tenantId: context.tenantId, courseOfferingId: session.course_offering_id, studentId: input.studentId } });
  if (!enrolled) throw new SmartAttendanceError('Student is not enrolled in this class.', 403);
  await prisma.$executeRaw`
    INSERT INTO campusos_attendance.marks (tenant_id, session_id, student_id, status, method, marked_by, note, updated_at)
    VALUES (${context.tenantId}::uuid, ${session.id}::uuid, ${input.studentId}::uuid, ${input.status}, 'MANUAL', ${context.userId}::uuid, ${input.note ?? null}, now())
    ON CONFLICT (session_id, student_id) DO UPDATE SET
      status = EXCLUDED.status, method = 'MANUAL', marked_by = EXCLUDED.marked_by,
      note = EXCLUDED.note, updated_at = now()
  `;
  return { success: true, sessionId: session.id };
}

async function mirrorSubmittedSession(session: SessionRow, tenantId: string) {
  let coreSessionId = session.core_session_id;
  if (!coreSessionId) {
    const created = await prisma.attendanceSession.create({
      data: {
        tenantId,
        courseOfferingId: session.course_offering_id,
        sessionDate: new Date(`${String(session.session_date).slice(0, 10)}T00:00:00.000Z`),
      },
      select: { id: true },
    });
    coreSessionId = created.id;
    await prisma.$executeRaw`
      UPDATE campusos_attendance.sessions SET core_session_id = ${coreSessionId}::uuid, updated_at = now()
      WHERE id = ${session.id}::uuid AND tenant_id = ${tenantId}::uuid
    `;
  }
  const marks = await prisma.$queryRaw<Array<{ student_id: string; status: AttendanceMarkStatus }>>`
    SELECT student_id, status FROM campusos_attendance.marks WHERE session_id = ${session.id}::uuid
  `;
  for (const mark of marks) {
    const existing = await prisma.attendanceRecord.findFirst({
      where: { tenantId, attendanceSessionId: coreSessionId, studentId: mark.student_id },
      select: { id: true },
    });
    const status = mark.status as AttendanceStatus;
    if (existing) await prisma.attendanceRecord.update({ where: { id: existing.id }, data: { status } });
    else await prisma.attendanceRecord.create({ data: { tenantId, attendanceSessionId: coreSessionId, studentId: mark.student_id, status } });
  }
}

export async function submitAttendanceSession(sessionId: string) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'FACULTY' && context.activeRole !== 'INSTITUTION_ADMIN') throw new SmartAttendanceError('Faculty attendance authority required.', 403);
  const session = await sessionById(context.tenantId, sessionId);
  if (!session) throw new SmartAttendanceError('Attendance session was not found.', 404);
  if (!(await facultyOwnsOffering(context, session.course_offering_id))) throw new SmartAttendanceError('You do not own this attendance session.', 403);
  if (session.status === 'CANCELLED') throw new SmartAttendanceError('Cancelled class cannot be submitted.', 409);

  await prisma.$executeRaw`
    INSERT INTO campusos_attendance.marks (tenant_id, session_id, student_id, status, method, marked_by, updated_at)
    SELECT ${context.tenantId}::uuid, ${session.id}::uuid, e.student_id, 'ABSENT', 'MANUAL', ${context.userId}::uuid, now()
    FROM public.enrollments e
    WHERE e.tenant_id = ${context.tenantId}::uuid AND e.course_offering_id = ${session.course_offering_id}::uuid
    ON CONFLICT (session_id, student_id) DO NOTHING
  `;
  await prisma.$executeRaw`
    UPDATE campusos_attendance.sessions
    SET status = 'SUBMITTED', submitted_by = ${context.userId}::uuid, submitted_at = now(), updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${session.id}::uuid
  `;
  const submitted = { ...session, status: 'SUBMITTED' as const };
  await mirrorSubmittedSession(submitted, context.tenantId);
  return { success: true, sessionId };
}

async function facultySessions(context: ActiveUserContext, settings: AttendanceSettings): Promise<AttendanceFacultySession[]> {
  if (context.activeRole !== 'FACULTY' || !context.staffProfileId) return [];
  const clock = localClock(settings.timezone);
  const slots = (await timetableForFaculty(context.tenantId, context.staffProfileId)).filter((slot) => timetableDayMatches(slot.day_of_week, clock.jsDay));
  const sessions: AttendanceFacultySession[] = [];
  for (const slot of slots) {
    const session = await ensureSession(context.tenantId, slot.timetable_slot_id, clock.dateString, context.userId);
    if (!session) continue;
    const students = await prisma.$queryRaw<Array<{ student_id: string; name: string; roll_number: string; status: AttendanceMarkStatus | null; method: 'MANUAL' | 'FACE_CLASS' | 'FACE_DAILY' | 'OVERRIDE' | null }>>`
      SELECT st.id AS student_id, u.name, st."rollNumber" AS roll_number, m.status, m.method
      FROM public.enrollments e
      JOIN public.students st ON st.id = e.student_id
      JOIN public.users u ON u.id = st.user_id
      LEFT JOIN campusos_attendance.marks m ON m.session_id = ${session.id}::uuid AND m.student_id = st.id
      WHERE e.tenant_id = ${context.tenantId}::uuid AND e.course_offering_id = ${slot.course_offering_id}::uuid
      ORDER BY st."rollNumber" ASC
    `;
    const enriched = await Promise.all(students.map(async (student) => ({
      studentId: student.student_id,
      name: student.name,
      rollNumber: student.roll_number,
      studyMode: await resolveStudentMode(context.tenantId, student.student_id),
      status: student.status,
      method: student.method,
    })));
    sessions.push({
      sessionId: session.id,
      timetableSlotId: slot.timetable_slot_id,
      courseOfferingId: slot.course_offering_id,
      courseCode: slot.course_code,
      courseTitle: slot.course_title,
      sessionDate: clock.dateString,
      startTime: slot.start_time,
      endTime: slot.end_time,
      status: session.status,
      students: enriched,
    });
  }
  return sessions;
}

async function institutionMetrics(tenantId: string, settings: AttendanceSettings) {
  try {
    const students = await prisma.student.findMany({ where: { tenantId }, select: { id: true } });
    const modes = await Promise.all(students.map(async (student) => resolveStudentMode(tenantId, student.id)));
    const summaries = await Promise.all(students.map(async (student) => studentSummaries(tenantId, student.id, settings.requiredPercentage)));
    const clock = localClock(settings.timezone);
    const submitted = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count FROM campusos_attendance.sessions
      WHERE tenant_id = ${tenantId}::uuid AND session_date = ${clock.dateString}::date AND status = 'SUBMITTED'
    `;
    return {
      enrolledStudents: students.length,
      classifiedStudents: modes.filter((mode) => mode !== 'UNCLASSIFIED').length,
      onlineStudents: modes.filter((mode) => mode === 'ONLINE').length,
      offlineStudents: modes.filter((mode) => mode === 'OFFLINE').length,
      hybridStudents: modes.filter((mode) => mode === 'HYBRID').length,
      belowThreshold: summaries.filter((list) => list.some((item) => item.shortage)).length,
      submittedToday: Number(submitted[0]?.count ?? 0),
    };
  } catch {
    return { enrolledStudents: 0, classifiedStudents: 0, onlineStudents: 0, offlineStudents: 0, hybridStudents: 0, belowThreshold: 0, submittedToday: 0 };
  }
}

export async function getAttendanceWorkspace(): Promise<AttendanceWorkspace> {
  const context = await requireActiveUserContext();
  if (!VIEW_ROLES.has(context.activeRole)) throw new SmartAttendanceError('Attendance is not available for this role.', 403);
  const settings = await readSettings(context.tenantId);
  if (!settings.storeReady) return { role: context.activeRole, settings, student: null, facultySessions: [], institutionMetrics: null };

  let student: AttendanceStudentView | null = null;
  if (context.activeRole === 'STUDENT') student = await studentView(context, settings);
  const sessions = await facultySessions(context, settings);
  const metrics = ATTENDANCE_OVERSIGHT_ROLES.has(context.activeRole) ? await institutionMetrics(context.tenantId, settings) : null;
  return { role: context.activeRole, settings, student, facultySessions: sessions, institutionMetrics: metrics };
}

function requireCalendarAdmin(context: ActiveUserContext) {
  if (!CALENDAR_ADMIN_ROLES.has(context.activeRole)) throw new SmartAttendanceError('Institution calendar authority required.', 403);
}

export async function updateAttendanceSettings(patch: Partial<Omit<AttendanceSettings, 'storeReady'>>) {
  const context = await requireActiveUserContext();
  requireCalendarAdmin(context);
  const current = await readSettings(context.tenantId);
  const next = { ...current, ...patch };
  if (next.requiredPercentage < 0 || next.requiredPercentage > 100) throw new SmartAttendanceError('Attendance threshold must be between 0 and 100.');
  if (next.checkinEarlyMinutes < 0 || next.checkinEarlyMinutes > 120 || next.checkinLateMinutes < 0 || next.checkinLateMinutes > 180) throw new SmartAttendanceError('Review the attendance check-in window.');
  try { new Intl.DateTimeFormat('en', { timeZone: next.timezone }).format(); } catch { throw new SmartAttendanceError('Timezone is invalid.'); }
  await prisma.$executeRaw`
    INSERT INTO campusos_attendance.settings (
      tenant_id, required_percentage, timezone, allow_offline_self_checkin,
      require_online_face, require_offline_self_face, allow_hybrid_daily_checkin,
      checkin_early_minutes, checkin_late_minutes, checkout_enabled, updated_by, updated_at
    ) VALUES (
      ${context.tenantId}::uuid, ${next.requiredPercentage}, ${next.timezone}, ${next.allowOfflineSelfCheckIn},
      ${next.requireOnlineFace}, ${next.requireOfflineSelfFace}, ${next.allowHybridDailyCheckIn},
      ${next.checkinEarlyMinutes}, ${next.checkinLateMinutes}, ${next.checkoutEnabled}, ${context.userId}::uuid, now()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      required_percentage = EXCLUDED.required_percentage, timezone = EXCLUDED.timezone,
      allow_offline_self_checkin = EXCLUDED.allow_offline_self_checkin,
      require_online_face = EXCLUDED.require_online_face,
      require_offline_self_face = EXCLUDED.require_offline_self_face,
      allow_hybrid_daily_checkin = EXCLUDED.allow_hybrid_daily_checkin,
      checkin_early_minutes = EXCLUDED.checkin_early_minutes,
      checkin_late_minutes = EXCLUDED.checkin_late_minutes,
      checkout_enabled = EXCLUDED.checkout_enabled, updated_by = EXCLUDED.updated_by, updated_at = now()
  `;
  return { ...next, storeReady: true };
}

export async function updateAttendanceStudent(input: { studentId: string; studyMode: AttendanceStudyMode; selfCheckInEnabled?: boolean }) {
  const context = await requireActiveUserContext();
  requireCalendarAdmin(context);
  const exists = await prisma.student.count({ where: { id: input.studentId, tenantId: context.tenantId } });
  if (!exists) throw new SmartAttendanceError('Student does not belong to this institution.', 404);
  await prisma.$executeRaw`
    INSERT INTO campusos_attendance.student_profiles (tenant_id, student_id, study_mode, self_checkin_enabled, updated_by, updated_at)
    VALUES (${context.tenantId}::uuid, ${input.studentId}::uuid, ${input.studyMode}, ${input.selfCheckInEnabled ?? true}, ${context.userId}::uuid, now())
    ON CONFLICT (tenant_id, student_id) DO UPDATE SET
      study_mode = EXCLUDED.study_mode, self_checkin_enabled = EXCLUDED.self_checkin_enabled,
      updated_by = EXCLUDED.updated_by, updated_at = now()
  `;
  return { success: true };
}

export async function createAttendanceCalendarDay(input: {
  calendarDate: string;
  dayType: CalendarDayType;
  title: string;
  description?: string;
  programId?: string;
  batchId?: string;
  sectionId?: string;
}) {
  const context = await requireActiveUserContext();
  requireCalendarAdmin(context);
  const scopes = [input.programId, input.batchId, input.sectionId].filter(Boolean);
  if (scopes.length > 1) throw new SmartAttendanceError('Calendar entry can target only one academic scope.');
  if (input.programId && !(await prisma.program.count({ where: { id: input.programId, tenantId: context.tenantId } }))) throw new SmartAttendanceError('Program does not belong to the institution.', 404);
  if (input.batchId && !(await prisma.batch.count({ where: { id: input.batchId, tenantId: context.tenantId } }))) throw new SmartAttendanceError('Batch does not belong to the institution.', 404);
  if (input.sectionId && !(await prisma.section.count({ where: { id: input.sectionId, tenantId: context.tenantId } }))) throw new SmartAttendanceError('Section does not belong to the institution.', 404);
  await prisma.$executeRaw`
    INSERT INTO campusos_attendance.calendar_days (
      tenant_id, calendar_date, day_type, title, description, program_id, batch_id, section_id, created_by, updated_at
    ) VALUES (
      ${context.tenantId}::uuid, ${input.calendarDate}::date, ${input.dayType}, ${input.title}, ${input.description ?? null},
      ${input.programId ?? null}::uuid, ${input.batchId ?? null}::uuid, ${input.sectionId ?? null}::uuid, ${context.userId}::uuid, now()
    )
    ON CONFLICT (
      tenant_id, calendar_date,
      (COALESCE(program_id, '00000000-0000-0000-0000-000000000000'::uuid)),
      (COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'::uuid)),
      (COALESCE(section_id, '00000000-0000-0000-0000-000000000000'::uuid))
    ) DO UPDATE SET day_type = EXCLUDED.day_type, title = EXCLUDED.title,
                    description = EXCLUDED.description, updated_at = now()
  `;
  return { success: true };
}

async function allStudentsForAdmin(tenantId: string) {
  const rows = await prisma.$queryRaw<StudentIdentity[]>`
    SELECT s.id AS student_id, s.user_id, u.name, s."rollNumber" AS roll_number,
           s.batch_id, s.section_id, b.program_id, p.name AS program_name,
           b.name AS batch_name, sec.name AS section_name
    FROM public.students s
    JOIN public.users u ON u.id = s.user_id
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.programs p ON p.id = b.program_id
    LEFT JOIN public.sections sec ON sec.id = s.section_id
    WHERE s.tenant_id = ${tenantId}::uuid
    ORDER BY u.name ASC
  `;
  return Promise.all(rows.map(async (row) => ({
    studentId: row.student_id,
    name: row.name,
    rollNumber: row.roll_number,
    studyMode: await resolveStudentMode(tenantId, row.student_id),
    programName: row.program_name,
    batchName: row.batch_name,
    sectionName: row.section_name,
  })));
}

async function calendarEntries(tenantId: string): Promise<AttendanceCalendarEntry[]> {
  try {
    const rows = await prisma.$queryRaw<CalendarRow[]>`
      SELECT cd.id, cd.calendar_date, cd.day_type, cd.title, cd.description,
             cd.program_id, cd.batch_id, cd.section_id,
             p.name AS program_name, b.name AS batch_name, s.name AS section_name
      FROM campusos_attendance.calendar_days cd
      LEFT JOIN public.programs p ON p.id = cd.program_id
      LEFT JOIN public.batches b ON b.id = cd.batch_id
      LEFT JOIN public.sections s ON s.id = cd.section_id
      WHERE cd.tenant_id = ${tenantId}::uuid
        AND cd.calendar_date BETWEEN CURRENT_DATE - interval '30 days' AND CURRENT_DATE + interval '120 days'
      ORDER BY cd.calendar_date ASC
    `;
    return rows.map((row) => ({
      id: row.id,
      calendarDate: new Date(row.calendar_date).toISOString().slice(0, 10),
      dayType: row.day_type,
      title: row.title,
      description: row.description,
      scopeLabel: row.section_name ? `Section · ${row.section_name}` : row.batch_name ? `Batch · ${row.batch_name}` : row.program_name ? `Program · ${row.program_name}` : 'Institution-wide',
    }));
  } catch {
    return [];
  }
}

export async function getAttendanceAdminData(): Promise<AttendanceAdminData> {
  const context = await requireActiveUserContext();
  requireCalendarAdmin(context);
  const settings = await readSettings(context.tenantId);
  const [students, calendar, metrics] = await Promise.all([
    allStudentsForAdmin(context.tenantId),
    calendarEntries(context.tenantId),
    institutionMetrics(context.tenantId, settings),
  ]);
  return { settings, students, calendar, metrics };
}
