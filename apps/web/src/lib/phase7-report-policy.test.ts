import { RoleType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { canExportPhase7Report, phase7ReportsForRole } from './phase7-report-policy';

describe('Phase 7 report policy', () => {
  it('keeps finance roles inside finance reports', () => {
    expect(canExportPhase7Report(RoleType.ACCOUNTANT, 'finance-aging')).toBe(true);
    expect(canExportPhase7Report(RoleType.ACCOUNTANT, 'student-progress')).toBe(false);
  });

  it('keeps librarians inside circulation reports', () => {
    expect(phase7ReportsForRole(RoleType.LIBRARIAN)).toEqual([
      'my-account',
      'library-circulation',
    ]);
  });

  it('limits an HOD to a department-scoped progress report', () => {
    expect(phase7ReportsForRole(RoleType.HOD)).toEqual([
      'my-account',
      'student-progress',
    ]);
  });
});
