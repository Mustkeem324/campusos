import 'server-only';

import type { RoleType } from '@prisma/client';

import { requireActiveUserContext } from './active-user-context';
import { prisma } from './db';

/** Roles that may open the data migration factory / control tower workspace. */
export const DATA_MIGRATION_VIEWER_ROLES = new Set<RoleType>([
  'INSTITUTION_ADMIN',
  'SUPER_ADMIN',
]);

export function canViewDataMigration(role: RoleType): boolean {
  return DATA_MIGRATION_VIEWER_ROLES.has(role);
}

export class DataMigrationWorkspaceError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'DataMigrationWorkspaceError';
    this.status = status;
  }
}

export type MigrationConnectorView = {
  id: string;
  name: string;
  type: string;
  status: 'Connected' | 'Disconnected' | 'Error';
  lastSync: string;
  records: number;
  tables: number;
};

export type MigrationPipelineStageView = {
  name: string;
  status: 'Complete' | 'In Progress' | 'Pending';
  records: number;
  errors: number;
  throughput: string;
};

export type MigrationFieldMappingView = {
  source: string;
  target: string;
  dataType: string;
  transform: string;
  sample: string;
  status: 'Mapped' | 'Pending';
};

export type MigrationValidationView = {
  entity: string;
  total: number;
  valid: number;
  duplicates: number;
  missing: number;
  anomalies: number;
  quality: number;
};

export type MigrationLogView = {
  id: string;
  timestamp: string;
  severity: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
};

export type MigrationMilestoneView = {
  phase: string;
  start: number;
  end: number;
  status: 'Complete' | 'In Progress' | 'Pending';
};

export type MigrationDecisionGateView = {
  gate: string;
  status: 'Go' | 'Pending';
  date: string;
};

export type DataMigrationWorkspace = {
  role: string;
  overallProgress: number;
  stats: {
    totalRecords: number;
    migrated: number;
    errors: number;
    pending: number;
  };
  connectors: MigrationConnectorView[];
  pipelineStages: MigrationPipelineStageView[];
  fieldMappings: MigrationFieldMappingView[];
  validationResults: MigrationValidationView[];
  milestones: MigrationMilestoneView[];
  decisionGates: MigrationDecisionGateView[];
  logs: MigrationLogView[];
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

// ---------------------------------------------------------------------------
// Pure derivations (unit-testable, no DB or request context)
// ---------------------------------------------------------------------------

/** ETL pipeline stages advance as overall migration progress grows. */
export const MIGRATION_STAGE_ORDER = [
  { name: 'Extract', threshold: 20 },
  { name: 'Transform', threshold: 40 },
  { name: 'Load', threshold: 60 },
  { name: 'Validate', threshold: 80 },
  { name: 'Publish', threshold: 100 },
] as const;

export function derivePipelineStages(
  overallProgress: number,
  migrated: number,
  errors: number,
): MigrationPipelineStageView[] {
  return MIGRATION_STAGE_ORDER.map((stage, index) => {
    const previousThreshold = index === 0 ? 0 : MIGRATION_STAGE_ORDER[index - 1].threshold;
    const status =
      overallProgress >= stage.threshold
        ? 'Complete'
        : overallProgress >= previousThreshold
          ? 'In Progress'
          : 'Pending';
    return {
      name: stage.name,
      status,
      records: migrated,
      errors,
      throughput: status === 'Complete' ? 'Done' : status === 'In Progress' ? 'Streaming' : 'Idle',
    };
  });
}

/** Implementation phases map onto overall progress; milestones advance in order. */
export const MIGRATION_PHASES = [
  { phase: 'Discovery', start: 0, end: 16 },
  { phase: 'Data Mapping', start: 16, end: 38 },
  { phase: 'Dry Run', start: 38, end: 58 },
  { phase: 'UAT', start: 58, end: 78 },
  { phase: 'Go-Live', start: 78, end: 100 },
] as const;

export function deriveMilestones(overallProgress: number): MigrationMilestoneView[] {
  return MIGRATION_PHASES.map((phase) => ({
    phase: phase.phase,
    start: phase.start,
    end: phase.end,
    status:
      overallProgress >= phase.end
        ? 'Complete'
        : overallProgress >= phase.start
          ? 'In Progress'
          : 'Pending',
  }));
}

/** Decision gates pass once real progress crosses each readiness threshold. */
export const MIGRATION_GATES = [
  { gate: 'Data Mapping Complete', progress: 38 },
  { gate: 'Dry Run Successful', progress: 58 },
  { gate: 'UAT Sign-off', progress: 78 },
  { gate: 'Go-Live Readiness', progress: 100 },
] as const;

export function deriveDecisionGates(
  overallProgress: number,
  lastCompletedAt: Date | null,
): MigrationDecisionGateView[] {
  return MIGRATION_GATES.map((gate) => {
    const reached = overallProgress >= gate.progress;
    return {
      gate: gate.gate,
      status: reached ? 'Go' : 'Pending',
      date: reached && lastCompletedAt ? formatDate(lastCompletedAt) : 'TBD',
    };
  });
}

export async function getDataMigrationWorkspace(): Promise<DataMigrationWorkspace> {
  const context = await requireActiveUserContext();
  if (!canViewDataMigration(context.activeRole)) {
    throw new DataMigrationWorkspaceError('Data migration workspace is not available for this role.', 403);
  }

  const [connectors, jobs, fieldMappings, validations, logs, implementationProject] = await Promise.all([
    prisma.migrationConnector.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { name: 'asc' },
    }),
    prisma.migrationJob.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { entity: 'asc' },
    }),
    prisma.migrationFieldMapping.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { entity: 'asc' },
    }),
    prisma.migrationValidation.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { entity: 'asc' },
    }),
    prisma.migrationLog.findMany({
      where: { tenantId: context.tenantId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    prisma.implementationProject.findFirst({
      where: { tenantId: context.tenantId },
      orderBy: { updatedAt: 'desc' },
    }),
  ]);

  const totalRecords = jobs.reduce((sum, job) => sum + job.totalRecords, 0);
  const migrated = jobs.reduce((sum, job) => sum + job.migratedRecords, 0);
  const errors = jobs.reduce((sum, job) => sum + job.errorCount, 0);
  const pending = Math.max(totalRecords - migrated - errors, 0);
  const overallProgress =
    implementationProject?.overallProgressPct ??
    (totalRecords > 0 ? Math.round((migrated / totalRecords) * 100) : 0);

  const lastCompletedAt = jobs.reduce<Date | null>((latest, job) => {
    if (job.completedAt && (!latest || job.completedAt > latest)) return job.completedAt;
    return latest;
  }, null);

  const pipelineStages = derivePipelineStages(overallProgress, migrated, errors);
  const milestones = deriveMilestones(overallProgress);
  const gates = deriveDecisionGates(overallProgress, lastCompletedAt);

  return {
    role: context.activeRole,
    overallProgress,
    stats: { totalRecords, migrated, errors, pending },
    connectors: connectors.map((c) => ({
      id: c.id.slice(0, 8).toUpperCase(),
      name: c.name,
      type: c.type,
      status: c.status as MigrationConnectorView['status'],
      lastSync: formatDate(c.lastSyncAt),
      records: c.recordCount,
      tables: c.tableCount,
    })),
    pipelineStages,
    fieldMappings: fieldMappings.map((f) => ({
      source: f.sourceField,
      target: f.targetField,
      dataType: f.dataType,
      transform: f.transform,
      sample: f.sampleValue ?? '',
      status: f.status as MigrationFieldMappingView['status'],
    })),
    validationResults: validations.map((v) => ({
      entity: v.entity,
      total: v.total,
      valid: v.valid,
      duplicates: v.duplicates,
      missing: v.missing,
      anomalies: v.anomalies,
      quality: v.quality,
    })),
    milestones,
    decisionGates: gates,
    logs: logs.map((log) => ({
      id: log.id,
      timestamp: log.createdAt.toISOString().replace('T', ' ').slice(0, 19),
      severity: log.severity as MigrationLogView['severity'],
      source: log.source,
      message: log.message,
    })),
  };
}
