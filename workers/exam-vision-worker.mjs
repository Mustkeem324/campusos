import os from 'node:os';
import process from 'node:process';

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const workerId = process.env.NAVEMORA_EXAM_VISION_WORKER_ID || `${os.hostname()}:${process.pid}`;
const pollMs = Math.min(60_000, Math.max(1_000, Number(process.env.NAVEMORA_EXAM_VISION_POLL_MS || 3_000)));
const inferenceUrl = (process.env.NAVEMORA_EXAM_VISION_INFER_URL || '').trim();
const inferenceSecret = process.env.NAVEMORA_EXAM_VISION_INFER_SECRET || '';
const mediaBase = (process.env.NAVEMORA_EXAM_MEDIA_INTERNAL_URL || 'http://mediamtx:8889').replace(/\/+$/, '');
const mediaSecret = process.env.NAVEMORA_EXAM_VISION_MEDIA_SECRET || '';
const inferenceConfigured = Boolean(inferenceUrl) && inferenceSecret.length >= 16 && mediaSecret.length >= 32;
let stopping = false;

const allowedSeverity = new Set(['INFO', 'LOW', 'MEDIUM', 'HIGH']);
const allowedEventType = /^[A-Z0-9_]{3,80}$/;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function safeMetadata(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const serialized = JSON.stringify(value);
  if (serialized.length > 20_000) return { truncated: true };
  return value;
}

function validateFinding(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const eventType = String(value.eventType || '').toUpperCase();
  const severity = String(value.severity || 'INFO').toUpperCase();
  if (!allowedEventType.test(eventType) || !allowedSeverity.has(severity)) return null;
  const confidenceValue = value.confidence === undefined || value.confidence === null ? null : Number(value.confidence);
  const confidence = confidenceValue !== null && Number.isFinite(confidenceValue) && confidenceValue >= 0 && confidenceValue <= 1 ? confidenceValue : null;
  return {
    eventType,
    severity,
    confidence,
    rationale: value.rationale ? String(value.rationale).slice(0, 2_000) : null,
    metadata: safeMetadata(value.metadata),
  };
}

async function ensureRuntimeReady() {
  const rows = await prisma.$queryRawUnsafe("SELECT to_regclass('campusos_exam_proctoring.vision_jobs')::text AS jobs, to_regclass('campusos_exam_proctoring.media_sessions')::text AS media");
  if (!rows[0]?.jobs || !rows[0]?.media) throw new Error('Secure examination runtime storage is not provisioned.');
}

async function seedJobs() {
  await prisma.$executeRawUnsafe(`
    INSERT INTO campusos_exam_proctoring.vision_jobs
      (tenant_id, attempt_id, media_session_id, source_kind, idempotency_key, available_at, metadata)
    SELECT
      a.tenant_id,
      a.id,
      ms.id,
      'LIVE_SAMPLE',
      concat('live:', a.id::text, ':', ms.id::text, ':', floor(extract(epoch from now()) / greatest(COALESCE(rp.sample_interval_seconds, 15), 5))::bigint),
      now(),
      jsonb_build_object('streamKind', ms.stream_kind, 'streamPath', ms.stream_path)
    FROM campusos_exam_proctoring.exam_attempts a
    JOIN campusos_exam_proctoring.exam_configs ec
      ON ec.id = a.exam_config_id AND ec.tenant_id = a.tenant_id
    JOIN campusos_exam_proctoring.media_sessions ms
      ON ms.attempt_id = a.id AND ms.tenant_id = a.tenant_id
    LEFT JOIN campusos_exam_proctoring.security_profiles sp
      ON sp.id = ec.security_profile_id AND sp.tenant_id = ec.tenant_id
    LEFT JOIN campusos_exam_proctoring.exam_runtime_policies rp
      ON rp.exam_config_id = ec.id AND rp.tenant_id = ec.tenant_id
    WHERE a.status IN ('IN_PROGRESS','RECONNECTING','TECHNICAL_REVIEW','PROCTORING_REVIEW')
      AND ms.status IN ('PUBLISHING','LIVE','DEGRADED')
      AND ms.stream_kind IN ('PRIMARY','SECONDARY')
      AND COALESCE(rp.ai_vision_enabled, sp.ai_event_analysis_enabled, false) = true
    ON CONFLICT (idempotency_key) DO NOTHING
  `);
}

async function claimJob() {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRawUnsafe(`
      SELECT j.id, j.tenant_id, j.attempt_id, j.media_session_id, j.attempt_count,
             j.metadata, ms.stream_kind, ms.stream_path
      FROM campusos_exam_proctoring.vision_jobs j
      JOIN campusos_exam_proctoring.media_sessions ms
        ON ms.id = j.media_session_id AND ms.tenant_id = j.tenant_id
      WHERE j.status = 'QUEUED'
        AND j.available_at <= now()
        AND (j.leased_until IS NULL OR j.leased_until < now())
      ORDER BY j.available_at ASC, j.created_at ASC
      FOR UPDATE OF j SKIP LOCKED
      LIMIT 1
    `);
    const job = rows[0];
    if (!job) return null;
    await tx.$executeRawUnsafe(
      `UPDATE campusos_exam_proctoring.vision_jobs
       SET status = 'RUNNING', leased_until = now() + interval '90 seconds', worker_id = $1, attempt_count = attempt_count + 1
       WHERE id = $2::uuid`,
      workerId,
      job.id,
    );
    return job;
  });
}

async function callInference(job) {
  if (!inferenceConfigured) throw new Error('AI inference provider is not configured.');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60_000);
  try {
    const response = await fetch(inferenceUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${inferenceSecret}`,
      },
      body: JSON.stringify({
        schemaVersion: 'navemora.exam.vision.v1',
        jobId: job.id,
        attemptId: job.attempt_id,
        streamKind: job.stream_kind,
        media: {
          protocol: 'WHEP',
          url: `${mediaBase}/${job.stream_path}/whep`,
          authorization: { scheme: 'Bearer', token: mediaSecret },
        },
        constraints: {
          noAutomaticVerdict: true,
          doNotInferSensitiveTraits: true,
          reportOnlyObservableExamWorkspaceEvents: true,
        },
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`Inference provider returned HTTP ${response.status}.`);
    const rawFindings = Array.isArray(body.findings) ? body.findings.slice(0, 50) : [];
    return {
      providerReference: body.providerReference ? String(body.providerReference).slice(0, 300) : null,
      model: body.model ? String(body.model).slice(0, 200) : null,
      findings: rawFindings.map(validateFinding).filter(Boolean),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function completeJob(job, result) {
  await prisma.$transaction(async (tx) => {
    for (const finding of result.findings) {
      const rows = await tx.$queryRawUnsafe(
        `INSERT INTO campusos_exam_proctoring.vision_findings
           (tenant_id, job_id, attempt_id, event_type, severity, confidence, model, rationale, metadata)
         VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8, $9::jsonb)
         RETURNING id`,
        job.tenant_id,
        job.id,
        job.attempt_id,
        finding.eventType,
        finding.severity,
        finding.confidence,
        result.model,
        finding.rationale,
        JSON.stringify(finding.metadata),
      );
      await tx.$executeRawUnsafe(
        `INSERT INTO campusos_exam_proctoring.proctoring_events
           (tenant_id, attempt_id, source, event_type, severity, metadata)
         VALUES ($1::uuid, $2::uuid, 'AI', $3, $4, $5::jsonb)`,
        job.tenant_id,
        job.attempt_id,
        finding.eventType,
        finding.severity,
        JSON.stringify({
          findingId: rows[0]?.id,
          confidence: finding.confidence,
          model: result.model,
          providerReference: result.providerReference,
          rationale: finding.rationale,
          humanReviewRequired: ['MEDIUM', 'HIGH'].includes(finding.severity),
          automaticVerdict: false,
        }),
      );
      if (['MEDIUM', 'HIGH'].includes(finding.severity)) {
        await tx.$executeRawUnsafe(
          `UPDATE campusos_exam_proctoring.exam_attempts
           SET integrity_state = CASE WHEN integrity_state = 'NO_ISSUE' THEN 'REVIEW_REQUIRED' ELSE integrity_state END,
               updated_at = now()
           WHERE tenant_id = $1::uuid AND id = $2::uuid`,
          job.tenant_id,
          job.attempt_id,
        );
      }
    }
    await tx.$executeRawUnsafe(
      `UPDATE campusos_exam_proctoring.vision_jobs
       SET status = 'COMPLETED', leased_until = NULL, provider_reference = $1, last_error = NULL, completed_at = now()
       WHERE id = $2::uuid`,
      result.providerReference,
      job.id,
    );
  });
}

async function failJob(job, error) {
  const attempts = Number(job.attempt_count || 0) + 1;
  const terminal = attempts >= 5;
  const delaySeconds = Math.min(300, 5 * 2 ** Math.min(attempts, 6));
  await prisma.$executeRawUnsafe(
    `UPDATE campusos_exam_proctoring.vision_jobs
     SET status = $1, leased_until = NULL, last_error = $2,
         available_at = CASE WHEN $1 = 'QUEUED' THEN now() + ($3 || ' seconds')::interval ELSE available_at END
     WHERE id = $4::uuid`,
    terminal ? 'DEAD_LETTER' : 'QUEUED',
    String(error instanceof Error ? error.message : error).slice(0, 2_000),
    String(delaySeconds),
    job.id,
  );
}

async function runOnce() {
  await seedJobs();
  const job = await claimJob();
  if (!job) return false;
  try {
    const result = await callInference(job);
    await completeJob(job, result);
  } catch (error) {
    await failJob(job, error);
  }
  return true;
}

process.on('SIGTERM', () => { stopping = true; });
process.on('SIGINT', () => { stopping = true; });

try {
  await ensureRuntimeReady();
  console.log(`NAVEMORA exam vision worker started as ${workerId}.`);
  if (!inferenceConfigured) {
    console.warn('NAVEMORA AI vision worker is idle because the inference endpoint, inference secret, or scoped media secret is not configured. No jobs or detections will be fabricated.');
    while (!stopping) await sleep(Math.max(pollMs, 30_000));
  } else {
    while (!stopping) {
      const worked = await runOnce();
      if (!worked) await sleep(pollMs);
    }
  }
} catch (error) {
  console.error('NAVEMORA exam vision worker failed:', error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}