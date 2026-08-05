import { describe, expect, it } from 'vitest';

import {
  PHASE5_DASHBOARD_ROLES,
  clampPercentage,
  isPhase5DashboardRole,
} from './phase5-contracts';

describe('Dashboard UI Phase 5 contracts', () => {
  it('enables leadership, people and campus-service roles only', () => {
    expect(PHASE5_DASHBOARD_ROLES).toEqual([
      'DEAN',
      'HOD',
      'HR_ADMIN',
      'WARDEN',
      'TRANSPORT_MANAGER',
      'PLACEMENT_OFFICER',
    ]);

    for (const role of PHASE5_DASHBOARD_ROLES) {
      expect(isPhase5DashboardRole(role)).toBe(true);
    }

    expect(isPhase5DashboardRole('STUDENT')).toBe(false);
    expect(isPhase5DashboardRole('FINANCE_OFFICER')).toBe(false);
    expect(isPhase5DashboardRole('LIBRARIAN')).toBe(false);
  });

  it('normalises progress values for accessible dashboard bars', () => {
    expect(clampPercentage(-10)).toBe(0);
    expect(clampPercentage(48.6)).toBe(49);
    expect(clampPercentage(140)).toBe(100);
    expect(clampPercentage(Number.NaN)).toBe(0);
  });
});
