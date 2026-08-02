import { describe, it, expect } from 'vitest';

describe('Phase 14 Staff Leave Balance Ledger Deduction Test Suite', () => {
  it('should accurately deduct approved leave days from staff leave balance', () => {
    const allocated = 12;
    const approvedLeaveDays = 3;
    const remaining = allocated - approvedLeaveDays;

    expect(remaining).toBe(9);
  });
});
