export type EditableWidgetDefinition = {
  key: string;
  title: string;
  description: string;
  category: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
};

export type EditableWidgetPlacement = {
  instanceId: string;
  widgetKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  settings: Record<string, unknown>;
};

export const DASHBOARD_EDITOR_COLUMNS = 12;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Packs widgets left-to-right into a deterministic 12-column layout. The
 * editor uses this after drag reordering and resizing so the payload sent to
 * the server is always free from rectangle overlaps.
 */
export function packDashboardWidgets(
  widgets: EditableWidgetPlacement[],
  columns = DASHBOARD_EDITOR_COLUMNS,
): EditableWidgetPlacement[] {
  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  return widgets.map((widget) => {
    const width = clamp(Math.trunc(widget.width), 1, columns);
    const height = Math.max(1, Math.trunc(widget.height));

    if (cursorX + width > columns) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    const packed = {
      ...widget,
      x: cursorX,
      y: cursorY,
      width,
      height,
      settings: { ...widget.settings },
    };

    cursorX += width;
    rowHeight = Math.max(rowHeight, height);
    return packed;
  });
}

export function reorderDashboardWidget(
  widgets: EditableWidgetPlacement[],
  draggedInstanceId: string,
  targetInstanceId: string,
) {
  if (draggedInstanceId === targetInstanceId) return packDashboardWidgets(widgets);

  const sourceIndex = widgets.findIndex((widget) => widget.instanceId === draggedInstanceId);
  const targetIndex = widgets.findIndex((widget) => widget.instanceId === targetInstanceId);
  if (sourceIndex < 0 || targetIndex < 0) return packDashboardWidgets(widgets);

  const reordered = widgets.map((widget) => ({ ...widget, settings: { ...widget.settings } }));
  const [dragged] = reordered.splice(sourceIndex, 1);
  if (!dragged) return packDashboardWidgets(widgets);
  reordered.splice(targetIndex, 0, dragged);
  return packDashboardWidgets(reordered);
}

export function moveDashboardWidget(
  widgets: EditableWidgetPlacement[],
  instanceId: string,
  direction: -1 | 1,
) {
  const index = widgets.findIndex((widget) => widget.instanceId === instanceId);
  if (index < 0) return packDashboardWidgets(widgets);

  const targetIndex = clamp(index + direction, 0, widgets.length - 1);
  if (targetIndex === index) return packDashboardWidgets(widgets);

  const reordered = widgets.map((widget) => ({ ...widget, settings: { ...widget.settings } }));
  const [widget] = reordered.splice(index, 1);
  if (!widget) return packDashboardWidgets(widgets);
  reordered.splice(targetIndex, 0, widget);
  return packDashboardWidgets(reordered);
}

export function resizeDashboardWidget(
  widgets: EditableWidgetPlacement[],
  instanceId: string,
  definition: EditableWidgetDefinition,
  delta: { width?: number; height?: number },
) {
  const resized = widgets.map((widget) => {
    if (widget.instanceId !== instanceId) return { ...widget, settings: { ...widget.settings } };

    return {
      ...widget,
      width: clamp(
        widget.width + (delta.width ?? 0),
        definition.minWidth,
        Math.min(definition.maxWidth, DASHBOARD_EDITOR_COLUMNS),
      ),
      height: clamp(
        widget.height + (delta.height ?? 0),
        definition.minHeight,
        definition.maxHeight,
      ),
      settings: { ...widget.settings },
    };
  });

  return packDashboardWidgets(resized);
}

export function createDashboardWidgetPlacement(
  definition: EditableWidgetDefinition,
  instanceId: string,
): EditableWidgetPlacement {
  return {
    instanceId,
    widgetKey: definition.key,
    x: 0,
    y: 0,
    width: definition.defaultWidth,
    height: definition.defaultHeight,
    settings: {},
  };
}

export function removeDashboardWidget(
  widgets: EditableWidgetPlacement[],
  instanceId: string,
) {
  return packDashboardWidgets(
    widgets.filter((widget) => widget.instanceId !== instanceId),
  );
}

export function dashboardPlacementsEqual(
  left: EditableWidgetPlacement[],
  right: EditableWidgetPlacement[],
) {
  return JSON.stringify(left) === JSON.stringify(right);
}
