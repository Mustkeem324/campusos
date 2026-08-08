import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, createThesis, listMyTheses } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  title: z.string().min(1).max(300),
  projectId: z.string().uuid().optional(),
  programId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const theses = await listMyTheses(context);
    return NextResponse.json({ theses });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list theses.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid thesis payload.' }, { status: 400 });
    const thesis = await createThesis(context, parsed.data as Parameters<typeof createThesis>[1]);
    return NextResponse.json({ thesis }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the thesis.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
