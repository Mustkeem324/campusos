-- NAVEMORA Faculty, HR, Payroll & Workforce Management 2.0 operational storage.
--
-- Isolated idempotent PostgreSQL schema (campusos_workforce) that extends the
-- existing public core (User, Staff, Department, Campus, Institution,
-- CourseOffering, TimetableSlot) without destabilizing the Prisma academic
-- schema. Reuses core identity tables; never duplicates them.
--
-- All authoritative monetary values are integer minor units (bigint), e.g.
-- INR amounts in paise. Never convert these to Float for authoritative math.
--
-- The file is intentionally idempotent: every statement is CREATE ... IF NOT
-- EXISTS / DROP ... IF EXISTS guarded and safe to re-run against live
-- databases.
--
-- Table creation order matters: tables that reference other workforce tables
-- are created after their dependencies so a first provision never fails.

CREATE SCHEMA IF NOT EXISTS campusos_workforce;

-- ---------------------------------------------------------------------------
-- Institution workforce policy settings (single row per tenant)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.workforce_settings (
  tenant_id uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  timezone text NOT NULL DEFAULT 'Asia/Kolkata',
  employee_number_prefix text NOT NULL DEFAULT 'NAV/EMP',
  employee_number_year_format text NOT NULL DEFAULT 'YYYY',
  employee_sequence_start bigint NOT NULL DEFAULT 1,
  employee_sequence_next bigint NOT NULL DEFAULT 1,
  attendance_day_start text NOT NULL DEFAULT '00:00',
  overnight_shift_allowed boolean NOT NULL DEFAULT true,
  missing_checkout_grace_minutes int NOT NULL DEFAULT 30,
  leave_balance_enforced boolean NOT NULL DEFAULT true,
  leave_approval_maker_checker boolean NOT NULL DEFAULT false,
  leave_deduction_on_approval boolean NOT NULL DEFAULT true,
  leave_cancellation_restores boolean NOT NULL DEFAULT true,
  unpaid_leave_basis text NOT NULL DEFAULT 'WORKING_DAYS',
  payroll_maker_checker boolean NOT NULL DEFAULT true,
  payroll_monthly_divisor int NOT NULL DEFAULT 30,
  payroll_protect_closed boolean NOT NULL DEFAULT true,
  payroll_require_disbursement_confirmation boolean NOT NULL DEFAULT true,
  final_settlement_maker_checker boolean NOT NULL DEFAULT true,
  probation_days int NOT NULL DEFAULT 180,
  notice_period_days int NOT NULL DEFAULT 60,
  updated_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workforce_settings_timezone CHECK (char_length(timezone) BETWEEN 1 AND 64),
  CONSTRAINT workforce_settings_unpaid_basis CHECK (unpaid_leave_basis IN ('CALENDAR_DAYS', 'WORKING_DAYS')),
  CONSTRAINT workforce_settings_divisor CHECK (payroll_monthly_divisor BETWEEN 1 AND 31)
);

-- ---------------------------------------------------------------------------
-- Authoritative employee master profiles (one per staff member)
-- Links to public.staff (and therefore public.users) — never a duplicate copy
-- of the core identity.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.employee_profiles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  employee_number text NOT NULL,
  employee_type text NOT NULL DEFAULT 'OTHER',
  employment_type text NOT NULL DEFAULT 'FULL_TIME',
  designation text NOT NULL,
  grade text,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  campus_id uuid REFERENCES public.campuses(id) ON DELETE SET NULL,
  reporting_manager_id uuid REFERENCES campusos_workforce.employee_profiles(id) ON DELETE SET NULL,
  joining_date date NOT NULL,
  confirmation_date date,
  contract_start date,
  contract_end date,
  work_location text,
  work_mode text NOT NULL DEFAULT 'OFFLINE',
  employment_status text NOT NULL DEFAULT 'ACTIVE',
  personal_email text,
  work_email text,
  phone text,
  emergency_contact jsonb NOT NULL DEFAULT '{}'::jsonb,
  bank_account_masked text,
  bank_ifsc text,
  bank_account_ref text,
  last_working_day date,
  exit_reason text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_profiles_number_uq UNIQUE (tenant_id, employee_number),
  CONSTRAINT employee_profiles_staff_uq UNIQUE (tenant_id, staff_id),
  CONSTRAINT employee_profiles_user_uq UNIQUE (tenant_id, user_id),
  CONSTRAINT employee_profiles_status CHECK (
    employment_status IN (
      'CANDIDATE', 'OFFERED', 'PRE_JOINING', 'ACTIVE', 'PROBATION',
      'ON_LEAVE', 'SUSPENDED', 'NOTICE_PERIOD', 'SEPARATION_PENDING',
      'RESIGNED', 'TERMINATED', 'RETIRED', 'CONTRACT_ENDED', 'EXITED'
    )
  ),
  CONSTRAINT employee_profiles_work_mode CHECK (work_mode IN ('OFFLINE', 'ONLINE', 'HYBRID')),
  CONSTRAINT employee_profiles_type CHECK (
    employee_type IN (
      'FACULTY', 'ADJUNCT_FACULTY', 'VISITING_FACULTY', 'RESEARCHER',
      'TEACHING_ASSISTANT', 'LAB_STAFF', 'ADMINISTRATIVE_STAFF',
      'FINANCE_STAFF', 'HR_STAFF', 'IT_STAFF', 'LIBRARY_STAFF',
      'HOSTEL_STAFF', 'TRANSPORT_STAFF', 'SECURITY_STAFF',
      'MAINTENANCE_STAFF', 'CONTRACTOR', 'CONSULTANT', 'TEMPORARY',
      'INTERN', 'OTHER'
    )
  ),
  CONSTRAINT employee_profiles_employment_type CHECK (
    employment_type IN (
      'PERMANENT', 'PROBATION', 'CONTRACT', 'PART_TIME', 'FULL_TIME',
      'TEMPORARY', 'VISITING', 'CONSULTANT', 'INTERN'
    )
  )
);

CREATE INDEX IF NOT EXISTS employee_profiles_tenant_status_idx
  ON campusos_workforce.employee_profiles (tenant_id, employment_status);
CREATE INDEX IF NOT EXISTS employee_profiles_tenant_department_idx
  ON campusos_workforce.employee_profiles (tenant_id, department_id);
CREATE INDEX IF NOT EXISTS employee_profiles_tenant_manager_idx
  ON campusos_workforce.employee_profiles (tenant_id, reporting_manager_id);
CREATE INDEX IF NOT EXISTS employee_profiles_tenant_contract_idx
  ON campusos_workforce.employee_profiles (tenant_id, contract_end);

-- ---------------------------------------------------------------------------
-- Append-only employment history (transfers, promotions, status changes)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.employment_history (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  change_type text NOT NULL,
  effective_from date NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  reason text,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employment_history_type CHECK (
    change_type IN (
      'CREATED', 'DEPARTMENT_CHANGE', 'DESIGNATION_CHANGE', 'STATUS_CHANGE',
      'TRANSFER', 'PROMOTION', 'ROLE_ASSIGNMENT', 'INCREMENT', 'REPORTING_CHANGE'
    )
  )
);

CREATE INDEX IF NOT EXISTS employment_history_tenant_employee_idx
  ON campusos_workforce.employment_history (tenant_id, employee_id, effective_from DESC);

-- ---------------------------------------------------------------------------
-- Reporting lines (primary + optional secondary manager)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.reporting_lines (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  manager_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  line_type text NOT NULL DEFAULT 'PRIMARY',
  effective_from date NOT NULL,
  effective_until date,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reporting_lines_type CHECK (line_type IN ('PRIMARY', 'DOTTED', 'FUNCTIONAL', 'DEPARTMENT_HEAD')),
  CONSTRAINT reporting_lines_no_self CHECK (employee_id <> manager_id)
);

CREATE INDEX IF NOT EXISTS reporting_lines_tenant_employee_idx
  ON campusos_workforce.reporting_lines (tenant_id, employee_id, effective_from DESC);

-- ---------------------------------------------------------------------------
-- Effective-dated compensation structures (payroll snapshot source)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.compensation_versions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  effective_from date NOT NULL,
  base_pay_minor bigint NOT NULL,
  earnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  deductions jsonb NOT NULL DEFAULT '[]'::jsonb,
  employer_contributions jsonb NOT NULL DEFAULT '[]'::jsonb,
  gross_minor bigint NOT NULL,
  ctc_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT compensation_versions_amounts CHECK (base_pay_minor >= 0 AND gross_minor >= 0 AND ctc_minor >= 0),
  CONSTRAINT compensation_versions_status CHECK (status IN ('ACTIVE', 'SUPERSEDED', 'ARCHIVED')),
  CONSTRAINT compensation_versions_employee_version_uq UNIQUE (employee_id, version)
);

CREATE INDEX IF NOT EXISTS compensation_versions_tenant_employee_idx
  ON campusos_workforce.compensation_versions (tenant_id, employee_id, effective_from DESC);

-- ---------------------------------------------------------------------------
-- Leave policies (institution configurable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.leave_policies (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  leave_type text NOT NULL DEFAULT 'OTHER',
  default_days numeric(6,2) NOT NULL DEFAULT 0,
  accrual_enabled boolean NOT NULL DEFAULT false,
  accrual_per_year numeric(6,2) NOT NULL DEFAULT 0,
  carry_forward_limit numeric(6,2) NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT true,
  applies_to jsonb NOT NULL DEFAULT '["FACULTY","ADMINISTRATIVE_STAFF","ALL"]'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_policies_tenant_code_uq UNIQUE (tenant_id, code),
  CONSTRAINT leave_policies_type CHECK (
    leave_type IN (
      'CASUAL', 'SICK', 'EARNED', 'PRIVILEGE', 'MATERNITY', 'PATERNITY',
      'BEREAVEMENT', 'COMP_OFF', 'DUTY_LEAVE', 'STUDY_LEAVE', 'UNPAID',
      'SABBATICAL', 'OTHER'
    )
  ),
  CONSTRAINT leave_policies_days CHECK (default_days >= 0 AND carry_forward_limit >= 0)
);

-- ---------------------------------------------------------------------------
-- Leave ledger (append-only balance history — never a single mutable number)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.leave_ledger (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES campusos_workforce.leave_policies(id) ON DELETE CASCADE,
  entry_type text NOT NULL,
  amount numeric(6,2) NOT NULL,
  balance_after numeric(6,2) NOT NULL,
  leave_request_id uuid,
  reason text,
  actor_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_ledger_type CHECK (
    entry_type IN ('OPENING', 'EARNED', 'USED', 'ADJUSTMENT', 'EXPIRED', 'RESTORED', 'CANCELLED')
  ),
  CONSTRAINT leave_ledger_amount CHECK (amount <> 0)
);

CREATE INDEX IF NOT EXISTS leave_ledger_tenant_employee_idx
  ON campusos_workforce.leave_ledger (tenant_id, employee_id, policy_id, created_at DESC);
-- One USED/RESTORED/CANCELLED entry per leave request, enforced at the DB
-- level so a repeated approval or review API call can never deduct the same
-- balance twice (idempotency + concurrency safety).
CREATE UNIQUE INDEX IF NOT EXISTS leave_ledger_request_uq
  ON campusos_workforce.leave_ledger (employee_id, leave_request_id)
  WHERE leave_request_id IS NOT NULL AND entry_type IN ('USED', 'RESTORED', 'CANCELLED');

-- ---------------------------------------------------------------------------
-- Leave requests (multi-step approval workflow)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.leave_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  policy_id uuid NOT NULL REFERENCES campusos_workforce.leave_policies(id) ON DELETE RESTRICT,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days numeric(6,2) NOT NULL,
  reason text NOT NULL,
  supporting_doc_ref text,
  status text NOT NULL DEFAULT 'SUBMITTED',
  manager_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  manager_note text,
  manager_reviewed_at timestamptz,
  hr_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  hr_note text,
  hr_reviewed_at timestamptz,
  decided_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  decided_at timestamptz,
  timetable_conflicts jsonb NOT NULL DEFAULT '[]'::jsonb,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT leave_requests_dates CHECK (end_date >= start_date),
  CONSTRAINT leave_requests_days CHECK (days > 0),
  CONSTRAINT leave_requests_status CHECK (
    status IN (
      'DRAFT', 'SUBMITTED', 'MANAGER_APPROVAL', 'HR_REVIEW', 'APPROVED',
      'REJECTED', 'CANCELLED', 'WITHDRAWN'
    )
  )
);

CREATE INDEX IF NOT EXISTS leave_requests_tenant_status_idx
  ON campusos_workforce.leave_requests (tenant_id, status, start_date DESC);
CREATE INDEX IF NOT EXISTS leave_requests_tenant_employee_idx
  ON campusos_workforce.leave_requests (tenant_id, employee_id, start_date DESC);

-- ---------------------------------------------------------------------------
-- Work shifts (optional; faculty use timetable-driven patterns)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.work_shifts (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  code text NOT NULL,
  start_time text NOT NULL,
  end_time text NOT NULL,
  grace_minutes int NOT NULL DEFAULT 0,
  break_minutes int NOT NULL DEFAULT 0,
  weekly_off jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT work_shifts_tenant_code_uq UNIQUE (tenant_id, code),
  CONSTRAINT work_shifts_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- ---------------------------------------------------------------------------
-- Staff attendance (separate from student academic attendance)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.staff_attendance (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  shift_id uuid REFERENCES campusos_workforce.work_shifts(id) ON DELETE SET NULL,
  check_in timestamptz,
  check_out timestamptz,
  work_minutes int,
  status text NOT NULL DEFAULT 'PRESENT',
  source text NOT NULL DEFAULT 'MANUAL',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_attendance_employee_date_uq UNIQUE (tenant_id, employee_id, attendance_date),
  CONSTRAINT staff_attendance_status CHECK (
    status IN (
      'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY', 'ON_LEAVE', 'HOLIDAY',
      'WEEK_OFF', 'OFFICIAL_DUTY', 'WORK_FROM_HOME'
    )
  ),
  CONSTRAINT staff_attendance_source CHECK (source IN ('MANUAL', 'FACEFIRST', 'BIOMETRIC', 'KIOSK', 'IMPORT', 'CORRECTION'))
);

CREATE INDEX IF NOT EXISTS staff_attendance_tenant_date_idx
  ON campusos_workforce.staff_attendance (tenant_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS staff_attendance_tenant_employee_idx
  ON campusos_workforce.staff_attendance (tenant_id, employee_id, attendance_date DESC);

-- ---------------------------------------------------------------------------
-- Attendance corrections (request → review → applied, never silent rewrite)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.attendance_corrections (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  attendance_id uuid REFERENCES campusos_workforce.staff_attendance(id) ON DELETE SET NULL,
  original_state jsonb NOT NULL,
  proposed_state jsonb NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED',
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT attendance_corrections_status CHECK (
    status IN ('REQUESTED', 'APPROVED', 'REJECTED', 'CANCELLED')
  )
);

CREATE INDEX IF NOT EXISTS attendance_corrections_tenant_status_idx
  ON campusos_workforce.attendance_corrections (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Payroll periods (cycle + status machine)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.payroll_periods (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  period_key text NOT NULL,
  period_label text NOT NULL,
  cycle text NOT NULL DEFAULT 'MONTHLY',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  prepared_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  disbursed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_periods_key_uq UNIQUE (tenant_id, period_key),
  CONSTRAINT payroll_periods_dates CHECK (end_date >= start_date),
  CONSTRAINT payroll_periods_cycle CHECK (cycle IN ('MONTHLY', 'WEEKLY', 'FORTNIGHTLY', 'OTHER')),
  CONSTRAINT payroll_periods_status CHECK (
    status IN (
      'DRAFT', 'PROCESSING', 'REVIEW', 'APPROVAL_PENDING', 'APPROVED',
      'DISBURSEMENT_PENDING', 'PAID', 'CLOSED', 'REOPENED'
    )
  )
);

CREATE INDEX IF NOT EXISTS payroll_periods_tenant_status_idx
  ON campusos_workforce.payroll_periods (tenant_id, status, end_date DESC);

-- ---------------------------------------------------------------------------
-- Payroll snapshots (immutable frozen inputs per employee per period)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.payroll_snapshots (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES campusos_workforce.payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  compensation_version_id uuid NOT NULL REFERENCES campusos_workforce.compensation_versions(id) ON DELETE RESTRICT,
  attendance_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  leave_input jsonb NOT NULL DEFAULT '{}'::jsonb,
  adjustments_input jsonb NOT NULL DEFAULT '[]'::jsonb,
  proration_rule text,
  frozen_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_snapshots_period_employee_uq UNIQUE (period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS payroll_snapshots_tenant_period_idx
  ON campusos_workforce.payroll_snapshots (tenant_id, period_id);

-- ---------------------------------------------------------------------------
-- Payroll entries (server-computed authoritative rows)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.payroll_entries (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES campusos_workforce.payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  snapshot_id uuid NOT NULL REFERENCES campusos_workforce.payroll_snapshots(id) ON DELETE CASCADE,
  earnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  deductions jsonb NOT NULL DEFAULT '[]'::jsonb,
  gross_minor bigint NOT NULL,
  total_deduction_minor bigint NOT NULL,
  net_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'READY',
  exceptions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_entries_period_employee_uq UNIQUE (period_id, employee_id),
  CONSTRAINT payroll_entries_amounts CHECK (gross_minor >= 0 AND total_deduction_minor >= 0),
  CONSTRAINT payroll_entries_status CHECK (status IN ('READY', 'EXCEPTION', 'REVIEW', 'APPROVED', 'PAID', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS payroll_entries_tenant_period_idx
  ON campusos_workforce.payroll_entries (tenant_id, period_id, status);

-- ---------------------------------------------------------------------------
-- Payroll adjustments (arrears, recovery, bonus, incentives, corrections)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.payroll_adjustments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES campusos_workforce.payroll_periods(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  adjustment_type text NOT NULL,
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_role text NOT NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_adjustments_type CHECK (
    adjustment_type IN ('ARREARS', 'RECOVERY', 'BONUS', 'INCENTIVE', 'ONE_TIME_ALLOWANCE', 'CORRECTION', 'OVERRIDE')
  ),
  CONSTRAINT payroll_adjustments_amount CHECK (amount_minor <> 0),
  CONSTRAINT payroll_adjustments_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'APPLIED'))
);

CREATE INDEX IF NOT EXISTS payroll_adjustments_tenant_period_idx
  ON campusos_workforce.payroll_adjustments (tenant_id, period_id, employee_id);

-- ---------------------------------------------------------------------------
-- Approved overtime requests (payroll-eligible only after approval)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.overtime_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  approved_minutes int NOT NULL,
  hourly_rate_minor bigint NOT NULL DEFAULT 0,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  payroll_eligible boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT overtime_requests_minutes CHECK (approved_minutes > 0),
  CONSTRAINT overtime_requests_status CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
  CONSTRAINT overtime_requests_employee_date_uq UNIQUE (tenant_id, employee_id, work_date)
);

CREATE INDEX IF NOT EXISTS overtime_requests_tenant_employee_idx
  ON campusos_workforce.overtime_requests (tenant_id, employee_id, work_date DESC);

-- ---------------------------------------------------------------------------
-- Payroll disbursements (provider-agnostic)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.payroll_disbursements (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES campusos_workforce.payroll_periods(id) ON DELETE CASCADE,
  method text NOT NULL DEFAULT 'BANK_TRANSFER',
  file_reference text,
  total_net_minor bigint NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'NOT_STARTED',
  sent_at timestamptz,
  success_count int NOT NULL DEFAULT 0,
  fail_count int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payroll_disbursements_method CHECK (
    method IN ('BANK_TRANSFER', 'BANK_FILE', 'MANUAL_TRACKING', 'OTHER')
  ),
  CONSTRAINT payroll_disbursements_status CHECK (
    status IN (
      'NOT_STARTED', 'READY', 'SENT', 'PROCESSING', 'SUCCESS',
      'PARTIALLY_FAILED', 'FAILED', 'REVERSED'
    )
  )
);

CREATE INDEX IF NOT EXISTS payroll_disbursements_tenant_period_idx
  ON campusos_workforce.payroll_disbursements (tenant_id, period_id);

-- ---------------------------------------------------------------------------
-- Payslip registry (only confirmed/paid payroll, signed verification refs)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.payslip_registry (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  period_id uuid NOT NULL REFERENCES campusos_workforce.payroll_periods(id) ON DELETE CASCADE,
  entry_id uuid NOT NULL REFERENCES campusos_workforce.payroll_entries(id) ON DELETE CASCADE,
  payslip_number text NOT NULL,
  verify_reference text NOT NULL,
  gross_minor bigint NOT NULL,
  net_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'VALID',
  issued_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payslip_registry_entry_uq UNIQUE (entry_id),
  CONSTRAINT payslip_registry_number_uq UNIQUE (tenant_id, payslip_number),
  CONSTRAINT payslip_registry_verify_uq UNIQUE (tenant_id, verify_reference),
  CONSTRAINT payslip_registry_status CHECK (status IN ('VALID', 'REVOKED', 'SUPERSEDED'))
);

CREATE INDEX IF NOT EXISTS payslip_registry_tenant_employee_idx
  ON campusos_workforce.payslip_registry (tenant_id, employee_id, issued_at DESC);

-- ---------------------------------------------------------------------------
-- Reimbursement claims
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.reimbursement_claims (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'OTHER',
  amount_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  reason text NOT NULL,
  document_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'SUBMITTED',
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_note text,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reimbursement_claims_amount CHECK (amount_minor > 0),
  CONSTRAINT reimbursement_claims_status CHECK (
    status IN ('SUBMITTED', 'MANAGER_APPROVAL', 'FINANCE_REVIEW', 'APPROVED', 'REJECTED', 'PAID', 'CANCELLED')
  )
);

CREATE INDEX IF NOT EXISTS reimbursement_claims_tenant_status_idx
  ON campusos_workforce.reimbursement_claims (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Performance cycles
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.performance_cycles (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name text NOT NULL,
  cycle_type text NOT NULL DEFAULT 'ANNUAL',
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT performance_cycles_type CHECK (cycle_type IN ('ANNUAL', 'SEMESTER', 'PROBATION', 'PROMOTION', 'OTHER')),
  CONSTRAINT performance_cycles_status CHECK (status IN ('DRAFT', 'OPEN', 'REVIEW', 'FINALIZED', 'CLOSED'))
);

CREATE TABLE IF NOT EXISTS campusos_workforce.performance_goals (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES campusos_workforce.performance_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  weight numeric(5,2) NOT NULL DEFAULT 1,
  start_date date,
  end_date date,
  progress numeric(5,2) NOT NULL DEFAULT 0,
  evidence jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT performance_goals_weight CHECK (weight > 0 AND weight <= 100),
  CONSTRAINT performance_goals_progress CHECK (progress >= 0 AND progress <= 100)
);

CREATE TABLE IF NOT EXISTS campusos_workforce.performance_reviews (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  cycle_id uuid NOT NULL REFERENCES campusos_workforce.performance_cycles(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  self_review jsonb NOT NULL DEFAULT '{}'::jsonb,
  manager_review jsonb NOT NULL DEFAULT '{}'::jsonb,
  hod_review jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'SELF_REVIEW',
  self_submitted_at timestamptz,
  manager_submitted_at timestamptz,
  finalized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT performance_reviews_cycle_employee_uq UNIQUE (cycle_id, employee_id),
  CONSTRAINT performance_reviews_status CHECK (
    status IN ('SELF_REVIEW', 'MANAGER_REVIEW', 'HOD_REVIEW', 'FINALIZED')
  )
);

-- ---------------------------------------------------------------------------
-- Promotions and transfers (append history; never silently overwrite)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.promotions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  previous_designation text,
  new_designation text NOT NULL,
  previous_compensation jsonb,
  new_compensation jsonb,
  effective_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'PROPOSED',
  proposed_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT promotions_status CHECK (status IN ('PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'))
);

CREATE TABLE IF NOT EXISTS campusos_workforce.transfers (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  transfer_type text NOT NULL DEFAULT 'DEPARTMENT',
  previous_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  new_department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  effective_date date NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'PROPOSED',
  proposed_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT transfers_type CHECK (transfer_type IN ('DEPARTMENT', 'CAMPUS', 'FUNCTIONAL')),
  CONSTRAINT transfers_status CHECK (status IN ('PROPOSED', 'APPROVED', 'REJECTED'))
);

-- ---------------------------------------------------------------------------
-- Temporary duty / time-bounded authorization (e.g. acting HOD)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.temporary_role_assignments (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  authorization_role text NOT NULL,
  effective_from date NOT NULL,
  effective_until date NOT NULL,
  assigned_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT temporary_role_assignments_dates CHECK (effective_until >= effective_from),
  CONSTRAINT temporary_role_assignments_status CHECK (status IN ('ACTIVE', 'EXPIRED', 'REVOKED'))
);

CREATE INDEX IF NOT EXISTS temporary_role_assignments_tenant_active_idx
  ON campusos_workforce.temporary_role_assignments (tenant_id, status, effective_until);

-- ---------------------------------------------------------------------------
-- Grievances (restricted access — not ordinary helpdesk tickets)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.grievances (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'WORKPLACE_CONCERN',
  severity text NOT NULL DEFAULT 'STANDARD',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'SUBMITTED',
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  confidential boolean NOT NULL DEFAULT true,
  response text,
  submitted_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT grievances_category CHECK (
    category IN ('WORKPLACE_CONCERN', 'PAYROLL_ISSUE', 'LEAVE_ISSUE', 'MANAGERIAL_ISSUE', 'HARASSMENT_SAFETY', 'OTHER')
  ),
  CONSTRAINT grievances_severity CHECK (severity IN ('STANDARD', 'HIGH', 'CRITICAL')),
  CONSTRAINT grievances_status CHECK (status IN ('SUBMITTED', 'UNDER_REVIEW', 'RESPONSE_PROVIDED', 'RESOLVED', 'CLOSED'))
);

CREATE INDEX IF NOT EXISTS grievances_tenant_status_idx
  ON campusos_workforce.grievances (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Disciplinary cases (complaint ≠ guilt; formal workflow only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.disciplinary_cases (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  category text NOT NULL DEFAULT 'OTHER',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'REPORTED',
  committee jsonb NOT NULL DEFAULT '[]'::jsonb,
  outcome text,
  reported_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action_approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action_approved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT disciplinary_cases_status CHECK (
    status IN (
      'REPORTED', 'UNDER_PRELIMINARY_REVIEW', 'RESPONSE_REQUESTED',
      'INVESTIGATION', 'COMMITTEE_REVIEW', 'ACTION_PENDING', 'CLEARED',
      'ACTION_APPROVED', 'CLOSED'
    )
  )
);

CREATE INDEX IF NOT EXISTS disciplinary_cases_tenant_status_idx
  ON campusos_workforce.disciplinary_cases (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Resignations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.resignation_requests (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  submission_date date NOT NULL,
  proposed_last_working_day date NOT NULL,
  notice_period_days int NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'SUBMITTED',
  manager_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  manager_note text,
  manager_reviewed_at timestamptz,
  hr_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  hr_note text,
  hr_reviewed_at timestamptz,
  final_last_working_day date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT resignation_requests_dates CHECK (proposed_last_working_day >= submission_date),
  CONSTRAINT resignation_requests_notice CHECK (notice_period_days >= 0),
  CONSTRAINT resignation_requests_status CHECK (
    status IN ('SUBMITTED', 'MANAGER_REVIEW', 'HR_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'COMPLETED')
  )
);

CREATE INDEX IF NOT EXISTS resignation_requests_tenant_status_idx
  ON campusos_workforce.resignation_requests (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Exit clearance items
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.clearance_items (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  resignation_id uuid REFERENCES campusos_workforce.resignation_requests(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  department text NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL,
  note text,
  completed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT clearance_items_status CHECK (status IN ('PENDING', 'CLEARED', 'EXCEPTION', 'WAIVED'))
);

CREATE INDEX IF NOT EXISTS clearance_items_tenant_employee_idx
  ON campusos_workforce.clearance_items (tenant_id, employee_id, status);

-- ---------------------------------------------------------------------------
-- Full & final settlement (server-calculated, auditable)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.final_settlements (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  resignation_id uuid NOT NULL REFERENCES campusos_workforce.resignation_requests(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  salary_payable_minor bigint NOT NULL DEFAULT 0,
  leave_encashment_minor bigint NOT NULL DEFAULT 0,
  notice_recovery_minor bigint NOT NULL DEFAULT 0,
  approved_reimbursements_minor bigint NOT NULL DEFAULT 0,
  advances_recovery_minor bigint NOT NULL DEFAULT 0,
  loan_recovery_minor bigint NOT NULL DEFAULT 0,
  other_adjustments_minor bigint NOT NULL DEFAULT 0,
  net_settlement_minor bigint NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'DRAFT',
  prepared_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  prepared_role text NOT NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT final_settlements_status CHECK (status IN ('DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PAID', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS final_settlements_tenant_employee_idx
  ON campusos_workforce.final_settlements (tenant_id, employee_id);

-- ---------------------------------------------------------------------------
-- Recruitment: job requisitions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.job_requisitions (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  position_title text NOT NULL,
  employee_type text NOT NULL DEFAULT 'FACULTY',
  required_count int NOT NULL DEFAULT 1,
  reason text,
  qualifications text,
  experience_years int,
  compensation_range jsonb NOT NULL DEFAULT '{}'::jsonb,
  target_join_date date,
  status text NOT NULL DEFAULT 'DRAFT',
  requested_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requested_role text NOT NULL,
  approved_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT job_requisitions_count CHECK (required_count > 0),
  CONSTRAINT job_requisitions_status CHECK (
    status IN ('DRAFT', 'APPROVAL_PENDING', 'OPEN', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'JOINED', 'REJECTED', 'CLOSED')
  )
);

CREATE INDEX IF NOT EXISTS job_requisitions_tenant_status_idx
  ON campusos_workforce.job_requisitions (tenant_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Recruitment: candidates (HR-private)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.candidates (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  requisition_id uuid REFERENCES campusos_workforce.job_requisitions(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  resume_ref text,
  source text NOT NULL DEFAULT 'APPLICATION',
  status text NOT NULL DEFAULT 'APPLIED',
  hr_notes text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT candidates_tenant_email_uq UNIQUE (tenant_id, email),
  CONSTRAINT candidates_status CHECK (
    status IN ('APPLIED', 'SCREENING', 'INTERVIEW', 'SELECTED', 'OFFERED', 'OFFER_ACCEPTED', 'OFFER_DECLINED', 'JOINED', 'REJECTED', 'WITHDRAWN')
  )
);

CREATE INDEX IF NOT EXISTS candidates_tenant_requisition_idx
  ON campusos_workforce.candidates (tenant_id, requisition_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Recruitment: interviews (structured panel feedback, one evaluation per panelist)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.interviews (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES campusos_workforce.candidates(id) ON DELETE CASCADE,
  stage text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  mode text NOT NULL DEFAULT 'OFFLINE',
  meeting_ref text,
  panel_members jsonb NOT NULL DEFAULT '[]'::jsonb,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  score numeric(5,2),
  recommendation text,
  evaluator_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'SCHEDULED',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interviews_mode CHECK (mode IN ('OFFLINE', 'ONLINE', 'HYBRID', 'PHONE')),
  CONSTRAINT interviews_stage CHECK (
    stage IN ('SCREENING', 'TECHNICAL', 'DEMO_LECTURE', 'HR_ROUND', 'REFERENCE_CHECK', 'PANEL', 'FINAL')
  ),
  CONSTRAINT interviews_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
  CONSTRAINT interviews_candidate_stage_evaluator_uq UNIQUE (candidate_id, stage, evaluator_user_id)
);

CREATE INDEX IF NOT EXISTS interviews_tenant_candidate_idx
  ON campusos_workforce.interviews (tenant_id, candidate_id, stage);

-- ---------------------------------------------------------------------------
-- Recruitment: employment offers (versioned)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.employment_offers (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  candidate_id uuid NOT NULL REFERENCES campusos_workforce.candidates(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  position_title text NOT NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  employment_type text NOT NULL DEFAULT 'FULL_TIME',
  proposed_join_date date,
  compensation jsonb NOT NULL DEFAULT '{}'::jsonb,
  probation_months int NOT NULL DEFAULT 6,
  contract_duration_months int,
  conditions text,
  offer_expiry date,
  status text NOT NULL DEFAULT 'DRAFT',
  issued_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  issued_at timestamptz,
  accepted_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employment_offers_status CHECK (status IN ('DRAFT', 'ISSUED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED')),
  CONSTRAINT employment_offers_candidate_version_uq UNIQUE (candidate_id, version)
);

CREATE INDEX IF NOT EXISTS employment_offers_tenant_candidate_idx
  ON campusos_workforce.employment_offers (tenant_id, candidate_id, version DESC);

-- ---------------------------------------------------------------------------
-- Onboarding checklists
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.onboarding_checklists (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  item text NOT NULL,
  category text NOT NULL DEFAULT 'ONBOARDING',
  status text NOT NULL DEFAULT 'PENDING',
  completed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT onboarding_checklists_status CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  CONSTRAINT onboarding_checklists_category CHECK (
    category IN ('ONBOARDING', 'DOCUMENT', 'SYSTEM_ACCESS', 'POLICY_ACCEPTANCE', 'EXIT')
  )
);

CREATE INDEX IF NOT EXISTS onboarding_checklists_tenant_employee_idx
  ON campusos_workforce.onboarding_checklists (tenant_id, employee_id, status);

-- ---------------------------------------------------------------------------
-- Employee documents (secure access boundaries, versioned)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.employee_documents (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  employee_id uuid NOT NULL REFERENCES campusos_workforce.employee_profiles(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  file_ref text,
  status text NOT NULL DEFAULT 'UPLOADED',
  version int NOT NULL DEFAULT 1,
  reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  review_note text,
  reviewed_at timestamptz,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT employee_documents_type CHECK (
    doc_type IN (
      'IDENTITY', 'ADDRESS', 'QUALIFICATION', 'EXPERIENCE', 'APPOINTMENT_LETTER',
      'CONTRACT', 'TAX', 'BANK', 'BACKGROUND_VERIFICATION', 'PROMOTION_LETTER',
      'INCREMENT_LETTER', 'EXIT_DOCUMENT', 'OTHER'
    )
  ),
  CONSTRAINT employee_documents_status CHECK (
    status IN ('UPLOADED', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REUPLOAD_REQUIRED', 'WAIVED', 'EXPIRED')
  )
);

CREATE INDEX IF NOT EXISTS employee_documents_tenant_employee_idx
  ON campusos_workforce.employee_documents (tenant_id, employee_id, doc_type);

-- ---------------------------------------------------------------------------
-- Workforce audit events (immutable trail)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_workforce.workforce_audit_events (
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

CREATE INDEX IF NOT EXISTS workforce_audit_events_tenant_idx
  ON campusos_workforce.workforce_audit_events (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workforce_audit_events_actor_idx
  ON campusos_workforce.workforce_audit_events (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS workforce_audit_events_target_idx
  ON campusos_workforce.workforce_audit_events (tenant_id, target_type, target_id);
