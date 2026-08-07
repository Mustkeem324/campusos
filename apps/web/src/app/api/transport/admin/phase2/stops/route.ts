import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createTransportRouteStop, TransportPhase2Error } from '@/lib/transport-gps-phase2';

const stopSchema = z.object({
  routeId: z.string().uuid(),
  name: z.string().trim().min(2).max(120),
  sequenceNo: z.number().int().min(1).max(500),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  geofenceRadiusM: z.number().int().min(25).max(2000).default(120),
  plannedOffsetMinutes: z.number().int().min(0).max(1440).default(0),
});

export async function POST(request: Request) {
  try {
    const parsed = stopSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the route stop details.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const stop = await createTransportRouteStop(parsed.data);
    return NextResponse.json({ success: true, stop }, { status: 201 });
  } catch (error) {
    if (error instanceof TransportPhase2Error) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Transport route stop creation failed:', error);
    return NextResponse.json({ error: 'Unable to create this route stop.' }, { status: 500 });
  }
}
