import { describe, it, expect } from 'vitest';
import { generateAssetDepreciationSchedule, PhysicalAsset } from '../lib/operations-service';

describe('Phase 13 Straight-Line Asset Depreciation Schedule Test Suite', () => {
  it('should calculate annual depreciation expense and ending book value over asset lifespan', () => {
    const asset: PhysicalAsset = {
      assetId: 'AST-01',
      assetName: 'Server Node',
      purchaseCost: 20000,
      salvageValue: 2000,
      usefulLifeYears: 5,
      purchaseYear: 2026,
    };

    // Depreciable base = 20,000 - 2,000 = 18,000 / 5 = 3,600 per year
    const schedule = generateAssetDepreciationSchedule(asset);

    expect(schedule.length).toBe(5);
    expect(schedule[0].depreciationExpense).toBe(3600);
    expect(schedule[0].endingBookValue).toBe(16400); // 20,000 - 3,600 = 16,400
    expect(schedule[4].endingBookValue).toBe(2000);   // Final book value equals salvage value
  });
});
