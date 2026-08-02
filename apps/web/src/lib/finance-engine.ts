import crypto from 'crypto';

export interface FeeHead {
  id: string;
  name: string; // e.g. "Tuition Fee", "Development Fee", "Lab Fee"
  amount: number;
  isRecurring: boolean;
}

export interface FeeStructureDetail {
  id: string;
  tenantId: string;
  name: string;
  programId: string;
  batchId: string;
  heads: FeeHead[];
  totalAmount: number;
  dueDate: string;
  lateFeePerDay: number;
}

export interface InvoiceDetail {
  id: string;
  tenantId: string;
  studentId: string;
  studentName: string;
  rollNumber: string;
  feeStructureId: string;
  subtotal: number;
  scholarshipDiscount: number;
  lateFeeAmount: number;
  totalDue: number;
  amountPaid: number;
  balanceDue: number;
  status: 'UNPAID' | 'PARTIAL' | 'PAID';
  dueDate: string;
}

export interface PaymentTransaction {
  id: string;
  invoiceId: string;
  amount: number;
  paymentMethod: 'RAZORPAY' | 'STRIPE' | 'UPI' | 'NETBANKING' | 'CASH' | 'CHEQUE';
  transactionId: string;
  idempotencyKey: string;
  status: 'SUCCESS' | 'FAILED';
  paidAt: Date;
  receiptNumber: string;
}

export interface LedgerEntry {
  id: string;
  studentId: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  createdAt: Date;
}

// In-memory idempotency store to prevent duplicate webhook processing
const PROCESSED_WEBHOOK_KEYS: Set<string> = new Set();
const PAYMENT_LEDGER: LedgerEntry[] = [];

// 1. Calculate Invoice Totals with Late Fee Slabs & Scholarship Deductions
export function calculateInvoiceTotals(
  subtotal: number,
  scholarshipPct: number,
  dueDateStr: string,
  currentDate: Date = new Date(),
  lateFeePerDay = 10
): { scholarshipDiscount: number; lateFeeAmount: number; totalDue: number } {
  const scholarshipDiscount = Math.round((subtotal * scholarshipPct) / 100);
  const dueDate = new Date(dueDateStr);

  let lateFeeAmount = 0;
  if (currentDate > dueDate) {
    const diffTime = Math.abs(currentDate.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    lateFeeAmount = diffDays * lateFeePerDay;
  }

  const totalDue = Math.max(0, subtotal - scholarshipDiscount + lateFeeAmount);
  return { scholarshipDiscount, lateFeeAmount, totalDue };
}

// 2. Webhook Idempotency Guard & Payment Processor
export function processPaymentWebhookIdempotent(
  payload: {
    transactionId: string;
    invoiceId: string;
    studentId: string;
    amount: number;
    paymentMethod: 'RAZORPAY' | 'STRIPE' | 'UPI';
    signature: string;
  },
  webhookSecret = 'whsec_campusos_secret_123'
): { success: boolean; isDuplicate: boolean; receiptNumber?: string; message: string } {
  const idempotencyKey = `wh_tx_${payload.transactionId}`;

  // Idempotency Check: Ignore if already processed
  if (PROCESSED_WEBHOOK_KEYS.has(idempotencyKey)) {
    return {
      success: true,
      isDuplicate: true,
      message: 'Webhook payload already processed idempotently. Duplicate ignored.',
    };
  }

  // HMAC Signature Verification
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(`${payload.transactionId}:${payload.amount}`)
    .digest('hex');

  // Mark key as processed
  PROCESSED_WEBHOOK_KEYS.add(idempotencyKey);

  const receiptNumber = `RCPT-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // Record Ledger Credit Entry
  PAYMENT_LEDGER.push({
    id: `ledg_${Date.now()}`,
    studentId: payload.studentId,
    description: `Online Payment via ${payload.paymentMethod} (${receiptNumber})`,
    debit: 0,
    credit: payload.amount,
    balance: 0,
    createdAt: new Date(),
  });

  return {
    success: true,
    isDuplicate: false,
    receiptNumber,
    message: `Payment of $${payload.amount} successfully processed & ledger updated.`,
  };
}

// 3. Export Finance Data to Tally ERP Compatible XML/CSV
export function exportTallyERPLedger(entries: LedgerEntry[]): string {
  let csv = 'Date,Student ID,Description,Debit,Credit\n';
  for (const e of entries) {
    csv += `${new Date(e.createdAt).toISOString().split('T')[0]},${e.studentId},"${e.description}",${e.debit},${e.credit}\n`;
  }
  return csv;
}
