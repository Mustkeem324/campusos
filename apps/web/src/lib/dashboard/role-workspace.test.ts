import { describe, expect, it } from 'vitest';
import type { RoleType } from '@prisma/client';

import { roleLabel, roleWorkspaceProfileForRole } from './role-workspace';

const workspaceRoles: RoleType[] = [
  'REGISTRAR',
  'DEAN',
  'HOD',
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

describe('role workspace profiles', () => {
  it('provides a complete role-specific workspace for every remaining operational role', () => {
    for (const role of workspaceRoles) {
      const profile = roleWorkspaceProfileForRole(role);

      expect(profile.title.length).toBeGreaterThan(10);
      expect(profile.description.length).toBeGreaterThan(20);
      expect(profile.responsibilities.length).toBeGreaterThanOrEqual(3);
      expect(profile.actions.length).toBeGreaterThanOrEqual(3);
      expect(profile.actions.every((action) => action.href.startsWith('/'))).toBe(true);
      expect(profile.actions.every((action) => action.href !== '#')).toBe(true);
    }
  });

  it('does not silently reuse the same profile for distinct professional roles', () => {
    const registrar = roleWorkspaceProfileForRole('REGISTRAR');
    const finance = roleWorkspaceProfileForRole('FINANCE_OFFICER');
    const warden = roleWorkspaceProfileForRole('WARDEN');

    expect(registrar.title).not.toBe(finance.title);
    expect(finance.title).not.toBe(warden.title);
    expect(registrar.actions.map((action) => action.href)).not.toEqual(finance.actions.map((action) => action.href));
  });

  it('formats role labels for the professional workspace header', () => {
    expect(roleLabel('EXAMINATION_CONTROLLER')).toBe('Examination Controller');
    expect(roleLabel('HR_ADMIN')).toBe('Hr Admin');
  });
});
