import React from 'react';
import DashboardShell from './DashboardShell';
import { getSessionFromCookies } from '../../lib/auth';
import { redirect } from 'next/navigation';
import { AuthProvider } from './AuthProvider';
import { prisma } from '../../lib/db';
import { UserSession } from '../../lib/types';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tokenPayload = await getSessionFromCookies();

  if (!tokenPayload) {
    redirect('/login');
  }

  // Fetch full user and tenant context to populate the store
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

  return (
    <AuthProvider initialSession={session}>
      <DashboardShell>{children}</DashboardShell>
    </AuthProvider>
  );
}
