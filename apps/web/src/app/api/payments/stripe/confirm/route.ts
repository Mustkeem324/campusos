import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { findPaymentAttemptByReference } from '@/lib/payment-attempts';
import { finalizeGatewayPayment, PaymentReconciliationError } from '@/lib/payment-finalizer';

export async function GET(request: Request) {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const sessionId = new URL(request.url).searchParams.get('session_id')?.trim() ?? '';
  if (!sessionId || sessionId.length > 300) return NextResponse.json({ error: 'Missing Stripe Checkout Session.' }, { status: 400 });
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });

  try {
    const attempt = await findPaymentAttemptByReference({
      provider: 'STRIPE',
      reference: sessionId,
      tenantId: context.tenantId,
    });
    if (!attempt || attempt.payer_user_id !== context.userId) {
      return NextResponse.json({ error: 'Payment attempt not found.' }, { status: 404 });
    }

    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${secret}` },
      cache: 'no-store',
    });
    const payload: unknown = await response.json().catch(() => ({}));
    const session = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
    if (!response.ok) return NextResponse.json({ error: 'Stripe could not confirm the Checkout Session.' }, { status: 409 });
    if (session.payment_status !== 'paid') return NextResponse.json({ error: 'Stripe has not marked this Checkout Session as paid yet.' }, { status: 409 });

    const amount = Number(session.amount_total);
    const currency = String(session.currency ?? '');
    const externalReference = typeof session.payment_intent === 'string' ? session.payment_intent : sessionId;
    if (!Number.isFinite(amount) || !currency) {
      return NextResponse.json({ error: 'Stripe returned an incomplete payment confirmation.' }, { status: 409 });
    }

    const receiptNumber = await finalizeGatewayPayment({
      attemptId: attempt.id,
      externalPaymentReference: externalReference,
      method: 'STRIPE',
      verifiedAmountMinor: amount,
      verifiedCurrency: currency,
    });
    return NextResponse.json({ success: true, receiptNumber });
  } catch (error) {
    if (error instanceof PaymentReconciliationError) {
      return NextResponse.json({ error: error.message, reconciliationRequired: true }, { status: 409 });
    }
    console.error('Stripe return confirmation failed:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to confirm Stripe payment.' }, { status: 500 });
  }
}
