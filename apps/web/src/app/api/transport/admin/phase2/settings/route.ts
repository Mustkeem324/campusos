import { NextResponse } from 'next/server';
import { z } from 'zod';

import { TransportPhase2Error, updateTransportPhase2Settings } from '@/lib/transport-gps-phase2';

const schema = z.object({
  parentEtaAlertsEnabled: z.boolean().optional(),
  parentEmailAlertsEnabled: z.boolean().optional(),
  etaAlertLeadMinutes: z.number().int().min(2).max(60).optional(),
  etaDefaultSpeedKph: z.number().int().min(5).max(100).optional(),
}).refine((value) => Object.keys(value).length > 0, { message: 'Provide at least one setting.' });

export async function PATCH(request: Request) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Review the Phase 2 settings.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    const settings = await updateTransportPhase2Settings(parsed.data);
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    if (error instanceof TransportPhase2Error) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Transport Phase 2 settings update failed:', error);
    return NextResponse.json({ error: 'Unable to update ETA alert settings.' }, { status: 500 });
  }
}
