import { describe, it, expect } from 'vitest';
import { calculateSaaSMonthlyInvoice } from '../lib/saas-billing-service';

describe('Phase 18 Per-Student SaaS Usage Metering Pricing Test Suite', () => {
  it('should compute monthly invoice based on active student count and storage overage', () => {
    // 1000 students on STARTER ($1/student) = $1,000 base
    // 60 GB storage (50 GB included, 10 GB extra @ $0.50) = $5.00 overage
    // Total = $1,005
    const invoice = calculateSaaSMonthlyInvoice(1000, 'STARTER', 60, 50);

    expect(invoice.basePrice).toBe(1000);
    expect(invoice.storageOverage).toBe(5);
    expect(invoice.totalMonthly).toBe(1005);
  });
});
