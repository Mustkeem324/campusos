import 'server-only';

import { requireActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { canManageSecureExams, canProctorSecureExam } from './secure-examination-policy';
import { getSecureExamWorkspace, SecureExaminationError } from './secure-examination';
import type {
  ExamConfigSummary,
  ExamDeliveryMode,
  ExamSecurityProfile,
  ProctorLiveAttempt,
  SecureExamWorkspace,
  VerificationState,
  PrecheckState,
} from './secure-examination-types';

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

type ConfigRow = {
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

type LiveRow = {
  attempt_id: string;
  config_id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  exam_name: string;
  exam_type: string;
  attempt_status: ProctorLiveAttempt['status'];
  delivery_mode: ExamDeliveryMode;
  identity_state: VerificationState | null;
  precheck_state: PrecheckState | null;
  second_camera_status: string | null;
  last_heartbeat_at: Date | null;
  unreviewed_high_events: bigint | number;
  unreviewed_medium_events: bigint | number;
};

function asIso(value: Date | null) {
  return value ? value.toISOString() : null;
}

function asCount(value: bigint | number) {
  return typeof value === 'bigint' ? Number(value) : value;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function mapProfile(row: SecurityProfileRow): ExamSecurityProfile {
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

async function storeReady() {
  try {
    const rows = await prisma.$queryRaw<Array<{ ready: boolean }>>`
      SELECT to_regclass('campusos_exam_proctoring.exam_configs') IS NOT NULL AS ready
    `;
    return Boolean(rows[0]?.ready);
  } catch {
    return false;
  }
}

async function readProfiles(tenantId: string) {
  const rows = await prisma.$queryRaw<SecurityProfileRow[]>`
    SELECT id, name, description, status, identity_required, selfie_required,
           liveness_required, primary_camera_required, microphone_required,
           screen_share_required, fullscreen_required, second_camera_required,
           human_admission_required, ai_event_analysis_enabled,
           clipboard_restricted, permitted_materials
    FROM campusos_exam_proctoring.security_profiles
    WHERE tenant_id = ${tenantId}::uuid
    ORDER BY (status = 'ACTIVE') DESC, name ASC
    LIMIT 100
  `;
  return rows.map(mapProfile);
}

async function readConfigs(tenantId: string): Promise<ExamConfigSummary[]> {
  const rows = await prisma.$queryRaw<ConfigRow[]>`
    SELECT ec.id AS config_id, ec.exam_id, e.name AS exam_name, e.type AS exam_type,
           ec.delivery_mode, ec.status AS config_status, ec.starts_at, ec.ends_at,
           ec.course_offering_id, c.code AS course_code, c.title AS course_title,
           sp.id AS security_profile_id, sp.name AS security_profile_name,
           COUNT(a.id) AS attempt_count,
           COUNT(a.id) FILTER (
             WHERE a.status IN ('VERIFICATION_PENDING','WAITING_ROOM','APPROVED','READY','IN_PROGRESS','RECONNECTING')
           ) AS active_attempt_count,
           COUNT(a.id) FILTER (
             WHERE a.integrity_state IN ('REVIEW_REQUIRED','POLICY_CONCERN','FORMAL_CASE_REQUIRED')
           ) AS review_required_count
    FROM campusos_exam_proctoring.exam_configs ec
    JOIN public.exams e ON e.id = ec.exam_id AND e.tenant_id = ec.tenant_id
    LEFT JOIN public.course_offerings co ON co.id = ec.course_offering_id AND co.tenant_id = ec.tenant_id
    LEFT JOIN public.courses c ON c.id = co.course_id AND c.tenant_id = ec.tenant_id
    LEFT JOIN campusos_exam_proctoring.security_profiles sp
      ON sp.id = ec.security_profile_id AND sp.tenant_id = ec.tenant_id
    LEFT JOIN campusos_exam_proctoring.exam_attempts a
      ON a.exam_config_id = ec.id AND a.tenant_id = ec.tenant_id
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
    attemptCount: asCount(row.attempt_count),
    activeAttemptCount: asCount(row.active_attempt_count),
    reviewRequiredCount: asCount(row.review_required_count),
  }));
}

async function readLiveAttempts(input: {
  tenantId: string;
  userId: string;
  canSeeAll: boolean;
}): Promise<ProctorLiveAttempt[]> {
  const rows = await prisma.$queryRaw<LiveRow[]>`
    SELECT a.id AS attempt_id, ec.id AS config_id, s.id AS student_id,
           u.name AS student_name, s."rollNumber" AS roll_number,
           e.name AS exam_name, e.type AS exam_type, a.status AS attempt_status,
           ec.delivery_mode, iv.state AS identity_state, dp.state AS precheck_state,
           sc.status AS second_camera_status, sc.last_heartbeat_at,
           COUNT(pe.id) FILTER (WHERE pe.severity = 'HIGH' AND pe.reviewed_at IS NULL) AS unreviewed_high_events,
           COUNT(pe.id) FILTER (WHERE pe.severity = 'MEDIUM' AND pe.reviewed_at IS NULL) AS unreviewed_medium_events
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec
      ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
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
    LEFT JOIN campusos_exam_proctoring.device_prechecks dp
      ON dp.attempt_id = a.id AND dp.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.secondary_camera_sessions sc
      ON sc.attempt_id = a.id AND sc.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.proctoring_events pe
      ON pe.attempt_id = a.id AND pe.tenant_id = a.tenant_id
    WHERE a.tenant_id = ${input.tenantId}::uuid
      AND a.status IN (
        'VERIFICATION_PENDING','WAITING_ROOM','APPROVED','READY','IN_PROGRESS',
        'RECONNECTING','TECHNICAL_REVIEW','PROCTORING_REVIEW'
      )
      AND (
        ${input.canSeeAll}::boolean
        OR EXISTS (
          SELECT 1
          FROM campusos_exam_proctoring.proctor_assignments pa
          WHERE pa.tenant_id = a.tenant_id
            AND pa.exam_config_id = ec.id
            AND pa.proctor_user_id = ${input.userId}::uuid
            AND pa.status = 'ACTIVE'
        )
      )
    GROUP BY a.id, ec.id, s.id, u.name, e.name, e.type, ec.delivery_mode,
             iv.state, dp.state, sc.status, sc.last_heartbeat_at
    ORDER BY
      COUNT(pe.id) FILTER (WHERE pe.severity = 'HIGH' AND pe.reviewed_at IS NULL) DESC,
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
    status: row.attempt_status,
    deliveryMode: row.delivery_mode,
    identityState: row.identity_state,
    precheckState: row.precheck_state,
    secondCameraStatus: row.second_camera_status,
    lastHeartbeatAt: asIso(row.last_heartbeat_at),
    unreviewedHighEvents: asCount(row.unreviewed_high_events),
    unreviewedMediumEvents: asCount(row.unreviewed_medium_events),
  }));
}

export async function getSecureExamWorkspaceForRequest(): Promise<SecureExamWorkspace> {
  const context = await requireActiveUserContext();

  if (context.activeRole === 'STUDENT') {
    return getSecureExamWorkspace();
  }

  if (!canManageSecureExams(context.activeRole) && !canProctorSecureExam(context.activeRole)) {
    throw new SecureExaminationError('This role does not have secure examination access.', 403);
  }

  if (!(await storeReady())) {
    return {
      kind: 'ADMIN',
      role: context.activeRole,
      storeReady: false,
      exams: [],
      securityProfiles: [],
      liveAttempts: [],
      availableExams: [],
      courseOfferings: [],
    };
  }

  const manager = canManageSecureExams(context.activeRole);
  const [securityProfiles, exams, liveAttempts, availableExams, courseOfferings] = await Promise.all([
    readProfiles(context.tenantId),
    manager ? readConfigs(context.tenantId) : Promise.resolve([]),
    readLiveAttempts({ tenantId: context.tenantId, userId: context.userId, canSeeAll: manager }),
    manager
      ? prisma.$queryRaw<Array<{ id: string; name: string; type: string; term_name: string }>>`
          SELECT e.id, e.name, e.type, t.name AS term_name
          FROM public.exams e
          JOIN public.terms t ON t.id = e.term_id AND t.tenant_id = e.tenant_id
          WHERE e.tenant_id = ${context.tenantId}::uuid
          ORDER BY t."startDate" DESC, e.name ASC
          LIMIT 200
        `
      : Promise.resolve([]),
    manager
      ? prisma.$queryRaw<Array<{
          id: string;
          course_code: string;
          course_title: string;
          section_name: string;
        }>>`
          SELECT co.id, c.code AS course_code, c.title AS course_title, sec.name AS section_name
          FROM public.course_offerings co
          JOIN public.courses c ON c.id = co.course_id AND c.tenant_id = co.tenant_id
          JOIN public.sections sec ON sec.id = co.section_id AND sec.tenant_id = co.tenant_id
          WHERE co.tenant_id = ${context.tenantId}::uuid
          ORDER BY c.code ASC, sec.name ASC
          LIMIT 500
        `
      : Promise.resolve([]),
  ]);

  return {
    kind: 'ADMIN',
    role: context.activeRole,
    storeReady: true,
    exams,
    securityProfiles,
    liveAttempts,
    availableExams: availableExams.map((row) => ({
      id: row.id,
      name: row.name,
      type: row.type,
      termName: row.term_name,
    })),
    courseOfferings: courseOfferings.map((row) => ({
      id: row.id,
      courseCode: row.course_code,
      courseTitle: row.course_title,
      sectionName: row.section_name,
    })),
  };
}
