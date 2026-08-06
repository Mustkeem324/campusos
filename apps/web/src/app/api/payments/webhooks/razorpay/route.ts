import crypto from 'node:crypto';

import { NextResponse } from 'next/server';

import { findPaymentAttemptByReference } from '@/lib/payment-attempts';
import { finalizeGatewayPayment, PaymentReconciliationError } from '@/lib/payment-finalizer';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function safeEqualHex(left: string, right: string) {
  try {
    const a = Buffer.from(left, 'hex');
    const b = Buffer.from(right, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!webhookSecret || !keyId || !keySecret) {
    return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (!signature || !safeEqualHex(expected, signature)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const event: unknown = JSON.parse(rawBody);
    const record = event && typeof event === 'object' ? event as Record<string, unknown> : {};
    if (record.event !== 'payment.captured') return NextResponse.json({ received: true, ignored: true });

    const payload = record.payload && typeof record.payload === 'object' ? record.payload as Record<string, unknown> : {};
    const paymentWrapper = payload.payment && typeof payload.payment === 'object' ? payload.payment as Record<string, unknown> : {};
    const payment = paymentWrapper.entity && typeof paymentWrapper.entity === 'object' ? paymentWrapper.entity as Record<string, unknown> : {};
    const orderId = typeof payment.order_id === 'string' ? payment.order_id : '';
    const paymentId = typeof payment.id === 'string' ? payment.id : '';
    const currency = typeof payment.currency === 'string' ? payment.currency : '';
    const amount = Number(payment.amount);
    if (!orderId || !paymentId || !currency || !Number.isFinite(amount)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    // The signed payment webhook gives us an order ID. Resolve the order from
    // Razorpay so tenant metadata comes from the server-created order, not from
    // a browser-controlled request field.
    const orderResponse = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
      },
      cache: 'no-store',
    });
    const orderPayload: unknown = await orderResponse.json().catch(() => ({}));
    const order = orderPayload && typeof orderPayload === 'object' ? orderPayload as Record<string, unknown> : {};
    if (!orderResponse.ok || order.id !== orderId) {
      throw new Error('Razorpay order metadata could not be resolved for the captured payment.');
    }
    const notes = order.notes && typeof order.notes === 'object' ? order.notes as Record<string, unknown> : {};
    const tenantId = typeof notes.tenant_id === 'string' ? notes.tenant_id : '';
    if (!UUID_PATTERN.test(tenantId)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const attempt = await findPaymentAttemptByReference({ provider: 'RAZORPAY', reference: orderId, tenantId });
    if (!attempt) return NextResponse.json({ received: true, ignored: true });

    await finalizeGatewayPayment({
      attemptId: attempt.id,
      externalPaymentReference: paymentId,
      method: 'RAZORPAY',
      verifiedAmountMinor: amount,
      verifiedCurrency: currency,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    if (error instanceof PaymentReconciliationError) {
      console.error('Razorpay payment requires reconciliation:', error.message);
      return NextResponse.json({ received: true, reconciliationRequired: true });
    }
    console.error('Razorpay webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
