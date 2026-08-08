import 'server-only';

import type { ActiveUserContext } from './active-user-context';

/**
 * NAVEMORA Library, Digital Resources & Research Management 2.0 research role
 * gates.
 *
 * The core RoleType enum has no RESEARCH_COORDINATOR role, so research
 * coordination duties map onto HOD / DEAN / REGISTRAR / INSTITUTION_ADMIN —
 * the roles the institution already assigns to academic scheduling oversight.
 * A user's project role (PI / supervisor / student researcher) never grants
 * broad institution permissions by itself; project-scoped access is resolved
 * separately in the engine from project_members / project_supervisors rows.
 */

/** Roles that may operate the institution research admin console. */
export const RESEARCH_OPERATOR_ROLES = new Set(['HOD', 'DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN']);

/** Roles that may configure research settings and committees. */
export const RESEARCH_CONFIGURATOR_ROLES = new Set(['INSTITUTION_ADMIN', 'REGISTRAR', 'DEAN']);

/** Roles that may approve proposals / theses / repository publication. */
export const RESEARCH_APPROVER_ROLES = new Set(['HOD', 'DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN']);

/** Roles that may assign supervisors and project teams. */
export const RESEARCH_SUPERVISOR_ASSIGNER_ROLES = new Set(['HOD', 'DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN']);

/** Roles that may serve as reviewers / evaluators of research records. */
export const RESEARCH_REVIEWER_ROLES = new Set(['FACULTY', 'HOD', 'DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN']);

/** Roles that may run similarity review outcomes. */
export const RESEARCH_SIMILARITY_REVIEWER_ROLES = new Set(['FACULTY', 'HOD', 'DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN']);

/** Roles that may submit research projects and proposals. */
export const RESEARCH_CONTRIBUTOR_ROLES = new Set(['FACULTY', 'STUDENT', 'HOD', 'DEAN', 'REGISTRAR', 'INSTITUTION_ADMIN']);

export function isResearchOperator(context: ActiveUserContext) {
  return RESEARCH_OPERATOR_ROLES.has(context.activeRole);
}

export function isResearchConfigurator(context: ActiveUserContext) {
  return RESEARCH_CONFIGURATOR_ROLES.has(context.activeRole);
}

export function canApproveResearch(context: ActiveUserContext) {
  return RESEARCH_APPROVER_ROLES.has(context.activeRole);
}

export function canAssignSupervisors(context: ActiveUserContext) {
  return RESEARCH_SUPERVISOR_ASSIGNER_ROLES.has(context.activeRole);
}

export function canReviewResearch(context: ActiveUserContext) {
  return RESEARCH_REVIEWER_ROLES.has(context.activeRole);
}

export function canReviewSimilarity(context: ActiveUserContext) {
  return RESEARCH_SIMILARITY_REVIEWER_ROLES.has(context.activeRole);
}

export function canContributeResearch(context: ActiveUserContext) {
  return RESEARCH_CONTRIBUTOR_ROLES.has(context.activeRole);
}

/** Throws an error the route handlers can map to 403. */
export function assertResearchPermission(condition: boolean, permission: string) {
  if (!condition) throw new Error(`Forbidden: ${permission} permission required`);
}
