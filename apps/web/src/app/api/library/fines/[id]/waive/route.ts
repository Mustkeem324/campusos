import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, waiveFine } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const waiveSchema = z.object({
  amountMinor: z.number().int().min(0).optional(),
  reason: z.string().min(3).max(1000),
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = waiveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fine waiver payload.' }, { status: 400 });
    const fine = await waiveFine(context, id, parsed.data as Parameters<typeof waiveFine>[2]);
    return NextResponse.json({ fine });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to waive the fine.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
