import { NextResponse } from 'next/server';
import { z } from 'zod';

import { TransportError, updateStudentTransport } from '@/lib/transport-gps';
import type { StudentStudyMode } from '@/lib/transport-gps-types';

const updateSchema = z.object({
  studyMode: z.enum(['ONLINE', 'OFFLINE', 'HYBRID']),
  transportOptIn: z.boolean(),
  routeId: z.string().uuid().nullable(),
  vehicleId: z.string().uuid().nullable(),
});

type UpdatePayload = {
  studyMode: StudentStudyMode;
  transportOptIn: boolean;
  routeId: string | null;
  vehicleId: string | null;
};

export async function PATCH(request: Request, { params: paramsPromise }: { params: Promise<{ id: string }>; }) {
  const params = await paramsPromise;

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Review the student transport configuration.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const input = parsed.data as UpdatePayload;
    const result = await updateStudentTransport({ studentId: params.id, ...input });
    return NextResponse.json({ success: true, student: result });
  } catch (error) {
    if (error instanceof TransportError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Student transport update failed:', error);
    return NextResponse.json({ error: 'Unable to update this student transport profile.' }, { status: 500 });
  }
}
