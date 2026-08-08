import { describe, it, expect } from 'vitest';

import {
  addMinor,
  applyCap,
  fromMinor,
  nonNegativeMinor,
  percentageOfMinor,
  roundMinor,
  splitIntoInstallments,
  subtractMinor,
  sumMinor,
  toMinor,
} from '../lib/finance-money';

describe('Finance 2.0 money primitives', () => {
  describe('toMinor / fromMinor', () => {
    it('converts decimal rupees to integer paise exactly', () => {
      expect(toMinor('125.50')).toBe(12550);
      expect(toMinor(125.5)).toBe(12550);
      expect(toMinor('0.01')).toBe(1);
      expect(toMinor('1')).toBe(100);
      expect(toMinor('-3.25')).toBe(-325);
    });

    it('round-trips decimal values without float drift', () => {
      expect(fromMinor(toMinor('0.1'))).toBe(0.1);
      expect(fromMinor(toMinor('19.99'))).toBe(19.99);
      expect(fromMinor(toMinor('1234567.89'))).toBe(1234567.89);
    });

    it('rejects malformed monetary values', () => {
      expect(() => toMinor('12.345')).toThrow();
      expect(() => toMinor('abc')).toThrow();
      expect(() => toMinor('1,000')).toThrow();
      expect(() => toMinor(Number.NaN)).toThrow();
      expect(() => toMinor(Number.POSITIVE_INFINITY)).toThrow();
    });
  });

  describe('rounding', () => {
    it('rounds half up deterministically', () => {
      expect(roundMinor(12.5)).toBe(13);
      expect(roundMinor(12.49)).toBe(12);
      expect(roundMinor(-12.5)).toBe(-13);
    });

    it('calculates percentages with deterministic rounding', () => {
      // 20% of ₹75,000 = ₹15,000
      expect(percentageOfMinor(7_500_000, 20)).toBe(1_500_000);
      // 10% of ₹99,995 = ₹9,999.5 -> rounds half-up to 9,999.5 paise = ₹9,999.50
      expect(percentageOfMinor(9_999_500, 10)).toBe(999_950);
    });

    it('rejects invalid percentages', () => {
      expect(() => percentageOfMinor(100, -1)).toThrow();
      expect(() => percentageOfMinor(100, Number.NaN)).toThrow();
    });
  });

  describe('caps and negativity guards', () => {
    it('caps discounts at the configured ceiling', () => {
      expect(applyCap(5000, 3000)).toBe(3000);
      expect(applyCap(2000, 3000)).toBe(2000);
      expect(applyCap(2000, 0)).toBe(2000); // 0 means no cap
    });

    it('never produces a negative payable', () => {
      expect(nonNegativeMinor(-100)).toBe(0);
      expect(nonNegativeMinor(0)).toBe(0);
      expect(nonNegativeMinor(50)).toBe(50);
    });
  });

  describe('arithmetic and sums', () => {
    it('sums and subtracts minor units exactly', () => {
      expect(addMinor(12550, 100)).toBe(12650);
      expect(subtractMinor(12550, 2550)).toBe(10000);
      expect(sumMinor([100, null, 250, undefined, 50])).toBe(400);
    });
  });

  describe('installment splitting', () => {
    it('splits totals so parts always sum to the original', () => {
      const parts = splitIntoInstallments(10_000, 3);
      expect(parts.reduce((sum, part) => sum + part, 0)).toBe(10_000);
      expect(parts[0]).toBe(3333);
      expect(parts[1]).toBe(3333);
      expect(parts[2]).toBe(3334); // remainder absorbed by final installment
    });

    it('handles a single installment and rejects invalid counts', () => {
      expect(splitIntoInstallments(500, 1)).toEqual([500]);
      expect(() => splitIntoInstallments(500, 0)).toThrow();
      expect(() => splitIntoInstallments(-5, 2)).toThrow();
    });

    it('distributes a non-divisible amount deterministically', () => {
      const parts = splitIntoInstallments(100, 4);
      expect(parts).toEqual([25, 25, 25, 25]);
    });
  });
});
