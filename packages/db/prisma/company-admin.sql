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

-- Public contact submissions are company-owned CRM data, not institution-owned
-- tenant records. They stay in the control schema and are visible only through
-- the SUPER_ADMIN company control plane.
CREATE TABLE IF NOT EXISTS campusos_control.platform_contact_inquiries (
  id uuid PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  institution text NOT NULL,
  role text,
  country text,
  inquiry_type text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'NEW',
  priority text NOT NULL DEFAULT 'NORMAL',
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  consent boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'PUBLIC_CONTACT',
  first_response_at timestamptz,
  resolved_at timestamptz,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_contact_inquiries_status CHECK (status IN ('NEW', 'OPEN', 'WAITING_CUSTOMER', 'RESOLVED', 'SPAM')),
  CONSTRAINT platform_contact_inquiries_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'))
);

CREATE INDEX IF NOT EXISTS platform_contact_inquiries_status_idx
  ON campusos_control.platform_contact_inquiries (status, last_message_at DESC);
CREATE INDEX IF NOT EXISTS platform_contact_inquiries_priority_idx
  ON campusos_control.platform_contact_inquiries (priority, last_message_at DESC);
CREATE INDEX IF NOT EXISTS platform_contact_inquiries_email_idx
  ON campusos_control.platform_contact_inquiries (lower(email));
CREATE INDEX IF NOT EXISTS platform_contact_inquiries_created_at_idx
  ON campusos_control.platform_contact_inquiries (created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_control.platform_contact_messages (
  id uuid PRIMARY KEY,
  inquiry_id uuid NOT NULL REFERENCES campusos_control.platform_contact_inquiries(id) ON DELETE CASCADE,
  direction text NOT NULL,
  author_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sender_email text NOT NULL,
  recipient_email text NOT NULL,
  subject text NOT NULL,
  body_text text NOT NULL,
  delivery_status text NOT NULL,
  provider_message_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT platform_contact_messages_direction CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  CONSTRAINT platform_contact_messages_delivery CHECK (delivery_status IN ('RECEIVED', 'QUEUED', 'SENT', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS platform_contact_messages_inquiry_idx
  ON campusos_control.platform_contact_messages (inquiry_id, created_at ASC);
CREATE INDEX IF NOT EXISTS platform_contact_messages_delivery_idx
  ON campusos_control.platform_contact_messages (delivery_status, created_at DESC);
