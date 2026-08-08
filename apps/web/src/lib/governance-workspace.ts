import 'server-only';

import type { RoleType } from '@prisma/client';

import { requireActiveUserContext } from './active-user-context';
import { prisma } from './db';

/** Roles that may open the institutional governance workspace. */
export const GOVERNANCE_VIEWER_ROLES = new Set<RoleType>([
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
  'REGISTRAR',
  'DEAN',
  'HOD',
]);

/** Roles that may mutate governance records (committees, meetings, policies). */
export const GOVERNANCE_MANAGER_ROLES = new Set<RoleType>([
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
  'REGISTRAR',
]);

export function canViewGovernance(role: RoleType): boolean {
  return GOVERNANCE_VIEWER_ROLES.has(role);
}

export function canManageGovernance(role: RoleType): boolean {
  return GOVERNANCE_MANAGER_ROLES.has(role);
}

export class GovernanceWorkspaceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'GovernanceWorkspaceError';
    this.status = status;
  }
}

export type GovernanceCommitteeView = {
  id: string;
  name: string;
  type: 'Statutory' | 'Academic' | 'Administrative' | 'Advisory';
  chairperson: string;
  secretary: string;
  members: number;
  termStart: string;
  termEnd: string;
  status: 'Active' | 'Reconstitution Due' | 'Dissolved';
  lastMeeting: string;
  nextMeeting: string;
};

export type GovernanceMeetingView = {
  id: string;
  committee: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  type: 'Physical' | 'Virtual' | 'Hybrid';
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  agendaItems: number;
  quorumRequired: number;
  attended: number;
  minutesStatus: 'Draft' | 'Under Review' | 'Approved' | 'Published';
};

export type GovernanceResolutionView = {
  id: string;
  meeting: string;
  title: string;
  proposedBy: string;
  status: 'Proposed' | 'Discussed' | 'Voted' | 'Approved' | 'Rejected';
  votesFor: number;
  votesAgainst: number;
  abstained: number;
  actionItems: number;
  completedActions: number;
  date: string;
};

export type GovernancePolicyView = {
  id: string;
  title: string;
  category: string;
  version: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Published' | 'Archived';
  effectiveDate: string;
  lastReviewed: string;
  approvedBy: string;
  department: string;
};

export type GovernanceDelegationView = {
  authority: string;
  level1: string;
  level2: string;
  level3: string;
  limit: string;
  escalation: string;
};

export type GovernanceAuditView = {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  details: string;
  ipAddress: string;
  digitalSignature?: string;
};

export type GovernanceWorkspace = {
  role: string;
  canManage: boolean;
  stats: {
    activeCommittees: number;
    reconstitutionDue: number;
    meetingsThisQuarter: number;
    upcomingMeetings: number;
    pendingResolutions: number;
    awaitingVote: number;
    activePolicies: number;
    underReviewPolicies: number;
  };
  committees: GovernanceCommitteeView[];
  meetings: GovernanceMeetingView[];
  resolutions: GovernanceResolutionView[];
  policies: GovernancePolicyView[];
  delegations: GovernanceDelegationView[];
  auditLogs: GovernanceAuditView[];
};

const DATE_FORMAT = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(value: Date | null | undefined): string {
  if (!value) return '—';
  return DATE_FORMAT.format(value);
}

function shortId(id: string): string {
  return `GOV-${id.slice(0, 4).toUpperCase()}`;
}

export async function getGovernanceWorkspace(): Promise<GovernanceWorkspace> {
  const context = await requireActiveUserContext();
  if (!canViewGovernance(context.activeRole)) {
    throw new GovernanceWorkspaceError('Institutional governance workspace is not available for this role.', 403);
  }

  const [committees, meetings, resolutions, policies, delegations, auditLogs] = await Promise.all([
    prisma.governanceCommittee.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.governanceMeeting.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { scheduledAt: 'desc' },
      include: { committee: { select: { name: true } } },
    }),
    prisma.governanceResolution.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { meeting: { select: { title: true } } },
    }),
    prisma.governancePolicy.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { lastReviewedAt: 'desc' },
    }),
    prisma.governanceDelegation.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.auditLog.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { user: { select: { name: true } } },
    }),
  ]);

  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const today = now.toISOString().slice(0, 10);

  const stats = {
    activeCommittees: committees.filter((c) => c.status === 'Active').length,
    reconstitutionDue: committees.filter((c) => c.status === 'Reconstitution Due').length,
    meetingsThisQuarter: meetings.filter((m) => m.scheduledAt >= quarterStart).length,
    upcomingMeetings: meetings.filter(
      (m) => m.status === 'Scheduled' && m.scheduledAt.toISOString().slice(0, 10) >= today,
    ).length,
    pendingResolutions: resolutions.filter(
      (r) => r.status === 'Proposed' || r.status === 'Discussed',
    ).length,
    awaitingVote: resolutions.filter((r) => r.status === 'Voted').length,
    activePolicies: policies.filter(
      (p) => p.status === 'Approved' || p.status === 'Published',
    ).length,
    underReviewPolicies: policies.filter((p) => p.status === 'Under Review').length,
  };

  return {
    role: context.activeRole,
    canManage: canManageGovernance(context.activeRole),
    stats,
    committees: committees.map((c) => ({
      id: shortId(c.id),
      name: c.name,
      type: c.type as GovernanceCommitteeView['type'],
      chairperson: c.chairperson,
      secretary: c.secretary,
      members: c.memberCount,
      termStart: formatDate(c.termStart),
      termEnd: formatDate(c.termEnd),
      status: c.status as GovernanceCommitteeView['status'],
      lastMeeting: formatDate(c.lastMeetingDate),
      nextMeeting: formatDate(c.nextMeetingDate),
    })),
    meetings: meetings.map((m) => ({
      id: shortId(m.id),
      committee: m.committee.name,
      title: m.title,
      date: formatDate(m.scheduledAt),
      time: m.scheduledAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      venue: m.venue,
      type: m.mode as GovernanceMeetingView['type'],
      status: m.status as GovernanceMeetingView['status'],
      agendaItems: m.agendaItems,
      quorumRequired: m.quorumRequired,
      attended: m.attendedCount,
      minutesStatus: m.minutesStatus as GovernanceMeetingView['minutesStatus'],
    })),
    resolutions: resolutions.map((r) => ({
      id: shortId(r.id),
      meeting: r.meeting.title,
      title: r.title,
      proposedBy: r.proposedBy,
      status: r.status as GovernanceResolutionView['status'],
      votesFor: r.votesFor,
      votesAgainst: r.votesAgainst,
      abstained: r.abstentions,
      actionItems: r.actionItems,
      completedActions: r.completedActions,
      date: formatDate(r.createdAt),
    })),
    policies: policies.map((p) => ({
      id: shortId(p.id),
      title: p.title,
      category: p.category,
      version: p.version,
      status: p.status as GovernancePolicyView['status'],
      effectiveDate: formatDate(p.effectiveDate),
      lastReviewed: formatDate(p.lastReviewedAt),
      approvedBy: p.approvedBy,
      department: p.department,
    })),
    delegations: delegations.map((d) => ({
      authority: d.authority,
      level1: d.level1,
      level2: d.level2,
      level3: d.level3,
      limit: d.limit,
      escalation: d.escalation,
    })),
    auditLogs: auditLogs.map((log) => {
      let details = log.diffJson ?? '';
      try {
        const parsed = JSON.parse(details);
        if (parsed && typeof parsed === 'object') {
          details = Object.keys(parsed).length ? JSON.stringify(parsed, null, 2) : '';
        }
      } catch {
        // keep the raw string when it is not JSON
      }
      return {
        id: log.id,
        timestamp: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
        actor: log.user?.name ?? 'System',
        action: log.action,
        entity: log.entity,
        details,
        ipAddress: log.ipAddress ?? '—',
        digitalSignature: undefined,
      };
    }),
  };
}
