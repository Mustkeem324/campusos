import { UserRole, UserSession } from './types';

export interface AuditLogEntry {
  id: string;
  tenantId: string;
  userId: string;
  userRole: UserRole;
  action: string;
  targetResource: string;
  ipAddress: string;
  timestamp: Date;
  details: string;
}

export function generateAuditLog(
  session: UserSession,
  action: string,
  targetResource: string,
  details: string
): AuditLogEntry {
  return {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    tenantId: session.tenantId,
    userId: session.id,
    userRole: session.role,
    action,
    targetResource,
    ipAddress: '192.168.1.1',
    timestamp: new Date(),
    details,
  };
}
