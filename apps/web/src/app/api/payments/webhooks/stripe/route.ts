import crypto from 'node:crypto';

import { NextResponse } from 'next/server';

import { finalizeGatewayPayment } from '@/lib/payment-finalizer';
import { getPaymentAttemptByReference } from '@/lib/payment-portal';

const SIGNATURE_TOLERANCE_SECONDS = 300;

function verifyStripeSignature(rawBody: string, header: string, secret: string) {
  const fields = header.split(',').map((part) => part.trim());
  const timestampField = fields.find((part) => part.startsWith('t='));
  const signatures = fields.filter((part) => part.startsWith('v1=')).map((part) => part.slice(3));
  const timestamp = Number(timestampField?.slice(2));
  if (!Number.isFinite(timestamp) || signatures.length === 0) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestamp) > SIGNATURE_TOLERANCE_SECONDS) return false;

  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${rawBody}`).digest('hex');
  return signatures.some((signature) => {
    try {
      const expectedBuffer = Buffer.from(expected, 'hex');
      const signatureBuffer = Buffer.from(signature, 'hex');
      return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    } catch {
      return false;
    }
  });
}

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: 'Webhook not configured.' }, { status: 503 });

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature') ?? '';
  if (!verifyStripeSignature(rawBody, signature, secret)) {
    return NextResponse.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  try {
    const event: unknown = JSON.parse(rawBody);
    const record = event && typeof event === 'object' ? event as Record<string, unknown> : {};
    if (record.type !== 'checkout.session.completed') return NextResponse.json({ received: true, ignored: true });

    const data = record.data && typeof record.data === 'object' ? record.data as Record<string, unknown> : {};
    const session = data.object && typeof data.object === 'object' ? data.object as Record<string, unknown> : {};
    if (session.payment_status !== 'paid') return NextResponse.json({ received: true, ignored: true });

    const sessionId = typeof session.id === 'string' ? session.id : '';
    const currency = typeof session.currency === 'string' ? session.currency : '';
    const amount = Number(session.amount_total);
    const paymentIntent = typeof session.payment_intent === 'string' ? session.payment_intent : sessionId;
    if (!sessionId || !currency || !Number.isFinite(amount)) {
      return NextResponse.json({ received: true, ignored: true });
    }

    const attempt = await getPaymentAttemptByReference('STRIPE', sessionId);
    if (!attempt) return NextResponse.json({ received: true, ignored: true });

    await finalizeGatewayPayment({
      attemptId: attempt.id,
      externalPaymentReference: paymentIntent,
      method: 'STRIPE',
      verifiedAmountMinor: amount,
      verifiedCurrency: currency,
    });
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook processing failed:', error);
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 });
  }
}
