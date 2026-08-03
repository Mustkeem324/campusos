import { describe, it, expect } from 'vitest';
import { parseSeedConfig } from '../../scripts/demo-seed/config';
import { assertSeedSafety } from '../../scripts/demo-seed/safety';
import { SeededRandom } from '../../scripts/demo-seed/random';

describe('Demo Seed Engine Unit Tests', () => {
  describe('Config Parser', () => {
    it('should parse default CLI arguments correctly', () => {
      const config = parseSeedConfig([]);
      expect(config.tenantCode).toBe('CDU');
      expect(config.students).toBe(100);
      expect(config.faculty).toBe(20);
      expect(config.seed).toBe(20260804);
      expect(config.reset).toBe(false);
      expect(config.validateOnly).toBe(false);
    });

    it('should override configuration from CLI flags', () => {
      const config = parseSeedConfig([
        '--students=50',
        '--faculty=10',
        '--seed=9999',
        '--reset',
        '--validate-only',
      ]);
      expect(config.students).toBe(50);
      expect(config.faculty).toBe(10);
      expect(config.seed).toBe(9999);
      expect(config.reset).toBe(true);
      expect(config.validateOnly).toBe(true);
    });
  });

  describe('Safety Guardrails', () => {
    it('should allow execution in development/test environment', () => {
      const config = parseSeedConfig([]);
      expect(() => assertSeedSafety(config)).not.toThrow();
    });

    it('should reject execution in production environment without explicit allow flag', () => {
      const envObj = process.env as Record<string, string | undefined>;
      const originalEnv = envObj.NODE_ENV;
      try {
        envObj.NODE_ENV = 'production';
        const config = parseSeedConfig([]);
        expect(() => assertSeedSafety(config)).toThrow('Demo data generation is blocked for this environment.');
      } finally {
        envObj.NODE_ENV = originalEnv;
      }
    });

    it('should reject execution when targeting non-demo tenant code', () => {
      const config = parseSeedConfig(['--tenant-code=PROD_UNIV']);
      expect(() => assertSeedSafety(config)).toThrow('Target tenant is not a demo tenant');
    });
  });

  describe('PRNG Determinism & Idempotency', () => {
    it('should generate identical random streams for identical seeds', () => {
      const prng1 = new SeededRandom(20260804);
      const prng2 = new SeededRandom(20260804);

      const val1 = [prng1.randomInteger(1, 100), prng1.randomDecimal(10, 50, 2), prng1.generateStableId(1, 5)];
      const val2 = [prng2.randomInteger(1, 100), prng2.randomDecimal(10, 50, 2), prng2.generateStableId(1, 5)];

      expect(val1).toEqual(val2);
    });

    it('should generate different streams for different seeds', () => {
      const prng1 = new SeededRandom(1111);
      const prng2 = new SeededRandom(9999);

      expect(prng1.randomInteger(1, 100000)).not.toEqual(prng2.randomInteger(1, 100000));
    });

    it('should format valid UUID string for generateStableId', () => {
      const prng = new SeededRandom(100);
      const uuid = prng.generateStableId(1, 42);
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });
  });
});
