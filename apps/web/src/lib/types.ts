import { z } from 'zod';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'INSTITUTION_ADMIN'
  | 'HOD'
  | 'FACULTY'
  | 'STUDENT'
  | 'PARENT'
  | 'WARDEN'
  | 'ACCOUNTANT';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  institutionName: string;
  role: UserRole;
  avatarUrl?: string;
  departmentId?: string;
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

export const ROLE_PERMISSIONS: Record<UserRole, PermissionString[]> = {
  SUPER_ADMIN: ['*:manage:all'],
  INSTITUTION_ADMIN: [
    'users:manage:institution',
    'academics:manage:institution',
    'courses:manage:institution',
    'fees:manage:institution',
    'attendance:read:institution',
    'audit:read:institution',
    'notices:manage:institution'
  ],
  HOD: [
    'department:manage:department',
    'courses:manage:department',
    'workload:manage:department',
    'attendance:read:department',
    'marks:approve:department',
    'notices:create:department'
  ],
  FACULTY: [
    'attendance:mark:own_section',
    'attendance:read:own_section',
    'courses:read:department',
    'assignments:manage:own_section',
    'grades:manage:own_section',
    'marks:submit:own_section',
    'notices:create:department'
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
    'certificates:request:own'
  ],
  PARENT: [
    'attendance:read:own',
    'grades:read:own',
    'fees:pay:own',
    'notices:read:institution',
    'hostel:approve_outpass:own'
  ],
  WARDEN: [
    'hostel:manage:institution',
    'outpass:approve:institution',
    'mess:manage:institution',
    'complaints:manage:institution'
  ],
  ACCOUNTANT: [
    'fees:manage:institution',
    'invoices:create:institution',
    'payments:manage:institution',
    'reports:read:institution'
  ]
};

export const UserSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(2),
  role: z.enum([
    'SUPER_ADMIN',
    'INSTITUTION_ADMIN',
    'HOD',
    'FACULTY',
    'STUDENT',
    'PARENT',
    'WARDEN',
    'ACCOUNTANT'
  ]),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date()
});
