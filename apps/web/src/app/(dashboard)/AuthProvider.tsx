'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { UserSession } from '../../lib/types';

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: UserSession;
}) {
  const setSession = useAuthStore((state) => state.setSession);

  // React renders must stay pure. Synchronize the server-resolved session only
  // after commit so subscribers (including login surfaces) are never updated
  // while AuthProvider is rendering.
  useEffect(() => {
    setSession(initialSession);
  }, [initialSession, setSession]);

  return <>{children}</>;
}
