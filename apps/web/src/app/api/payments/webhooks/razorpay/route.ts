import crypto from 'node:crypto';

import { NextResponse } from 'next/server';

import { finalizeGatewayAttempt, getPaymentAttemptByReference } from '@/lib/payment-portal';

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
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get('x-razorpay-signature') ?? '';
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
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

    const attempt = await getPaymentAttemptByReference('RAZORPAY', orderId);
    if (!attempt) return NextResponse.json({ received: true, ignored: true });

    await finalizeGatewayAttempt({
      attemptId: attempt.id,
      externalPaymentReference: paymentId,
      method: 'RAZORPAY',
      verifiedAmountMinor: amount,
      verifiedCurrency: currency,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
