import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { LibraryError, getLibraryClearance } from '@/lib/library-operations';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const context = await requireActiveUserContext();
    const url = new URL(request.url);
    const memberId = url.searchParams.get('memberId') ?? undefined;
    const clearance = await getLibraryClearance(context, memberId);
    return NextResponse.json({ clearance });
  } catch (error) {
    if (error instanceof LibraryError) return NextResponse.json({ error: error.message }, { status: error.status });
    const message = error instanceof Error ? error.message : 'Unable to compute the library clearance.';
    const status = message.startsWith('Unauthorized') ? 401 : message.startsWith('Forbidden') ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
