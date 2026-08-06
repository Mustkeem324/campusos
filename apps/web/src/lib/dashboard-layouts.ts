import { Prisma } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import {
  MAX_DASHBOARD_LAYOUTS,
  DashboardLayoutError,
  type DashboardLayoutState,
  type DashboardWidgetPlacement,
  type SavedDashboardLayout,
  createDefaultDashboardLayout,
  createSavedDashboardLayout,
  mergeDashboardLayoutStateIntoPreferences,
  parseDashboardLayoutState,
  publicDashboardLayoutResponse,
  validateWidgetPlacements,
} from './dashboard-layout-policy';

export type DashboardLayoutMutationMetadata = {
  operation:
    | 'CREATE_LAYOUT'
    | 'UPDATE_LAYOUT'
    | 'DELETE_LAYOUT'
    | 'ACTIVATE_LAYOUT'
    | 'RESET_LAYOUTS';
  layoutId?: string;
  dashboardKey: string;
  ipAddress?: string | null;
};

type DashboardUserSnapshot = {
  preferences: Prisma.JsonValue | null;
  updatedAt: Date;
};

function cloneState(state: DashboardLayoutState): DashboardLayoutState {
  return JSON.parse(JSON.stringify(state)) as DashboardLayoutState;
}

async function loadUserSnapshot(
  context: Pick<ActiveUserContext, 'userId' | 'tenantId'>,
): Promise<DashboardUserSnapshot> {
  const user = await prisma.user.findFirst({
    where: {
      id: context.userId,
      tenantId: context.tenantId,
      isActive: true,
    },
    select: {
      preferences: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new DashboardLayoutError('The active account could not be resolved.', 401, 'ACCOUNT_UNAVAILABLE');
  }

  return user;
}

export async function loadDashboardLayouts(
  context: ActiveUserContext,
  dashboardKey = 'main',
) {
  const user = await loadUserSnapshot(context);
  const state = parseDashboardLayoutState(user.preferences, context.activeRole);
  return publicDashboardLayoutResponse(context.activeRole, state, dashboardKey);
}

async function persistDashboardLayoutMutation(
  context: ActiveUserContext,
  expectedRevision: number,
  metadata: DashboardLayoutMutationMetadata,
  mutate: (state: DashboardLayoutState, now: Date) => DashboardLayoutState,
) {
  return prisma.$transaction(async (transaction) => {
    const user = await transaction.user.findFirst({
      where: {
        id: context.userId,
        tenantId: context.tenantId,
        isActive: true,
      },
      select: {
        preferences: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new DashboardLayoutError('The active account could not be resolved.', 401, 'ACCOUNT_UNAVAILABLE');
    }

    const current = parseDashboardLayoutState(user.preferences, context.activeRole);
    if (current.revision !== expectedRevision) {
      throw new DashboardLayoutError(
        'The dashboard layout changed in another session. Reload it before saving.',
        409,
        'DASHBOARD_LAYOUT_REVISION_CONFLICT',
      );
    }

    const now = new Date();
    const next = mutate(cloneState(current), now);
    next.schemaVersion = 1;
    next.revision = current.revision + 1;

    const preferences = mergeDashboardLayoutStateIntoPreferences(
      user.preferences,
      next,
    ) as Prisma.InputJsonValue;

    const updateResult = await transaction.user.updateMany({
      where: {
        id: context.userId,
        tenantId: context.tenantId,
        updatedAt: user.updatedAt,
      },
      data: {
        preferences,
        updatedAt: now,
      },
    });

    if (updateResult.count !== 1) {
      throw new DashboardLayoutError(
        'The dashboard layout changed in another session. Reload it before saving.',
        409,
        'DASHBOARD_LAYOUT_REVISION_CONFLICT',
      );
    }

    await transaction.auditLog.create({
      data: {
        tenantId: context.tenantId,
        userId: context.userId,
        action: `PHASE8B_${metadata.operation}`,
        entity: 'DashboardLayout',
        diffJson: JSON.stringify({
          dashboardKey: metadata.dashboardKey,
          layoutId: metadata.layoutId ?? null,
          previousRevision: current.revision,
          revision: next.revision,
        }),
        ipAddress: metadata.ipAddress ?? null,
      },
    });

    return next;
  });
}

export async function createDashboardLayout(
  context: ActiveUserContext,
  input: {
    expectedRevision: number;
    name: string;
    dashboardKey: string;
    copyFromLayoutId?: string;
    activate: boolean;
  },
  ipAddress?: string | null,
) {
  const metadata: DashboardLayoutMutationMetadata = {
    operation: 'CREATE_LAYOUT',
    dashboardKey: input.dashboardKey,
    ipAddress,
  };

  const state = await persistDashboardLayoutMutation(
    context,
    input.expectedRevision,
    metadata,
    (current, now) => {
      if (current.layouts.length >= MAX_DASHBOARD_LAYOUTS) {
        throw new DashboardLayoutError(
          `An account may save at most ${MAX_DASHBOARD_LAYOUTS} dashboard layouts.`,
          409,
          'DASHBOARD_LAYOUT_LIMIT_REACHED',
        );
      }

      const copiedLayout = input.copyFromLayoutId
        ? current.layouts.find(
            (layout) =>
              layout.id === input.copyFromLayoutId &&
              layout.dashboardKey === input.dashboardKey,
          )
        : null;

      if (input.copyFromLayoutId && !copiedLayout) {
        throw new DashboardLayoutError('The source layout was not found.', 404, 'LAYOUT_NOT_FOUND');
      }

      const layout = createSavedDashboardLayout({
        role: context.activeRole,
        name: input.name,
        dashboardKey: input.dashboardKey,
        widgets: copiedLayout?.widgets,
        source: 'custom',
        now,
      });
      metadata.layoutId = layout.id;
      current.layouts.push(layout);
      if (input.activate) current.activeLayoutByDashboard[input.dashboardKey] = layout.id;
      return current;
    },
  );

  return {
    createdLayoutId: metadata.layoutId,
    ...publicDashboardLayoutResponse(context.activeRole, state, input.dashboardKey),
  };
}

export async function updateDashboardLayout(
  context: ActiveUserContext,
  layoutId: string,
  input: {
    expectedRevision: number;
    name?: string;
    widgets?: DashboardWidgetPlacement[];
    activate?: boolean;
  },
  ipAddress?: string | null,
) {
  const metadata: DashboardLayoutMutationMetadata = {
    operation: 'UPDATE_LAYOUT',
    layoutId,
    dashboardKey: 'main',
    ipAddress,
  };

  const state = await persistDashboardLayoutMutation(
    context,
    input.expectedRevision,
    metadata,
    (current, now) => {
      const layoutIndex = current.layouts.findIndex((layout) => layout.id === layoutId);
      const layout = current.layouts[layoutIndex];
      if (!layout) {
        throw new DashboardLayoutError('The dashboard layout was not found.', 404, 'LAYOUT_NOT_FOUND');
      }
      metadata.dashboardKey = layout.dashboardKey;

      const updated: SavedDashboardLayout = {
        ...layout,
        name: input.name ?? layout.name,
        widgets: input.widgets
          ? validateWidgetPlacements(context.activeRole, input.widgets)
          : layout.widgets,
        source: layout.source === 'default' ? 'custom' : layout.source,
        version: layout.version + 1,
        updatedAt: now.toISOString(),
      };

      current.layouts[layoutIndex] = updated;
      if (input.activate) current.activeLayoutByDashboard[layout.dashboardKey] = layoutId;
      return current;
    },
  );

  return publicDashboardLayoutResponse(context.activeRole, state, metadata.dashboardKey);
}

export async function deleteDashboardLayout(
  context: ActiveUserContext,
  layoutId: string,
  expectedRevision: number,
  ipAddress?: string | null,
) {
  const metadata: DashboardLayoutMutationMetadata = {
    operation: 'DELETE_LAYOUT',
    layoutId,
    dashboardKey: 'main',
    ipAddress,
  };

  const state = await persistDashboardLayoutMutation(
    context,
    expectedRevision,
    metadata,
    (current, now) => {
      const layout = current.layouts.find((candidate) => candidate.id === layoutId);
      if (!layout) {
        throw new DashboardLayoutError('The dashboard layout was not found.', 404, 'LAYOUT_NOT_FOUND');
      }
      metadata.dashboardKey = layout.dashboardKey;
      current.layouts = current.layouts.filter((candidate) => candidate.id !== layoutId);

      const remainingForDashboard = current.layouts.filter(
        (candidate) => candidate.dashboardKey === layout.dashboardKey,
      );

      if (remainingForDashboard.length === 0) {
        const replacement = createDefaultDashboardLayout(
          context.activeRole,
          layout.dashboardKey,
          now,
        );
        current.layouts.push(replacement);
        current.activeLayoutByDashboard[layout.dashboardKey] = replacement.id;
      } else if (current.activeLayoutByDashboard[layout.dashboardKey] === layoutId) {
        current.activeLayoutByDashboard[layout.dashboardKey] = remainingForDashboard[0]!.id;
      }

      return current;
    },
  );

  return publicDashboardLayoutResponse(context.activeRole, state, metadata.dashboardKey);
}

export async function activateDashboardLayout(
  context: ActiveUserContext,
  layoutId: string,
  expectedRevision: number,
  ipAddress?: string | null,
) {
  const metadata: DashboardLayoutMutationMetadata = {
    operation: 'ACTIVATE_LAYOUT',
    layoutId,
    dashboardKey: 'main',
    ipAddress,
  };

  const state = await persistDashboardLayoutMutation(
    context,
    expectedRevision,
    metadata,
    (current) => {
      const layout = current.layouts.find((candidate) => candidate.id === layoutId);
      if (!layout) {
        throw new DashboardLayoutError('The dashboard layout was not found.', 404, 'LAYOUT_NOT_FOUND');
      }
      metadata.dashboardKey = layout.dashboardKey;
      current.activeLayoutByDashboard[layout.dashboardKey] = layout.id;
      return current;
    },
  );

  return publicDashboardLayoutResponse(context.activeRole, state, metadata.dashboardKey);
}

export async function resetDashboardLayouts(
  context: ActiveUserContext,
  input: { expectedRevision: number; dashboardKey: string },
  ipAddress?: string | null,
) {
  const state = await persistDashboardLayoutMutation(
    context,
    input.expectedRevision,
    {
      operation: 'RESET_LAYOUTS',
      dashboardKey: input.dashboardKey,
      ipAddress,
    },
    (current, now) => {
      const replacement = createDefaultDashboardLayout(
        context.activeRole,
        input.dashboardKey,
        now,
      );
      current.layouts = current.layouts.filter(
        (layout) => layout.dashboardKey !== input.dashboardKey,
      );
      current.layouts.push(replacement);
      current.activeLayoutByDashboard[input.dashboardKey] = replacement.id;
      return current;
    },
  );

  return publicDashboardLayoutResponse(context.activeRole, state, input.dashboardKey);
}
