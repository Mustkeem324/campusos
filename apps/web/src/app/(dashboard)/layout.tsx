import React from 'react';
import { redirect } from 'next/navigation';

import { Phase6DashboardExperience } from '@/components/dashboard/Phase6DashboardExperience';
import { Phase6SelfImprovement } from '@/components/dashboard/Phase6SelfImprovement';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getPhase6ExperienceData } from '@/lib/dashboard/phase6';
import type { UserSession } from '@/lib/types';

import { AuthProvider } from './AuthProvider';
import DashboardShell from './DashboardShell';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tokenPayload = await getSessionFromCookies();

  if (!tokenPayload) {
    redirect('/login');
  }

  // Fetch only safe account and active-session context for the client profile menu.
  const user = await prisma.user.findFirst({
    where: { id: tokenPayload.userId, tenantId: tokenPayload.tenantId, isActive: true },
    include: {
      institution: true,
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        select: { id: true },
      },
    },
  });

  if (!user) {
    redirect('/login');
  }

  const session: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    institutionName: user.institution.name,
    role: user.role,
    avatarUrl: user.avatarUrl ?? undefined,
    departmentId: undefined,
    phone: user.phone,
    emailVerified: Boolean(user.emailVerified),
    mfaEnabled: user.mfaEnabled,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
    activeSessionCount: user.sessions.length,
  };

  // Phase 6 is an enhancement layer. A role-specific loader failure must not
  // block the underlying reviewed dashboard, so it degrades independently.
  const activeContext = await requireActiveUserContext().catch(() => null);
  const phase6Data = activeContext
    ? await getPhase6ExperienceData(activeContext).catch((error: unknown) => {
        console.error('Phase 6 dashboard experience unavailable:', error);
        return null;
      })
    : null;

  return (
    <AuthProvider initialSession={session}>
      <DashboardShell>
        <Phase6DashboardExperience data={phase6Data} />
        <Phase6SelfImprovement data={phase6Data} />
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
