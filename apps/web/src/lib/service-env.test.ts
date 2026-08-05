import { describe, expect, it } from 'vitest';

import { resolveServiceEnvironment } from './service-env';

describe('resolveServiceEnvironment', () => {
  it('preserves canonical service variables when already configured', () => {
    const environment = {
      DATABASE_URL: 'postgresql://canonical.example/database',
      campusos_DATABASE_URL: 'postgresql://prefixed.example/database',
      REDIS_URL: 'redis://canonical.example:6379',
      campusos_REDIS_URL: 'redis://prefixed.example:6379',
    };

    const resolutions = resolveServiceEnvironment(environment);

    expect(environment.DATABASE_URL).toBe('postgresql://canonical.example/database');
    expect(environment.REDIS_URL).toBe('redis://canonical.example:6379');
    expect(resolutions).toEqual([]);
  });

  it('maps the Vercel integration-prefixed database variable to DATABASE_URL', () => {
    const environment: Record<string, string | undefined> = {
      campusos_DATABASE_URL: 'postgresql://prefixed.example/database',
    };

    const resolutions = resolveServiceEnvironment(environment);

    expect(environment.DATABASE_URL).toBe('postgresql://prefixed.example/database');
    expect(resolutions).toEqual([
      {
        canonicalName: 'DATABASE_URL',
        sourceName: 'campusos_DATABASE_URL',
      },
    ]);
  });

  it('maps the prefixed Redis variable without requiring Redis to be present', () => {
    const environment: Record<string, string | undefined> = {
      campusos_REDIS_URL: 'redis://prefixed.example:6379',
    };

    const resolutions = resolveServiceEnvironment(environment);

    expect(environment.REDIS_URL).toBe('redis://prefixed.example:6379');
    expect(environment.DATABASE_URL).toBeUndefined();
    expect(resolutions).toEqual([
      {
        canonicalName: 'REDIS_URL',
        sourceName: 'campusos_REDIS_URL',
      },
    ]);
  });
});
