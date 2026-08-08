import { NextResponse } from 'next/server';
import { z } from 'zod';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, cancelReservation, reserveRecord } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

const reserveSchema = z.object({ recordId: z.string().uuid() });

export async function POST(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const parsed = reserveSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid reservation payload.' }, { status: 400 });
    const reservation = await reserveRecord(context, parsed.data.recordId);
    return NextResponse.json({ reservation }, { status: 201 });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to reserve the resource.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params: paramsPromise }: { params: Promise<{ id: string }> },
) {
  try {
    const context = await requireActiveUserContext();
    const { id } = await paramsPromise;
    const reservation = await cancelReservation(context, id);
    return NextResponse.json({ reservation });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to cancel the reservation.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
