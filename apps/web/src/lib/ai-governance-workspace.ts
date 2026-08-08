import 'server-only';

import type { RoleType } from '@prisma/client';

import { requireActiveUserContext } from './active-user-context';
import { prisma } from './db';

/** Roles that may open the AI governance workspace. */
export const AI_GOVERNANCE_VIEWER_ROLES = new Set<RoleType>([
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
]);

export function canViewAIGovernance(role: RoleType): boolean {
  return AI_GOVERNANCE_VIEWER_ROLES.has(role);
}

export class AIGovernanceWorkspaceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'AIGovernanceWorkspaceError';
    this.status = status;
  }
}

export type AIModelView = {
  id: string;
  name: string;
  version: string;
  type: string;
  framework: string;
  deploymentStatus: 'Production' | 'Staging' | 'Development' | 'Retired';
  accuracy: number;
  f1Score: number;
  lastTrained: string;
  predictions: number;
  driftDetected: boolean;
};

export type AIBiasAuditView = {
  model: string;
  group: string;
  groupA: number;
  groupB: number;
  groupC: number;
  biasScore: number;
  status: 'Fair' | 'Review';
};

export type AIIncidentView = {
  id: string;
  severity: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'Resolved';
  type: string;
  model: string;
  description: string;
  date: string;
  resolution: string;
};

export type AIPolicyView = {
  id: string;
  title: string;
  category: string;
  status: string;
  effectiveDate: string;
  audience: string;
};

export type AIDecisionAuditView = {
  label: string;
  value: string;
};

export type AIGovernanceWorkspace = {
  role: string;
  stats: {
    modelsInProduction: number;
    totalPredictions: number;
    avgAccuracy: number;
    openIncidents: number;
  };
  models: AIModelView[];
  biasAudits: AIBiasAuditView[];
  incidents: AIIncidentView[];
  policies: AIPolicyView[];
  lifecycleModels: AIModelView[];
  decisionAudit: AIDecisionAuditView[];
  tenantPolicy: {
    enabled: boolean;
    allowedRoles: string[];
    maxMonthlyBudgetUsd: number;
    currentMonthlySpendUsd: number;
    rateLimitPerMin: number;
    requireHumanApproval: boolean;
    retentionDays: number;
  } | null;
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

function modelVersion(modelId: string): string {
  // Extract a sane display version from registry ids such as gpt-4o,
  // claude-3-5-sonnet, gemini-1.5-pro, campusos-mock-v1.
  const match = /(?:v)?(\d+(?:\.\d+)*(?:-[a-z0-9]+)?)/i.exec(modelId);
  const raw = match ? match[1] : '';
  if (!raw) return 'v1';
  const normalized = raw.replace(/-/g, '.');
  return `v${normalized}`;
}

export async function getAIGovernanceWorkspace(): Promise<AIGovernanceWorkspace> {
  const context = await requireActiveUserContext();
  if (!canViewAIGovernance(context.activeRole)) {
    throw new AIGovernanceWorkspaceError('AI governance workspace is not available for this role.', 403);
  }

  // NOTE: AiModel is the platform-level model registry (openai, anthropic,
  // google, self-hosted, mock) and is intentionally NOT tenant-scoped. Only
  // tenant-scoped facts (bias audits, incidents, policies, tenant policy,
  // proposals, audit logs) are filtered by tenantId below.
  const [models, biasAudits, incidents, policies, tenantPolicy, auditLogs, recentProposals] = await Promise.all([
    prisma.aiModel.findMany({ orderBy: { isEnabled: 'desc' } }),
    prisma.aiBiasAudit.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      include: { model: { select: { name: true } } },
    }),
    prisma.aiIncident.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { occurredAt: 'desc' },
      include: { model: { select: { name: true } } },
    }),
    prisma.aiKnowledgeDocument.findMany({
      where: { tenantId: context.tenantId, publicationStatus: 'PUBLISHED' },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    }),
    prisma.aiTenantPolicy.findUnique({
      where: { tenantId: context.tenantId },
    }),
    prisma.aiAuditLog.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
    prisma.aiActionProposal.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 4,
    }),
  ]);

  const productionModels = models.filter((m) => m.deploymentStatus === 'Production');
  const totalPredictions = models.reduce((sum, m) => sum + m.predictionCount, 0);
  const accuracyValues = models
    .map((m) => m.accuracyPct)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value));
  const avgAccuracy = accuracyValues.length
    ? Math.round((accuracyValues.reduce((sum, value) => sum + value, 0) / accuracyValues.length) * 10) / 10
    : 0;
  const openIncidents = incidents.filter((i) => i.status === 'Open').length;

  const modelViews: AIModelView[] = models.map((m) => ({
    id: m.modelId,
    name: m.name,
    version: modelVersion(m.modelId),
    type: m.capability,
    framework: m.provider,
    deploymentStatus: (m.deploymentStatus === 'Production'
      ? 'Production'
      : m.deploymentStatus === 'Staging'
        ? 'Staging'
        : m.deploymentStatus === 'Retired'
          ? 'Retired'
          : 'Development') as AIModelView['deploymentStatus'],
    accuracy: m.accuracyPct ?? 0,
    f1Score: m.f1Score ?? 0,
    lastTrained: formatDate(m.lastTrainedAt),
    predictions: m.predictionCount,
    driftDetected: m.driftDetected,
  }));

  const decisionAudit: AIDecisionAuditView[] = recentProposals.map((proposal) => ({
    label: `Action · ${proposal.actionName}`,
    value: `${proposal.status} — ${proposal.reason.slice(0, 80)}`,
  }));
  if (auditLogs.length) {
    const latest = auditLogs[0];
    decisionAudit.unshift({
      label: 'Latest AI interaction',
      value: `${latest.feature} · ${latest.actionType} via ${latest.modelUsed} · ${latest.status}`,
    });
  }
  if (!decisionAudit.length) {
    decisionAudit.push({ label: 'AI activity', value: 'No audited AI actions recorded yet.' });
  }

  return {
    role: context.activeRole,
    stats: {
      modelsInProduction: productionModels.length,
      totalPredictions,
      avgAccuracy,
      openIncidents,
    },
    models: modelViews,
    biasAudits: biasAudits.map((b) => ({
      model: b.model.name,
      group: b.groupName,
      groupA: b.groupA,
      groupB: b.groupB,
      groupC: b.groupC,
      biasScore: b.biasScore,
      status: b.status as AIBiasAuditView['status'],
    })),
    incidents: incidents.map((i) => ({
      id: `AI-${i.id.slice(0, 4).toUpperCase()}`,
      severity: i.severity as AIIncidentView['severity'],
      status: i.status as AIIncidentView['status'],
      type: i.type,
      model: i.model.name,
      description: i.description,
      date: formatDate(i.occurredAt),
      resolution: i.resolution ?? 'Under review',
    })),
    policies: policies.map((p) => ({
      id: p.id.slice(0, 8).toUpperCase(),
      title: p.title,
      category: p.category,
      status: p.publicationStatus,
      effectiveDate: formatDate(p.effectiveDate),
      audience: p.audience,
    })),
    lifecycleModels: modelViews.filter((m) => m.deploymentStatus !== 'Retired'),
    decisionAudit,
    tenantPolicy: tenantPolicy
      ? {
          enabled: tenantPolicy.isEnabled,
          allowedRoles: tenantPolicy.allowedRoles,
          maxMonthlyBudgetUsd: tenantPolicy.maxMonthlyBudgetUsd,
          currentMonthlySpendUsd: tenantPolicy.currentMonthlySpendUsd,
          rateLimitPerMin: tenantPolicy.rateLimitPerMin,
          requireHumanApproval: tenantPolicy.requireHumanApproval,
          retentionDays: tenantPolicy.retentionDays,
        }
      : null,
  };
}
