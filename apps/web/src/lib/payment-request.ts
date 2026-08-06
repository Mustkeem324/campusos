import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';

const PAYER_ROLES = new Set(['STUDENT', 'PARENT']);
const ACTIVE_ATTEMPT_STATUSES = new Set(['CREATING', 'CREATED', 'RECONCILIATION_REQUIRED']);
const ACTIVE_MANUAL_STATUSES = new Set(['PENDING', 'RECONCILIATION_REQUIRED']);

export class PaymentRequestError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'PaymentRequestError';
  }
}

type InvoiceLockRow = { id: string };
type PendingInvoiceRow = { invoice_ids: unknown; status: string };

type ManualSubmissionInput = {
  transactionReference: string;
  bankName: string | null;
  transferDate: Date;
  payerNote: string | null;
  proofFileName: string;
  proofMimeType: string;
  proofBytes: Buffer;
  currency: string;
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

function normalizeInvoiceIds(invoiceIds: string[]) {
  const unique = Array.from(new Set(invoiceIds.filter(Boolean))).sort();
  if (unique.length < 1 || unique.length > 20) {
    throw new PaymentRequestError('Select between 1 and 20 invoices.', 400);
  }
  for (const id of unique) {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      throw new PaymentRequestError('One or more selected invoice identifiers are invalid.', 400);
    }
  }
  return unique;
}

async function authorisedStudentIds(tx: Prisma.TransactionClient, context: ActiveUserContext) {
  if (!PAYER_ROLES.has(context.activeRole)) {
    throw new PaymentRequestError('This account is not allowed to initiate fee payments.', 403);
  }

  if (context.activeRole === 'STUDENT') {
    const student = await tx.student.findFirst({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { id: true },
    });
    if (!student) throw new PaymentRequestError('No authorised student profile is available for payment.', 403);
    return [student.id];
  }

  const guardian = await tx.guardian.findFirst({
    where: { tenantId: context.tenantId, userId: context.userId },
    select: { students: { select: { id: true } } },
  });
  const ids = guardian?.students.map((student) => student.id) ?? [];
  if (ids.length === 0) throw new PaymentRequestError('No authorised linked student is available for payment.', 403);
  return ids;
}

async function lockInvoices(tx: Prisma.TransactionClient, tenantId: string, invoiceIds: string[]) {
  const ids = invoiceIds.map((id) => Prisma.sql`${id}::uuid`);
  const rows = await tx.$queryRaw<InvoiceLockRow[]>(Prisma.sql`
    SELECT id
    FROM public.invoices
    WHERE tenant_id = ${tenantId}::uuid
      AND id IN (${Prisma.join(ids)})
    ORDER BY id
    FOR UPDATE
  `);
  if (rows.length !== invoiceIds.length) {
    throw new PaymentRequestError('One or more selected invoices are unavailable.', 400);
  }
}

async function resolveLockedBalances(
  tx: Prisma.TransactionClient,
  context: ActiveUserContext,
  invoiceIds: string[],
) {
  const studentIds = await authorisedStudentIds(tx, context);
  await lockInvoices(tx, context.tenantId, invoiceIds);

  const invoices = await tx.invoice.findMany({
    where: {
      tenantId: context.tenantId,
      id: { in: invoiceIds },
      studentId: { in: studentIds },
    },
    select: {
      id: true,
      amount: true,
      payments: { where: { status: 'PAID' }, select: { amount: true } },
    },
  });
  if (invoices.length !== invoiceIds.length) {
    throw new PaymentRequestError('One or more selected invoices are not authorised for this account.', 403);
  }

  const byId = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const resolved = invoiceIds.map((invoiceId) => {
    const invoice = byId.get(invoiceId)!;
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return {
      id: invoice.id,
      balanceMinor: Math.max(0, Math.round((invoice.amount - paid) * 100)),
    };
  }).filter((invoice) => invoice.balanceMinor > 0);

  if (resolved.length !== invoiceIds.length) {
    throw new PaymentRequestError('One or more selected invoices no longer have an outstanding balance.', 409);
  }

  return {
    invoices: resolved,
    totalMinor: resolved.reduce((sum, invoice) => sum + invoice.balanceMinor, 0),
  };
}

async function assertNoInFlightPayment(
  tx: Prisma.TransactionClient,
  context: ActiveUserContext,
  invoiceIds: string[],
) {
  const requested = new Set(invoiceIds);

  const [manualRows, gatewayRows] = await Promise.all([
    tx.$queryRaw<PendingInvoiceRow[]>`
      SELECT invoice_ids, status
      FROM campusos_finance.manual_payment_submissions
      WHERE tenant_id = ${context.tenantId}::uuid
        AND payer_user_id = ${context.userId}::uuid
        AND status IN ('PENDING', 'RECONCILIATION_REQUIRED')
    `,
    tx.$queryRaw<PendingInvoiceRow[]>`
      SELECT invoice_ids, status
      FROM campusos_finance.payment_attempts
      WHERE tenant_id = ${context.tenantId}::uuid
        AND payer_user_id = ${context.userId}::uuid
        AND status IN ('CREATING', 'CREATED', 'RECONCILIATION_REQUIRED')
    `,
  ]);

  const manualOverlap = manualRows.some((row) =>
    ACTIVE_MANUAL_STATUSES.has(row.status) && parseInvoiceIds(row.invoice_ids).some((id) => requested.has(id)),
  );
  if (manualOverlap) {
    throw new PaymentRequestError(
      'A direct bank transfer for one or more selected invoices is already under institution verification.',
      409,
    );
  }

  const gatewayOverlap = gatewayRows.some((row) =>
    ACTIVE_ATTEMPT_STATUSES.has(row.status) && parseInvoiceIds(row.invoice_ids).some((id) => requested.has(id)),
  );
  if (gatewayOverlap) {
    throw new PaymentRequestError(
      'A provider payment for one or more selected invoices is already in progress or requires reconciliation. Refresh the payment page instead of starting another charge.',
      409,
    );
  }
}

export async function reserveGatewayPayment(input: {
  context: ActiveUserContext;
  provider: 'RAZORPAY' | 'STRIPE';
  invoiceIds: string[];
  currency: string;
}) {
  const invoiceIds = normalizeInvoiceIds(input.invoiceIds);
  return prisma.$transaction(async (tx) => {
    const payable = await resolveLockedBalances(tx, input.context, invoiceIds);
    await assertNoInFlightPayment(tx, input.context, invoiceIds);

    const attemptId = randomUUID();
    await tx.$executeRaw`
      INSERT INTO campusos_finance.payment_attempts
        (id, tenant_id, payer_user_id, provider, provider_reference,
         invoice_ids, amount_minor, currency, status, created_at, updated_at)
      VALUES
        (${attemptId}::uuid, ${input.context.tenantId}::uuid, ${input.context.userId}::uuid,
         ${input.provider}, ${`pending:${attemptId}`}, CAST(${JSON.stringify(invoiceIds)} AS jsonb),
         ${payable.totalMinor}, ${input.currency}, 'CREATING', now(), now())
    `;

    return { ...payable, attemptId };
  }, { timeout: 15_000 });
}

export async function createManualPaymentSubmission(input: {
  context: ActiveUserContext;
  invoiceIds: string[];
  submission: ManualSubmissionInput;
}) {
  const invoiceIds = normalizeInvoiceIds(input.invoiceIds);
  return prisma.$transaction(async (tx) => {
    const payable = await resolveLockedBalances(tx, input.context, invoiceIds);
    await assertNoInFlightPayment(tx, input.context, invoiceIds);

    const id = randomUUID();
    await tx.$executeRaw`
      INSERT INTO campusos_finance.manual_payment_submissions
        (id, tenant_id, payer_user_id, invoice_ids, amount_minor, currency,
         transaction_reference, bank_name, transfer_date, payer_note,
         proof_file_name, proof_mime_type, proof_bytes, status, created_at, updated_at)
      VALUES
        (${id}::uuid, ${input.context.tenantId}::uuid, ${input.context.userId}::uuid,
         CAST(${JSON.stringify(invoiceIds)} AS jsonb), ${payable.totalMinor}, ${input.submission.currency},
         ${input.submission.transactionReference}, ${input.submission.bankName}, ${input.submission.transferDate},
         ${input.submission.payerNote}, ${input.submission.proofFileName}, ${input.submission.proofMimeType},
         ${input.submission.proofBytes}, 'PENDING', now(), now())
    `;
    return { id, totalMinor: payable.totalMinor, invoiceIds };
  }, { timeout: 15_000 });
}
