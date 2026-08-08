CREATE SCHEMA IF NOT EXISTS campusos_exam_proctoring;

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  default_delivery_mode text NOT NULL DEFAULT 'OFFLINE'
    CHECK (default_delivery_mode IN ('OFFLINE','ONLINE_UNPROCTORED','ONLINE_PROCTORED','HUMAN_PROCTORED','AI_ASSISTED_PROCTORED','HYBRID')),
  normal_telemetry_retention_days integer NOT NULL DEFAULT 30 CHECK (normal_telemetry_retention_days BETWEEN 1 AND 3650),
  flagged_evidence_retention_days integer NOT NULL DEFAULT 180 CHECK (flagged_evidence_retention_days BETWEEN 1 AND 3650),
  identity_retention_days integer NOT NULL DEFAULT 30 CHECK (identity_retention_days BETWEEN 1 AND 3650),
  require_terms_acceptance boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.security_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','INACTIVE','ARCHIVED')),
  identity_required boolean NOT NULL DEFAULT false,
  selfie_required boolean NOT NULL DEFAULT false,
  liveness_required boolean NOT NULL DEFAULT false,
  primary_camera_required boolean NOT NULL DEFAULT false,
  microphone_required boolean NOT NULL DEFAULT false,
  screen_share_required boolean NOT NULL DEFAULT false,
  fullscreen_required boolean NOT NULL DEFAULT false,
  second_camera_required boolean NOT NULL DEFAULT false,
  human_admission_required boolean NOT NULL DEFAULT false,
  ai_event_analysis_enabled boolean NOT NULL DEFAULT false,
  clipboard_restricted boolean NOT NULL DEFAULT false,
  permitted_materials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS exam_security_profiles_tenant_status_idx
  ON campusos_exam_proctoring.security_profiles (tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.exam_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  exam_schedule_id uuid REFERENCES public.exam_schedules(id) ON DELETE SET NULL,
  course_offering_id uuid REFERENCES public.course_offerings(id) ON DELETE SET NULL,
  security_profile_id uuid REFERENCES campusos_exam_proctoring.security_profiles(id) ON DELETE SET NULL,
  delivery_mode text NOT NULL CHECK (delivery_mode IN ('OFFLINE','ONLINE_UNPROCTORED','ONLINE_PROCTORED','HUMAN_PROCTORED','AI_ASSISTED_PROCTORED','HYBRID')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','PUBLISHED','LIVE','COMPLETED','CANCELLED','ARCHIVED')),
  starts_at timestamptz,
  ends_at timestamptz,
  duration_minutes integer CHECK (duration_minutes IS NULL OR duration_minutes BETWEEN 1 AND 1440),
  max_attempts integer NOT NULL DEFAULT 1 CHECK (max_attempts BETWEEN 1 AND 20),
  reconnect_grace_seconds integer NOT NULL DEFAULT 120 CHECK (reconnect_grace_seconds BETWEEN 0 AND 3600),
  auto_submit boolean NOT NULL DEFAULT true,
  allow_resume_after_disconnect boolean NOT NULL DEFAULT true,
  instructions text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE UNIQUE INDEX IF NOT EXISTS exam_config_scope_unique
  ON campusos_exam_proctoring.exam_configs (
    tenant_id,
    exam_id,
    COALESCE(course_offering_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
CREATE INDEX IF NOT EXISTS exam_configs_tenant_status_time_idx
  ON campusos_exam_proctoring.exam_configs (tenant_id, status, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS exam_configs_course_idx
  ON campusos_exam_proctoring.exam_configs (tenant_id, course_offering_id, starts_at);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.terms_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  version text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  effective_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, version)
);
CREATE INDEX IF NOT EXISTS exam_terms_tenant_effective_idx
  ON campusos_exam_proctoring.terms_versions (tenant_id, effective_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_config_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_configs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attempt_no integer NOT NULL DEFAULT 1 CHECK (attempt_no BETWEEN 1 AND 20),
  status text NOT NULL DEFAULT 'PRECHECK_AVAILABLE'
    CHECK (status IN ('SCHEDULED','PRECHECK_AVAILABLE','VERIFICATION_PENDING','WAITING_ROOM','APPROVED','READY','IN_PROGRESS','RECONNECTING','SUBMITTED','AUTO_SUBMITTED','TECHNICAL_REVIEW','PROCTORING_REVIEW','COMPLETED','CANCELLED')),
  integrity_state text NOT NULL DEFAULT 'NO_ISSUE'
    CHECK (integrity_state IN ('NO_ISSUE','REVIEW_REQUIRED','POLICY_CONCERN','FORMAL_CASE_REQUIRED','CLEARED')),
  technical_state text NOT NULL DEFAULT 'OK'
    CHECK (technical_state IN ('OK','DEGRADED','DISCONNECTED','REVIEW_REQUIRED')),
  started_at timestamptz,
  deadline_at timestamptz,
  submitted_at timestamptz,
  last_saved_at timestamptz,
  admitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  admitted_at timestamptz,
  submission_reference text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, exam_config_id, student_id, attempt_no),
  UNIQUE (submission_reference)
);
CREATE INDEX IF NOT EXISTS exam_attempt_student_idx
  ON campusos_exam_proctoring.exam_attempts (tenant_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS exam_attempt_live_idx
  ON campusos_exam_proctoring.exam_attempts (tenant_id, exam_config_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.terms_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_config_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_configs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  terms_version_id uuid NOT NULL REFERENCES campusos_exam_proctoring.terms_versions(id) ON DELETE RESTRICT,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  UNIQUE (tenant_id, exam_config_id, student_id, terms_version_id)
);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.identity_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('INSTITUTION_ID','DIGITAL_ID','SELFIE','FACE_MATCH','LIVENESS','HUMAN_REVIEW')),
  provider text,
  provider_reference text,
  state text NOT NULL DEFAULT 'REVIEW_REQUIRED'
    CHECK (state IN ('PENDING','MATCH','POSSIBLE_MATCH','REVIEW_REQUIRED','FAILED','PROVIDER_UNAVAILABLE','APPROVED','REJECTED')),
  confidence numeric(6,5) CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1)),
  evidence_object_key text,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  reviewer_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_identity_attempt_idx
  ON campusos_exam_proctoring.identity_verifications (tenant_id, attempt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.device_prechecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL UNIQUE REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  browser_supported boolean NOT NULL DEFAULT false,
  camera_ready boolean NOT NULL DEFAULT false,
  microphone_ready boolean NOT NULL DEFAULT false,
  screen_share_ready boolean NOT NULL DEFAULT false,
  fullscreen_ready boolean NOT NULL DEFAULT false,
  second_camera_ready boolean NOT NULL DEFAULT false,
  network_quality text NOT NULL DEFAULT 'UNKNOWN' CHECK (network_quality IN ('UNKNOWN','POOR','FAIR','GOOD','EXCELLENT')),
  state text NOT NULL DEFAULT 'INCOMPLETE' CHECK (state IN ('INCOMPLETE','READY','REVIEW_REQUIRED','FAILED')),
  client_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  checked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.proctor_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_config_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_configs(id) ON DELETE CASCADE,
  proctor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','REVOKED','COMPLETED')),
  assigned_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, exam_config_id, proctor_user_id)
);
CREATE INDEX IF NOT EXISTS proctor_assignments_user_idx
  ON campusos_exam_proctoring.proctor_assignments (tenant_id, proctor_user_id, status);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.secondary_camera_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL UNIQUE REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  pairing_token_hash text NOT NULL UNIQUE,
  pairing_code_hash text NOT NULL,
  status text NOT NULL DEFAULT 'PAIRING'
    CHECK (status IN ('PAIRING','PAIRED','CONNECTED','DEGRADED','DISCONNECTED','CLOSED','EXPIRED')),
  paired_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  device_reference text,
  expires_at timestamptz NOT NULL,
  paired_at timestamptz,
  connected_at timestamptz,
  disconnected_at timestamptz,
  last_heartbeat_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS secondary_camera_status_idx
  ON campusos_exam_proctoring.secondary_camera_sessions (tenant_id, status, last_heartbeat_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.secondary_camera_signals (
  id bigserial PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  secondary_camera_session_id uuid NOT NULL REFERENCES campusos_exam_proctoring.secondary_camera_sessions(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('LAPTOP','MOBILE','PROCTOR')),
  signal_type text NOT NULL CHECK (signal_type IN ('OFFER','ANSWER','ICE','CONTROL')),
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  consumed_at timestamptz
);
CREATE INDEX IF NOT EXISTS secondary_camera_signal_poll_idx
  ON campusos_exam_proctoring.secondary_camera_signals (secondary_camera_session_id, id);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.proctoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('SYSTEM','PRIMARY_CAMERA','SECONDARY_CAMERA','SCREEN','AUDIO','NETWORK','AI','PROCTOR')),
  event_type text NOT NULL,
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH')),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS proctoring_events_attempt_idx
  ON campusos_exam_proctoring.proctoring_events (tenant_id, attempt_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS proctoring_events_attention_idx
  ON campusos_exam_proctoring.proctoring_events (tenant_id, severity, reviewed_at, occurred_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.proctor_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  proctor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  category text NOT NULL CHECK (category IN ('INFORMATIONAL','WARNING','TECHNICAL','INTEGRITY_CONCERN','CRITICAL_INCIDENT')),
  severity text NOT NULL DEFAULT 'INFO' CHECK (severity IN ('INFO','LOW','MEDIUM','HIGH')),
  description text NOT NULL,
  evidence_event_id uuid REFERENCES campusos_exam_proctoring.proctoring_events(id) ON DELETE SET NULL,
  supersedes_report_id uuid REFERENCES campusos_exam_proctoring.proctor_reports(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS proctor_reports_attempt_idx
  ON campusos_exam_proctoring.proctor_reports (tenant_id, attempt_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.integrity_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL UNIQUE REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'REVIEW_REQUIRED'
    CHECK (state IN ('NO_ISSUE','TECHNICAL_ISSUE','REVIEW_REQUIRED','POLICY_CONCERN','FORMAL_CASE_REQUIRED','CLEARED')),
  reviewer_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  rationale text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.question_bank (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  question_type text NOT NULL CHECK (question_type IN ('SINGLE_CHOICE','MULTIPLE_CHOICE','TRUE_FALSE','SHORT_TEXT','LONG_TEXT','NUMERIC','FILE_UPLOAD','CODE','MATCHING','ORDERING','CASE_STUDY')),
  prompt text NOT NULL,
  options jsonb,
  answer_key jsonb,
  max_marks numeric(8,2) NOT NULL DEFAULT 1 CHECK (max_marks > 0),
  difficulty text NOT NULL DEFAULT 'MEDIUM' CHECK (difficulty IN ('EASY','MEDIUM','HARD')),
  status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','APPROVED','RETIRED')),
  tags text[] NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS question_bank_course_idx
  ON campusos_exam_proctoring.question_bank (tenant_id, course_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  exam_config_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_configs(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES campusos_exam_proctoring.question_bank(id) ON DELETE RESTRICT,
  section_title text NOT NULL DEFAULT 'Main',
  position integer NOT NULL CHECK (position >= 0),
  marks numeric(8,2) NOT NULL CHECK (marks > 0),
  required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, exam_config_id, question_id),
  UNIQUE (tenant_id, exam_config_id, section_title, position)
);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.attempt_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_id uuid NOT NULL REFERENCES campusos_exam_proctoring.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES campusos_exam_proctoring.question_bank(id) ON DELETE RESTRICT,
  section_title text NOT NULL,
  display_order integer NOT NULL CHECK (display_order >= 0),
  marks numeric(8,2) NOT NULL CHECK (marks > 0),
  prompt_snapshot text NOT NULL,
  options_snapshot jsonb,
  option_order jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, attempt_id, question_id),
  UNIQUE (tenant_id, attempt_id, display_order)
);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.answer_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  attempt_question_id uuid NOT NULL REFERENCES campusos_exam_proctoring.attempt_questions(id) ON DELETE CASCADE,
  revision_no integer NOT NULL CHECK (revision_no >= 1),
  answer jsonb NOT NULL,
  idempotency_key text,
  saved_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_question_id, revision_no),
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX IF NOT EXISTS answer_revisions_question_idx
  ON campusos_exam_proctoring.answer_revisions (tenant_id, attempt_question_id, revision_no DESC);

CREATE TABLE IF NOT EXISTS campusos_exam_proctoring.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS exam_proctoring_audit_tenant_created_idx
  ON campusos_exam_proctoring.audit_events (tenant_id, created_at DESC);
