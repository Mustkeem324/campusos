import 'server-only';

import { prisma } from './db';
import { processTransportPhase2Telemetry } from './transport-gps-phase2-core';

export async function processTransportPhase2ForVehicle(input: {
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  recordedAt: Date;
}) {
  const rows = await prisma.$queryRaw<Array<{ tenant_id: string }>>`
    SELECT tenant_id
    FROM campusos_transport.vehicles
    WHERE id = ${input.vehicleId}::uuid
    LIMIT 1
  `;
  const tenantId = rows[0]?.tenant_id;
  if (!tenantId) return null;
  return processTransportPhase2Telemetry({ ...input, tenantId });
}
