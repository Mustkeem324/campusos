import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, createReadingList, listMyReadingLists } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const itemSchema = z.object({
  recordId: z.string().uuid().optional(),
  digitalId: z.string().uuid().optional(),
  note: z.string().max(400).optional(),
});

const createSchema = z.object({
  courseOfferingId: z.string().uuid().optional(),
  title: z.string().min(1).max(300),
  listType: z.enum(['REQUIRED', 'RECOMMENDED', 'REFERENCE']).optional(),
  items: z.array(itemSchema).max(100).optional(),
});

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const lists = await listMyReadingLists(context);
    return NextResponse.json({ lists });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to load reading lists.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = createSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reading list payload.' }, { status: 400 });
    const list = await createReadingList(context, parsed.data as Parameters<typeof createReadingList>[1]);
    return NextResponse.json({ list }, { status: 201 });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the reading list.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
