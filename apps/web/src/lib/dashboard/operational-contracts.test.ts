import { describe, expect, it } from 'vitest';
import type { RoleType } from '@prisma/client';

import {
  isOperationalDashboardRole,
  OPERATIONAL_DASHBOARD_ROLES,
} from './operational-contracts';

const allKnownRoles: RoleType[] = [
  'SUPER_ADMIN',
  'INSTITUTION_ADMIN',
  'REGISTRAR',
  'DEAN',
  'HOD',
  'FACULTY',
  'STUDENT',
  'PARENT',
  'FINANCE_OFFICER',
  'ACCOUNTANT',
  'HR_ADMIN',
  'WARDEN',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'PLACEMENT_OFFICER',
  'ADMISSIONS_COUNSELLOR',
  'EXAMINATION_CONTROLLER',
];

describe('operational dashboard role guard', () => {
  it('enables only the roles with reviewed server-backed dashboard loaders', () => {
    expect(OPERATIONAL_DASHBOARD_ROLES).toEqual([
      'REGISTRAR',
      'FINANCE_OFFICER',
      'EXAMINATION_CONTROLLER',
      'ADMISSIONS_COUNSELLOR',
    ]);
  });

  it('does not route dedicated or unsupported roles into an operational dashboard', () => {
    const enabled = allKnownRoles.filter(isOperationalDashboardRole);
    const disabled = allKnownRoles.filter((role) => !isOperationalDashboardRole(role));

    expect(enabled).toEqual(OPERATIONAL_DASHBOARD_ROLES);
    expect(disabled).toContain('STUDENT');
    expect(disabled).toContain('FACULTY');
    expect(disabled).toContain('INSTITUTION_ADMIN');
    expect(disabled).toContain('ACCOUNTANT');
  });
});
