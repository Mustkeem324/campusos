'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { UserSession } from '../../lib/types';

export function AuthProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: UserSession;
}) {
  const initialized = useRef(false);

  // Initialize store synchronously on first render
  if (!initialized.current) {
    useAuthStore.getState().setSession(initialSession);
    initialized.current = true;
  }

  // Effect to handle subsequent updates if needed
  useEffect(() => {
    useAuthStore.getState().setSession(initialSession);
  }, [initialSession]);

  return <>{children}</>;
}
