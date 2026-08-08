import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import type { MoneyMinor } from './finance-money';
import {
  assertResearchPermission,
  canApproveResearch,
  canAssignSupervisors,
  canContributeResearch,
  canReviewResearch,
  canReviewSimilarity,
  isResearchConfigurator,
  isResearchOperator,
} from './research-policy';
import type {
  GrantView,
  PublicationView,
  RepositoryItemView,
  ResearchAdminOverview,
  ResearchProjectView,
  ResearchSettings,
  ResearchWorkspaceView,
  ThesisView,
} from './research-operations-types';

export class ResearchError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'ResearchError';
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function dbNumber(value: bigint | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function parseBooleanRow(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function parseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) || typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return null;
  }
}

function dateOnly(value: Date | string | null, timezone: string): string | null {
  if (!value) return null;
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

type SettingsRow = {
  timezone: string;
  currency: string;
  supervisor_capacity: number;
  proposal_requires_review: boolean;
  similarity_threshold_ok: number;
  similarity_threshold_review: number;
  repository_requires_approval: boolean;
  default_embargo_days: number | null;
};

const DEFAULT_RESEARCH_SETTINGS: ResearchSettings = {
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  supervisorCapacity: 6,
  proposalRequiresReview: true,
  similarityThresholdOk: 10,
  similarityThresholdReview: 20,
  repositoryRequiresApproval: true,
  defaultEmbargoDays: null,
};

async function getResearchSettingsRow(tenantId: string): Promise<SettingsRow | null> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT timezone, currency, supervisor_capacity, proposal_requires_review,
             similarity_threshold_ok, similarity_threshold_review,
             repository_requires_approval, default_embargo_days
      FROM campusos_research.research_settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getResearchSettings(tenantId: string): Promise<ResearchSettings> {
  const row = await getResearchSettingsRow(tenantId);
  if (!row) return { ...DEFAULT_RESEARCH_SETTINGS };
  return {
    timezone: row.timezone || 'Asia/Kolkata',
    currency: row.currency || 'INR',
    supervisorCapacity: row.supervisor_capacity ?? 6,
    proposalRequiresReview: parseBooleanRow(row.proposal_requires_review),
    similarityThresholdOk: row.similarity_threshold_ok ?? 10,
    similarityThresholdReview: row.similarity_threshold_review ?? 20,
    repositoryRequiresApproval: parseBooleanRow(row.repository_requires_approval),
    defaultEmbargoDays: row.default_embargo_days,
  };
}

async function ensureResearchSettingsRow(tenantId: string) {
  await prisma.$executeRaw`
    INSERT INTO campusos_research.research_settings (tenant_id, updated_at)
    VALUES (${tenantId}::uuid, now())
    ON CONFLICT (tenant_id) DO NOTHING
  `;
}

export async function updateResearchSettings(
  context: ActiveUserContext,
  patch: Partial<ResearchSettings>,
): Promise<ResearchSettings> {
  assertResearchPermission(isResearchConfigurator(context), 'research:settings:update');
  const settings = await getResearchSettings(context.tenantId);
  const timezone = patch.timezone ?? settings.timezone;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  } catch {
    throw new ResearchError('Timezone is invalid.', 400);
  }
  const currency = (patch.currency ?? settings.currency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new ResearchError('Currency must be a 3-letter ISO code.', 400);

  await ensureResearchSettingsRow(context.tenantId);
  await prisma.$executeRaw`
    UPDATE campusos_research.research_settings
    SET timezone = ${timezone}, currency = ${currency},
        supervisor_capacity = ${patch.supervisorCapacity ?? settings.supervisorCapacity},
        proposal_requires_review = ${patch.proposalRequiresReview ?? settings.proposalRequiresReview},
        similarity_threshold_ok = ${patch.similarityThresholdOk ?? settings.similarityThresholdOk},
        similarity_threshold_review = ${patch.similarityThresholdReview ?? settings.similarityThresholdReview},
        repository_requires_approval = ${patch.repositoryRequiresApproval ?? settings.repositoryRequiresApproval},
        default_embargo_days = ${patch.defaultEmbargoDays !== undefined ? patch.defaultEmbargoDays : settings.defaultEmbargoDays},
        updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid
  `;
  await writeResearchAudit(context, 'SETTINGS_UPDATED', 'research_settings', context.tenantId, settings, patch, 'Research policy settings updated');
  return getResearchSettings(context.tenantId);
}

async function writeResearchAudit(
  context: ActiveUserContext,
  action: string,
  targetType: string,
  targetId: string | null,
  previousState: unknown,
  newState: unknown,
  reason?: string,
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_research.research_audit_events
        (id, tenant_id, actor_user_id, actor_role, action, target_type, target_id,
         previous_state, new_state, reason, created_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid, ${context.activeRole},
         ${action}, ${targetType}, ${targetId}, ${JSON.stringify(previousState ?? null)}::jsonb,
         ${JSON.stringify(newState ?? null)}::jsonb, ${reason ?? null}, now())
    `;
  } catch {
    // Audit failures must never break the primary operation.
  }
}

// ---------------------------------------------------------------------------
// Projects + scoped access
// ---------------------------------------------------------------------------

type ProjectRow = {
  id: string;
  title: string;
  abstract: string | null;
  research_type: string;
  department_id: string | null;
  department_name: string | null;
  research_area: string | null;
  status: string;
  start_date: Date | null;
  expected_completion: Date | null;
  funding_source: string | null;
  keywords: unknown;
};

/** Server-resolved project access — membership rows are the only grant. */
async function projectAccess(context: ActiveUserContext, projectId: string): Promise<'NONE' | 'READ' | 'REVIEW' | 'MANAGE'> {
  const rows = await prisma.$queryRaw<Array<{ access: string }>>`
    SELECT access FROM campusos_research.research_access_rules
    WHERE tenant_id = ${context.tenantId}::uuid AND entity_type = 'PROJECT'
      AND entity_id = ${projectId}::uuid AND user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  if (rows[0]) return rows[0].access as 'READ' | 'REVIEW' | 'MANAGE';
  if (isResearchOperator(context)) {
    // HOD/DEAN/REGISTRAR oversight is department-scoped where a department exists.
    const project = await prisma.$queryRaw<Array<{ department_id: string | null }>>`
      SELECT department_id FROM campusos_research.research_projects
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${projectId}::uuid LIMIT 1
    `;
    if (project[0]?.department_id && context.departmentId && project[0].department_id !== context.departmentId) {
      return 'NONE';
    }
    return 'REVIEW';
  }
  const member = await prisma.$queryRaw<Array<{ member_role: string }>>`
    SELECT member_role FROM campusos_research.project_members
    WHERE tenant_id = ${context.tenantId}::uuid AND project_id = ${projectId}::uuid AND user_id = ${context.userId}::uuid AND is_active = true
    LIMIT 1
  `;
  if (member[0]) return member[0].member_role === 'STUDENT_RESEARCHER' ? 'READ' : 'REVIEW';
  return 'NONE';
}

async function ensureProjectAccess(context: ActiveUserContext, projectId: string, required: 'READ' | 'REVIEW' | 'MANAGE'): Promise<void> {
  const access = await projectAccess(context, projectId);
  if (access === 'NONE') throw new ResearchError('You do not have access to this research project.', 403);
  if (required === 'MANAGE' && access !== 'MANAGE') throw new ResearchError('You do not have manage access to this project.', 403);
  if (required === 'REVIEW' && access === 'READ') throw new ResearchError('You do not have review access to this project.', 403);
}

async function mapProjectRow(context: ActiveUserContext, row: ProjectRow): Promise<ResearchProjectView> {
  const settings = await getResearchSettings(context.tenantId);
  const [members, supervisors, proposal, milestones] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; user_id: string; member_role: string; user_name: string }>>`
      SELECT pm.id, pm.user_id, pm.member_role, u.name AS user_name
      FROM campusos_research.project_members pm
      JOIN public.users u ON u.id = pm.user_id
      WHERE pm.tenant_id = ${context.tenantId}::uuid AND pm.project_id = ${row.id}::uuid AND pm.is_active = true
    `,
    prisma.$queryRaw<Array<{ id: string; supervisor_id: string; role: string; status: string; supervisor_name: string }>>`
      SELECT ps.id, ps.supervisor_id, ps.role, ps.status, u.name AS supervisor_name
      FROM campusos_research.project_supervisors ps
      JOIN public.users u ON u.id = ps.supervisor_id
      WHERE ps.tenant_id = ${context.tenantId}::uuid AND ps.project_id = ${row.id}::uuid
    `,
    prisma.$queryRaw<Array<{ status: string }>>`
      SELECT status FROM campusos_research.research_proposals
      WHERE tenant_id = ${context.tenantId}::uuid AND project_id = ${row.id}::uuid
      ORDER BY created_at DESC LIMIT 1
    `,
    prisma.$queryRaw<Array<{ total: bigint | number; completed: bigint | number }>>`
      SELECT count(*) AS total,
             count(*) FILTER (WHERE status IN ('APPROVED', 'REJECTED')) AS completed
      FROM campusos_research.milestones
      WHERE tenant_id = ${context.tenantId}::uuid AND project_id = ${row.id}::uuid
    `,
  ]);
  const myRole = members.find((member) => member.user_id === context.userId)?.member_role ?? null;
  return {
    id: row.id,
    title: row.title,
    abstract: row.abstract,
    researchType: row.research_type,
    departmentId: row.department_id,
    departmentName: row.department_name,
    researchArea: row.research_area,
    status: row.status,
    startDate: dateOnly(row.start_date, settings.timezone),
    expectedCompletion: dateOnly(row.expected_completion, settings.timezone),
    fundingSource: row.funding_source,
    keywords: parseJson<unknown[]>(row.keywords) ?? [],
    myRole,
    members: members.map((member) => ({ id: member.id, userId: member.user_id, memberRole: member.member_role, userName: member.user_name })),
    supervisors: supervisors.map((supervisor) => ({
      id: supervisor.id,
      supervisorId: supervisor.supervisor_id,
      role: supervisor.role,
      status: supervisor.status,
      supervisorName: supervisor.supervisor_name,
    })),
    proposalStatus: proposal[0]?.status ?? null,
    milestoneSummary: {
      total: dbNumber(milestones[0]?.total ?? 0),
      completed: dbNumber(milestones[0]?.completed ?? 0),
      pending: dbNumber(milestones[0]?.total ?? 0) - dbNumber(milestones[0]?.completed ?? 0),
    },
  };
}

export async function createResearchProject(
  context: ActiveUserContext,
  input: {
    title: string;
    abstract?: string;
    researchType?: string;
    departmentId?: string;
    researchArea?: string;
    keywords?: string[];
    startDate?: string;
    expectedCompletion?: string;
    fundingSource?: string;
  },
): Promise<ResearchProjectView> {
  assertResearchPermission(canContributeResearch(context), 'research:projects:create');
  if (!input.title.trim()) throw new ResearchError('Project title is required.', 400);
  const projectId = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_research.research_projects
        (id, tenant_id, title, abstract, research_type, department_id, research_area, status,
         start_date, expected_completion, funding_source, keywords, created_by, created_at, updated_at)
      VALUES
        (${projectId}::uuid, ${context.tenantId}::uuid, ${input.title.trim()}, ${input.abstract ?? null},
         ${input.researchType ?? 'STUDENT_PROJECT'},
         ${input.departmentId ? Prisma.sql`${input.departmentId}::uuid` : Prisma.sql`NULL`},
         ${input.researchArea ?? null}, 'DRAFT',
         ${input.startDate ? Prisma.sql`${input.startDate}::date` : Prisma.sql`NULL`},
         ${input.expectedCompletion ? Prisma.sql`${input.expectedCompletion}::date` : Prisma.sql`NULL`},
         ${input.fundingSource ?? null}, ${JSON.stringify(input.keywords ?? [])}::jsonb,
         ${context.userId}::uuid, now(), now())
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_research.project_members
        (id, tenant_id, project_id, user_id, member_role, is_active, assigned_by, assigned_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${projectId}::uuid, ${context.userId}::uuid,
         ${context.activeRole === 'FACULTY' ? 'PRINCIPAL_INVESTIGATOR' : 'STUDENT_RESEARCHER'}, true,
         ${context.userId}::uuid, now())
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_research.research_access_rules
        (id, tenant_id, entity_type, entity_id, user_id, access, granted_by, granted_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, 'PROJECT', ${projectId}::uuid, ${context.userId}::uuid,
         'MANAGE', ${context.userId}::uuid, now())
    `;
  }, { timeout: 30_000 });
  await writeResearchAudit(context, 'PROJECT_CREATED', 'research_projects', projectId, null, input, 'Research project created');
  const rows = await prisma.$queryRaw<ProjectRow[]>`
    SELECT p.id, p.title, p.abstract, p.research_type, p.department_id, d.name AS department_name,
           p.research_area, p.status, p.start_date, p.expected_completion, p.funding_source, p.keywords
    FROM campusos_research.research_projects p
    LEFT JOIN public.departments d ON d.id = p.department_id
    WHERE p.tenant_id = ${context.tenantId}::uuid AND p.id = ${projectId}::uuid LIMIT 1
  `;
  return mapProjectRow(context, rows[0]);
}

export async function listAccessibleProjects(context: ActiveUserContext): Promise<ResearchProjectView[]> {
  const rows = await prisma.$queryRaw<ProjectRow[]>`
    SELECT p.id, p.title, p.abstract, p.research_type, p.department_id, d.name AS department_name,
           p.research_area, p.status, p.start_date, p.expected_completion, p.funding_source, p.keywords
    FROM campusos_research.research_projects p
    LEFT JOIN public.departments d ON d.id = p.department_id
    WHERE p.tenant_id = ${context.tenantId}::uuid
      AND (
        EXISTS (SELECT 1 FROM campusos_research.research_access_rules r
                WHERE r.tenant_id = p.tenant_id AND r.entity_type = 'PROJECT'
                  AND r.entity_id = p.id AND r.user_id = ${context.userId}::uuid)
        OR EXISTS (SELECT 1 FROM campusos_research.project_members pm
                   WHERE pm.tenant_id = p.tenant_id AND pm.project_id = p.id
                     AND pm.user_id = ${context.userId}::uuid AND pm.is_active = true)
        OR EXISTS (SELECT 1 FROM campusos_research.project_supervisors ps
                   WHERE ps.tenant_id = p.tenant_id AND ps.project_id = p.id
                     AND ps.supervisor_id = ${context.userId}::uuid)
        OR ${context.departmentId ? Prisma.sql`p.department_id = ${context.departmentId}::uuid` : Prisma.sql`false`}
      )
    ORDER BY p.created_at DESC
    LIMIT 200
  `;
  return Promise.all(rows.map((row) => mapProjectRow(context, row)));
}

export async function assignSupervisor(
  context: ActiveUserContext,
  projectId: string,
  input: { supervisorId: string; role?: string },
): Promise<ResearchProjectView> {
  assertResearchPermission(canAssignSupervisors(context), 'research:supervisors:assign');
  await ensureProjectAccess(context, projectId, 'REVIEW');
  if (!UUID_RE.test(input.supervisorId)) throw new ResearchError('Invalid supervisor identifier.', 400);

  // Supervisor must be a verified staff/faculty member of the institution.
  const supervisor = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM public.staff
    WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${input.supervisorId}::uuid LIMIT 1
  `;
  if (!supervisor[0]) throw new ResearchError('The proposed supervisor is not a verified staff member here.', 404);

  const settings = await getResearchSettings(context.tenantId);
  const activeCount = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT count(*) AS total FROM campusos_research.project_supervisors
    WHERE tenant_id = ${context.tenantId}::uuid AND supervisor_id = ${input.supervisorId}::uuid
      AND status IN ('ASSIGNED', 'ACCEPTED')
  `;
  if (dbNumber(activeCount[0]?.total ?? 0) >= settings.supervisorCapacity) {
    throw new ResearchError('This supervisor is at their configured supervision capacity.', 409);
  }

  await prisma.$executeRaw`
    INSERT INTO campusos_research.project_supervisors
      (id, tenant_id, project_id, supervisor_id, role, status, assigned_by, assigned_at)
    VALUES
      (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${projectId}::uuid, ${input.supervisorId}::uuid,
       ${input.role ?? 'GUIDE'}, 'ASSIGNED', ${context.userId}::uuid, now())
    ON CONFLICT (project_id, supervisor_id)
    DO UPDATE SET status = 'ASSIGNED', assigned_by = EXCLUDED.assigned_by, assigned_at = now()
  `;
  await writeResearchAudit(context, 'SUPERVISOR_ASSIGNED', 'research_projects', projectId, null, { supervisorId: input.supervisorId, role: input.role ?? 'GUIDE' }, 'Supervisor assigned');
  const rows = await prisma.$queryRaw<ProjectRow[]>`
    SELECT p.id, p.title, p.abstract, p.research_type, p.department_id, d.name AS department_name,
           p.research_area, p.status, p.start_date, p.expected_completion, p.funding_source, p.keywords
    FROM campusos_research.research_projects p
    LEFT JOIN public.departments d ON d.id = p.department_id
    WHERE p.tenant_id = ${context.tenantId}::uuid AND p.id = ${projectId}::uuid LIMIT 1
  `;
  return mapProjectRow(context, rows[0]);
}

// ---------------------------------------------------------------------------
// Proposals + milestones
// ---------------------------------------------------------------------------

export async function submitProposal(
  context: ActiveUserContext,
  projectId: string,
  input: {
    title: string;
    problemStatement?: string;
    objectives?: string[];
    methodology?: string;
    literatureReview?: string;
    expectedOutcome?: string;
    timeline?: Record<string, unknown>;
  },
): Promise<{ id: string; version: number; status: string }> {
  await ensureProjectAccess(context, projectId, 'READ');
  if (!input.title.trim()) throw new ResearchError('Proposal title is required.', 400);

  const proposalId = randomUUID();
  let version = 1;
  await prisma.$transaction(async (tx) => {
    const existing = await tx.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_research.research_proposals
      WHERE tenant_id = ${context.tenantId}::uuid AND project_id = ${projectId}::uuid LIMIT 1
    `;
    const targetProposalId = existing[0]?.id ?? proposalId;
    if (existing[0]) {
      const versionRow = await tx.$queryRaw<Array<{ next_version: bigint | number }>>`
        SELECT COALESCE(max(version), 0) + 1 AS next_version
        FROM campusos_research.proposal_versions
        WHERE tenant_id = ${context.tenantId}::uuid AND proposal_id = ${targetProposalId}::uuid
      `;
      version = dbNumber(versionRow[0]?.next_version ?? 1);
    } else {
      await tx.$executeRaw`
        INSERT INTO campusos_research.research_proposals
          (id, tenant_id, project_id, status, submitted_by, submitted_at, created_at, updated_at)
        VALUES
          (${targetProposalId}::uuid, ${context.tenantId}::uuid, ${projectId}::uuid, 'SUBMITTED',
           ${context.userId}::uuid, now(), now(), now())
      `;
    }
    await tx.$executeRaw`
      INSERT INTO campusos_research.proposal_versions
        (id, tenant_id, proposal_id, version, title, problem_statement, objectives, methodology,
         literature_review, expected_outcome, timeline, resource_requirements, submitted_by, submitted_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${targetProposalId}::uuid, ${version},
         ${input.title.trim()}, ${input.problemStatement ?? null}, ${JSON.stringify(input.objectives ?? [])}::jsonb,
         ${input.methodology ?? null}, ${input.literatureReview ?? null}, ${input.expectedOutcome ?? null},
         ${JSON.stringify(input.timeline ?? {})}::jsonb, null, ${context.userId}::uuid, now())
    `;
  }, { timeout: 30_000 });

  await writeResearchAudit(context, 'PROPOSAL_SUBMITTED', 'research_proposals', projectId, null, { version }, 'Proposal version submitted');
  return { id: proposalId, version, status: 'SUBMITTED' };
}

export async function reviewProposal(
  context: ActiveUserContext,
  projectId: string,
  input: { decision: 'APPROVE' | 'REJECT' | 'REVISION_REQUIRED'; note?: string },
): Promise<{ status: string }> {
  assertResearchPermission(canApproveResearch(context), 'research:proposals:review');
  await ensureProjectAccess(context, projectId, 'REVIEW');
  await prisma.$executeRaw`
    UPDATE campusos_research.research_proposals
    SET status = ${input.decision === 'APPROVE' ? 'APPROVED' : input.decision === 'REJECT' ? 'REJECTED' : 'REVISION_REQUIRED'},
        reviewed_by = ${context.userId}::uuid, reviewed_at = now(), updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND project_id = ${projectId}::uuid
  `;
  await prisma.$executeRaw`
    UPDATE campusos_research.research_projects
    SET status = ${input.decision === 'APPROVE' ? 'APPROVED' : 'PROPOSED'}, updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${projectId}::uuid
  `;
  await writeResearchAudit(context, 'PROPOSAL_REVIEWED', 'research_proposals', projectId, null, { decision: input.decision }, input.note);
  return { status: input.decision === 'APPROVE' ? 'APPROVED' : input.decision === 'REJECT' ? 'REJECTED' : 'REVISION_REQUIRED' };
}

export async function addMilestone(
  context: ActiveUserContext,
  projectId: string,
  input: { title: string; description?: string; dueDate?: string },
): Promise<{ id: string; title: string }> {
  await ensureProjectAccess(context, projectId, 'REVIEW');
  if (!input.title.trim()) throw new ResearchError('Milestone title is required.', 400);
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_research.milestones
      (id, tenant_id, project_id, title, description, due_date, status, position, created_by, created_at, updated_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${projectId}::uuid, ${input.title.trim()},
       ${input.description ?? null}, ${input.dueDate ? Prisma.sql`${input.dueDate}::date` : Prisma.sql`NULL`},
       'PENDING', 0, ${context.userId}::uuid, now(), now())
  `;
  await writeResearchAudit(context, 'MILESTONE_ADDED', 'milestones', id, null, input, 'Milestone added');
  return { id, title: input.title };
}

export async function submitMilestone(
  context: ActiveUserContext,
  milestoneId: string,
  input: { notes?: string; fileReference?: string },
): Promise<{ id: string; status: string }> {
  const rows = await prisma.$queryRaw<Array<{ project_id: string }>>`
    SELECT project_id FROM campusos_research.milestones
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${milestoneId}::uuid LIMIT 1
  `;
  if (!rows[0]) throw new ResearchError('Milestone not found.', 404);
  await ensureProjectAccess(context, rows[0].project_id, 'READ');
  const id = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_research.milestone_submissions
        (id, tenant_id, milestone_id, submitted_by, submitted_at, notes, file_reference, status)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${milestoneId}::uuid, ${context.userId}::uuid, now(),
         ${input.notes ?? null}, ${input.fileReference ?? null}, 'SUBMITTED')
    `;
    await tx.$executeRaw`
      UPDATE campusos_research.milestones
      SET status = 'SUBMITTED', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${milestoneId}::uuid
    `;
  }, { timeout: 30_000 });
  await writeResearchAudit(context, 'MILESTONE_SUBMITTED', 'milestones', milestoneId, null, input, 'Milestone submitted');
  return { id, status: 'SUBMITTED' };
}

export async function reviewMilestone(
  context: ActiveUserContext,
  milestoneId: string,
  input: { decision: 'APPROVE' | 'REJECT' | 'REVISION_REQUIRED'; feedback?: string },
): Promise<{ id: string; status: string }> {
  assertResearchPermission(canReviewResearch(context), 'research:milestones:review');
  const rows = await prisma.$queryRaw<Array<{ project_id: string }>>`
    SELECT project_id FROM campusos_research.milestones
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${milestoneId}::uuid LIMIT 1
  `;
  if (!rows[0]) throw new ResearchError('Milestone not found.', 404);
  await ensureProjectAccess(context, rows[0].project_id, 'REVIEW');
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_research.milestones
      SET status = ${input.decision === 'APPROVE' ? 'APPROVED' : input.decision === 'REJECT' ? 'REJECTED' : 'REVISION_REQUIRED'},
          updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${milestoneId}::uuid
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_research.milestone_submissions
        (id, tenant_id, milestone_id, submitted_by, submitted_at, notes, status, reviewed_by, reviewed_at, feedback)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${milestoneId}::uuid, ${context.userId}::uuid, now(),
         ${input.feedback ?? null}, 'REVIEWED', ${context.userId}::uuid, now(), ${input.feedback ?? null})
    `;
  }, { timeout: 30_000 });
  await writeResearchAudit(context, 'MILESTONE_REVIEWED', 'milestones', milestoneId, null, { decision: input.decision }, input.feedback);
  return { id: milestoneId, status: input.decision === 'APPROVE' ? 'APPROVED' : input.decision === 'REJECT' ? 'REJECTED' : 'REVISION_REQUIRED' };
}

// ---------------------------------------------------------------------------
// Theses
// ---------------------------------------------------------------------------

export async function createThesis(
  context: ActiveUserContext,
  input: { title: string; projectId?: string; programId?: string; departmentId?: string },
): Promise<ThesisView> {
  assertResearchPermission(canContributeResearch(context), 'research:theses:create');
  if (!input.title.trim()) throw new ResearchError('Thesis title is required.', 400);
  if (input.projectId) await ensureProjectAccess(context, input.projectId, 'READ');
  const thesisId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_research.theses
      (id, tenant_id, student_user_id, project_id, title, program_id, department_id, status, created_at, updated_at)
    VALUES
      (${thesisId}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid,
       ${input.projectId ? Prisma.sql`${input.projectId}::uuid` : Prisma.sql`NULL`},
       ${input.title.trim()}, ${input.programId ? Prisma.sql`${input.programId}::uuid` : Prisma.sql`NULL`},
       ${input.departmentId ? Prisma.sql`${input.departmentId}::uuid` : Prisma.sql`NULL`},
       'TOPIC_PROPOSED', now(), now())
  `;
  await writeResearchAudit(context, 'THESIS_CREATED', 'theses', thesisId, null, input, 'Thesis created');
  return getThesisById(context, thesisId);
}

export async function submitThesisVersion(
  context: ActiveUserContext,
  thesisId: string,
  input: { fileName: string; fileReference: string },
): Promise<ThesisView> {
  const thesis = await getThesisById(context, thesisId);
  if (thesis.studentUserId !== context.userId && !isResearchOperator(context)) {
    throw new ResearchError('Only the thesis owner may submit versions.', 403);
  }
  if (!input.fileReference.trim()) throw new ResearchError('A file reference is required.', 400);
  await prisma.$transaction(async (tx) => {
    const versionRow = await tx.$queryRaw<Array<{ next_version: bigint | number }>>`
      SELECT COALESCE(max(version), 0) + 1 AS next_version
      FROM campusos_research.thesis_versions
      WHERE tenant_id = ${context.tenantId}::uuid AND thesis_id = ${thesisId}::uuid
    `;
    const version = dbNumber(versionRow[0]?.next_version ?? 1);
    await tx.$executeRaw`
      INSERT INTO campusos_research.thesis_versions
        (id, tenant_id, thesis_id, version, file_reference, file_name, submitted_by, submitted_at, status)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${thesisId}::uuid, ${version},
         ${input.fileReference}, ${input.fileName ?? null}, ${context.userId}::uuid, now(), 'SUBMITTED')
    `;
    await tx.$executeRaw`
      UPDATE campusos_research.theses
      SET status = 'DRAFT', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${thesisId}::uuid
    `;
  }, { timeout: 30_000 });
  await writeResearchAudit(context, 'THESIS_VERSION_SUBMITTED', 'theses', thesisId, null, input, 'Thesis version submitted');
  return getThesisById(context, thesisId);
}

export async function recordSimilarityCheck(
  context: ActiveUserContext,
  thesisId: string,
  input: { provider: string; submissionReference?: string; similarityScore?: number },
): Promise<{ id: string; outcome: string | null }> {
  assertResearchPermission(canReviewSimilarity(context), 'research:similarity:record');
  await getThesisById(context, thesisId);
  if (!input.provider.trim()) throw new ResearchError('Provider is required.', 400);
  const settings = await getResearchSettings(context.tenantId);
  const id = randomUUID();
  // A similarity score is input to human review — never automatic guilt.
  const outcome = input.similarityScore === undefined
    ? null
    : input.similarityScore <= settings.similarityThresholdOk
      ? 'ACCEPTABLE'
      : input.similarityScore <= settings.similarityThresholdReview
        ? 'REVIEW_REQUIRED'
        : 'ESCALATED';
  await prisma.$executeRaw`
    INSERT INTO campusos_research.similarity_checks
      (id, tenant_id, thesis_id, provider, submission_reference, similarity_score, report_status,
       outcome, reviewed_by, reviewed_at, created_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${thesisId}::uuid, ${input.provider},
       ${input.submissionReference ?? null}, ${input.similarityScore ?? null}, 'PROCESSED',
       ${outcome}, ${context.userId}::uuid, now(), now())
  `;
  await writeResearchAudit(context, 'SIMILARITY_RECORDED', 'theses', thesisId, null, input, 'Similarity check recorded');
  return { id, outcome };
}

export async function reviewThesis(
  context: ActiveUserContext,
  thesisId: string,
  input: { decision: 'APPROVE' | 'REJECT' | 'CORRECTIONS_REQUIRED'; note?: string },
): Promise<ThesisView> {
  assertResearchPermission(canApproveResearch(context), 'research:theses:review');
  const thesis = await getThesisById(context, thesisId);
  await prisma.$transaction(async (tx) => {
    const nextStatus = input.decision === 'APPROVE' ? 'APPROVED' : input.decision === 'REJECT' ? 'REJECTED' : 'CORRECTIONS_REQUIRED';
    await tx.$executeRaw`
      UPDATE campusos_research.theses
      SET status = ${nextStatus},
          approved_at = ${input.decision === 'APPROVE' ? Prisma.sql`now()` : Prisma.sql`NULL`},
          updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${thesisId}::uuid
    `;
    if (input.decision === 'CORRECTIONS_REQUIRED') {
      await tx.$executeRaw`
        INSERT INTO campusos_research.corrections
          (id, tenant_id, thesis_id, details, requested_by, requested_at, status)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${thesisId}::uuid,
           ${input.note ?? 'Corrections requested by the review committee'}, ${context.userId}::uuid, now(), 'REQUESTED')
      `;
    }
  }, { timeout: 30_000 });
  await writeResearchAudit(context, 'THESIS_REVIEWED', 'theses', thesisId, { status: thesis.status }, { decision: input.decision }, input.note);
  return getThesisById(context, thesisId);
}

export async function getThesisById(context: ActiveUserContext, thesisId: string): Promise<ThesisView> {
  if (!UUID_RE.test(thesisId)) throw new ResearchError('Invalid thesis identifier.', 400);
  const rows = await prisma.$queryRaw<Array<{
    id: string; student_user_id: string; project_id: string | null; title: string; status: string;
    registered_at: Date | null; final_submitted_at: Date | null; approved_at: Date | null;
    student_name: string;
  }>>`
    SELECT t.id, t.student_user_id, t.project_id, t.title, t.status, t.registered_at,
           t.final_submitted_at, t.approved_at, u.name AS student_name
    FROM campusos_research.theses t
    JOIN public.users u ON u.id = t.student_user_id
    WHERE t.tenant_id = ${context.tenantId}::uuid AND t.id = ${thesisId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new ResearchError('Thesis not found.', 404);
  if (rows[0].student_user_id !== context.userId && !isResearchOperator(context) && !isReviewerForThesis(context, rows[0])) {
    throw new ResearchError('You do not have access to this thesis.', 403);
  }
  const settings = await getResearchSettings(context.tenantId);
  const [versions, similarity, viva] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; version: number; file_name: string | null; submitted_at: Date; status: string }>>`
      SELECT id, version, file_name, submitted_at, status FROM campusos_research.thesis_versions
      WHERE tenant_id = ${context.tenantId}::uuid AND thesis_id = ${thesisId}::uuid ORDER BY version DESC
    `,
    prisma.$queryRaw<Array<{
      id: string; provider: string; similarity_score: number | null; report_status: string;
      outcome: string | null; reviewed_at: Date | null;
    }>>`
      SELECT id, provider, similarity_score, report_status, outcome, reviewed_at
      FROM campusos_research.similarity_checks
      WHERE tenant_id = ${context.tenantId}::uuid AND thesis_id = ${thesisId}::uuid ORDER BY created_at DESC
    `,
    prisma.$queryRaw<Array<{ id: string; scheduled_at: Date; mode: string; status: string; outcome: string | null }>>`
      SELECT id, scheduled_at, mode, status, outcome FROM campusos_research.viva_sessions
      WHERE tenant_id = ${context.tenantId}::uuid AND thesis_id = ${thesisId}::uuid ORDER BY scheduled_at DESC
    `,
  ]);
  return {
    id: rows[0].id,
    studentUserId: rows[0].student_user_id,
    studentName: rows[0].student_name,
    projectId: rows[0].project_id,
    title: rows[0].title,
    status: rows[0].status,
    registeredAt: rows[0].registered_at ? rows[0].registered_at.toISOString() : null,
    finalSubmittedAt: rows[0].final_submitted_at ? rows[0].final_submitted_at.toISOString() : null,
    approvedAt: rows[0].approved_at ? rows[0].approved_at.toISOString() : null,
    versions: versions.map((version) => ({ id: version.id, version: version.version, fileName: version.file_name, submittedAt: version.submitted_at.toISOString(), status: version.status })),
    similarity: similarity.map((check) => ({
      id: check.id,
      provider: check.provider,
      similarityScore: check.similarity_score,
      reportStatus: check.report_status,
      outcome: check.outcome,
      reviewedAt: check.reviewed_at ? check.reviewed_at.toISOString() : null,
    })),
    viva: viva.map((session) => ({ id: session.id, scheduledAt: session.scheduled_at.toISOString(), mode: session.mode, status: session.status, outcome: session.outcome })),
  };
}

function isReviewerForThesis(context: ActiveUserContext, thesis: { project_id: string | null; student_user_id: string }): boolean {
  void thesis;
  return isResearchOperator(context);
}

export async function listMyTheses(context: ActiveUserContext): Promise<ThesisView[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_research.theses
    WHERE tenant_id = ${context.tenantId}::uuid AND student_user_id = ${context.userId}::uuid
    ORDER BY created_at DESC LIMIT 20
  `;
  return Promise.all(rows.map((row) => getThesisById(context, row.id)));
}

// ---------------------------------------------------------------------------
// Repository
// ---------------------------------------------------------------------------

export async function submitRepositoryItem(
  context: ActiveUserContext,
  input: {
    title: string;
    authors?: Array<{ name: string }>;
    resourceType?: string;
    abstract?: string;
    keywords?: string[];
    publicationYear?: number;
    license?: string;
    fileName?: string;
    fileReference: string;
    accessLevel?: string;
  },
): Promise<RepositoryItemView> {
  assertResearchPermission(canContributeResearch(context), 'research:repository:submit');
  if (!input.title.trim()) throw new ResearchError('Repository item title is required.', 400);
  if (!input.fileReference.trim()) throw new ResearchError('A file reference is required.', 400);
  const settings = await getResearchSettings(context.tenantId);
  const itemId = randomUUID();
  const permanentId = `REP-${context.tenantId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
  const embargoDays = settings.defaultEmbargoDays;
  const accessLevel = input.accessLevel ?? (embargoDays ? 'EMBARGOED' : 'INSTITUTION_ONLY');

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_research.repository_items
        (id, tenant_id, title, authors, resource_type, abstract, keywords, publication_year,
         license, permanent_id, access_level, submission_status, created_by, created_at, updated_at)
      VALUES
        (${itemId}::uuid, ${context.tenantId}::uuid, ${input.title.trim()},
         ${JSON.stringify(input.authors ?? [{ name: 'Author' }])}::jsonb,
         ${input.resourceType ?? 'THESIS'}, ${input.abstract ?? null}, ${JSON.stringify(input.keywords ?? [])}::jsonb,
         ${input.publicationYear ?? null}, ${input.license ?? null}, ${permanentId}, ${accessLevel},
         'PENDING_APPROVAL', ${context.userId}::uuid, now(), now())
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_research.repository_versions
        (id, tenant_id, item_id, version, file_reference, file_name, uploaded_by, uploaded_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${itemId}::uuid, 1,
         ${input.fileReference}, ${input.fileName ?? null}, ${context.userId}::uuid, now())
    `;
    if (embargoDays && embargoDays > 0) {
      await tx.$executeRaw`
        INSERT INTO campusos_research.embargoes
          (id, tenant_id, item_id, reason, policy_reference, embargo_start, embargo_end, authorized_by, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${itemId}::uuid,
           'Institution default embargo', 'research:settings:default_embargo_days',
           ${new Date()}::date, ${Prisma.sql`now()::date + ${embargoDays}`}, ${context.userId}::uuid, now())
      `;
    }
  }, { timeout: 30_000 });
  await writeResearchAudit(context, 'REPOSITORY_SUBMITTED', 'repository_items', itemId, null, input, 'Repository item submitted');
  return getRepositoryItemById(context, itemId);
}

export async function approveRepositoryItem(
  context: ActiveUserContext,
  itemId: string,
  input: { decision: 'APPROVE' | 'REJECT' | 'PUBLISH'; note?: string },
): Promise<RepositoryItemView> {
  assertResearchPermission(canApproveResearch(context), 'research:repository:approve');
  const item = await getRepositoryItemById(context, itemId);
  await prisma.$executeRaw`
    UPDATE campusos_research.repository_items
    SET submission_status = ${input.decision === 'REJECT' ? 'REJECTED' : input.decision === 'PUBLISH' ? 'PUBLISHED' : 'APPROVED'},
        access_level = CASE WHEN ${input.decision === 'PUBLISH'} THEN 'PUBLIC' ELSE access_level END,
        approved_by = ${context.userId}::uuid, approved_at = now(),
        published_at = CASE WHEN ${input.decision === 'PUBLISH'} THEN now() ELSE published_at END,
        updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${itemId}::uuid
  `;
  await writeResearchAudit(context, 'REPOSITORY_REVIEWED', 'repository_items', itemId, { submissionStatus: item.submissionStatus }, { decision: input.decision }, input.note);
  return getRepositoryItemById(context, itemId);
}

export async function getRepositoryItemById(context: ActiveUserContext, itemId: string): Promise<RepositoryItemView> {
  if (!UUID_RE.test(itemId)) throw new ResearchError('Invalid repository item identifier.', 400);
  const rows = await prisma.$queryRaw<Array<{
    id: string; title: string; authors: unknown; resource_type: string; access_level: string;
    submission_status: string; permanent_id: string; publication_year: number | null;
    abstract: string | null; license: string | null; approved_at: Date | null; published_at: Date | null;
    created_by: string;
  }>>`
    SELECT id, title, authors, resource_type, access_level, submission_status, permanent_id,
           publication_year, abstract, license, approved_at, published_at, created_by
    FROM campusos_research.repository_items
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${itemId}::uuid LIMIT 1
  `;
  if (!rows[0]) throw new ResearchError('Repository item not found.', 404);
  // Draft / private / restricted records are not broadly visible.
  const draft = rows[0].submission_status === 'PENDING_APPROVAL';
  if (rows[0].created_by !== context.userId && !isResearchOperator(context) && draft) {
    throw new ResearchError('This repository item has not been approved for viewing.', 403);
  }
  const [versions, embargo] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; version: number; file_name: string | null; uploaded_at: Date }>>`
      SELECT id, version, file_name, uploaded_at FROM campusos_research.repository_versions
      WHERE tenant_id = ${context.tenantId}::uuid AND item_id = ${itemId}::uuid ORDER BY version DESC
    `,
    prisma.$queryRaw<Array<{ id: string; embargo_start: Date; embargo_end: Date | null; released_at: Date | null }>>`
      SELECT id, embargo_start, embargo_end, released_at FROM campusos_research.embargoes
      WHERE tenant_id = ${context.tenantId}::uuid AND item_id = ${itemId}::uuid ORDER BY created_at DESC
    `,
  ]);
  return {
    id: rows[0].id,
    title: rows[0].title,
    authors: parseJson<unknown[]>(rows[0].authors) ?? [],
    resourceType: rows[0].resource_type,
    accessLevel: rows[0].access_level,
    submissionStatus: rows[0].submission_status,
    permanentId: rows[0].permanent_id,
    publicationYear: rows[0].publication_year,
    abstract: rows[0].abstract,
    license: rows[0].license,
    approvedAt: rows[0].approved_at ? rows[0].approved_at.toISOString() : null,
    publishedAt: rows[0].published_at ? rows[0].published_at.toISOString() : null,
    versions: versions.map((version) => ({ id: version.id, version: version.version, fileName: version.file_name, uploadedAt: version.uploaded_at.toISOString() })),
    embargo: embargo.map((entry) => ({ id: entry.id, embargoStart: dateOnly(entry.embargo_start, 'UTC') ?? '', embargoEnd: entry.embargo_end ? dateOnly(entry.embargo_end, 'UTC') : null, releasedAt: entry.released_at ? entry.released_at.toISOString() : null })),
  };
}

export async function listRepositoryMine(context: ActiveUserContext): Promise<RepositoryItemView[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_research.repository_items
    WHERE tenant_id = ${context.tenantId}::uuid AND created_by = ${context.userId}::uuid
    ORDER BY created_at DESC LIMIT 20
  `;
  return Promise.all(rows.map((row) => getRepositoryItemById(context, row.id)));
}

export async function listRepositoryAll(context: ActiveUserContext): Promise<RepositoryItemView[]> {
  assertResearchPermission(isResearchOperator(context), 'research:repository:read');
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_research.repository_items
    WHERE tenant_id = ${context.tenantId}::uuid
    ORDER BY created_at DESC LIMIT 200
  `;
  return Promise.all(rows.map((row) => getRepositoryItemById(context, row.id)));
}

// ---------------------------------------------------------------------------
// Publications + grants
// ---------------------------------------------------------------------------

export async function addPublication(
  context: ActiveUserContext,
  input: {
    title: string;
    publicationType?: string;
    venue?: string;
    year?: number;
    doi?: string;
    evidenceReference?: string;
  },
): Promise<PublicationView> {
  assertResearchPermission(canContributeResearch(context), 'research:publications:add');
  if (!input.title.trim()) throw new ResearchError('Publication title is required.', 400);
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_research.publications
      (id, tenant_id, user_id, title, publication_type, venue, year, doi, evidence_reference,
       verification_status, created_at, updated_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid, ${input.title.trim()},
       ${input.publicationType ?? 'JOURNAL_ARTICLE'}, ${input.venue ?? null}, ${input.year ?? null},
       ${input.doi ?? null}, ${input.evidenceReference ?? null}, 'UNVERIFIED', now(), now())
  `;
  await writeResearchAudit(context, 'PUBLICATION_ADDED', 'publications', id, null, input, 'Publication record added');
  return getPublicationById(context, id);
}

async function getPublicationById(context: ActiveUserContext, publicationId: string): Promise<PublicationView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; title: string; publication_type: string; venue: string | null; year: number | null;
    doi: string | null; verification_status: string; created_at: Date;
  }>>`
    SELECT id, title, publication_type, venue, year, doi, verification_status, created_at
    FROM campusos_research.publications
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${publicationId}::uuid LIMIT 1
  `;
  if (!rows[0]) throw new ResearchError('Publication not found.', 404);
  return {
    id: rows[0].id,
    title: rows[0].title,
    publicationType: rows[0].publication_type,
    venue: rows[0].venue,
    year: rows[0].year,
    doi: rows[0].doi,
    verificationStatus: rows[0].verification_status,
    createdAt: rows[0].created_at.toISOString(),
  };
}

export async function listMyPublications(context: ActiveUserContext): Promise<PublicationView[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_research.publications
    WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${context.userId}::uuid
    ORDER BY created_at DESC LIMIT 50
  `;
  return Promise.all(rows.map((row) => getPublicationById(context, row.id)));
}

export async function listPublicationsForUser(context: ActiveUserContext, userId: string): Promise<PublicationView[]> {
  assertResearchPermission(isResearchOperator(context), 'research:publications:read');
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_research.publications
    WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${userId}::uuid
    ORDER BY created_at DESC LIMIT 100
  `;
  return Promise.all(rows.map((row) => getPublicationById(context, row.id)));
}

export async function addGrant(
  context: ActiveUserContext,
  input: {
    projectId?: string;
    fundingAgency: string;
    grantReference: string;
    title: string;
    approvedBudgetMinor: MoneyMinor;
    currency?: string;
    startDate?: string;
    endDate?: string;
  },
): Promise<GrantView> {
  assertResearchPermission(canApproveResearch(context), 'research:grants:add');
  if (!input.fundingAgency.trim() || !input.grantReference.trim() || !input.title.trim()) {
    throw new ResearchError('Funding agency, reference and title are required.', 400);
  }
  if (input.projectId) await ensureProjectAccess(context, input.projectId, 'REVIEW');
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_research.grants
      (id, tenant_id, project_id, funding_agency, grant_reference, title, approved_budget_minor,
       currency, start_date, end_date, status, pi_user_id, created_at, updated_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid,
       ${input.projectId ? Prisma.sql`${input.projectId}::uuid` : Prisma.sql`NULL`},
       ${input.fundingAgency.trim()}, ${input.grantReference.trim()}, ${input.title.trim()},
       ${input.approvedBudgetMinor}, ${(input.currency ?? 'INR').toUpperCase()},
       ${input.startDate ? Prisma.sql`${input.startDate}::date` : Prisma.sql`NULL`},
       ${input.endDate ? Prisma.sql`${input.endDate}::date` : Prisma.sql`NULL`},
       'ACTIVE', ${context.userId}::uuid, now(), now())
  `;
  await writeResearchAudit(context, 'GRANT_ADDED', 'grants', id, null, input, 'Grant record added');
  const rows = await prisma.$queryRaw<Array<{
    id: string; project_id: string | null; project_title: string | null; funding_agency: string;
    grant_reference: string; title: string; approved_budget_minor: bigint | number | string;
    currency: string; start_date: Date | null; end_date: Date | null; status: string;
  }>>`
    SELECT g.id, g.project_id, p.title AS project_title, g.funding_agency, g.grant_reference,
           g.title, g.approved_budget_minor, g.currency, g.start_date, g.end_date, g.status
    FROM campusos_research.grants g
    LEFT JOIN campusos_research.research_projects p ON p.id = g.project_id
    WHERE g.tenant_id = ${context.tenantId}::uuid AND g.id = ${id}::uuid LIMIT 1
  `;
  return {
    id: rows[0].id,
    projectId: rows[0].project_id,
    projectTitle: rows[0].project_title,
    fundingAgency: rows[0].funding_agency,
    grantReference: rows[0].grant_reference,
    title: rows[0].title,
    approvedBudgetMinor: dbNumber(rows[0].approved_budget_minor),
    currency: rows[0].currency,
    startDate: dateOnly(rows[0].start_date, 'UTC'),
    endDate: dateOnly(rows[0].end_date, 'UTC'),
    status: rows[0].status,
  };
}

export async function listGrants(context: ActiveUserContext): Promise<GrantView[]> {
  assertResearchPermission(isResearchOperator(context), 'research:grants:read');
  const rows = await prisma.$queryRaw<Array<{
    id: string; project_id: string | null; project_title: string | null; funding_agency: string;
    grant_reference: string; title: string; approved_budget_minor: bigint | number | string;
    currency: string; start_date: Date | null; end_date: Date | null; status: string;
  }>>`
    SELECT g.id, g.project_id, p.title AS project_title, g.funding_agency, g.grant_reference,
           g.title, g.approved_budget_minor, g.currency, g.start_date, g.end_date, g.status
    FROM campusos_research.grants g
    LEFT JOIN campusos_research.research_projects p ON p.id = g.project_id
    WHERE g.tenant_id = ${context.tenantId}::uuid
    ORDER BY g.created_at DESC LIMIT 100
  `;
  return rows.map((row) => ({
    id: row.id,
    projectId: row.project_id,
    projectTitle: row.project_title,
    fundingAgency: row.funding_agency,
    grantReference: row.grant_reference,
    title: row.title,
    approvedBudgetMinor: dbNumber(row.approved_budget_minor),
    currency: row.currency,
    startDate: dateOnly(row.start_date, 'UTC'),
    endDate: dateOnly(row.end_date, 'UTC'),
    status: row.status,
  }));
}

// ---------------------------------------------------------------------------
// Workspace + admin overview
// ---------------------------------------------------------------------------

export async function getResearchWorkspaceView(context: ActiveUserContext): Promise<ResearchWorkspaceView> {
  const settings = await getResearchSettings(context.tenantId);
  const canOperate = isResearchOperator(context);
  const canApprove = canApproveResearch(context);
  const canAssign = canAssignSupervisors(context);
  const [myProjects, myTheses, myPublications, supervised, repositoryMine] = await Promise.all([
    listAccessibleProjects(context),
    listMyTheses(context),
    listMyPublications(context),
    isResearchOperator(context) || context.activeRole === 'FACULTY'
      ? (async () => {
          const rows = await prisma.$queryRaw<ProjectRow[]>`
            SELECT p.id, p.title, p.abstract, p.research_type, p.department_id, d.name AS department_name,
                   p.research_area, p.status, p.start_date, p.expected_completion, p.funding_source, p.keywords
            FROM campusos_research.research_projects p
            LEFT JOIN public.departments d ON d.id = p.department_id
            WHERE p.tenant_id = ${context.tenantId}::uuid
              AND EXISTS (SELECT 1 FROM campusos_research.project_supervisors ps
                          WHERE ps.tenant_id = p.tenant_id AND ps.project_id = p.id
                            AND ps.supervisor_id = ${context.userId}::uuid)
            ORDER BY p.created_at DESC LIMIT 50
          `;
          return Promise.all(rows.map((row) => mapProjectRow(context, row)));
        })()
      : Promise.resolve([]),
    listRepositoryMine(context),
  ]);

  const pendingForReview = await prisma.$queryRaw<Array<{ id: string; kind: string; title: string; status: string; created_at: Date }>>(Prisma.sql`
    SELECT rp.id, 'PROPOSAL' AS kind, rp.title, rp.status, rp.created_at
    FROM campusos_research.research_proposals rp
    WHERE rp.tenant_id = ${context.tenantId}::uuid AND rp.status IN ('SUBMITTED', 'SUPERVISOR_REVIEW', 'COMMITTEE_REVIEW')
    UNION ALL
    SELECT t.id, 'THESIS' AS kind, t.title, t.status, t.created_at
    FROM campusos_research.theses t
    WHERE t.tenant_id = ${context.tenantId}::uuid AND t.status IN ('DRAFT', 'SIMILARITY_REVIEW', 'PRE_SUBMISSION', 'UNDER_EVALUATION')
    UNION ALL
    SELECT r.id, 'REPOSITORY' AS kind, r.title, r.submission_status, r.created_at
    FROM campusos_research.repository_items r
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.submission_status = 'PENDING_APPROVAL'
    ORDER BY created_at DESC LIMIT 20
  `);

  return {
    settings,
    role: context.activeRole,
    currentUserId: context.userId,
    canOperate,
    canApprove,
    canAssignSupervisors: canAssign,
    myProjects,
    myTheses,
    myPublications,
    supervisedProjects: supervised,
    pendingForReview: pendingForReview.map((row) => ({ id: row.id, kind: row.kind, title: row.title, status: row.status, createdAt: row.created_at.toISOString() })),
    repositoryMine,
    metrics: [
      { id: 'projects', label: 'My projects', value: myProjects.length, hint: 'Accessible projects', tone: 'neutral' },
      { id: 'supervised', label: 'Supervised projects', value: supervised.length, hint: 'Under my supervision', tone: 'neutral' },
      { id: 'theses', label: 'My theses', value: myTheses.length, hint: 'Thesis records', tone: 'neutral' },
      { id: 'publications', label: 'Publications', value: myPublications.length, hint: 'My research output', tone: 'neutral' },
      { id: 'pending', label: 'Pending reviews', value: pendingForReview.length, hint: 'Awaiting decision', tone: pendingForReview.length > 0 ? 'warning' : 'positive' },
      { id: 'repository', label: 'Repository items', value: repositoryMine.length, hint: 'My submissions', tone: 'neutral' },
    ],
  };
}

export async function getResearchAdminOverview(context: ActiveUserContext): Promise<ResearchAdminOverview> {
  assertResearchPermission(isResearchOperator(context), 'research:admin:read');
  const settings = await getResearchSettings(context.tenantId);
  const [projects, theses, repository, publications, grants] = await Promise.all([
    (async () => {
      const rows = await prisma.$queryRaw<ProjectRow[]>`
        SELECT p.id, p.title, p.abstract, p.research_type, p.department_id, d.name AS department_name,
               p.research_area, p.status, p.start_date, p.expected_completion, p.funding_source, p.keywords
        FROM campusos_research.research_projects p
        LEFT JOIN public.departments d ON d.id = p.department_id
        WHERE p.tenant_id = ${context.tenantId}::uuid
        ORDER BY p.created_at DESC LIMIT 200
      `;
      return Promise.all(rows.map((row) => mapProjectRow(context, row)));
    })(),
    (async () => {
      const rows = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM campusos_research.theses
        WHERE tenant_id = ${context.tenantId}::uuid ORDER BY created_at DESC LIMIT 200
      `;
      return Promise.all(rows.map((row) => getThesisById(context, row.id)));
    })(),
    listRepositoryAll(context),
    (async () => {
      const rows = await prisma.$queryRaw<Array<{ id: string; user_id: string }>>`
        SELECT id, user_id FROM campusos_research.publications
        WHERE tenant_id = ${context.tenantId}::uuid ORDER BY created_at DESC LIMIT 200
      `;
      return Promise.all(rows.map((row) => getPublicationById(context, row.id)));
    })(),
    listGrants(context),
  ]);

  const pendingReviews = await prisma.$queryRaw<Array<{ id: string; kind: string; title: string; status: string; created_at: Date }>>(Prisma.sql`
    SELECT rp.id, 'PROPOSAL' AS kind, rp.title, rp.status, rp.created_at
    FROM campusos_research.research_proposals rp
    WHERE rp.tenant_id = ${context.tenantId}::uuid AND rp.status IN ('SUBMITTED', 'SUPERVISOR_REVIEW', 'COMMITTEE_REVIEW')
    UNION ALL
    SELECT t.id, 'THESIS' AS kind, t.title, t.status, t.created_at
    FROM campusos_research.theses t
    WHERE t.tenant_id = ${context.tenantId}::uuid AND t.status IN ('DRAFT', 'SIMILARITY_REVIEW', 'PRE_SUBMISSION', 'UNDER_EVALUATION')
    UNION ALL
    SELECT r.id, 'REPOSITORY' AS kind, r.title, r.submission_status, r.created_at
    FROM campusos_research.repository_items r
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.submission_status = 'PENDING_APPROVAL'
    ORDER BY created_at DESC LIMIT 20
  `);

  return {
    settings,
    canApprove: canApproveResearch(context),
    canAssignSupervisors: canAssignSupervisors(context),
    canReview: canReviewResearch(context),
    projects,
    theses,
    repository,
    publications,
    grants,
    pendingReviews: pendingReviews.map((row) => ({ id: row.id, kind: row.kind, title: row.title, status: row.status, createdAt: row.created_at.toISOString() })),
    metrics: [
      { id: 'projects', label: 'Research projects', value: projects.length, hint: 'Institution wide', tone: 'neutral' },
      { id: 'active', label: 'Active projects', value: projects.filter((project) => project.status === 'ACTIVE').length, hint: 'In progress', tone: 'neutral' },
      { id: 'theses', label: 'Theses', value: theses.length, hint: 'All thesis records', tone: 'neutral' },
      { id: 'repository', label: 'Repository items', value: repository.length, hint: 'Submissions', tone: 'neutral' },
      { id: 'publications', label: 'Publications', value: publications.length, hint: 'Research output', tone: 'neutral' },
      { id: 'grants', label: 'Grants', value: grants.length, hint: 'Funded research', tone: 'neutral' },
      { id: 'pending', label: 'Pending reviews', value: pendingReviews.length, hint: 'Awaiting decision', tone: pendingReviews.length > 0 ? 'warning' : 'positive' },
      { id: 'unsupervised', label: 'Supervisor load', value: 0, hint: 'Review supervisor assignments', tone: 'neutral' },
    ],
  };
}
