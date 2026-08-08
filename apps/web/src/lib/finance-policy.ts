import 'server-only';

import type { ActiveUserContext } from './active-user-context';

/** Roles that may operate the institution finance workspace. */
export const FINANCE_OPERATOR_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);

/** Roles that may configure fee structures, scholarship programs and policy. */
export const FINANCE_CONFIGURATOR_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER']);

/** Roles that may approve high-value refunds / maker-checker check side. */
export const FINANCE_APPROVER_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER']);

/** Roles that may post offline (cash/cheque/DD) payments. */
export const OFFLINE_PAYMENT_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);

/** Roles that may review scholarship applications. */
export const SCHOLARSHIP_REVIEWER_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);

/** Roles that may create scholarship awards (ledger credits). */
export const SCHOLARSHIP_AWARD_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER']);

/** Roles that may place/resolve financial holds. */
export const FINANCIAL_HOLD_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER']);

/** Roles that may request refunds on behalf of students. */
export const REFUND_REQUESTER_ROLES = new Set(['STUDENT', 'PARENT', 'ACCOUNTANT']);

export function isFinanceOperator(context: ActiveUserContext) {
  return FINANCE_OPERATOR_ROLES.has(context.activeRole);
}

export function isFinanceConfigurator(context: ActiveUserContext) {
  return FINANCE_CONFIGURATOR_ROLES.has(context.activeRole);
}

export function isFinanceApprover(context: ActiveUserContext) {
  return FINANCE_APPROVER_ROLES.has(context.activeRole);
}

export function canPostOfflinePayment(context: ActiveUserContext) {
  return OFFLINE_PAYMENT_ROLES.has(context.activeRole);
}

export function canReviewScholarships(context: ActiveUserContext) {
  return SCHOLARSHIP_REVIEWER_ROLES.has(context.activeRole);
}

export function canAwardScholarships(context: ActiveUserContext) {
  return SCHOLARSHIP_AWARD_ROLES.has(context.activeRole);
}

export function canManageFinancialHolds(context: ActiveUserContext) {
  return FINANCIAL_HOLD_ROLES.has(context.activeRole);
}

/**
 * Maker-checker separation: a refund/complex review cannot be decided by the
 * same account that created the request when the institution requires it.
 */
export function makerCheckerSeparated(context: ActiveUserContext, createdByUserId: string) {
  return context.userId !== createdByUserId;
}

/** Throws a Forbidden error the route handlers can map to 403. */
export function assertFinancePermission(condition: boolean, permission: string) {
  if (!condition) throw new Error(`Forbidden: ${permission} permission required`);
}
