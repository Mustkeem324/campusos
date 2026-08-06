import { AiActionStatus } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { canApprovePhase7 } from './phase7';

export type AccountSidebarActivity = {
  id: string;
  label: string;
  entity: string;
  createdAt: string;
};

export type AccountSidebarOverview = {
  account: {
    name: string;
    email: string;
    role: string;
    institution: string;
    emailVerified: boolean;
    mfaEnabled: boolean;
    lastLoginAt: string | null;
    activeSessions: number;
  };
  counters: {
    unreadNotifications: number;
    pendingApprovals: number;
    openSupportCases: number;
    activeSessions: number;
  };
  recentActivity: AccountSidebarActivity[];
  refreshedAt: string;
};

export function accountSidebarProposalScope(context: Pick<ActiveUserContext, 'tenantId' | 'userId' | 'activeRole'>) {
  return canApprovePhase7(context.activeRole)
    ? { tenantId: context.tenantId }
    : { tenantId: context.tenantId, userId: context.userId };
}

export function formatAccountActivity(action: string) {
  return action
    .replace(/^PHASE\d+_/, '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export async function loadAccountSidebarOverview(
  context: ActiveUserContext,
): Promise<AccountSidebarOverview> {
  const now = new Date();
  const proposalScope = accountSidebarProposalScope(context);

  const [user, unreadNotifications, pendingApprovals, openSupportCases, recentActivity] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: context.userId,
        tenantId: context.tenantId,
        isActive: true,
      },
      select: {
        name: true,
        email: true,
        role: true,
        emailVerified: true,
        mfaEnabled: true,
        lastLoginAt: true,
        institution: { select: { name: true } },
        sessions: {
          where: { expiresAt: { gt: now } },
          select: { id: true },
        },
      },
    }),
    prisma.notification.count({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        isRead: false,
        isArchived: false,
      },
    }),
    prisma.aiActionProposal.count({
      where: {
        ...proposalScope,
        status: AiActionStatus.PROPOSED,
      },
    }),
    prisma.supportCase.count({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
        status: { in: ['NEW', 'ACKNOWLEDGED', 'INVESTIGATING'] },
      },
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: context.tenantId,
        userId: context.userId,
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error('The active account could not be resolved.');
  }

  return {
    account: {
      name: user.name,
      email: user.email,
      role: user.role,
      institution: user.institution.name,
      emailVerified: Boolean(user.emailVerified),
      mfaEnabled: user.mfaEnabled,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      activeSessions: user.sessions.length,
    },
    counters: {
      unreadNotifications,
      pendingApprovals,
      openSupportCases,
      activeSessions: user.sessions.length,
    },
    recentActivity: recentActivity.map((activity) => ({
      id: activity.id,
      label: formatAccountActivity(activity.action),
      entity: activity.entity,
      createdAt: activity.createdAt.toISOString(),
    })),
    refreshedAt: now.toISOString(),
  };
}
