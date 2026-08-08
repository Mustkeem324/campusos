import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, addMilestone, submitMilestone } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

const submitSchema = z.object({
  milestoneId: z.string().uuid(),
  notes: z.string().max(2000).optional(),
  fileReference: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const body = await request.json().catch(() => null);
    if (body?.milestoneId !== undefined) {
      const parsed = submitSchema.safeParse(body);
      if (!parsed.success) return NextResponse.json({ error: 'Invalid milestone submission payload.' }, { status: 400 });
      const milestone = await submitMilestone(context, parsed.data.milestoneId, { notes: parsed.data.notes, fileReference: parsed.data.fileReference });
      return NextResponse.json({ milestone }, { status: 201 });
    }
    const parsed = addSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid milestone payload.' }, { status: 400 });
    const milestone = await addMilestone(context, parsed.data.projectId, { title: parsed.data.title, description: parsed.data.description, dueDate: parsed.data.dueDate });
    return NextResponse.json({ milestone }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to manage the milestone.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
