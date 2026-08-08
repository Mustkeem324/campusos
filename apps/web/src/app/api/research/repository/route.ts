import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, submitRepositoryItem } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const submitSchema = z.object({
  title: z.string().min(1).max(300),
  authors: z.array(z.object({ name: z.string().min(1).max(200) })).max(30).optional(),
  resourceType: z.enum([
    'THESIS', 'DISSERTATION', 'STUDENT_PROJECT', 'FACULTY_PAPER', 'CONFERENCE_PAPER',
    'INSTITUTIONAL_REPORT', 'DATASET', 'LEARNING_RESOURCE',
  ]).optional(),
  abstract: z.string().max(4000).optional(),
  keywords: z.array(z.string().max(80)).max(50).optional(),
  publicationYear: z.number().int().min(1000).max(2200).optional(),
  license: z.string().max(200).optional(),
  fileName: z.string().max(300).optional(),
  fileReference: z.string().min(1).max(500),
  accessLevel: z.enum([
    'PUBLIC', 'INSTITUTION_ONLY', 'DEPARTMENT_ONLY', 'RESTRICTED', 'EMBARGOED', 'PRIVATE',
  ]).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = submitSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid repository submission payload.' }, { status: 400 });
    const item = await submitRepositoryItem(context, parsed.data as Parameters<typeof submitRepositoryItem>[1]);
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to submit the repository item.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
