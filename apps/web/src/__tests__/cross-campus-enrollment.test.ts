import { describe, it, expect } from 'vitest';
import { enrollCrossCampusElective } from '../lib/multicampus-service';

describe('Phase 17 Cross-Campus Elective Enrollment & Currency Conversion Test Suite', () => {
  it('should process cross-campus enrollment and convert fee from INR to USD', () => {
    const res = enrollCrossCampusElective({
      studentId: 's1',
      homeCampusId: 'camp_main',
      hostCampusId: 'camp_ny',
      courseCode: 'CS509',
      feeAmountLocal: 8300, // 8,300 INR
      localCurrency: 'INR',
      studentBillingCurrency: 'USD',
    });

    expect(res.success).toBe(true);
    expect(res.billedAmount).toBe(100); // 8,300 INR / 83 = $100 USD!
    expect(res.currency).toBe('USD');
  });
});
