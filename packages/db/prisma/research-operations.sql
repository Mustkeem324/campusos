-- NAVEMORA Library, Digital Resources & Research Management 2.0
-- ---------------------------------------------------------------------------
-- Isolated idempotent PostgreSQL schema (campusos_research) that extends the
-- core academic schema without destabilizing existing NAVEMORA tables.
--
-- Requirements:
--   * PostgreSQL-valid, idempotent, safely re-runnable, non-destructive
--   * All records tenant-scoped; core identities (User/Student/Staff/Course)
--     stay in the existing public schema
--   * No fake operational seed data
-- ---------------------------------------------------------------------------

CREATE SCHEMA IF NOT EXISTS campusos_research;

-- Institution research settings --------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.research_settings (
  tenant_id                     uuid PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  timezone                      text NOT NULL DEFAULT 'Asia/Kolkata',
  currency                      text NOT NULL DEFAULT 'INR',
  supervisor_capacity           integer NOT NULL DEFAULT 6,
  proposal_requires_review      boolean NOT NULL DEFAULT true,
  similarity_threshold_ok       integer NOT NULL DEFAULT 10,
  similarity_threshold_review   integer NOT NULL DEFAULT 20,
  repository_requires_approval  boolean NOT NULL DEFAULT true,
  default_embargo_days          integer,
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

-- Research projects ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.research_projects (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title             text NOT NULL,
  abstract          text,
  research_type     text NOT NULL DEFAULT 'FACULTY_RESEARCH',  -- FACULTY_RESEARCH | STUDENT_PROJECT | CAPSTONE | DISSERTATION | THESIS | PHD_RESEARCH | FUNDED_PROJECT | CONSULTANCY_RESEARCH | INSTITUTIONAL_PROJECT | OTHER
  department_id     uuid,
  research_area     text,
  status            text NOT NULL DEFAULT 'DRAFT',  -- DRAFT | PROPOSED | UNDER_REVIEW | APPROVED | ACTIVE | ON_HOLD | COMPLETED | CLOSED | CANCELLED | ARCHIVED
  start_date        date,
  expected_completion date,
  funding_source    text,
  keywords          jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS research_projects_tenant_status_idx
  ON campusos_research.research_projects (tenant_id, status);
CREATE INDEX IF NOT EXISTS research_projects_tenant_dept_idx
  ON campusos_research.research_projects (tenant_id, department_id);

-- Project members (scoped roles — never a broad grant of institution permission) -------
CREATE TABLE IF NOT EXISTS campusos_research.project_members (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id    uuid NOT NULL REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  user_id       uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_role   text NOT NULL,  -- PRINCIPAL_INVESTIGATOR | CO_INVESTIGATOR | SUPERVISOR | STUDENT_RESEARCHER | REVIEWER | COORDINATOR
  is_active     boolean NOT NULL DEFAULT true,
  assigned_by   uuid,
  assigned_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_members_project_user_uq UNIQUE (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS project_members_tenant_user_idx
  ON campusos_research.project_members (tenant_id, user_id);
CREATE INDEX IF NOT EXISTS project_members_tenant_role_idx
  ON campusos_research.project_members (tenant_id, member_role);

-- Student researcher team linking (a team may span several students) -------------------
CREATE TABLE IF NOT EXISTS campusos_research.project_supervisors (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  supervisor_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role           text NOT NULL DEFAULT 'GUIDE',  -- GUIDE | CO_GUIDE
  status         text NOT NULL DEFAULT 'ASSIGNED',  -- REQUESTED | ASSIGNED | ACCEPTED | DECLINED | RELEASED
  assigned_by    uuid,
  assigned_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT project_supervisors_project_user_uq UNIQUE (project_id, supervisor_id)
);

-- Proposals with version history ---------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.research_proposals (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  status         text NOT NULL DEFAULT 'DRAFT',  -- DRAFT | SUBMITTED | SUPERVISOR_REVIEW | COMMITTEE_REVIEW | APPROVED | REVISION_REQUIRED | REJECTED
  submitted_by   uuid,
  submitted_at   timestamptz,
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS campusos_research.proposal_versions (
  id           uuid PRIMARY KEY,
  tenant_id    uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  proposal_id  uuid NOT NULL REFERENCES campusos_research.research_proposals(id) ON DELETE CASCADE,
  version      integer NOT NULL,
  title        text NOT NULL,
  problem_statement text,
  objectives   jsonb NOT NULL DEFAULT '[]'::jsonb,
  methodology  text,
  literature_review text,
  expected_outcome text,
  timeline     jsonb NOT NULL DEFAULT '{}'::jsonb,
  resource_requirements text,
  submitted_by uuid,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT proposal_versions_proposal_version_uq UNIQUE (proposal_id, version)
);
CREATE INDEX IF NOT EXISTS proposal_versions_proposal_idx
  ON campusos_research.proposal_versions (proposal_id);

-- Milestones --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.milestones (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  title          text NOT NULL,
  description    text,
  due_date       date,
  status         text NOT NULL DEFAULT 'PENDING',  -- PENDING | SUBMITTED | UNDER_REVIEW | APPROVED | REVISION_REQUIRED | REJECTED
  position       integer NOT NULL DEFAULT 0,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS milestones_tenant_project_idx
  ON campusos_research.milestones (tenant_id, project_id);

CREATE TABLE IF NOT EXISTS campusos_research.milestone_submissions (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  milestone_id   uuid NOT NULL REFERENCES campusos_research.milestones(id) ON DELETE CASCADE,
  submitted_by   uuid,
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  notes          text,
  file_reference text,
  status         text NOT NULL DEFAULT 'SUBMITTED',
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  feedback       text
);
CREATE INDEX IF NOT EXISTS milestone_submissions_tenant_milestone_idx
  ON campusos_research.milestone_submissions (milestone_id);

-- Project files (project-scoped) --------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.research_files (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  category       text NOT NULL DEFAULT 'DOCUMENT',  -- PROPOSAL | DRAFT | DATASET | ANALYSIS | PRESENTATION | FINAL_REPORT | SUPPORTING
  file_reference text NOT NULL,
  file_name      text,
  uploaded_by    uuid,
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  access_scope   text NOT NULL DEFAULT 'PROJECT'
);
CREATE INDEX IF NOT EXISTS research_files_tenant_project_idx
  ON campusos_research.research_files (tenant_id, project_id);

-- Thesis / dissertation lifecycle ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.theses (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  student_user_id uuid NOT NULL,
  project_id     uuid REFERENCES campusos_research.research_projects(id) ON DELETE SET NULL,
  title          text NOT NULL,
  program_id     uuid,
  department_id  uuid,
  status         text NOT NULL DEFAULT 'TOPIC_PROPOSED',  -- TOPIC_PROPOSED | TOPIC_APPROVED | REGISTERED | RESEARCH_ACTIVE | DRAFT | SIMILARITY_REVIEW | SUPERVISOR_REVIEW | PRE_SUBMISSION | UNDER_EVALUATION | VIVA_SCHEDULED | CORRECTIONS_REQUIRED | FINAL_SUBMITTED | APPROVED | PUBLISHED | EMBARGOED | REJECTED | CLOSED
  registered_at  timestamptz,
  final_submitted_at timestamptz,
  approved_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS theses_tenant_status_idx
  ON campusos_research.theses (tenant_id, status);
CREATE INDEX IF NOT EXISTS theses_tenant_student_idx
  ON campusos_research.theses (tenant_id, student_user_id);

CREATE TABLE IF NOT EXISTS campusos_research.thesis_versions (
  id            uuid PRIMARY KEY,
  tenant_id     uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  thesis_id     uuid NOT NULL REFERENCES campusos_research.theses(id) ON DELETE CASCADE,
  version       integer NOT NULL,
  file_reference text NOT NULL,
  file_name     text,
  submitted_by  uuid,
  submitted_at  timestamptz NOT NULL DEFAULT now(),
  status        text NOT NULL DEFAULT 'SUBMITTED',
  feedback      text,
  CONSTRAINT thesis_versions_thesis_version_uq UNIQUE (thesis_id, version)
);
CREATE INDEX IF NOT EXISTS thesis_versions_thesis_idx
  ON campusos_research.thesis_versions (thesis_id);

-- Similarity (plagiarism) review — a score is input to human review, never automatic guilt -----
CREATE TABLE IF NOT EXISTS campusos_research.similarity_checks (
  id                 uuid PRIMARY KEY,
  tenant_id          uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  thesis_id          uuid REFERENCES campusos_research.theses(id) ON DELETE CASCADE,
  project_id         uuid REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  provider           text NOT NULL,
  submission_reference text,
  similarity_score   integer,
  report_status      text NOT NULL DEFAULT 'SUBMITTED',  -- SUBMITTED | PROCESSED | FAILED
  outcome            text,  -- ACCEPTABLE | REVISION_REQUIRED | REVIEW_REQUIRED | ESCALATED
  reviewed_by        uuid,
  reviewed_at        timestamptz,
  notes              text,
  created_at         timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS similarity_checks_tenant_status_idx
  ON campusos_research.similarity_checks (tenant_id, report_status);

-- Ethics reviews (restricted) -----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.ethics_reviews (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  case_type      text NOT NULL DEFAULT 'HUMAN_PARTICIPANTS',  -- HUMAN_PARTICIPANTS | SENSITIVE_DATA | ANIMAL_RESEARCH | RESTRICTED_DATASETS
  status         text NOT NULL DEFAULT 'SUBMITTED',  -- SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | AMENDMENTS_REQUIRED | CLOSED
  submitted_by   uuid,
  submitted_at   timestamptz NOT NULL DEFAULT now(),
  reviewed_by    uuid,
  reviewed_at    timestamptz,
  committee_notes text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ethics_reviews_tenant_status_idx
  ON campusos_research.ethics_reviews (tenant_id, status);

-- External examiners -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.examiner_assignments (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  thesis_id       uuid NOT NULL REFERENCES campusos_research.theses(id) ON DELETE CASCADE,
  examiner_name   text NOT NULL,
  examiner_org    text,
  examiner_reference text,
  role            text NOT NULL DEFAULT 'EXTERNAL',  -- EXTERNAL | INTERNAL
  conflict_declared boolean NOT NULL DEFAULT false,
  assigned_by     uuid,
  assigned_at     timestamptz NOT NULL DEFAULT now(),
  evaluation_id   uuid,
  CONSTRAINT examiner_assignments_thesis_examiner_uq UNIQUE (thesis_id, examiner_name, role)
);

-- Evaluations (structured rubric) ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.evaluations (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  thesis_id      uuid REFERENCES campusos_research.theses(id) ON DELETE CASCADE,
  project_id     uuid REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  evaluator_user_id uuid,
  evaluator_name text,
  rubric         jsonb NOT NULL DEFAULT '{}'::jsonb,
  scores         jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendation text NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED | MINOR_REVISIONS | MAJOR_REVISIONS | REJECTED
  comments       text,
  submitted_at   timestamptz,
  submitted_by   uuid,
  created_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS evaluations_tenant_thesis_idx
  ON campusos_research.evaluations (tenant_id, thesis_id);

-- Viva sessions ---------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.viva_sessions (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  thesis_id      uuid REFERENCES campusos_research.theses(id) ON DELETE CASCADE,
  project_id     uuid REFERENCES campusos_research.research_projects(id) ON DELETE CASCADE,
  scheduled_at   timestamptz NOT NULL,
  venue          text,
  mode           text NOT NULL DEFAULT 'OFFLINE',  -- OFFLINE | ONLINE | HYBRID
  panel          jsonb NOT NULL DEFAULT '[]'::jsonb,
  status         text NOT NULL DEFAULT 'SCHEDULED',  -- SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED | RESCHEDULED
  outcome        text,
  created_by     uuid,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS viva_sessions_tenant_status_idx
  ON campusos_research.viva_sessions (tenant_id, status);

-- Correction cycles -------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.corrections (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  thesis_id       uuid NOT NULL REFERENCES campusos_research.theses(id) ON DELETE CASCADE,
  details         text NOT NULL,
  requested_by    uuid,
  requested_at    timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL DEFAULT 'REQUESTED',  -- REQUESTED | SUBMITTED | VERIFIED | CLOSED
  response_notes  text,
  resolved_at     timestamptz
);

-- Institutional repository ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.repository_items (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title             text NOT NULL,
  authors           jsonb NOT NULL DEFAULT '[]'::jsonb,
  department_id     uuid,
  program_id        uuid,
  supervisor_name   text,
  abstract          text,
  keywords          jsonb NOT NULL DEFAULT '[]'::jsonb,
  publication_year  integer,
  resource_type     text NOT NULL DEFAULT 'THESIS',  -- THESIS | DISSERTATION | STUDENT_PROJECT | FACULTY_PAPER | CONFERENCE_PAPER | INSTITUTIONAL_REPORT | DATASET | LEARNING_RESOURCE
  license           text,
  permanent_id      text NOT NULL,
  access_level      text NOT NULL DEFAULT 'INSTITUTION_ONLY',  -- PUBLIC | INSTITUTION_ONLY | DEPARTMENT_ONLY | RESTRICTED | EMBARGOED | PRIVATE
  submission_status text NOT NULL DEFAULT 'PENDING_APPROVAL',  -- PENDING_APPROVAL | APPROVED | REJECTED | PUBLISHED
  approved_by       uuid,
  approved_at       timestamptz,
  published_at      timestamptz,
  created_by        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT repository_items_tenant_permanent_id_uq UNIQUE (tenant_id, permanent_id)
);
CREATE INDEX IF NOT EXISTS repository_items_tenant_status_idx
  ON campusos_research.repository_items (tenant_id, submission_status);
CREATE INDEX IF NOT EXISTS repository_items_tenant_access_idx
  ON campusos_research.repository_items (tenant_id, access_level);

CREATE TABLE IF NOT EXISTS campusos_research.repository_versions (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  item_id        uuid NOT NULL REFERENCES campusos_research.repository_items(id) ON DELETE CASCADE,
  version        integer NOT NULL,
  file_reference text NOT NULL,
  file_name      text,
  uploaded_by    uuid,
  uploaded_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT repository_versions_item_version_uq UNIQUE (item_id, version)
);

-- Embargoes -----------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.embargoes (
  id              uuid PRIMARY KEY,
  tenant_id       uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  item_id         uuid NOT NULL REFERENCES campusos_research.repository_items(id) ON DELETE CASCADE,
  reason          text,
  policy_reference text,
  embargo_start   date NOT NULL,
  embargo_end     date,
  authorized_by   uuid,
  released_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Faculty publications --------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.publications (
  id             uuid PRIMARY KEY,
  tenant_id      uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title          text NOT NULL,
  publication_type text NOT NULL DEFAULT 'JOURNAL_ARTICLE',  -- JOURNAL_ARTICLE | CONFERENCE_PAPER | BOOK | BOOK_CHAPTER | PATENT | DATASET | OTHER
  venue          text,
  year           integer,
  doi            text,
  isbn           text,
  url_reference  text,
  verification_status text NOT NULL DEFAULT 'UNVERIFIED',  -- UNVERIFIED | EVIDENCE_SUBMITTED | VERIFIED | REJECTED
  evidence_reference text,
  verified_by    uuid,
  verified_at    timestamptz,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS publications_tenant_user_idx
  ON campusos_research.publications (tenant_id, user_id);

-- Funded research / grants ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.grants (
  id                uuid PRIMARY KEY,
  tenant_id         uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  project_id        uuid REFERENCES campusos_research.research_projects(id) ON DELETE SET NULL,
  funding_agency    text NOT NULL,
  grant_reference   text NOT NULL,
  title             text NOT NULL,
  approved_budget_minor bigint NOT NULL DEFAULT 0,
  currency          text NOT NULL DEFAULT 'INR',
  start_date        date,
  end_date          date,
  status            text NOT NULL DEFAULT 'ACTIVE',  -- PROPOSED | ACTIVE | COMPLETED | CLOSED
  pi_user_id        uuid,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS grants_tenant_status_idx
  ON campusos_research.grants (tenant_id, status);

CREATE TABLE IF NOT EXISTS campusos_research.grant_members (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  grant_id    uuid NOT NULL REFERENCES campusos_research.grants(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  member_role text NOT NULL DEFAULT 'CO_INVESTIGATOR',
  CONSTRAINT grant_members_grant_user_uq UNIQUE (grant_id, user_id)
);

-- Research access rules (field-level least privilege) --------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.research_access_rules (
  id          uuid PRIMARY KEY,
  tenant_id   uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  entity_type text NOT NULL,  -- PROJECT | THESIS | REPOSITORY_ITEM | EVALUATION | ETHICS_REVIEW | SIMILARITY_CHECK
  entity_id   uuid NOT NULL,
  user_id     uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  access      text NOT NULL DEFAULT 'READ',  -- READ | REVIEW | MANAGE
  granted_by  uuid,
  granted_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT research_access_rules_entity_user_uq UNIQUE (entity_type, entity_id, user_id)
);
CREATE INDEX IF NOT EXISTS research_access_rules_tenant_entity_idx
  ON campusos_research.research_access_rules (tenant_id, entity_type, entity_id);

-- Research audit trail ------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS campusos_research.research_audit_events (
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
CREATE INDEX IF NOT EXISTS research_audit_events_tenant_action_idx
  ON campusos_research.research_audit_events (tenant_id, created_at DESC);
