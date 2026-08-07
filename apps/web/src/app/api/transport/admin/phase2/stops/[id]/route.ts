import { NextResponse } from 'next/server';

import { deleteTransportRouteStop, TransportPhase2Error } from '@/lib/transport-gps-phase2';

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) return NextResponse.json({ error: 'Invalid route stop identifier.' }, { status: 400 });
    await deleteTransportRouteStop(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TransportPhase2Error) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Transport route stop deletion failed:', error);
    return NextResponse.json({ error: 'Unable to remove this route stop.' }, { status: 500 });
  }
}
