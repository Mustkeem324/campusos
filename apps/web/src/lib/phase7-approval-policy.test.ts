import { RoleType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import {
  canReviewPhase7Proposal,
  isValidPhase7Permission,
  phase7PermissionDomain,
} from './phase7-approval-policy';

describe('Phase 7 approval policy', () => {
  it('limits operational roles to their approval domain', () => {
    expect(canReviewPhase7Proposal(RoleType.LIBRARIAN, 'library:approve:institution')).toBe(true);
    expect(canReviewPhase7Proposal(RoleType.LIBRARIAN, 'finance:approve:institution')).toBe(false);
    expect(canReviewPhase7Proposal(RoleType.ACCOUNTANT, 'refunds:approve:institution')).toBe(true);
    expect(canReviewPhase7Proposal(RoleType.ACCOUNTANT, 'marks:approve:department')).toBe(false);
  });

  it('allows platform and institution administrators to review all domains', () => {
    expect(canReviewPhase7Proposal(RoleType.SUPER_ADMIN, 'finance:approve:institution')).toBe(true);
    expect(canReviewPhase7Proposal(RoleType.INSTITUTION_ADMIN, 'library:approve:institution')).toBe(true);
  });

  it('validates permission shape and extracts the domain', () => {
    expect(isValidPhase7Permission('finance:approve:institution')).toBe(true);
    expect(isValidPhase7Permission('not a permission')).toBe(false);
    expect(phase7PermissionDomain('Library:Approve:Institution')).toBe('library');
  });
});
