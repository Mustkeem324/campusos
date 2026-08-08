import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, submitProposal } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const proposalSchema = z.object({
  title: z.string().min(1).max(300),
  problemStatement: z.string().max(4000).optional(),
  objectives: z.array(z.string().max(500)).max(20).optional(),
  methodology: z.string().max(8000).optional(),
  literatureReview: z.string().max(8000).optional(),
  expectedOutcome: z.string().max(4000).optional(),
  timeline: z.record(z.unknown()).optional(),
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = proposalSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid proposal payload.' }, { status: 400 });
    const proposal = await submitProposal(context, id, parsed.data as Parameters<typeof submitProposal>[2]);
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the proposal.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
