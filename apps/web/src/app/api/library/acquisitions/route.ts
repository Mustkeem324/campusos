import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, requestAcquisition, listAcquisitions, reviewAcquisition } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const requestSchema = z.object({
  title: z.string().min(1).max(300),
  author: z.string().max(200).optional(),
  isbn: z.string().max(40).optional(),
  publisher: z.string().max(200).optional(),
  edition: z.string().max(80).optional(),
  estimatedPriceMinor: z.number().int().min(0).optional(),
  currency: z.string().regex(/^[A-Za-z]{3}$/).optional(),
  reason: z.string().max(1000).optional(),
});

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const acquisitions = await listAcquisitions(context, url.searchParams.get('pendingOnly') === 'true');
    return NextResponse.json({ acquisitions });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to list acquisition requests.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = requestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid acquisition payload.' }, { status: 400 });
    const acquisition = await requestAcquisition(context, parsed.data as Parameters<typeof requestAcquisition>[1]);
    return NextResponse.json({ acquisition }, { status: 201 });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to create the acquisition request.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

const reviewSchema = z.object({
  decision: z.enum(['APPROVE', 'REJECT']),
  note: z.string().max(1000).optional(),
});

export async function PATCH(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'An acquisition id is required.' }, { status: 400 });
    const parsed = reviewSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid acquisition review payload.' }, { status: 400 });
    const acquisition = await reviewAcquisition(context, id, parsed.data as Parameters<typeof reviewAcquisition>[2]);
    return NextResponse.json({ acquisition });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to review the acquisition request.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
