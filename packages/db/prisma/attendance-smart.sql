CREATE SCHEMA IF NOT EXISTS campusos_attendance;

CREATE TABLE IF NOT EXISTS campusos_attendance.settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  required_percentage numeric(5,2) NOT NULL DEFAULT 75.00 CHECK (required_percentage >= 0 AND required_percentage <= 100),
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  allow_offline_self_checkin boolean NOT NULL DEFAULT true,
  require_online_face boolean NOT NULL DEFAULT true,
  require_offline_self_face boolean NOT NULL DEFAULT true,
  allow_hybrid_daily_checkin boolean NOT NULL DEFAULT true,
  checkin_early_minutes integer NOT NULL DEFAULT 15 CHECK (checkin_early_minutes BETWEEN 0 AND 120),
  checkin_late_minutes integer NOT NULL DEFAULT 20 CHECK (checkin_late_minutes BETWEEN 0 AND 180),
  checkout_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_attendance.student_profiles (
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  study_mode text NOT NULL CHECK (study_mode IN ('ONLINE','OFFLINE','HYBRID')),
  self_checkin_enabled boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, student_id)
);

CREATE TABLE IF NOT EXISTS campusos_attendance.calendar_days (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  calendar_date date NOT NULL,
  day_type text NOT NULL CHECK (day_type IN ('WORKING','HOLIDAY','INSTITUTION_CLOSED','EXAM','EVENT','SPECIAL_WORKING')),
  title text NOT NULL,
  description text,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.sections(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (((program_id IS NOT NULL)::int + (batch_id IS NOT NULL)::int + (section_id IS NOT NULL)::int) <= 1)
);

CREATE UNIQUE INDEX IF NOT EXISTS attendance_calendar_scope_unique
  ON campusos_attendance.calendar_days (
    tenant_id,
    calendar_date,
    COALESCE(program_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(batch_id, '00000000-0000-0000-0000-000000000000'::uuid),
    COALESCE(section_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );
CREATE INDEX IF NOT EXISTS attendance_calendar_tenant_date_idx
  ON campusos_attendance.calendar_days (tenant_id, calendar_date);

CREATE TABLE IF NOT EXISTS campusos_attendance.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  course_offering_id uuid NOT NULL REFERENCES public.course_offerings(id) ON DELETE CASCADE,
  timetable_slot_id uuid REFERENCES public.timetable_slots(id) ON DELETE SET NULL,
  session_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED','OPEN','SUBMITTED','CANCELLED')),
  title text,
  opened_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_at timestamptz,
  core_session_id uuid REFERENCES public.attendance_sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, timetable_slot_id, session_date)
);
CREATE INDEX IF NOT EXISTS attendance_sessions_course_date_idx
  ON campusos_attendance.sessions (tenant_id, course_offering_id, session_date);
CREATE INDEX IF NOT EXISTS attendance_sessions_status_idx
  ON campusos_attendance.sessions (tenant_id, status, session_date);

CREATE TABLE IF NOT EXISTS campusos_attendance.face_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('CLASS_CHECKIN','DAY_CHECKIN')),
  provider_verification_id text NOT NULL,
  confidence numeric(6,5),
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attendance_face_student_idx
  ON campusos_attendance.face_verifications (tenant_id, student_id, verified_at DESC);

CREATE TABLE IF NOT EXISTS campusos_attendance.daily_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  study_mode text NOT NULL CHECK (study_mode IN ('OFFLINE','HYBRID')),
  face_verification_id uuid NOT NULL REFERENCES campusos_attendance.face_verifications(id) ON DELETE RESTRICT,
  checked_in_at timestamptz NOT NULL DEFAULT now(),
  checked_out_at timestamptz,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','COMPLETED','VOID')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, student_id, attendance_date)
);

CREATE TABLE IF NOT EXISTS campusos_attendance.marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  session_id uuid NOT NULL REFERENCES campusos_attendance.sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('PRESENT','ABSENT','LATE','EXCUSED')),
  method text NOT NULL CHECK (method IN ('MANUAL','FACE_CLASS','FACE_DAILY','OVERRIDE')),
  face_verification_id uuid REFERENCES campusos_attendance.face_verifications(id) ON DELETE SET NULL,
  daily_presence_id uuid REFERENCES campusos_attendance.daily_presence(id) ON DELETE SET NULL,
  checked_in_at timestamptz,
  checked_out_at timestamptz,
  marked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
CREATE INDEX IF NOT EXISTS attendance_marks_student_idx
  ON campusos_attendance.marks (tenant_id, student_id, session_id);

CREATE TABLE IF NOT EXISTS campusos_attendance.audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  subject_type text NOT NULL,
  subject_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS attendance_audit_tenant_created_idx
  ON campusos_attendance.audit_events (tenant_id, created_at DESC);
