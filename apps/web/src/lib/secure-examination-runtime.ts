import 'server-only';

import crypto from 'node:crypto';

import { Prisma } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { canManageSecureExams, canProctorSecureExam } from './secure-examination-policy';
import { SecureExaminationError } from './secure-examination';

export type ExamMediaStreamKind = 'PRIMARY' | 'SECONDARY' | 'SCREEN';
export type ExamMediaPermission = 'PUBLISH' | 'READ';

type RuntimeAttemptRow = {
  attempt_id: string;
  student_id: string;
  exam_config_id: string;
  attempt_status: string;
  delivery_mode: string;
  primary_stream_required: boolean;
  secondary_stream_required: boolean;
  screen_stream_required: boolean;
  ai_vision_enabled: boolean;
  secure_client_required: boolean;
  secure_client_policy_version: string;
  sample_interval_seconds: number;
};

type MediaTokenPayload = {
  v: 1;
  jti: string;
  tenantId: string;
  attemptId: string;
  userId: string;
  mediaSessionId: string;
  permission: ExamMediaPermission;
  streamKind: ExamMediaStreamKind;
  path: string;
  iat: number;
  exp: number;
};

const ACTIVE_MEDIA_ATTEMPT_STATES = new Set([
  'VERIFICATION_PENDING',
  'WAITING_ROOM',
  'APPROVED',
  'READY',
  'IN_PROGRESS',
  'RECONNECTING',
  'TECHNICAL_REVIEW',
  'PROCTORING_REVIEW',
]);
const STREAM_KINDS = new Set<ExamMediaStreamKind>(['PRIMARY', 'SECONDARY', 'SCREEN']);
const MEDIA_PERMISSIONS = new Set<ExamMediaPermission>(['PUBLISH', 'READ']);

function sha256(value: string) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function b64url(value: Buffer | string) {
  return Buffer.from(value).toString('base64url');
}

function timingSafeTextEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function mediaSecret() {
  const secret = process.env.NAVEMORA_EXAM_MEDIA_TOKEN_SECRET || '';
  if (secret.length < 32) {
    throw new SecureExaminationError('Realtime examination media is not configured. NAVEMORA_EXAM_MEDIA_TOKEN_SECRET must contain at least 32 characters.', 503, 'MEDIA_NOT_CONFIGURED');
  }
  return secret;
}

function mediaPublicUrl() {
  const value = (process.env.NAVEMORA_EXAM_MEDIA_PUBLIC_URL || '').trim().replace(/\/+$/, '');
  if (!value) throw new SecureExaminationError('Realtime examination media public URL is not configured.', 503, 'MEDIA_NOT_CONFIGURED');
  if (process.env.NODE_ENV === 'production' && !value.startsWith('https://')) {
    throw new SecureExaminationError('Production realtime examination media must use HTTPS.', 503, 'MEDIA_INSECURE');
  }
  return value;
}

function signMediaPayload(payload: MediaTokenPayload) {
  const encoded = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac('sha256', mediaSecret()).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

function verifyMediaToken(token: string): MediaTokenPayload {
  const [encoded, signature, extra] = token.split('.');
  if (!encoded || !signature || extra) throw new SecureExaminationError('Invalid media bearer token.', 401);
  const expected = crypto.createHmac('sha256', mediaSecret()).update(encoded).digest('base64url');
  if (!timingSafeTextEqual(signature, expected)) throw new SecureExaminationError('Invalid media bearer token.', 401);
  let payload: MediaTokenPayload;
  try {
    payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as MediaTokenPayload;
  } catch {
    throw new SecureExaminationError('Invalid media bearer token.', 401);
  }
  if (payload.v !== 1 || !payload.jti || !payload.tenantId || !payload.attemptId || !payload.userId || !payload.path) {
    throw new SecureExaminationError('Invalid media bearer token.', 401);
  }
  if (!MEDIA_PERMISSIONS.has(payload.permission) || !STREAM_KINDS.has(payload.streamKind)) {
    throw new SecureExaminationError('Invalid media bearer token scope.', 401);
  }
  if (!Number.isFinite(payload.exp) || payload.exp <= Math.floor(Date.now() / 1000)) {
    throw new SecureExaminationError('Media bearer token has expired.', 401);
  }
  return payload;
}

function normalizeStreamKind(value: unknown): ExamMediaStreamKind {
  const kind = String(value || '').toUpperCase() as ExamMediaStreamKind;
  if (!STREAM_KINDS.has(kind)) throw new SecureExaminationError('Unsupported examination media stream.', 400);
  return kind;
}

function normalizePermission(value: unknown): ExamMediaPermission {
  const permission = String(value || '').toUpperCase() as ExamMediaPermission;
  if (!MEDIA_PERMISSIONS.has(permission)) throw new SecureExaminationError('Unsupported examination media permission.', 400);
  return permission;
}

async function runtimeStoreReady() {
  try {
    const rows = await prisma.$queryRaw<Array<{ ready: boolean }>>`
      SELECT to_regclass('campusos_exam_proctoring.exam_runtime_policies') IS NOT NULL AS ready
    `;
    return Boolean(rows[0]?.ready);
  } catch {
    return false;
  }
}

async function loadRuntimeAttempt(tenantId: string, attemptId: string): Promise<RuntimeAttemptRow> {
  const rows = await prisma.$queryRaw<RuntimeAttemptRow[]>`
    SELECT
      a.id AS attempt_id,
      a.student_id,
      a.exam_config_id,
      a.status AS attempt_status,
      ec.delivery_mode,
      COALESCE(rp.primary_stream_required, sp.primary_camera_required, false) AS primary_stream_required,
      COALESCE(rp.secondary_stream_required, sp.second_camera_required, false) AS secondary_stream_required,
      COALESCE(rp.screen_stream_required, sp.screen_share_required, false) AS screen_stream_required,
      COALESCE(rp.ai_vision_enabled, sp.ai_event_analysis_enabled, false) AS ai_vision_enabled,
      COALESCE(rp.secure_client_required, false) AS secure_client_required,
      COALESCE(rp.secure_client_policy_version, '1') AS secure_client_policy_version,
      COALESCE(rp.sample_interval_seconds, 15) AS sample_interval_seconds
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec
      ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.security_profiles sp
      ON sp.id = ec.security_profile_id AND sp.tenant_id = ec.tenant_id
    LEFT JOIN campusos_exam_proctoring.exam_runtime_policies rp
      ON rp.exam_config_id = ec.id AND rp.tenant_id = ec.tenant_id
    WHERE a.tenant_id = ${tenantId}::uuid AND a.id = ${attemptId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new SecureExaminationError('Examination attempt was not found.', 404);
  return rows[0];
}

async function requireStudentAttempt(ctx: ActiveUserContext, attempt: RuntimeAttemptRow) {
  if (ctx.activeRole !== 'STUDENT' || !ctx.studentProfileId || ctx.studentProfileId !== attempt.student_id) {
    throw new SecureExaminationError('This examination media action is available only to the signed-in student.', 403);
  }
}

async function requireProctorAttempt(ctx: ActiveUserContext, attempt: RuntimeAttemptRow) {
  if (!canProctorSecureExam(ctx.activeRole)) throw new SecureExaminationError('This account is not authorized to view live examination media.', 403);
  if (canManageSecureExams(ctx.activeRole)) return;
  const assigned = await prisma.$queryRaw<Array<{ allowed: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM campusos_exam_proctoring.proctor_assignments pa
      WHERE pa.tenant_id = ${ctx.tenantId}::uuid
        AND pa.exam_config_id = ${attempt.exam_config_id}::uuid
        AND pa.proctor_user_id = ${ctx.userId}::uuid
        AND pa.status = 'ACTIVE'
    ) AS allowed
  `;
  if (!assigned[0]?.allowed) throw new SecureExaminationError('This examination is not assigned to the signed-in proctor.', 403);
}

function streamRequired(attempt: RuntimeAttemptRow, kind: ExamMediaStreamKind) {
  if (kind === 'PRIMARY') return attempt.primary_stream_required;
  if (kind === 'SECONDARY') return attempt.secondary_stream_required;
  return attempt.screen_stream_required;
}

async function ensureSecondaryCameraReady(tenantId: string, attemptId: string) {
  const rows = await prisma.$queryRaw<Array<{ ready: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM campusos_exam_proctoring.secondary_camera_sessions sc
      WHERE sc.tenant_id = ${tenantId}::uuid AND sc.attempt_id = ${attemptId}::uuid
        AND sc.status IN ('PAIRED','CONNECTED','DEGRADED')
        AND sc.expires_at > now()
    ) AS ready
  `;
  if (!rows[0]?.ready) throw new SecureExaminationError('3D Eyes must be paired before the secondary WebRTC stream can publish.', 409);
}

async function ensureMediaSession(ctx: ActiveUserContext, attempt: RuntimeAttemptRow, kind: ExamMediaStreamKind) {
  const path = `navemora/${ctx.tenantId}/${attempt.attempt_id}/${kind.toLowerCase()}`;
  const rows = await prisma.$queryRaw<Array<{ id: string; stream_path: string }>>`
    INSERT INTO campusos_exam_proctoring.media_sessions
      (tenant_id, attempt_id, stream_kind, stream_path, publisher_user_id)
    VALUES (${ctx.tenantId}::uuid, ${attempt.attempt_id}::uuid, ${kind}, ${path},
      CASE WHEN ${ctx.activeRole === 'STUDENT'}::boolean THEN ${ctx.userId}::uuid ELSE NULL END)
    ON CONFLICT (tenant_id, attempt_id, stream_kind)
    DO UPDATE SET updated_at = now()
    RETURNING id, stream_path
  `;
  if (!rows[0]) throw new SecureExaminationError('Unable to create examination media session.', 500);
  return rows[0];
}

async function writeRuntimeAudit(
  tenantId: string,
  actorUserId: string | null,
  attemptId: string | null,
  eventType: string,
  metadata: Record<string, unknown> = {},
  tx: Prisma.TransactionClient | typeof prisma = prisma,
) {
  await tx.$executeRaw`
    INSERT INTO campusos_exam_proctoring.runtime_audit_events
      (tenant_id, actor_user_id, attempt_id, event_type, metadata)
    VALUES (${tenantId}::uuid, ${actorUserId}::uuid, ${attemptId}::uuid, ${eventType}, ${JSON.stringify(metadata)}::jsonb)
  `;
}

export async function issueExamMediaGrant(input: {
  attemptId?: string;
  streamKind?: ExamMediaStreamKind | string;
  permission?: ExamMediaPermission | string;
}) {
  if (!(await runtimeStoreReady())) throw new SecureExaminationError('Realtime examination runtime is not provisioned.', 503, 'RUNTIME_NOT_READY');
  const ctx = await requireActiveUserContext();
  const attemptId = String(input.attemptId || '');
  const kind = normalizeStreamKind(input.streamKind);
  const permission = normalizePermission(input.permission);
  if (!attemptId) throw new SecureExaminationError('Examination attempt is required.', 400);
  const attempt = await loadRuntimeAttempt(ctx.tenantId, attemptId);
  if (!ACTIVE_MEDIA_ATTEMPT_STATES.has(attempt.attempt_status)) throw new SecureExaminationError('Live examination media is not available for this attempt state.', 409);
  if (!streamRequired(attempt, kind)) throw new SecureExaminationError(`${kind.toLowerCase()} media is not required for this examination.`, 409);

  if (permission === 'PUBLISH') {
    await requireStudentAttempt(ctx, attempt);
    if (kind === 'SECONDARY') await ensureSecondaryCameraReady(ctx.tenantId, attemptId);
  } else {
    await requireProctorAttempt(ctx, attempt);
  }

  const mediaSession = await ensureMediaSession(ctx, attempt, kind);
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = new Date((now + 10 * 60) * 1000);
  const jti = crypto.randomUUID();
  const grantRows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.media_access_grants
      (tenant_id, attempt_id, media_session_id, user_id, permission, token_jti_hash, expires_at)
    VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${mediaSession.id}::uuid, ${ctx.userId}::uuid,
            ${permission}, ${sha256(jti)}, ${expiresAt})
    RETURNING id
  `;
  const token = signMediaPayload({
    v: 1,
    jti,
    tenantId: ctx.tenantId,
    attemptId,
    userId: ctx.userId,
    mediaSessionId: mediaSession.id,
    permission,
    streamKind: kind,
    path: mediaSession.stream_path,
    iat: now,
    exp: now + 10 * 60,
  });
  const base = mediaPublicUrl();
  await writeRuntimeAudit(ctx.tenantId, ctx.userId, attemptId, 'MEDIA_GRANT_ISSUED', {
    grantId: grantRows[0]?.id,
    permission,
    streamKind: kind,
  });
  return {
    attemptId,
    streamKind: kind,
    permission,
    streamPath: mediaSession.stream_path,
    endpointUrl: `${base}/${mediaSession.stream_path}/${permission === 'PUBLISH' ? 'whip' : 'whep'}`,
    bearerToken: token,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function authorizeMediaGateway(input: {
  token?: unknown;
  password?: unknown;
  action?: unknown;
  path?: unknown;
  protocol?: unknown;
}) {
  const token = String(input.token || input.password || '');
  if (!token) throw new SecureExaminationError('Media authorization token is required.', 401);
  const payload = verifyMediaToken(token);
  const action = String(input.action || '');
  const expectedAction = payload.permission === 'PUBLISH' ? 'publish' : 'read';
  if (action !== expectedAction || String(input.path || '') !== payload.path || String(input.protocol || '') !== 'webrtc') {
    throw new SecureExaminationError('Media authorization scope mismatch.', 403);
  }
  const rows = await prisma.$queryRaw<Array<{ allowed: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM campusos_exam_proctoring.media_access_grants g
      JOIN campusos_exam_proctoring.exam_attempts a
        ON a.id = g.attempt_id AND a.tenant_id = g.tenant_id
      JOIN campusos_exam_proctoring.media_sessions ms
        ON ms.id = g.media_session_id AND ms.tenant_id = g.tenant_id
      WHERE g.tenant_id = ${payload.tenantId}::uuid
        AND g.attempt_id = ${payload.attemptId}::uuid
        AND g.media_session_id = ${payload.mediaSessionId}::uuid
        AND g.user_id = ${payload.userId}::uuid
        AND g.permission = ${payload.permission}
        AND g.token_jti_hash = ${sha256(payload.jti)}
        AND g.revoked_at IS NULL AND g.expires_at > now()
        AND ms.stream_path = ${payload.path}
        AND a.status IN ('VERIFICATION_PENDING','WAITING_ROOM','APPROVED','READY','IN_PROGRESS','RECONNECTING','TECHNICAL_REVIEW','PROCTORING_REVIEW')
    ) AS allowed
  `;
  if (!rows[0]?.allowed) throw new SecureExaminationError('Media authorization grant is no longer active.', 403);
  return { allowed: true };
}

export async function updateExamMediaState(input: {
  attemptId?: string;
  streamKind?: string;
  state?: string;
  error?: string | null;
}) {
  const ctx = await requireActiveUserContext();
  const attemptId = String(input.attemptId || '');
  const kind = normalizeStreamKind(input.streamKind);
  const attempt = await loadRuntimeAttempt(ctx.tenantId, attemptId);
  await requireStudentAttempt(ctx, attempt);
  const allowedStates = new Set(['WAITING','PUBLISHING','LIVE','DEGRADED','ENDED','FAILED']);
  const state = String(input.state || '').toUpperCase();
  if (!allowedStates.has(state)) throw new SecureExaminationError('Unsupported media state.', 400);
  await prisma.$executeRaw`
    UPDATE campusos_exam_proctoring.media_sessions
    SET status = ${state},
        started_at = CASE WHEN ${state} IN ('PUBLISHING','LIVE') THEN COALESCE(started_at, now()) ELSE started_at END,
        ended_at = CASE WHEN ${state} IN ('ENDED','FAILED') THEN now() ELSE ended_at END,
        last_heartbeat_at = CASE WHEN ${state} IN ('PUBLISHING','LIVE','DEGRADED') THEN now() ELSE last_heartbeat_at END,
        last_error = ${input.error ? String(input.error).slice(0, 500) : null},
        updated_at = now()
    WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_id = ${attemptId}::uuid AND stream_kind = ${kind}
  `;
  return { success: true };
}

export async function getExamRuntimePolicyForAttempt(attemptId: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await loadRuntimeAttempt(ctx.tenantId, attemptId);
  if (ctx.activeRole === 'STUDENT') await requireStudentAttempt(ctx, attempt);
  else await requireProctorAttempt(ctx, attempt);
  return {
    attemptId,
    primaryStreamRequired: attempt.primary_stream_required,
    secondaryStreamRequired: attempt.secondary_stream_required,
    screenStreamRequired: attempt.screen_stream_required,
    aiVisionEnabled: attempt.ai_vision_enabled,
    secureClientRequired: attempt.secure_client_required,
    secureClientPolicyVersion: attempt.secure_client_policy_version,
    sampleIntervalSeconds: attempt.sample_interval_seconds,
  };
}

export async function getSecureClientGate(attemptId: string) {
  if (!(await runtimeStoreReady())) return { required: false, ready: true, runtimeReady: false, policyVersion: '1' };
  const ctx = await requireActiveUserContext();
  const attempt = await loadRuntimeAttempt(ctx.tenantId, attemptId);
  await requireStudentAttempt(ctx, attempt);
  if (!attempt.secure_client_required) return { required: false, ready: true, runtimeReady: true, policyVersion: attempt.secure_client_policy_version };
  const rows = await prisma.$queryRaw<Array<{ ready: boolean; device_label: string | null; created_at: Date | null }>>`
    SELECT EXISTS (
      SELECT 1
      FROM campusos_exam_proctoring.secure_client_attestations sa
      JOIN campusos_exam_proctoring.secure_client_devices sd
        ON sd.id = sa.device_id AND sd.tenant_id = sa.tenant_id
      WHERE sa.tenant_id = ${ctx.tenantId}::uuid AND sa.attempt_id = ${attemptId}::uuid
        AND sa.student_id = ${attempt.student_id}::uuid AND sa.state = 'PASS'
        AND sa.signature_valid = true AND sd.status = 'ACTIVE'
    ) AS ready,
    (
      SELECT sd.label
      FROM campusos_exam_proctoring.secure_client_attestations sa
      JOIN campusos_exam_proctoring.secure_client_devices sd ON sd.id = sa.device_id
      WHERE sa.tenant_id = ${ctx.tenantId}::uuid AND sa.attempt_id = ${attemptId}::uuid AND sa.state = 'PASS'
      ORDER BY sa.created_at DESC LIMIT 1
    ) AS device_label,
    (
      SELECT sa.created_at
      FROM campusos_exam_proctoring.secure_client_attestations sa
      WHERE sa.tenant_id = ${ctx.tenantId}::uuid AND sa.attempt_id = ${attemptId}::uuid AND sa.state = 'PASS'
      ORDER BY sa.created_at DESC LIMIT 1
    ) AS created_at
  `;
  return {
    required: true,
    ready: Boolean(rows[0]?.ready),
    runtimeReady: true,
    policyVersion: attempt.secure_client_policy_version,
    deviceLabel: rows[0]?.device_label ?? null,
    attestedAt: rows[0]?.created_at?.toISOString() ?? null,
  };
}

export async function createSecureClientChallenge(attemptId: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await loadRuntimeAttempt(ctx.tenantId, attemptId);
  await requireStudentAttempt(ctx, attempt);
  if (!attempt.secure_client_required) throw new SecureExaminationError('This examination does not require the managed secure client.', 409);
  const nonce = crypto.randomBytes(32).toString('base64url');
  const challengeToken = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.secure_client_challenges
      (tenant_id, attempt_id, student_id, nonce_hash, challenge_token_hash, expires_at)
    VALUES (${ctx.tenantId}::uuid, ${attemptId}::uuid, ${attempt.student_id}::uuid,
            ${sha256(nonce)}, ${sha256(challengeToken)}, ${expiresAt})
    RETURNING id
  `;
  await writeRuntimeAudit(ctx.tenantId, ctx.userId, attemptId, 'SECURE_CLIENT_CHALLENGE_CREATED', { challengeId: rows[0]?.id });
  return {
    challengeId: rows[0]?.id,
    challengeToken,
    nonce,
    policyVersion: attempt.secure_client_policy_version,
    expiresAt: expiresAt.toISOString(),
  };
}

export async function createSecureClientEnrollment(input: { label?: string; expiresMinutes?: number; maxUses?: number }) {
  const ctx = await requireActiveUserContext();
  if (!canManageSecureExams(ctx.activeRole)) throw new SecureExaminationError('Only authorized examination administrators can create secure-client enrollment codes.', 403);
  const code = crypto.randomBytes(18).toString('base64url');
  const minutes = Math.min(1440, Math.max(5, Math.floor(Number(input.expiresMinutes ?? 60))));
  const maxUses = Math.min(1000, Math.max(1, Math.floor(Number(input.maxUses ?? 1))));
  const expiresAt = new Date(Date.now() + minutes * 60 * 1000);
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO campusos_exam_proctoring.secure_client_enrollment_codes
      (tenant_id, code_hash, label, expires_at, max_uses, created_by)
    VALUES (${ctx.tenantId}::uuid, ${sha256(code)}, ${String(input.label || 'Managed exam device').slice(0, 200)},
            ${expiresAt}, ${maxUses}, ${ctx.userId}::uuid)
    RETURNING id
  `;
  return { id: rows[0]?.id, code, expiresAt: expiresAt.toISOString(), maxUses };
}

export async function enrollSecureClientDevice(input: {
  enrollmentCode?: unknown;
  label?: unknown;
  platform?: unknown;
  publicKeyPem?: unknown;
}) {
  const code = String(input.enrollmentCode || '');
  const label = String(input.label || 'Managed exam device').trim().slice(0, 200);
  const platform = String(input.platform || 'unknown').trim().slice(0, 100);
  const publicKeyPem = String(input.publicKeyPem || '').trim();
  if (!code || !publicKeyPem) throw new SecureExaminationError('Enrollment code and device public key are required.', 400);
  let normalizedPem: string;
  try {
    normalizedPem = crypto.createPublicKey(publicKeyPem).export({ type: 'spki', format: 'pem' }).toString();
  } catch {
    throw new SecureExaminationError('Secure-client public key is invalid.', 400);
  }
  const fingerprint = sha256(normalizedPem);
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<Array<{ id: string; tenant_id: string; max_uses: number; used_count: number }>>`
      SELECT id, tenant_id, max_uses, used_count
      FROM campusos_exam_proctoring.secure_client_enrollment_codes
      WHERE code_hash = ${sha256(code)} AND revoked_at IS NULL AND expires_at > now() AND used_count < max_uses
      FOR UPDATE
    `;
    const enrollment = rows[0];
    if (!enrollment) throw new SecureExaminationError('Secure-client enrollment code is invalid, expired or fully used.', 403);
    const devices = await tx.$queryRaw<Array<{ id: string; status: string }>>`
      INSERT INTO campusos_exam_proctoring.secure_client_devices
        (tenant_id, label, platform, public_key_pem, key_fingerprint, status, enrolled_by_code_id)
      VALUES (${enrollment.tenant_id}::uuid, ${label}, ${platform}, ${normalizedPem}, ${fingerprint}, 'ACTIVE', ${enrollment.id}::uuid)
      ON CONFLICT (tenant_id, key_fingerprint)
      DO UPDATE SET label = EXCLUDED.label, platform = EXCLUDED.platform, last_seen_at = now()
      RETURNING id, status
    `;
    await tx.$executeRaw`
      UPDATE campusos_exam_proctoring.secure_client_enrollment_codes
      SET used_count = used_count + 1
      WHERE id = ${enrollment.id}::uuid
    `;
    await writeRuntimeAudit(enrollment.tenant_id, null, null, 'SECURE_CLIENT_DEVICE_ENROLLED', { deviceId: devices[0]?.id, fingerprint }, tx);
    return { deviceId: devices[0]?.id, fingerprint, status: devices[0]?.status ?? 'ACTIVE' };
  });
}

export async function attestSecureClient(input: {
  challengeToken?: unknown;
  nonce?: unknown;
  deviceFingerprint?: unknown;
  signature?: unknown;
  policyVersion?: unknown;
  clientVersion?: unknown;
  appHash?: unknown;
  kioskMode?: unknown;
  extensionsDisabled?: unknown;
  devtoolsRestricted?: unknown;
  posture?: unknown;
}) {
  const challengeToken = String(input.challengeToken || '');
  const nonce = String(input.nonce || '');
  const fingerprint = String(input.deviceFingerprint || '');
  const signature = String(input.signature || '');
  const policyVersion = String(input.policyVersion || '1').slice(0, 50);
  const clientVersion = String(input.clientVersion || 'unknown').slice(0, 100);
  const appHash = String(input.appHash || '').slice(0, 200) || null;
  if (!challengeToken || !nonce || !fingerprint || !signature) throw new SecureExaminationError('Secure-client challenge, device and signature are required.', 400);

  return prisma.$transaction(async (tx) => {
    const challenges = await tx.$queryRaw<Array<{
      id: string;
      tenant_id: string;
      attempt_id: string;
      student_id: string;
      nonce_hash: string;
      expires_at: Date;
    }>>`
      SELECT id, tenant_id, attempt_id, student_id, nonce_hash, expires_at
      FROM campusos_exam_proctoring.secure_client_challenges
      WHERE challenge_token_hash = ${sha256(challengeToken)} AND consumed_at IS NULL AND expires_at > now()
      FOR UPDATE
    `;
    const challenge = challenges[0];
    if (!challenge || challenge.nonce_hash !== sha256(nonce)) throw new SecureExaminationError('Secure-client challenge is invalid or expired.', 403);
    const devices = await tx.$queryRaw<Array<{ id: string; public_key_pem: string; status: string }>>`
      SELECT id, public_key_pem, status
      FROM campusos_exam_proctoring.secure_client_devices
      WHERE tenant_id = ${challenge.tenant_id}::uuid AND key_fingerprint = ${fingerprint}
      LIMIT 1
    `;
    const device = devices[0];
    if (!device || device.status !== 'ACTIVE') throw new SecureExaminationError('This secure-client device is not active for the institution.', 403);
    const message = `${challenge.id}:${challenge.attempt_id}:${nonce}:${policyVersion}:${clientVersion}:${appHash ?? ''}`;
    let signatureValid = false;
    try {
      signatureValid = crypto.verify(null, Buffer.from(message), crypto.createPublicKey(device.public_key_pem), Buffer.from(signature, 'base64url'));
    } catch {
      signatureValid = false;
    }
    const kioskMode = input.kioskMode === true;
    const extensionsDisabled = input.extensionsDisabled === true;
    const devtoolsRestricted = input.devtoolsRestricted === true;
    const state = signatureValid && kioskMode && extensionsDisabled && devtoolsRestricted ? 'PASS' : signatureValid ? 'REVIEW_REQUIRED' : 'FAILED';
    const posture = input.posture && typeof input.posture === 'object' && !Array.isArray(input.posture) ? input.posture : {};
    const attestations = await tx.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_exam_proctoring.secure_client_attestations
        (tenant_id, attempt_id, student_id, device_id, challenge_id, policy_version, client_version,
         app_hash, kiosk_mode, extensions_disabled, devtools_restricted, signature_valid, posture, state)
      VALUES (${challenge.tenant_id}::uuid, ${challenge.attempt_id}::uuid, ${challenge.student_id}::uuid,
              ${device.id}::uuid, ${challenge.id}::uuid, ${policyVersion}, ${clientVersion}, ${appHash},
              ${kioskMode}, ${extensionsDisabled}, ${devtoolsRestricted}, ${signatureValid},
              ${JSON.stringify(posture)}::jsonb, ${state})
      RETURNING id
    `;
    await tx.$executeRaw`UPDATE campusos_exam_proctoring.secure_client_challenges SET consumed_at = now() WHERE id = ${challenge.id}::uuid`;
    await tx.$executeRaw`UPDATE campusos_exam_proctoring.secure_client_devices SET last_seen_at = now() WHERE id = ${device.id}::uuid`;
    await writeRuntimeAudit(challenge.tenant_id, null, challenge.attempt_id, 'SECURE_CLIENT_ATTESTED', {
      attestationId: attestations[0]?.id,
      deviceId: device.id,
      state,
      signatureValid,
    }, tx);
    const appBase = (process.env.APP_PUBLIC_URL || 'http://localhost:3000').replace(/\/+$/, '');
    return { state, signatureValid, launchUrl: `${appBase}/examinations/attempt/${challenge.attempt_id}` };
  });
}

export async function upsertExamRuntimePolicy(input: {
  configId?: string;
  primaryStreamRequired?: boolean;
  secondaryStreamRequired?: boolean;
  screenStreamRequired?: boolean;
  aiVisionEnabled?: boolean;
  secureClientRequired?: boolean;
  secureClientPolicyVersion?: string;
  sampleIntervalSeconds?: number;
  maxProctorReaders?: number;
}) {
  const ctx = await requireActiveUserContext();
  if (!canManageSecureExams(ctx.activeRole)) throw new SecureExaminationError('Only authorized examination administrators can change runtime security policy.', 403);
  const configId = String(input.configId || '');
  if (!configId) throw new SecureExaminationError('Exam configuration is required.', 400);
  const exists = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_exam_proctoring.exam_configs
    WHERE tenant_id = ${ctx.tenantId}::uuid AND id = ${configId}::uuid LIMIT 1
  `;
  if (!exists[0]) throw new SecureExaminationError('Exam configuration was not found.', 404);
  const interval = Math.min(300, Math.max(5, Math.floor(Number(input.sampleIntervalSeconds ?? 15))));
  const readers = Math.min(500, Math.max(1, Math.floor(Number(input.maxProctorReaders ?? 20))));
  const policyVersion = String(input.secureClientPolicyVersion || '1').slice(0, 50);
  await prisma.$executeRaw`
    INSERT INTO campusos_exam_proctoring.exam_runtime_policies
      (tenant_id, exam_config_id, primary_stream_required, secondary_stream_required, screen_stream_required,
       ai_vision_enabled, secure_client_required, secure_client_policy_version, sample_interval_seconds,
       max_proctor_readers, updated_by)
    VALUES (${ctx.tenantId}::uuid, ${configId}::uuid, ${input.primaryStreamRequired !== false},
            ${input.secondaryStreamRequired === true}, ${input.screenStreamRequired === true},
            ${input.aiVisionEnabled === true}, ${input.secureClientRequired === true}, ${policyVersion},
            ${interval}, ${readers}, ${ctx.userId}::uuid)
    ON CONFLICT (exam_config_id)
    DO UPDATE SET primary_stream_required = EXCLUDED.primary_stream_required,
                  secondary_stream_required = EXCLUDED.secondary_stream_required,
                  screen_stream_required = EXCLUDED.screen_stream_required,
                  ai_vision_enabled = EXCLUDED.ai_vision_enabled,
                  secure_client_required = EXCLUDED.secure_client_required,
                  secure_client_policy_version = EXCLUDED.secure_client_policy_version,
                  sample_interval_seconds = EXCLUDED.sample_interval_seconds,
                  max_proctor_readers = EXCLUDED.max_proctor_readers,
                  updated_by = EXCLUDED.updated_by,
                  updated_at = now()
  `;
  await writeRuntimeAudit(ctx.tenantId, ctx.userId, null, 'EXAM_RUNTIME_POLICY_UPDATED', { configId });
  return { success: true };
}

export async function getRuntimeAdministration() {
  const ctx = await requireActiveUserContext();
  if (!canManageSecureExams(ctx.activeRole)) throw new SecureExaminationError('Only authorized examination administrators can manage secure-exam runtime settings.', 403);
  const [configs, devices] = await Promise.all([
    prisma.$queryRaw<Array<{
      config_id: string;
      exam_name: string;
      delivery_mode: string;
      primary_stream_required: boolean;
      secondary_stream_required: boolean;
      screen_stream_required: boolean;
      ai_vision_enabled: boolean;
      secure_client_required: boolean;
      secure_client_policy_version: string;
      sample_interval_seconds: number;
    }>>`
      SELECT ec.id AS config_id, e.name AS exam_name, ec.delivery_mode,
             COALESCE(rp.primary_stream_required, sp.primary_camera_required, false) AS primary_stream_required,
             COALESCE(rp.secondary_stream_required, sp.second_camera_required, false) AS secondary_stream_required,
             COALESCE(rp.screen_stream_required, sp.screen_share_required, false) AS screen_stream_required,
             COALESCE(rp.ai_vision_enabled, sp.ai_event_analysis_enabled, false) AS ai_vision_enabled,
             COALESCE(rp.secure_client_required, false) AS secure_client_required,
             COALESCE(rp.secure_client_policy_version, '1') AS secure_client_policy_version,
             COALESCE(rp.sample_interval_seconds, 15) AS sample_interval_seconds
      FROM campusos_exam_proctoring.exam_configs ec
      JOIN public.exams e ON e.id = ec.exam_id AND e.tenant_id = ec.tenant_id
      LEFT JOIN campusos_exam_proctoring.security_profiles sp ON sp.id = ec.security_profile_id
      LEFT JOIN campusos_exam_proctoring.exam_runtime_policies rp ON rp.exam_config_id = ec.id AND rp.tenant_id = ec.tenant_id
      WHERE ec.tenant_id = ${ctx.tenantId}::uuid
      ORDER BY ec.created_at DESC LIMIT 200
    `,
    prisma.$queryRaw<Array<{
      id: string;
      label: string;
      platform: string;
      key_fingerprint: string;
      status: string;
      last_seen_at: Date | null;
      created_at: Date;
    }>>`
      SELECT id, label, platform, key_fingerprint, status, last_seen_at, created_at
      FROM campusos_exam_proctoring.secure_client_devices
      WHERE tenant_id = ${ctx.tenantId}::uuid
      ORDER BY created_at DESC LIMIT 200
    `,
  ]);
  return {
    configs: configs.map((row) => ({
      configId: row.config_id,
      examName: row.exam_name,
      deliveryMode: row.delivery_mode,
      primaryStreamRequired: row.primary_stream_required,
      secondaryStreamRequired: row.secondary_stream_required,
      screenStreamRequired: row.screen_stream_required,
      aiVisionEnabled: row.ai_vision_enabled,
      secureClientRequired: row.secure_client_required,
      secureClientPolicyVersion: row.secure_client_policy_version,
      sampleIntervalSeconds: row.sample_interval_seconds,
    })),
    devices: devices.map((row) => ({
      id: row.id,
      label: row.label,
      platform: row.platform,
      fingerprint: row.key_fingerprint,
      status: row.status,
      lastSeenAt: row.last_seen_at?.toISOString() ?? null,
      createdAt: row.created_at.toISOString(),
    })),
  };
}

export async function getProctorRuntimeView(attemptId: string) {
  const ctx = await requireActiveUserContext();
  const attempt = await loadRuntimeAttempt(ctx.tenantId, attemptId);
  await requireProctorAttempt(ctx, attempt);
  const [media, events, findings] = await Promise.all([
    prisma.$queryRaw<Array<{ stream_kind: string; status: string; last_heartbeat_at: Date | null; last_error: string | null }>>`
      SELECT stream_kind, status, last_heartbeat_at, last_error
      FROM campusos_exam_proctoring.media_sessions
      WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_id = ${attemptId}::uuid
      ORDER BY stream_kind
    `,
    prisma.$queryRaw<Array<{ id: string; source: string; event_type: string; severity: string; metadata: unknown; occurred_at: Date; reviewed_at: Date | null }>>`
      SELECT id, source, event_type, severity, metadata, occurred_at, reviewed_at
      FROM campusos_exam_proctoring.proctoring_events
      WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_id = ${attemptId}::uuid
      ORDER BY occurred_at DESC LIMIT 100
    `,
    prisma.$queryRaw<Array<{ id: string; event_type: string; severity: string; confidence: unknown; model: string | null; rationale: string | null; created_at: Date }>>`
      SELECT id, event_type, severity, confidence, model, rationale, created_at
      FROM campusos_exam_proctoring.vision_findings
      WHERE tenant_id = ${ctx.tenantId}::uuid AND attempt_id = ${attemptId}::uuid
      ORDER BY created_at DESC LIMIT 100
    `,
  ]);
  return {
    attemptId,
    policy: {
      aiVisionEnabled: attempt.ai_vision_enabled,
      secureClientRequired: attempt.secure_client_required,
      primaryStreamRequired: attempt.primary_stream_required,
      secondaryStreamRequired: attempt.secondary_stream_required,
      screenStreamRequired: attempt.screen_stream_required,
    },
    media: media.map((row) => ({ kind: row.stream_kind, status: row.status, lastHeartbeatAt: row.last_heartbeat_at?.toISOString() ?? null, lastError: row.last_error })),
    events: events.map((row) => ({ id: row.id, source: row.source, eventType: row.event_type, severity: row.severity, metadata: row.metadata, occurredAt: row.occurred_at.toISOString(), reviewedAt: row.reviewed_at?.toISOString() ?? null })),
    findings: findings.map((row) => ({ id: row.id, eventType: row.event_type, severity: row.severity, confidence: row.confidence === null ? null : Number(row.confidence), model: row.model, rationale: row.rationale, createdAt: row.created_at.toISOString() })),
  };
}
