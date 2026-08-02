import { describe, it, expect } from 'vitest';
import { calculateRoyaltyDistribution } from '../lib/research-service';

describe('Phase 12 Patent Commercialization Royalty Split Test Suite', () => {
  it('should calculate 70% Inventor, 20% Institution, and 10% IP Cell royalty split', () => {
    const split = calculateRoyaltyDistribution(10000);

    expect(split.inventorShare).toBe(7000);
    expect(split.institutionShare).toBe(2000);
    expect(split.ipCellShare).toBe(1000);
  });
});
