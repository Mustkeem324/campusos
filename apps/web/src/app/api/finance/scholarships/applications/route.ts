import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { applyForScholarship, FinanceError } from '@/lib/finance-operations';

export const dynamic = 'force-dynamic';

const applicationSchema = z.object({
  programId: z.string().uuid(),
  statement: z.string().max(4000).optional(),
  documentRefs: z.array(z.string().max(300)).max(10).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = applicationSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid scholarship application payload.' }, { status: 400 });
    const application = await applyForScholarship(context, parsed.data as Parameters<typeof applyForScholarship>[1]);
    return NextResponse.json({ application }, { status: 201 });
  } catch (error) {
    if (error instanceof FinanceError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the scholarship application.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
