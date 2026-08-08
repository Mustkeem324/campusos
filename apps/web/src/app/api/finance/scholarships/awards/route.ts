import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { awardScholarship, FinanceError } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const awardSchema = z.object({
  programId: z.string().uuid(),
  studentId: z.string().uuid(),
  awardedMinor: z.number().int().positive(),
  applicationId: z.string().uuid().optional(),
  note: z.string().max(2000).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = awardSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid scholarship award payload.' }, { status: 400 });
    const result = await awardScholarship(context, parsed.data as Parameters<typeof awardScholarship>[1]);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to award the scholarship.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
