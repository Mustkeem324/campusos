import 'server-only';

import type { ActiveUserContext } from './active-user-context';

/**
 * NAVEMORA Faculty, HR, Payroll & Workforce 2.0 role gates.
 *
 * Designation is data, never authorization: a profile whose designation says
 * "Dean" or "HOD" receives system permissions only through these server-side
 * role gates. The existing RoleType enum already provides HR_ADMIN as the
 * institution HR authority; HR_MANAGER / HR_EXECUTIVE / PAYROLL_OFFICER-style
 * duties map onto HR_ADMIN (with INSTITUTION_ADMIN, REGISTRAR, HOD and DEAN
 * participating where the institution's policy requires it) so existing
 * deployments keep working without a breaking role migration.
 */

/** Roles that may operate the institution workforce admin console. */
export const WORKFORCE_OPERATOR_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR']);

/** Roles that may configure workforce settings, shifts and leave policies. */
export const WORKFORCE_CONFIGURATOR_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN']);

/** Roles that may create employees, run onboarding and manage the workforce. */
export const WORKFORCE_HR_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN']);

/** Roles with payroll operational access (compensation + payroll runs). */
export const PAYROLL_OPERATOR_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);

/** Roles that may approve payroll runs (maker-checker check side). */
export const PAYROLL_APPROVER_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN']);

/** Roles that may approve leave requests. */
export const LEAVE_APPROVER_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR', 'HOD', 'DEAN']);

/** Roles that may review attendance corrections. */
export const ATTENDANCE_CORRECTION_REVIEWER_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'HOD']);

/** Roles that may review reimbursements. */
export const REIMBURSEMENT_REVIEWER_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'FINANCE_OFFICER']);

/** Roles that may review resignations and clearances. */
export const EXIT_REVIEWER_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR']);

/** Roles that may review recruitment requisitions and offers. */
export const RECRUITMENT_REVIEWER_ROLES = new Set(['HR_ADMIN', 'INSTITUTION_ADMIN', 'REGISTRAR']);

export function isWorkforceOperator(context: ActiveUserContext) {
  return WORKFORCE_OPERATOR_ROLES.has(context.activeRole);
}

export function isWorkforceConfigurator(context: ActiveUserContext) {
  return WORKFORCE_CONFIGURATOR_ROLES.has(context.activeRole);
}

export function isWorkforceHr(context: ActiveUserContext) {
  return WORKFORCE_HR_ROLES.has(context.activeRole);
}

export function canAccessPayroll(context: ActiveUserContext) {
  return PAYROLL_OPERATOR_ROLES.has(context.activeRole);
}

export function canApprovePayroll(context: ActiveUserContext) {
  return PAYROLL_APPROVER_ROLES.has(context.activeRole);
}

export function canApproveLeave(context: ActiveUserContext) {
  return LEAVE_APPROVER_ROLES.has(context.activeRole);
}

export function canReviewAttendanceCorrections(context: ActiveUserContext) {
  return ATTENDANCE_CORRECTION_REVIEWER_ROLES.has(context.activeRole);
}

export function canReviewReimbursements(context: ActiveUserContext) {
  return REIMBURSEMENT_REVIEWER_ROLES.has(context.activeRole);
}

export function canReviewExits(context: ActiveUserContext) {
  return EXIT_REVIEWER_ROLES.has(context.activeRole);
}

export function canReviewRecruitment(context: ActiveUserContext) {
  return RECRUITMENT_REVIEWER_ROLES.has(context.activeRole);
}

/**
 * Maker-checker separation: an approval/review side cannot be the same account
 * that prepared the record when the institution requires separation.
 */
export function makerCheckerSeparated(context: ActiveUserContext, createdByUserId: string) {
  return context.userId !== createdByUserId;
}

/** Throws an error the route handlers can map to 403. */
export function assertWorkforcePermission(condition: boolean, permission: string) {
  if (!condition) throw new Error(`Forbidden: ${permission} permission required`);
}
