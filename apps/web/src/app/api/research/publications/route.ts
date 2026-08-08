import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { ResearchError, addPublication, listMyPublications } from '@/lib/research-operations';

export const dynamic = 'force-dynamic';

const addSchema = z.object({
  title: z.string().min(1).max(300),
  publicationType: z.enum([
    'JOURNAL_ARTICLE', 'CONFERENCE_PAPER', 'BOOK', 'BOOK_CHAPTER', 'PATENT', 'DATASET', 'OTHER',
  ]).optional(),
  venue: z.string().max(300).optional(),
  year: z.number().int().min(1000).max(2200).optional(),
  doi: z.string().max(200).optional(),
  evidenceReference: z.string().max(500).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const publications = await listMyPublications(context);
    return NextResponse.json({ publications });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list publications.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = addSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid publication payload.' }, { status: 400 });
    const publication = await addPublication(context, parsed.data as Parameters<typeof addPublication>[1]);
    return NextResponse.json({ publication }, { status: 201 });
  } catch (error) {
    if (error instanceof ResearchError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to add the publication.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
