import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, recordSimilarityCheck } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const similaritySchema = z.object({
  provider: z.string().min(1).max(200),
  submissionReference: z.string().max(300).optional(),
  similarityScore: z.number().int().min(0).max(100).optional(),
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = similaritySchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid similarity check payload.' }, { status: 400 });
    const result = await recordSimilarityCheck(context, id, parsed.data as Parameters<typeof recordSimilarityCheck>[2]);
    return NextResponse.json({ check: result }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to record the similarity check.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
