import { NextResponse } from 'next/server';

import { getTransportWorkspaceData, TransportError } from '@/lib/transport-gps';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getTransportWorkspaceData();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'private, no-store, max-age=0' },
    });
  } catch (error) {
    if (error instanceof TransportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: 'Unable to load transport GPS data.' }, { status: 500 });
  }
}
