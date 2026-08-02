import { describe, it, expect } from 'vitest';
import { autoPullNAACMetrics } from '../lib/govt-compliance-service';

describe('Phase 11 NAAC Accreditation Auto-Metric Puller Test Suite', () => {
  it('should auto-pull NAAC Criteria 1-7 metrics and compute projected CGPA', () => {
    const metrics = autoPullNAACMetrics('inst_apex_univ');

    expect(metrics.criterion1_Curriculum).toBeGreaterThan(0);
    expect(metrics.criterion3_ResearchOutput).toBeGreaterThan(0);
    expect(metrics.overallCGPA).toBe(3.72); // A++ Grade (> 3.51)
  });
});
