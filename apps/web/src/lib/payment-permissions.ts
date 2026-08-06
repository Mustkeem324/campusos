import 'server-only';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';

const PAYMENT_REVIEW_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);
const PAYMENT_SETTINGS_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER']);

export function canReviewInstitutionPayments(context: ActiveUserContext) {
  return PAYMENT_REVIEW_ROLES.has(context.activeRole);
}

export function canManageInstitutionPaymentSettings(context: ActiveUserContext) {
  return PAYMENT_SETTINGS_ROLES.has(context.activeRole);
}

export async function requirePaymentSettingsManager() {
  const context = await requireActiveUserContext();
  if (!canManageInstitutionPaymentSettings(context)) {
    throw new Error('Forbidden: institution payment setup access required');
  }
  return context;
}
