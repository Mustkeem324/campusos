import 'server-only';

import { randomUUID } from 'node:crypto';
import type { PaymentMethod, Prisma } from '@prisma/client';

import { prisma } from './db';

type AttemptRow = {
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
};

type ManualRow = {
  id: string;
  tenant_id: string;
  payer_user_id: string;
  invoice_ids: unknown;
  amount_minor: bigint | number | string;
  currency: string;
  transaction_reference: string;
  status: string;
  receipt_number: string | null;
};

function dbNumber(value: bigint | number | string) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function makeReceiptNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `COS-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function postConfirmedPayments(
  tx: Prisma.TransactionClient,
  input: {
    tenantId: string;
    invoiceIds: string[];
    amountMinor: number;
    method: PaymentMethod;
    externalReference: string;
  },
) {
  const uniqueInvoiceIds = Array.from(new Set(input.invoiceIds));
  if (uniqueInvoiceIds.length === 0) throw new Error('No invoices are attached to this payment.');

  const invoices = await tx.invoice.findMany({
    where: { tenantId: input.tenantId, id: { in: uniqueInvoiceIds } },
    select: {
      id: true,
      amount: true,
      payments: { where: { status: 'PAID' }, select: { amount: true } },
    },
  });
  if (invoices.length !== uniqueInvoiceIds.length) {
    throw new Error('Invoice allocation changed before payment confirmation.');
  }

  const byId = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const balances = uniqueInvoiceIds.map((invoiceId) => {
    const invoice = byId.get(invoiceId)!;
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return { id: invoice.id, balanceMinor: Math.max(0, Math.round((invoice.amount - paid) * 100)) };
  });
  const totalBalanceMinor = balances.reduce((sum, invoice) => sum + invoice.balanceMinor, 0);
  if (input.amountMinor > totalBalanceMinor + 1) {
    throw new Error('Confirmed payment exceeds the remaining selected invoice balance and needs reconciliation.');
  }

  let remaining = input.amountMinor;
  for (const invoice of balances) {
    if (remaining <= 0 || invoice.balanceMinor <= 0) continue;
    const allocationMinor = Math.min(remaining, invoice.balanceMinor);
    const transactionId = `${input.externalReference}:${invoice.id}`;

    await tx.payment.create({
      data: {
        tenantId: input.tenantId,
        invoiceId: invoice.id,
        amount: allocationMinor / 100,
        method: input.method,
        status: 'PAID',
        transactionId,
        paidAt: new Date(),
      },
    });

    await tx.invoice.update({
      where: { id: invoice.id },
      data: { status: invoice.balanceMinor - allocationMinor <= 1 ? 'PAID' : 'PARTIAL' },
    });
    remaining -= allocationMinor;
  }

  if (remaining > 1) {
    throw new Error('Confirmed payment could not be fully allocated to the selected invoices.');
  }
}

export async function finalizeGatewayPayment(input: {
  attemptId: string;
  externalPaymentReference: string;
  method: Extract<PaymentMethod, 'RAZORPAY' | 'STRIPE'>;
  verifiedAmountMinor: number;
  verifiedCurrency: string;
}) {
  return prisma.$transaction(async (tx) => {
    // Row-level locking serializes provider webhook retries and browser-return
    // confirmation for this attempt without relying on driver-specific lock values.
    const rows = await tx.$queryRaw<AttemptRow[]>`
      SELECT id, tenant_id, payer_user_id, provider, provider_reference,
             invoice_ids, amount_minor, currency, status, receipt_number
      FROM campusos_finance.payment_attempts
      WHERE id = ${input.attemptId}::uuid
      LIMIT 1
      FOR UPDATE
    `;
    const attempt = rows[0];
    if (!attempt) throw new Error('Payment attempt not found.');
    if (attempt.status === 'PAID') return attempt.receipt_number;

    const expectedAmount = dbNumber(attempt.amount_minor);
    if (
      expectedAmount !== input.verifiedAmountMinor ||
      attempt.currency.toUpperCase() !== input.verifiedCurrency.toUpperCase()
    ) {
      await tx.$executeRaw`
        UPDATE campusos_finance.payment_attempts
        SET status = 'RECONCILIATION_REQUIRED',
            failure_reason = 'Gateway amount or currency did not match the CampusOS attempt.',
            external_payment_reference = ${input.externalPaymentReference}, updated_at = now()
        WHERE id = ${attempt.id}::uuid
      `;
      throw new Error('Gateway amount or currency does not match the CampusOS payment attempt.');
    }

    const receiptNumber = makeReceiptNumber();
    try {
      await postConfirmedPayments(tx, {
        tenantId: attempt.tenant_id,
        invoiceIds: parseStringArray(attempt.invoice_ids),
        amountMinor: expectedAmount,
        method: input.method,
        externalReference: input.externalPaymentReference,
      });
    } catch (error) {
      await tx.$executeRaw`
        UPDATE campusos_finance.payment_attempts
        SET status = 'RECONCILIATION_REQUIRED',
            failure_reason = ${error instanceof Error ? error.message.slice(0, 500) : 'Payment allocation failed.'},
            external_payment_reference = ${input.externalPaymentReference}, updated_at = now()
        WHERE id = ${attempt.id}::uuid
      `;
      throw error;
    }

    await tx.$executeRaw`
      UPDATE campusos_finance.payment_attempts
      SET status = 'PAID', receipt_number = ${receiptNumber},
          external_payment_reference = ${input.externalPaymentReference},
          failure_reason = NULL, updated_at = now()
      WHERE id = ${attempt.id}::uuid
    `;
    return receiptNumber;
  }, { timeout: 15_000 });
}

export async function approveManualPaymentSubmission(input: {
  submissionId: string;
  reviewerUserId: string;
}) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<ManualRow[]>`
      SELECT id, tenant_id, payer_user_id, invoice_ids, amount_minor, currency,
             transaction_reference, status, receipt_number
      FROM campusos_finance.manual_payment_submissions
      WHERE id = ${input.submissionId}::uuid
      LIMIT 1
      FOR UPDATE
    `;
    const submission = rows[0];
    if (!submission) throw new Error('Manual payment submission not found.');
    if (submission.status === 'APPROVED') return submission.receipt_number;
    if (!['PENDING', 'RECONCILIATION_REQUIRED'].includes(submission.status)) {
      throw new Error('This transfer submission has already been closed.');
    }

    const receiptNumber = makeReceiptNumber();
    try {
      await postConfirmedPayments(tx, {
        tenantId: submission.tenant_id,
        invoiceIds: parseStringArray(submission.invoice_ids),
        amountMinor: dbNumber(submission.amount_minor),
        method: 'NETBANKING',
        externalReference: submission.transaction_reference,
      });
    } catch (error) {
      await tx.$executeRaw`
        UPDATE campusos_finance.manual_payment_submissions
        SET status = 'RECONCILIATION_REQUIRED', reviewer_user_id = ${input.reviewerUserId}::uuid,
            review_note = ${error instanceof Error ? error.message.slice(0, 500) : 'Payment allocation failed.'},
            reviewed_at = now(), updated_at = now()
        WHERE id = ${submission.id}::uuid
      `;
      throw error;
    }

    await tx.$executeRaw`
      UPDATE campusos_finance.manual_payment_submissions
      SET status = 'APPROVED', receipt_number = ${receiptNumber},
          reviewer_user_id = ${input.reviewerUserId}::uuid,
          review_note = 'Verified by institution finance.',
          reviewed_at = now(), updated_at = now()
      WHERE id = ${submission.id}::uuid
    `;
    return receiptNumber;
  }, { timeout: 15_000 });
}
