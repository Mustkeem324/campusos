'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { UserRole } from '@/lib/types';

export function RoleDashboardGuard({ role, children }: { role: UserRole | UserRole[]; children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const roleKey = (Array.isArray(role) ? role : [role]).join('|');

  useEffect(() => {
    let active = true;
    const permittedRoles = roleKey.split('|') as UserRole[];
    void fetch('/api/auth/active-context', { cache: 'no-store' })
      .then(async (response) => ({ response, payload: await response.json() as { role?: UserRole; dashboardPath?: string } }))
      .then(({ response, payload }) => {
        if (!active) return;
        if (response.ok && payload.role && permittedRoles.includes(payload.role)) setAllowed(true);
        else router.replace(payload.dashboardPath || '/login');
      })
      .catch(() => router.replace('/login'));
    return () => { active = false; };
  }, [roleKey, router]);

  if (!allowed) return <div className="p-8 text-center text-sm font-semibold text-text-secondary" aria-busy="true">Loading authorized workspace…</div>;
  return <>{children}</>;
}
