import { getTenantDb } from './db';
import { getSessionFromCookies } from './auth';

/**
 * Ensures file storage keys are tenant-scoped to prevent path traversal
 * and cross-tenant file access.
 */
export function getTenantStorageKey(tenantId: string, filePath: string) {
  if (filePath.includes('..')) throw new Error('Path traversal detected');
  return `tenant_${tenantId}/uploads/${filePath}`;
}

/**
 * Ensures Redis cache keys never overlap between tenants.
 */
export function getTenantCacheKey(tenantId: string, key: string) {
  return `tenant:${tenantId}:${key}`;
}

/**
 * Enqueues a background job ensuring the tenant context is strictly passed.
 * The background worker will rehydrate the DB connection using this tenantId.
 */
export async function enqueueTenantJob(tenantId: string, jobType: string, payload: any) {
  // Mock queuing mechanism (e.g., BullMQ)
  const jobPayload = {
    _tenantContext: tenantId,
    type: jobType,
    data: payload,
    queuedAt: new Date().toISOString(),
  };
  console.log(`[JobQueue] Enqueued ${jobType} for tenant ${tenantId}`);
  return jobPayload;
}

/**
 * A unified context resolver to be used inside Next.js App Router Server Actions.
 * Instantiates the RLS/DB layer, auth session, and scoped utilities securely.
 */
export async function requireTenantContext() {
  const session = await getSessionFromCookies();
  
  if (!session || !session.tenantId) {
    throw new Error('Unauthorized: No valid tenant context found in session.');
  }

  const db = getTenantDb(session.tenantId);

  return {
    session,
    db,
    tenantId: session.tenantId,
    userId: session.userId,
    role: session.role,
    
    // Scoped helpers
    storagePath: (path: string) => getTenantStorageKey(session.tenantId, path),
    cacheKey: (key: string) => getTenantCacheKey(session.tenantId, key),
    dispatchJob: (jobType: string, payload: any) => enqueueTenantJob(session.tenantId, jobType, payload)
  };
}
