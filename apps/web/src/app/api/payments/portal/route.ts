import { NextResponse } from 'next/server';

import { getPaymentPortalData } from '@/lib/payment-portal';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getPaymentPortalData();
    data.capabilities.canManagePaymentSettings = ['INSTITUTION_ADMIN', 'FINANCE_OFFICER'].includes(data.role);
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load the payment workspace.';
    const status = /Unauthorized|Forbidden/i.test(message) ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
