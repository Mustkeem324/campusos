import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, issuePhysicalItem, returnLoan, renewLoan } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const circulationSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('ISSUE'),
    memberId: z.string().uuid(),
    copyId: z.string().uuid(),
  }),
  z.object({ action: z.literal('RETURN'), loanId: z.string().uuid() }),
  z.object({ action: z.literal('RENEW'), loanId: z.string().uuid() }),
]);

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = circulationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid circulation action payload.' }, { status: 400 });
    const input = parsed.data;
    if (input.action === 'ISSUE') {
      const loan = await issuePhysicalItem(context, { memberId: input.memberId, copyId: input.copyId });
      return NextResponse.json({ loan }, { status: 201 });
    }
    if (input.action === 'RETURN') {
      const loan = await returnLoan(context, input.loanId);
      return NextResponse.json({ loan });
    }
    const loan = await renewLoan(context, input.loanId);
    return NextResponse.json({ loan });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to complete the circulation action.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
