import { describe, expect, it } from 'vitest';

import {
  PHASE4_DASHBOARD_ROLES,
  isPhase4DashboardRole,
  normalisePercentage,
} from './phase4-contracts';

describe('Dashboard UI Phase 4 contracts', () => {
  it('enables only finance, accounting and library roles', () => {
    expect(PHASE4_DASHBOARD_ROLES).toEqual([
      'FINANCE_OFFICER',
      'ACCOUNTANT',
      'LIBRARIAN',
    ]);

    expect(isPhase4DashboardRole('FINANCE_OFFICER')).toBe(true);
    expect(isPhase4DashboardRole('ACCOUNTANT')).toBe(true);
    expect(isPhase4DashboardRole('LIBRARIAN')).toBe(true);
    expect(isPhase4DashboardRole('STUDENT')).toBe(false);
    expect(isPhase4DashboardRole('INSTITUTION_ADMIN')).toBe(false);
    expect(isPhase4DashboardRole('REGISTRAR')).toBe(false);
  });

  it('clamps dashboard percentages to an accessible progress range', () => {
    expect(normalisePercentage(-12)).toBe(0);
    expect(normalisePercentage(49.6)).toBe(50);
    expect(normalisePercentage(132)).toBe(100);
    expect(normalisePercentage(Number.NaN)).toBe(0);
  });
});
