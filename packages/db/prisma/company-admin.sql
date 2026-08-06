-- CampusOS company-level commercial control plane.
-- The control plane lives outside Prisma's managed `public` schema so normal
-- tenant db-push operations cannot treat commercial history as unmanaged data.

CREATE SCHEMA IF NOT EXISTS campusos_control;

CREATE TABLE IF NOT EXISTS campusos_control.platform_contracts (
  id uuid PRIMARY KEY,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  contract_number text NOT NULL UNIQUE,
  plan_name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  currency varchar(3) NOT NULL DEFAULT 'INR',
  contract_value_minor bigint NOT NULL DEFAULT 0,
  billing_cycle text NOT NULL DEFAULT 'ANNUAL',
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  auto_renew boolean NOT NULL DEFAULT false,
  renewal_notice_days integer NOT NULL DEFAULT 60,
  licensed_students integer,
  licensed_staff integer,
  modules jsonb NOT NULL DEFAULT '[]'::jsonb,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  account_owner text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_contracts_dates CHECK (ends_at > starts_at),
  CONSTRAINT platform_contracts_value CHECK (contract_value_minor >= 0),
  CONSTRAINT platform_contracts_notice CHECK (renewal_notice_days BETWEEN 0 AND 3650)
);

-- An early preview version used one contract per institution. Remove that
-- constraint defensively so subsequent renewals preserve signed history.
ALTER TABLE campusos_control.platform_contracts
  DROP CONSTRAINT IF EXISTS platform_contracts_institution_id_key;

CREATE INDEX IF NOT EXISTS platform_contracts_institution_idx
  ON campusos_control.platform_contracts (institution_id, ends_at DESC);
CREATE INDEX IF NOT EXISTS platform_contracts_ends_at_idx
  ON campusos_control.platform_contracts (ends_at);
CREATE INDEX IF NOT EXISTS platform_contracts_status_idx
  ON campusos_control.platform_contracts (status);
CREATE INDEX IF NOT EXISTS platform_contracts_account_owner_idx
  ON campusos_control.platform_contracts (account_owner);

CREATE TABLE IF NOT EXISTS campusos_control.platform_admin_events (
  id uuid PRIMARY KEY,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_admin_events_created_at_idx
  ON campusos_control.platform_admin_events (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_admin_events_institution_idx
  ON campusos_control.platform_admin_events (institution_id, created_at DESC);
