import 'server-only';

import { prisma } from './db';

export type PaymentAttemptLookup = {
  id: string;
  tenant_id: string;
  payer_user_id: string;
  provider: string;
  provider_reference: string;
  invoice_ids: unknown;
  amount_minor: bigint | number | string;
  currency: string;
  status: string;
  receipt_number: string | null;
  external_payment_reference: string | null;
  failure_reason: string | null;
  created_at: Date;
};

export async function findPaymentAttemptByReference(input: {
  provider: 'RAZORPAY' | 'STRIPE';
  reference: string;
  tenantId: string;
}) {
  const rows = await prisma.$queryRaw<PaymentAttemptLookup[]>`
    SELECT id, tenant_id, payer_user_id, provider, provider_reference,
           invoice_ids, amount_minor, currency, status, receipt_number,
           external_payment_reference, failure_reason, created_at
    FROM campusos_finance.payment_attempts
    WHERE provider = ${input.provider}
      AND provider_reference = ${input.reference}
      AND tenant_id = ${input.tenantId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}
