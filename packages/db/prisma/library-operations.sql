-- NAVEMORA Library, Digital Resources & Research Management 2.0
-- ---------------------------------------------------------------------------
-- Isolated idempotent PostgreSQL schema (campusos_library) that extends the
-- core academic schema without destabilizing existing NAVEMORA tables.
--
-- Requirements:
--   * PostgreSQL-valid, idempotent, safely re-runnable, non-destructive
--   * All records tenant-scoped; core identities (User/Student/Staff/Course)
--     stay in the existing public schema
--   * Authoritative money in integer minor units (bigint) — never Float
--   * No fake operational seed data
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS campusos_library;

-- Institution library settings -------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.library_settings (
  tenant_id                uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  timezone                 text NOT NULL DEFAULT 'Asia/Kolkata',
  currency                 text NOT NULL DEFAULT 'INR',
  accession_prefix         text NOT NULL DEFAULT 'LIB',
  accession_year_format    text NOT NULL DEFAULT 'YYYY',
  accession_sequence_next  bigint NOT NULL DEFAULT 1,
  default_student_loan_days    integer NOT NULL DEFAULT 14,
  default_faculty_loan_days    integer NOT NULL DEFAULT 30,
  default_max_renewals         integer NOT NULL DEFAULT 1,
  default_max_active_loans     integer NOT NULL DEFAULT 4,
  default_fine_per_day_minor   bigint NOT NULL DEFAULT 500,
  fine_grace_days              integer NOT NULL DEFAULT 0,
  fine_max_cap_minor           bigint NOT NULL DEFAULT 50000,
  reservation_hold_hours       integer NOT NULL DEFAULT 48,
  reservation_max_active       integer NOT NULL DEFAULT 3,
  clearance_requires_finance   boolean NOT NULL DEFAULT false,
  created_at                   timestamptz NOT NULL DEFAULT now(),
  updated_at                   timestamptz NOT NULL DEFAULT now()
);

-- Borrowing policies keyed by member category + resource type ------------------
CREATE TABLE IF NOT EXISTS campusos_library.borrowing_policies (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  member_type       text NOT NULL,           -- STUDENT | FACULTY | RESEARCHER | STAFF | ALUMNI | EXTERNAL_MEMBER
  resource_type     text NOT NULL,           -- BOOK | EBOOK | JOURNAL | THESIS | PROJECT_REPORT | ...
  max_items         integer NOT NULL DEFAULT 4,
  loan_days         integer NOT NULL DEFAULT 14,
  max_renewals      integer NOT NULL DEFAULT 1,
  reservation_limit integer NOT NULL DEFAULT 3,
  reference_only    boolean NOT NULL DEFAULT false,
  allowed           boolean NOT NULL DEFAULT true,
  fine_per_day_minor    bigint,
  fine_max_cap_minor    bigint,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT borrowing_policies_tenant_type_uq UNIQUE (tenant_id, member_type, resource_type)
);

-- Library memberships -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.library_memberships (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_type       text NOT NULL,           -- STUDENT | FACULTY | RESEARCHER | STAFF | ALUMNI | EXTERNAL_MEMBER
  member_number     text NOT NULL,
  status            text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | SUSPENDED | EXPIRED | BLOCKED | CLEARANCE_PENDING | CLOSED
  program_id        uuid,
  department_id     uuid,
  source            text NOT NULL DEFAULT 'DERIVED',
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT library_memberships_tenant_user_uq UNIQUE (tenant_id, user_id),
  CONSTRAINT library_memberships_tenant_number_uq UNIQUE (tenant_id, member_number)
);
CREATE INDEX IF NOT EXISTS library_memberships_tenant_status_idx
  ON campusos_library.library_memberships (tenant_id, status);
CREATE INDEX IF NOT EXISTS library_memberships_user_idx
  ON campusos_library.library_memberships (user_id);

-- Library locations --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.library_locations (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name          text NOT NULL,
  code          text,
  kind          text NOT NULL DEFAULT 'CENTRAL',  -- CENTRAL | DEPARTMENT | CAMPUS | READING_ROOM | RESEARCH | DIGITAL_ONLY
  campus_id     uuid,
  department_id uuid,
  address       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT library_locations_tenant_name_uq UNIQUE (tenant_id, name)
);

-- Catalog records -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.catalog_records (
  id               uuid PRIMARY KEY,
  tenant_id        uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title            text NOT NULL,
  subtitle         text,
  resource_type    text NOT NULL DEFAULT 'BOOK',  -- BOOK | EBOOK | JOURNAL | MAGAZINE | THESIS | DISSERTATION | PROJECT_REPORT | RESEARCH_PAPER | CONFERENCE_PROCEEDING | STANDARD | HANDBOOK | REFERENCE_BOOK | QUESTION_BANK | AUDIO | VIDEO | DATASET | DIGITAL_DOCUMENT | OTHER
  publisher        text,
  edition          text,
  publication_year integer,
  isbn             text,
  issn             text,
  doi              text,
  language         text NOT NULL DEFAULT 'English',
  subject          text,
  keywords         jsonb NOT NULL DEFAULT '[]'::jsonb,
  description      text,
  classification   text,
  call_number      text,
  cover_url        text,
  status           text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | WITHDRAWN | ARCHIVED
  created_by       uuid,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS catalog_records_tenant_title_idx
  ON campusos_library.catalog_records (tenant_id, title);
CREATE INDEX IF NOT EXISTS catalog_records_tenant_isbn_idx
  ON campusos_library.catalog_records (tenant_id, isbn);
CREATE INDEX IF NOT EXISTS catalog_records_tenant_type_idx
  ON campusos_library.catalog_records (tenant_id, resource_type);
CREATE INDEX IF NOT EXISTS catalog_records_tenant_subject_idx
  ON campusos_library.catalog_records (tenant_id, subject);

CREATE TABLE IF NOT EXISTS campusos_library.catalog_authors (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  record_id   uuid NOT NULL REFERENCES campusos_library.catalog_records(id) ON DELETE CASCADE,
  name        text NOT NULL,
  role        text NOT NULL DEFAULT 'AUTHOR',  -- AUTHOR | EDITOR
  position    integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS catalog_authors_record_idx
  ON campusos_library.catalog_authors (record_id);

-- Physical copies -------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.physical_copies (
  id               uuid PRIMARY KEY,
  tenant_id        uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  record_id        uuid NOT NULL REFERENCES campusos_library.catalog_records(id) ON DELETE CASCADE,
  location_id      uuid REFERENCES campusos_library.library_locations(id) ON DELETE SET NULL,
  accession_number text NOT NULL,
  barcode          text,
  shelf            text,
  acquisition_date date,
  price_minor      bigint,
  currency         text DEFAULT 'INR',
  source           text,
  condition        text NOT NULL DEFAULT 'GOOD',  -- GOOD | WORN | DAMAGED | REPAIR
  status           text NOT NULL DEFAULT 'AVAILABLE',  -- AVAILABLE | ISSUED | RESERVED | IN_TRANSIT | REPAIR | LOST | DAMAGED | WITHDRAWN | REFERENCE_ONLY
  vendor_reference text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT physical_copies_tenant_accession_uq UNIQUE (tenant_id, accession_number)
);
CREATE INDEX IF NOT EXISTS physical_copies_tenant_status_idx
  ON campusos_library.physical_copies (tenant_id, status);
CREATE INDEX IF NOT EXISTS physical_copies_tenant_barcode_idx
  ON campusos_library.physical_copies (tenant_id, barcode);
CREATE INDEX IF NOT EXISTS physical_copies_record_idx
  ON campusos_library.physical_copies (record_id);

-- Loans (issue / renew / return) ------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.loans (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  copy_id            uuid NOT NULL REFERENCES campusos_library.physical_copies(id) ON DELETE RESTRICT,
  member_id          uuid NOT NULL REFERENCES campusos_library.library_memberships(id) ON DELETE RESTRICT,
  issued_by          uuid,
  issue_date         date NOT NULL,
  due_date           date NOT NULL,
  returned_at        timestamptz,
  returned_by        uuid,
  return_condition   text,
  renewal_count      integer NOT NULL DEFAULT 0,
  policy_snapshot    jsonb NOT NULL DEFAULT '{}'::jsonb,
  status             text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | RETURNED | OVERDUE
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loans_tenant_status_idx
  ON campusos_library.loans (tenant_id, status);
CREATE INDEX IF NOT EXISTS loans_tenant_due_idx
  ON campusos_library.loans (tenant_id, due_date);
CREATE INDEX IF NOT EXISTS loans_member_idx
  ON campusos_library.loans (member_id);
-- One copy can only ever have one active (unreturned) loan.
CREATE UNIQUE INDEX IF NOT EXISTS loans_active_copy_uq
  ON campusos_library.loans (copy_id)
  WHERE returned_at IS NULL;

CREATE TABLE IF NOT EXISTS campusos_library.loan_events (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  loan_id     uuid NOT NULL REFERENCES campusos_library.loans(id) ON DELETE CASCADE,
  event_type  text NOT NULL,  -- ISSUED | RENEWED | RETURNED
  actor_user_id uuid,
  actor_role  text,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS loan_events_loan_idx
  ON campusos_library.loan_events (loan_id);

-- Reservations ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.reservations (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  record_id         uuid NOT NULL REFERENCES campusos_library.catalog_records(id) ON DELETE CASCADE,
  member_id         uuid NOT NULL REFERENCES campusos_library.library_memberships(id) ON DELETE RESTRICT,
  queue_position    integer NOT NULL,
  status            text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | FULFILLED | CANCELLED | EXPIRED
  created_at        timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz,
  fulfilled_copy_id uuid,
  notified_at       timestamptz,
  CONSTRAINT reservations_tenant_member_record_uq UNIQUE (tenant_id, record_id, member_id)
);
CREATE INDEX IF NOT EXISTS reservations_tenant_status_idx
  ON campusos_library.reservations (tenant_id, status);
CREATE INDEX IF NOT EXISTS reservations_record_queue_idx
  ON campusos_library.reservations (record_id, queue_position);

-- Fine events (assessed / adjusted / waived / paid / reversed) ---------------------------
CREATE TABLE IF NOT EXISTS campusos_library.fine_events (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  member_id         uuid NOT NULL REFERENCES campusos_library.library_memberships(id) ON DELETE RESTRICT,
  loan_id           uuid REFERENCES campusos_library.loans(id) ON DELETE SET NULL,
  event_type        text NOT NULL,  -- ASSESSED | ADJUSTED | WAIVED | PAID | REVERSED
  amount_minor      bigint NOT NULL,
  currency          text NOT NULL DEFAULT 'INR',
  reason            text,
  actor_user_id     uuid,
  actor_role        text,
  finance_reference text,
  created_at        timestamptz NOT NULL DEFAULT now()
);
-- A waiver/adjustment/reversal may link back to the original assessed fine so
-- that outstanding balances are computed per fine (never per member).
ALTER TABLE campusos_library.fine_events
  ADD COLUMN IF NOT EXISTS related_fine_id uuid;
CREATE INDEX IF NOT EXISTS fine_events_tenant_member_idx
  ON campusos_library.fine_events (tenant_id, member_id);
CREATE INDEX IF NOT EXISTS fine_events_tenant_loan_idx
  ON campusos_library.fine_events (tenant_id, loan_id);
-- Each assessed fine can be waived at most once (double-waiver protection).
CREATE UNIQUE INDEX IF NOT EXISTS fine_events_waiver_related_uq
  ON campusos_library.fine_events (tenant_id, related_fine_id)
  WHERE related_fine_id IS NOT NULL;

-- Member holds ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.member_holds (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  member_id     uuid NOT NULL REFERENCES campusos_library.library_memberships(id) ON DELETE RESTRICT,
  reason        text NOT NULL,
  status        text NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | RELEASED
  created_by    uuid,
  released_by   uuid,
  released_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT member_holds_tenant_member_status_uq UNIQUE (tenant_id, member_id, status)
);

-- Acquisitions & vendors ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.vendors (
  id               uuid PRIMARY KEY,
  tenant_id        uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  name             text NOT NULL,
  contact          text,
  invoice_reference text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vendors_tenant_name_uq UNIQUE (tenant_id, name)
);

CREATE TABLE IF NOT EXISTS campusos_library.acquisitions (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  requestor_user_id uuid NOT NULL,
  requestor_role text,
  title          text NOT NULL,
  author         text,
  isbn           text,
  publisher      text,
  edition        text,
  estimated_price_minor bigint,
  currency       text DEFAULT 'INR',
  reason         text,
  status         text NOT NULL DEFAULT 'REQUESTED',  -- REQUESTED | UNDER_REVIEW | APPROVED | BUDGET_REVIEW | ORDERED | RECEIVED | CATALOGUED | REJECTED | CANCELLED
  vendor_id      uuid REFERENCES campusos_library.vendors(id) ON DELETE SET NULL,
  duplicate_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  record_id      uuid REFERENCES campusos_library.catalog_records(id) ON DELETE SET NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS acquisitions_tenant_status_idx
  ON campusos_library.acquisitions (tenant_id, status);

-- Periodicals --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.periodical_subscriptions (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title             text NOT NULL,
  frequency         text NOT NULL DEFAULT 'MONTHLY',
  expected_issues   integer NOT NULL DEFAULT 0,
  received_issues   jsonb NOT NULL DEFAULT '[]'::jsonb,
  missing_issues    jsonb NOT NULL DEFAULT '[]'::jsonb,
  start_date        date,
  end_date          date,
  status            text NOT NULL DEFAULT 'ACTIVE',
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Stock audits ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.stock_audits (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title          text NOT NULL,
  status         text NOT NULL DEFAULT 'IN_PROGRESS',  -- IN_PROGRESS | REVIEW | FINALIZED | CANCELLED
  created_by     uuid,
  finalized_by   uuid,
  finalized_at   timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_library.stock_audit_items (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  audit_id    uuid NOT NULL REFERENCES campusos_library.stock_audits(id) ON DELETE CASCADE,
  copy_id     uuid NOT NULL REFERENCES campusos_library.physical_copies(id) ON DELETE CASCADE,
  expected    boolean NOT NULL DEFAULT true,
  found       boolean,
  note        text,
  reviewed    boolean NOT NULL DEFAULT false,
  CONSTRAINT stock_audit_items_audit_copy_uq UNIQUE (audit_id, copy_id)
);

-- Digital resources -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.digital_resources (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  record_id         uuid REFERENCES campusos_library.catalog_records(id) ON DELETE SET NULL,
  title             text NOT NULL,
  resource_type     text NOT NULL DEFAULT 'EBOOK',
  access_level      text NOT NULL DEFAULT 'INSTITUTION_ONLY',  -- PUBLIC | INSTITUTION_ONLY | STUDENT_ONLY | FACULTY_ONLY | COURSE_RESTRICTED | DEPARTMENT_RESTRICTED | EMBARGOED | LICENSE_RESTRICTED
  provider          text,
  safe_access_url   text,
  access_config     jsonb NOT NULL DEFAULT '{}'::jsonb,
  course_offering_id uuid,
  department_id     uuid,
  view_count        bigint NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'ACTIVE',
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS digital_resources_tenant_access_idx
  ON campusos_library.digital_resources (tenant_id, access_level);

-- Reading lists (linked to CourseOffering) ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.reading_lists (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  course_offering_id uuid,
  title              text NOT NULL,
  list_type          text NOT NULL DEFAULT 'REQUIRED',  -- REQUIRED | RECOMMENDED | REFERENCE
  status             text NOT NULL DEFAULT 'ACTIVE',
  created_by         uuid,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_library.reading_list_items (
  id           uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  list_id      uuid NOT NULL REFERENCES campusos_library.reading_lists(id) ON DELETE CASCADE,
  record_id    uuid REFERENCES campusos_library.catalog_records(id) ON DELETE SET NULL,
  digital_id   uuid REFERENCES campusos_library.digital_resources(id) ON DELETE SET NULL,
  note         text,
  position     integer NOT NULL DEFAULT 0,
  CONSTRAINT reading_list_items_list_record_digital_uq UNIQUE (list_id, record_id, digital_id)
);

-- Library clearance --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.library_clearance (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  member_id          uuid NOT NULL REFERENCES campusos_library.library_memberships(id) ON DELETE RESTRICT,
  clearance_status   text NOT NULL DEFAULT 'PENDING',  -- PENDING | CLEAR | BLOCKED
  unreturned_count   integer NOT NULL DEFAULT 0,
  lost_count         integer NOT NULL DEFAULT 0,
  unpaid_fine_minor  bigint NOT NULL DEFAULT 0,
  notes              text,
  checked_by         uuid,
  checked_at         timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT library_clearance_tenant_member_uq UNIQUE (tenant_id, member_id)
);

-- Library audit trail ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_library.library_audit_events (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  actor_user_id uuid,
  actor_role    text,
  action        text NOT NULL,
  target_type   text NOT NULL,
  target_id     uuid,
  previous_state jsonb,
  new_state     jsonb,
  reason        text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS library_audit_events_tenant_action_idx
  ON campusos_library.library_audit_events (tenant_id, created_at DESC);
