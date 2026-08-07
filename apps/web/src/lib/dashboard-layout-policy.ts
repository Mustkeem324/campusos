import crypto from 'crypto';

import { RoleType } from '@prisma/client';
import { z } from 'zod';

export const DASHBOARD_LAYOUT_STORE_KEY = 'phase8DashboardLayouts';
export const DASHBOARD_LAYOUT_SCHEMA_VERSION = 1;
export const DASHBOARD_GRID_COLUMNS = 12;
export const MAX_DASHBOARD_LAYOUTS = 10;
export const MAX_WIDGETS_PER_LAYOUT = 30;
export const MAX_WIDGET_SETTINGS_BYTES = 8_192;
export const MAX_DASHBOARD_PREFERENCES_BYTES = 96_000;

export type DashboardWidgetCategory =
  | 'account'
  | 'academic'
  | 'operations'
  | 'finance'
  | 'student-success'
  | 'communication'
  | 'governance';

export type DashboardWidgetDefinition = {
  key: string;
  title: string;
  description: string;
  category: DashboardWidgetCategory;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  roles: RoleType[] | null;
};

export type DashboardWidgetPlacement = {
  instanceId: string;
  widgetKey: string;
  x: number;
  y: number;
  width: number;
  height: number;
  settings: Record<string, unknown>;
};

export type SavedDashboardLayout = {
  id: string;
  name: string;
  dashboardKey: string;
  source: 'default' | 'custom';
  version: number;
  widgets: DashboardWidgetPlacement[];
  createdAt: string;
  updatedAt: string;
};

export type DashboardLayoutState = {
  schemaVersion: 1;
  revision: number;
  activeLayoutByDashboard: Record<string, string>;
  layouts: SavedDashboardLayout[];
};

export class DashboardLayoutError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DashboardLayoutError';
  }
}

const ALL_ACADEMIC_LEADERS: RoleType[] = [
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.REGISTRAR,
  RoleType.DEAN,
  RoleType.HOD,
  RoleType.EXAMINATION_CONTROLLER,
];

const FINANCE_ROLES: RoleType[] = [
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.FINANCE_OFFICER,
  RoleType.ACCOUNTANT,
];

const PEOPLE_ROLES: RoleType[] = [
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
  RoleType.HR_ADMIN,
  RoleType.DEAN,
  RoleType.HOD,
];

export const DASHBOARD_WIDGET_CATALOG: DashboardWidgetDefinition[] = [
  {
    key: 'account-summary',
    title: 'Account summary',
    description: 'Profile, security posture and active-session summary.',
    category: 'account',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 6,
    maxHeight: 5,
    roles: null,
  },
  {
    key: 'notification-inbox',
    title: 'Notification inbox',
    description: 'Unread and recent user-scoped notifications.',
    category: 'communication',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    roles: null,
  },
  {
    key: 'recent-activity',
    title: 'Recent activity',
    description: 'Recent authenticated-user audit activity.',
    category: 'governance',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 7,
    roles: null,
  },
  {
    key: 'quick-actions',
    title: 'Quick actions',
    description: 'Role-authorised shortcuts to frequent workflows.',
    category: 'operations',
    defaultWidth: 4,
    defaultHeight: 2,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 4,
    roles: null,
  },
  {
    key: 'today-timetable',
    title: "Today's timetable",
    description: 'Role-scoped classes, rooms and teaching slots.',
    category: 'academic',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.STUDENT, RoleType.FACULTY, RoleType.HOD],
  },
  {
    key: 'attendance-overview',
    title: 'Attendance overview',
    description: 'Authorised attendance status and exceptions.',
    category: 'academic',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    roles: [RoleType.STUDENT, RoleType.PARENT, RoleType.FACULTY, ...ALL_ACADEMIC_LEADERS],
  },
  {
    key: 'assignment-deadlines',
    title: 'Assignment deadlines',
    description: 'Upcoming submissions or grading work.',
    category: 'academic',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.STUDENT, RoleType.FACULTY, RoleType.HOD],
  },
  {
    key: 'result-summary',
    title: 'Result summary',
    description: 'Published academic results within the active role scope.',
    category: 'academic',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    roles: [RoleType.STUDENT, RoleType.PARENT, ...ALL_ACADEMIC_LEADERS],
  },
  {
    key: 'fee-status',
    title: 'Fee status',
    description: 'Outstanding, paid and due-date information within scope.',
    category: 'finance',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    roles: [RoleType.STUDENT, RoleType.PARENT, ...FINANCE_ROLES],
  },
  {
    key: 'approvals-queue',
    title: 'Approvals queue',
    description: 'Pending proposals limited to the reviewer’s authorised domain.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 9,
    roles: [
      RoleType.SUPER_ADMIN,
      RoleType.INSTITUTION_ADMIN,
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
    ],
  },
  {
    key: 'institution-kpis',
    title: 'Institution KPIs',
    description: 'Tenant-scoped academic and operational indicators.',
    category: 'operations',
    defaultWidth: 8,
    defaultHeight: 4,
    minWidth: 6,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR, RoleType.DEAN],
  },
  {
    key: 'finance-aging',
    title: 'Finance ageing',
    description: 'Invoice ageing, failed payments and pending refunds.',
    category: 'finance',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: FINANCE_ROLES,
  },
  {
    key: 'staff-workload',
    title: 'Staff workload',
    description: 'Department or institution-scoped workload indicators.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: PEOPLE_ROLES,
  },
  {
    key: 'admissions-pipeline',
    title: 'Admissions pipeline',
    description: 'Applications, review stages and enrolment progress.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR, RoleType.ADMISSIONS_COUNSELLOR],
  },
  {
    key: 'placement-pipeline',
    title: 'Placement pipeline',
    description: 'Companies, applications and placement outcomes.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.DEAN, RoleType.HOD, RoleType.PLACEMENT_OFFICER],
  },
  {
    key: 'hostel-occupancy',
    title: 'Hostel occupancy',
    description: 'Tenant-scoped hostel capacity and allocation indicators.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.WARDEN],
  },
  {
    key: 'transport-status',
    title: 'Transport status',
    description: 'Routes and transport operations within the active tenant.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.TRANSPORT_MANAGER],
  },
  {
    key: 'library-circulation',
    title: 'Library circulation',
    description: 'Catalogue and circulation indicators supported by persisted data.',
    category: 'operations',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.LIBRARIAN],
  },
  {
    key: 'student-success',
    title: 'Student success cases',
    description: 'Explainable, human-reviewed student-support cases.',
    category: 'student-success',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 9,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN, RoleType.REGISTRAR, RoleType.DEAN, RoleType.HOD, RoleType.FACULTY],
  },
  {
    key: 'reports-shortcuts',
    title: 'Reports and exports',
    description: 'Role-authorised report and export shortcuts.',
    category: 'governance',
    defaultWidth: 4,
    defaultHeight: 3,
    minWidth: 3,
    minHeight: 2,
    maxWidth: 8,
    maxHeight: 6,
    roles: [
      RoleType.SUPER_ADMIN,
      RoleType.INSTITUTION_ADMIN,
      RoleType.REGISTRAR,
      RoleType.DEAN,
      RoleType.HOD,
      RoleType.FINANCE_OFFICER,
      RoleType.ACCOUNTANT,
      RoleType.HR_ADMIN,
      RoleType.LIBRARIAN,
      RoleType.PLACEMENT_OFFICER,
      RoleType.EXAMINATION_CONTROLLER,
    ],
  },
  {
    key: 'audit-events',
    title: 'Audit events',
    description: 'Recent tenant-scoped governance activity.',
    category: 'governance',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 9,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN],
  },
  {
    key: 'system-health',
    title: 'System health',
    description: 'Platform and integration health indicators.',
    category: 'governance',
    defaultWidth: 6,
    defaultHeight: 4,
    minWidth: 4,
    minHeight: 3,
    maxWidth: 12,
    maxHeight: 8,
    roles: [RoleType.SUPER_ADMIN, RoleType.INSTITUTION_ADMIN],
  },
];

const DEFAULT_WIDGET_KEYS: Partial<Record<RoleType, string[]>> = {
  [RoleType.SUPER_ADMIN]: ['institution-kpis', 'system-health', 'approvals-queue', 'audit-events', 'reports-shortcuts', 'notification-inbox'],
  [RoleType.INSTITUTION_ADMIN]: ['institution-kpis', 'approvals-queue', 'staff-workload', 'finance-aging', 'system-health', 'notification-inbox'],
  [RoleType.REGISTRAR]: ['institution-kpis', 'approvals-queue', 'admissions-pipeline', 'attendance-overview', 'reports-shortcuts', 'notification-inbox'],
  [RoleType.DEAN]: ['institution-kpis', 'staff-workload', 'student-success', 'placement-pipeline', 'approvals-queue', 'reports-shortcuts'],
  [RoleType.HOD]: ['today-timetable', 'staff-workload', 'attendance-overview', 'student-success', 'approvals-queue', 'assignment-deadlines'],
  [RoleType.FACULTY]: ['today-timetable', 'assignment-deadlines', 'attendance-overview', 'student-success', 'notification-inbox', 'quick-actions'],
  [RoleType.STUDENT]: ['today-timetable', 'attendance-overview', 'assignment-deadlines', 'result-summary', 'fee-status', 'notification-inbox'],
  [RoleType.PARENT]: ['attendance-overview', 'result-summary', 'fee-status', 'notification-inbox', 'recent-activity', 'quick-actions'],
  [RoleType.FINANCE_OFFICER]: ['finance-aging', 'approvals-queue', 'reports-shortcuts', 'notification-inbox', 'recent-activity', 'quick-actions'],
  [RoleType.ACCOUNTANT]: ['finance-aging', 'approvals-queue', 'reports-shortcuts', 'notification-inbox', 'recent-activity', 'quick-actions'],
  [RoleType.HR_ADMIN]: ['staff-workload', 'approvals-queue', 'reports-shortcuts', 'notification-inbox', 'recent-activity', 'quick-actions'],
  [RoleType.WARDEN]: ['hostel-occupancy', 'approvals-queue', 'notification-inbox', 'recent-activity', 'account-summary', 'quick-actions'],
  [RoleType.LIBRARIAN]: ['library-circulation', 'approvals-queue', 'reports-shortcuts', 'notification-inbox', 'recent-activity', 'quick-actions'],
  [RoleType.TRANSPORT_MANAGER]: ['transport-status', 'approvals-queue', 'notification-inbox', 'recent-activity', 'account-summary', 'quick-actions'],
  [RoleType.PLACEMENT_OFFICER]: ['placement-pipeline', 'approvals-queue', 'reports-shortcuts', 'notification-inbox', 'recent-activity', 'quick-actions'],
  [RoleType.ADMISSIONS_COUNSELLOR]: ['admissions-pipeline', 'approvals-queue', 'notification-inbox', 'recent-activity', 'account-summary', 'quick-actions'],
  [RoleType.EXAMINATION_CONTROLLER]: ['result-summary', 'approvals-queue', 'reports-shortcuts', 'notification-inbox', 'recent-activity', 'quick-actions'],
};

export const dashboardKeySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'Dashboard key may contain lowercase letters, numbers and hyphens.');

export const dashboardWidgetPlacementSchema = z.object({
  instanceId: z.string().trim().min(3).max(100).regex(/^[A-Za-z0-9:_-]+$/),
  widgetKey: z.string().trim().min(2).max(100).regex(/^[a-z0-9][a-z0-9-]*$/),
  x: z.number().int().min(0).max(DASHBOARD_GRID_COLUMNS - 1),
  y: z.number().int().min(0).max(500),
  width: z.number().int().min(1).max(DASHBOARD_GRID_COLUMNS),
  height: z.number().int().min(1).max(20),
  settings: z.record(z.unknown()).default({}),
}).strict();

export const createDashboardLayoutSchema = z.object({
  expectedRevision: z.number().int().min(0),
  name: z.string().trim().min(2).max(60),
  dashboardKey: dashboardKeySchema.default('main'),
  copyFromLayoutId: z.string().trim().min(3).max(100).optional(),
  activate: z.boolean().default(true),
}).strict();

export const updateDashboardLayoutSchema = z.object({
  expectedRevision: z.number().int().min(0),
  name: z.string().trim().min(2).max(60).optional(),
  widgets: z.array(dashboardWidgetPlacementSchema).max(MAX_WIDGETS_PER_LAYOUT).optional(),
  activate: z.boolean().optional(),
}).strict().refine(
  (value) => value.name !== undefined || value.widgets !== undefined || value.activate !== undefined,
  'Provide at least one layout change.',
);

export const revisionMutationSchema = z.object({
  expectedRevision: z.number().int().min(0),
}).strict();

export const resetDashboardLayoutSchema = z.object({
  expectedRevision: z.number().int().min(0),
  dashboardKey: dashboardKeySchema.default('main'),
}).strict();

export function widgetCatalogForRole(role: RoleType) {
  return DASHBOARD_WIDGET_CATALOG.filter((widget) => widget.roles === null || widget.roles.includes(role));
}

export function dashboardWidgetForRole(role: RoleType, widgetKey: string) {
  return widgetCatalogForRole(role).find((widget) => widget.key === widgetKey) ?? null;
}

export function buildDefaultWidgetPlacements(role: RoleType): DashboardWidgetPlacement[] {
  const allowed = new Map(widgetCatalogForRole(role).map((widget) => [widget.key, widget]));
  const requested = DEFAULT_WIDGET_KEYS[role] ?? ['account-summary', 'notification-inbox', 'recent-activity', 'quick-actions'];
  const definitions = requested.map((key) => allowed.get(key)).filter((widget): widget is DashboardWidgetDefinition => Boolean(widget));

  let cursorX = 0;
  let cursorY = 0;
  let rowHeight = 0;

  return definitions.map((widget) => {
    if (cursorX + widget.defaultWidth > DASHBOARD_GRID_COLUMNS) {
      cursorX = 0;
      cursorY += rowHeight;
      rowHeight = 0;
    }

    const placement: DashboardWidgetPlacement = {
      instanceId: `default-${widget.key}`,
      widgetKey: widget.key,
      x: cursorX,
      y: cursorY,
      width: widget.defaultWidth,
      height: widget.defaultHeight,
      settings: {},
    };

    cursorX += widget.defaultWidth;
    rowHeight = Math.max(rowHeight, widget.defaultHeight);
    return placement;
  });
}

export function createDefaultDashboardLayout(
  role: RoleType,
  dashboardKey = 'main',
  now = new Date(0),
): SavedDashboardLayout {
  const safeKey = dashboardKeySchema.parse(dashboardKey) as string;
  return {
    id: `default-${role.toLowerCase()}-${safeKey}`,
    name: 'Recommended layout',
    dashboardKey: safeKey,
    source: 'default',
    version: 1,
    widgets: buildDefaultWidgetPlacements(role),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

export function createInitialDashboardLayoutState(role: RoleType): DashboardLayoutState {
  const layout = createDefaultDashboardLayout(role);
  return {
    schemaVersion: DASHBOARD_LAYOUT_SCHEMA_VERSION,
    revision: 0,
    activeLayoutByDashboard: { main: layout.id },
    layouts: [layout],
  };
}

export function validateWidgetPlacements(
  role: RoleType,
  placements: DashboardWidgetPlacement[],
): DashboardWidgetPlacement[] {
  if (placements.length > MAX_WIDGETS_PER_LAYOUT) {
    throw new DashboardLayoutError(
      `A dashboard layout may contain at most ${MAX_WIDGETS_PER_LAYOUT} widgets.`,
      400,
      'WIDGET_LIMIT_EXCEEDED',
    );
  }

  const parsed = placements.map(
    (placement) => dashboardWidgetPlacementSchema.parse(placement) as DashboardWidgetPlacement,
  );
  const instanceIds = new Set<string>();

  for (const placement of parsed) {
    if (instanceIds.has(placement.instanceId)) {
      throw new DashboardLayoutError('Widget instance IDs must be unique.', 400, 'DUPLICATE_WIDGET_INSTANCE');
    }
    instanceIds.add(placement.instanceId);

    const widget = dashboardWidgetForRole(role, placement.widgetKey);
    if (!widget) {
      throw new DashboardLayoutError(
        `Widget ${placement.widgetKey} is not available to this role.`,
        403,
        'WIDGET_NOT_AUTHORISED',
      );
    }

    if (placement.x + placement.width > DASHBOARD_GRID_COLUMNS) {
      throw new DashboardLayoutError('A widget extends beyond the dashboard grid.', 400, 'WIDGET_OUT_OF_BOUNDS');
    }

    if (
      placement.width < widget.minWidth ||
      placement.width > widget.maxWidth ||
      placement.height < widget.minHeight ||
      placement.height > widget.maxHeight
    ) {
      throw new DashboardLayoutError(
        `Widget ${placement.widgetKey} does not satisfy its size limits.`,
        400,
        'INVALID_WIDGET_SIZE',
      );
    }

    const settingsBytes = Buffer.byteLength(JSON.stringify(placement.settings), 'utf8');
    if (settingsBytes > MAX_WIDGET_SETTINGS_BYTES) {
      throw new DashboardLayoutError(
        `Widget settings may not exceed ${MAX_WIDGET_SETTINGS_BYTES} bytes.`,
        400,
        'WIDGET_SETTINGS_TOO_LARGE',
      );
    }
  }

  for (let leftIndex = 0; leftIndex < parsed.length; leftIndex += 1) {
    const left = parsed[leftIndex];
    if (!left) continue;

    for (let rightIndex = leftIndex + 1; rightIndex < parsed.length; rightIndex += 1) {
      const right = parsed[rightIndex];
      if (!right) continue;

      const overlaps =
        left.x < right.x + right.width &&
        left.x + left.width > right.x &&
        left.y < right.y + right.height &&
        left.y + left.height > right.y;

      if (overlaps) {
        throw new DashboardLayoutError(
          `Widgets ${left.instanceId} and ${right.instanceId} overlap.`,
          400,
          'WIDGETS_OVERLAP',
        );
      }
    }
  }

  return parsed.map((placement) => ({
    ...placement,
    settings: JSON.parse(JSON.stringify(placement.settings)) as Record<string, unknown>,
  }));
}

export function createSavedDashboardLayout(input: {
  role: RoleType;
  name: string;
  dashboardKey: string;
  widgets?: DashboardWidgetPlacement[];
  source?: 'default' | 'custom';
  now?: Date;
  id?: string;
}): SavedDashboardLayout {
  const now = input.now ?? new Date();
  const dashboardKey = dashboardKeySchema.parse(input.dashboardKey) as string;
  const widgets = validateWidgetPlacements(
    input.role,
    input.widgets ?? buildDefaultWidgetPlacements(input.role),
  );

  return {
    id: input.id ?? crypto.randomUUID(),
    name: z.string().trim().min(2).max(60).parse(input.name),
    dashboardKey,
    source: input.source ?? 'custom',
    version: 1,
    widgets,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isSavedLayout(value: unknown): value is SavedDashboardLayout {
  if (!isPlainRecord(value)) return false;
  return (
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    typeof value.dashboardKey === 'string' &&
    (value.source === 'default' || value.source === 'custom') &&
    typeof value.version === 'number' &&
    Array.isArray(value.widgets) &&
    typeof value.createdAt === 'string' &&
    typeof value.updatedAt === 'string'
  );
}

export function parseDashboardLayoutState(
  preferences: unknown,
  role: RoleType,
): DashboardLayoutState {
  const root = isPlainRecord(preferences) ? preferences : {};
  const stored = root[DASHBOARD_LAYOUT_STORE_KEY];
  if (!isPlainRecord(stored)) return createInitialDashboardLayoutState(role);

  const revision = Number.isInteger(stored.revision) && Number(stored.revision) >= 0
    ? Number(stored.revision)
    : 0;
  const rawLayouts = Array.isArray(stored.layouts) ? stored.layouts : [];
  const layouts: SavedDashboardLayout[] = [];

  for (const rawLayout of rawLayouts.slice(0, MAX_DASHBOARD_LAYOUTS)) {
    if (!isSavedLayout(rawLayout)) continue;
    try {
      const dashboardKey = dashboardKeySchema.parse(rawLayout.dashboardKey) as string;
      layouts.push({
        id: z.string().trim().min(3).max(100).parse(rawLayout.id),
        name: z.string().trim().min(2).max(60).parse(rawLayout.name),
        dashboardKey,
        source: rawLayout.source,
        version: z.number().int().min(1).parse(rawLayout.version),
        widgets: validateWidgetPlacements(role, rawLayout.widgets),
        createdAt: new Date(rawLayout.createdAt).toISOString(),
        updatedAt: new Date(rawLayout.updatedAt).toISOString(),
      });
    } catch {
      // Invalid, stale or newly unauthorised layouts are ignored rather than trusted.
    }
  }

  if (layouts.length === 0) return createInitialDashboardLayoutState(role);

  const activeLayoutByDashboard: Record<string, string> = {};
  if (isPlainRecord(stored.activeLayoutByDashboard)) {
    for (const [dashboardKey, layoutId] of Object.entries(stored.activeLayoutByDashboard)) {
      if (typeof layoutId !== 'string') continue;
      const matchingLayout = layouts.find(
        (layout) => layout.id === layoutId && layout.dashboardKey === dashboardKey,
      );
      if (matchingLayout) activeLayoutByDashboard[dashboardKey] = matchingLayout.id;
    }
  }

  for (const layout of layouts) {
    activeLayoutByDashboard[layout.dashboardKey] ??= layout.id;
  }

  return {
    schemaVersion: DASHBOARD_LAYOUT_SCHEMA_VERSION,
    revision,
    activeLayoutByDashboard,
    layouts,
  };
}

export function mergeDashboardLayoutStateIntoPreferences(
  preferences: unknown,
  state: DashboardLayoutState,
) {
  const root = isPlainRecord(preferences)
    ? JSON.parse(JSON.stringify(preferences)) as Record<string, unknown>
    : {};

  root[DASHBOARD_LAYOUT_STORE_KEY] = state;
  const serialized = JSON.stringify(root);
  if (Buffer.byteLength(serialized, 'utf8') > MAX_DASHBOARD_PREFERENCES_BYTES) {
    throw new DashboardLayoutError(
      'Saved dashboard preferences exceed the storage limit.',
      400,
      'DASHBOARD_PREFERENCES_TOO_LARGE',
    );
  }

  return JSON.parse(serialized) as Record<string, unknown>;
}

export function publicDashboardLayoutResponse(
  role: RoleType,
  state: DashboardLayoutState,
  dashboardKey = 'main',
) {
  const safeDashboardKey = dashboardKeySchema.parse(dashboardKey) as string;
  const layouts = state.layouts.filter((layout) => layout.dashboardKey === safeDashboardKey);
  const activeLayoutId = state.activeLayoutByDashboard[safeDashboardKey] ?? layouts[0]?.id ?? null;

  return {
    schemaVersion: state.schemaVersion,
    revision: state.revision,
    dashboardKey: safeDashboardKey,
    activeLayoutId,
    activeLayout: layouts.find((layout) => layout.id === activeLayoutId) ?? null,
    layouts,
    catalog: widgetCatalogForRole(role),
    limits: {
      gridColumns: DASHBOARD_GRID_COLUMNS,
      maxLayouts: MAX_DASHBOARD_LAYOUTS,
      maxWidgetsPerLayout: MAX_WIDGETS_PER_LAYOUT,
      maxWidgetSettingsBytes: MAX_WIDGET_SETTINGS_BYTES,
    },
  };
}
