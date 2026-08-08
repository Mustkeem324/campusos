CREATE SCHEMA IF NOT EXISTS campusos_exam_proctoring;

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.exam_runtime_policies (
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_config_id uuid PRIMARY KEY REFERENCES campusos_exam_proctoring.exam_configs(id) ON DELETE CASCADE,
  media_transport text NOT NULL DEFAULT 'WHIP_WHEP'
    CHECK (media_transport IN ('WHIP_WHEP')),
  primary_stream_required boolean NOT NULL DEFAULT true,
  secondary_stream_required boolean NOT NULL DEFAULT false,
  screen_stream_required boolean NOT NULL DEFAULT false,
  ai_vision_enabled boolean NOT NULL DEFAULT false,
  secure_client_required boolean NOT NULL DEFAULT false,
  secure_client_policy_version text NOT NULL DEFAULT '1',
  sample_interval_seconds integer NOT NULL DEFAULT 15 CHECK (sample_interval_seconds BETWEEN 5 AND 300),
  max_proctor_readers integer NOT NULL DEFAULT 20 CHECK (max_proctor_readers BETWEEN 1 AND 500),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_runtime_policy_tenant_idx
  ON campusos_exam_proctoring.exam_runtime_policies (tenant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.media_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  stream_kind text NOT NULL CHECK (stream_kind IN ('PRIMARY','SECONDARY','SCREEN')),
  transport text NOT NULL DEFAULT 'WHIP_WHEP' CHECK (transport IN ('WHIP_WHEP')),
  stream_path text NOT NULL,
  status text NOT NULL DEFAULT 'WAITING'
    CHECK (status IN ('WAITING','PUBLISHING','LIVE','DEGRADED','ENDED','FAILED')),
  publisher_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  started_at timestamptz,
  ended_at timestamptz,
  last_heartbeat_at timestamptz,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, attempt_id, stream_kind),
  UNIQUE (stream_path)
);
CREATE INDEX IF NOT EXISTS exam_media_session_live_idx
  ON campusos_exam_proctoring.media_sessions (tenant_id, status, last_heartbeat_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.media_access_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  media_session_id uuid NOT NULL REFERENCES campusos_exam_proctoring.media_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  permission text NOT NULL CHECK (permission IN ('PUBLISH','READ')),
  token_jti_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_media_grant_lookup_idx
  ON campusos_exam_proctoring.media_access_grants (tenant_id, user_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.vision_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  media_session_id uuid NOT NULL REFERENCES campusos_exam_proctoring.media_sessions(id) ON DELETE CASCADE,
  source_kind text NOT NULL DEFAULT 'LIVE_SAMPLE' CHECK (source_kind IN ('LIVE_SAMPLE','SNAPSHOT','SEGMENT')),
  status text NOT NULL DEFAULT 'QUEUED'
    CHECK (status IN ('QUEUED','RUNNING','COMPLETED','FAILED','DEAD_LETTER')),
  idempotency_key text NOT NULL UNIQUE,
  available_at timestamptz NOT NULL DEFAULT now(),
  leased_until timestamptz,
  worker_id text,
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 100),
  provider_reference text,
  last_error text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS exam_vision_jobs_queue_idx
  ON campusos_exam_proctoring.vision_jobs (status, available_at, leased_until, created_at);
CREATE INDEX IF NOT EXISTS exam_vision_jobs_attempt_idx
  ON campusos_exam_proctoring.vision_jobs (tenant_id, attempt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.vision_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES campusos_exam_proctoring.vision_jobs(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH')),
  confidence numeric(6,5) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  model text,
  rationale text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_vision_findings_attempt_idx
  ON campusos_exam_proctoring.vision_findings (tenant_id, attempt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.secure_client_enrollment_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  code_hash text NOT NULL UNIQUE,
  label text,
  expires_at timestamptz NOT NULL,
  max_uses integer NOT NULL DEFAULT 1 CHECK (max_uses BETWEEN 1 AND 1000),
  used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  revoked_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS secure_client_enrollment_tenant_idx
  ON campusos_exam_proctoring.secure_client_enrollment_codes (tenant_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.secure_client_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  label text NOT NULL,
  platform text NOT NULL,
  public_key_pem text NOT NULL,
  key_fingerprint text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACTIVE','REVOKED')),
  enrolled_by_code_id uuid REFERENCES campusos_exam_proctoring.secure_client_enrollment_codes(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  last_seen_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, key_fingerprint)
);
CREATE INDEX IF NOT EXISTS secure_client_device_status_idx
  ON campusos_exam_proctoring.secure_client_devices (tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.secure_client_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  nonce_hash text NOT NULL UNIQUE,
  challenge_token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS secure_client_challenge_attempt_idx
  ON campusos_exam_proctoring.secure_client_challenges (tenant_id, attempt_id, expires_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.secure_client_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  device_id uuid NOT NULL REFERENCES campusos_exam_proctoring.secure_client_devices(id) ON DELETE RESTRICT,
  challenge_id uuid NOT NULL UNIQUE REFERENCES campusos_exam_proctoring.secure_client_challenges(id) ON DELETE RESTRICT,
  policy_version text NOT NULL,
  client_version text NOT NULL,
  app_hash text,
  kiosk_mode boolean NOT NULL DEFAULT false,
  extensions_disabled boolean NOT NULL DEFAULT false,
  devtools_restricted boolean NOT NULL DEFAULT false,
  signature_valid boolean NOT NULL DEFAULT false,
  posture jsonb NOT NULL DEFAULT '{}'::jsonb,
  state text NOT NULL DEFAULT 'REVIEW_REQUIRED' CHECK (state IN ('PASS','REVIEW_REQUIRED','FAILED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS secure_client_attestation_attempt_idx
  ON campusos_exam_proctoring.secure_client_attestations (tenant_id, attempt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.runtime_audit_events (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  attempt_id uuid REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_runtime_audit_idx
  ON campusos_exam_proctoring.runtime_audit_events (tenant_id, attempt_id, created_at DESC);