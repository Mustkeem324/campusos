import { UserRole, ROLE_PERMISSIONS, PermissionAction, PermissionScope } from './types';

export function can(
  role: UserRole,
  resource: string,
  action: PermissionAction,
  scope: PermissionScope = 'own'
): boolean {
  const grantedPermissions = ROLE_PERMISSIONS[role] || [];

  // Super Admin bypass
  if (grantedPermissions.includes('*:manage:all')) {
    return true;
  }

  const targetPerm = `${resource}:${action}:${scope}`;
  const targetWildcardAction = `${resource}:manage:${scope}`;
  const targetWildcardResource = `*:${action}:${scope}`;

  return grantedPermissions.some(
    (perm) =>
      perm === targetPerm ||
      perm === targetWildcardAction ||
      perm === targetWildcardResource ||
      perm === `${resource}:${action}:institution` ||
      perm === `${resource}:manage:institution`
  );
}
