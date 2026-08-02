import { describe, it, expect } from 'vitest';
import { checkSystemHealth } from '../lib/health-service';

describe('Phase 9 System Health Endpoints Test Suite', () => {
  it('should return HEALTHY status and valid infrastructure metrics', () => {
    const health = checkSystemHealth();

    expect(health.status).toBe('HEALTHY');
    expect(health.services.postgres).toBe(true);
    expect(health.services.redis).toBe(true);
    expect(health.metrics.redisCacheHitRatio).toBeGreaterThan(90);
  });
});
