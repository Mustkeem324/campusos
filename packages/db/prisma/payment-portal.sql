-- CampusOS payment orchestration storage.
--
-- Gateway attempts, institution bank-transfer settings and uploaded transfer
-- evidence are intentionally isolated from Prisma's managed public schema.
-- Final confirmed payments are still written to public.payments so existing
-- finance dashboards, invoices and reconciliation continue to use one ledger.

CREATE SCHEMA IF NOT EXISTS campusos_finance;

CREATE TABLE IF NOT EXISTS campusos_finance.payment_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  razorpay_enabled boolean NOT NULL DEFAULT false,
  stripe_enabled boolean NOT NULL DEFAULT false,
  bank_transfer_enabled boolean NOT NULL DEFAULT false,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  account_name text,
  bank_name text,
  account_number text,
  ifsc_code text,
  branch_name text,
  upi_id text,
  payment_instructions text,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_finance.payment_attempts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  payer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  provider_reference text NOT NULL,
  invoice_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'CREATING',
  receipt_number text,
  external_payment_reference text,
  failure_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_attempts_amount CHECK (amount_minor > 0),
  CONSTRAINT payment_attempts_provider CHECK (provider IN ('RAZORPAY', 'STRIPE'))
);

CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_reference_uq
  ON campusos_finance.payment_attempts (provider, provider_reference);
CREATE INDEX IF NOT EXISTS payment_attempts_tenant_created_idx
  ON campusos_finance.payment_attempts (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_attempts_payer_created_idx
  ON campusos_finance.payment_attempts (payer_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS payment_attempts_status_idx
  ON campusos_finance.payment_attempts (status, updated_at DESC);

CREATE TABLE IF NOT EXISTS campusos_finance.manual_payment_submissions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  payer_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  invoice_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  transaction_reference text NOT NULL,
  bank_name text,
  transfer_date date NOT NULL,
  payer_note text,
  proof_file_name text NOT NULL,
  proof_mime_type text NOT NULL,
  proof_bytes bytea NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  receipt_number text,
  reviewer_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT manual_payment_amount CHECK (amount_minor > 0),
  CONSTRAINT manual_payment_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'RECONCILIATION_REQUIRED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS manual_payment_transaction_uq
  ON campusos_finance.manual_payment_submissions (tenant_id, lower(transaction_reference));
CREATE INDEX IF NOT EXISTS manual_payment_tenant_status_idx
  ON campusos_finance.manual_payment_submissions (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS manual_payment_payer_created_idx
  ON campusos_finance.manual_payment_submissions (payer_user_id, created_at DESC);
