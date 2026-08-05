import React from 'react';
import { redirect } from 'next/navigation';

import { Phase6DashboardExperience } from '@/components/dashboard/Phase6DashboardExperience';
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

  // Fetch full user and tenant context to populate the client session store.
  const user = await prisma.user.findUnique({
    where: { id: tokenPayload.userId },
    include: { institution: true },
  });

  if (!user || !user.isActive) {
    redirect('/login');
  }

  const session: UserSession = {
    id: user.id,
    email: user.email,
    name: user.name,
    tenantId: user.tenantId,
    institutionName: user.institution.name,
    role: user.role,
    avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    departmentId: undefined,
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
        {children}
      </DashboardShell>
    </AuthProvider>
  );
}
