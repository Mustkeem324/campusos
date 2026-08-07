import { NextResponse } from 'next/server';
import { z } from 'zod';

import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
} from '@/lib/public-rate-limit';
import { recordGpsTelemetry, TransportError } from '@/lib/transport-gps';
import { processTransportPhase2ForVehicle } from '@/lib/transport-gps-phase2-processor';

const GPS_BODY_LIMIT_BYTES = 4 * 1024;
const GPS_RATE_LIMIT = 120;
const GPS_RATE_WINDOW_MS = 60_000;

const telemetrySchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKph: z.number().min(0).max(250).optional().nullable(),
  headingDegrees: z.number().min(0).max(360).optional().nullable(),
  accuracyMeters: z.number().min(0).max(10_000).optional().nullable(),
  recordedAt: z.string().datetime({ offset: true }).optional(),
});

type TelemetryPayload = {
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  headingDegrees?: number | null;
  accuracyMeters?: number | null;
  recordedAt?: string;
};

function bearerToken(request: Request) {
  const authorization = request.headers.get('authorization')?.trim() ?? '';
  if (authorization.toLowerCase().startsWith('bearer ')) return authorization.slice(7).trim();
  return request.headers.get('x-campusos-gps-token')?.trim() ?? '';
}

export async function POST(request: Request) {
  try {
    const token = bearerToken(request);
    if (!token || token.length < 24 || token.length > 200) {
      return NextResponse.json({ error: 'Valid GPS device credentials are required.' }, { status: 401 });
    }

    const rateLimit = checkPublicRateLimit({
      key: `gps-device:${token.slice(-20)}`,
      limit: GPS_RATE_LIMIT,
      windowMs: GPS_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json({ error: 'GPS telemetry rate limit exceeded.' }, {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      });
    }

    const parsed = telemetrySchema.safeParse(await readJsonWithLimit(request, GPS_BODY_LIMIT_BYTES));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid GPS telemetry.', fields: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const data = parsed.data as TelemetryPayload;
    const recordedAt = data.recordedAt ? new Date(data.recordedAt) : new Date();
    const now = Date.now();
    if (recordedAt.getTime() > now + 5 * 60_000) {
      return NextResponse.json({ error: 'GPS timestamp is too far in the future.' }, { status: 400 });
    }
    if (recordedAt.getTime() < now - 24 * 60 * 60_000) {
      return NextResponse.json({ error: 'GPS timestamp is older than the accepted 24-hour window.' }, { status: 400 });
    }

    const result = await recordGpsTelemetry(token, {
      latitude: data.latitude,
      longitude: data.longitude,
      speedKph: data.speedKph,
      headingDegrees: data.headingDegrees,
      accuracyMeters: data.accuracyMeters,
      recordedAt,
    });

    // Phase 1 telemetry capture remains authoritative. ETA/geofence processing
    // is intentionally best-effort so a notification-side issue can never make
    // a valid GPS fix disappear from the tracking history.
    const phase2 = await processTransportPhase2ForVehicle({
      vehicleId: result.vehicleId,
      latitude: data.latitude,
      longitude: data.longitude,
      speedKph: data.speedKph,
      recordedAt,
    }).catch((error) => {
      console.error('Transport Phase 2 telemetry processing failed:', error);
      return null;
    });

    return NextResponse.json({ ...result, phase2 }, {
      status: 202,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'GPS telemetry payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'GPS telemetry must be valid JSON.' }, { status: 400 });
    if (error instanceof TransportError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('GPS telemetry ingestion failed:', error);
    return NextResponse.json({ error: 'Unable to ingest GPS telemetry.' }, { status: 500 });
  }
}
