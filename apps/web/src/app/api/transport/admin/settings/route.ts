import { NextResponse } from 'next/server';
import { z } from 'zod';

import { TransportError, updateTransportSettings } from '@/lib/transport-gps';

const settingsSchema = z.object({
  enabled: z.boolean().optional(),
  gpsTrackingEnabled: z.boolean().optional(),
  allowHybridStudents: z.boolean().optional(),
  telemetryStaleSeconds: z.number().int().min(30).max(3600).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one transport setting.' });

export async function PATCH(request: Request) {
  try {
    const parsed = settingsSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Review the transport settings.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const settings = await updateTransportSettings(parsed.data);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    if (error instanceof TransportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Transport settings update failed:', error);
    return NextResponse.json({ error: 'Unable to update transport settings.' }, { status: 500 });
  }
}
