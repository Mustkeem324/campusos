import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import {
  WorkforceError,
  completeClearanceItem,
  computeFinalSettlement,
  listClearanceItems,
  reviewResignation,
} from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
  finalLastWorkingDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const settlementSchema = z.object({
  leaveEncashmentMinor: z.number().int().min(0).max(1_000_000_000_000).optional(),
  noticeRecoveryMinor: z.number().int().min(0).max(1_000_000_000_000).optional(),
  approvedReimbursementsMinor: z.number().int().min(0).max(1_000_000_000_000).optional(),
  advancesRecoveryMinor: z.number().int().min(0).max(1_000_000_000_000).optional(),
  loanRecoveryMinor: z.number().int().min(0).max(1_000_000_000_000).optional(),
  otherAdjustmentsMinor: z.number().int().optional(),
});

const clearanceSchema = z.object({
  itemId: z.string().uuid(),
  status: z.enum(['CLEARED', 'EXCEPTION', 'WAIVED']),
  note: z.string().max(1000).optional(),
});

export async function GET(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const clearances = await listClearanceItems(context, id);
    return NextResponse.json({ clearances });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load clearance items.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const body = await request.json().catch(() => null);

    // Settlement computation is a distinct financial write.
    if (body && typeof body === 'object' && 'leaveEncashmentMinor' in body) {
      const parsed = settlementSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid settlement payload.' }, { status: 400 });
      const settlement = await computeFinalSettlement(context, id, parsed.data as Parameters<typeof computeFinalSettlement>[2]);
      return NextResponse.json({ settlement }, { status: 201 });
    }

    if (body && typeof body === 'object' && 'itemId' in body) {
      const parsed = clearanceSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid clearance payload.' }, { status: 400 });
      const item = await completeClearanceItem(context, parsed.data.itemId, { status: parsed.data.status, note: parsed.data.note });
      return NextResponse.json({ item });
    }

    const parsed = reviewSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid exit review payload.' }, { status: 400 });
    const resignation = await reviewResignation(context, id, parsed.data as Parameters<typeof reviewResignation>[2]);
    return NextResponse.json({ resignation });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to process the exit request.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
