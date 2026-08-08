import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { WorkforceError, submitResignation } from '@/lib/workforce-operations';

export const dynamic = 'force-dynamic';

const resignationSchema = z.object({
  proposedLastWorkingDay: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().min(3).max(1000),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = resignationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid resignation payload.' }, { status: 400 });
    const resignation = await submitResignation(context, parsed.data as Parameters<typeof submitResignation>[1]);
    return NextResponse.json({ resignation }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkforceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the resignation.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
