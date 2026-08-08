import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, submitThesisVersion } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const versionSchema = z.object({
  fileName: z.string().max(300).optional(),
  fileReference: z.string().min(1).max(500),
});

export async function POST(
  request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const parsed = versionSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid thesis version payload.' }, { status: 400 });
    const thesis = await submitThesisVersion(context, id, parsed.data as Parameters<typeof submitThesisVersion>[2]);
    return NextResponse.json({ thesis }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the thesis version.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
