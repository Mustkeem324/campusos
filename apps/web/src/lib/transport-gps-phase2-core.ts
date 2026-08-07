import 'server-only';

import { randomUUID } from 'node:crypto';

import { prisma } from './db';
import type { TransportJourneyInsight, TransportPhase2Settings, TransportRouteStop } from './transport-gps-phase2-types';

export const DEFAULT_PHASE2_SETTINGS: TransportPhase2Settings = {
  parentEtaAlertsEnabled: true,
  parentEmailAlertsEnabled: false,
  etaAlertLeadMinutes: 10,
  etaDefaultSpeedKph: 25,
};

type SettingsRow = {
  enabled: boolean;
  allow_hybrid_students: boolean;
  parent_eta_alerts_enabled: boolean;
  parent_email_alerts_enabled: boolean;
  eta_alert_lead_minutes: number;
  eta_default_speed_kph: number;
};

type StopRow = {
  id: string;
  route_id: string;
  route_name: string;
  name: string;
  sequence_no: number;
  latitude: number;
  longitude: number;
  geofence_radius_m: number;
  planned_offset_minutes: number;
};

type VehicleRouteRow = {
  id: string;
  tenant_id: string;
  route_id: string | null;
  route_name: string | null;
};

type TripStateRow = {
  service_date: Date | string;
  trip_started_at: Date;
  next_stop_id: string | null;
  journey_status: string;
};

type GuardianRecipient = {
  user_id: string;
  email: string;
};

export type TransportPhase2SettingsState = {
  storeReady: boolean;
  moduleEnabled: boolean;
  allowHybridStudents: boolean;
  settings: TransportPhase2Settings;
};

export async function readTransportPhase2Settings(tenantId: string): Promise<TransportPhase2SettingsState> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT enabled, allow_hybrid_students, parent_eta_alerts_enabled,
             parent_email_alerts_enabled, eta_alert_lead_minutes, eta_default_speed_kph
      FROM campusos_transport.settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    const row = rows[0];
    return {
      storeReady: true,
      moduleEnabled: row?.enabled ?? false,
      allowHybridStudents: row?.allow_hybrid_students ?? true,
      settings: row ? {
        parentEtaAlertsEnabled: row.parent_eta_alerts_enabled,
        parentEmailAlertsEnabled: row.parent_email_alerts_enabled,
        etaAlertLeadMinutes: row.eta_alert_lead_minutes,
        etaDefaultSpeedKph: row.eta_default_speed_kph,
      } : DEFAULT_PHASE2_SETTINGS,
    };
  } catch (error) {
    console.error('Transport Phase 2 storage is unavailable:', error);
    return { storeReady: false, moduleEnabled: false, allowHybridStudents: true, settings: DEFAULT_PHASE2_SETTINGS };
  }
}

export async function readTransportStops(tenantId: string, routeId?: string): Promise<TransportRouteStop[]> {
  try {
    const rows = routeId
      ? await prisma.$queryRaw<StopRow[]>`
          SELECT s.id, s.route_id, r."routeName" AS route_name, s.name, s.sequence_no,
                 s.latitude, s.longitude, s.geofence_radius_m, s.planned_offset_minutes
          FROM campusos_transport.route_stops s
          JOIN public.transport_routes r ON r.id = s.route_id AND r.tenant_id = s.tenant_id
          WHERE s.tenant_id = ${tenantId}::uuid AND s.route_id = ${routeId}::uuid AND s.is_active = true
          ORDER BY s.sequence_no ASC
        `
      : await prisma.$queryRaw<StopRow[]>`
          SELECT s.id, s.route_id, r."routeName" AS route_name, s.name, s.sequence_no,
                 s.latitude, s.longitude, s.geofence_radius_m, s.planned_offset_minutes
          FROM campusos_transport.route_stops s
          JOIN public.transport_routes r ON r.id = s.route_id AND r.tenant_id = s.tenant_id
          WHERE s.tenant_id = ${tenantId}::uuid AND s.is_active = true
          ORDER BY r."routeName" ASC, s.sequence_no ASC
        `;
    return rows.map((row) => ({
      id: row.id,
      routeId: row.route_id,
      routeName: row.route_name,
      name: row.name,
      sequenceNo: row.sequence_no,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      geofenceRadiusM: row.geofence_radius_m,
      plannedOffsetMinutes: row.planned_offset_minutes,
    }));
  } catch {
    return [];
  }
}

export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusM = 6_371_000;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

export function estimateEtaMinutes(distanceM: number, speedKph: number | null | undefined, fallbackSpeedKph: number): number {
  if (distanceM <= 0) return 0;
  const candidate = speedKph && speedKph >= 5 ? speedKph : fallbackSpeedKph;
  const safeSpeed = Math.max(5, Math.min(100, candidate));
  return Math.max(1, Math.min(180, Math.ceil(((distanceM * 1.18) / 1000 / safeSpeed) * 60)));
}

function serviceDate(value: Date): string {
  return value.toISOString().slice(0, 10);
}

async function guardianRecipients(tenantId: string, vehicleId: string, allowHybridStudents: boolean): Promise<GuardianRecipient[]> {
  return prisma.$queryRaw<GuardianRecipient[]>`
    SELECT DISTINCT u.id AS user_id, u.email
    FROM campusos_transport.student_assignments a
    JOIN public.students s ON s.id = a.student_id AND s.tenant_id = a.tenant_id
    JOIN public.guardians g ON g.id = s.guardian_id AND g.tenant_id = s.tenant_id
    JOIN public.users u ON u.id = g.user_id AND u.tenant_id = s.tenant_id
    LEFT JOIN campusos_transport.student_profiles sp ON sp.student_id = s.id
    WHERE a.tenant_id = ${tenantId}::uuid
      AND a.vehicle_id = ${vehicleId}::uuid
      AND a.active = true
      AND u."isActive" = true
      AND COALESCE(sp.transport_opt_in, true) = true
      AND COALESCE(sp.study_mode, 'OFFLINE') <> 'ONLINE'
      AND (${allowHybridStudents} OR COALESCE(sp.study_mode, 'OFFLINE') <> 'HYBRID')
  `;
}

async function sendParentAlerts(input: {
  tenantId: string;
  vehicle: VehicleRouteRow;
  stop: TransportRouteStop;
  serviceDate: string;
  kind: 'ETA_NEAR_STOP' | 'STOP_ARRIVAL';
  etaMinutes: number | null;
  settings: TransportPhase2Settings;
  allowHybridStudents: boolean;
}) {
  if (!input.settings.parentEtaAlertsEnabled) return;
  const recipients = await guardianRecipients(input.tenantId, input.vehicle.id, input.allowHybridStudents);
  for (const recipient of recipients) {
    const inserted = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO campusos_transport.parent_alert_events
        (id, tenant_id, guardian_user_id, vehicle_id, stop_id, service_date, alert_kind, eta_minutes, sent_at)
      VALUES
        (${randomUUID()}::uuid, ${input.tenantId}::uuid, ${recipient.user_id}::uuid, ${input.vehicle.id}::uuid,
         ${input.stop.id}::uuid, ${input.serviceDate}::date, ${input.kind}, ${input.etaMinutes}, now())
      ON CONFLICT (guardian_user_id, vehicle_id, stop_id, service_date, alert_kind) DO NOTHING
      RETURNING id
    `;
    if (!inserted[0]) continue;

    const isArrival = input.kind === 'STOP_ARRIVAL';
    const title = isArrival ? `Bus reached ${input.stop.name}` : `Bus approaching ${input.stop.name}`;
    const body = isArrival
      ? `${input.vehicle.route_name ?? 'Your campus route'} has reached ${input.stop.name}.`
      : `${input.vehicle.route_name ?? 'Your campus route'} is approximately ${input.etaMinutes ?? 'a few'} minutes from ${input.stop.name}.`;

    await prisma.notification.create({
      data: { tenantId: input.tenantId, userId: recipient.user_id, title, body, type: 'TRANSPORT_ETA', actionUrl: '/transport' },
    });

    if (input.settings.parentEmailAlertsEnabled) {
      await prisma.emailQueue.create({
        data: {
          tenantId: input.tenantId,
          to: recipient.email,
          subject: `${title} | CampusOS Transport`,
          body: `${body}\n\nThis automated alert is based on the latest GPS telemetry and may change with traffic conditions.`,
          type: 'TRANSPORT_ETA',
          status: 'PENDING',
        },
      });
    }
  }
}

export async function processTransportPhase2Telemetry(input: {
  tenantId: string;
  vehicleId: string;
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  recordedAt: Date;
}) {
  const state = await readTransportPhase2Settings(input.tenantId);
  if (!state.storeReady || !state.moduleEnabled) return null;

  const vehicles = await prisma.$queryRaw<VehicleRouteRow[]>`
    SELECT v.id, v.tenant_id, v.route_id, r."routeName" AS route_name
    FROM campusos_transport.vehicles v
    LEFT JOIN public.transport_routes r ON r.id = v.route_id AND r.tenant_id = v.tenant_id
    WHERE v.id = ${input.vehicleId}::uuid AND v.tenant_id = ${input.tenantId}::uuid AND v.is_active = true
    LIMIT 1
  `;
  const vehicle = vehicles[0];
  if (!vehicle?.route_id) return null;

  const stops = await readTransportStops(input.tenantId, vehicle.route_id);
  const day = serviceDate(input.recordedAt);
  if (stops.length === 0) {
    await prisma.$executeRaw`
      INSERT INTO campusos_transport.vehicle_trip_state
        (vehicle_id, tenant_id, route_id, service_date, trip_started_at, journey_status, updated_at)
      VALUES (${vehicle.id}::uuid, ${input.tenantId}::uuid, ${vehicle.route_id}::uuid, ${day}::date, ${input.recordedAt}, 'NO_STOPS', now())
      ON CONFLICT (vehicle_id) DO UPDATE SET route_id = EXCLUDED.route_id, service_date = EXCLUDED.service_date,
        trip_started_at = CASE WHEN campusos_transport.vehicle_trip_state.service_date = EXCLUDED.service_date THEN campusos_transport.vehicle_trip_state.trip_started_at ELSE EXCLUDED.trip_started_at END,
        next_stop_id = NULL, last_stop_id = NULL, distance_to_next_m = NULL, eta_minutes = NULL,
        predicted_arrival_at = NULL, delay_minutes = NULL, journey_status = 'NO_STOPS', updated_at = now()
    `;
    return { status: 'NO_STOPS' as const };
  }

  const tripRows = await prisma.$queryRaw<TripStateRow[]>`
    SELECT service_date, trip_started_at, next_stop_id, journey_status
    FROM campusos_transport.vehicle_trip_state
    WHERE vehicle_id = ${vehicle.id}::uuid
    LIMIT 1
  `;
  const current = tripRows[0];
  const currentDay = current?.service_date instanceof Date ? current.service_date.toISOString().slice(0, 10) : current?.service_date ? String(current.service_date).slice(0, 10) : null;
  const continuing = Boolean(current && currentDay === day && current.journey_status !== 'COMPLETED');
  const tripStartedAt = continuing && current ? new Date(current.trip_started_at) : input.recordedAt;
  let stop = continuing && current?.next_stop_id ? stops.find((item) => item.id === current.next_stop_id) ?? stops[0] : stops[0];

  let distanceM = haversineDistanceMeters(input.latitude, input.longitude, stop.latitude, stop.longitude);
  let etaMinutes = estimateEtaMinutes(distanceM, input.speedKph, state.settings.etaDefaultSpeedKph);
  let lastStopId: string | null = null;
  let status: TransportJourneyInsight['status'] = 'ON_TIME';

  if (distanceM <= stop.geofenceRadiusM) {
    await prisma.$executeRaw`
      INSERT INTO campusos_transport.stop_events
        (id, tenant_id, vehicle_id, route_id, stop_id, service_date, event_type, distance_m, occurred_at, created_at)
      VALUES (${randomUUID()}::uuid, ${input.tenantId}::uuid, ${vehicle.id}::uuid, ${vehicle.route_id}::uuid,
              ${stop.id}::uuid, ${day}::date, 'ARRIVED', ${distanceM}, ${input.recordedAt}, now())
      ON CONFLICT (vehicle_id, stop_id, service_date, event_type) DO NOTHING
    `;
    await sendParentAlerts({ tenantId: input.tenantId, vehicle, stop, serviceDate: day, kind: 'STOP_ARRIVAL', etaMinutes: 0, settings: state.settings, allowHybridStudents: state.allowHybridStudents });
    lastStopId = stop.id;
    const next = stops.find((item) => item.sequenceNo > stop.sequenceNo);
    if (!next) {
      await prisma.$executeRaw`
        INSERT INTO campusos_transport.vehicle_trip_state
          (vehicle_id, tenant_id, route_id, service_date, trip_started_at, next_stop_id, last_stop_id,
           distance_to_next_m, eta_minutes, predicted_arrival_at, delay_minutes, journey_status, updated_at)
        VALUES (${vehicle.id}::uuid, ${input.tenantId}::uuid, ${vehicle.route_id}::uuid, ${day}::date, ${tripStartedAt},
                NULL, ${stop.id}::uuid, NULL, NULL, NULL, 0, 'COMPLETED', now())
        ON CONFLICT (vehicle_id) DO UPDATE SET service_date = EXCLUDED.service_date,
          trip_started_at = EXCLUDED.trip_started_at, next_stop_id = NULL, last_stop_id = EXCLUDED.last_stop_id,
          distance_to_next_m = NULL, eta_minutes = NULL, predicted_arrival_at = NULL,
          delay_minutes = 0, journey_status = 'COMPLETED', updated_at = now()
      `;
      return { status: 'COMPLETED' as const, arrivedStopId: stop.id };
    }
    stop = next;
    distanceM = haversineDistanceMeters(input.latitude, input.longitude, stop.latitude, stop.longitude);
    etaMinutes = estimateEtaMinutes(distanceM, input.speedKph, state.settings.etaDefaultSpeedKph);
    status = 'AT_STOP';
  }

  const predictedArrivalAt = new Date(input.recordedAt.getTime() + etaMinutes * 60_000);
  const plannedArrivalAt = new Date(tripStartedAt.getTime() + stop.plannedOffsetMinutes * 60_000);
  const delayMinutes = Math.max(-120, Math.min(240, Math.round((predictedArrivalAt.getTime() - plannedArrivalAt.getTime()) / 60_000)));
  if (status !== 'AT_STOP') status = delayMinutes > 5 ? 'DELAYED' : 'ON_TIME';

  await prisma.$executeRaw`
    INSERT INTO campusos_transport.vehicle_trip_state
      (vehicle_id, tenant_id, route_id, service_date, trip_started_at, next_stop_id, last_stop_id,
       distance_to_next_m, eta_minutes, predicted_arrival_at, delay_minutes, journey_status, updated_at)
    VALUES (${vehicle.id}::uuid, ${input.tenantId}::uuid, ${vehicle.route_id}::uuid, ${day}::date, ${tripStartedAt},
            ${stop.id}::uuid, ${lastStopId}::uuid, ${distanceM}, ${etaMinutes}, ${predictedArrivalAt}, ${delayMinutes}, ${status}, now())
    ON CONFLICT (vehicle_id) DO UPDATE SET
      tenant_id = EXCLUDED.tenant_id, route_id = EXCLUDED.route_id, service_date = EXCLUDED.service_date,
      trip_started_at = CASE WHEN campusos_transport.vehicle_trip_state.service_date = EXCLUDED.service_date THEN campusos_transport.vehicle_trip_state.trip_started_at ELSE EXCLUDED.trip_started_at END,
      next_stop_id = EXCLUDED.next_stop_id,
      last_stop_id = CASE WHEN campusos_transport.vehicle_trip_state.service_date = EXCLUDED.service_date THEN COALESCE(EXCLUDED.last_stop_id, campusos_transport.vehicle_trip_state.last_stop_id) ELSE EXCLUDED.last_stop_id END,
      distance_to_next_m = EXCLUDED.distance_to_next_m, eta_minutes = EXCLUDED.eta_minutes,
      predicted_arrival_at = EXCLUDED.predicted_arrival_at, delay_minutes = EXCLUDED.delay_minutes,
      journey_status = EXCLUDED.journey_status, updated_at = now()
  `;

  if (etaMinutes <= state.settings.etaAlertLeadMinutes) {
    await sendParentAlerts({ tenantId: input.tenantId, vehicle, stop, serviceDate: day, kind: 'ETA_NEAR_STOP', etaMinutes, settings: state.settings, allowHybridStudents: state.allowHybridStudents });
  }

  return { status, nextStopId: stop.id, distanceM, etaMinutes, delayMinutes, predictedArrivalAt: predictedArrivalAt.toISOString() };
}
