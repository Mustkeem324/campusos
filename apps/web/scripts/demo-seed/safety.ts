import { DemoSeedConfig } from './config';

export function assertSeedSafety(config: DemoSeedConfig): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const demoMode = process.env.DEMO_MODE === 'true';

  // 1. Explicit production check
  if (nodeEnv === 'production' && !config.allowDemoSeed) {
    throw new Error('Demo data generation is blocked for this environment. (Reason: NODE_ENV=production)');
  }

  // 2. Safe execution trigger check
  const isAllowed = nodeEnv === 'development' || nodeEnv === 'test' || demoMode || config.allowDemoSeed;
  if (!isAllowed) {
    throw new Error('Demo data generation is blocked for this environment. (Reason: Missing safe execution trigger)');
  }

  // 3. Target tenant safety check
  if (config.tenantCode !== 'CDU' && !config.tenantCode.startsWith('DEMO')) {
    throw new Error('Demo data generation is blocked for this environment. (Reason: Target tenant is not a demo tenant)');
  }
}
