import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, recordOfflinePayment } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const offlineSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1).max(50),
  amountMinor: z.number().int().positive(),
  method: z.enum(['CASH', 'CHEQUE', 'DD', 'NETBANKING']),
  paymentDate: z.string().optional(),
  reference: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = offlineSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid offline payment payload.' }, { status: 400 });
    const result = await recordOfflinePayment(context, parsed.data as Parameters<typeof recordOfflinePayment>[1]);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to record the offline payment.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
