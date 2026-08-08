import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, assignSupervisor } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const assignSchema = z.object({
  supervisorId: z.string().uuid(),
  role: z.enum(['GUIDE', 'CO_GUIDE']).optional(),
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = assignSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid supervisor assignment payload.' }, { status: 400 });
    const project = await assignSupervisor(context, id, parsed.data as Parameters<typeof assignSupervisor>[2]);
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to assign the supervisor.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
