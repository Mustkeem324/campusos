import { RoleType } from '@prisma/client';

export type Permission =
  | 'view_dashboard'
  | 'manage_users'
  | 'manage_roles'
  | 'view_academic_records'
  | 'edit_academic_records'
  | 'manage_finance'
  | 'view_finance'
  | 'manage_hostel'
  | 'view_hostel'
  | 'manage_library'
  | 'view_library'
  | 'manage_transport'
  | 'platform_admin'
  | 'impersonate_user';

export const ROLE_PERMISSIONS: Record<RoleType, Permission[]> = {
  SUPER_ADMIN: [
    'platform_admin', 'view_dashboard', 'manage_users', 'manage_roles',
    'view_academic_records', 'edit_academic_records',
    'manage_finance', 'view_finance',
    'manage_hostel', 'view_hostel',
    'manage_library', 'view_library',
    'manage_transport', 'impersonate_user',
  ],
  INSTITUTION_ADMIN: [
    'view_dashboard', 'manage_users', 'manage_roles',
    'view_academic_records', 'edit_academic_records',
    'manage_finance', 'view_finance',
    'manage_hostel', 'view_hostel',
    'manage_library', 'view_library',
    'manage_transport', 'impersonate_user',
  ],
  REGISTRAR: [
    'view_dashboard', 'manage_users', 'view_academic_records', 'edit_academic_records',
  ],
  DEAN: [
    'view_dashboard', 'view_academic_records', 'edit_academic_records',
  ],
  HOD: [
    'view_dashboard', 'view_academic_records', 'edit_academic_records',
  ],
  FACULTY: [
    'view_dashboard', 'view_academic_records', 'edit_academic_records',
  ],
  STUDENT: [
    'view_dashboard', 'view_academic_records', 'view_finance', 'view_hostel', 'view_library',
  ],
  PARENT: [
    'view_dashboard', 'view_academic_records', 'view_finance',
  ],
  FINANCE_OFFICER: [
    'view_dashboard', 'manage_finance', 'view_finance',
  ],
  ACCOUNTANT: [
    'view_dashboard', 'manage_finance', 'view_finance',
  ],
  HR_ADMIN: [
    'view_dashboard', 'manage_users',
  ],
  WARDEN: [
    'view_dashboard', 'manage_hostel', 'view_hostel',
  ],
  LIBRARIAN: [
    'view_dashboard', 'manage_library', 'view_library',
  ],
  TRANSPORT_MANAGER: [
    'view_dashboard', 'manage_transport',
  ],
  PLACEMENT_OFFICER: [
    'view_dashboard',
  ],
  ADMISSIONS_COUNSELLOR: [
    'view_dashboard',
  ],
  EXAMINATION_CONTROLLER: [
    'view_dashboard', 'view_academic_records', 'edit_academic_records',
  ],
};

/**
 * Validates if a user role has the required permission.
 */
export function hasPermission(role: RoleType, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * Guard function to wrap Server Actions or API routes.
 * Throws an error if the user lacks the permission.
 */
export function requirePermission(role: RoleType, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: Role ${role} lacks permission ${permission}`);
  }
}
