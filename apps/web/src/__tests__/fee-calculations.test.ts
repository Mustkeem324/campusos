import { describe, it, expect } from 'vitest';
import { calculateInvoiceTotals } from '../lib/finance-engine';

describe('Phase 5 Fee Calculation & Late Fee Slab Test Suite', () => {
  it('should apply scholarship discount and calculate late fee after due date', () => {
    const subtotal = 2000;
    const scholarshipPct = 10; // 10% scholarship = $200 discount
    const dueDateStr = '2026-02-01';
    const currentDate = new Date('2026-02-06'); // 5 days late!
    const lateFeePerDay = 10; // $10/day = $50 late fee

    const res = calculateInvoiceTotals(subtotal, scholarshipPct, dueDateStr, currentDate, lateFeePerDay);

    expect(res.scholarshipDiscount).toBe(200);
    expect(res.lateFeeAmount).toBe(50);
    expect(res.totalDue).toBe(1850); // 2000 - 200 + 50 = 1850
  });
});
