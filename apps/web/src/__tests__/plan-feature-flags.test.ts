import { describe, it, expect } from 'vitest';
import { evaluatePlanFeatureFlags } from '../lib/saas-billing-service';

describe('Phase 18 Subscription Plan Feature Flags Entitlement Test Suite', () => {
  it('should restrict AI_COPILOT on STARTER plan and enable it on GROWTH/ENTERPRISE plans', () => {
    const starterFlags = evaluatePlanFeatureFlags('STARTER');
    const growthFlags = evaluatePlanFeatureFlags('GROWTH');

    expect(starterFlags.AI_COPILOT).toBe(false);
    expect(growthFlags.AI_COPILOT).toBe(true);
    expect(growthFlags.RETENTION_ENGINE).toBe(true);
  });
});
