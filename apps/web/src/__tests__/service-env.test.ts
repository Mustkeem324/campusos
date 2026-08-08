import { describe, expect, it } from 'vitest';

import { resolveServiceEnvironment } from '@/lib/service-env';

describe('service environment resolution', () => {
  it('replaces the known Prisma template placeholder during local development', () => {
    const environment: Record<string, string | undefined> = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://placeholder:placeholder@db.prisma.io:5432/postgres',
      CAMPUSOS_LOCAL_DATABASE_URL: 'postgresql://campusos:campusos_password@localhost:5433/campusos_db?schema=public',
    };

    expect(resolveServiceEnvironment(environment)).toContainEqual({
      canonicalName: 'DATABASE_URL',
      sourceName: 'local-development-fallback',
    });
    expect(new URL(environment.DATABASE_URL!).hostname).toBe('localhost');
  });

  it('does not replace a production database URL', () => {
    const environment: Record<string, string | undefined> = {
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://placeholder:placeholder@db.prisma.io:5432/postgres',
    };

    resolveServiceEnvironment(environment);
    expect(new URL(environment.DATABASE_URL!).hostname).toBe('db.prisma.io');
  });
});
