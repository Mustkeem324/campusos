import crypto from 'node:crypto';

import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { findPaymentAttemptByReference } from '@/lib/payment-attempts';
import { finalizeGatewayPayment, PaymentReconciliationError } from '@/lib/payment-finalizer';

const requestSchema = z.object({
  razorpay_order_id: z.string().min(4).max(200),
  razorpay_payment_id: z.string().min(4).max(200),
  razorpay_signature: z.string().regex(/^[a-fA-F0-9]+$/).max(512),
});

function safeEqualHex(left: string, right: string) {
  try {
    const leftBuffer = Buffer.from(left, 'hex');
    const rightBuffer = Buffer.from(right, 'hex');
    return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid Razorpay confirmation payload.' }, { status: 400 });
    const input = parsed.data;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!secret || !keyId) return NextResponse.json({ error: 'Razorpay is not configured.' }, { status: 503 });

    const attempt = await findPaymentAttemptByReference({
      provider: 'RAZORPAY',
      reference: input.razorpay_order_id,
      tenantId: context.tenantId,
    });
    if (!attempt || attempt.payer_user_id !== context.userId) {
      return NextResponse.json({ error: 'Payment attempt not found.' }, { status: 404 });
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${input.razorpay_order_id}|${input.razorpay_payment_id}`)
      .digest('hex');
    if (!safeEqualHex(expectedSignature, input.razorpay_signature)) {
      return NextResponse.json({ error: 'Razorpay signature verification failed.' }, { status: 400 });
    }

    const verification = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(input.razorpay_payment_id)}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${secret}`).toString('base64')}`,
      },
      cache: 'no-store',
    });
    const payload: unknown = await verification.json().catch(() => ({}));
    const record = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    if (!verification.ok || record.order_id !== input.razorpay_order_id) {
      return NextResponse.json({ error: 'Razorpay could not confirm this payment.' }, { status: 409 });
    }
    if (record.status !== 'captured') {
      return NextResponse.json({ error: 'The Razorpay payment is not captured yet. CampusOS will confirm it from the webhook when captured.' }, { status: 409 });
    }

    const amount = Number(record.amount);
    const currency = String(record.currency ?? '');
    if (!Number.isFinite(amount) || !currency) {
      return NextResponse.json({ error: 'Razorpay returned an incomplete payment confirmation.' }, { status: 409 });
    }

    const receiptNumber = await finalizeGatewayPayment({
      attemptId: attempt.id,
      externalPaymentReference: input.razorpay_payment_id,
      method: 'RAZORPAY',
      verifiedAmountMinor: amount,
      verifiedCurrency: currency,
    });

    return NextResponse.json({ success: true, receiptNumber });
  } catch (error) {
    if (error instanceof PaymentReconciliationError) {
      return NextResponse.json({ error: error.message, reconciliationRequired: true }, { status: 409 });
    }
    console.error('Razorpay payment verification failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to verify Razorpay payment.' }, { status: 500 });
  }
}
