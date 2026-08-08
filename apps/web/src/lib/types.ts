import { z } from 'zod';

import { RoleType } from '@prisma/client';

export type UserRole = RoleType;

export interface UserSession {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  institutionName: string;
  role: UserRole;
  avatarUrl?: string;
  departmentId?: string;
  phone?: string | null;
  emailVerified?: boolean;
  mfaEnabled?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
  activeSessionCount?: number;
}

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'mark'
  | 'submit'
  | 'approve'
  | 'pay'
  | 'register'
  | 'request'
  | 'approve_outpass';

export type PermissionScope = 'all' | 'institution' | 'department' | 'own_section' | 'own';

export type PermissionString = `${string}:${PermissionAction}:${PermissionScope}`;

/**
 * Granular product permissions used by dashboard/API capability checks.
 * Keep this exhaustive across RoleType so a newly supported role cannot silently
 * become permission-less simply because it was omitted from a Partial record.
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionString[]> = {
  SUPER_ADMIN: ['*:manage:all'],
  INSTITUTION_ADMIN: [
    'users:manage:institution',
    'academics:manage:institution',
    'courses:manage:institution',
    'fees:manage:institution',
    'attendance:read:institution',
    'audit:read:institution',
    'notices:manage:institution',
    'reports:read:institution',
  ],
  REGISTRAR: [
    'users:read:institution',
    'academics:manage:institution',
    'courses:read:institution',
    'attendance:read:institution',
    'grades:read:institution',
    'reports:read:institution',
    'notices:manage:institution',
  ],
  DEAN: [
    'academics:read:institution',
    'courses:read:institution',
    'attendance:read:institution',
    'grades:read:institution',
    'marks:approve:institution',
    'reports:read:institution',
    'notices:create:institution',
  ],
  HOD: [
    'department:manage:department',
    'courses:manage:department',
    'workload:manage:department',
    'attendance:read:department',
    'marks:approve:department',
    'notices:create:department',
  ],
  FACULTY: [
    'attendance:mark:own_section',
    'attendance:read:own_section',
    'courses:read:department',
    'assignments:manage:own_section',
    'grades:manage:own_section',
    'marks:submit:own_section',
    'notices:create:department',
  ],
  STUDENT: [
    'courses:read:institution',
    'courses:register:own',
    'attendance:read:own',
    'assignments:submit:own',
    'grades:read:own',
    'fees:pay:own',
    'notices:read:institution',
    'hostel:read:own',
    'certificates:request:own',
  ],
  PARENT: [
    'attendance:read:own',
    'grades:read:own',
    'fees:pay:own',
    'notices:read:institution',
    'hostel:approve_outpass:own',
  ],
  FINANCE_OFFICER: [
    'fees:manage:institution',
    'invoices:manage:institution',
    'payments:manage:institution',
    'reports:read:institution',
  ],
  ACCOUNTANT: [
    'fees:manage:institution',
    'invoices:create:institution',
    'payments:manage:institution',
    'reports:read:institution',
  ],
  HR_ADMIN: [
    'users:manage:institution',
    'staff:manage:institution',
    'reports:read:institution',
  ],
  WARDEN: [
    'hostel:manage:institution',
    'outpass:approve:institution',
    'mess:manage:institution',
    'complaints:manage:institution',
  ],
  LIBRARIAN: [
    'library:manage:institution',
    'books:manage:institution',
    'loans:manage:institution',
    'reports:read:institution',
  ],
  TRANSPORT_MANAGER: [
    'transport:manage:institution',
    'vehicles:manage:institution',
    'routes:manage:institution',
    'reports:read:institution',
  ],
  PLACEMENT_OFFICER: [
    'placements:manage:institution',
    'applications:read:institution',
    'students:read:institution',
    'reports:read:institution',
  ],
  ADMISSIONS_COUNSELLOR: [
    'admissions:manage:institution',
    'applications:manage:institution',
    'students:read:institution',
    'notices:create:institution',
  ],
  EXAMINATION_CONTROLLER: [
    'exams:manage:institution',
    'marks:approve:institution',
    'grades:manage:institution',
    'academics:read:institution',
    'reports:read:institution',
  ],
};

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.nativeEnum(RoleType),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});
