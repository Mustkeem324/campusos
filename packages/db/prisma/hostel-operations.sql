CREATE SCHEMA IF NOT EXISTS campusos_hostel;

CREATE TABLE IF NOT EXISTS campusos_hostel.settings (
  tenant_id UUID PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  enabled BOOLEAN NOT NULL DEFAULT false,
  ownership_mode TEXT NOT NULL DEFAULT 'INSTITUTION' CHECK (ownership_mode IN ('INSTITUTION','THIRD_PARTY','MIXED')),
  allow_hybrid_students BOOLEAN NOT NULL DEFAULT true,
  require_parent_outpass_approval BOOLEAN NOT NULL DEFAULT true,
  require_warden_outpass_approval BOOLEAN NOT NULL DEFAULT true,
  faculty_welfare_visibility BOOLEAN NOT NULL DEFAULT true,
  third_party_sync_enabled BOOLEAN NOT NULL DEFAULT false,
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_hostel.student_profiles (
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  study_mode TEXT CHECK (study_mode IN ('ONLINE','OFFLINE','HYBRID')),
  hostel_enrolled BOOLEAN NOT NULL DEFAULT false,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, student_id)
);

CREATE TABLE IF NOT EXISTS campusos_hostel.providers (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  external_code TEXT,
  token_hash CHAR(64) NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  last_sync_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS hostel_provider_tenant_idx ON campusos_hostel.providers(tenant_id, enabled);

CREATE TABLE IF NOT EXISTS campusos_hostel.facilities (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES campusos_hostel.providers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  building TEXT,
  address TEXT,
  ownership TEXT NOT NULL CHECK (ownership IN ('INSTITUTION','THIRD_PARTY')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, name)
);
CREATE INDEX IF NOT EXISTS hostel_facility_tenant_idx ON campusos_hostel.facilities(tenant_id, active);

CREATE TABLE IF NOT EXISTS campusos_hostel.rooms (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES campusos_hostel.facilities(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  floor_label TEXT,
  capacity INTEGER NOT NULL DEFAULT 1 CHECK (capacity > 0 AND capacity <= 20),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, facility_id, room_number)
);

CREATE TABLE IF NOT EXISTS campusos_hostel.allocations (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  facility_id UUID NOT NULL REFERENCES campusos_hostel.facilities(id) ON DELETE RESTRICT,
  room_id UUID REFERENCES campusos_hostel.rooms(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES campusos_hostel.providers(id) ON DELETE SET NULL,
  external_student_ref TEXT,
  external_allocation_ref TEXT,
  bed_label TEXT,
  meal_plan TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','RESERVED','CHECKED_OUT')),
  source TEXT NOT NULL CHECK (source IN ('INSTITUTION','THIRD_PARTY')),
  starts_on DATE,
  ends_on DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS hostel_one_open_allocation_per_student
  ON campusos_hostel.allocations(tenant_id, student_id)
  WHERE status IN ('ACTIVE','RESERVED');
CREATE INDEX IF NOT EXISTS hostel_allocations_facility_idx ON campusos_hostel.allocations(tenant_id, facility_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS hostel_provider_allocation_ref_idx
  ON campusos_hostel.allocations(provider_id, external_allocation_ref)
  WHERE provider_id IS NOT NULL AND external_allocation_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS campusos_hostel.charges (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  allocation_id UUID REFERENCES campusos_hostel.allocations(id) ON DELETE SET NULL,
  provider_id UUID REFERENCES campusos_hostel.providers(id) ON DELETE SET NULL,
  external_charge_ref TEXT,
  category TEXT NOT NULL CHECK (category IN ('HOSTEL','MESS','MAINTENANCE','SECURITY_DEPOSIT','DAMAGE','OTHER')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  paid_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR',
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'DUE' CHECK (status IN ('DUE','PARTIAL','PAID','WAIVED','DISPUTED')),
  source TEXT NOT NULL CHECK (source IN ('INSTITUTION','THIRD_PARTY')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hostel_charge_student_idx ON campusos_hostel.charges(tenant_id, student_id, status, due_date);
CREATE UNIQUE INDEX IF NOT EXISTS hostel_provider_charge_ref_idx
  ON campusos_hostel.charges(provider_id, external_charge_ref)
  WHERE provider_id IS NOT NULL AND external_charge_ref IS NOT NULL;

CREATE TABLE IF NOT EXISTS campusos_hostel.outpasses (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  reason TEXT,
  departure_at TIMESTAMPTZ NOT NULL,
  expected_return_at TIMESTAMPTZ NOT NULL,
  actual_return_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','APPROVED','REJECTED','OUT','RETURNED','CANCELLED')),
  parent_approval TEXT NOT NULL DEFAULT 'PENDING' CHECK (parent_approval IN ('NOT_REQUIRED','PENDING','APPROVED','REJECTED')),
  warden_approval TEXT NOT NULL DEFAULT 'PENDING' CHECK (warden_approval IN ('NOT_REQUIRED','PENDING','APPROVED','REJECTED')),
  parent_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  warden_approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (expected_return_at > departure_at)
);
CREATE INDEX IF NOT EXISTS hostel_outpass_queue_idx ON campusos_hostel.outpasses(tenant_id, status, departure_at);
CREATE INDEX IF NOT EXISTS hostel_outpass_student_idx ON campusos_hostel.outpasses(tenant_id, student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_hostel.incidents (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  allocation_id UUID REFERENCES campusos_hostel.allocations(id) ON DELETE SET NULL,
  charge_id UUID REFERENCES campusos_hostel.charges(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('DAMAGE','DISCIPLINE','SAFETY','MAINTENANCE')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','UNDER_REVIEW','RESOLVED','CLOSED')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  charge_amount NUMERIC(12,2),
  currency VARCHAR(3),
  reported_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hostel_incident_tenant_idx ON campusos_hostel.incidents(tenant_id, status, occurred_at DESC);

CREATE TABLE IF NOT EXISTS campusos_hostel.provider_sync_runs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES campusos_hostel.providers(id) ON DELETE CASCADE,
  snapshot_ref TEXT NOT NULL,
  received_students INTEGER NOT NULL DEFAULT 0,
  accepted_students INTEGER NOT NULL DEFAULT 0,
  rejected_students INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CHECK (status IN ('ACCEPTED','PARTIAL','REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_id, snapshot_ref)
);
