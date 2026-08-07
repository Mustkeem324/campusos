import { NextResponse } from 'next/server';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { getTransportAvailability } from '@/lib/transport-gps';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const context = await requireActiveUserContext();
    const availability = await getTransportAvailability(context);
    return NextResponse.json(availability, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
