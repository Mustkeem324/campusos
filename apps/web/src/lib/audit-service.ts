export interface AuditLogInput {
  tenantId: string;
  userId?: string;
  action: string;
  entity: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditRecord extends AuditLogInput {
  id: string;
  createdAt: Date;
  diffJson?: string;
}

const auditLogStore: AuditRecord[] = [];

export function recordAuditLog(input: AuditLogInput): AuditRecord {
  const diffJson =
    input.beforeState || input.afterState
      ? JSON.stringify({
          before: input.beforeState || null,
          after: input.afterState || null,
        })
      : undefined;

  const record: AuditRecord = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    ...input,
    diffJson,
    createdAt: new Date(),
  };

  auditLogStore.unshift(record);
  return record;
}

export function getAuditLogs(tenantId: string, filterEntity?: string): AuditRecord[] {
  return auditLogStore.filter(
    (log) => log.tenantId === tenantId && (!filterEntity || log.entity === filterEntity)
  );
}
