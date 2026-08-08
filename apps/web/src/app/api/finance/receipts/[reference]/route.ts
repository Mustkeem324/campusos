import { NextResponse } from 'next/server';

import { FinanceError, verifyReceiptByReference } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

/**
 * Public minimal-disclosure receipt verifier. It intentionally returns only
 * institution, receipt reference, date, amount and status — never student
 * personal or payment-method details.
 */
export async function GET(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ reference: string }> },
) {
  try {
    const { reference } = await paramsPromise;
    const verification = await verifyReceiptByReference(reference);
    if (!verification) return NextResponse.json({ error: 'Receipt not found.' }, { status: 404 });
    return NextResponse.json(verification);
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    return NextResponse.json({ error: 'Receipt verification is unavailable.' }, { status: 500 });
  }
}
