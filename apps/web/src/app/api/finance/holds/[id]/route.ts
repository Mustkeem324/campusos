import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { FinanceError, resolveFinancialHold } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const resolveSchema = z.object({
  note: z.string().max(2000).optional(),
});

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
      return NextResponse.json({ error: 'Invalid hold identifier.' }, { status: 400 });
    }
    const parsed = resolveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid hold resolution payload.' }, { status: 400 });
    const hold = await resolveFinancialHold(context, id, parsed.data.note);
    return NextResponse.json({ hold });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to resolve the financial hold.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
