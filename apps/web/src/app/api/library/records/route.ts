import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, createCatalogRecord, getCatalogRecord } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const copySchema = z.object({
  locationId: z.string().uuid().optional(),
  barcode: z.string().max(120).optional(),
  shelf: z.string().max(80).optional(),
  condition: z.enum(['GOOD', 'WORN', 'DAMAGED', 'REPAIR']).optional(),
  priceMinor: z.number().int().min(0).optional(),
});

const createRecordSchema = z.object({
  title: z.string().min(1).max(300),
  subtitle: z.string().max(300).optional(),
  resourceType: z.enum([
    'BOOK', 'EBOOK', 'JOURNAL', 'MAGAZINE', 'NEWSPAPER', 'THESIS', 'DISSERTATION',
    'PROJECT_REPORT', 'RESEARCH_PAPER', 'CONFERENCE_PROCEEDING', 'STANDARD', 'HANDBOOK',
    'REFERENCE_BOOK', 'QUESTION_BANK', 'AUDIO', 'VIDEO', 'DATASET', 'DIGITAL_DOCUMENT', 'OTHER',
  ]).optional(),
  authors: z.array(z.object({ name: z.string().min(1).max(200), role: z.enum(['AUTHOR', 'EDITOR']).optional() })).max(30).optional(),
  publisher: z.string().max(200).optional(),
  edition: z.string().max(80).optional(),
  publicationYear: z.number().int().min(1000).max(2200).optional(),
  isbn: z.string().max(40).optional(),
  issn: z.string().max(40).optional(),
  doi: z.string().max(200).optional(),
  language: z.string().max(60).optional(),
  subject: z.string().max(200).optional(),
  keywords: z.array(z.string().max(80)).max(50).optional(),
  description: z.string().max(4000).optional(),
  callNumber: z.string().max(120).optional(),
  copies: z.array(copySchema).max(100).optional(),
});

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = createRecordSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid catalog record payload.' }, { status: 400 });
    const record = await createCatalogRecord(context, parsed.data as Parameters<typeof createCatalogRecord>[1]);
    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the catalog record.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'A catalog record id is required.' }, { status: 400 });
    const record = await getCatalogRecord(context, id);
    return NextResponse.json({ record });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load the catalog record.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
