import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Retired legacy payment webhook.
 *
 * The old generic callback accepted gateway-shaped ledger fields directly and
 * had a development-secret fallback. Payment confirmation must go through the
 * provider-specific Stripe/Razorpay webhooks, which verify provider signatures,
 * resolve the server-created payment attempt, and reconcile amount/currency
 * before any invoice or ledger mutation.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Legacy payment webhook retired.' },
    { status: 410 },
  );
}
