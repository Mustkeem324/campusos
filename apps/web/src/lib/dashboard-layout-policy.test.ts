import { RoleType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  DASHBOARD_LAYOUT_STORE_KEY,
  DashboardLayoutError,
  buildDefaultWidgetPlacements,
  createInitialDashboardLayoutState,
  mergeDashboardLayoutStateIntoPreferences,
  parseDashboardLayoutState,
  publicDashboardLayoutResponse,
  validateWidgetPlacements,
  widgetCatalogForRole,
} from './dashboard-layout-policy';

describe('Phase 8B dashboard layout policy', () => {
  it('returns only widgets authorised for the active role', () => {
    const studentKeys = widgetCatalogForRole(RoleType.STUDENT).map((widget) => widget.key);
    const financeKeys = widgetCatalogForRole(RoleType.FINANCE_OFFICER).map((widget) => widget.key);

    expect(studentKeys).toContain('assignment-deadlines');
    expect(studentKeys).not.toContain('finance-aging');
    expect(financeKeys).toContain('finance-aging');
    expect(financeKeys).not.toContain('student-success');
  });

  it('builds non-overlapping default layouts inside the 12-column grid', () => {
    for (const role of Object.values(RoleType)) {
      const placements = buildDefaultWidgetPlacements(role);
      expect(placements.length).toBeGreaterThan(0);
      expect(() => validateWidgetPlacements(role, placements)).not.toThrow();
      expect(placements.every((placement) => placement.x + placement.width <= 12)).toBe(true);
    }
  });

  it('rejects widgets that the role is not authorised to use', () => {
    expect(() => validateWidgetPlacements(RoleType.STUDENT, [{
      instanceId: 'finance-widget',
      widgetKey: 'finance-aging',
      x: 0,
      y: 0,
      width: 6,
      height: 4,
      settings: {},
    }])).toThrowError(DashboardLayoutError);
  });

  it('rejects overlapping widgets', () => {
    expect(() => validateWidgetPlacements(RoleType.STUDENT, [
      {
        instanceId: 'attendance-one',
        widgetKey: 'attendance-overview',
        x: 0,
        y: 0,
        width: 4,
        height: 3,
        settings: {},
      },
      {
        instanceId: 'results-one',
        widgetKey: 'result-summary',
        x: 2,
        y: 1,
        width: 4,
        height: 3,
        settings: {},
      },
    ])).toThrow(/overlap/i);
  });

  it('rejects widget dimensions outside the catalogue limits', () => {
    expect(() => validateWidgetPlacements(RoleType.STUDENT, [{
      instanceId: 'tiny-attendance',
      widgetKey: 'attendance-overview',
      x: 0,
      y: 0,
      width: 1,
      height: 1,
      settings: {},
    }])).toThrow(/size limits/i);
  });

  it('preserves unrelated user preferences when storing layouts', () => {
    const state = createInitialDashboardLayoutState(RoleType.STUDENT);
    const merged = mergeDashboardLayoutStateIntoPreferences(
      { appearance: 'dark', locale: 'en-IN' },
      state,
    );

    expect(merged.appearance).toBe('dark');
    expect(merged.locale).toBe('en-IN');
    expect(merged[DASHBOARD_LAYOUT_STORE_KEY]).toEqual(state);
  });

  it('ignores stale layouts containing newly unauthorised widgets', () => {
    const adminState = createInitialDashboardLayoutState(RoleType.INSTITUTION_ADMIN);
    adminState.layouts[0]!.widgets = [{
      instanceId: 'system-health-one',
      widgetKey: 'system-health',
      x: 0,
      y: 0,
      width: 6,
      height: 4,
      settings: {},
    }];

    const parsedForStudent = parseDashboardLayoutState(
      { [DASHBOARD_LAYOUT_STORE_KEY]: adminState },
      RoleType.STUDENT,
    );

    expect(parsedForStudent.layouts).toHaveLength(1);
    expect(parsedForStudent.layouts[0]!.id).toContain('default-student');
    expect(parsedForStudent.layouts[0]!.widgets.some((widget) => widget.widgetKey === 'system-health')).toBe(false);
  });

  it('returns an active layout, revision and role-scoped catalogue contract', () => {
    const state = createInitialDashboardLayoutState(RoleType.LIBRARIAN);
    const response = publicDashboardLayoutResponse(RoleType.LIBRARIAN, state, 'main');

    expect(response.revision).toBe(0);
    expect(response.activeLayout?.id).toBe(response.activeLayoutId);
    expect(response.catalog.some((widget) => widget.key === 'library-circulation')).toBe(true);
    expect(response.catalog.some((widget) => widget.key === 'finance-aging')).toBe(false);
    expect(response.limits.gridColumns).toBe(12);
  });
});
