import { describe, it, expect } from 'vitest';
import { calculateConsolidatedGroupFinancials, CampusFinancialSummary } from '../lib/multicampus-service';

describe('Phase 17 Multi-Campus Consolidated Financial Query Test Suite', () => {
  it('should aggregate multi-currency campus revenues into single target currency (USD)', () => {
    const campuses: CampusFinancialSummary[] = [
      { campusId: 'c1', campusName: 'India', currency: 'INR', tuitionCollectedLocal: 83000000 }, // $1,000,000 USD
      { campusId: 'c2', campusName: 'Dubai', currency: 'AED', tuitionCollectedLocal: 3670000 },  // $1,000,000 USD
      { campusId: 'c3', campusName: 'New York', currency: 'USD', tuitionCollectedLocal: 1000000 },// $1,000,000 USD
    ];

    const res = calculateConsolidatedGroupFinancials(campuses, 'USD');

    expect(res.totalGroupRevenueTargetCurrency).toBe(3000000); // Exactly $3M USD total!
    expect(res.breakdown.length).toBe(3);
  });
});
