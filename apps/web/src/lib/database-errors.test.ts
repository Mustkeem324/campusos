import { describe, expect, it, vi } from 'vitest';

import {
  databaseUnavailableLog,
  databaseUnavailablePublicMessage,
  isDatabaseUnavailableError,
} from './database-errors';

describe('database error handling', () => {
  it('recognizes Prisma P1001 errors', () => {
    expect(isDatabaseUnavailableError({ code: 'P1001', message: 'database offline' })).toBe(true);
  });

  it('recognizes Prisma initialization connectivity errors', () => {
    expect(isDatabaseUnavailableError({
      name: 'PrismaClientInitializationError',
      message: "Can't reach database server at `localhost:5433`",
    })).toBe(true);
  });

  it('recognizes common network failures', () => {
    expect(isDatabaseUnavailableError(new Error('connect ECONNREFUSED 127.0.0.1:5433'))).toBe(true);
    expect(isDatabaseUnavailableError(new Error('connect ETIMEDOUT'))).toBe(true);
  });

  it('does not classify ordinary application errors as database outages', () => {
    expect(isDatabaseUnavailableError(new Error('Invalid credentials'))).toBe(false);
    expect(isDatabaseUnavailableError(null)).toBe(false);
  });

  it('returns a useful development message and a generic production message', () => {
    try {
      vi.stubEnv('NODE_ENV', 'development');
      expect(databaseUnavailablePublicMessage()).toContain('DATABASE_URL');

      vi.stubEnv('NODE_ENV', 'production');
      expect(databaseUnavailablePublicMessage()).not.toContain('DATABASE_URL');
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it('logs structured metadata without logging the database message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    databaseUnavailableLog(
      {
        name: 'PrismaClientInitializationError',
        code: 'P1001',
        message: 'postgresql://secret-user:secret-password@example.invalid/database',
      },
      '/api/auth/login',
    );

    expect(spy).toHaveBeenCalledTimes(1);
    const logged = String(spy.mock.calls[0]?.[0]);
    expect(logged).toContain('database_unavailable');
    expect(logged).toContain('/api/auth/login');
    expect(logged).not.toContain('secret-password');

    spy.mockRestore();
  });
});
