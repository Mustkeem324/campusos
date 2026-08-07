import { NextResponse } from 'next/server';

import { getTransportPhase2LiveData, TransportPhase2Error } from '@/lib/transport-gps-phase2';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await getTransportPhase2LiveData();
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store, max-age=0' } });
  } catch (error) {
    if (error instanceof TransportPhase2Error) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Transport Phase 2 live API failed:', error);
    return NextResponse.json({ error: 'Unable to load live transport ETA data.' }, { status: 500 });
  }
}
