import { describe, it, expect } from 'vitest';
import { processPaymentWebhookIdempotent } from '../lib/finance-engine';
import crypto from 'crypto';

describe('Phase 5 Payment Webhook Idempotency Test Suite', () => {
  it('should process first payment webhook and safely ignore duplicate retries', () => {
    const txId = `tx_test_unique_999`;
    const amount = 1800;
    const webhookSecret = 'whsec_campusos_secret_123';
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${txId}:${amount}`)
      .digest('hex');

    const payload = {
      transactionId: txId,
      invoiceId: 'inv_btech_101',
      studentId: 'usr_student_01',
      amount,
      paymentMethod: 'UPI' as const,
      signature,
    };

    // First Webhook Processing
    const res1 = processPaymentWebhookIdempotent(payload);
    expect(res1.success).toBe(true);
    expect(res1.isDuplicate).toBe(false);
    expect(res1.receiptNumber).toBeDefined();

    // Duplicate Webhook Retry Attempt
    const res2 = processPaymentWebhookIdempotent(payload);
    expect(res2.success).toBe(true);
    expect(res2.isDuplicate).toBe(true); // Duplicate flag set!
    expect(res2.message).toContain('already processed idempotently');
  });
});
