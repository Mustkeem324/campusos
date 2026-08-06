import { RoleType } from '@prisma/client';

const GLOBAL_APPROVERS = new Set<RoleType>([
  RoleType.SUPER_ADMIN,
  RoleType.INSTITUTION_ADMIN,
]);

const ROLE_DOMAINS: Partial<Record<RoleType, readonly string[]>> = {
  REGISTRAR: ['academics', 'records', 'students', 'certificates', 'workflow'],
  DEAN: ['academics', 'departments', 'programs', 'student-success', 'marks'],
  HOD: ['department', 'courses', 'workload', 'marks', 'attendance'],
  FINANCE_OFFICER: ['fees', 'finance', 'invoices', 'payments', 'refunds', 'reports'],
  ACCOUNTANT: ['fees', 'finance', 'invoices', 'payments', 'refunds', 'reports'],
  HR_ADMIN: ['users', 'staff', 'hr', 'leave'],
  WARDEN: ['hostel', 'outpass', 'mess', 'complaints'],
  LIBRARIAN: ['library', 'catalogue', 'circulation', 'fines'],
  TRANSPORT_MANAGER: ['transport', 'routes'],
  PLACEMENT_OFFICER: ['placement', 'career', 'employers'],
  ADMISSIONS_COUNSELLOR: ['admissions', 'applicants', 'programmes'],
  EXAMINATION_CONTROLLER: ['examinations', 'marks', 'results'],
};

export function phase7ApprovalDomainsForRole(role: RoleType): readonly string[] | null {
  return GLOBAL_APPROVERS.has(role) ? null : ROLE_DOMAINS[role] ?? [];
}

export function phase7PermissionDomain(requiredPermission: string) {
  return requiredPermission.trim().toLowerCase().split(':')[0] || '';
}

export function canReviewPhase7Proposal(role: RoleType, requiredPermission: string) {
  const allowedDomains = phase7ApprovalDomainsForRole(role);
  if (allowedDomains === null) return true;
  return allowedDomains.includes(phase7PermissionDomain(requiredPermission));
}

export function isValidPhase7Permission(value: string) {
  return /^[a-z][a-z0-9-]{1,39}:[a-z][a-z0-9_-]{1,39}:(all|institution|department|own_section|own)$/i.test(value.trim());
}
