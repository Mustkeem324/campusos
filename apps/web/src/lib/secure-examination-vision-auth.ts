import 'server-only';

import crypto from 'node:crypto';

import { prisma } from './db';
import { SecureExaminationError } from './secure-examination';

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function authorizeVisionWorkerMedia(input: {
  token?: unknown;
  action?: unknown;
  path?: unknown;
  protocol?: unknown;
}) {
  const configured = process.env.NAVEMORA_EXAM_VISION_MEDIA_SECRET || '';
  const supplied = String(input.token || '');
  if (configured.length < 32 || !supplied || !safeEqual(configured, supplied)) {
    throw new SecureExaminationError('AI vision worker media authorization failed.', 401);
  }
  if (String(input.action || '') !== 'read' || String(input.protocol || '') !== 'webrtc') {
    throw new SecureExaminationError('AI vision worker media authorization scope mismatch.', 403);
  }
  const path = String(input.path || '');
  const match = /^navemora\/([0-9a-f-]{36})\/([0-9a-f-]{36})\/(primary|secondary|screen)$/i.exec(path);
  if (!match) throw new SecureExaminationError('AI vision worker media path is invalid.', 403);
  const [, tenantId, attemptId, kind] = match;
  const rows = await prisma.$queryRaw<Array<{ allowed: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM campusos_exam_proctoring.media_sessions ms
      JOIN campusos_exam_proctoring.exam_attempts a
        ON a.id = ms.attempt_id AND a.tenant_id = ms.tenant_id
      JOIN campusos_exam_proctoring.exam_configs ec
        ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
      LEFT JOIN campusos_exam_proctoring.security_profiles sp
        ON sp.id = ec.security_profile_id AND sp.tenant_id = ec.tenant_id
      LEFT JOIN campusos_exam_proctoring.exam_runtime_policies rp
        ON rp.exam_config_id = ec.id AND rp.tenant_id = ec.tenant_id
      WHERE ms.tenant_id = ${tenantId}::uuid
        AND ms.attempt_id = ${attemptId}::uuid
        AND ms.stream_path = ${path}
        AND lower(ms.stream_kind) = lower(${kind})
        AND COALESCE(rp.ai_vision_enabled, sp.ai_event_analysis_enabled, false) = true
        AND a.status IN ('IN_PROGRESS','RECONNECTING','TECHNICAL_REVIEW','PROCTORING_REVIEW')
        AND ms.status IN ('PUBLISHING','LIVE','DEGRADED')
    ) AS allowed
  `;
  if (!rows[0]?.allowed) throw new SecureExaminationError('AI vision worker is not authorized for this live stream.', 403);
  return { allowed: true };
}
