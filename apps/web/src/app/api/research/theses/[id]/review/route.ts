import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, reviewThesis } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const reviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT', 'CORRECTIONS_REQUIRED']),
  note: z.string().max(2000).optional(),
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid thesis review payload.' }, { status: 400 });
    const thesis = await reviewThesis(context, id, parsed.data as Parameters<typeof reviewThesis>[2]);
    return NextResponse.json({ thesis });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to review the thesis.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
