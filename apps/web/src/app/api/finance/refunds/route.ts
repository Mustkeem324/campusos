import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, requestRefund } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const refundSchema = z.object({
  paymentId: z.string().uuid(),
  requestedMinor: z.number().int().positive(),
  reason: z.string().min(5).max(2000),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = refundSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid refund request payload.' }, { status: 400 });
    const refund = await requestRefund(context, parsed.data as Parameters<typeof requestRefund>[1]);
    return NextResponse.json({ refund }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the refund request.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
