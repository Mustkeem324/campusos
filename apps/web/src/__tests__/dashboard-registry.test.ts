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
      else if (role === 'FINANCE_OFFICER' || role === 'ACCOUNTANT') expect(route).toBe('/dashboard/finance');
      else if (role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN') expect(route).toBe('/dashboard/admin');
      else expect(route).toBe('/dashboard');
    }
  });

  it('never serves an unhandled role another role\u2019s dashboard', () => {
    const unhandled = [
      RoleType.REGISTRAR,
      RoleType.DEAN,
      RoleType.HOD,
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

  it('implements the STUDENT, ADMIN, PARENT, FACULTY and FINANCE dashboards', () => {
    expect(IMPLEMENTED_DASHBOARD_ROLES).toEqual(['STUDENT', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PARENT', 'FACULTY', 'FINANCE_OFFICER', 'ACCOUNTANT']);
    expect(DASHBOARD_DEFINITIONS[RoleType.STUDENT]?.dataContract).toBe('StudentDashboardData');
    expect(DASHBOARD_DEFINITIONS[RoleType.STUDENT]?.route).toBe('/dashboard/student');
    expect(DASHBOARD_DEFINITIONS[RoleType.INSTITUTION_ADMIN]?.dataContract).toBe('AdminDashboardData');
    expect(DASHBOARD_DEFINITIONS[RoleType.INSTITUTION_ADMIN]?.route).toBe('/dashboard/admin');
    expect(DASHBOARD_DEFINITIONS[RoleType.PARENT]?.dataContract).toBe('ParentDashboardData');
    expect(DASHBOARD_DEFINITIONS[RoleType.PARENT]?.route).toBe('/dashboard/parent');
    // SUPER_ADMIN reuses the admin route but its platform contract is still planned.
    expect(DASHBOARD_DEFINITIONS[RoleType.SUPER_ADMIN]?.dataContract).toBe('PlatformAdminDashboardData (planned)');
  });

  it('finance dashboards are defined and marked implemented', () => {
    expect(dashboardDefinitionForRole(RoleType.FINANCE_OFFICER).route).toBe('/dashboard/finance');
    expect(dashboardDefinitionForRole(RoleType.ACCOUNTANT).route).toBe('/dashboard/finance');
    expect(IMPLEMENTED_DASHBOARD_ROLES).toContain(RoleType.FINANCE_OFFICER);
    expect(IMPLEMENTED_DASHBOARD_ROLES).toContain(RoleType.ACCOUNTANT);
    expect(dashboardDefinitionForRole(RoleType.FINANCE_OFFICER).dataContract).toBe('FinanceDashboardData');
    expect(dashboardDefinitionForRole(RoleType.ACCOUNTANT).dataContract).toBe('FinanceDashboardData');
  });

  it('finance widgets declare eligibility, permission, data source and states', () => {
    const definition = dashboardDefinitionForRole(RoleType.FINANCE_OFFICER);
    expect(definition.widgets.length).toBeGreaterThan(0);
    for (const widget of definition.widgets) {
      expect(widget.roles).toContain(RoleType.FINANCE_OFFICER);
      expect(widget.permission.length).toBeGreaterThan(0);
      expect(widget.dataSource.length).toBeGreaterThan(0);
      expect(widget.states.length).toBeGreaterThan(0);
      expect(widget.id).toMatch(/^finance-/);
    }
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

  it('faculty dashboard is defined and marked implemented', () => {
    expect(dashboardDefinitionForRole(RoleType.FACULTY).route).toBe('/dashboard/faculty');
    expect(IMPLEMENTED_DASHBOARD_ROLES).toContain(RoleType.FACULTY);
    expect(dashboardDefinitionForRole(RoleType.FACULTY).dataContract).toBe('FacultyDashboardData');
  });

  it('faculty widgets declare eligibility, permission, data source and states', () => {
    const definition = dashboardDefinitionForRole(RoleType.FACULTY);
    for (const widget of definition.widgets) {
      expect(widget.roles).toContain(RoleType.FACULTY);
      expect(widget.permission.length).toBeGreaterThan(0);
      expect(widget.dataSource.length).toBeGreaterThan(0);
      expect(widget.states.length).toBeGreaterThan(0);
      expect(widget.id).toMatch(/^faculty-/);
    }
  });
});
