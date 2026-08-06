import { RoleType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { accountSidebarProposalScope, formatAccountActivity } from './account-sidebar';

describe('Phase 8 sidebar account helpers', () => {
  it('shows institution approval work to authorised approvers', () => {
    expect(
      accountSidebarProposalScope({
        tenantId: 'tenant-1',
        userId: 'user-1',
        activeRole: RoleType.INSTITUTION_ADMIN,
      }),
    ).toEqual({ tenantId: 'tenant-1' });
  });

  it('limits non-approvers to their own submitted proposals', () => {
    expect(
      accountSidebarProposalScope({
        tenantId: 'tenant-1',
        userId: 'student-1',
        activeRole: RoleType.STUDENT,
      }),
    ).toEqual({ tenantId: 'tenant-1', userId: 'student-1' });
  });

  it('formats audit actions without exposing raw internal naming', () => {
    expect(formatAccountActivity('PHASE7_STUDENT_SUCCESS_SCAN')).toBe('Student Success Scan');
    expect(formatAccountActivity('PASSWORD_CHANGED')).toBe('Password Changed');
  });
});
