import 'server-only';

import { randomUUID } from 'node:crypto';

import { Prisma, type RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import {
  estimateEtaMinutes,
  haversineDistanceMeters,
  processTransportPhase2Telemetry,
  readTransportPhase2Settings,
  readTransportStops,
} from './transport-gps-phase2-core';
import type {
  TransportJourneyInsight,
  TransportPhase2AdminData,
  TransportPhase2LiveData,
  TransportPhase2Settings,
} from './transport-gps-phase2-types';

export { estimateEtaMinutes, haversineDistanceMeters, processTransportPhase2Telemetry } from './transport-gps-phase2-core';

const PHASE2_VIEWER_ROLES = new Set<RoleType>(['STUDENT', 'PARENT', 'TRANSPORT_MANAGER', 'INSTITUTION_ADMIN']);

export class TransportPhase2Error extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TransportPhase2Error';
    this.status = status;
  }
}

type JourneyRow = {
  vehicle_id: string;
  route_id: string;
  service_date: Date | string;
  trip_started_at: Date;
  next_stop_id: string | null;
  last_stop_id: string | null;
  distance_to_next_m: number | null;
  eta_minutes: number | null;
  predicted_arrival_at: Date | null;
  delay_minutes: number | null;
  journey_status: TransportJourneyInsight['status'];
  updated_at: Date;
};

async function allowedVehicleIds(context: ActiveUserContext, allowHybridStudents: boolean): Promise<string[] | null> {
  if (context.activeRole === 'INSTITUTION_ADMIN' || context.activeRole === 'TRANSPORT_MANAGER') return null;

  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) return [];
    const rows = await prisma.$queryRaw<Array<{ vehicle_id: string }>>`
      SELECT a.vehicle_id
      FROM campusos_transport.student_assignments a
      LEFT JOIN campusos_transport.student_profiles sp ON sp.student_id = a.student_id
      WHERE a.tenant_id = ${context.tenantId}::uuid
        AND a.student_id = ${context.studentProfileId}::uuid
        AND a.active = true
        AND a.vehicle_id IS NOT NULL
        AND COALESCE(sp.transport_opt_in, true) = true
        AND COALESCE(sp.study_mode, 'OFFLINE') <> 'ONLINE'
        AND (${allowHybridStudents} OR COALESCE(sp.study_mode, 'OFFLINE') <> 'HYBRID')
    `;
    return rows.map((row) => row.vehicle_id);
  }

  if (!context.guardianProfileId) return [];
  const rows = await prisma.$queryRaw<Array<{ vehicle_id: string }>>`
    SELECT DISTINCT a.vehicle_id
    FROM campusos_transport.student_assignments a
    JOIN public.students s ON s.id = a.student_id AND s.tenant_id = a.tenant_id
    LEFT JOIN campusos_transport.student_profiles sp ON sp.student_id = a.student_id
    WHERE a.tenant_id = ${context.tenantId}::uuid
      AND s.guardian_id = ${context.guardianProfileId}::uuid
      AND a.active = true
      AND a.vehicle_id IS NOT NULL
      AND COALESCE(sp.transport_opt_in, true) = true
      AND COALESCE(sp.study_mode, 'OFFLINE') <> 'ONLINE'
      AND (${allowHybridStudents} OR COALESCE(sp.study_mode, 'OFFLINE') <> 'HYBRID')
  `;
  return rows.map((row) => row.vehicle_id);
}

async function readJourneyRows(tenantId: string, vehicleIds: string[] | null): Promise<JourneyRow[]> {
  if (vehicleIds && vehicleIds.length === 0) return [];
  try {
    if (vehicleIds) {
      return prisma.$queryRaw<JourneyRow[]>(Prisma.sql`
        SELECT vehicle_id, route_id, service_date, trip_started_at, next_stop_id, last_stop_id,
               distance_to_next_m, eta_minutes, predicted_arrival_at, delay_minutes,
               journey_status, updated_at
        FROM campusos_transport.vehicle_trip_state
        WHERE tenant_id = ${tenantId}::uuid
          AND vehicle_id IN (${Prisma.join(vehicleIds.map((id) => Prisma.sql`${id}::uuid`))})
        ORDER BY updated_at DESC
      `);
    }
    return prisma.$queryRaw<JourneyRow[]>`
      SELECT vehicle_id, route_id, service_date, trip_started_at, next_stop_id, last_stop_id,
             distance_to_next_m, eta_minutes, predicted_arrival_at, delay_minutes,
             journey_status, updated_at
      FROM campusos_transport.vehicle_trip_state
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY updated_at DESC
    `;
  } catch {
    return [];
  }
}

async function journeysFor(tenantId: string, vehicleIds: string[] | null): Promise<TransportJourneyInsight[]> {
  const [rows, stops] = await Promise.all([readJourneyRows(tenantId, vehicleIds), readTransportStops(tenantId)]);
  const stopsById = new Map(stops.map((stop) => [stop.id, stop]));
  return rows.map((row) => ({
    vehicleId: row.vehicle_id,
    routeId: row.route_id,
    serviceDate: row.service_date instanceof Date ? row.service_date.toISOString().slice(0, 10) : String(row.service_date).slice(0, 10),
    tripStartedAt: new Date(row.trip_started_at).toISOString(),
    nextStop: row.next_stop_id ? stopsById.get(row.next_stop_id) ?? null : null,
    lastStop: row.last_stop_id ? stopsById.get(row.last_stop_id) ?? null : null,
    distanceToNextM: row.distance_to_next_m,
    etaMinutes: row.eta_minutes,
    predictedArrivalAt: row.predicted_arrival_at ? new Date(row.predicted_arrival_at).toISOString() : null,
    delayMinutes: row.delay_minutes,
    status: row.journey_status,
    updatedAt: new Date(row.updated_at).toISOString(),
  }));
}

export async function getTransportPhase2LiveData(): Promise<TransportPhase2LiveData> {
  const context = await requireActiveUserContext();
  if (!PHASE2_VIEWER_ROLES.has(context.activeRole)) throw new TransportPhase2Error('Transport ETA access is not available for this role.', 403);
  const state = await readTransportPhase2Settings(context.tenantId);
  if (!state.storeReady || !state.moduleEnabled) {
    return { generatedAt: new Date().toISOString(), enabled: false, settings: state.settings, journeys: [] };
  }
  const vehicleIds = await allowedVehicleIds(context, state.allowHybridStudents);
  return {
    generatedAt: new Date().toISOString(),
    enabled: true,
    settings: state.settings,
    journeys: await journeysFor(context.tenantId, vehicleIds),
  };
}

function requireInstitutionAdmin(context: ActiveUserContext) {
  if (context.activeRole !== 'INSTITUTION_ADMIN') throw new TransportPhase2Error('Institution Administrator access is required.', 403);
}

export async function getTransportPhase2AdminData(): Promise<TransportPhase2AdminData> {
  const context = await requireActiveUserContext();
  requireInstitutionAdmin(context);
  const state = await readTransportPhase2Settings(context.tenantId);
  const [routes, stops, journeys] = await Promise.all([
    prisma.transportRoute.findMany({ where: { tenantId: context.tenantId }, orderBy: { routeName: 'asc' }, select: { id: true, routeName: true } }),
    readTransportStops(context.tenantId),
    journeysFor(context.tenantId, null),
  ]);
  return {
    generatedAt: new Date().toISOString(),
    enabled: state.moduleEnabled,
    settings: state.settings,
    journeys,
    routes: routes.map((route) => ({ ...route, stops: stops.filter((stop) => stop.routeId === route.id) })),
    metrics: {
      configuredRoutes: new Set(stops.map((stop) => stop.routeId)).size,
      configuredStops: stops.length,
      activeJourneys: journeys.filter((journey) => journey.status !== 'COMPLETED' && journey.status !== 'NO_STOPS').length,
      delayedJourneys: journeys.filter((journey) => journey.status === 'DELAYED').length,
    },
  };
}

export async function updateTransportPhase2Settings(input: Partial<TransportPhase2Settings>) {
  const context = await requireActiveUserContext();
  requireInstitutionAdmin(context);
  const state = await readTransportPhase2Settings(context.tenantId);
  if (!state.storeReady) throw new TransportPhase2Error('Transport storage is not provisioned yet.', 503);
  const next = { ...state.settings, ...input };
  await prisma.$executeRaw`
    INSERT INTO campusos_transport.settings
      (tenant_id, parent_eta_alerts_enabled, parent_email_alerts_enabled,
       eta_alert_lead_minutes, eta_default_speed_kph, updated_by, created_at, updated_at)
    VALUES
      (${context.tenantId}::uuid, ${next.parentEtaAlertsEnabled}, ${next.parentEmailAlertsEnabled},
       ${next.etaAlertLeadMinutes}, ${next.etaDefaultSpeedKph}, ${context.userId}::uuid, now(), now())
    ON CONFLICT (tenant_id) DO UPDATE SET
      parent_eta_alerts_enabled = EXCLUDED.parent_eta_alerts_enabled,
      parent_email_alerts_enabled = EXCLUDED.parent_email_alerts_enabled,
      eta_alert_lead_minutes = EXCLUDED.eta_alert_lead_minutes,
      eta_default_speed_kph = EXCLUDED.eta_default_speed_kph,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
  await prisma.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: 'TRANSPORT_PHASE2_SETTINGS_UPDATED', entity: 'TransportGPS', diffJson: JSON.stringify(next) } });
  return next;
}

export async function createTransportRouteStop(input: {
  routeId: string;
  name: string;
  sequenceNo: number;
  latitude: number;
  longitude: number;
  geofenceRadiusM: number;
  plannedOffsetMinutes: number;
}) {
  const context = await requireActiveUserContext();
  requireInstitutionAdmin(context);
  const route = await prisma.transportRoute.findFirst({ where: { id: input.routeId, tenantId: context.tenantId }, select: { id: true } });
  if (!route) throw new TransportPhase2Error('Selected route is not available in this institution.', 404);
  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_transport.route_stops
        (id, tenant_id, route_id, name, sequence_no, latitude, longitude,
         geofence_radius_m, planned_offset_minutes, is_active, created_at, updated_at)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${input.routeId}::uuid, ${input.name}, ${input.sequenceNo},
         ${input.latitude}, ${input.longitude}, ${input.geofenceRadiusM}, ${input.plannedOffsetMinutes}, true, now(), now())
    `;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2010') {
      throw new TransportPhase2Error('Unable to add this stop. Check that the route sequence number is unique.', 409);
    }
    throw error;
  }
  await prisma.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: 'TRANSPORT_STOP_CREATED', entity: 'TransportGPS', diffJson: JSON.stringify({ id, ...input }) } });
  return { id };
}

export async function deleteTransportRouteStop(stopId: string) {
  const context = await requireActiveUserContext();
  requireInstitutionAdmin(context);
  const affected = await prisma.$executeRaw`
    UPDATE campusos_transport.route_stops
    SET is_active = false, updated_at = now()
    WHERE id = ${stopId}::uuid AND tenant_id = ${context.tenantId}::uuid AND is_active = true
  `;
  if (!affected) throw new TransportPhase2Error('Route stop not found.', 404);
  await prisma.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: 'TRANSPORT_STOP_DISABLED', entity: 'TransportGPS', diffJson: JSON.stringify({ stopId }) } });
}
