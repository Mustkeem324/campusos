import 'server-only';

import { randomUUID } from 'node:crypto';
import type { PaymentMethod } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { getTenantDb, prisma } from './db';
import type {
  ManualPaymentReviewItem,
  PaymentPortalData,
  PaymentPortalInvoice,
  PaymentPortalSettings,
  PaymentPortalTransaction,
} from './payment-portal-types';

const FINANCE_OPERATOR_ROLES = new Set(['INSTITUTION_ADMIN', 'FINANCE_OFFICER', 'ACCOUNTANT']);
const PAYER_ROLES = new Set(['STUDENT', 'PARENT']);

type PaymentSettingsRow = {
  razorpay_enabled: boolean;
  stripe_enabled: boolean;
  bank_transfer_enabled: boolean;
  currency: string;
  account_name: string | null;
  bank_name: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  branch_name: string | null;
  upi_id: string | null;
  payment_instructions: string | null;
};

type ManualSubmissionRow = {
  id: string;
  tenant_id: string;
  payer_user_id: string;
  invoice_ids: unknown;
  amount_minor: bigint | number | string;
  currency: string;
  transaction_reference: string;
  bank_name: string | null;
  transfer_date: Date;
  payer_note: string | null;
  proof_file_name: string;
  proof_mime_type: string;
  status: string;
  receipt_number: string | null;
  review_note: string | null;
  created_at: Date;
};

type ManualReviewRow = ManualSubmissionRow & {
  payer_name: string;
  payer_email: string;
};

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
  external_payment_reference: string | null;
  failure_reason: string | null;
  created_at: Date;
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

function gatewayAvailability() {
  return {
    razorpay: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY),
  };
}

function emptySettings(): PaymentPortalSettings {
  return {
    razorpayEnabled: false,
    stripeEnabled: false,
    bankTransferEnabled: false,
    currency: 'INR',
    accountName: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    upiId: '',
    paymentInstructions: '',
    gatewayAvailability: gatewayAvailability(),
  };
}

export async function getPaymentSettings(tenantId: string): Promise<PaymentPortalSettings> {
  try {
    const rows = await prisma.$queryRaw<PaymentSettingsRow[]>`
      SELECT razorpay_enabled, stripe_enabled, bank_transfer_enabled, currency,
             account_name, bank_name, account_number, ifsc_code, branch_name,
             upi_id, payment_instructions
      FROM campusos_finance.payment_settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return emptySettings();
    return {
      razorpayEnabled: row.razorpay_enabled,
      stripeEnabled: row.stripe_enabled,
      bankTransferEnabled: row.bank_transfer_enabled,
      currency: row.currency || 'INR',
      accountName: row.account_name ?? '',
      bankName: row.bank_name ?? '',
      accountNumber: row.account_number ?? '',
      ifscCode: row.ifsc_code ?? '',
      branchName: row.branch_name ?? '',
      upiId: row.upi_id ?? '',
      paymentInstructions: row.payment_instructions ?? '',
      gatewayAvailability: gatewayAvailability(),
    };
  } catch (error) {
    console.error('Payment settings storage unavailable:', error);
    return emptySettings();
  }
}

export function isFinancePaymentOperator(context: ActiveUserContext) {
  return FINANCE_OPERATOR_ROLES.has(context.activeRole);
}

export async function requireFinancePaymentOperator() {
  const context = await requireActiveUserContext();
  if (!isFinancePaymentOperator(context)) {
    throw new Error('Forbidden: finance payment operator access required');
  }
  return context;
}

async function payerStudentIds(context: ActiveUserContext) {
  if (context.activeRole === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { id: true },
    });
    return student ? [student.id] : [];
  }

  if (context.activeRole === 'PARENT') {
    const guardian = await prisma.guardian.findFirst({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { students: { select: { id: true } } },
    });
    return guardian?.students.map((student) => student.id) ?? [];
  }

  return [];
}

async function readManualSubmissionsForPayer(context: ActiveUserContext) {
  try {
    return await prisma.$queryRaw<ManualSubmissionRow[]>`
      SELECT id, tenant_id, payer_user_id, invoice_ids, amount_minor, currency,
             transaction_reference, bank_name, transfer_date, payer_note,
             proof_file_name, proof_mime_type, status, receipt_number,
             review_note, created_at
      FROM campusos_finance.manual_payment_submissions
      WHERE tenant_id = ${context.tenantId}::uuid
        AND payer_user_id = ${context.userId}::uuid
      ORDER BY created_at DESC
      LIMIT 80
    `;
  } catch (error) {
    console.error('Manual payment submissions unavailable:', error);
    return [] as ManualSubmissionRow[];
  }
}

async function readReviewQueue(tenantId: string): Promise<ManualPaymentReviewItem[]> {
  try {
    const rows = await prisma.$queryRaw<ManualReviewRow[]>`
      SELECT submission.id, submission.tenant_id, submission.payer_user_id,
             submission.invoice_ids, submission.amount_minor, submission.currency,
             submission.transaction_reference, submission.bank_name,
             submission.transfer_date, submission.payer_note,
             submission.proof_file_name, submission.proof_mime_type,
             submission.status, submission.receipt_number,
             submission.review_note, submission.created_at,
             payer.name AS payer_name, payer.email AS payer_email
      FROM campusos_finance.manual_payment_submissions submission
      JOIN public.users payer ON payer.id = submission.payer_user_id
      WHERE submission.tenant_id = ${tenantId}::uuid
        AND submission.status IN ('PENDING', 'RECONCILIATION_REQUIRED')
      ORDER BY submission.created_at ASC
      LIMIT 100
    `;

    return rows.map((row) => ({
      id: row.id,
      payerUserId: row.payer_user_id,
      payerName: row.payer_name,
      payerEmail: row.payer_email,
      invoiceIds: parseStringArray(row.invoice_ids),
      amount: dbNumber(row.amount_minor) / 100,
      currency: row.currency,
      transactionReference: row.transaction_reference,
      bankName: row.bank_name,
      transferDate: row.transfer_date.toISOString(),
      payerNote: row.payer_note,
      proofFileName: row.proof_file_name,
      proofMimeType: row.proof_mime_type,
      status: row.status,
      createdAt: row.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Manual payment review queue unavailable:', error);
    return [];
  }
}

async function readAttemptsForPayer(context: ActiveUserContext) {
  try {
    return await prisma.$queryRaw<AttemptRow[]>`
      SELECT id, tenant_id, payer_user_id, provider, provider_reference,
             invoice_ids, amount_minor, currency, status, receipt_number,
             external_payment_reference, failure_reason, created_at
      FROM campusos_finance.payment_attempts
      WHERE tenant_id = ${context.tenantId}::uuid
        AND payer_user_id = ${context.userId}::uuid
      ORDER BY created_at DESC
      LIMIT 40
    `;
  } catch (error) {
    console.error('Payment attempt history unavailable:', error);
    return [] as AttemptRow[];
  }
}

function invoiceDisplayStatus(input: {
  dbStatus: string;
  dueDate: Date;
  balance: number;
  pendingVerification: boolean;
}) {
  if (input.balance <= 0.005 || input.dbStatus === 'PAID') return 'PAID' as const;
  if (input.pendingVerification) return 'VERIFICATION_PENDING' as const;
  if (input.dueDate.getTime() < Date.now()) return 'OVERDUE' as const;
  const sevenDays = Date.now() + 7 * 86_400_000;
  return input.dueDate.getTime() > sevenDays ? 'UPCOMING' as const : 'DUE' as const;
}

export async function getPaymentPortalData(): Promise<PaymentPortalData> {
  const context = await requireActiveUserContext();
  const db = getTenantDb(context.tenantId);
  const [institution, payer, settings] = await Promise.all([
    prisma.institution.findUnique({
      where: { id: context.tenantId },
      select: { id: true, name: true, subdomain: true },
    }),
    prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId, isActive: true },
      select: { id: true, name: true, email: true },
    }),
    getPaymentSettings(context.tenantId),
  ]);

  if (!institution || !payer) throw new Error('Unable to resolve payment workspace identity.');

  const canPay = PAYER_ROLES.has(context.activeRole);
  const canReviewManualTransfers = isFinancePaymentOperator(context);
  const canManagePaymentSettings = isFinancePaymentOperator(context);
  const studentIds = canPay ? await payerStudentIds(context) : [];
  const manualRows = canPay ? await readManualSubmissionsForPayer(context) : [];
  const pendingInvoiceIds = new Set(
    manualRows
      .filter((row) => ['PENDING', 'RECONCILIATION_REQUIRED'].includes(row.status))
      .flatMap((row) => parseStringArray(row.invoice_ids)),
  );

  let invoices: PaymentPortalInvoice[] = [];
  let paymentTransactions: PaymentPortalTransaction[] = [];

  if (canPay && studentIds.length > 0) {
    const invoiceRows = await db.invoice.findMany({
      where: { studentId: { in: studentIds } },
      orderBy: { dueDate: 'asc' },
      select: {
        id: true,
        amount: true,
        dueDate: true,
        status: true,
        feeStructure: { select: { name: true } },
        student: {
          select: {
            id: true,
            rollNumber: true,
            user: { select: { name: true } },
          },
        },
        payments: {
          where: { status: 'PAID' },
          select: { amount: true },
        },
      },
    });

    invoices = invoiceRows.map((invoice) => {
      const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
      const balance = Math.max(0, invoice.amount - paid);
      return {
        id: invoice.id,
        invoiceNo: `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
        studentId: invoice.student.id,
        studentName: invoice.student.user.name,
        rollNumber: invoice.student.rollNumber,
        description: invoice.feeStructure.name,
        dueDate: invoice.dueDate.toISOString(),
        amount: invoice.amount,
        paid,
        balance,
        status: invoiceDisplayStatus({
          dbStatus: invoice.status,
          dueDate: invoice.dueDate,
          balance,
          pendingVerification: pendingInvoiceIds.has(invoice.id),
        }),
      };
    });

    const payments = await db.payment.findMany({
      where: { invoice: { studentId: { in: studentIds } } },
      orderBy: { paidAt: 'desc' },
      take: 60,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        transactionId: true,
        paidAt: true,
        invoice: {
          select: {
            id: true,
            feeStructure: { select: { name: true } },
          },
        },
      },
    });

    const approvedManual = manualRows.filter((row) => row.status === 'APPROVED');
    paymentTransactions = payments.map((payment) => {
      const manual = approvedManual.find((row) =>
        Boolean(payment.transactionId) && payment.transactionId!.startsWith(`${row.transaction_reference}:`),
      );
      const status: PaymentPortalTransaction['status'] = payment.status === 'PAID'
        ? 'SUCCESSFUL'
        : payment.status === 'REFUNDED'
          ? 'REFUNDED'
          : payment.status === 'FAILED'
            ? 'FAILED'
            : 'PROCESSING';
      return {
        id: payment.id,
        providerReference: payment.transactionId,
        date: payment.paidAt.toISOString(),
        method: manual ? 'Bank transfer' : payment.method,
        invoiceLabel: payment.invoice.feeStructure.name,
        amount: payment.amount,
        status,
        receiptNo: manual?.receipt_number ?? null,
      };
    });
  } else if (canReviewManualTransfers) {
    const payments = await db.payment.findMany({
      orderBy: { paidAt: 'desc' },
      take: 40,
      select: {
        id: true,
        amount: true,
        method: true,
        status: true,
        transactionId: true,
        paidAt: true,
        invoice: {
          select: {
            feeStructure: { select: { name: true } },
            student: { select: { rollNumber: true } },
          },
        },
      },
    });
    paymentTransactions = payments.map((payment) => ({
      id: payment.id,
      providerReference: payment.transactionId,
      date: payment.paidAt.toISOString(),
      method: payment.method,
      invoiceLabel: `${payment.invoice.feeStructure.name} · ${payment.invoice.student.rollNumber}`,
      amount: payment.amount,
      status: payment.status === 'PAID' ? 'SUCCESSFUL' : payment.status === 'REFUNDED' ? 'REFUNDED' : payment.status === 'FAILED' ? 'FAILED' : 'PROCESSING',
      receiptNo: null,
    }));
  }

  const manualTransactions: PaymentPortalTransaction[] = manualRows
    .filter((row) => row.status !== 'APPROVED')
    .map((row) => ({
      id: row.id,
      providerReference: row.transaction_reference,
      date: row.created_at.toISOString(),
      method: 'Bank transfer',
      invoiceLabel: `${parseStringArray(row.invoice_ids).length} invoice${parseStringArray(row.invoice_ids).length === 1 ? '' : 's'}`,
      amount: dbNumber(row.amount_minor) / 100,
      status: row.status === 'REJECTED' ? 'REJECTED' : 'VERIFICATION_PENDING',
      receiptNo: row.receipt_number,
      detail: row.review_note,
    }));

  const attempts = canPay ? await readAttemptsForPayer(context) : [];
  const attemptTransactions: PaymentPortalTransaction[] = attempts
    .filter((attempt) => attempt.status !== 'PAID')
    .map((attempt) => ({
      id: attempt.id,
      providerReference: attempt.provider_reference,
      date: attempt.created_at.toISOString(),
      method: attempt.provider === 'RAZORPAY' ? 'Razorpay' : 'Stripe',
      invoiceLabel: `${parseStringArray(attempt.invoice_ids).length} invoice${parseStringArray(attempt.invoice_ids).length === 1 ? '' : 's'}`,
      amount: dbNumber(attempt.amount_minor) / 100,
      status: attempt.status === 'FAILED' ? 'FAILED' : 'PROCESSING',
      receiptNo: attempt.receipt_number,
      detail: attempt.failure_reason,
    }));

  const transactions = [...manualTransactions, ...attemptTransactions, ...paymentTransactions]
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
    .slice(0, 60);

  const outstandingInvoices = invoices.filter((invoice) => invoice.status !== 'PAID');
  const nextDue = outstandingInvoices
    .filter((invoice) => invoice.status !== 'VERIFICATION_PENDING')
    .sort((left, right) => new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime())[0];
  const successfulTransactions = transactions.filter((transaction) => transaction.status === 'SUCCESSFUL');
  const latestSuccessful = successfulTransactions[0] ?? null;
  const reviewQueue = canReviewManualTransfers ? await readReviewQueue(context.tenantId) : [];

  return {
    generatedAt: new Date().toISOString(),
    role: context.activeRole,
    institution,
    payer: { userId: payer.id, name: payer.name, email: payer.email },
    capabilities: { canPay, canReviewManualTransfers, canManagePaymentSettings },
    settings,
    summary: {
      outstandingBalance: outstandingInvoices.reduce((sum, invoice) => sum + invoice.balance, 0),
      nextDueDate: nextDue?.dueDate ?? null,
      overdueInvoiceCount: invoices.filter((invoice) => invoice.status === 'OVERDUE').length,
      lastPaymentAmount: latestSuccessful?.amount ?? null,
      lastPaymentDate: latestSuccessful?.date ?? null,
      pendingVerificationCount: manualRows.filter((row) => ['PENDING', 'RECONCILIATION_REQUIRED'].includes(row.status)).length,
    },
    invoices,
    transactions,
    reviewQueue,
  };
}

export async function resolvePayableInvoices(context: ActiveUserContext, invoiceIds: string[]) {
  if (!PAYER_ROLES.has(context.activeRole)) throw new Error('This account is not allowed to initiate fee payments.');
  const uniqueIds = Array.from(new Set(invoiceIds.filter(Boolean)));
  if (uniqueIds.length === 0 || uniqueIds.length > 20) throw new Error('Select between 1 and 20 invoices.');

  const studentIds = await payerStudentIds(context);
  if (studentIds.length === 0) throw new Error('No authorised student profile is available for payment.');

  const db = getTenantDb(context.tenantId);
  const invoices = await db.invoice.findMany({
    where: { id: { in: uniqueIds }, studentId: { in: studentIds } },
    select: {
      id: true,
      amount: true,
      status: true,
      payments: { where: { status: 'PAID' }, select: { amount: true } },
    },
  });

  if (invoices.length !== uniqueIds.length) throw new Error('One or more selected invoices are unavailable for this account.');

  const resolved = invoices.map((invoice) => {
    const paid = invoice.payments.reduce((sum, payment) => sum + payment.amount, 0);
    return { id: invoice.id, balanceMinor: Math.max(0, Math.round((invoice.amount - paid) * 100)) };
  }).filter((invoice) => invoice.balanceMinor > 0);

  if (resolved.length === 0) throw new Error('The selected invoices have no outstanding balance.');
  return {
    invoices: resolved,
    totalMinor: resolved.reduce((sum, invoice) => sum + invoice.balanceMinor, 0),
  };
}

export async function createPendingPaymentAttempt(input: {
  context: ActiveUserContext;
  provider: 'RAZORPAY' | 'STRIPE';
  invoiceIds: string[];
  amountMinor: number;
  currency: string;
}) {
  const id = randomUUID();
  const pendingReference = `pending:${id}`;
  await prisma.$executeRaw`
    INSERT INTO campusos_finance.payment_attempts
      (id, tenant_id, payer_user_id, provider, provider_reference,
       invoice_ids, amount_minor, currency, status, created_at, updated_at)
    VALUES
      (${id}::uuid, ${input.context.tenantId}::uuid, ${input.context.userId}::uuid,
       ${input.provider}, ${pendingReference}, CAST(${JSON.stringify(input.invoiceIds)} AS jsonb),
       ${input.amountMinor}, ${input.currency}, 'CREATING', now(), now())
  `;
  return id;
}

export async function activatePaymentAttempt(attemptId: string, providerReference: string) {
  await prisma.$executeRaw`
    UPDATE campusos_finance.payment_attempts
    SET provider_reference = ${providerReference}, status = 'CREATED', updated_at = now()
    WHERE id = ${attemptId}::uuid
  `;
}

export async function failPaymentAttempt(attemptId: string, message: string) {
  await prisma.$executeRaw`
    UPDATE campusos_finance.payment_attempts
    SET status = 'FAILED', failure_reason = ${message.slice(0, 500)}, updated_at = now()
    WHERE id = ${attemptId}::uuid
  `;
}

export async function getPaymentAttemptByReference(provider: 'RAZORPAY' | 'STRIPE', reference: string) {
  const rows = await prisma.$queryRaw<AttemptRow[]>`
    SELECT id, tenant_id, payer_user_id, provider, provider_reference,
           invoice_ids, amount_minor, currency, status, receipt_number,
           external_payment_reference, failure_reason, created_at
    FROM campusos_finance.payment_attempts
    WHERE provider = ${provider} AND provider_reference = ${reference}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

function makeReceiptNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `COS-${date}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function postConfirmedPayments(input: {
  tenantId: string;
  invoiceIds: string[];
  amountMinor: number;
  method: PaymentMethod;
  externalReference: string;
  receiptNumber: string;
}) {
  return prisma.$transaction(async (tx) => {
    const invoices = await tx.invoice.findMany({
      where: { tenantId: input.tenantId, id: { in: input.invoiceIds } },
      select: {
        id: true,
        amount: true,
        payments: { where: { status: 'PAID' }, select: { amount: true } },
      },
    });
    if (invoices.length !== input.invoiceIds.length) throw new Error('Invoice allocation changed before payment confirmation.');

    const balances = invoices.map((invoice) => {
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
      const newBalanceMinor = invoice.balanceMinor - allocationMinor;
      await tx.invoice.update({
        where: { id: invoice.id },
        data: { status: newBalanceMinor <= 1 ? 'PAID' : 'PARTIAL' },
      });
      remaining -= allocationMinor;
    }
    if (remaining > 1) throw new Error('Confirmed payment could not be fully allocated to the selected invoices.');
    return input.receiptNumber;
  });
}

export async function finalizeGatewayAttempt(input: {
  attemptId: string;
  externalPaymentReference: string;
  method: Extract<PaymentMethod, 'RAZORPAY' | 'STRIPE'>;
  verifiedAmountMinor: number;
  verifiedCurrency: string;
}) {
  const rows = await prisma.$queryRaw<AttemptRow[]>`
    SELECT id, tenant_id, payer_user_id, provider, provider_reference,
           invoice_ids, amount_minor, currency, status, receipt_number,
           external_payment_reference, failure_reason, created_at
    FROM campusos_finance.payment_attempts
    WHERE id = ${input.attemptId}::uuid
    LIMIT 1
  `;
  const attempt = rows[0];
  if (!attempt) throw new Error('Payment attempt not found.');
  if (attempt.status === 'PAID') return attempt.receipt_number;

  const expectedAmount = dbNumber(attempt.amount_minor);
  if (expectedAmount !== input.verifiedAmountMinor || attempt.currency.toUpperCase() !== input.verifiedCurrency.toUpperCase()) {
    await prisma.$executeRaw`
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
    await postConfirmedPayments({
      tenantId: attempt.tenant_id,
      invoiceIds: parseStringArray(attempt.invoice_ids),
      amountMinor: expectedAmount,
      method: input.method,
      externalReference: input.externalPaymentReference,
      receiptNumber,
    });
  } catch (error) {
    await prisma.$executeRaw`
      UPDATE campusos_finance.payment_attempts
      SET status = 'RECONCILIATION_REQUIRED',
          failure_reason = ${error instanceof Error ? error.message.slice(0, 500) : 'Payment allocation failed.'},
          external_payment_reference = ${input.externalPaymentReference}, updated_at = now()
      WHERE id = ${attempt.id}::uuid
    `;
    throw error;
  }

  await prisma.$executeRaw`
    UPDATE campusos_finance.payment_attempts
    SET status = 'PAID', receipt_number = ${receiptNumber},
        external_payment_reference = ${input.externalPaymentReference},
        failure_reason = NULL, updated_at = now()
    WHERE id = ${attempt.id}::uuid
  `;
  return receiptNumber;
}

export async function finalizeManualSubmission(submissionId: string, reviewerUserId: string) {
  const rows = await prisma.$queryRaw<ManualSubmissionRow[]>`
    SELECT id, tenant_id, payer_user_id, invoice_ids, amount_minor, currency,
           transaction_reference, bank_name, transfer_date, payer_note,
           proof_file_name, proof_mime_type, status, receipt_number,
           review_note, created_at
    FROM campusos_finance.manual_payment_submissions
    WHERE id = ${submissionId}::uuid
    LIMIT 1
  `;
  const submission = rows[0];
  if (!submission) throw new Error('Manual payment submission not found.');
  if (submission.status === 'APPROVED') return submission.receipt_number;
  if (!['PENDING', 'RECONCILIATION_REQUIRED'].includes(submission.status)) {
    throw new Error('This transfer submission has already been closed.');
  }

  const receiptNumber = makeReceiptNumber();
  try {
    await postConfirmedPayments({
      tenantId: submission.tenant_id,
      invoiceIds: parseStringArray(submission.invoice_ids),
      amountMinor: dbNumber(submission.amount_minor),
      method: 'NETBANKING',
      externalReference: submission.transaction_reference,
      receiptNumber,
    });
  } catch (error) {
    await prisma.$executeRaw`
      UPDATE campusos_finance.manual_payment_submissions
      SET status = 'RECONCILIATION_REQUIRED', reviewer_user_id = ${reviewerUserId}::uuid,
          review_note = ${error instanceof Error ? error.message.slice(0, 500) : 'Payment allocation failed.'},
          reviewed_at = now(), updated_at = now()
      WHERE id = ${submission.id}::uuid
    `;
    throw error;
  }

  await prisma.$executeRaw`
    UPDATE campusos_finance.manual_payment_submissions
    SET status = 'APPROVED', receipt_number = ${receiptNumber},
        reviewer_user_id = ${reviewerUserId}::uuid, review_note = 'Verified by institution finance.',
        reviewed_at = now(), updated_at = now()
    WHERE id = ${submission.id}::uuid
  `;
  return receiptNumber;
}
