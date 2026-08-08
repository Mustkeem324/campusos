import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, cancelLeaveRequest, reviewLeaveRequest } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const actionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT', 'CANCEL']),
  note: z.string().max(1000).optional(),
});

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = actionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid leave action payload.' }, { status: 400 });
    const leave = parsed.data.action === 'CANCEL'
      ? await cancelLeaveRequest(context, id)
      : await reviewLeaveRequest(context, id, { decision: parsed.data.action, note: parsed.data.note });
    return NextResponse.json({ leave });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update the leave request.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
