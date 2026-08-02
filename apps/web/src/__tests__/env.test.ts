import { describe, it, expect } from 'vitest';
import { validateEnv } from '../../../../packages/config/src/env';

describe('Environment Variable Zod Validation', () => {
  it('should validate valid environment configuration successfully', () => {
    const validEnv = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/campusos_db',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'super_secret_jwt_key_long_enough',
      JWT_REFRESH_SECRET: 'super_secret_refresh_key_long_enough',
      S3_ACCESS_KEY: 'minioadmin',
      S3_SECRET_KEY: 'minioadminpassword',
      NODE_ENV: 'development',
    };

    const parsed = validateEnv(validEnv as any);
    expect(parsed.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/campusos_db');
    expect(parsed.NODE_ENV).toBe('development');
  });

  it('should throw validation error when mandatory DATABASE_URL is invalid', () => {
    const invalidEnv = {
      DATABASE_URL: 'not-a-url',
      JWT_SECRET: 'secret',
    };

    expect(() => validateEnv(invalidEnv as any)).toThrow();
  });
});
