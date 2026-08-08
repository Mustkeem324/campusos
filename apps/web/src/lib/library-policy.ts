import 'server-only';

import type { ActiveUserContext } from './active-user-context';

/**
 * NAVEMORA Library, Digital Resources & Research Management 2.0 role gates.
 *
 * The core RoleType enum exposes LIBRARIAN as the institution library
 * authority. LIBRARY_ASSISTANT-style routine circulation duties map onto
 * LIBRARIAN (with INSTITUTION_ADMIN, REGISTRAR, DEAN and HOD participating
 * where the institution's policy requires it) so existing deployments keep
 * working without a breaking role migration. Designation is data, never
 * authorization.
 */

/** Roles that may operate the institution library admin console. */
export const LIBRARY_OPERATOR_ROLES = new Set(['LIBRARIAN', 'INSTITUTION_ADMIN', 'REGISTRAR']);

/** Roles that may configure library settings, policies and catalogs. */
export const LIBRARY_CONFIGURATOR_ROLES = new Set(['LIBRARIAN', 'INSTITUTION_ADMIN']);

/** Roles that may issue, return, renew and manage reservations (circulation). */
export const LIBRARY_CIRCULATION_ROLES = new Set(['LIBRARIAN', 'INSTITUTION_ADMIN']);

/** Roles that may waive fines / approve lost-damage charges (high-impact). */
export const LIBRARY_FINE_AUTHORITY_ROLES = new Set(['LIBRARIAN', 'INSTITUTION_ADMIN']);

/** Roles that may review acquisitions. */
export const LIBRARY_ACQUISITION_REVIEWER_ROLES = new Set(['LIBRARIAN', 'INSTITUTION_ADMIN', 'HOD', 'DEAN']);

/** Roles that may request acquisitions. */
export const LIBRARY_ACQUISITION_REQUESTER_ROLES = new Set(['LIBRARIAN', 'INSTITUTION_ADMIN', 'FACULTY', 'HOD', 'DEAN']);

/** Roles that may create reading lists for courses. */
export const LIBRARY_READING_LIST_ROLES = new Set(['FACULTY', 'LIBRARIAN', 'INSTITUTION_ADMIN', 'HOD']);

/** Roles that may borrow physical/digital resources. */
export const LIBRARY_BORROWER_ROLES = new Set(['STUDENT', 'FACULTY']);

export function isLibraryOperator(context: ActiveUserContext) {
  return LIBRARY_OPERATOR_ROLES.has(context.activeRole);
}

export function isLibraryConfigurator(context: ActiveUserContext) {
  return LIBRARY_CONFIGURATOR_ROLES.has(context.activeRole);
}

export function canCirculate(context: ActiveUserContext) {
  return LIBRARY_CIRCULATION_ROLES.has(context.activeRole);
}

export function canAuthorizeLibraryFine(context: ActiveUserContext) {
  return LIBRARY_FINE_AUTHORITY_ROLES.has(context.activeRole);
}

export function canReviewAcquisitions(context: ActiveUserContext) {
  return LIBRARY_ACQUISITION_REVIEWER_ROLES.has(context.activeRole);
}

export function canRequestAcquisitions(context: ActiveUserContext) {
  return LIBRARY_ACQUISITION_REQUESTER_ROLES.has(context.activeRole);
}

export function canManageReadingLists(context: ActiveUserContext) {
  return LIBRARY_READING_LIST_ROLES.has(context.activeRole);
}

export function isLibraryBorrower(context: ActiveUserContext) {
  return LIBRARY_BORROWER_ROLES.has(context.activeRole);
}

/** Throws an error the route handlers can map to 403. */
export function assertLibraryPermission(condition: boolean, permission: string) {
  if (!condition) throw new Error(`Forbidden: ${permission} permission required`);
}
