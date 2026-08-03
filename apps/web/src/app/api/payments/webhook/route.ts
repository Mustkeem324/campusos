import { NextResponse } from 'next/server';
import { prisma } from '../../../../lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// Webhook Secret from the payment gateway (e.g. Razorpay/Stripe)
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'dev_secret_key';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-payment-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 1. Webhook Verification (Source of Truth)
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.warn('[WEBHOOK] Invalid signature detected', { signature });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(rawBody);

    // 2. Idempotency Check & Transaction Boundary
    // We use a database transaction to ensure ledger consistency
    if (event.type === 'payment.captured') {
      const { paymentId, invoiceId, amount, transactionId, method } = event.payload;

      await prisma.$transaction(async (tx) => {
        // Prevent duplicate webhook processing
        const existingPayment = await tx.payment.findFirst({
          where: { transactionId }
        });

        if (existingPayment) {
          console.log('[WEBHOOK] Idempotent hit for transaction:', transactionId);
          return; // Already processed
        }

        // Lock the invoice row for update (if raw query was used `FOR UPDATE`)
        const invoice = await tx.invoice.findUnique({
          where: { id: invoiceId }
        });

        if (!invoice) throw new Error('Invoice not found');

        // Create the Payment Record
        const payment = await tx.payment.create({
          data: {
            tenantId: invoice.tenantId,
            invoiceId,
            amount: parseFloat(amount),
            method: method || 'ONLINE',
            status: 'PAID',
            transactionId
          }
        });

        // Update the Invoice Status
        const totalPaid = await tx.payment.aggregate({
          where: { invoiceId, status: 'PAID' },
          _sum: { amount: true }
        });

        const sumPaid = (totalPaid._sum.amount || 0);
        
        if (sumPaid >= invoice.amount) {
          await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PAID' }
          });
        } else {
          await tx.invoice.update({
            where: { id: invoiceId },
            data: { status: 'PARTIAL' }
          });
        }

        // Audit Logging
        await tx.auditLog.create({
          data: {
            tenantId: invoice.tenantId,
            action: 'PAYMENT_CAPTURED',
            entity: 'INVOICE',
            diffJson: JSON.stringify({ entityId: invoiceId, paymentId: payment.id, amount, transactionId }),
            userId: invoice.studentId // System acts on behalf of student
          }
        });
      }, {
        isolationLevel: 'Serializable', // Prevent dirty reads during ledger updates
      });
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[PAYMENT_WEBHOOK]', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
