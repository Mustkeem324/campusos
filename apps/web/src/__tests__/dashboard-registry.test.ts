import { describe, it, expect } from 'vitest';
import { RoleType } from '@prisma/client';
import {
  DASHBOARD_DEFINITIONS,
  IMPLEMENTED_DASHBOARD_ROLES,
  KNOWN_ROLES,
  dashboardDefinitionForRole,
  dashboardRouteForRole,
} from '../lib/dashboard/registry';

describe('Phase 95: Dashboard Registry', () => {
  it('maps every known role to a landing route without a redirect loop', () => {
    for (const role of KNOWN_ROLES) {
      const route = dashboardRouteForRole(role);
      // A role must never map to its own landing page in a way that loops:
      // implemented roles get dedicated routes, unmapped roles get '/dashboard'.
      if (role === 'STUDENT') expect(route).toBe('/dashboard/student');
      else if (role === 'FACULTY') expect(route).toBe('/dashboard/faculty');
      else if (role === 'PARENT') expect(route).toBe('/dashboard/parent');
      else if (role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN') expect(route).toBe('/dashboard/admin');
      else expect(route).toBe('/dashboard');
    }
  });

  it('never serves an unhandled role another role\u2019s dashboard', () => {
    const unhandled = [
      RoleType.REGISTRAR,
      RoleType.DEAN,
      RoleType.HOD,
      RoleType.FINANCE_OFFICER,
      RoleType.ACCOUNTANT,
      RoleType.HR_ADMIN,
      RoleType.WARDEN,
      RoleType.LIBRARIAN,
      RoleType.TRANSPORT_MANAGER,
      RoleType.PLACEMENT_OFFICER,
      RoleType.ADMISSIONS_COUNSELLOR,
      RoleType.EXAMINATION_CONTROLLER,
    ];
    for (const role of unhandled) {
      const definition = dashboardDefinitionForRole(role);
      // Fallback definition must not leak a faculty/admin dashboard or its nav.
      expect(definition.route).toBe('/dashboard');
      expect(definition.navigation.some((g) => g.label.includes('FACULTY'))).toBe(false);
      expect(definition.navigation.some((g) => g.label.includes('ADMINISTRATION'))).toBe(false);
    }
  });

  it('only implements the STUDENT dashboard in the Phase 95 first cycle', () => {
    expect(IMPLEMENTED_DASHBOARD_ROLES).toEqual(['STUDENT']);
    expect(DASHBOARD_DEFINITIONS[RoleType.STUDENT]?.dataContract).toBe('StudentDashboardData');
    expect(DASHBOARD_DEFINITIONS[RoleType.STUDENT]?.route).toBe('/dashboard/student');
  });

  it('student navigation contains only student-relevant items', () => {
    const definition = dashboardDefinitionForRole(RoleType.STUDENT);
    const hrefs = definition.navigation.flatMap((g) => g.items.map((i) => i.href));

    // Must NOT contain admin/tenant/finance-reconciliation items.
    expect(hrefs).not.toContain('/settings');
    expect(hrefs).not.toContain('/data-migration');
    expect(hrefs).not.toContain('/ai-governance');
    expect(hrefs).not.toContain('/audit');

    // Must contain student-relevant destinations.
    expect(hrefs).toContain('/timetable');
    expect(hrefs).toContain('/attendance');
    expect(hrefs).toContain('/payments');
    expect(hrefs).toContain('/results');
  });

  it('student quick actions all resolve to real routes', () => {
    const definition = dashboardDefinitionForRole(RoleType.STUDENT);
    for (const action of definition.quickActions) {
      expect(action.href).toMatch(/^\//);
      expect(action.href).not.toBe('#');
      expect(action.label.length).toBeGreaterThan(0);
    }
  });

  it('student widgets declare eligibility, permission, data source and states', () => {
    const definition = dashboardDefinitionForRole(RoleType.STUDENT);
    for (const widget of definition.widgets) {
      expect(widget.roles).toContain(RoleType.STUDENT);
      expect(widget.permission.length).toBeGreaterThan(0);
      expect(widget.dataSource.length).toBeGreaterThan(0);
      expect(widget.states.length).toBeGreaterThan(0);
      expect(widget.id).toMatch(/^student-/);
    }
  });

  it('admin and faculty dashboards are defined but not marked implemented', () => {
    expect(dashboardDefinitionForRole(RoleType.INSTITUTION_ADMIN).route).toBe('/dashboard/admin');
    expect(dashboardDefinitionForRole(RoleType.FACULTY).route).toBe('/dashboard/faculty');
    expect(dashboardDefinitionForRole(RoleType.PARENT).route).toBe('/dashboard/parent');
    expect(IMPLEMENTED_DASHBOARD_ROLES).not.toContain(RoleType.FACULTY);
  });
});
