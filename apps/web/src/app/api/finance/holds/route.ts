import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, placeFinancialHold } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const holdSchema = z.object({
  studentId: z.string().uuid(),
  reason: z.string().min(5).max(2000),
  amountMinor: z.number().int().nonnegative().optional(),
  impactScope: z.array(z.enum(['EXAM_REGISTRATION', 'DOCUMENT_ISSUANCE', 'REGISTRATION'])).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = holdSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid financial hold payload.' }, { status: 400 });
    const hold = await placeFinancialHold(context, parsed.data as Parameters<typeof placeFinancialHold>[1]);
    return NextResponse.json({ hold }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to place the financial hold.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
