import { DemoSeedConfig } from './config';

export function assertSeedSafety(config: DemoSeedConfig): void {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const demoMode = process.env.DEMO_MODE === 'true';

  // Production is always protected. Synthetic/demo identities must never be
  // inserted into a real deployment database, even when an override flag is
  // supplied accidentally or inherited from another environment.
  if (nodeEnv === 'production') {
    throw new Error('Demo data generation is blocked for production environments.');
  }

  // Development/test/demo runs can still require an explicit seed opt-in.
  const isAllowed = nodeEnv === 'development' || nodeEnv === 'test' || demoMode || config.allowDemoSeed;
  if (!isAllowed) {
    throw new Error('Demo data generation is blocked for this environment. (Reason: Missing safe execution trigger)');
  }

  // Synthetic data is restricted to explicit demo tenant identifiers.
  if (config.tenantCode !== 'CDU' && !config.tenantCode.startsWith('DEMO')) {
    throw new Error('Demo data generation is blocked for this environment. (Reason: Target tenant is not a demo tenant)');
  }
}
