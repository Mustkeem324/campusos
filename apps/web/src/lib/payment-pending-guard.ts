import 'server-only';

import { prisma } from './db';

type PendingInvoiceRow = {
  invoice_ids: unknown;
};

function parseInvoiceIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function assertNoPendingManualTransfer(input: {
  tenantId: string;
  payerUserId: string;
  invoiceIds: string[];
}) {
  const requested = new Set(input.invoiceIds);
  if (requested.size === 0) return;

  try {
    const rows = await prisma.$queryRaw<PendingInvoiceRow[]>`
      SELECT invoice_ids
      FROM campusos_finance.manual_payment_submissions
      WHERE tenant_id = ${input.tenantId}::uuid
        AND payer_user_id = ${input.payerUserId}::uuid
        AND status IN ('PENDING', 'RECONCILIATION_REQUIRED')
    `;

    const overlap = rows.some((row) => parseInvoiceIds(row.invoice_ids).some((invoiceId) => requested.has(invoiceId)));
    if (overlap) {
      throw new Error('A direct bank transfer for one or more selected invoices is already under institution verification. Wait for that review before starting another payment.');
    }
  } catch (error) {
    // Missing orchestration storage is a deployment/configuration error; do not
    // silently bypass the duplicate-payment guard when the payment system is expected.
    if (error instanceof Error && /already under institution verification/.test(error.message)) throw error;
    console.error('Pending manual-payment guard unavailable:', error);
    throw new Error('Payment verification storage is unavailable. Try again after the institution payment service is restored.');
  }
}
