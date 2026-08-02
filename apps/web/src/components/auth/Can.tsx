'use client';

import React from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { can } from '../../lib/permissions';
import { PermissionAction, PermissionScope } from '../../lib/types';

interface CanProps {
  resource: string;
  action: PermissionAction;
  scope?: PermissionScope;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function Can({ resource, action, scope = 'own', fallback = null, children }: CanProps) {
  const { currentSession } = useAuthStore();
  const hasPermission = can(currentSession.role, resource, action, scope);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
