-- NAVEMORA Fees, Finance & Scholarship Management 2.0 operational storage.
--
-- Extends the existing campusos_finance schema (payment_settings, payment_attempts,
-- manual_payment_submissions) with the advanced finance ledger, fee structure
-- engine, invoice registry, installment plans, refund workflow, credit/debit
-- notes, financial holds, scholarship programs/applications/awards, sponsors,
-- receipt registry and finance audit trail.
--
-- All authoritative money values are stored as integer minor units (bigint),
-- e.g. INR amounts in paise. Never convert these to Float for authoritative math.
--
-- The file is intentionally idempotent: every statement is CREATE ... IF NOT
-- EXISTS / DROP ... IF EXISTS guarded and safe to re-run against live databases.

CREATE SCHEMA IF NOT EXISTS campusos_finance;

-- ---------------------------------------------------------------------------
-- Institution finance policy settings (single row per tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.finance_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  invoice_prefix text NOT NULL DEFAULT 'INV',
  invoice_year_format text NOT NULL DEFAULT 'YYYY',
  invoice_sequence_start bigint NOT NULL DEFAULT 1,
  invoice_sequence_next bigint NOT NULL DEFAULT 1,
  allow_partial_payments boolean NOT NULL DEFAULT true,
  allow_overpayment_credit boolean NOT NULL DEFAULT false,
  late_fee_model text NOT NULL DEFAULT 'NONE',
  late_fee_amount_minor bigint NOT NULL DEFAULT 0,
  late_fee_percentage numeric(7,4) NOT NULL DEFAULT 0,
  late_fee_daily boolean NOT NULL DEFAULT false,
  late_fee_grace_days int NOT NULL DEFAULT 0,
  late_fee_max_minor bigint NOT NULL DEFAULT 0,
  scholarship_stacking_policy text NOT NULL DEFAULT 'NO_STACKING',
  scholarship_max_discount_pct numeric(7,4) NOT NULL DEFAULT 100,
  refund_requires_maker_checker boolean NOT NULL DEFAULT true,
  refund_high_value_minor bigint NOT NULL DEFAULT 0,
  exam_requires_clearance boolean NOT NULL DEFAULT false,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT finance_settings_timezone CHECK (char_length(timezone) BETWEEN 1 AND 64),
  CONSTRAINT finance_settings_late_fee_model CHECK (late_fee_model IN ('NONE', 'FIXED', 'PERCENTAGE', 'DAILY')),
  CONSTRAINT finance_settings_stacking CHECK (scholarship_stacking_policy IN ('NO_STACKING', 'LIMITED', 'UNLIMITED'))
);

-- ---------------------------------------------------------------------------
-- Configurable fee categories
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.fee_categories (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  code text NOT NULL,
  label text NOT NULL,
  description text,
  is_refundable boolean NOT NULL DEFAULT false,
  is_mandatory boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fee_categories_tenant_code_uq UNIQUE (tenant_id, code)
);

-- ---------------------------------------------------------------------------
-- Versioned institutional fee structures (operational source of truth)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.fee_structures (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  legacy_id uuid REFERENCES public.fee_structures(id) ON DELETE SET NULL,
  version int NOT NULL DEFAULT 1,
  name text NOT NULL,
  category_id uuid REFERENCES campusos_finance.fee_categories(id) ON DELETE SET NULL,
  category_code text,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  program_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  batch_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  semester text,
  study_modes jsonb NOT NULL DEFAULT '["OFFLINE","HYBRID","ONLINE"]'::jsonb,
  service_scope jsonb NOT NULL DEFAULT '["ACADEMIC"]'::jsonb,
  recurring boolean NOT NULL DEFAULT false,
  is_refundable boolean NOT NULL DEFAULT false,
  is_mandatory boolean NOT NULL DEFAULT true,
  tax_name text,
  tax_rate numeric(7,4) NOT NULL DEFAULT 0,
  tax_applicable boolean NOT NULL DEFAULT false,
  effective_from date NOT NULL,
  effective_until date,
  due_date_rule text NOT NULL DEFAULT 'END_OF_TERM',
  due_date_offset_days int NOT NULL DEFAULT 0,
  installment_eligibility boolean NOT NULL DEFAULT false,
  max_installments int NOT NULL DEFAULT 1,
  scholarship_eligible boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fee_structures_amount CHECK (amount_minor >= 0),
  CONSTRAINT fee_structures_status CHECK (status IN ('ACTIVE', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS fee_structures_tenant_status_idx
  ON campusos_finance.fee_structures (tenant_id, status, effective_from DESC);
CREATE INDEX IF NOT EXISTS fee_structures_tenant_category_idx
  ON campusos_finance.fee_structures (tenant_id, category_code);

-- ---------------------------------------------------------------------------
-- Fee structure component heads (itemized lines inside a structure)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.fee_structure_components (
  id uuid PRIMARY KEY,
  fee_structure_id uuid NOT NULL REFERENCES campusos_finance.fee_structures(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  category_code text,
  amount_minor bigint NOT NULL,
  is_recurring boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  CONSTRAINT fee_structure_components_amount CHECK (amount_minor >= 0)
);

CREATE INDEX IF NOT EXISTS fee_structure_components_structure_idx
  ON campusos_finance.fee_structure_components (fee_structure_id, sort_order);

-- ---------------------------------------------------------------------------
-- Central student financial ledger (single source of financial history)
-- Defined after refund_requests and scholarship_awards so the foreign keys
-- below can reference tables that already exist on first provision.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Invoice registry (institution-scoped sequential invoice numbering)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.invoice_registry (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  issued_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT invoice_registry_tenant_number_uq UNIQUE (tenant_id, invoice_number),
  CONSTRAINT invoice_registry_invoice_uq UNIQUE (invoice_id)
);

CREATE INDEX IF NOT EXISTS invoice_registry_tenant_issued_idx
  ON campusos_finance.invoice_registry (tenant_id, issued_at DESC);

-- ---------------------------------------------------------------------------
-- Installment plans for invoices
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.installments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  installment_number int NOT NULL,
  amount_minor bigint NOT NULL,
  due_date date NOT NULL,
  paid_minor bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'PENDING',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT installments_amount CHECK (amount_minor > 0),
  CONSTRAINT installments_paid CHECK (paid_minor >= 0),
  CONSTRAINT installments_status CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED')),
  CONSTRAINT installments_invoice_number_uq UNIQUE (invoice_id, installment_number)
);

CREATE INDEX IF NOT EXISTS installments_tenant_invoice_idx
  ON campusos_finance.installments (tenant_id, invoice_id, installment_number);

-- ---------------------------------------------------------------------------
-- Refund workflow (maker-checker capable, auditable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.refund_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  requested_minor bigint NOT NULL,
  approved_minor bigint,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'REQUESTED',
  reason text NOT NULL,
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL,
  reviewer_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_note text,
  reviewed_at timestamptz,
  completion_reference text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT refund_requests_amount CHECK (requested_minor > 0),
  CONSTRAINT refund_requests_approved CHECK (approved_minor IS NULL OR approved_minor > 0),
  CONSTRAINT refund_requests_status CHECK (
    status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')
  ),
  CONSTRAINT refund_requests_student_payment_uq UNIQUE (student_id, payment_id, requested_minor, status)
);

CREATE INDEX IF NOT EXISTS refund_requests_tenant_status_idx
  ON campusos_finance.refund_requests (tenant_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS refund_requests_student_idx
  ON campusos_finance.refund_requests (tenant_id, student_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Credit and debit notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.credit_notes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  reason text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'ISSUED',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT credit_notes_amount CHECK (amount_minor > 0),
  CONSTRAINT credit_notes_status CHECK (status IN ('ISSUED', 'APPLIED', 'VOID'))
);

CREATE INDEX IF NOT EXISTS credit_notes_tenant_student_idx
  ON campusos_finance.credit_notes (tenant_id, student_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_finance.debit_notes (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  reason text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'ISSUED',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT debit_notes_amount CHECK (amount_minor > 0),
  CONSTRAINT debit_notes_status CHECK (status IN ('ISSUED', 'APPLIED', 'VOID'))
);

CREATE INDEX IF NOT EXISTS debit_notes_tenant_student_idx
  ON campusos_finance.debit_notes (tenant_id, student_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Financial holds (exam/document/registration restrictions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.financial_holds (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  reason text NOT NULL,
  amount_minor bigint NOT NULL DEFAULT 0,
  impact_scope jsonb NOT NULL DEFAULT '["EXAM_REGISTRATION","DOCUMENT_ISSUANCE","REGISTRATION"]'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  resolution_note text,
  resolved_at timestamptz,
  CONSTRAINT financial_holds_status CHECK (status IN ('ACTIVE', 'RESOLVED'))
);

CREATE INDEX IF NOT EXISTS financial_holds_tenant_status_idx
  ON campusos_finance.financial_holds (tenant_id, status, student_id);

-- ---------------------------------------------------------------------------
-- Scholarship programs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.scholarship_programs (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text,
  description text,
  academic_year_id uuid REFERENCES public.academic_years(id) ON DELETE SET NULL,
  program_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  value_type text NOT NULL,
  fixed_amount_minor bigint NOT NULL DEFAULT 0,
  percentage numeric(7,4) NOT NULL DEFAULT 0,
  cap_minor bigint NOT NULL DEFAULT 0,
  applies_to_components jsonb NOT NULL DEFAULT '["TUITION"]'::jsonb,
  budget_minor bigint NOT NULL DEFAULT 0,
  awarded_minor bigint NOT NULL DEFAULT 0,
  min_cgpa numeric(5,2),
  min_attendance_pct numeric(5,2),
  stacking_allowed boolean NOT NULL DEFAULT false,
  max_discount_pct numeric(7,4) NOT NULL DEFAULT 100,
  application_opens date,
  application_closes date,
  required_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'DRAFT',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_programs_value_type CHECK (value_type IN ('FIXED', 'PERCENTAGE', 'FULL_TUITION', 'PARTIAL_TUITION', 'COMPONENT', 'CAPPED')),
  CONSTRAINT scholarship_programs_budget CHECK (budget_minor >= 0 AND awarded_minor >= 0),
  CONSTRAINT scholarship_programs_cap CHECK (cap_minor >= 0),
  CONSTRAINT scholarship_programs_status CHECK (status IN ('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'))
);

CREATE INDEX IF NOT EXISTS scholarship_programs_tenant_status_idx
  ON campusos_finance.scholarship_programs (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Scholarship applications
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.scholarship_applications (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES campusos_finance.scholarship_programs(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'DRAFT',
  statement text,
  document_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewer_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewer_note text,
  reviewed_at timestamptz,
  applied_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT scholarship_applications_status CHECK (
    status IN ('DRAFT', 'SUBMITTED', 'DOCUMENTS_PENDING', 'UNDER_REVIEW', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WAITLISTED', 'CANCELLED', 'EXPIRED')
  ),
  CONSTRAINT scholarship_applications_program_student_uq UNIQUE (program_id, student_id)
);

CREATE INDEX IF NOT EXISTS scholarship_applications_tenant_student_idx
  ON campusos_finance.scholarship_applications (tenant_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scholarship_applications_tenant_status_idx
  ON campusos_finance.scholarship_applications (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Scholarship awards (ledger credits + budget utilization)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.scholarship_awards (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES campusos_finance.scholarship_programs(id) ON DELETE CASCADE,
  application_id uuid REFERENCES campusos_finance.scholarship_applications(id) ON DELETE SET NULL,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  gross_eligible_minor bigint NOT NULL DEFAULT 0,
  awarded_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  applies_to_components jsonb NOT NULL DEFAULT '["TUITION"]'::jsonb,
  applied_invoice_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'APPROVED',
  approved_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approved_role text NOT NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  note text,
  CONSTRAINT scholarship_awards_awarded CHECK (awarded_minor > 0),
  CONSTRAINT scholarship_awards_status CHECK (status IN ('APPROVED', 'REVOKED', 'EXPIRED'))
);

CREATE INDEX IF NOT EXISTS scholarship_awards_tenant_student_idx
  ON campusos_finance.scholarship_awards (tenant_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS scholarship_awards_tenant_program_idx
  ON campusos_finance.scholarship_awards (tenant_id, program_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Central student financial ledger (single source of financial history)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.ledger_entries (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  debit_minor bigint NOT NULL DEFAULT 0,
  credit_minor bigint NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  refund_id uuid REFERENCES campusos_finance.refund_requests(id) ON DELETE SET NULL,
  award_id uuid REFERENCES campusos_finance.scholarship_awards(id) ON DELETE SET NULL,
  reference text,
  reason text,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT ledger_entries_type CHECK (
    entry_type IN (
      'INVOICE_CHARGE', 'SCHOLARSHIP_CREDIT', 'CONCESSION', 'WAIVER',
      'PAYMENT', 'REFUND', 'CREDIT_NOTE', 'DEBIT_NOTE', 'LATE_FEE',
      'SECURITY_DEPOSIT', 'DEPOSIT_REFUND', 'ADJUSTMENT', 'SPONSOR_CREDIT'
    )
  ),
  CONSTRAINT ledger_entries_non_negative CHECK (debit_minor >= 0 AND credit_minor >= 0),
  CONSTRAINT ledger_entries_not_both_zero CHECK (NOT (debit_minor = 0 AND credit_minor = 0))
);

CREATE INDEX IF NOT EXISTS ledger_entries_student_idx
  ON campusos_finance.ledger_entries (tenant_id, student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ledger_entries_invoice_idx
  ON campusos_finance.ledger_entries (tenant_id, invoice_id);
CREATE INDEX IF NOT EXISTS ledger_entries_type_idx
  ON campusos_finance.ledger_entries (tenant_id, entry_type, created_at DESC);

-- ---------------------------------------------------------------------------
-- Sponsors and sponsor allocations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.sponsors (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  sponsor_type text NOT NULL DEFAULT 'CORPORATE',
  contact_email text,
  contact_phone text,
  reference text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsors_type CHECK (sponsor_type IN ('EMPLOYER', 'GOVERNMENT', 'NGO', 'CORPORATE', 'CSR', 'OTHER')),
  CONSTRAINT sponsors_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE TABLE IF NOT EXISTS campusos_finance.sponsor_allocations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  sponsor_id uuid NOT NULL REFERENCES campusos_finance.sponsors(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  covered_minor bigint NOT NULL,
  covered_components jsonb NOT NULL DEFAULT '[]'::jsonb,
  sponsor_invoice_reference text,
  received_minor bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'COMMITTED',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT sponsor_allocations_covered CHECK (covered_minor > 0),
  CONSTRAINT sponsor_allocations_received CHECK (received_minor >= 0),
  CONSTRAINT sponsor_allocations_status CHECK (status IN ('COMMITTED', 'SETTLED', 'PARTIAL', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS sponsor_allocations_tenant_sponsor_idx
  ON campusos_finance.sponsor_allocations (tenant_id, sponsor_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Receipt registry (confirmed payments only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.receipt_registry (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  receipt_number text NOT NULL,
  verify_reference text NOT NULL,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  payment_method text NOT NULL,
  status text NOT NULL DEFAULT 'VALID',
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT receipt_registry_payment_uq UNIQUE (payment_id),
  CONSTRAINT receipt_registry_receipt_uq UNIQUE (tenant_id, receipt_number),
  CONSTRAINT receipt_registry_verify_uq UNIQUE (tenant_id, verify_reference),
  CONSTRAINT receipt_registry_status CHECK (status IN ('VALID', 'REVOKED', 'SUPERSEDED'))
);

CREATE INDEX IF NOT EXISTS receipt_registry_tenant_issued_idx
  ON campusos_finance.receipt_registry (tenant_id, issued_at DESC);

-- ---------------------------------------------------------------------------
-- Finance audit events (immutable trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_finance.finance_audit_events (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  actor_role text NOT NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS finance_audit_events_tenant_idx
  ON campusos_finance.finance_audit_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS finance_audit_events_actor_idx
  ON campusos_finance.finance_audit_events (actor_user_id, created_at DESC);
