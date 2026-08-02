import { describe, it, expect } from 'vitest';
import { simulateDatabaseFailureWithFallback } from '../lib/observability-service';

describe('Phase 19 Chaos Testing DB Failure Degraded Fallback Test Suite', () => {
  it('should fall back to cached payload when primary DB fails under chaos injection', () => {
    const res = simulateDatabaseFailureWithFallback(true, 'Cached Payload');

    expect(res.isDegraded).toBe(true);
    expect(res.source).toBe('DEGRADED_REDIS_CACHE_FALLBACK');
    expect(res.data).toBe('Cached Payload');
  });

  it('should read from primary DB under normal operating conditions', () => {
    const res = simulateDatabaseFailureWithFallback(false, 'Live DB Payload');

    expect(res.isDegraded).toBe(false);
    expect(res.source).toBe('PRIMARY_DB');
  });
});
