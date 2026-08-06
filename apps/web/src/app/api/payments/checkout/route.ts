import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';
import { PaymentRequestError, reserveGatewayPayment } from '@/lib/payment-request';
import {
  activatePaymentAttempt,
  failPaymentAttempt,
  getPaymentSettings,
} from '@/lib/payment-portal';

const requestSchema = z.object({
  provider: z.enum(['RAZORPAY', 'STRIPE']),
  invoiceIds: z.array(z.string().uuid()).min(1).max(20),
});

function providerError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  const error = record.error;
  if (error && typeof error === 'object') {
    const description = (error as Record<string, unknown>).description;
    if (typeof description === 'string' && description.trim()) return description;
  }
  if (typeof record.message === 'string' && record.message.trim()) return record.message;
  return fallback;
}

function configuredPublicOrigin() {
  const configured = (process.env.APP_PUBLIC_URL ?? '').trim().replace(/\/+$/, '');
  if (!configured) {
    throw new PaymentRequestError('The application public URL is not configured for Stripe Checkout.', 503);
  }
  try {
    const parsed = new URL(configured);
    if (!['https:', 'http:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error('invalid');
    return parsed.origin;
  } catch {
    throw new PaymentRequestError('APP_PUBLIC_URL must be a valid absolute HTTP or HTTPS origin.', 503);
  }
}

export async function POST(request: Request) {
  const context = await requireActiveUserContext().catch(() => null);
  if (!context) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let attemptId: string | null = null;
  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Select valid invoices and a payment provider.' }, { status: 400 });

    const settings = await getPaymentSettings(context.tenantId);
    const provider = parsed.data.provider;
    if (provider === 'RAZORPAY' && (!settings.razorpayEnabled || !settings.gatewayAvailability.razorpay)) {
      return NextResponse.json({ error: 'Razorpay is not enabled for this institution.' }, { status: 409 });
    }
    if (provider === 'STRIPE' && (!settings.stripeEnabled || !settings.gatewayAvailability.stripe)) {
      return NextResponse.json({ error: 'Stripe is not enabled for this institution.' }, { status: 409 });
    }

    // Validate the redirect origin before reserving invoices, so a missing
    // deployment variable cannot leave a stale Stripe payment attempt behind.
    const stripeOrigin = provider === 'STRIPE' ? configuredPublicOrigin() : null;

    const reservation = await reserveGatewayPayment({
      context,
      provider,
      invoiceIds: parsed.data.invoiceIds,
      currency: settings.currency,
    });
    attemptId = reservation.attemptId;

    const [institution, payer] = await Promise.all([
      prisma.institution.findUnique({ where: { id: context.tenantId }, select: { name: true } }),
      prisma.user.findFirst({ where: { id: context.userId, tenantId: context.tenantId }, select: { name: true, email: true, phone: true } }),
    ]);
    if (!institution || !payer) throw new PaymentRequestError('Unable to resolve payment identity.', 403);

    if (provider === 'RAZORPAY') {
      const keyId = process.env.RAZORPAY_KEY_ID!;
      const keySecret = process.env.RAZORPAY_KEY_SECRET!;
      const response = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: reservation.totalMinor,
          currency: settings.currency,
          receipt: `COS-${attemptId.slice(0, 20)}`,
          notes: {
            attempt_id: attemptId,
            tenant_id: context.tenantId,
            payer_user_id: context.userId,
          },
        }),
        cache: 'no-store',
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !payload || typeof payload !== 'object' || typeof (payload as Record<string, unknown>).id !== 'string') {
        throw new Error(providerError(payload, 'Razorpay could not create the payment order.'));
      }
      const orderId = String((payload as Record<string, unknown>).id);
      await activatePaymentAttempt(attemptId, orderId);
      return NextResponse.json({
        provider: 'RAZORPAY',
        attemptId,
        keyId,
        orderId,
        amount: reservation.totalMinor,
        currency: settings.currency,
        institutionName: institution.name,
        payer: { name: payer.name, email: payer.email, phone: payer.phone ?? '' },
      });
    }

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', `${stripeOrigin}/payments?payment=success&session_id={CHECKOUT_SESSION_ID}`);
    body.set('cancel_url', `${stripeOrigin}/payments?payment=cancelled`);
    body.set('client_reference_id', attemptId);
    body.set('customer_email', payer.email);
    body.set('metadata[attempt_id]', attemptId);
    body.set('metadata[tenant_id]', context.tenantId);
    body.set('payment_intent_data[metadata][attempt_id]', attemptId);
    body.set('line_items[0][price_data][currency]', settings.currency.toLowerCase());
    body.set('line_items[0][price_data][unit_amount]', String(reservation.totalMinor));
    body.set('line_items[0][price_data][product_data][name]', `${institution.name} fee payment`);
    body.set('line_items[0][price_data][product_data][description]', `${reservation.invoices.length} CampusOS invoice${reservation.invoices.length === 1 ? '' : 's'}`);
    body.set('line_items[0][quantity]', '1');

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY!}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
      cache: 'no-store',
    });
    const stripePayload: unknown = await stripeResponse.json().catch(() => ({}));
    const stripeRecord = stripePayload && typeof stripePayload === 'object' ? stripePayload as Record<string, unknown> : {};
    if (!stripeResponse.ok || typeof stripeRecord.id !== 'string' || typeof stripeRecord.url !== 'string') {
      throw new Error(providerError(stripePayload, 'Stripe could not create the Checkout Session.'));
    }
    await activatePaymentAttempt(attemptId, stripeRecord.id);
    return NextResponse.json({ provider: 'STRIPE', attemptId, checkoutUrl: stripeRecord.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to start payment.';
    if (attemptId) await failPaymentAttempt(attemptId, message).catch(() => null);
    console.error('Payment checkout creation failed:', error);
    return NextResponse.json(
      { error: message },
      { status: error instanceof PaymentRequestError ? error.status : 502 },
    );
  }
}
