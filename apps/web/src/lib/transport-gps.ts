import 'server-only';

import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { Prisma, type RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import type {
  StudentStudyMode,
  TransportAdminData,
  TransportAvailability,
  TransportModuleSettings,
  TransportRider,
  TransportVehicle,
  TransportWorkspaceData,
} from './transport-gps-types';

const DEFAULT_SETTINGS: TransportModuleSettings = {
  enabled: false,
  gpsTrackingEnabled: true,
  allowHybridStudents: true,
  telemetryStaleSeconds: 180,
};

const VIEWER_ROLES = new Set<RoleType>(['STUDENT', 'PARENT', 'TRANSPORT_MANAGER', 'INSTITUTION_ADMIN']);
const OPERATOR_ROLES = new Set<RoleType>(['TRANSPORT_MANAGER', 'INSTITUTION_ADMIN']);

export class TransportError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'TransportError';
    this.status = status;
  }
}

type SettingsRow = {
  enabled: boolean;
  gps_tracking_enabled: boolean;
  allow_hybrid_students: boolean;
  telemetry_stale_seconds: number;
};

type StudentProfileRow = {
  student_id: string;
  study_mode: string;
  transport_opt_in: boolean;
};

type AssignmentRow = {
  student_id: string;
  route_id: string;
  route_name: string;
  vehicle_id: string | null;
};

type FleetRow = {
  id: string;
  label: string;
  registration_number: string;
  driver_name: string | null;
  driver_phone: string | null;
  status: string;
  route_id: string | null;
  route_name: string | null;
  last_seen_at: Date | null;
  latitude: number | null;
  longitude: number | null;
  speed_kph: number | null;
  heading_degrees: number | null;
  accuracy_meters: number | null;
  recorded_at: Date | null;
  received_at: Date | null;
};

type DeviceRow = {
  id: string;
  tenant_id: string;
  is_active: boolean;
  status: string;
  module_enabled: boolean;
  gps_enabled: boolean;
};

function normalizeStudyMode(value: string | null | undefined): StudentStudyMode {
  if (value === 'ONLINE' || value === 'HYBRID') return value;
  return 'OFFLINE';
}

function settingsFromRow(row?: SettingsRow): TransportModuleSettings {
  if (!row) return DEFAULT_SETTINGS;
  return {
    enabled: row.enabled,
    gpsTrackingEnabled: row.gps_tracking_enabled,
    allowHybridStudents: row.allow_hybrid_students,
    telemetryStaleSeconds: row.telemetry_stale_seconds,
  };
}

function studentEligible(settings: TransportModuleSettings, studyMode: StudentStudyMode, transportOptIn: boolean) {
  if (studyMode === 'ONLINE') return false;
  if (studyMode === 'HYBRID' && !settings.allowHybridStudents) return false;
  return transportOptIn;
}

function studentAvailability(
  storeReady: boolean,
  settings: TransportModuleSettings,
  studyMode: StudentStudyMode,
  transportOptIn: boolean,
): TransportAvailability {
  if (!storeReady) {
    return { storeReady: false, visible: false, enabled: false, eligible: false, reason: 'STORE_UNAVAILABLE', studyMode };
  }
  if (!settings.enabled) {
    return { storeReady: true, visible: false, enabled: false, eligible: false, reason: 'MODULE_DISABLED', studyMode };
  }
  if (studyMode === 'ONLINE') {
    return { storeReady: true, visible: false, enabled: true, eligible: false, reason: 'ONLINE_ONLY', studyMode };
  }
  if (studyMode === 'HYBRID' && !settings.allowHybridStudents) {
    return { storeReady: true, visible: false, enabled: true, eligible: false, reason: 'HYBRID_DISABLED', studyMode };
  }
  if (!transportOptIn) {
    return { storeReady: true, visible: false, enabled: true, eligible: false, reason: 'NOT_OPTED_IN', studyMode };
  }
  return {
    storeReady: true,
    visible: true,
    enabled: true,
    eligible: true,
    reason: settings.gpsTrackingEnabled ? 'AVAILABLE' : 'GPS_DISABLED',
    studyMode,
  };
}

async function readSettings(tenantId: string): Promise<{ storeReady: boolean; settings: TransportModuleSettings }> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT enabled, gps_tracking_enabled, allow_hybrid_students, telemetry_stale_seconds
      FROM campusos_transport.settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return { storeReady: true, settings: settingsFromRow(rows[0]) };
  } catch (error) {
    console.error('Transport GPS storage is unavailable:', error);
    return { storeReady: false, settings: DEFAULT_SETTINGS };
  }
}

async function readStudentProfiles(tenantId: string) {
  try {
    const rows = await prisma.$queryRaw<StudentProfileRow[]>`
      SELECT student_id, study_mode, transport_opt_in
      FROM campusos_transport.student_profiles
      WHERE tenant_id = ${tenantId}::uuid
    `;
    return new Map(rows.map((row) => [row.student_id, row]));
  } catch {
    return new Map<string, StudentProfileRow>();
  }
}

async function readAssignments(tenantId: string) {
  try {
    const rows = await prisma.$queryRaw<AssignmentRow[]>`
      SELECT a.student_id, a.route_id, r."routeName" AS route_name, a.vehicle_id
      FROM campusos_transport.student_assignments a
      JOIN public.transport_routes r
        ON r.id = a.route_id AND r.tenant_id = a.tenant_id
      WHERE a.tenant_id = ${tenantId}::uuid AND a.active = true
    `;
    return new Map(rows.map((row) => [row.student_id, row]));
  } catch {
    return new Map<string, AssignmentRow>();
  }
}

async function readFleet(tenantId: string, staleSeconds: number): Promise<TransportVehicle[]> {
  try {
    const rows = await prisma.$queryRaw<FleetRow[]>`
      SELECT
        v.id,
        v.label,
        v.registration_number,
        v.driver_name,
        v.driver_phone,
        v.status,
        v.route_id,
        r."routeName" AS route_name,
        v.last_seen_at,
        p.latitude,
        p.longitude,
        p.speed_kph,
        p.heading_degrees,
        p.accuracy_meters,
        p.recorded_at,
        p.received_at
      FROM campusos_transport.vehicles v
      LEFT JOIN public.transport_routes r
        ON r.id = v.route_id AND r.tenant_id = v.tenant_id
      LEFT JOIN LATERAL (
        SELECT latitude, longitude, speed_kph, heading_degrees, accuracy_meters, recorded_at, received_at
        FROM campusos_transport.gps_positions gp
        WHERE gp.vehicle_id = v.id
        ORDER BY gp.recorded_at DESC, gp.received_at DESC
        LIMIT 1
      ) p ON true
      WHERE v.tenant_id = ${tenantId}::uuid AND v.is_active = true
      ORDER BY v.label ASC
    `;

    const now = Date.now();
    return rows.map((row) => {
      const recordedAt = row.recorded_at ? new Date(row.recorded_at) : null;
      return {
        id: row.id,
        label: row.label,
        registrationNumber: row.registration_number,
        driverName: row.driver_name,
        driverPhone: row.driver_phone,
        status: row.status,
        routeId: row.route_id,
        routeName: row.route_name,
        lastSeenAt: row.last_seen_at ? new Date(row.last_seen_at).toISOString() : null,
        latestPosition: recordedAt && row.latitude !== null && row.longitude !== null
          ? {
              latitude: Number(row.latitude),
              longitude: Number(row.longitude),
              speedKph: row.speed_kph === null ? null : Number(row.speed_kph),
              headingDegrees: row.heading_degrees === null ? null : Number(row.heading_degrees),
              accuracyMeters: row.accuracy_meters === null ? null : Number(row.accuracy_meters),
              recordedAt: recordedAt.toISOString(),
              receivedAt: row.received_at ? new Date(row.received_at).toISOString() : recordedAt.toISOString(),
              stale: now - recordedAt.getTime() > staleSeconds * 1000,
            }
          : null,
      };
    });
  } catch (error) {
    console.error('Unable to read transport fleet:', error);
    return [];
  }
}

async function institutionName(tenantId: string) {
  const institution = await prisma.institution.findUnique({ where: { id: tenantId }, select: { name: true } });
  return institution?.name ?? 'CampusOS Institution';
}

async function studentRowsForIds(tenantId: string, ids?: string[]) {
  return prisma.student.findMany({
    where: {
      tenantId,
      ...(ids ? { id: { in: ids } } : {}),
    },
    orderBy: [{ rollNumber: 'asc' }],
    select: {
      id: true,
      rollNumber: true,
      user: { select: { name: true, email: true } },
      section: { select: { name: true } },
      batch: { select: { program: { select: { name: true } } } },
    },
  });
}

function riderFromStudent(
  student: Awaited<ReturnType<typeof studentRowsForIds>>[number],
  settings: TransportModuleSettings,
  profiles: Map<string, StudentProfileRow>,
  assignments: Map<string, AssignmentRow>,
  fleetById: Map<string, TransportVehicle>,
): TransportRider {
  const profile = profiles.get(student.id);
  const studyMode = normalizeStudyMode(profile?.study_mode);
  const transportOptIn = profile?.transport_opt_in ?? studyMode !== 'ONLINE';
  const eligible = studentEligible(settings, studyMode, transportOptIn);
  const assignment = eligible ? assignments.get(student.id) : undefined;
  const vehicle = assignment?.vehicle_id ? fleetById.get(assignment.vehicle_id) ?? null : null;

  return {
    studentId: student.id,
    name: student.user.name,
    rollNumber: student.rollNumber,
    programme: student.batch.program.name,
    section: student.section?.name ?? null,
    studyMode,
    transportOptIn,
    eligible,
    routeId: assignment?.route_id ?? null,
    routeName: assignment?.route_name ?? null,
    vehicleId: assignment?.vehicle_id ?? null,
    vehicle,
  };
}

export async function getTransportAvailability(contextInput?: ActiveUserContext): Promise<TransportAvailability> {
  const context = contextInput ?? await requireActiveUserContext();
  if (!VIEWER_ROLES.has(context.activeRole)) {
    return { storeReady: true, visible: false, enabled: false, eligible: false, reason: 'ROLE_NOT_SUPPORTED', studyMode: null };
  }

  const { storeReady, settings } = await readSettings(context.tenantId);
  if (context.activeRole === 'INSTITUTION_ADMIN') {
    return {
      storeReady,
      visible: true,
      enabled: settings.enabled,
      eligible: true,
      reason: storeReady ? (settings.enabled ? (settings.gpsTrackingEnabled ? 'AVAILABLE' : 'GPS_DISABLED') : 'MODULE_DISABLED') : 'STORE_UNAVAILABLE',
      studyMode: null,
    };
  }
  if (context.activeRole === 'TRANSPORT_MANAGER') {
    return {
      storeReady,
      visible: storeReady && settings.enabled,
      enabled: settings.enabled,
      eligible: storeReady && settings.enabled,
      reason: !storeReady ? 'STORE_UNAVAILABLE' : !settings.enabled ? 'MODULE_DISABLED' : settings.gpsTrackingEnabled ? 'AVAILABLE' : 'GPS_DISABLED',
      studyMode: null,
    };
  }

  const profiles = await readStudentProfiles(context.tenantId);
  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) throw new TransportError('Student profile is unavailable.', 403);
    const profile = profiles.get(context.studentProfileId);
    const studyMode = normalizeStudyMode(profile?.study_mode);
    return studentAvailability(storeReady, settings, studyMode, profile?.transport_opt_in ?? studyMode !== 'ONLINE');
  }

  if (!context.guardianProfileId) throw new TransportError('Guardian profile is unavailable.', 403);
  const wards = await prisma.student.findMany({
    where: { tenantId: context.tenantId, guardianId: context.guardianProfileId },
    select: { id: true },
  });
  if (!storeReady) {
    return { storeReady: false, visible: false, enabled: false, eligible: false, reason: 'STORE_UNAVAILABLE', studyMode: null };
  }
  if (!settings.enabled) {
    return { storeReady: true, visible: false, enabled: false, eligible: false, reason: 'MODULE_DISABLED', studyMode: null };
  }

  let hasHybridDisabled = false;
  let hasNotOptedIn = false;
  for (const ward of wards) {
    const profile = profiles.get(ward.id);
    const studyMode = normalizeStudyMode(profile?.study_mode);
    const optIn = profile?.transport_opt_in ?? studyMode !== 'ONLINE';
    if (studentEligible(settings, studyMode, optIn)) {
      return {
        storeReady: true,
        visible: true,
        enabled: true,
        eligible: true,
        reason: settings.gpsTrackingEnabled ? 'AVAILABLE' : 'GPS_DISABLED',
        studyMode: null,
      };
    }
    if (studyMode === 'HYBRID' && !settings.allowHybridStudents) hasHybridDisabled = true;
    if (studyMode !== 'ONLINE' && !optIn) hasNotOptedIn = true;
  }

  return {
    storeReady: true,
    visible: false,
    enabled: true,
    eligible: false,
    reason: hasHybridDisabled ? 'HYBRID_DISABLED' : hasNotOptedIn ? 'NOT_OPTED_IN' : 'ONLINE_ONLY',
    studyMode: null,
  };
}

export async function getTransportWorkspaceData(): Promise<TransportWorkspaceData> {
  const context = await requireActiveUserContext();
  if (!VIEWER_ROLES.has(context.activeRole)) throw new TransportError('Transport workspace access is not available for this role.', 403);

  const [{ storeReady, settings }, name] = await Promise.all([
    readSettings(context.tenantId),
    institutionName(context.tenantId),
  ]);
  const profiles = storeReady ? await readStudentProfiles(context.tenantId) : new Map<string, StudentProfileRow>();
  const assignments = storeReady ? await readAssignments(context.tenantId) : new Map<string, AssignmentRow>();
  const fleet = storeReady ? await readFleet(context.tenantId, settings.telemetryStaleSeconds) : [];
  const fleetById = new Map(fleet.map((vehicle) => [vehicle.id, vehicle]));

  let studentIds: string[] | undefined;
  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) throw new TransportError('Student profile is unavailable.', 403);
    studentIds = [context.studentProfileId];
  } else if (context.activeRole === 'PARENT') {
    if (!context.guardianProfileId) throw new TransportError('Guardian profile is unavailable.', 403);
    const wards = await prisma.student.findMany({
      where: { tenantId: context.tenantId, guardianId: context.guardianProfileId },
      select: { id: true },
    });
    studentIds = wards.map((ward) => ward.id);
  }

  const students = studentIds ? await studentRowsForIds(context.tenantId, studentIds) : [];
  const riders = students.map((student) => riderFromStudent(student, settings, profiles, assignments, fleetById));
  const availability = context.activeRole === 'STUDENT' || context.activeRole === 'PARENT'
    ? await getTransportAvailability(context)
    : {
        storeReady,
        visible: storeReady && settings.enabled,
        enabled: settings.enabled,
        eligible: storeReady && settings.enabled,
        reason: !storeReady ? 'STORE_UNAVAILABLE' as const : !settings.enabled ? 'MODULE_DISABLED' as const : settings.gpsTrackingEnabled ? 'AVAILABLE' as const : 'GPS_DISABLED' as const,
        studyMode: null,
      };

  const allowedVehicleIds = new Set(riders.map((rider) => rider.vehicleId).filter((id): id is string => Boolean(id)));
  const exposedFleet = context.activeRole === 'STUDENT' || context.activeRole === 'PARENT'
    ? fleet.filter((vehicle) => allowedVehicleIds.has(vehicle.id))
    : fleet;

  return {
    generatedAt: new Date().toISOString(),
    institutionName: name,
    role: context.activeRole,
    settings,
    availability,
    riders,
    fleet: exposedFleet,
  };
}

export async function requireInstitutionTransportAdmin() {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'INSTITUTION_ADMIN') {
    throw new TransportError('Institution Administrator access is required.', 403);
  }
  return context;
}

export async function requireTransportOperator() {
  const context = await requireActiveUserContext();
  if (!OPERATOR_ROLES.has(context.activeRole)) throw new TransportError('Transport operator access is required.', 403);
  return context;
}

export async function getTransportAdminData(): Promise<TransportAdminData> {
  const context = await requireInstitutionTransportAdmin();
  const [{ storeReady, settings }, name, routes, students] = await Promise.all([
    readSettings(context.tenantId),
    institutionName(context.tenantId),
    prisma.transportRoute.findMany({ where: { tenantId: context.tenantId }, orderBy: { routeName: 'asc' }, select: { id: true, routeName: true } }),
    studentRowsForIds(context.tenantId),
  ]);

  const profiles = storeReady ? await readStudentProfiles(context.tenantId) : new Map<string, StudentProfileRow>();
  const assignments = storeReady ? await readAssignments(context.tenantId) : new Map<string, AssignmentRow>();
  const fleet = storeReady ? await readFleet(context.tenantId, settings.telemetryStaleSeconds) : [];
  const fleetById = new Map(fleet.map((vehicle) => [vehicle.id, vehicle]));
  const riders = students.map((student) => riderFromStudent(student, settings, profiles, assignments, fleetById));

  return {
    generatedAt: new Date().toISOString(),
    institutionName: name,
    settings,
    storeReady,
    routes,
    students: riders.map((rider) => {
      const source = students.find((student) => student.id === rider.studentId)!;
      return {
        studentId: rider.studentId,
        name: rider.name,
        email: source.user.email,
        rollNumber: rider.rollNumber,
        programme: rider.programme ?? 'Unassigned programme',
        section: rider.section,
        studyMode: rider.studyMode,
        transportOptIn: rider.transportOptIn,
        eligible: rider.eligible,
        routeId: rider.routeId,
        vehicleId: rider.vehicleId,
      };
    }),
    fleet,
    metrics: {
      totalStudents: riders.length,
      onlineStudents: riders.filter((rider) => rider.studyMode === 'ONLINE').length,
      offlineStudents: riders.filter((rider) => rider.studyMode === 'OFFLINE').length,
      hybridStudents: riders.filter((rider) => rider.studyMode === 'HYBRID').length,
      eligibleStudents: riders.filter((rider) => rider.eligible).length,
      assignedStudents: riders.filter((rider) => Boolean(rider.routeId)).length,
      vehicles: fleet.length,
      liveVehicles: fleet.filter((vehicle) => vehicle.latestPosition && !vehicle.latestPosition.stale).length,
      staleVehicles: fleet.filter((vehicle) => !vehicle.latestPosition || vehicle.latestPosition.stale).length,
    },
  };
}

async function writeAudit(context: ActiveUserContext, action: string, detail: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      action,
      entity: 'TransportGPS',
      diffJson: JSON.stringify(detail),
    },
  }).catch((error) => console.error('Unable to write transport audit event:', error));
}

export async function updateTransportSettings(input: Partial<TransportModuleSettings>) {
  const context = await requireInstitutionTransportAdmin();
  const current = await readSettings(context.tenantId);
  if (!current.storeReady) throw new TransportError('Transport storage is not provisioned yet.', 503);

  const next = { ...current.settings, ...input };
  await prisma.$executeRaw`
    INSERT INTO campusos_transport.settings
      (tenant_id, enabled, gps_tracking_enabled, allow_hybrid_students, telemetry_stale_seconds, updated_by, created_at, updated_at)
    VALUES
      (${context.tenantId}::uuid, ${next.enabled}, ${next.gpsTrackingEnabled}, ${next.allowHybridStudents},
       ${next.telemetryStaleSeconds}, ${context.userId}::uuid, now(), now())
    ON CONFLICT (tenant_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      gps_tracking_enabled = EXCLUDED.gps_tracking_enabled,
      allow_hybrid_students = EXCLUDED.allow_hybrid_students,
      telemetry_stale_seconds = EXCLUDED.telemetry_stale_seconds,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;
  await writeAudit(context, 'TRANSPORT_SETTINGS_UPDATED', next);
  return next;
}

export async function updateStudentTransport(input: {
  studentId: string;
  studyMode: StudentStudyMode;
  transportOptIn: boolean;
  routeId: string | null;
  vehicleId: string | null;
}) {
  const context = await requireInstitutionTransportAdmin();
  const { storeReady, settings } = await readSettings(context.tenantId);
  if (!storeReady) throw new TransportError('Transport storage is not provisioned yet.', 503);

  const student = await prisma.student.findFirst({ where: { id: input.studentId, tenantId: context.tenantId }, select: { id: true } });
  if (!student) throw new TransportError('Student not found in this institution.', 404);

  const transportOptIn = input.studyMode === 'ONLINE' ? false : input.transportOptIn;
  const eligible = studentEligible(settings, input.studyMode, transportOptIn);

  let routeId = eligible ? input.routeId : null;
  let vehicleId = eligible ? input.vehicleId : null;

  if (routeId) {
    const route = await prisma.transportRoute.findFirst({ where: { id: routeId, tenantId: context.tenantId }, select: { id: true } });
    if (!route) throw new TransportError('Selected route is not available in this institution.', 400);
  }

  if (vehicleId) {
    const vehicles = await prisma.$queryRaw<Array<{ id: string; route_id: string | null }>>`
      SELECT id, route_id
      FROM campusos_transport.vehicles
      WHERE id = ${vehicleId}::uuid AND tenant_id = ${context.tenantId}::uuid AND is_active = true
      LIMIT 1
    `;
    const vehicle = vehicles[0];
    if (!vehicle) throw new TransportError('Selected vehicle is not available in this institution.', 400);
    if (vehicle.route_id && routeId && vehicle.route_id !== routeId) {
      throw new TransportError('Selected vehicle belongs to a different route.', 400);
    }
    if (!routeId && vehicle.route_id) routeId = vehicle.route_id;
  }

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_transport.student_profiles
        (student_id, tenant_id, study_mode, transport_opt_in, updated_by, created_at, updated_at)
      VALUES
        (${input.studentId}::uuid, ${context.tenantId}::uuid, ${input.studyMode}, ${transportOptIn}, ${context.userId}::uuid, now(), now())
      ON CONFLICT (student_id) DO UPDATE SET
        study_mode = EXCLUDED.study_mode,
        transport_opt_in = EXCLUDED.transport_opt_in,
        updated_by = EXCLUDED.updated_by,
        updated_at = now()
    `;

    if (!eligible || !routeId) {
      await tx.$executeRaw`
        DELETE FROM campusos_transport.student_assignments
        WHERE student_id = ${input.studentId}::uuid AND tenant_id = ${context.tenantId}::uuid
      `;
    } else {
      await tx.$executeRaw`
        INSERT INTO campusos_transport.student_assignments
          (id, tenant_id, student_id, route_id, vehicle_id, active, created_at, updated_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${input.studentId}::uuid,
           ${routeId}::uuid, ${vehicleId}::uuid, true, now(), now())
        ON CONFLICT (student_id) DO UPDATE SET
          tenant_id = EXCLUDED.tenant_id,
          route_id = EXCLUDED.route_id,
          vehicle_id = EXCLUDED.vehicle_id,
          active = true,
          updated_at = now()
      `;
    }
  });

  await writeAudit(context, 'TRANSPORT_STUDENT_UPDATED', {
    studentId: input.studentId,
    studyMode: input.studyMode,
    transportOptIn,
    eligible,
    routeId,
    vehicleId,
  });

  return { studyMode: input.studyMode, transportOptIn, eligible, routeId, vehicleId };
}

function hashDeviceToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export async function createTransportVehicle(input: {
  routeId: string | null;
  label: string;
  registrationNumber: string;
  driverName?: string | null;
  driverPhone?: string | null;
}) {
  const context = await requireInstitutionTransportAdmin();
  const { storeReady } = await readSettings(context.tenantId);
  if (!storeReady) throw new TransportError('Transport storage is not provisioned yet.', 503);

  if (input.routeId) {
    const route = await prisma.transportRoute.findFirst({ where: { id: input.routeId, tenantId: context.tenantId }, select: { id: true } });
    if (!route) throw new TransportError('Selected route is not available in this institution.', 400);
  }

  const token = `gps_${randomBytes(32).toString('base64url')}`;
  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_transport.vehicles
        (id, tenant_id, route_id, label, registration_number, driver_name, driver_phone,
         device_token_hash, status, is_active, created_at, updated_at)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${input.routeId}::uuid, ${input.label},
         ${input.registrationNumber.toUpperCase()}, ${input.driverName ?? null}, ${input.driverPhone ?? null},
         ${hashDeviceToken(token)}, 'ACTIVE', true, now(), now())
    `;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new TransportError('A vehicle with this registration number already exists.', 409);
    }
    throw error;
  }

  await writeAudit(context, 'TRANSPORT_VEHICLE_CREATED', {
    vehicleId: id,
    routeId: input.routeId,
    registrationNumber: input.registrationNumber.toUpperCase(),
  });

  return { id, deviceToken: token };
}

export async function recordGpsTelemetry(token: string, input: {
  latitude: number;
  longitude: number;
  speedKph?: number | null;
  headingDegrees?: number | null;
  accuracyMeters?: number | null;
  recordedAt: Date;
}) {
  const tokenHash = hashDeviceToken(token);
  let rows: DeviceRow[];
  try {
    rows = await prisma.$queryRaw<DeviceRow[]>`
      SELECT
        v.id,
        v.tenant_id,
        v.is_active,
        v.status,
        COALESCE(s.enabled, false) AS module_enabled,
        COALESCE(s.gps_tracking_enabled, false) AS gps_enabled
      FROM campusos_transport.vehicles v
      LEFT JOIN campusos_transport.settings s ON s.tenant_id = v.tenant_id
      WHERE v.device_token_hash = ${tokenHash}
      LIMIT 1
    `;
  } catch {
    throw new TransportError('Transport GPS ingestion is unavailable.', 503);
  }

  const device = rows[0];
  if (!device) throw new TransportError('Invalid GPS device credential.', 401);
  if (!device.is_active || device.status === 'INACTIVE') throw new TransportError('GPS device is inactive.', 403);
  if (!device.module_enabled || !device.gps_enabled) throw new TransportError('GPS tracking is disabled for this institution.', 403);

  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO campusos_transport.gps_positions
        (id, tenant_id, vehicle_id, latitude, longitude, speed_kph, heading_degrees,
         accuracy_meters, recorded_at, received_at)
      VALUES
        (${randomUUID()}::uuid, ${device.tenant_id}::uuid, ${device.id}::uuid, ${input.latitude},
         ${input.longitude}, ${input.speedKph ?? null}, ${input.headingDegrees ?? null},
         ${input.accuracyMeters ?? null}, ${input.recordedAt}, now())
    `,
    prisma.$executeRaw`
      UPDATE campusos_transport.vehicles
      SET last_seen_at = GREATEST(COALESCE(last_seen_at, ${input.recordedAt}), ${input.recordedAt}),
          updated_at = now()
      WHERE id = ${device.id}::uuid
    `,
  ]);

  return { accepted: true, vehicleId: device.id, recordedAt: input.recordedAt.toISOString() };
}
