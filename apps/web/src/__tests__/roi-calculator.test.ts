import { describe, it, expect } from 'vitest';
import { calculateInstitutionalROI } from '../lib/public-portal-service';

describe('Phase 20 Institutional ROI Calculator Test Suite', () => {
  it('should calculate annual cost savings and labor hours saved for 1000 students', () => {
    const roi = calculateInstitutionalROI(1000);

    expect(roi.annualCostSavingsUSD).toBe(45000);
    expect(roi.annualLaborHoursSaved).toBe(15000);
    expect(roi.paperlessPaperSheetsSaved).toBe(120000);
  });
});
