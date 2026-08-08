import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, submitReimbursement } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const claimSchema = z.object({
  category: z.string().min(2).max(60),
  amountMinor: z.number().int().positive().max(1_000_000_000_000),
  reason: z.string().min(3).max(1000),
  documentRefs: z.array(z.string().max(300)).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = claimSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reimbursement payload.' }, { status: 400 });
    const claim = await submitReimbursement(context, parsed.data as Parameters<typeof submitReimbursement>[1]);
    return NextResponse.json({ claim }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the reimbursement claim.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
