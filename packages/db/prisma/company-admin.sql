-- CampusOS company-level commercial control plane.
-- This is intentionally separate from institution-owned academic/finance data.
-- It stores only the SaaS relationship between CampusOS and each institution.

CREATE TABLE IF NOT EXISTS platform_contracts (
  id uuid PRIMARY KEY,
  institution_id uuid NOT NULL UNIQUE REFERENCES institutions(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS platform_contracts_ends_at_idx
  ON platform_contracts (ends_at);
CREATE INDEX IF NOT EXISTS platform_contracts_status_idx
  ON platform_contracts (status);
CREATE INDEX IF NOT EXISTS platform_contracts_account_owner_idx
  ON platform_contracts (account_owner);

CREATE TABLE IF NOT EXISTS platform_admin_events (
  id uuid PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  institution_id uuid REFERENCES institutions(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS platform_admin_events_created_at_idx
  ON platform_admin_events (created_at DESC);
CREATE INDEX IF NOT EXISTS platform_admin_events_institution_idx
  ON platform_admin_events (institution_id, created_at DESC);
