import { describe, it, expect } from 'vitest';
import { calculateLibraryFine } from '../lib/campus-life-service';

describe('Phase 6 Library Fine Auto-Calculator Test Suite', () => {
  it('should calculate $1 per day overdue fine accurately', () => {
    const dueDateStr = '2026-01-20';
    const returnDate = new Date('2026-01-25'); // 5 days late

    const fine = calculateLibraryFine(dueDateStr, returnDate, 1.0);
    expect(fine).toBe(5.0);
  });

  it('should return zero fine when returned on or before due date', () => {
    const dueDateStr = '2026-01-20';
    const returnDate = new Date('2026-01-18'); // 2 days early

    const fine = calculateLibraryFine(dueDateStr, returnDate, 1.0);
    expect(fine).toBe(0.0);
  });
});
