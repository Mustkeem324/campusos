import { NextResponse } from 'next/server';
import { z } from 'zod';

import { createTransportVehicle, TransportError } from '@/lib/transport-gps';

const vehicleSchema = z.object({
  label: z.string().trim().min(2).max(120),
  registrationNumber: z.string().trim().min(2).max(40),
  routeId: z.string().uuid().nullable(),
  driverName: z.string().trim().max(120).optional().nullable(),
  driverPhone: z.string().trim().max(40).optional().nullable(),
});

type VehiclePayload = {
  label: string;
  registrationNumber: string;
  routeId: string | null;
  driverName?: string | null;
  driverPhone?: string | null;
};

export async function POST(request: Request) {
  try {
    const parsed = vehicleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Review the vehicle details.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const vehicle = await createTransportVehicle(parsed.data as VehiclePayload);
    return NextResponse.json({
      success: true,
      vehicle,
      warning: 'The GPS device token is shown only in this response. Store it securely on the vehicle tracker.',
    }, { status: 201 });
  } catch (error) {
    if (error instanceof TransportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Transport vehicle creation failed:', error);
    return NextResponse.json({ error: 'Unable to create this transport vehicle.' }, { status: 500 });
  }
}
