import { describe, expect, it } from 'vitest';
import { RoleType } from '@prisma/client';

import {
  calculateLibraryFineAmount,
  isLibraryBorrower,
  isLibraryManager,
} from '../lib/library-workspace';

describe('Hybrid library policy helpers', () => {
  it('limits collection management to librarian and platform/institution administrators', () => {
    expect(isLibraryManager(RoleType.LIBRARIAN)).toBe(true);
    expect(isLibraryManager(RoleType.INSTITUTION_ADMIN)).toBe(true);
    expect(isLibraryManager(RoleType.SUPER_ADMIN)).toBe(true);
    expect(isLibraryManager(RoleType.STUDENT)).toBe(false);
    expect(isLibraryManager(RoleType.FACULTY)).toBe(false);
  });

  it('allows students and faculty to borrow but not unrelated operational roles', () => {
    expect(isLibraryBorrower(RoleType.STUDENT)).toBe(true);
    expect(isLibraryBorrower(RoleType.FACULTY)).toBe(true);
    expect(isLibraryBorrower(RoleType.LIBRARIAN)).toBe(false);
    expect(isLibraryBorrower(RoleType.FINANCE_OFFICER)).toBe(false);
  });

  it('does not invent a late fine when the institution fine policy is zero', () => {
    const returned = new Date('2026-08-08T00:00:00.000Z');
    expect(calculateLibraryFineAmount('2026-08-01T00:00:00.000Z', returned, { finePerDay: 0 })).toBe(0);
  });

  it('charges the configured daily amount for each started overdue day', () => {
    const returned = new Date('2026-08-04T06:00:00.000Z');
    expect(calculateLibraryFineAmount('2026-08-01T12:00:00.000Z', returned, { finePerDay: 5 })).toBe(15);
  });

  it('does not charge a fine when a physical item is returned on time', () => {
    const returned = new Date('2026-08-01T11:59:00.000Z');
    expect(calculateLibraryFineAmount('2026-08-01T12:00:00.000Z', returned, { finePerDay: 5 })).toBe(0);
  });
});
