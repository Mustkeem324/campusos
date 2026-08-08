import 'server-only';

import crypto from 'node:crypto';

import { Prisma, type RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { ExamIdentityProviderError, verifyExamIdentity } from './secure-examination-identity';
import {
  calculateAttemptDeadline,
  canAuthorExamQuestions,
  canManageSecureExams,
  canProctorSecureExam,
  evaluateExamReadiness,
  integrityStateFromAutomatedEvent,
  isOnlineExamMode,
} from './secure-examination-policy';
import type {
  DevicePrecheck,
  ExamAttemptSession,
  ExamDeliveryMode,
  ExamSecurityProfile,
  NetworkQuality,
  ProctoringSeverity,
  SecureExamWorkspace,
  VerificationState,
} from './secure-examination-types';

export class SecureExaminationError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.name = 'SecureExaminationError';
    this.status = status;
    this.code = code;
  }
}

const FINAL_ATTEMPT_STATES = new Set(['SUBMITTED', 'AUTO_SUBMITTED', 'COMPLETED', 'CANCELLED']);
const ONLINE_DELIVERY_MODES = new Set<ExamDeliveryMode>([
  'ONLINE_UNPROCTORED',
  'ONLINE_PROCTORED',
  'HUMAN_PROCTORED',
  'AI_ASSISTED_PROCTORED',
  'HYBRID',
]);
const VALID_DELIVERY_MODES = new Set<ExamDeliveryMode>(['OFFLINE', ...ONLINE_DELIVERY_MODES]);
const VALID_NETWORK_QUALITY = new Set<NetworkQuality>(['UNKNOWN', 'POOR', 'FAIR', 'GOOD', 'EXCELLENT']);
const CLIENT_EVENT_SOURCES = new Set(['SYSTEM', 'PRIMARY_CAMERA', 'SECONDARY_CAMERA', 'SCREEN', 'AUDIO', 'NETWORK']);
const PROCTOR_SEVERITIES = new Set<ProctoringSeverity>(['INFO', 'LOW', 'MEDIUM', 'HIGH']);

const DEFAULT_SETTINGS = {
  timezone: 'Asia/Kolkata',
  requireTermsAcceptance: true,
};

type SettingsRow = {
  timezone: string;
  require_terms_acceptance: boolean;
};

type SecurityProfileRow = {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  identity_required: boolean;
  selfie_required: boolean;
  liveness_required: boolean;
  primary_camera_required: boolean;
  microphone_required: boolean;
  screen_share_required: boolean;
  fullscreen_required: boolean;
  second_camera_required: boolean;
  human_admission_required: boolean;
  ai_event_analysis_enabled: boolean;
  clipboard_restricted: boolean;
  permitted_materials: unknown;
};

type StudentExamRow = SecurityProfileRow & {
  config_id: string;
  exam_id: string;
  exam_name: string;
  exam_type: string;
  course_offering_id: string | null;
  course_code: string | null;
  course_title: string | null;
  delivery_mode: ExamDeliveryMode;
  config_status: string;
  starts_at: Date | null;
  ends_at: Date | null;
  duration_minutes: number | null;
  instructions: string | null;
  security_profile_id: string | null;
  attempt_id: string | null;
  attempt_no: number | null;
  attempt_status: string | null;
  started_at: Date | null;
  deadline_at: Date | null;
  submitted_at: Date | null;
  submission_reference: string | null;
  admitted_at: Date | null;
  terms_id: string | null;
  terms_version: string | null;
  terms_title: string | null;
  terms_content: string | null;
  terms_accepted: boolean;
  identity_state: VerificationState | null;
  browser_supported: boolean | null;
  camera_ready: boolean | null;
  microphone_ready: boolean | null;
  screen_share_ready: boolean | null;
  fullscreen_ready: boolean | null;
  second_camera_ready: boolean | null;
  network_quality: NetworkQuality | null;
  precheck_state: DevicePrecheck['state'] | null;
  precheck_checked_at: Date | null;
  second_camera_status: string | null;
  second_camera_last_heartbeat_at: Date | null;
};

type AdminConfigRow = {
  config_id: string;
  exam_id: string;
  exam_name: string;
  exam_type: string;
  delivery_mode: ExamDeliveryMode;
  config_status: string;
  starts_at: Date | null;
  ends_at: Date | null;
  course_offering_id: string | null;
  course_code: string | null;
  course_title: string | null;
  security_profile_id: string | null;
  security_profile_name: string | null;
  attempt_count: bigint | number;
  active_attempt_count: bigint | number;
  review_required_count: bigint | number;
};

type LiveAttemptRow = {
  attempt_id: string;
  config_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  exam_name: string;
  exam_type: string;
  attempt_status: string;
  delivery_mode: ExamDeliveryMode;
  identity_state: VerificationState | null;
  precheck_state: DevicePrecheck['state'] | null;
  second_camera_status: string | null;
  last_heartbeat_at: Date | null;
  unreviewed_high_events: bigint | number;
  unreviewed_medium_events: bigint | number;
};

type AttemptGateRow = SecurityProfileRow & {
  attempt_id: string;
  student_id: string;
  attempt_status: string;
  admitted_at: Date | null;
  config_id: string;
  delivery_mode: ExamDeliveryMode;
  security_profile_id: string | null;
  terms_id: string | null;
  terms_accepted: boolean;
  identity_state: VerificationState | null;
  browser_supported: boolean | null;
  camera_ready: boolean | null;
  microphone_ready: boolean | null;
  screen_share_ready: boolean | null;
  fullscreen_ready: boolean | null;
  second_camera_ready: boolean | null;
  network_quality: NetworkQuality | null;
  precheck_state: DevicePrecheck['state'] | null;
  second_camera_status: string | null;
};

function asIso(value: Date | string | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function asNumber(value: bigint | number | null | undefined) {
  if (typeof value === 'bigint') return Number(value);
  return Number(value ?? 0);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mapSecurityProfile(row: SecurityProfileRow | null | undefined): ExamSecurityProfile | null {
  if (!row?.id) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    identityRequired: row.identity_required,
    selfieRequired: row.selfie_required,
    livenessRequired: row.liveness_required,
    primaryCameraRequired: row.primary_camera_required,
    microphoneRequired: row.microphone_required,
    screenShareRequired: row.screen_share_required,
    fullscreenRequired: row.fullscreen_required,
    secondCameraRequired: row.second_camera_required,
    humanAdmissionRequired: row.human_admission_required,
    aiEventAnalysisEnabled: row.ai_event_analysis_enabled,
    clipboardRestricted: row.clipboard_restricted,
    permittedMaterials: asRecord(row.permitted_materials),
  };
}

function mapPrecheck(row: StudentExamRow | AttemptGateRow): DevicePrecheck | null {
  if (row.browser_supported === null || row.precheck_state === null) return null;
  return {
    browserSupported: row.browser_supported,
    cameraReady: Boolean(row.camera_ready),
    microphoneReady: Boolean(row.microphone_ready),
    screenShareReady: Boolean(row.screen_share_ready),
    fullscreenReady: Boolean(row.fullscreen_ready),
    secondCameraReady: Boolean(row.second_camera_ready),
    networkQuality: row.network_quality ?? 'UNKNOWN',
    state: row.precheck_state,
    ...('precheck_checked_at' in row ? { checkedAt: asIso(row.precheck_checked_at) } : {}),
  };
}

async function isStoreReady() {
  try {
    const rows = await prisma.$queryRaw<Array<{ ready: boolean }>>`
      SELECT to_regclass('campusos_exam_proctoring.exam_configs') IS NOT NULL AS ready
    `;
    return Boolean(rows[0]?.ready);
  } catch {
    return false;
  }
}

async function readSettings(tenantId: string) {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT timezone, require_terms_acceptance
      FROM campusos_exam_proctoring.settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return rows[0]
      ? { timezone: rows[0].timezone, requireTermsAcceptance: rows[0].require_terms_acceptance }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeAudit(
  tenantId: string,
  actorUserId: string,
  eventType: string,
  subjectType: string,
  subjectId: string | null,
  metadata: Record<string, unknown> = {},
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await tx.$executeRaw`
    INSERT INTO campusos_exam_proctoring.audit_events
      (tenant_id, actor_user_id, event_type, subject_type, subject_id, metadata)
    VALUES
      (${tenantId}::uuid, ${actorUserId}::uuid, ${eventType}, ${subjectType}, ${subjectId}::uuid, ${JSON.stringify(metadata)}::jsonb)
  `;
}

function requireManageRole(ctx: ActiveUserContext) {
  if (!canManageSecureExams(ctx.activeRole)) {
    throw new SecureExaminationError('This action requires Examination Controller, Registrar or Institution Admin authority.', 403);
  }
}

function requireProctorRole(ctx: ActiveUserContext) {
  if (!canProctorSecureExam(ctx.activeRole)) {
    throw new SecureExaminationError('This account is not authorized to proctor examinations.', 403);
  }
}

async function requireStudentContext(ctx: ActiveUserContext) {
  if (ctx.activeRole !== 'STUDENT' || !ctx.studentProfileId) {
    throw new SecureExaminationError('This action is available only to the signed-in student.', 403);
  }
  return ctx.studentProfileId;
}

async function studentIdentity(ctx: ActiveUserContext) {
  const studentId = await requireStudentContext(ctx);
  const rows = await prisma.$queryRaw<Array<{ student_id: string; name: string; roll_number: string }>>`
    SELECT s.id AS student_id, u.name, s."rollNumber" AS roll_number
    FROM public.students s
    JOIN public.users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
    WHERE s.id = ${studentId}::uuid AND s.tenant_id = ${ctx.tenantId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('Student profile could not be resolved.', 404);
  return rows[0];
}

async function studentExamRows(ctx: ActiveUserContext, studentId: string) {
  return prisma.$queryRaw<StudentExamRow[]>`
    SELECT
      ec.id AS config_id,
      ec.exam_id,
      e.name AS exam_name,
      e.type AS exam_type,
      ec.course_offering_id,
      c.code AS course_code,
      c.title AS course_title,
      ec.delivery_mode,
      ec.status AS config_status,
      ec.starts_at,
      ec.ends_at,
      ec.duration_minutes,
      ec.instructions,
      sp.id AS security_profile_id,
      COALESCE(sp.id, '00000000-0000-0000-0000-000000000000'::uuid) AS id,
      COALESCE(sp.name, 'No proctoring profile') AS name,
      sp.description,
      COALESCE(sp.status, 'ACTIVE') AS status,
      COALESCE(sp.identity_required, false) AS identity_required,
      COALESCE(sp.selfie_required, false) AS selfie_required,
      COALESCE(sp.liveness_required, false) AS liveness_required,
      COALESCE(sp.primary_camera_required, false) AS primary_camera_required,
      COALESCE(sp.microphone_required, false) AS microphone_required,
      COALESCE(sp.screen_share_required, false) AS screen_share_required,
      COALESCE(sp.fullscreen_required, false) AS fullscreen_required,
      COALESCE(sp.second_camera_required, false) AS second_camera_required,
      COALESCE(sp.human_admission_required, false) AS human_admission_required,
      COALESCE(sp.ai_event_analysis_enabled, false) AS ai_event_analysis_enabled,
      COALESCE(sp.clipboard_restricted, false) AS clipboard_restricted,
      COALESCE(sp.permitted_materials, '{}'::jsonb) AS permitted_materials,
      a.id AS attempt_id,
      a.attempt_no,
      a.status AS attempt_status,
      a.started_at,
      a.deadline_at,
      a.submitted_at,
      a.submission_reference,
      a.admitted_at,
      tv.id AS terms_id,
      tv.version AS terms_version,
      tv.title AS terms_title,
      tv.content AS terms_content,
      (ta.id IS NOT NULL) AS terms_accepted,
      iv.state AS identity_state,
      dp.browser_supported,
      dp.camera_ready,
      dp.microphone_ready,
      dp.screen_share_ready,
      dp.fullscreen_ready,
      dp.second_camera_ready,
      dp.network_quality,
      dp.state AS precheck_state,
      dp.checked_at AS precheck_checked_at,
      sc.status AS second_camera_status,
      sc.last_heartbeat_at AS second_camera_last_heartbeat_at
    FROM campusos_exam_proctoring.exam_configs ec
    JOIN public.exams e ON e.id = ec.exam_id AND e.tenant_id = ec.tenant_id
    LEFT JOIN public.course_offerings co ON co.id = ec.course_offering_id AND co.tenant_id = ec.tenant_id
    LEFT JOIN public.courses c ON c.id = co.course_id AND c.tenant_id = ec.tenant_id
    LEFT JOIN campusos_exam_proctoring.security_profiles sp ON sp.id = ec.security_profile_id AND sp.tenant_id = ec.tenant_id
    LEFT JOIN LATERAL (
      SELECT ea.*
      FROM campusos_exam_proctoring.exam_attempts ea
      WHERE ea.tenant_id = ec.tenant_id
        AND ea.exam_config_id = ec.id
        AND ea.student_id = ${studentId}::uuid
      ORDER BY ea.attempt_no DESC
      LIMIT 1
    ) a ON true
    LEFT JOIN LATERAL (
      SELECT t.*
      FROM campusos_exam_proctoring.terms_versions t
      WHERE t.tenant_id = ec.tenant_id
        AND t.effective_at <= now()
        AND (t.retired_at IS NULL OR t.retired_at > now())
      ORDER BY t.effective_at DESC, t.created_at DESC
      LIMIT 1
    ) tv ON true
    LEFT JOIN campusos_exam_proctoring.terms_acceptances ta
      ON ta.tenant_id = ec.tenant_id
      AND ta.exam_config_id = ec.id
      AND ta.student_id = ${studentId}::uuid
      AND ta.terms_version_id = tv.id
    LEFT JOIN LATERAL (
      SELECT v.state
      FROM campusos_exam_proctoring.identity_verifications v
      WHERE v.tenant_id = ec.tenant_id AND v.attempt_id = a.id
      ORDER BY v.created_at DESC
      LIMIT 1
    ) iv ON true
    LEFT JOIN campusos_exam_proctoring.device_prechecks dp
      ON dp.tenant_id = ec.tenant_id AND dp.attempt_id = a.id
    LEFT JOIN campusos_exam_proctoring.secondary_camera_sessions sc
      ON sc.tenant_id = ec.tenant_id AND sc.attempt_id = a.id
    WHERE ec.tenant_id = ${ctx.tenantId}::uuid
      AND ec.status IN ('PUBLISHED','LIVE','COMPLETED')
      AND (
        ec.course_offering_id IS NULL
        OR EXISTS (
          SELECT 1
          FROM public.enrollments enr
          WHERE enr.tenant_id = ec.tenant_id
            AND enr.student_id = ${studentId}::uuid
            AND enr.course_offering_id = ec.course_offering_id
        )
      )
    ORDER BY ec.starts_at ASC NULLS LAST, ec.created_at DESC
    LIMIT 100
  `;
}

async function getStudentWorkspace(ctx: ActiveUserContext): Promise<SecureExamWorkspace> {
  const identity = await studentIdentity(ctx);
  const [settings, rows] = await Promise.all([
    readSettings(ctx.tenantId),
    studentExamRows(ctx, identity.student_id),
  ]);

  const exams = rows.map((row) => {
    const profile = row.security_profile_id ? mapSecurityProfile(row) : null;
    const precheck = mapPrecheck(row);
    const online = isOnlineExamMode(row.delivery_mode);
    const readiness = evaluateExamReadiness({
      online,
      termsRequired: settings.requireTermsAcceptance && Boolean(row.terms_id),
      termsAccepted: row.terms_accepted,
      profile,
      identityState: row.identity_state,
      precheck,
      secondCameraStatus: row.second_camera_status,
      humanAdmitted: Boolean(row.admitted_at),
    });

    return {
      configId: row.config_id,
      examId: row.exam_id,
      examName: row.exam_name,
      examType: row.exam_type,
      courseOfferingId: row.course_offering_id,
      courseCode: row.course_code,
      courseTitle: row.course_title,
      deliveryMode: row.delivery_mode,
      status: row.config_status,
      startsAt: asIso(row.starts_at),
      endsAt: asIso(row.ends_at),
      durationMinutes: row.duration_minutes,
      instructions: row.instructions,
      securityProfile: profile,
      attempt: row.attempt_id
        ? {
            id: row.attempt_id,
            attemptNo: row.attempt_no ?? 1,
            status: (row.attempt_status ?? 'PRECHECK_AVAILABLE') as never,
            startedAt: asIso(row.started_at),
            deadlineAt: asIso(row.deadline_at),
            submittedAt: asIso(row.submitted_at),
            submissionReference: row.submission_reference,
            admittedAt: asIso(row.admitted_at),
          }
        : null,
      terms: row.terms_id
        ? {
            id: row.terms_id,
            version: row.terms_version ?? 'unknown',
            title: row.terms_title ?? 'Examination terms',
            content: row.terms_content ?? '',
            accepted: row.terms_accepted,
          }
        : null,
      identityState: row.identity_state,
      precheck,
      secondCamera: row.second_camera_status
        ? {
            status: row.second_camera_status as never,
            lastHeartbeatAt: asIso(row.second_camera_last_heartbeat_at),
          }
        : null,
      readiness,
    };
  });

  return {
    kind: 'STUDENT',
    role: 'STUDENT',
    storeReady: true,
    student: { id: identity.student_id, name: identity.name, rollNumber: identity.roll_number },
    exams,
  };
}

async function readSecurityProfiles(tenantId: string) {
  const rows = await prisma.$queryRaw<SecurityProfileRow[]>`
    SELECT id, name, description, status, identity_required, selfie_required, liveness_required,
           primary_camera_required, microphone_required, screen_share_required, fullscreen_required,
           second_camera_required, human_admission_required, ai_event_analysis_enabled,
           clipboard_restricted, permitted_materials
    FROM campusos_exam_proctoring.security_profiles
    WHERE tenant_id = ${tenantId}::uuid
    ORDER BY status = 'ACTIVE' DESC, name ASC
    LIMIT 100
  `;
  return rows.map((row) => mapSecurityProfile(row)).filter((value): value is ExamSecurityProfile => Boolean(value));
}

async function readAdminConfigs(tenantId: string) {
  const rows = await prisma.$queryRaw<AdminConfigRow[]>`
    SELECT ec.id AS config_id, ec.exam_id, e.name AS exam_name, e.type AS exam_type,
           ec.delivery_mode, ec.status AS config_status, ec.starts_at, ec.ends_at,
           ec.course_offering_id, c.code AS course_code, c.title AS course_title,
           sp.id AS security_profile_id, sp.name AS security_profile_name,
           COUNT(a.id) AS attempt_count,
           COUNT(a.id) FILTER (WHERE a.status IN ('VERIFICATION_PENDING','WAITING_ROOM','APPROVED','READY','IN_PROGRESS','RECONNECTING')) AS active_attempt_count,
           COUNT(a.id) FILTER (WHERE a.integrity_state IN ('REVIEW_REQUIRED','POLICY_CONCERN','FORMAL_CASE_REQUIRED')) AS review_required_count
    FROM campusos_exam_proctoring.exam_configs ec
    JOIN public.exams e ON e.id = ec.exam_id AND e.tenant_id = ec.tenant_id
    LEFT JOIN public.course_offerings co ON co.id = ec.course_offering_id AND co.tenant_id = ec.tenant_id
    LEFT JOIN public.courses c ON c.id = co.course_id
    LEFT JOIN campusos_exam_proctoring.security_profiles sp ON sp.id = ec.security_profile_id
    LEFT JOIN campusos_exam_proctoring.exam_attempts a ON a.exam_config_id = ec.id AND a.tenant_id = ec.tenant_id
    WHERE ec.tenant_id = ${tenantId}::uuid
    GROUP BY ec.id, e.name, e.type, c.code, c.title, sp.id, sp.name
    ORDER BY ec.starts_at DESC NULLS LAST, ec.created_at DESC
    LIMIT 200
  `;
  return rows.map((row) => ({
    configId: row.config_id,
    examId: row.exam_id,
    examName: row.exam_name,
    examType: row.exam_type,
    deliveryMode: row.delivery_mode,
    status: row.config_status,
    startsAt: asIso(row.starts_at),
    endsAt: asIso(row.ends_at),
    courseOfferingId: row.course_offering_id,
    courseCode: row.course_code,
    courseTitle: row.course_title,
    securityProfileId: row.security_profile_id,
    securityProfileName: row.security_profile_name,
    attemptCount: asNumber(row.attempt_count),
    activeAttemptCount: asNumber(row.active_attempt_count),
    reviewRequiredCount: asNumber(row.review_required_count),
  }));
}

async function readLiveAttempts(ctx: ActiveUserContext) {
  const canSeeAll = canManageSecureExams(ctx.activeRole);
  const rows = await prisma.$queryRaw<LiveAttemptRow[]>`
    SELECT a.id AS attempt_id, ec.id AS config_id, s.id AS student_id,
           u.name AS student_name, s."rollNumber" AS roll_number,
           e.name AS exam_name, e.type AS exam_type, a.status AS attempt_status,
           ec.delivery_mode,
           iv.state AS identity_state,
           dp.state AS precheck_state,
           sc.status AS second_camera_status,
           sc.last_heartbeat_at,
           COUNT(pe.id) FILTER (WHERE pe.severity = 'HIGH' AND pe.reviewed_at IS NULL) AS unreviewed_high_events,
           COUNT(pe.id) FILTER (WHERE pe.severity = 'MEDIUM' AND pe.reviewed_at IS NULL) AS unreviewed_medium_events
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
    JOIN public.exams e ON e.id = ec.exam_id AND e.tenant_id = ec.tenant_id
    JOIN public.students s ON s.id = a.student_id AND s.tenant_id = a.tenant_id
    JOIN public.users u ON u.id = s.user_id AND u.tenant_id = a.tenant_id
    LEFT JOIN LATERAL (
      SELECT v.state
      FROM campusos_exam_proctoring.identity_verifications v
      WHERE v.attempt_id = a.id AND v.tenant_id = a.tenant_id
      ORDER BY v.created_at DESC
      LIMIT 1
    ) iv ON true
    LEFT JOIN campusos_exam_proctoring.device_prechecks dp ON dp.attempt_id = a.id AND dp.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.secondary_camera_sessions sc ON sc.attempt_id = a.id AND sc.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.proctoring_events pe ON pe.attempt_id = a.id AND pe.tenant_id = a.tenant_id
    WHERE a.tenant_id = ${ctx.tenantId}::uuid
      AND a.status IN ('VERIFICATION_PENDING','WAITING_ROOM','APPROVED','READY','IN_PROGRESS','RECONNECTING','TECHNICAL_REVIEW','PROCTORING_REVIEW')
      AND (
        ${canSeeAll}::boolean
        OR EXISTS (
          SELECT 1
          FROM campusos_exam_proctoring.proctor_assignments pa
          WHERE pa.tenant_id = a.tenant_id
            AND pa.exam_config_id = ec.id
            AND pa.proctor_user_id = ${ctx.userId}::uuid
            AND pa.status = 'ACTIVE'
        )
      )
    GROUP BY a.id, ec.id, s.id, u.name, e.name, e.type, ec.delivery_mode,
             iv.state, dp.state, sc.status, sc.last_heartbeat_at
    ORDER BY
      (COUNT(pe.id) FILTER (WHERE pe.severity = 'HIGH' AND pe.reviewed_at IS NULL)) DESC,
      a.updated_at DESC
    LIMIT 200
  `;
  return rows.map((row) => ({
    attemptId: row.attempt_id,
    configId: row.config_id,
    studentId: row.student_id,
    studentName: row.student_name,
    rollNumber: row.roll_number,
    examName: row.exam_name,
    examType: row.exam_type,
    status: row.attempt_status as never,
    deliveryMode: row.delivery_mode,
    identityState: row.identity_state,
    precheckState: row.precheck_state,
    secondCameraStatus: row.second_camera_status,
    lastHeartbeatAt: asIso(row.last_heartbeat_at),
    unreviewedHighEvents: asNumber(row.unreviewed_high_events),
    unreviewedMediumEvents: asNumber(row.unreviewed_medium_events),
  }));
}

async function getAdminWorkspace(ctx: ActiveUserContext): Promise<SecureExamWorkspace> {
  if (!canManageSecureExams(ctx.activeRole) && !canProctorSecureExam(ctx.activeRole)) {
    throw new SecureExaminationError('This role does not have secure examination access.', 403);
  }

  const [securityProfiles, exams, liveAttempts, availableExams, courseOfferings] = await Promise.all([
    readSecurityProfiles(ctx.tenantId),
    canManageSecureExams(ctx.activeRole) ? readAdminConfigs(ctx.tenantId) : Promise.resolve([]),
    readLiveAttempts(ctx),
    canManageSecureExams(ctx.activeRole)
      ? prisma.$queryRaw<Array<{ id: string; name: string; type: string; term_name: string }>>`
          SELECT e.id, e.name, e.type, t.name AS term_name
          FROM public.exams e
          JOIN public.terms t ON t.id = e.term_id
          WHERE e.tenant_id = ${ctx.tenantId}::uuid
          ORDER BY t.startDate DESC, e.name ASC
          LIMIT 200
        `
      : Promise.resolve([]),
    canManageSecureExams(ctx.activeRole)
      ? prisma.$queryRaw<Array<{ id: string; course_code: string; course_title: string; section_name: string }>>`
          SELECT co.id, c.code AS course_code, c.title AS course_title, sec.name AS section_name
          FROM public.course_offerings co
          JOIN public.courses c ON c.id = co.course_id AND c.tenant_id = co.tenant_id
          JOIN public.sections sec ON sec.id = co.section_id
          WHERE co.tenant_id = ${ctx.tenantId}::uuid
          ORDER BY c.code ASC, sec.name ASC
          LIMIT 500
        `
      : Promise.resolve([]),
  ]);

  return {
    kind: 'ADMIN',
    role: ctx.activeRole,
    storeReady: true,
    exams,
    securityProfiles,
    liveAttempts,
    availableExams: availableExams.map((row) => ({ id: row.id, name: row.name, type: row.type, termName: row.term_name })),
    courseOfferings: courseOfferings.map((row) => ({
      id: row.id,
      courseCode: row.course_code,
      courseTitle: row.course_title,
      sectionName: row.section_name,
    })),
  };
}

export async function getSecureExamWorkspace(): Promise<SecureExamWorkspace> {
  const ctx = await requireActiveUserContext();
  if (!(await isStoreReady())) {
    if (ctx.activeRole === 'STUDENT') {
      const identity = await studentIdentity(ctx);
      return {
        kind: 'STUDENT',
        role: 'STUDENT',
        storeReady: false,
        student: { id: identity.student_id, name: identity.name, rollNumber: identity.roll_number },
        exams: [],
      };
    }
    return {
      kind: 'ADMIN',
      role: ctx.activeRole,
      storeReady: false,
      exams: [],
      securityProfiles: [],
      liveAttempts: [],
      availableExams: [],
      courseOfferings: [],
    };
  }
  if (ctx.activeRole === 'STUDENT') return getStudentWorkspace(ctx);
  return getAdminWorkspace(ctx);
}

export async function createSecurityProfile(input: Partial<ExamSecurityProfile> & { name?: string }) {
  const ctx = await requireActiveUserContext();
  requireManageRole(ctx);
  const name = String(input.name ?? '').trim();
  if (!name || name.length > 100) throw new SecureExaminationError('Security profile name is required and must be under 100 characters.');
  const description = input.description ? String(input.description).trim().slice(0, 1000) : null;
  const permittedMaterials = asRecord(input.permittedMaterials);

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.security_profiles (
      tenant_id, name, description, identity_required, selfie_required, liveness_required,
      primary_camera_required, microphone_required, screen_share_required, fullscreen_required,
      second_camera_required, human_admission_required, ai_event_analysis_enabled,
      clipboard_restricted, permitted_materials, created_by
    ) VALUES (
      ${ctx.tenantId}::uuid, ${name}, ${description}, ${Boolean(input.identityRequired)},
      ${Boolean(input.selfieRequired)}, ${Boolean(input.livenessRequired)}, ${Boolean(input.primaryCameraRequired)},
      ${Boolean(input.microphoneRequired)}, ${Boolean(input.screenShareRequired)}, ${Boolean(input.fullscreenRequired)},
      ${Boolean(input.secondCameraRequired)}, ${Boolean(input.humanAdmissionRequired)}, ${Boolean(input.aiEventAnalysisEnabled)},
      ${Boolean(input.clipboardRestricted)}, ${JSON.stringify(permittedMaterials)}::jsonb, ${ctx.userId}::uuid
    )
    RETURNING id
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'SECURITY_PROFILE_CREATED', 'SECURITY_PROFILE', rows[0]?.id ?? null, { name });
  return { id: rows[0]?.id };
}

function parseDeliveryMode(value: unknown): ExamDeliveryMode {
  const mode = String(value ?? '') as ExamDeliveryMode;
  if (!VALID_DELIVERY_MODES.has(mode)) throw new SecureExaminationError('Invalid examination delivery mode.');
  return mode;
}

function parseDate(value: unknown, label: string) {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) throw new SecureExaminationError(`${label} must be a valid date/time.`);
  return date;
}

export async function configureSecureExam(input: {
  configId?: string;
  examId?: string;
  courseOfferingId?: string | null;
  securityProfileId?: string | null;
  deliveryMode?: ExamDeliveryMode;
  startsAt?: string | null;
  endsAt?: string | null;
  durationMinutes?: number | null;
  maxAttempts?: number;
  reconnectGraceSeconds?: number;
  autoSubmit?: boolean;
  allowResumeAfterDisconnect?: boolean;
  instructions?: string | null;
}) {
  const ctx = await requireActiveUserContext();
  requireManageRole(ctx);
  const deliveryMode = parseDeliveryMode(input.deliveryMode);
  const startsAt = parseDate(input.startsAt, 'Start time');
  const endsAt = parseDate(input.endsAt, 'End time');
  if (startsAt && endsAt && endsAt <= startsAt) throw new SecureExaminationError('End time must be after start time.');
  const durationMinutes = input.durationMinutes === null || input.durationMinutes === undefined ? null : Math.floor(Number(input.durationMinutes));
  if (durationMinutes !== null && (durationMinutes < 1 || durationMinutes > 1440)) throw new SecureExaminationError('Duration must be between 1 and 1440 minutes.');
  const maxAttempts = Math.min(20, Math.max(1, Math.floor(Number(input.maxAttempts ?? 1))));
  const reconnectGraceSeconds = Math.min(3600, Math.max(0, Math.floor(Number(input.reconnectGraceSeconds ?? 120))));

  const examId = String(input.examId ?? '').trim();
  if (!examId) throw new SecureExaminationError('An existing NAVEMORA exam is required.');
  const exam = await prisma.exam.findFirst({ where: { id: examId, tenantId: ctx.tenantId }, select: { id: true } });
  if (!exam) throw new SecureExaminationError('Exam was not found in the active institution.', 404);

  const courseOfferingId = input.courseOfferingId ? String(input.courseOfferingId) : null;
  if (courseOfferingId) {
    const offering = await prisma.courseOffering.findFirst({ where: { id: courseOfferingId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!offering) throw new SecureExaminationError('Course offering was not found in the active institution.', 404);
  }

  const securityProfileId = input.securityProfileId ? String(input.securityProfileId) : null;
  if (securityProfileId) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_exam_proctoring.security_profiles
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${securityProfileId}::uuid AND status = 'ACTIVE'
      LIMIT 1
    `;
    if (!rows[0]) throw new SecureExaminationError('Security profile is not active in this institution.', 404);
  }
  if (deliveryMode !== 'OFFLINE' && !securityProfileId && deliveryMode !== 'ONLINE_UNPROCTORED') {
    throw new SecureExaminationError('A security profile is required for proctored online examinations.');
  }

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM campusos_exam_proctoring.exam_configs
    WHERE tenant_id = ${ctx.tenantId}::uuid
      AND exam_id = ${examId}::uuid
      AND course_offering_id IS NOT DISTINCT FROM ${courseOfferingId}::uuid
    LIMIT 1
  `;

  let configId = existing[0]?.id ?? null;
  if (configId) {
    await prisma.$executeRaw`
      UPDATE campusos_exam_proctoring.exam_configs
      SET security_profile_id = ${securityProfileId}::uuid,
          delivery_mode = ${deliveryMode}, starts_at = ${startsAt}, ends_at = ${endsAt},
          duration_minutes = ${durationMinutes}, max_attempts = ${maxAttempts},
          reconnect_grace_seconds = ${reconnectGraceSeconds}, auto_submit = ${input.autoSubmit !== false},
          allow_resume_after_disconnect = ${input.allowResumeAfterDisconnect !== false},
          instructions = ${input.instructions ? String(input.instructions).slice(0, 10000) : null},
          updated_by = ${ctx.userId}::uuid, updated_at = now()
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${configId}::uuid
    `;
  } else {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_exam_proctoring.exam_configs (
        tenant_id, exam_id, course_offering_id, security_profile_id, delivery_mode,
        starts_at, ends_at, duration_minutes, max_attempts, reconnect_grace_seconds,
        auto_submit, allow_resume_after_disconnect, instructions, created_by, updated_by
      ) VALUES (
        ${ctx.tenantId}::uuid, ${examId}::uuid, ${courseOfferingId}::uuid, ${securityProfileId}::uuid,
        ${deliveryMode}, ${startsAt}, ${endsAt}, ${durationMinutes}, ${maxAttempts}, ${reconnectGraceSeconds},
        ${input.autoSubmit !== false}, ${input.allowResumeAfterDisconnect !== false},
        ${input.instructions ? String(input.instructions).slice(0, 10000) : null}, ${ctx.userId}::uuid, ${ctx.userId}::uuid
      )
      RETURNING id
    `;
    configId = rows[0]?.id ?? null;
  }

  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_SECURITY_CONFIGURED', 'EXAM_CONFIG', configId, {
    examId,
    courseOfferingId,
    deliveryMode,
  });
  return { configId };
}

export async function setSecureExamStatus(configId: string, status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED') {
  const ctx = await requireActiveUserContext();
  requireManageRole(ctx);
  const updated = await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.exam_configs
    SET status = ${status}, updated_by = ${ctx.userId}::uuid, updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${configId}::uuid
  `;
  if (!updated) throw new SecureExaminationError('Exam configuration was not found.', 404);
  await writeAudit(ctx.tenantId, ctx.userId, `EXAM_CONFIG_${status}`, 'EXAM_CONFIG', configId);
  return { success: true };
}

export async function createExamTermsVersion(input: { version?: string; title?: string; content?: string; effectiveAt?: string | null }) {
  const ctx = await requireActiveUserContext();
  requireManageRole(ctx);
  const version = String(input.version ?? '').trim().slice(0, 50);
  const title = String(input.title ?? '').trim().slice(0, 200);
  const content = String(input.content ?? '').trim();
  if (!version || !title || content.length < 20) throw new SecureExaminationError('Terms version, title and meaningful content are required.');
  const effectiveAt = parseDate(input.effectiveAt, 'Effective time') ?? new Date();
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.terms_versions
      (tenant_id, version, title, content, effective_at, created_by)
    VALUES (${ctx.tenantId}::uuid, ${version}, ${title}, ${content}, ${effectiveAt}, ${ctx.userId}::uuid)
    RETURNING id
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_TERMS_VERSION_CREATED', 'TERMS_VERSION', rows[0]?.id ?? null, { version });
  return { id: rows[0]?.id };
}

async function requireStudentConfig(ctx: ActiveUserContext, configId: string) {
  const studentId = await requireStudentContext(ctx);
  const rows = await prisma.$queryRaw<Array<{
    config_id: string;
    delivery_mode: ExamDeliveryMode;
    status: string;
    starts_at: Date | null;
    ends_at: Date | null;
    duration_minutes: number | null;
    max_attempts: number;
    course_offering_id: string | null;
  }>>`
    SELECT ec.id AS config_id, ec.delivery_mode, ec.status, ec.starts_at, ec.ends_at,
           ec.duration_minutes, ec.max_attempts, ec.course_offering_id
    FROM campusos_exam_proctoring.exam_configs ec
    WHERE ec.tenant_id = ${ctx.tenantId}::uuid AND ec.id = ${configId}::uuid
      AND ec.status IN ('PUBLISHED','LIVE','COMPLETED')
      AND (
        ec.course_offering_id IS NULL
        OR EXISTS (
          SELECT 1 FROM public.enrollments e
          WHERE e.tenant_id = ec.tenant_id AND e.student_id = ${studentId}::uuid
            AND e.course_offering_id = ec.course_offering_id
        )
      )
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('This examination is not available to the signed-in student.', 404);
  return { studentId, config: rows[0] };
}

export async function createStudentAttempt(configId: string) {
  const ctx = await requireActiveUserContext();
  const { studentId, config } = await requireStudentConfig(ctx, configId);
  if (!ONLINE_DELIVERY_MODES.has(config.delivery_mode)) {
    throw new SecureExaminationError('This examination is configured for the offline venue workflow.', 409);
  }
  if (config.status === 'COMPLETED') throw new SecureExaminationError('This examination has already completed.', 409);

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${ctx.tenantId}:${configId}:${studentId}`}))`;
    const attempts = await tx.$queryRaw<Array<{ id: string; attempt_no: number; status: string }>>`
      SELECT id, attempt_no, status
      FROM campusos_exam_proctoring.exam_attempts
      WHERE tenant_id = ${ctx.tenantId}::uuid AND exam_config_id = ${configId}::uuid AND student_id = ${studentId}::uuid
      ORDER BY attempt_no DESC
    `;
    const active = attempts.find((attempt) => !FINAL_ATTEMPT_STATES.has(attempt.status));
    if (active) return { attemptId: active.id, attemptNo: active.attempt_no, reused: true };
    if (attempts.length >= config.max_attempts) throw new SecureExaminationError('Maximum examination attempts have been reached.', 409);

    const attemptNo = attempts.length + 1;
    const inserted = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_exam_proctoring.exam_attempts
        (tenant_id, exam_config_id, student_id, attempt_no, status)
      VALUES (${ctx.tenantId}::uuid, ${configId}::uuid, ${studentId}::uuid, ${attemptNo}, 'PRECHECK_AVAILABLE')
      RETURNING id
    `;
    const attemptId = inserted[0]?.id;
    if (!attemptId) throw new SecureExaminationError('Unable to create examination attempt.', 500);

    await tx.$executeRaw`
      INSERT INTO campusos_exam_proctoring.attempt_questions (
        tenant_id, attempt_id, question_id, section_title, display_order, marks,
        prompt_snapshot, options_snapshot, option_order
      )
      SELECT eq.tenant_id, ${attemptId}::uuid, eq.question_id, eq.section_title, eq.position, eq.marks,
             qb.prompt, qb.options, NULL
      FROM campusos_exam_proctoring.exam_questions eq
      JOIN campusos_exam_proctoring.question_bank qb ON qb.id = eq.question_id AND qb.tenant_id = eq.tenant_id
      WHERE eq.tenant_id = ${ctx.tenantId}::uuid AND eq.exam_config_id = ${configId}::uuid
      ORDER BY eq.position ASC
      ON CONFLICT DO NOTHING
    `;
    await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_ATTEMPT_CREATED', 'EXAM_ATTEMPT', attemptId, { configId, attemptNo }, tx);
    return { attemptId, attemptNo, reused: false };
  });
}

export async function acceptExamTerms(configId: string, termsVersionId: string, requestMeta?: { ipAddress?: string | null; userAgent?: string | null }) {
  const ctx = await requireActiveUserContext();
  const { studentId } = await requireStudentConfig(ctx, configId);
  const terms = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id
    FROM campusos_exam_proctoring.terms_versions
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${termsVersionId}::uuid
      AND effective_at <= now() AND (retired_at IS NULL OR retired_at > now())
    LIMIT 1
  `;
  if (!terms[0]) throw new SecureExaminationError('The selected examination terms are no longer active.', 409);
  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.terms_acceptances
      (tenant_id, exam_config_id, student_id, terms_version_id, ip_address, user_agent)
    VALUES (${ctx.tenantId}::uuid, ${configId}::uuid, ${studentId}::uuid, ${termsVersionId}::uuid,
            ${requestMeta?.ipAddress ?? null}, ${requestMeta?.userAgent ?? null})
    ON CONFLICT (tenant_id, exam_config_id, student_id, terms_version_id) DO NOTHING
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_TERMS_ACCEPTED', 'EXAM_CONFIG', configId, { termsVersionId });
  await refreshAttemptGate(ctx, configId, studentId);
  return { success: true };
}

async function requireOwnAttempt(ctx: ActiveUserContext, attemptId: string) {
  const studentId = await requireStudentContext(ctx);
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    exam_config_id: string;
    status: string;
    deadline_at: Date | null;
    started_at: Date | null;
    student_id: string;
  }>>`
    SELECT id, exam_config_id, status, deadline_at, started_at, student_id
    FROM campusos_exam_proctoring.exam_attempts
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid AND student_id = ${studentId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('Examination attempt was not found.', 404);
  return rows[0];
}

function bool(value: unknown) {
  return value === true;
}

export async function saveDevicePrecheck(attemptId: string, input: {
  browserSupported?: boolean;
  cameraReady?: boolean;
  microphoneReady?: boolean;
  screenShareReady?: boolean;
  fullscreenReady?: boolean;
  secondCameraReady?: boolean;
  networkQuality?: NetworkQuality;
  clientDetails?: Record<string, unknown>;
}) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  if (FINAL_ATTEMPT_STATES.has(attempt.status)) throw new SecureExaminationError('This examination attempt is already closed.', 409);
  const networkQuality = VALID_NETWORK_QUALITY.has(input.networkQuality ?? 'UNKNOWN') ? input.networkQuality ?? 'UNKNOWN' : 'UNKNOWN';

  const profileRows = await prisma.$queryRaw<Array<{
    primary_camera_required: boolean;
    microphone_required: boolean;
    screen_share_required: boolean;
    fullscreen_required: boolean;
  }>>`
    SELECT COALESCE(sp.primary_camera_required, false) AS primary_camera_required,
           COALESCE(sp.microphone_required, false) AS microphone_required,
           COALESCE(sp.screen_share_required, false) AS screen_share_required,
           COALESCE(sp.fullscreen_required, false) AS fullscreen_required
    FROM campusos_exam_proctoring.exam_configs ec
    LEFT JOIN campusos_exam_proctoring.security_profiles sp ON sp.id = ec.security_profile_id
    WHERE ec.tenant_id = ${ctx.tenantId}::uuid AND ec.id = ${attempt.exam_config_id}::uuid
    LIMIT 1
  `;
  const profile = profileRows[0] ?? {
    primary_camera_required: false,
    microphone_required: false,
    screen_share_required: false,
    fullscreen_required: false,
  };
  const failed = !bool(input.browserSupported)
    || (profile.primary_camera_required && !bool(input.cameraReady))
    || (profile.microphone_required && !bool(input.microphoneReady))
    || (profile.screen_share_required && !bool(input.screenShareReady))
    || (profile.fullscreen_required && !bool(input.fullscreenReady));
  const state = failed ? 'FAILED' : 'READY';

  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.device_prechecks (
      tenant_id, attempt_id, browser_supported, camera_ready, microphone_ready,
      screen_share_ready, fullscreen_ready, second_camera_ready, network_quality,
      state, client_details, checked_at, updated_at
    ) VALUES (
      ${ctx.tenantId}::uuid, ${attemptId}::uuid, ${bool(input.browserSupported)}, ${bool(input.cameraReady)},
      ${bool(input.microphoneReady)}, ${bool(input.screenShareReady)}, ${bool(input.fullscreenReady)},
      ${bool(input.secondCameraReady)}, ${networkQuality}, ${state}, ${JSON.stringify(asRecord(input.clientDetails))}::jsonb,
      now(), now()
    )
    ON CONFLICT (attempt_id) DO UPDATE SET
      browser_supported = EXCLUDED.browser_supported,
      camera_ready = EXCLUDED.camera_ready,
      microphone_ready = EXCLUDED.microphone_ready,
      screen_share_ready = EXCLUDED.screen_share_ready,
      fullscreen_ready = EXCLUDED.fullscreen_ready,
      second_camera_ready = EXCLUDED.second_camera_ready,
      network_quality = EXCLUDED.network_quality,
      state = EXCLUDED.state,
      client_details = EXCLUDED.client_details,
      checked_at = now(),
      updated_at = now()
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_DEVICE_PRECHECK_SAVED', 'EXAM_ATTEMPT', attemptId, { state, networkQuality });
  await refreshAttemptGate(ctx, attempt.exam_config_id, attempt.student_id);
  return { state };
}

export async function verifyStudentIdentityForExam(attemptId: string, input: { idCaptureDataUrl?: string; selfieDataUrl?: string }) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  const student = await prisma.student.findFirst({
    where: { id: attempt.student_id, tenantId: ctx.tenantId },
    select: { id: true, rollNumber: true, userId: true },
  });
  if (!student) throw new SecureExaminationError('Student identity could not be resolved.', 404);
  const idCaptureDataUrl = String(input.idCaptureDataUrl ?? '');
  const selfieDataUrl = String(input.selfieDataUrl ?? '');

  try {
    const result = await verifyExamIdentity({
      tenantId: ctx.tenantId,
      userId: ctx.userId,
      studentId: student.id,
      enrollmentNumber: student.rollNumber,
      idCaptureDataUrl,
      selfieDataUrl,
    });
    await prisma.$executeRaw`
      INSERT INTO campusos_exam_proctoring.identity_verifications
        (tenant_id, attempt_id, student_id, method, provider, provider_reference, state, confidence)
      VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${student.id}::uuid, 'FACE_MATCH', 'EXAM_ID_PROVIDER',
              ${result.providerVerificationId}, ${result.state}, ${result.confidence})
    `;
    await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_IDENTITY_VERIFIED', 'EXAM_ATTEMPT', attemptId, {
      state: result.state,
      providerReference: result.providerVerificationId,
    });
    await refreshAttemptGate(ctx, attempt.exam_config_id, student.id);
    return { state: result.state, confidence: result.confidence };
  } catch (error) {
    if (error instanceof ExamIdentityProviderError && ['NOT_CONFIGURED', 'UNAVAILABLE'].includes(error.code)) {
      await prisma.$executeRaw`
        INSERT INTO campusos_exam_proctoring.identity_verifications
          (tenant_id, attempt_id, student_id, method, provider, state, reviewer_note)
        VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${student.id}::uuid, 'HUMAN_REVIEW', NULL,
                'REVIEW_REQUIRED', ${error.message})
      `;
      await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_IDENTITY_HUMAN_REVIEW_REQUESTED', 'EXAM_ATTEMPT', attemptId, {
        reason: error.code,
      });
      await refreshAttemptGate(ctx, attempt.exam_config_id, student.id);
      return { state: 'REVIEW_REQUIRED' as const, confidence: null, message: error.message };
    }
    if (error instanceof ExamIdentityProviderError) throw new SecureExaminationError(error.message, error.status, error.code);
    throw error;
  }
}

async function requireAttemptForProctor(ctx: ActiveUserContext, attemptId: string) {
  requireProctorRole(ctx);
  const canSeeAll = canManageSecureExams(ctx.activeRole);
  const rows = await prisma.$queryRaw<Array<{ attempt_id: string; config_id: string; student_id: string; status: string }>>`
    SELECT a.id AS attempt_id, ec.id AS config_id, a.student_id, a.status
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
    WHERE a.tenant_id = ${ctx.tenantId}::uuid AND a.id = ${attemptId}::uuid
      AND (
        ${canSeeAll}::boolean
        OR EXISTS (
          SELECT 1 FROM campusos_exam_proctoring.proctor_assignments pa
          WHERE pa.tenant_id = a.tenant_id AND pa.exam_config_id = ec.id
            AND pa.proctor_user_id = ${ctx.userId}::uuid AND pa.status = 'ACTIVE'
        )
      )
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('This examination attempt is not assigned to the signed-in proctor.', 403);
  return rows[0];
}

export async function reviewStudentIdentity(attemptId: string, decision: 'APPROVED' | 'REJECTED', note?: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireAttemptForProctor(ctx, attemptId);
  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.identity_verifications
      (tenant_id, attempt_id, student_id, method, state, reviewed_by, reviewed_at, reviewer_note)
    VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${attempt.student_id}::uuid,
            'HUMAN_REVIEW', ${decision}, ${ctx.userId}::uuid, now(), ${note ? String(note).slice(0, 2000) : null})
  `;
  await writeAudit(ctx.tenantId, ctx.userId, `EXAM_IDENTITY_${decision}`, 'EXAM_ATTEMPT', attemptId);
  await refreshAttemptGate(ctx, attempt.config_id, attempt.student_id);
  return { state: decision };
}

function hashPairingSecret(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

export async function create3DEyesPairing(attemptId: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  const token = crypto.randomBytes(32).toString('base64url');
  const code = String(crypto.randomInt(10_000_000, 99_999_999));
  const tokenHash = hashPairingSecret(token);
  const codeHash = hashPairingSecret(`${ctx.tenantId}:${attempt.student_id}:${code}`);
  const expiresAt = new Date(Date.now() + 10 * 60_000);

  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.secondary_camera_sessions
      (tenant_id, attempt_id, student_id, pairing_token_hash, pairing_code_hash, status, expires_at, updated_at)
    VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${attempt.student_id}::uuid, ${tokenHash}, ${codeHash}, 'PAIRING', ${expiresAt}, now())
    ON CONFLICT (attempt_id) DO UPDATE SET
      pairing_token_hash = EXCLUDED.pairing_token_hash,
      pairing_code_hash = EXCLUDED.pairing_code_hash,
      status = 'PAIRING',
      paired_user_id = NULL,
      device_reference = NULL,
      expires_at = EXCLUDED.expires_at,
      paired_at = NULL,
      connected_at = NULL,
      disconnected_at = NULL,
      last_heartbeat_at = NULL,
      updated_at = now()
  `;
  await writeAudit(ctx.tenantId, ctx.userId, '3D_EYES_PAIRING_CREATED', 'EXAM_ATTEMPT', attemptId);
  return { token, code, expiresAt: expiresAt.toISOString() };
}

export async function pair3DEyes(input: { token?: string; code?: string; deviceReference?: string }) {
  const ctx = await requireActiveUserContext();
  const studentId = await requireStudentContext(ctx);
  const token = input.token ? String(input.token) : '';
  const code = input.code ? String(input.code).replace(/\D/g, '') : '';
  if (!token && !code) throw new SecureExaminationError('3D Eyes pairing token or code is required.');
  const tokenHash = token ? hashPairingSecret(token) : '';
  const codeHash = code ? hashPairingSecret(`${ctx.tenantId}:${studentId}:${code}`) : '';

  const rows = await prisma.$queryRaw<Array<{ id: string; attempt_id: string }>>`
    SELECT id, attempt_id
    FROM campusos_exam_proctoring.secondary_camera_sessions
    WHERE tenant_id = ${ctx.tenantId}::uuid AND student_id = ${studentId}::uuid
      AND status = 'PAIRING' AND expires_at > now()
      AND ((${tokenHash} <> '' AND pairing_token_hash = ${tokenHash}) OR (${codeHash} <> '' AND pairing_code_hash = ${codeHash}))
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('3D Eyes pairing code is invalid or expired.', 401);
  const deviceReference = String(input.deviceReference ?? '').trim().slice(0, 300) || null;
  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.secondary_camera_sessions
    SET status = 'PAIRED', paired_user_id = ${ctx.userId}::uuid, device_reference = ${deviceReference},
        paired_at = now(), last_heartbeat_at = now(), updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${rows[0].id}::uuid AND status = 'PAIRING'
  `;
  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.device_prechecks
    SET second_camera_ready = true, updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_id = ${rows[0].attempt_id}::uuid
  `;
  await writeAudit(ctx.tenantId, ctx.userId, '3D_EYES_PAIRED', 'EXAM_ATTEMPT', rows[0].attempt_id);
  const attempt = await requireOwnAttempt(ctx, rows[0].attempt_id);
  await refreshAttemptGate(ctx, attempt.exam_config_id, studentId);
  return { sessionId: rows[0].id, attemptId: rows[0].attempt_id };
}

export async function heartbeat3DEyes(sessionId: string) {
  const ctx = await requireActiveUserContext();
  const studentId = await requireStudentContext(ctx);
  const updated = await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.secondary_camera_sessions
    SET status = CASE WHEN status IN ('PAIRED','DEGRADED','DISCONNECTED') THEN 'CONNECTED' ELSE status END,
        connected_at = COALESCE(connected_at, now()), last_heartbeat_at = now(), updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${sessionId}::uuid
      AND student_id = ${studentId}::uuid AND paired_user_id = ${ctx.userId}::uuid
      AND status NOT IN ('CLOSED','EXPIRED')
  `;
  if (!updated) throw new SecureExaminationError('3D Eyes session was not found.', 404);
  return { success: true, serverNow: new Date().toISOString() };
}

export async function send3DEyesSignal(input: { sessionId: string; sender: 'LAPTOP' | 'MOBILE'; signalType: 'OFFER' | 'ANSWER' | 'ICE' | 'CONTROL'; payload: unknown }) {
  const ctx = await requireActiveUserContext();
  const studentId = await requireStudentContext(ctx);
  const sessions = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_exam_proctoring.secondary_camera_sessions
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${input.sessionId}::uuid AND student_id = ${studentId}::uuid
      AND status IN ('PAIRED','CONNECTED','DEGRADED','DISCONNECTED')
    LIMIT 1
  `;
  if (!sessions[0]) throw new SecureExaminationError('3D Eyes session is not active.', 404);
  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.secondary_camera_signals
      (tenant_id, secondary_camera_session_id, sender, signal_type, payload)
    VALUES (${ctx.tenantId}::uuid, ${input.sessionId}::uuid, ${input.sender}, ${input.signalType}, ${JSON.stringify(input.payload ?? {})}::jsonb)
  `;
  return { success: true };
}

export async function poll3DEyesSignals(sessionId: string, afterId = 0) {
  const ctx = await requireActiveUserContext();
  const studentId = await requireStudentContext(ctx);
  const session = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_exam_proctoring.secondary_camera_sessions
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${sessionId}::uuid AND student_id = ${studentId}::uuid
    LIMIT 1
  `;
  if (!session[0]) throw new SecureExaminationError('3D Eyes session was not found.', 404);
  const rows = await prisma.$queryRaw<Array<{ id: bigint; sender: string; signal_type: string; payload: unknown; created_at: Date }>>`
    SELECT id, sender, signal_type, payload, created_at
    FROM campusos_exam_proctoring.secondary_camera_signals
    WHERE tenant_id = ${ctx.tenantId}::uuid AND secondary_camera_session_id = ${sessionId}::uuid
      AND id > ${Math.max(0, Math.floor(afterId))}
    ORDER BY id ASC
    LIMIT 100
  `;
  return rows.map((row) => ({ id: Number(row.id), sender: row.sender, signalType: row.signal_type, payload: row.payload, createdAt: row.created_at.toISOString() }));
}

async function loadAttemptGate(tenantId: string, configId: string, studentId: string) {
  const rows = await prisma.$queryRaw<AttemptGateRow[]>`
    SELECT a.id AS attempt_id, a.student_id, a.status AS attempt_status, a.admitted_at,
           ec.id AS config_id, ec.delivery_mode, sp.id AS security_profile_id,
           COALESCE(sp.id, '00000000-0000-0000-0000-000000000000'::uuid) AS id,
           COALESCE(sp.name, 'No proctoring profile') AS name,
           sp.description, COALESCE(sp.status, 'ACTIVE') AS status,
           COALESCE(sp.identity_required, false) AS identity_required,
           COALESCE(sp.selfie_required, false) AS selfie_required,
           COALESCE(sp.liveness_required, false) AS liveness_required,
           COALESCE(sp.primary_camera_required, false) AS primary_camera_required,
           COALESCE(sp.microphone_required, false) AS microphone_required,
           COALESCE(sp.screen_share_required, false) AS screen_share_required,
           COALESCE(sp.fullscreen_required, false) AS fullscreen_required,
           COALESCE(sp.second_camera_required, false) AS second_camera_required,
           COALESCE(sp.human_admission_required, false) AS human_admission_required,
           COALESCE(sp.ai_event_analysis_enabled, false) AS ai_event_analysis_enabled,
           COALESCE(sp.clipboard_restricted, false) AS clipboard_restricted,
           COALESCE(sp.permitted_materials, '{}'::jsonb) AS permitted_materials,
           tv.id AS terms_id,
           (ta.id IS NOT NULL) AS terms_accepted,
           iv.state AS identity_state,
           dp.browser_supported, dp.camera_ready, dp.microphone_ready, dp.screen_share_ready,
           dp.fullscreen_ready, dp.second_camera_ready, dp.network_quality, dp.state AS precheck_state,
           sc.status AS second_camera_status
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.security_profiles sp ON sp.id = ec.security_profile_id
    LEFT JOIN LATERAL (
      SELECT t.id
      FROM campusos_exam_proctoring.terms_versions t
      WHERE t.tenant_id = a.tenant_id AND t.effective_at <= now()
        AND (t.retired_at IS NULL OR t.retired_at > now())
      ORDER BY t.effective_at DESC, t.created_at DESC
      LIMIT 1
    ) tv ON true
    LEFT JOIN campusos_exam_proctoring.terms_acceptances ta
      ON ta.tenant_id = a.tenant_id AND ta.exam_config_id = ec.id AND ta.student_id = a.student_id AND ta.terms_version_id = tv.id
    LEFT JOIN LATERAL (
      SELECT v.state
      FROM campusos_exam_proctoring.identity_verifications v
      WHERE v.tenant_id = a.tenant_id AND v.attempt_id = a.id
      ORDER BY v.created_at DESC
      LIMIT 1
    ) iv ON true
    LEFT JOIN campusos_exam_proctoring.device_prechecks dp ON dp.tenant_id = a.tenant_id AND dp.attempt_id = a.id
    LEFT JOIN campusos_exam_proctoring.secondary_camera_sessions sc ON sc.tenant_id = a.tenant_id AND sc.attempt_id = a.id
    WHERE a.tenant_id = ${tenantId}::uuid AND ec.id = ${configId}::uuid AND a.student_id = ${studentId}::uuid
    ORDER BY a.attempt_no DESC
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function refreshAttemptGate(ctx: ActiveUserContext, configId: string, studentId: string) {
  const [gate, settings] = await Promise.all([loadAttemptGate(ctx.tenantId, configId, studentId), readSettings(ctx.tenantId)]);
  if (!gate || FINAL_ATTEMPT_STATES.has(gate.attempt_status) || ['IN_PROGRESS', 'RECONNECTING'].includes(gate.attempt_status)) return;
  const profile = gate.security_profile_id ? mapSecurityProfile(gate) : null;
  const precheck = mapPrecheck(gate);
  const readiness = evaluateExamReadiness({
    online: isOnlineExamMode(gate.delivery_mode),
    termsRequired: settings.requireTermsAcceptance && Boolean(gate.terms_id),
    termsAccepted: gate.terms_accepted,
    profile,
    identityState: gate.identity_state,
    precheck,
    secondCameraStatus: gate.second_camera_status,
    humanAdmitted: Boolean(gate.admitted_at),
  });
  const nonHumanBlocking = readiness.items.some((item) => item.key !== 'HUMAN_APPROVAL' && item.blocking);
  const humanOnlyBlocked = !nonHumanBlocking && readiness.items.some((item) => item.key === 'HUMAN_APPROVAL' && item.blocking);
  const nextStatus = readiness.ready ? 'READY' : humanOnlyBlocked ? 'WAITING_ROOM' : 'VERIFICATION_PENDING';
  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.exam_attempts
    SET status = ${nextStatus}, updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${gate.attempt_id}::uuid
      AND status NOT IN ('IN_PROGRESS','RECONNECTING','SUBMITTED','AUTO_SUBMITTED','COMPLETED','CANCELLED')
  `;
}

export async function admitStudentAttempt(attemptId: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireAttemptForProctor(ctx, attemptId);
  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.exam_attempts
    SET admitted_by = ${ctx.userId}::uuid, admitted_at = now(), status = CASE WHEN status = 'WAITING_ROOM' THEN 'APPROVED' ELSE status END,
        updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_ATTEMPT_ADMITTED', 'EXAM_ATTEMPT', attemptId);
  await refreshAttemptGate(ctx, attempt.config_id, attempt.student_id);
  return { success: true };
}

export async function assignExamProctor(configId: string, proctorUserId: string) {
  const ctx = await requireActiveUserContext();
  requireManageRole(ctx);
  const user = await prisma.user.findFirst({ where: { id: proctorUserId, tenantId: ctx.tenantId, isActive: true }, select: { id: true, role: true } });
  if (!user || !canProctorSecureExam(user.role)) throw new SecureExaminationError('Selected user cannot be assigned as an exam proctor.', 400);
  const config = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_exam_proctoring.exam_configs
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${configId}::uuid LIMIT 1
  `;
  if (!config[0]) throw new SecureExaminationError('Exam configuration was not found.', 404);
  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.proctor_assignments
      (tenant_id, exam_config_id, proctor_user_id, status, assigned_by)
    VALUES (${ctx.tenantId}::uuid, ${configId}::uuid, ${proctorUserId}::uuid, 'ACTIVE', ${ctx.userId}::uuid)
    ON CONFLICT (tenant_id, exam_config_id, proctor_user_id) DO UPDATE SET
      status = 'ACTIVE', assigned_by = EXCLUDED.assigned_by, assigned_at = now()
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_PROCTOR_ASSIGNED', 'EXAM_CONFIG', configId, { proctorUserId });
  return { success: true };
}

export async function recordClientProctoringEvent(attemptId: string, input: {
  source?: string;
  eventType?: string;
  severity?: ProctoringSeverity;
  metadata?: Record<string, unknown>;
}) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  if (!['IN_PROGRESS', 'RECONNECTING'].includes(attempt.status)) throw new SecureExaminationError('Proctoring events can only be recorded during an active attempt.', 409);
  const source = String(input.source ?? 'SYSTEM').toUpperCase();
  if (!CLIENT_EVENT_SOURCES.has(source)) throw new SecureExaminationError('Client cannot submit AI or proctor-authored events.', 403);
  const eventType = String(input.eventType ?? '').trim().slice(0, 120);
  if (!eventType) throw new SecureExaminationError('Event type is required.');
  const severity = PROCTOR_SEVERITIES.has(input.severity ?? 'INFO') ? input.severity ?? 'INFO' : 'INFO';
  const automatedIntegrity = integrityStateFromAutomatedEvent(severity);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.proctoring_events
      (tenant_id, attempt_id, source, event_type, severity, metadata)
    VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${source}, ${eventType}, ${severity}, ${JSON.stringify(asRecord(input.metadata))}::jsonb)
    RETURNING id
  `;
  if (automatedIntegrity === 'REVIEW_REQUIRED') {
    await prisma.$executeRaw`
      UPDATE campusos_exam_proctoring.exam_attempts
      SET integrity_state = CASE WHEN integrity_state = 'NO_ISSUE' THEN 'REVIEW_REQUIRED' ELSE integrity_state END,
          updated_at = now()
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid
    `;
  }
  return { id: rows[0]?.id, reviewRequired: automatedIntegrity === 'REVIEW_REQUIRED' };
}

export async function createProctorReport(attemptId: string, input: {
  category?: 'INFORMATIONAL' | 'WARNING' | 'TECHNICAL' | 'INTEGRITY_CONCERN' | 'CRITICAL_INCIDENT';
  severity?: ProctoringSeverity;
  description?: string;
  evidenceEventId?: string | null;
}) {
  const ctx = await requireActiveUserContext();
  await requireAttemptForProctor(ctx, attemptId);
  const category = input.category ?? 'INFORMATIONAL';
  const allowedCategories = new Set(['INFORMATIONAL', 'WARNING', 'TECHNICAL', 'INTEGRITY_CONCERN', 'CRITICAL_INCIDENT']);
  if (!allowedCategories.has(category)) throw new SecureExaminationError('Invalid proctor report category.');
  const severity = PROCTOR_SEVERITIES.has(input.severity ?? 'INFO') ? input.severity ?? 'INFO' : 'INFO';
  const description = String(input.description ?? '').trim().slice(0, 4000);
  if (!description) throw new SecureExaminationError('Proctor report description is required.');
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.proctor_reports
      (tenant_id, attempt_id, proctor_user_id, category, severity, description, evidence_event_id)
    VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${ctx.userId}::uuid, ${category}, ${severity}, ${description}, ${input.evidenceEventId ?? null}::uuid)
    RETURNING id
  `;
  if (category === 'INTEGRITY_CONCERN' || category === 'CRITICAL_INCIDENT') {
    await prisma.$executeRaw`
      UPDATE campusos_exam_proctoring.exam_attempts
      SET integrity_state = CASE WHEN integrity_state IN ('NO_ISSUE','REVIEW_REQUIRED') THEN 'POLICY_CONCERN' ELSE integrity_state END,
          updated_at = now()
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid
    `;
  }
  await writeAudit(ctx.tenantId, ctx.userId, 'PROCTOR_REPORT_CREATED', 'EXAM_ATTEMPT', attemptId, { category, severity });
  return { id: rows[0]?.id };
}

export async function startExamAttempt(attemptId: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  const gate = await loadAttemptGate(ctx.tenantId, attempt.exam_config_id, attempt.student_id);
  if (!gate) throw new SecureExaminationError('Exam readiness could not be resolved.', 409);
  await refreshAttemptGate(ctx, attempt.exam_config_id, attempt.student_id);
  const refreshed = await loadAttemptGate(ctx.tenantId, attempt.exam_config_id, attempt.student_id);
  if (!refreshed || !['READY', 'APPROVED'].includes(refreshed.attempt_status)) {
    throw new SecureExaminationError('Complete all required verification and examiner approval steps before entering the exam.', 409);
  }
  const configs = await prisma.$queryRaw<Array<{ starts_at: Date | null; ends_at: Date | null; duration_minutes: number | null }>>`
    SELECT starts_at, ends_at, duration_minutes
    FROM campusos_exam_proctoring.exam_configs
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attempt.exam_config_id}::uuid LIMIT 1
  `;
  const config = configs[0];
  if (!config) throw new SecureExaminationError('Exam configuration was not found.', 404);
  const now = new Date();
  if (config.starts_at && now < config.starts_at) throw new SecureExaminationError('The examination has not started yet.', 409);
  if (config.ends_at && now >= config.ends_at) throw new SecureExaminationError('The examination window has closed.', 410);
  let deadline = calculateAttemptDeadline(now, config.duration_minutes);
  if (config.ends_at && (!deadline || deadline > config.ends_at)) deadline = config.ends_at;

  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.exam_attempts
    SET status = 'IN_PROGRESS', started_at = COALESCE(started_at, ${now}), deadline_at = COALESCE(deadline_at, ${deadline}),
        updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid
      AND status IN ('READY','APPROVED')
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_ATTEMPT_STARTED', 'EXAM_ATTEMPT', attemptId, { deadline: asIso(deadline) });
  return { attemptId, startedAt: now.toISOString(), deadlineAt: asIso(deadline) };
}

export async function getExamAttemptSession(attemptId: string): Promise<ExamAttemptSession> {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  const rows = await prisma.$queryRaw<Array<{
    attempt_id: string;
    exam_name: string;
    exam_type: string;
    delivery_mode: ExamDeliveryMode;
    attempt_status: string;
    started_at: Date | null;
    deadline_at: Date | null;
    submission_reference: string | null;
    last_saved_at: Date | null;
  }>>`
    SELECT a.id AS attempt_id, e.name AS exam_name, e.type AS exam_type, ec.delivery_mode,
           a.status AS attempt_status, a.started_at, a.deadline_at, a.submission_reference, a.last_saved_at
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
    JOIN public.exams e ON e.id = ec.exam_id AND e.tenant_id = ec.tenant_id
    WHERE a.tenant_id = ${ctx.tenantId}::uuid AND a.id = ${attemptId}::uuid AND a.student_id = ${attempt.student_id}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('Examination attempt was not found.', 404);
  const questions = await prisma.$queryRaw<Array<{
    id: string;
    question_id: string;
    section_title: string;
    display_order: number;
    marks: unknown;
    question_type: string;
    prompt_snapshot: string;
    options_snapshot: unknown;
    answer: unknown;
    saved_at: Date | null;
  }>>`
    SELECT aq.id, aq.question_id, aq.section_title, aq.display_order, aq.marks,
           qb.question_type, aq.prompt_snapshot, aq.options_snapshot,
           latest.answer, latest.saved_at
    FROM campusos_exam_proctoring.attempt_questions aq
    JOIN campusos_exam_proctoring.question_bank qb ON qb.id = aq.question_id AND qb.tenant_id = aq.tenant_id
    LEFT JOIN LATERAL (
      SELECT ar.answer, ar.saved_at
      FROM campusos_exam_proctoring.answer_revisions ar
      WHERE ar.tenant_id = aq.tenant_id AND ar.attempt_question_id = aq.id
      ORDER BY ar.revision_no DESC
      LIMIT 1
    ) latest ON true
    WHERE aq.tenant_id = ${ctx.tenantId}::uuid AND aq.attempt_id = ${attemptId}::uuid
    ORDER BY aq.display_order ASC
    LIMIT 500
  `;
  return {
    attemptId: rows[0].attempt_id,
    examName: rows[0].exam_name,
    examType: rows[0].exam_type,
    deliveryMode: rows[0].delivery_mode,
    status: rows[0].attempt_status as never,
    startedAt: asIso(rows[0].started_at),
    deadlineAt: asIso(rows[0].deadline_at),
    serverNow: new Date().toISOString(),
    questions: questions.map((question) => ({
      id: question.id,
      questionId: question.question_id,
      sectionTitle: question.section_title,
      displayOrder: question.display_order,
      marks: Number(question.marks),
      questionType: question.question_type,
      prompt: question.prompt_snapshot,
      options: question.options_snapshot,
      answer: question.answer ?? null,
      savedAt: asIso(question.saved_at),
    })),
    savedAt: asIso(rows[0].last_saved_at),
    submissionReference: rows[0].submission_reference,
  };
}

export async function saveExamAnswer(attemptId: string, input: { attemptQuestionId?: string; answer?: unknown; idempotencyKey?: string }) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  if (!['IN_PROGRESS', 'RECONNECTING'].includes(attempt.status)) throw new SecureExaminationError('Answers can only be saved during an active examination.', 409);
  if (attempt.deadline_at && new Date() > attempt.deadline_at) throw new SecureExaminationError('The examination deadline has passed.', 409);
  const attemptQuestionId = String(input.attemptQuestionId ?? '');
  if (!attemptQuestionId) throw new SecureExaminationError('Attempt question is required.');
  const idempotencyKey = String(input.idempotencyKey ?? '').trim().slice(0, 200) || null;

  return prisma.$transaction(async (tx) => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${ctx.tenantId}:${attemptQuestionId}`}))`;
    const question = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_exam_proctoring.attempt_questions
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptQuestionId}::uuid AND attempt_id = ${attemptId}::uuid
      LIMIT 1
    `;
    if (!question[0]) throw new SecureExaminationError('Question does not belong to this examination attempt.', 404);
    if (idempotencyKey) {
      const prior = await tx.$queryRaw<Array<{ id: string; saved_at: Date }>>`
        SELECT id, saved_at FROM campusos_exam_proctoring.answer_revisions
        WHERE tenant_id = ${ctx.tenantId}::uuid AND idempotency_key = ${idempotencyKey}
        LIMIT 1
      `;
      if (prior[0]) return { savedAt: prior[0].saved_at.toISOString(), reused: true };
    }
    const revisions = await tx.$queryRaw<Array<{ next_revision: number }>>`
      SELECT COALESCE(MAX(revision_no), 0)::int + 1 AS next_revision
      FROM campusos_exam_proctoring.answer_revisions
      WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_question_id = ${attemptQuestionId}::uuid
    `;
    const saved = await tx.$queryRaw<Array<{ saved_at: Date }>>`
      INSERT INTO campusos_exam_proctoring.answer_revisions
        (tenant_id, attempt_question_id, revision_no, answer, idempotency_key)
      VALUES (${ctx.tenantId}::uuid, ${attemptQuestionId}::uuid, ${revisions[0]?.next_revision ?? 1},
              ${JSON.stringify(input.answer ?? null)}::jsonb, ${idempotencyKey})
      RETURNING saved_at
    `;
    await tx.$executeRaw`
      UPDATE campusos_exam_proctoring.exam_attempts
      SET last_saved_at = now(), updated_at = now()
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid
    `;
    return { savedAt: saved[0]?.saved_at.toISOString() ?? new Date().toISOString(), reused: false };
  });
}

export async function submitExamAttempt(attemptId: string, auto = false) {
  const ctx = await requireActiveUserContext();
  const attempt = await requireOwnAttempt(ctx, attemptId);
  if (['SUBMITTED', 'AUTO_SUBMITTED', 'COMPLETED'].includes(attempt.status)) {
    const rows = await prisma.$queryRaw<Array<{ submission_reference: string | null; submitted_at: Date | null }>>`
      SELECT submission_reference, submitted_at FROM campusos_exam_proctoring.exam_attempts
      WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid LIMIT 1
    `;
    return { submissionReference: rows[0]?.submission_reference, submittedAt: asIso(rows[0]?.submitted_at), reused: true };
  }
  if (!['IN_PROGRESS', 'RECONNECTING'].includes(attempt.status)) throw new SecureExaminationError('This examination attempt is not active.', 409);
  const submissionReference = `NAV-EXAM-${attemptId}`;
  const status = auto ? 'AUTO_SUBMITTED' : 'SUBMITTED';
  const rows = await prisma.$queryRaw<Array<{ submitted_at: Date }>>`
    UPDATE campusos_exam_proctoring.exam_attempts
    SET status = ${status}, submitted_at = now(), submission_reference = COALESCE(submission_reference, ${submissionReference}),
        updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${attemptId}::uuid
      AND status IN ('IN_PROGRESS','RECONNECTING')
    RETURNING submitted_at
  `;
  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.secondary_camera_sessions
    SET status = 'CLOSED', disconnected_at = COALESCE(disconnected_at, now()), updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_id = ${attemptId}::uuid
      AND status NOT IN ('CLOSED','EXPIRED')
  `;
  await writeAudit(ctx.tenantId, ctx.userId, auto ? 'EXAM_ATTEMPT_AUTO_SUBMITTED' : 'EXAM_ATTEMPT_SUBMITTED', 'EXAM_ATTEMPT', attemptId);
  return { submissionReference, submittedAt: rows[0]?.submitted_at.toISOString() ?? new Date().toISOString(), reused: false };
}

async function assertQuestionAuthorAccess(ctx: ActiveUserContext, courseId: string | null) {
  if (!canAuthorExamQuestions(ctx.activeRole)) throw new SecureExaminationError('This role cannot author examination questions.', 403);
  if (canManageSecureExams(ctx.activeRole) || ctx.activeRole === 'HOD' || ctx.activeRole === 'DEAN') return;
  if (ctx.activeRole === 'FACULTY') {
    if (!ctx.staffProfileId || !courseId) throw new SecureExaminationError('Faculty questions must be linked to an assigned course.', 403);
    const count = await prisma.courseOffering.count({
      where: { tenantId: ctx.tenantId, facultyId: ctx.staffProfileId, courseId },
    });
    if (!count) throw new SecureExaminationError('Faculty can author questions only for assigned courses.', 403);
  }
}

export async function createExamQuestion(input: {
  courseId?: string | null;
  questionType?: string;
  prompt?: string;
  options?: unknown;
  answerKey?: unknown;
  maxMarks?: number;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  tags?: string[];
}) {
  const ctx = await requireActiveUserContext();
  const courseId = input.courseId ? String(input.courseId) : null;
  await assertQuestionAuthorAccess(ctx, courseId);
  if (courseId) {
    const course = await prisma.course.findFirst({ where: { id: courseId, tenantId: ctx.tenantId }, select: { id: true } });
    if (!course) throw new SecureExaminationError('Course was not found.', 404);
  }
  const allowedTypes = new Set(['SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','SHORT_TEXT','LONG_TEXT','NUMERIC','FILE_UPLOAD','CODE','MATCHING','ORDERING','CASE_STUDY']);
  const questionType = String(input.questionType ?? 'SINGLE_CHOICE');
  if (!allowedTypes.has(questionType)) throw new SecureExaminationError('Unsupported question type.');
  const prompt = String(input.prompt ?? '').trim();
  if (!prompt || prompt.length > 20_000) throw new SecureExaminationError('Question prompt is required and must be under 20,000 characters.');
  const maxMarks = Number(input.maxMarks ?? 1);
  if (!Number.isFinite(maxMarks) || maxMarks <= 0 || maxMarks > 10_000) throw new SecureExaminationError('Question marks must be positive.');
  const difficulty = ['EASY','MEDIUM','HARD'].includes(input.difficulty ?? 'MEDIUM') ? input.difficulty ?? 'MEDIUM' : 'MEDIUM';
  const tags = Array.isArray(input.tags) ? input.tags.map((tag) => String(tag).slice(0, 50)).slice(0, 20) : [];
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.question_bank
      (tenant_id, course_id, question_type, prompt, options, answer_key, max_marks, difficulty, status, tags, created_by)
    VALUES (${ctx.tenantId}::uuid, ${courseId}::uuid, ${questionType}, ${prompt}, ${JSON.stringify(input.options ?? null)}::jsonb,
            ${JSON.stringify(input.answerKey ?? null)}::jsonb, ${maxMarks}, ${difficulty}, 'DRAFT', ${tags}, ${ctx.userId}::uuid)
    RETURNING id
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_QUESTION_CREATED', 'QUESTION', rows[0]?.id ?? null, { questionType, courseId });
  return { id: rows[0]?.id };
}

export async function attachExamQuestion(input: { configId?: string; questionId?: string; sectionTitle?: string; position?: number; marks?: number }) {
  const ctx = await requireActiveUserContext();
  if (!canAuthorExamQuestions(ctx.activeRole)) throw new SecureExaminationError('This role cannot manage examination questions.', 403);
  const configId = String(input.configId ?? '');
  const questionId = String(input.questionId ?? '');
  if (!configId || !questionId) throw new SecureExaminationError('Exam configuration and question are required.');
  const access = await prisma.$queryRaw<Array<{ faculty_id: string | null }>>`
    SELECT co.faculty_id
    FROM campusos_exam_proctoring.exam_configs ec
    LEFT JOIN public.course_offerings co ON co.id = ec.course_offering_id AND co.tenant_id = ec.tenant_id
    WHERE ec.tenant_id = ${ctx.tenantId}::uuid AND ec.id = ${configId}::uuid
    LIMIT 1
  `;
  if (!access[0]) throw new SecureExaminationError('Exam configuration was not found.', 404);
  if (ctx.activeRole === 'FACULTY' && access[0].faculty_id !== ctx.staffProfileId) {
    throw new SecureExaminationError('Faculty can attach questions only to assigned course examinations.', 403);
  }
  const position = Math.max(0, Math.floor(Number(input.position ?? 0)));
  const marks = Number(input.marks ?? 1);
  if (!Number.isFinite(marks) || marks <= 0) throw new SecureExaminationError('Question marks must be positive.');
  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.exam_questions
      (tenant_id, exam_config_id, question_id, section_title, position, marks)
    VALUES (${ctx.tenantId}::uuid, ${configId}::uuid, ${questionId}::uuid, ${String(input.sectionTitle ?? 'Main').slice(0, 120)}, ${position}, ${marks})
    ON CONFLICT (tenant_id, exam_config_id, question_id) DO UPDATE SET
      section_title = EXCLUDED.section_title, position = EXCLUDED.position, marks = EXCLUDED.marks
  `;
  await writeAudit(ctx.tenantId, ctx.userId, 'EXAM_QUESTION_ATTACHED', 'EXAM_CONFIG', configId, { questionId, position });
  return { success: true };
}

export async function listAssignableProctors() {
  const ctx = await requireActiveUserContext();
  requireManageRole(ctx);
  const allowedRoles: RoleType[] = ['FACULTY', 'HOD', 'DEAN', 'EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN'];
  return prisma.user.findMany({
    where: { tenantId: ctx.tenantId, isActive: true, role: { in: allowedRoles } },
    select: { id: true, name: true, email: true, role: true },
    orderBy: [{ role: 'asc' }, { name: 'asc' }],
    take: 300,
  });
}
