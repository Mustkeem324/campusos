-- CampusOS institution helpdesk and company support bridge.
-- Kept outside Prisma's managed public schema so workflow history can evolve
-- independently while retaining tenant/user foreign-key integrity.

CREATE SCHEMA IF NOT EXISTS campusos_helpdesk;
CREATE SCHEMA IF NOT EXISTS campusos_control;

CREATE TABLE IF NOT EXISTS campusos_helpdesk.tickets (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  case_number text NOT NULL UNIQUE,
  requester_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_role text NOT NULL,
  related_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  category text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL',
  status text NOT NULL DEFAULT 'OPEN',
  current_queue_role text NOT NULL,
  assigned_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  sla_due_at timestamptz NOT NULL,
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT helpdesk_ticket_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  CONSTRAINT helpdesk_ticket_status CHECK (status IN ('OPEN','IN_PROGRESS','WAITING_REQUESTER','ESCALATED','RESOLVED','CLOSED')),
  CONSTRAINT helpdesk_ticket_subject_nonempty CHECK (length(trim(subject)) >= 3),
  CONSTRAINT helpdesk_ticket_description_nonempty CHECK (length(trim(description)) >= 5)
);

ALTER TABLE campusos_helpdesk.tickets
  ADD COLUMN IF NOT EXISTS related_student_id uuid REFERENCES public.students(id) ON DELETE SET NULL;
ALTER TABLE campusos_helpdesk.tickets
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS helpdesk_tickets_tenant_created_idx
  ON campusos_helpdesk.tickets (tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS helpdesk_tickets_queue_idx
  ON campusos_helpdesk.tickets (tenant_id, current_queue_role, status, sla_due_at);
CREATE INDEX IF NOT EXISTS helpdesk_tickets_requester_idx
  ON campusos_helpdesk.tickets (tenant_id, requester_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS helpdesk_tickets_assignee_idx
  ON campusos_helpdesk.tickets (tenant_id, assigned_user_id, status);
CREATE INDEX IF NOT EXISTS helpdesk_tickets_department_idx
  ON campusos_helpdesk.tickets (tenant_id, department_id, current_queue_role, status);

CREATE TABLE IF NOT EXISTS campusos_helpdesk.messages (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES campusos_helpdesk.tickets(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_role text NOT NULL,
  message_type text NOT NULL DEFAULT 'REPLY',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT helpdesk_message_type CHECK (message_type IN ('REPLY','INTERNAL_NOTE','SYSTEM','ESCALATION')),
  CONSTRAINT helpdesk_message_body_nonempty CHECK (length(trim(body)) >= 1)
);

CREATE INDEX IF NOT EXISTS helpdesk_messages_ticket_idx
  ON campusos_helpdesk.messages (ticket_id, created_at ASC);

CREATE TABLE IF NOT EXISTS campusos_helpdesk.escalations (
  id uuid PRIMARY KEY,
  tenant_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES campusos_helpdesk.tickets(id) ON DELETE CASCADE,
  from_role text NOT NULL,
  to_role text NOT NULL,
  escalated_by_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS helpdesk_escalations_ticket_idx
  ON campusos_helpdesk.escalations (ticket_id, created_at ASC);

-- Institution -> CampusOS company support. This contains platform/service issues,
-- not institution academic ticket content. SUPER_ADMIN operates this queue.
CREATE TABLE IF NOT EXISTS campusos_control.institution_support_tickets (
  id uuid PRIMARY KEY,
  reference text NOT NULL UNIQUE,
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  requester_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  requester_name text NOT NULL,
  requester_email text NOT NULL,
  category text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL DEFAULT 'NORMAL',
  status text NOT NULL DEFAULT 'NEW',
  assigned_super_admin_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  first_response_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_support_priority CHECK (priority IN ('LOW','NORMAL','HIGH','URGENT')),
  CONSTRAINT company_support_status CHECK (status IN ('NEW','OPEN','WAITING_INSTITUTION','RESOLVED','CLOSED'))
);

CREATE INDEX IF NOT EXISTS company_support_created_idx
  ON campusos_control.institution_support_tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS company_support_status_idx
  ON campusos_control.institution_support_tickets (status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS company_support_institution_idx
  ON campusos_control.institution_support_tickets (institution_id, created_at DESC);

CREATE TABLE IF NOT EXISTS campusos_control.institution_support_messages (
  id uuid PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES campusos_control.institution_support_tickets(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  author_side text NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT company_support_author_side CHECK (author_side IN ('INSTITUTION','CAMPUSOS')),
  CONSTRAINT company_support_message_nonempty CHECK (length(trim(body)) >= 1)
);

CREATE INDEX IF NOT EXISTS company_support_messages_ticket_idx
  ON campusos_control.institution_support_messages (ticket_id, created_at ASC);
