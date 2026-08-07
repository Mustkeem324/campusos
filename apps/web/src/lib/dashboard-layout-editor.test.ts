import { describe, expect, it } from 'vitest';

import {
  createDashboardWidgetPlacement,
  dashboardPlacementsEqual,
  moveDashboardWidget,
  packDashboardWidgets,
  removeDashboardWidget,
  reorderDashboardWidget,
  resizeDashboardWidget,
  type EditableWidgetDefinition,
  type EditableWidgetPlacement,
} from './dashboard-layout-editor';

const definition: EditableWidgetDefinition = {
  key: 'sample-widget',
  title: 'Sample widget',
  description: 'Test widget',
  category: 'operations',
  defaultWidth: 6,
  defaultHeight: 3,
  minWidth: 3,
  minHeight: 2,
  maxWidth: 12,
  maxHeight: 8,
};

function placement(id: string, width = 6, height = 3): EditableWidgetPlacement {
  return {
    instanceId: id,
    widgetKey: 'sample-widget',
    x: 9,
    y: 99,
    width,
    height,
    settings: {},
  };
}

describe('Phase 8B dashboard layout editor', () => {
  it('packs widgets into the 12-column grid without retaining stale coordinates', () => {
    const packed = packDashboardWidgets([
      placement('first', 8, 3),
      placement('second', 6, 4),
      placement('third', 6, 2),
    ]);

    expect(packed.map(({ x, y }) => ({ x, y }))).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 3 },
      { x: 6, y: 3 },
    ]);
  });

  it('reorders widgets through drag targets and keyboard move controls', () => {
    const widgets = [placement('one'), placement('two'), placement('three')];
    const dragged = reorderDashboardWidget(widgets, 'three', 'one');
    const moved = moveDashboardWidget(dragged, 'one', 1);

    expect(dragged.map((widget) => widget.instanceId)).toEqual(['three', 'one', 'two']);
    expect(moved.map((widget) => widget.instanceId)).toEqual(['three', 'two', 'one']);
  });

  it('clamps resize operations to the widget definition', () => {
    const widgets = [placement('one', 6, 3)];
    const minimum = resizeDashboardWidget(widgets, 'one', definition, {
      width: -100,
      height: -100,
    });
    const maximum = resizeDashboardWidget(widgets, 'one', definition, {
      width: 100,
      height: 100,
    });

    expect(minimum[0]).toMatchObject({ width: 3, height: 2 });
    expect(maximum[0]).toMatchObject({ width: 12, height: 8 });
  });

  it('creates, removes and compares placements deterministically', () => {
    const created = createDashboardWidgetPlacement(definition, 'sample-widget-1');
    expect(created).toMatchObject({
      instanceId: 'sample-widget-1',
      widgetKey: 'sample-widget',
      width: 6,
      height: 3,
    });

    const widgets = packDashboardWidgets([created, placement('second')]);
    const removed = removeDashboardWidget(widgets, 'second');
    expect(removed).toHaveLength(1);
    expect(dashboardPlacementsEqual(removed, packDashboardWidgets([created]))).toBe(true);
  });
});
