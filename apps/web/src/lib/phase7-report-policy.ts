import { RoleType } from '@prisma/client';

import type { Phase7ReportType } from './phase7';

const REPORTS_BY_ROLE: Partial<Record<RoleType, readonly Phase7ReportType[]>> = {
  SUPER_ADMIN: [
    'my-account',
    'user-directory',
    'student-progress',
    'finance-aging',
    'library-circulation',
    'student-success',
  ],
  INSTITUTION_ADMIN: [
    'my-account',
    'user-directory',
    'student-progress',
    'finance-aging',
    'library-circulation',
    'student-success',
  ],
  REGISTRAR: ['my-account', 'user-directory', 'student-progress', 'student-success'],
  DEAN: ['my-account', 'student-progress', 'student-success'],
  HOD: ['my-account', 'student-progress'],
  FINANCE_OFFICER: ['my-account', 'finance-aging'],
  ACCOUNTANT: ['my-account', 'finance-aging'],
  HR_ADMIN: ['my-account', 'user-directory'],
  LIBRARIAN: ['my-account', 'library-circulation'],
  EXAMINATION_CONTROLLER: ['my-account', 'student-progress'],
};

export function phase7ReportsForRole(role: RoleType): Phase7ReportType[] {
  return [...(REPORTS_BY_ROLE[role] ?? ['my-account'])];
}

export function canExportPhase7Report(role: RoleType, type: Phase7ReportType) {
  return phase7ReportsForRole(role).includes(type);
}
