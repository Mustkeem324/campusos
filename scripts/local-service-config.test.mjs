import { afterEach, describe, expect, it, vi } from 'vitest';

import { createLocalServiceEnv, getLocalServicePorts } from './local-service-config.mjs';

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('local service configuration', () => {
  it('uses collision-resistant local defaults', () => {
    const ports = getLocalServicePorts();

    expect(ports.postgres).toBe(5433);
    expect(ports.redis).toBe(6380);
  });

  it('supports explicit local port overrides', () => {
    vi.stubEnv('CAMPUSOS_POSTGRES_HOST_PORT', '5544');
    vi.stubEnv('CAMPUSOS_REDIS_HOST_PORT', '6399');

    const ports = getLocalServicePorts();
    const env = createLocalServiceEnv();

    expect(ports.postgres).toBe(5544);
    expect(ports.redis).toBe(6399);
    expect(env.DATABASE_URL).toContain('127.0.0.1:5544');
    expect(env.REDIS_URL).toBe('redis://127.0.0.1:6399');
  });

  it('overrides stale hosted service URLs for deterministic local commands', () => {
    vi.stubEnv('DATABASE_URL', 'postgresql://hosted.invalid/database');
    vi.stubEnv('REDIS_URL', 'redis://hosted.invalid:6379');

    const env = createLocalServiceEnv();

    expect(env.DATABASE_URL).toContain('127.0.0.1:5433');
    expect(env.REDIS_URL).toBe('redis://127.0.0.1:6380');
  });

  it('rejects invalid port overrides early', () => {
    vi.stubEnv('CAMPUSOS_REDIS_HOST_PORT', '70000');

    expect(() => getLocalServicePorts()).toThrow('CAMPUSOS_REDIS_HOST_PORT');
  });
});
