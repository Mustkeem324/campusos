import 'server-only';

import { randomUUID } from 'node:crypto';

import { getSessionFromCookies } from './auth';
import { prisma } from './db';
import type {
  CompanyAdminContract,
  CompanyAdminDashboardData,
  CompanyAdminEvent,
  ContractHealth,
} from './company-admin-types';

type ContractRow = {
  id: string;
  institution_id: string;
  contract_number: string;
  plan_name: string;
  status: string;
  currency: string;
  contract_value_minor: bigint | number | string;
  billing_cycle: string;
  starts_at: Date;
  ends_at: Date;
  auto_renew: boolean;
  renewal_notice_days: number;
  licensed_students: number | null;
  licensed_staff: number | null;
  modules: unknown;
  primary_contact_name: string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  account_owner: string | null;
  notes: string | null;
  updated_at: Date;
};

type EventRow = {
  id: string;
  actor_user_id: string | null;
  institution_id: string | null;
  event_type: string;
  summary: string;
  detail: unknown;
  created_at: Date;
};

export async function requireCompanySuperAdmin() {
  const session = await getSessionFromCookies();
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: company super administrator access required');
  }

  const user = await prisma.user.findFirst({
    where: {
      id: session.userId,
      tenantId: session.tenantId,
      role: 'SUPER_ADMIN',
      isActive: true,
    },
    select: { id: true, name: true, email: true, tenantId: true, role: true },
  });

  if (!user) throw new Error('Forbidden: company super administrator account unavailable');
  return user;
}

function numberFromDb(value: bigint | number | string) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function annualize(valueMinor: number, billingCycle: string) {
  const cycle = billingCycle.toUpperCase();
  if (cycle === 'MONTHLY') return valueMinor * 12;
  if (cycle === 'QUARTERLY') return valueMinor * 4;
  if (cycle === 'HALF_YEARLY' || cycle === 'SEMI_ANNUAL') return valueMinor * 2;
  return valueMinor;
}

function parseModules(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  }
  return [];
}

function contractHealth(row: ContractRow, now: Date): { health: ContractHealth; daysRemaining: number } {
  const end = new Date(row.ends_at);
  const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / 86_400_000);
  const status = row.status.toUpperCase();

  if (status === 'CANCELLED') return { health: 'CANCELLED', daysRemaining };
  if (status === 'SUSPENDED') return { health: 'SUSPENDED', daysRemaining };
  if (status === 'TRIAL') return { health: daysRemaining < 0 ? 'EXPIRED' : 'TRIAL', daysRemaining };
  if (daysRemaining < 0 || status === 'EXPIRED') return { health: 'EXPIRED', daysRemaining };
  if (daysRemaining <= Math.max(30, row.renewal_notice_days)) return { health: 'EXPIRING', daysRemaining };
  return { health: 'ACTIVE', daysRemaining };
}

function normalizeContract(row: ContractRow, now: Date): CompanyAdminContract {
  const contractValueMinor = numberFromDb(row.contract_value_minor);
  const { health, daysRemaining } = contractHealth(row, now);

  return {
    id: row.id,
    institutionId: row.institution_id,
    contractNumber: row.contract_number,
    planName: row.plan_name,
    status: row.status,
    health,
    currency: row.currency,
    contractValueMinor,
    annualizedValueMinor: annualize(contractValueMinor, row.billing_cycle),
    billingCycle: row.billing_cycle,
    startsAt: new Date(row.starts_at).toISOString(),
    endsAt: new Date(row.ends_at).toISOString(),
    daysRemaining,
    autoRenew: row.auto_renew,
    renewalNoticeDays: row.renewal_notice_days,
    licensedStudents: row.licensed_students,
    licensedStaff: row.licensed_staff,
    modules: parseModules(row.modules),
    primaryContactName: row.primary_contact_name,
    primaryContactEmail: row.primary_contact_email,
    primaryContactPhone: row.primary_contact_phone,
    accountOwner: row.account_owner,
    notes: row.notes,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function readContracts(now: Date) {
  try {
    const rows = await prisma.$queryRaw<ContractRow[]>`
      SELECT id, institution_id, contract_number, plan_name, status, currency,
             contract_value_minor, billing_cycle, starts_at, ends_at, auto_renew,
             renewal_notice_days, licensed_students, licensed_staff, modules,
             primary_contact_name, primary_contact_email, primary_contact_phone,
             account_owner, notes, updated_at
      FROM platform_contracts
      ORDER BY ends_at ASC
    `;
    return { ready: true, contracts: rows.map((row) => normalizeContract(row, now)) };
  } catch (error) {
    console.error('Company admin contract store unavailable:', error);
    return { ready: false, contracts: [] as CompanyAdminContract[] };
  }
}

async function readEvents(institutionNames: Map<string, string>) {
  try {
    const rows = await prisma.$queryRaw<EventRow[]>`
      SELECT id, actor_user_id, institution_id, event_type, summary, detail, created_at
      FROM platform_admin_events
      ORDER BY created_at DESC
      LIMIT 80
    `;

    return rows.map<CompanyAdminEvent>((row) => ({
      id: row.id,
      actorUserId: row.actor_user_id,
      institutionId: row.institution_id,
      eventType: row.event_type,
      summary: row.summary,
      detail: row.detail && typeof row.detail === 'object' && !Array.isArray(row.detail)
        ? row.detail as Record<string, unknown>
        : {},
      createdAt: new Date(row.created_at).toISOString(),
      institutionName: row.institution_id ? institutionNames.get(row.institution_id) ?? null : null,
    }));
  } catch (error) {
    console.error('Company admin event store unavailable:', error);
    return [] as CompanyAdminEvent[];
  }
}

function buildGrowth(createdDates: Date[], now: Date) {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short' });
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      label: formatter.format(date),
      institutions: 0,
    };
  });

  for (const createdAt of createdDates) {
    const bucket = months.find((item) => item.year === createdAt.getFullYear() && item.month === createdAt.getMonth());
    if (bucket) bucket.institutions += 1;
  }

  return months.map(({ label, institutions }) => ({ label, institutions }));
}

export async function writeCompanyAdminEvent(input: {
  actorUserId: string;
  institutionId?: string | null;
  eventType: string;
  summary: string;
  detail?: Record<string, unknown>;
}) {
  try {
    await prisma.$executeRaw`
      INSERT INTO platform_admin_events
        (id, actor_user_id, institution_id, event_type, summary, detail, created_at)
      VALUES
        (${randomUUID()}::uuid, ${input.actorUserId}::uuid,
         ${input.institutionId ?? null}::uuid, ${input.eventType}, ${input.summary},
         CAST(${JSON.stringify(input.detail ?? {})} AS jsonb), now())
    `;
  } catch (error) {
    // Administrative actions must not be rolled back only because telemetry
    // storage is temporarily unavailable. The primary mutation remains source of truth.
    console.error('Unable to write company administration event:', error);
  }
}

export async function getCompanyAdminDashboardData(): Promise<CompanyAdminDashboardData> {
  const actor = await requireCompanySuperAdmin();
  const now = new Date();

  const institutionsRaw = await prisma.institution.findMany({
    orderBy: [{ updatedAt: 'desc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      code: true,
      subdomain: true,
      logoUrl: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          users: true,
          students: true,
          campuses: true,
          supportCases: true,
          implementationProjects: true,
        },
      },
    },
  });

  const { ready, contracts } = await readContracts(now);
  const contractByInstitution = new Map(contracts.map((contract) => [contract.institutionId, contract]));
  const institutionNames = new Map(institutionsRaw.map((institution) => [institution.id, institution.name]));
  const events = await readEvents(institutionNames);

  const institutions = institutionsRaw.map((institution) => ({
    id: institution.id,
    name: institution.name,
    code: institution.code,
    subdomain: institution.subdomain,
    logoUrl: institution.logoUrl,
    status: institution.status,
    createdAt: institution.createdAt.toISOString(),
    updatedAt: institution.updatedAt.toISOString(),
    users: institution._count.users,
    students: institution._count.students,
    campuses: institution._count.campuses,
    supportCases: institution._count.supportCases,
    implementationProjects: institution._count.implementationProjects,
    contract: contractByInstitution.get(institution.id) ?? null,
  }));

  const metrics = {
    totalInstitutions: institutions.length,
    activeInstitutions: institutions.filter((item) => item.status.toUpperCase() === 'ACTIVE').length,
    trialInstitutions: institutions.filter((item) => item.status.toUpperCase() === 'TRIAL').length,
    suspendedInstitutions: institutions.filter((item) => ['SUSPENDED', 'INACTIVE', 'DISABLED'].includes(item.status.toUpperCase())).length,
    totalUsers: institutions.reduce((sum, item) => sum + item.users, 0),
    totalStudents: institutions.reduce((sum, item) => sum + item.students, 0),
    totalCampuses: institutions.reduce((sum, item) => sum + item.campuses, 0),
    activeContracts: contracts.filter((item) => item.health === 'ACTIVE').length,
    expiringContracts: contracts.filter((item) => item.health === 'EXPIRING').length,
    expiredContracts: contracts.filter((item) => item.health === 'EXPIRED').length,
    uncontractedInstitutions: institutions.filter((item) => !item.contract).length,
    annualizedPortfolioValueMinor: contracts
      .filter((item) => ['ACTIVE', 'EXPIRING', 'TRIAL'].includes(item.health))
      .reduce((sum, item) => sum + item.annualizedValueMinor, 0),
    openSupportCases: institutions.reduce((sum, item) => sum + item.supportCases, 0),
    implementationProjects: institutions.reduce((sum, item) => sum + item.implementationProjects, 0),
  };

  return {
    generatedAt: now.toISOString(),
    actor: { id: actor.id, name: actor.name, email: actor.email },
    metrics,
    institutions,
    contracts,
    events,
    growth: buildGrowth(institutionsRaw.map((item) => item.createdAt), now),
    controlPlaneReady: ready,
  };
}
