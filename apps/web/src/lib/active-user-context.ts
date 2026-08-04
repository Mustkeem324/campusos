import { RoleType } from '@prisma/client';
import { getSessionFromCookies } from './auth';
import { prisma } from './db';
import { ROLE_PERMISSIONS, type PermissionString } from './types';

export type ActiveUserContext = {
  userId: string;
  tenantId: string;
  activeRole: RoleType;
  roleAssignmentId: string;
  departmentId?: string;
  staffProfileId?: string;
  studentProfileId?: string;
  guardianProfileId?: string;
  permissions: PermissionString[];
};

/**
 * The sole source of dashboard identity. Browser state and JWT claims are not
 * trusted on their own: the session, user tenant, and persisted role must agree.
 */
export async function requireActiveUserContext(): Promise<ActiveUserContext> {
  const session = await getSessionFromCookies();
  if (!session) throw new Error('Unauthorized: no valid session');

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { roleAssignments: { include: { role: true } } },
  });
  if (!user || !user.isActive || user.tenantId !== session.tenantId || user.role !== session.role) {
    throw new Error('Unauthorized: active session context does not match the account');
  }

  // Older tenants use User.role as the persisted assignment. Where normalized
  // assignments exist, ensure one also matches the active role.
  const normalizedAssignment = user.roleAssignments.find((assignment) => assignment.role.name === user.role);
  if (user.roleAssignments.length > 0 && !normalizedAssignment) {
    throw new Error('Unauthorized: active role is not assigned to this account');
  }

  const context: ActiveUserContext = {
    userId: user.id,
    tenantId: user.tenantId,
    activeRole: user.role,
    roleAssignmentId: normalizedAssignment?.id ?? user.id,
    permissions: ROLE_PERMISSIONS[user.role] ?? [],
  };

  if (user.role === 'FACULTY') {
    const staff = await prisma.staff.findFirst({ where: { userId: user.id, tenantId: user.tenantId }, select: { id: true, departmentId: true } });
    if (!staff) throw new Error('Profile unresolved: Your faculty profile or teaching assignments could not be resolved.');
    context.staffProfileId = staff.id;
    context.departmentId = staff.departmentId ?? undefined;
  }
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findFirst({ where: { userId: user.id, tenantId: user.tenantId }, select: { id: true } });
    if (!student) throw new Error('Profile unresolved: Your student profile could not be resolved.');
    context.studentProfileId = student.id;
  }
  if (user.role === 'PARENT') {
    const guardian = await prisma.guardian.findFirst({ where: { userId: user.id, tenantId: user.tenantId }, select: { id: true } });
    if (!guardian) throw new Error('Profile unresolved: No linked student is currently available for this guardian account.');
    context.guardianProfileId = guardian.id;
  }
  return context;
}

export function dashboardPathForRole(role: RoleType) {
  if (role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN') return '/dashboard/admin';
  if (role === 'FACULTY') return '/dashboard/faculty';
  if (role === 'STUDENT') return '/dashboard/student';
  if (role === 'PARENT') return '/dashboard/parent';
  return '/dashboard';
}
