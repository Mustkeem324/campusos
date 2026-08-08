import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Retired legacy payment-order endpoint.
 *
 * The historical implementation accepted a browser-supplied invoice ID and
 * amount, generated a mock order, and did not enforce the payer-to-invoice
 * relationship used by the production checkout service. All payment creation
 * must go through /api/payments/checkout (and provider-specific verification),
 * where invoice ownership, tenant, outstanding balance and gateway amount are
 * derived and revalidated server-side.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Legacy payment creation endpoint retired. Use the secure checkout flow.' },
    { status: 410 },
  );
}
