import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, updateResearchSettings } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const settingsPatchSchema = z.object({
  timezone: z.string().max(64).optional(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  supervisorCapacity: z.number().int().min(1).max(100).optional(),
  proposalRequiresReview: z.boolean().optional(),
  similarityThresholdOk: z.number().int().min(0).max(100).optional(),
  similarityThresholdReview: z.number().int().min(0).max(100).optional(),
  repositoryRequiresApproval: z.boolean().optional(),
  defaultEmbargoDays: z.number().int().min(0).max(3650).nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = settingsPatchSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid research settings payload.' }, { status: 400 });
    const settings = await updateResearchSettings(context, parsed.data as Parameters<typeof updateResearchSettings>[1]);
    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to update research settings.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
