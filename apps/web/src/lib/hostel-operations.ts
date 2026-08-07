import 'server-only';

import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { RoleType } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import type {
  HostelAllocationView,
  HostelAvailability,
  HostelCharge,
  HostelIncidentView,
  HostelModuleSettings,
  HostelOutpassView,
  HostelStudentSummary,
  HostelWorkspaceData,
  StudentStudyMode,
} from './hostel-types';

const DEFAULT_SETTINGS: HostelModuleSettings = {
  storeReady: false,
  enabled: false,
  ownershipMode: 'INSTITUTION',
  allowHybridStudents: true,
  requireParentOutpassApproval: true,
  requireWardenOutpassApproval: true,
  facultyWelfareVisibility: true,
  thirdPartySyncEnabled: false,
  currency: 'INR',
};

const OPERATIONS_ROLES = new Set<RoleType>(['WARDEN', 'INSTITUTION_ADMIN']);
const FINANCE_ROLES = new Set<RoleType>(['FINANCE_OFFICER', 'ACCOUNTANT', 'INSTITUTION_ADMIN']);
const WELFARE_ROLES = new Set<RoleType>(['FACULTY', 'HOD', 'DEAN', 'REGISTRAR']);
const VIEWER_ROLES = new Set<RoleType>([
  'STUDENT',
  'PARENT',
  'WARDEN',
  'INSTITUTION_ADMIN',
  'FINANCE_OFFICER',
  'ACCOUNTANT',
  'FACULTY',
  'HOD',
  'DEAN',
  'REGISTRAR',
]);

export class HostelError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'HostelError';
    this.status = status;
  }
}

type SettingsRow = {
  enabled: boolean;
  ownership_mode: 'INSTITUTION' | 'THIRD_PARTY' | 'MIXED';
  allow_hybrid_students: boolean;
  require_parent_outpass_approval: boolean;
  require_warden_outpass_approval: boolean;
  faculty_welfare_visibility: boolean;
  third_party_sync_enabled: boolean;
  currency: string;
};

type ProfileRow = {
  student_id: string;
  study_mode: string | null;
  hostel_enrolled: boolean;
};

type StudentIdentityRow = {
  student_id: string;
  user_id: string;
  name: string;
  email: string;
  roll_number: string;
  department_id: string | null;
  guardian_id: string | null;
};

type AllocationRow = {
  id: string;
  student_id: string;
  facility_name: string;
  ownership: 'INSTITUTION' | 'THIRD_PARTY';
  building: string | null;
  room_number: string | null;
  bed_label: string | null;
  meal_plan: string | null;
  status: 'ACTIVE' | 'RESERVED' | 'CHECKED_OUT';
  provider_name: string | null;
};

type ChargeRow = {
  id: string;
  student_id: string;
  category: HostelCharge['category'];
  description: string;
  amount: unknown;
  paid_amount: unknown;
  currency: string;
  due_date: Date | string | null;
  status: HostelCharge['status'];
  source: HostelCharge['source'];
};

type OutpassRow = {
  id: string;
  student_id: string;
  destination: string;
  reason: string | null;
  departure_at: Date;
  expected_return_at: Date;
  status: HostelOutpassView['status'];
  parent_approval: HostelOutpassView['parentApproval'];
  warden_approval: HostelOutpassView['wardenApproval'];
};

type IncidentRow = {
  id: string;
  student_id: string | null;
  kind: HostelIncidentView['kind'];
  title: string;
  status: HostelIncidentView['status'];
  occurred_at: Date;
  charge_amount: unknown | null;
  currency: string | null;
};

type ProviderRow = {
  id: string;
  name: string;
  external_code: string | null;
  enabled: boolean;
  last_sync_at: Date | null;
};

type FacilityRow = {
  id: string;
  name: string;
  building: string | null;
  address: string | null;
  ownership: 'INSTITUTION' | 'THIRD_PARTY';
  provider_id: string | null;
  provider_name: string | null;
  active: boolean;
};

type RoomRow = {
  id: string;
  facility_id: string;
  room_number: string;
  floor_label: string | null;
  capacity: number;
  active: boolean;
  occupied: number;
};

type ProviderAuthRow = {
  id: string;
  tenant_id: string;
  name: string;
  enabled: boolean;
  module_enabled: boolean;
  sync_enabled: boolean;
};

export type HostelAdminData = {
  settings: HostelModuleSettings;
  metrics: {
    totalStudents: number;
    unclassifiedStudents: number;
    onlineStudents: number;
    offlineStudents: number;
    hybridStudents: number;
    eligibleStudents: number;
    activeResidents: number;
    thirdPartyResidents: number;
    pendingOutpasses: number;
    outstandingAmount: number;
  };
  students: HostelStudentSummary[];
  providers: Array<ProviderRow>;
  facilities: Array<FacilityRow>;
  rooms: Array<RoomRow>;
};

function settingsFromRow(row: SettingsRow | undefined, storeReady: boolean): HostelModuleSettings {
  if (!row) return { ...DEFAULT_SETTINGS, storeReady };
  return {
    storeReady,
    enabled: row.enabled,
    ownershipMode: row.ownership_mode,
    allowHybridStudents: row.allow_hybrid_students,
    requireParentOutpassApproval: row.require_parent_outpass_approval,
    requireWardenOutpassApproval: row.require_warden_outpass_approval,
    facultyWelfareVisibility: row.faculty_welfare_visibility,
    thirdPartySyncEnabled: row.third_party_sync_enabled,
    currency: row.currency,
  };
}

function normalizeMode(value: string | null | undefined): StudentStudyMode | 'UNCLASSIFIED' {
  if (value === 'ONLINE' || value === 'OFFLINE' || value === 'HYBRID') return value;
  return 'UNCLASSIFIED';
}

export function hostelEligible(settings: Pick<HostelModuleSettings, 'allowHybridStudents'>, mode: StudentStudyMode | 'UNCLASSIFIED') {
  if (mode === 'ONLINE' || mode === 'UNCLASSIFIED') return false;
  if (mode === 'HYBRID' && !settings.allowHybridStudents) return false;
  return true;
}

function availabilityForStudent(settings: HostelModuleSettings, mode: StudentStudyMode | 'UNCLASSIFIED'): HostelAvailability {
  if (!settings.storeReady) return { visible: false, reason: 'STORE_UNAVAILABLE', studyMode: mode };
  if (!settings.enabled) return { visible: false, reason: 'MODULE_DISABLED', studyMode: mode };
  if (mode === 'UNCLASSIFIED') return { visible: false, reason: 'UNCLASSIFIED', studyMode: mode };
  if (mode === 'ONLINE') return { visible: false, reason: 'ONLINE_ONLY', studyMode: mode };
  if (mode === 'HYBRID' && !settings.allowHybridStudents) return { visible: false, reason: 'HYBRID_DISABLED', studyMode: mode };
  return { visible: true, reason: 'AVAILABLE', studyMode: mode };
}

async function readSettings(tenantId: string): Promise<HostelModuleSettings> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT enabled, ownership_mode, allow_hybrid_students,
             require_parent_outpass_approval, require_warden_outpass_approval,
             faculty_welfare_visibility, third_party_sync_enabled, currency
      FROM campusos_hostel.settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return settingsFromRow(rows[0], true);
  } catch (error) {
    console.error('Hostel operations storage is unavailable:', error);
    return DEFAULT_SETTINGS;
  }
}

async function readProfiles(tenantId: string): Promise<Map<string, ProfileRow>> {
  try {
    const rows = await prisma.$queryRaw<ProfileRow[]>`
      SELECT student_id, study_mode, hostel_enrolled
      FROM campusos_hostel.student_profiles
      WHERE tenant_id = ${tenantId}::uuid
    `;
    return new Map(rows.map((row) => [row.student_id, row]));
  } catch {
    return new Map();
  }
}

async function transportModeFallback(tenantId: string, studentId: string): Promise<StudentStudyMode | 'UNCLASSIFIED'> {
  try {
    const rows = await prisma.$queryRaw<Array<{ study_mode: string }>>`
      SELECT study_mode
      FROM campusos_transport.student_profiles
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid
      LIMIT 1
    `;
    return normalizeMode(rows[0]?.study_mode);
  } catch {
    return 'UNCLASSIFIED';
  }
}

async function readStudentIdentities(tenantId: string, departmentId?: string | null): Promise<StudentIdentityRow[]> {
  return prisma.$queryRaw<StudentIdentityRow[]>`
    SELECT s.id AS student_id, s.user_id, u.name, u.email,
           s."rollNumber" AS roll_number,
           p.department_id,
           s.guardian_id
    FROM public.students s
    JOIN public.users u ON u.id = s.user_id AND u.tenant_id = s.tenant_id
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.programs p ON p.id = b.program_id
    WHERE s.tenant_id = ${tenantId}::uuid
      AND (${departmentId ?? null}::uuid IS NULL OR p.department_id = ${departmentId ?? null}::uuid)
    ORDER BY u.name ASC, s."rollNumber" ASC
  `;
}

async function readAllocations(tenantId: string): Promise<Map<string, AllocationRow>> {
  try {
    const rows = await prisma.$queryRaw<AllocationRow[]>`
      SELECT a.id, a.student_id, f.name AS facility_name, f.ownership, f.building,
             r.room_number, a.bed_label, a.meal_plan, a.status,
             p.name AS provider_name
      FROM campusos_hostel.allocations a
      JOIN campusos_hostel.facilities f ON f.id = a.facility_id AND f.tenant_id = a.tenant_id
      LEFT JOIN campusos_hostel.rooms r ON r.id = a.room_id AND r.tenant_id = a.tenant_id
      LEFT JOIN campusos_hostel.providers p ON p.id = a.provider_id AND p.tenant_id = a.tenant_id
      WHERE a.tenant_id = ${tenantId}::uuid AND a.status IN ('ACTIVE','RESERVED')
      ORDER BY CASE WHEN a.status = 'ACTIVE' THEN 0 ELSE 1 END, a.updated_at DESC
    `;
    return new Map(rows.map((row) => [row.student_id, row]));
  } catch {
    return new Map();
  }
}

async function readCharges(tenantId: string, studentIds?: string[]): Promise<ChargeRow[]> {
  if (studentIds && studentIds.length === 0) return [];
  try {
    if (!studentIds) {
      return await prisma.$queryRaw<ChargeRow[]>`
        SELECT id, student_id, category, description, amount, paid_amount, currency, due_date, status, source
        FROM campusos_hostel.charges
        WHERE tenant_id = ${tenantId}::uuid
        ORDER BY COALESCE(due_date, CURRENT_DATE) DESC, created_at DESC
      `;
    }
    return await prisma.$queryRaw<ChargeRow[]>`
      SELECT id, student_id, category, description, amount, paid_amount, currency, due_date, status, source
      FROM campusos_hostel.charges
      WHERE tenant_id = ${tenantId}::uuid
        AND student_id = ANY(${studentIds}::uuid[])
      ORDER BY COALESCE(due_date, CURRENT_DATE) DESC, created_at DESC
    `;
  } catch {
    return [];
  }
}

async function readOutpasses(tenantId: string, studentIds?: string[]): Promise<OutpassRow[]> {
  if (studentIds && studentIds.length === 0) return [];
  try {
    if (!studentIds) {
      return await prisma.$queryRaw<OutpassRow[]>`
        SELECT id, student_id, destination, reason, departure_at, expected_return_at,
               status, parent_approval, warden_approval
        FROM campusos_hostel.outpasses
        WHERE tenant_id = ${tenantId}::uuid
        ORDER BY created_at DESC
      `;
    }
    return await prisma.$queryRaw<OutpassRow[]>`
      SELECT id, student_id, destination, reason, departure_at, expected_return_at,
             status, parent_approval, warden_approval
      FROM campusos_hostel.outpasses
      WHERE tenant_id = ${tenantId}::uuid
        AND student_id = ANY(${studentIds}::uuid[])
      ORDER BY created_at DESC
    `;
  } catch {
    return [];
  }
}

async function readIncidents(tenantId: string, studentIds?: string[]): Promise<IncidentRow[]> {
  if (studentIds && studentIds.length === 0) return [];
  try {
    if (!studentIds) {
      return await prisma.$queryRaw<IncidentRow[]>`
        SELECT id, student_id, kind, title, status, occurred_at, charge_amount, currency
        FROM campusos_hostel.incidents
        WHERE tenant_id = ${tenantId}::uuid
        ORDER BY occurred_at DESC
      `;
    }
    return await prisma.$queryRaw<IncidentRow[]>`
      SELECT id, student_id, kind, title, status, occurred_at, charge_amount, currency
      FROM campusos_hostel.incidents
      WHERE tenant_id = ${tenantId}::uuid
        AND student_id = ANY(${studentIds}::uuid[])
      ORDER BY occurred_at DESC
    `;
  } catch {
    return [];
  }
}

function allocationView(row: AllocationRow | undefined): HostelAllocationView | null {
  if (!row) return null;
  return {
    id: row.id,
    facilityName: row.facility_name,
    ownership: row.ownership,
    building: row.building,
    roomNumber: row.room_number,
    bedLabel: row.bed_label,
    mealPlan: row.meal_plan,
    status: row.status,
    providerName: row.provider_name,
  };
}

function chargeView(row: ChargeRow): HostelCharge {
  return {
    id: row.id,
    category: row.category,
    description: row.description,
    amount: Number(row.amount),
    currency: row.currency,
    dueDate: row.due_date ? new Date(row.due_date).toISOString().slice(0, 10) : null,
    status: row.status,
    source: row.source,
  };
}

function outpassView(row: OutpassRow): HostelOutpassView {
  return {
    id: row.id,
    destination: row.destination,
    reason: row.reason,
    departureAt: new Date(row.departure_at).toISOString(),
    expectedReturnAt: new Date(row.expected_return_at).toISOString(),
    status: row.status,
    parentApproval: row.parent_approval,
    wardenApproval: row.warden_approval,
  };
}

function incidentView(row: IncidentRow): HostelIncidentView {
  return {
    id: row.id,
    kind: row.kind,
    title: row.title,
    status: row.status,
    occurredAt: new Date(row.occurred_at).toISOString(),
    chargeAmount: row.charge_amount == null ? null : Number(row.charge_amount),
    currency: row.currency,
  };
}

async function resolveDepartmentForWelfareRole(context: ActiveUserContext): Promise<string | null> {
  if (context.departmentId) return context.departmentId;
  if (context.activeRole !== 'HOD' && context.activeRole !== 'FACULTY') return null;
  const staff = await prisma.staff.findFirst({
    where: { tenantId: context.tenantId, userId: context.userId },
    select: { departmentId: true },
  });
  return staff?.departmentId ?? null;
}

async function studentMode(tenantId: string, studentId: string, profiles?: Map<string, ProfileRow>) {
  const row = profiles?.get(studentId);
  if (row?.study_mode) return normalizeMode(row.study_mode);
  return transportModeFallback(tenantId, studentId);
}

async function summaryRows(
  tenantId: string,
  settings: HostelModuleSettings,
  identities: StudentIdentityRow[],
  profiles: Map<string, ProfileRow>,
  allocations: Map<string, AllocationRow>,
  charges: ChargeRow[],
  outpasses: OutpassRow[],
): Promise<HostelStudentSummary[]> {
  const chargeTotals = new Map<string, number>();
  for (const charge of charges) {
    if (charge.status === 'PAID' || charge.status === 'WAIVED') continue;
    const due = Math.max(0, Number(charge.amount) - Number(charge.paid_amount));
    chargeTotals.set(charge.student_id, (chargeTotals.get(charge.student_id) ?? 0) + due);
  }
  const latestOutpass = new Map<string, string>();
  for (const pass of outpasses) {
    if (!latestOutpass.has(pass.student_id)) latestOutpass.set(pass.student_id, pass.status);
  }

  return Promise.all(identities.map(async (identity) => {
    const mode = await studentMode(tenantId, identity.student_id, profiles);
    const profile = profiles.get(identity.student_id);
    return {
      studentId: identity.student_id,
      studentName: identity.name,
      rollNumber: identity.roll_number,
      studyMode: mode,
      eligible: hostelEligible(settings, mode),
      enrolled: Boolean(profile?.hostel_enrolled || allocations.has(identity.student_id)),
      allocation: allocationView(allocations.get(identity.student_id)),
      balanceDue: chargeTotals.get(identity.student_id) ?? 0,
      currentOutpassStatus: latestOutpass.get(identity.student_id) ?? null,
    };
  }));
}

export async function getHostelAvailability(): Promise<HostelAvailability & { adminControl?: boolean }> {
  const context = await requireActiveUserContext();
  const settings = await readSettings(context.tenantId);
  if (context.activeRole === 'INSTITUTION_ADMIN') {
    return { visible: settings.enabled, reason: settings.enabled ? 'AVAILABLE' : 'MODULE_DISABLED', adminControl: true };
  }
  if (!VIEWER_ROLES.has(context.activeRole)) return { visible: false, reason: 'ROLE_NOT_SUPPORTED' };
  if (!settings.storeReady) return { visible: false, reason: 'STORE_UNAVAILABLE' };
  if (!settings.enabled) return { visible: false, reason: 'MODULE_DISABLED' };

  if (context.activeRole === 'STUDENT' && context.studentProfileId) {
    const mode = await studentMode(context.tenantId, context.studentProfileId);
    return availabilityForStudent(settings, mode);
  }

  if (context.activeRole === 'PARENT' && context.guardianProfileId) {
    const students = await prisma.student.findMany({
      where: { tenantId: context.tenantId, guardianId: context.guardianProfileId },
      select: { id: true },
    });
    for (const student of students) {
      const mode = await studentMode(context.tenantId, student.id);
      if (hostelEligible(settings, mode)) return { visible: true, reason: 'AVAILABLE', studyMode: mode };
    }
    return { visible: false, reason: 'ONLINE_ONLY' };
  }

  if (WELFARE_ROLES.has(context.activeRole) && !settings.facultyWelfareVisibility) {
    return { visible: false, reason: 'ROLE_NOT_SUPPORTED' };
  }
  return { visible: true, reason: 'AVAILABLE' };
}

export async function getHostelWorkspaceData(): Promise<HostelWorkspaceData> {
  const context = await requireActiveUserContext();
  if (!VIEWER_ROLES.has(context.activeRole)) throw new HostelError('Hostel workspace is not available for this role.', 403);
  const settings = await readSettings(context.tenantId);

  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) throw new HostelError('Student profile is not available.', 403);
    const mode = await studentMode(context.tenantId, context.studentProfileId);
    const availability = availabilityForStudent(settings, mode);
    if (!availability.visible) return { role: context.activeRole, settings, availability, charges: [], outpasses: [], incidents: [] };
    const identities = await readStudentIdentities(context.tenantId);
    const identity = identities.find((item) => item.student_id === context.studentProfileId);
    if (!identity) throw new HostelError('Student identity is not available.', 404);
    const profiles = await readProfiles(context.tenantId);
    const allocations = await readAllocations(context.tenantId);
    const charges = await readCharges(context.tenantId, [context.studentProfileId]);
    const outpasses = await readOutpasses(context.tenantId, [context.studentProfileId]);
    const incidents = await readIncidents(context.tenantId, [context.studentProfileId]);
    const [student] = await summaryRows(context.tenantId, settings, [identity], profiles, allocations, charges, outpasses);
    return {
      role: context.activeRole,
      settings,
      availability,
      student,
      allocation: allocationView(allocations.get(context.studentProfileId)),
      charges: charges.map(chargeView),
      outpasses: outpasses.map(outpassView),
      incidents: incidents.map(incidentView),
    };
  }

  if (context.activeRole === 'PARENT') {
    if (!context.guardianProfileId) throw new HostelError('Guardian profile is not available.', 403);
    const linked = await prisma.student.findMany({
      where: { tenantId: context.tenantId, guardianId: context.guardianProfileId },
      select: { id: true },
    });
    const ids = linked.map((item) => item.id);
    const identities = (await readStudentIdentities(context.tenantId)).filter((item) => ids.includes(item.student_id));
    const profiles = await readProfiles(context.tenantId);
    const allocations = await readAllocations(context.tenantId);
    const charges = await readCharges(context.tenantId, ids);
    const outpasses = await readOutpasses(context.tenantId, ids);
    const students = await summaryRows(context.tenantId, settings, identities, profiles, allocations, charges, outpasses);
    const eligible = students.filter((item) => item.eligible);
    const availability: HostelAvailability = eligible.length
      ? { visible: settings.enabled && settings.storeReady, reason: settings.enabled ? 'AVAILABLE' : 'MODULE_DISABLED' }
      : { visible: false, reason: 'ONLINE_ONLY' };
    return {
      role: context.activeRole,
      settings,
      availability,
      student: eligible[0] ?? null,
      allocation: eligible[0]?.allocation ?? null,
      charges: charges.filter((charge) => eligible.some((student) => student.studentId === charge.student_id)).map(chargeView),
      outpasses: outpasses.filter((pass) => eligible.some((student) => student.studentId === pass.student_id)).map(outpassView),
      incidents: [],
      operations: {
        totalEligible: eligible.length,
        activeResidents: eligible.filter((item) => item.allocation?.status === 'ACTIVE').length,
        roomsOccupied: new Set(eligible.map((item) => item.allocation?.id).filter(Boolean)).size,
        pendingOutpasses: outpasses.filter((pass) => pass.status === 'PENDING').length,
        outstandingAmount: eligible.reduce((sum, item) => sum + item.balanceDue, 0),
        thirdPartyResidents: eligible.filter((item) => item.allocation?.ownership === 'THIRD_PARTY').length,
        students: eligible,
      },
    };
  }

  if (!settings.storeReady || !settings.enabled) {
    return {
      role: context.activeRole,
      settings,
      availability: { visible: false, reason: settings.storeReady ? 'MODULE_DISABLED' : 'STORE_UNAVAILABLE' },
      charges: [],
      outpasses: [],
      incidents: [],
    };
  }
  if (WELFARE_ROLES.has(context.activeRole) && !settings.facultyWelfareVisibility) {
    throw new HostelError('Hostel welfare visibility is disabled for academic staff.', 403);
  }

  const departmentId = WELFARE_ROLES.has(context.activeRole) ? await resolveDepartmentForWelfareRole(context) : null;
  const identities = await readStudentIdentities(context.tenantId, departmentId);
  const profiles = await readProfiles(context.tenantId);
  const allocations = await readAllocations(context.tenantId);
  const allCharges = await readCharges(context.tenantId);
  const allOutpasses = await readOutpasses(context.tenantId);
  const students = await summaryRows(context.tenantId, settings, identities, profiles, allocations, allCharges, allOutpasses);
  const eligible = students.filter((item) => item.eligible);

  const academicWelfareOnly = WELFARE_ROLES.has(context.activeRole);
  return {
    role: context.activeRole,
    settings,
    availability: { visible: true, reason: 'AVAILABLE' },
    charges: academicWelfareOnly ? [] : allCharges.map(chargeView),
    outpasses: allOutpasses.map(outpassView),
    incidents: academicWelfareOnly ? [] : (await readIncidents(context.tenantId)).map(incidentView),
    operations: {
      totalEligible: eligible.length,
      activeResidents: eligible.filter((item) => item.allocation?.status === 'ACTIVE').length,
      roomsOccupied: new Set(eligible.map((item) => item.allocation?.id).filter(Boolean)).size,
      pendingOutpasses: allOutpasses.filter((pass) => pass.status === 'PENDING').length,
      outstandingAmount: academicWelfareOnly ? 0 : eligible.reduce((sum, item) => sum + item.balanceDue, 0),
      thirdPartyResidents: eligible.filter((item) => item.allocation?.ownership === 'THIRD_PARTY').length,
      students: eligible.map((item) => academicWelfareOnly ? { ...item, balanceDue: 0 } : item),
    },
  };
}

async function requireInstitutionAdmin() {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'INSTITUTION_ADMIN') throw new HostelError('Institution Admin access is required.', 403);
  return context;
}

export async function getHostelAdminData(): Promise<HostelAdminData> {
  const context = await requireInstitutionAdmin();
  const settings = await readSettings(context.tenantId);
  const identities = await readStudentIdentities(context.tenantId);
  const profiles = await readProfiles(context.tenantId);
  const allocations = await readAllocations(context.tenantId);
  const charges = await readCharges(context.tenantId);
  const outpasses = await readOutpasses(context.tenantId);
  const students = await summaryRows(context.tenantId, settings, identities, profiles, allocations, charges, outpasses);

  let providers: ProviderRow[] = [];
  let facilities: FacilityRow[] = [];
  let rooms: RoomRow[] = [];
  if (settings.storeReady) {
    providers = await prisma.$queryRaw<ProviderRow[]>`
      SELECT id, name, external_code, enabled, last_sync_at
      FROM campusos_hostel.providers
      WHERE tenant_id = ${context.tenantId}::uuid
      ORDER BY name ASC
    `;
    facilities = await prisma.$queryRaw<FacilityRow[]>`
      SELECT f.id, f.name, f.building, f.address, f.ownership, f.provider_id,
             p.name AS provider_name, f.active
      FROM campusos_hostel.facilities f
      LEFT JOIN campusos_hostel.providers p ON p.id = f.provider_id
      WHERE f.tenant_id = ${context.tenantId}::uuid
      ORDER BY f.name ASC
    `;
    rooms = await prisma.$queryRaw<RoomRow[]>`
      SELECT r.id, r.facility_id, r.room_number, r.floor_label, r.capacity, r.active,
             COUNT(a.id)::int AS occupied
      FROM campusos_hostel.rooms r
      LEFT JOIN campusos_hostel.allocations a ON a.room_id = r.id AND a.status = 'ACTIVE'
      WHERE r.tenant_id = ${context.tenantId}::uuid
      GROUP BY r.id
      ORDER BY r.room_number ASC
    `;
  }

  return {
    settings,
    metrics: {
      totalStudents: students.length,
      unclassifiedStudents: students.filter((item) => item.studyMode === 'UNCLASSIFIED').length,
      onlineStudents: students.filter((item) => item.studyMode === 'ONLINE').length,
      offlineStudents: students.filter((item) => item.studyMode === 'OFFLINE').length,
      hybridStudents: students.filter((item) => item.studyMode === 'HYBRID').length,
      eligibleStudents: students.filter((item) => item.eligible).length,
      activeResidents: students.filter((item) => item.allocation?.status === 'ACTIVE').length,
      thirdPartyResidents: students.filter((item) => item.allocation?.ownership === 'THIRD_PARTY').length,
      pendingOutpasses: outpasses.filter((pass) => pass.status === 'PENDING').length,
      outstandingAmount: students.reduce((sum, item) => sum + item.balanceDue, 0),
    },
    students,
    providers,
    facilities,
    rooms,
  };
}

export async function updateHostelSettings(input: {
  enabled?: boolean;
  ownershipMode?: 'INSTITUTION' | 'THIRD_PARTY' | 'MIXED';
  allowHybridStudents?: boolean;
  requireParentOutpassApproval?: boolean;
  requireWardenOutpassApproval?: boolean;
  facultyWelfareVisibility?: boolean;
  thirdPartySyncEnabled?: boolean;
  currency?: string;
}) {
  const context = await requireInstitutionAdmin();
  const current = await readSettings(context.tenantId);
  if (!current.storeReady) throw new HostelError('Hostel storage is not provisioned.', 503);
  const currency = (input.currency ?? current.currency).trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new HostelError('Currency must be a 3-letter ISO code.');
  const rows = await prisma.$queryRaw<SettingsRow[]>`
    INSERT INTO campusos_hostel.settings (
      tenant_id, enabled, ownership_mode, allow_hybrid_students,
      require_parent_outpass_approval, require_warden_outpass_approval,
      faculty_welfare_visibility, third_party_sync_enabled, currency, updated_by, updated_at
    ) VALUES (
      ${context.tenantId}::uuid,
      ${input.enabled ?? current.enabled},
      ${input.ownershipMode ?? current.ownershipMode},
      ${input.allowHybridStudents ?? current.allowHybridStudents},
      ${input.requireParentOutpassApproval ?? current.requireParentOutpassApproval},
      ${input.requireWardenOutpassApproval ?? current.requireWardenOutpassApproval},
      ${input.facultyWelfareVisibility ?? current.facultyWelfareVisibility},
      ${input.thirdPartySyncEnabled ?? current.thirdPartySyncEnabled},
      ${currency}, ${context.userId}::uuid, now()
    )
    ON CONFLICT (tenant_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      ownership_mode = EXCLUDED.ownership_mode,
      allow_hybrid_students = EXCLUDED.allow_hybrid_students,
      require_parent_outpass_approval = EXCLUDED.require_parent_outpass_approval,
      require_warden_outpass_approval = EXCLUDED.require_warden_outpass_approval,
      faculty_welfare_visibility = EXCLUDED.faculty_welfare_visibility,
      third_party_sync_enabled = EXCLUDED.third_party_sync_enabled,
      currency = EXCLUDED.currency,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
    RETURNING enabled, ownership_mode, allow_hybrid_students,
              require_parent_outpass_approval, require_warden_outpass_approval,
              faculty_welfare_visibility, third_party_sync_enabled, currency
  `;
  return settingsFromRow(rows[0], true);
}

export async function updateHostelStudent(input: {
  studentId: string;
  studyMode: StudentStudyMode;
  hostelEnrolled: boolean;
  facilityId?: string | null;
  roomId?: string | null;
  bedLabel?: string | null;
  mealPlan?: string | null;
}) {
  const context = await requireInstitutionAdmin();
  const settings = await readSettings(context.tenantId);
  const student = await prisma.student.findFirst({ where: { id: input.studentId, tenantId: context.tenantId }, select: { id: true } });
  if (!student) throw new HostelError('Student does not belong to this institution.', 404);
  const eligible = hostelEligible(settings, input.studyMode);
  const enrolled = eligible ? input.hostelEnrolled : false;
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.student_profiles (tenant_id, student_id, study_mode, hostel_enrolled, updated_by, updated_at)
    VALUES (${context.tenantId}::uuid, ${input.studentId}::uuid, ${input.studyMode}, ${enrolled}, ${context.userId}::uuid, now())
    ON CONFLICT (tenant_id, student_id) DO UPDATE SET
      study_mode = EXCLUDED.study_mode,
      hostel_enrolled = EXCLUDED.hostel_enrolled,
      updated_by = EXCLUDED.updated_by,
      updated_at = now()
  `;

  if (!enrolled || !input.facilityId) {
    await prisma.$executeRaw`
      UPDATE campusos_hostel.allocations
      SET status = 'CHECKED_OUT', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND student_id = ${input.studentId}::uuid
        AND status IN ('ACTIVE','RESERVED')
    `;
    return { eligible, enrolled, allocationId: null };
  }

  const facilities = await prisma.$queryRaw<Array<{ id: string; ownership: string; provider_id: string | null }>>`
    SELECT id, ownership, provider_id FROM campusos_hostel.facilities
    WHERE id = ${input.facilityId}::uuid AND tenant_id = ${context.tenantId}::uuid AND active = true
    LIMIT 1
  `;
  const facility = facilities[0];
  if (!facility) throw new HostelError('Hostel facility is not available.', 404);
  if (input.roomId) {
    const rooms = await prisma.$queryRaw<Array<{ id: string; capacity: number; occupied: number }>>`
      SELECT r.id, r.capacity, COUNT(a.id)::int AS occupied
      FROM campusos_hostel.rooms r
      LEFT JOIN campusos_hostel.allocations a ON a.room_id = r.id AND a.status = 'ACTIVE'
      WHERE r.id = ${input.roomId}::uuid AND r.tenant_id = ${context.tenantId}::uuid
        AND r.facility_id = ${input.facilityId}::uuid AND r.active = true
      GROUP BY r.id
    `;
    const room = rooms[0];
    if (!room) throw new HostelError('Selected room is not available.', 404);
    if (room.occupied >= room.capacity) throw new HostelError('Selected room has reached capacity.', 409);
  }

  await prisma.$executeRaw`
    UPDATE campusos_hostel.allocations
    SET status = 'CHECKED_OUT', updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND student_id = ${input.studentId}::uuid
      AND status IN ('ACTIVE','RESERVED')
  `;
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.allocations (
      id, tenant_id, student_id, facility_id, room_id, provider_id,
      bed_label, meal_plan, status, source, created_by
    ) VALUES (
      ${id}::uuid, ${context.tenantId}::uuid, ${input.studentId}::uuid,
      ${input.facilityId}::uuid, ${input.roomId ?? null}::uuid, ${facility.provider_id}::uuid,
      ${input.bedLabel ?? null}, ${input.mealPlan ?? null}, 'ACTIVE',
      ${facility.ownership === 'THIRD_PARTY' ? 'THIRD_PARTY' : 'INSTITUTION'}, ${context.userId}::uuid
    )
  `;
  return { eligible, enrolled, allocationId: id };
}

export async function createHostelFacility(input: {
  name: string;
  building?: string | null;
  address?: string | null;
  ownership: 'INSTITUTION' | 'THIRD_PARTY';
  providerId?: string | null;
}) {
  const context = await requireInstitutionAdmin();
  if (input.ownership === 'THIRD_PARTY' && !input.providerId) throw new HostelError('Third-party facilities require a provider integration.');
  if (input.providerId) {
    const provider = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_hostel.providers
      WHERE id = ${input.providerId}::uuid AND tenant_id = ${context.tenantId}::uuid AND enabled = true
      LIMIT 1
    `;
    if (!provider[0]) throw new HostelError('Third-party provider is not available.', 404);
  }
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.facilities (id, tenant_id, provider_id, name, building, address, ownership)
    VALUES (${id}::uuid, ${context.tenantId}::uuid, ${input.providerId ?? null}::uuid,
            ${input.name.trim()}, ${input.building?.trim() || null}, ${input.address?.trim() || null}, ${input.ownership})
  `;
  return { id };
}

export async function createHostelRoom(input: { facilityId: string; roomNumber: string; floorLabel?: string | null; capacity: number }) {
  const context = await requireInstitutionAdmin();
  const facility = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_hostel.facilities
    WHERE id = ${input.facilityId}::uuid AND tenant_id = ${context.tenantId}::uuid AND active = true LIMIT 1
  `;
  if (!facility[0]) throw new HostelError('Hostel facility is not available.', 404);
  if (!Number.isInteger(input.capacity) || input.capacity < 1 || input.capacity > 20) throw new HostelError('Room capacity must be between 1 and 20.');
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.rooms (id, tenant_id, facility_id, room_number, floor_label, capacity)
    VALUES (${id}::uuid, ${context.tenantId}::uuid, ${input.facilityId}::uuid,
            ${input.roomNumber.trim()}, ${input.floorLabel?.trim() || null}, ${input.capacity})
  `;
  return { id };
}

export async function createHostelCharge(input: {
  studentId: string;
  category: HostelCharge['category'];
  description: string;
  amount: number;
  dueDate?: string | null;
}) {
  const context = await requireActiveUserContext();
  if (!FINANCE_ROLES.has(context.activeRole)) throw new HostelError('Finance or Institution Admin access is required.', 403);
  if (!Number.isFinite(input.amount) || input.amount < 0 || input.amount > 10_000_000) throw new HostelError('Charge amount is outside the supported range.');
  const student = await prisma.student.findFirst({ where: { id: input.studentId, tenantId: context.tenantId }, select: { id: true } });
  if (!student) throw new HostelError('Student does not belong to this institution.', 404);
  const settings = await readSettings(context.tenantId);
  const allocations = await readAllocations(context.tenantId);
  const allocation = allocations.get(input.studentId);
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.charges (
      id, tenant_id, student_id, allocation_id, category, description,
      amount, currency, due_date, status, source, created_by
    ) VALUES (
      ${id}::uuid, ${context.tenantId}::uuid, ${input.studentId}::uuid,
      ${allocation?.id ?? null}::uuid, ${input.category}, ${input.description.trim()},
      ${input.amount}, ${settings.currency}, ${input.dueDate ?? null}::date,
      'DUE', 'INSTITUTION', ${context.userId}::uuid
    )
  `;
  return { id };
}

export async function createHostelOutpass(input: { destination: string; reason?: string | null; departureAt: string; expectedReturnAt: string }) {
  const context = await requireActiveUserContext();
  if (context.activeRole !== 'STUDENT' || !context.studentProfileId) throw new HostelError('Only a student can submit their own outpass request.', 403);
  const settings = await readSettings(context.tenantId);
  const mode = await studentMode(context.tenantId, context.studentProfileId);
  const availability = availabilityForStudent(settings, mode);
  if (!availability.visible) throw new HostelError('Hostel is not available for this student.', 403);
  const departure = new Date(input.departureAt);
  const expected = new Date(input.expectedReturnAt);
  if (!Number.isFinite(departure.getTime()) || !Number.isFinite(expected.getTime()) || expected <= departure) throw new HostelError('Return time must be after departure time.');
  const id = randomUUID();
  const parentApproval = settings.requireParentOutpassApproval ? 'PENDING' : 'NOT_REQUIRED';
  const wardenApproval = settings.requireWardenOutpassApproval ? 'PENDING' : 'NOT_REQUIRED';
  const status = parentApproval === 'NOT_REQUIRED' && wardenApproval === 'NOT_REQUIRED' ? 'APPROVED' : 'PENDING';
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.outpasses (
      id, tenant_id, student_id, destination, reason, departure_at, expected_return_at,
      status, parent_approval, warden_approval, created_by
    ) VALUES (
      ${id}::uuid, ${context.tenantId}::uuid, ${context.studentProfileId}::uuid,
      ${input.destination.trim()}, ${input.reason?.trim() || null}, ${departure}, ${expected},
      ${status}, ${parentApproval}, ${wardenApproval}, ${context.userId}::uuid
    )
  `;
  return { id, status };
}

async function refreshOutpassStatus(tenantId: string, id: string) {
  await prisma.$executeRaw`
    UPDATE campusos_hostel.outpasses
    SET status = CASE
      WHEN parent_approval = 'REJECTED' OR warden_approval = 'REJECTED' THEN 'REJECTED'
      WHEN parent_approval IN ('APPROVED','NOT_REQUIRED') AND warden_approval IN ('APPROVED','NOT_REQUIRED') THEN 'APPROVED'
      ELSE 'PENDING'
    END,
    updated_at = now()
    WHERE tenant_id = ${tenantId}::uuid AND id = ${id}::uuid AND status IN ('PENDING','APPROVED','REJECTED')
  `;
}

export async function decideHostelOutpass(input: { outpassId: string; decision: 'APPROVED' | 'REJECTED' }) {
  const context = await requireActiveUserContext();
  const rows = await prisma.$queryRaw<Array<{ id: string; student_id: string }>>`
    SELECT id, student_id FROM campusos_hostel.outpasses
    WHERE id = ${input.outpassId}::uuid AND tenant_id = ${context.tenantId}::uuid LIMIT 1
  `;
  const pass = rows[0];
  if (!pass) throw new HostelError('Outpass request was not found.', 404);

  if (context.activeRole === 'PARENT') {
    if (!context.guardianProfileId) throw new HostelError('Guardian profile is not available.', 403);
    const linked = await prisma.student.findFirst({
      where: { id: pass.student_id, tenantId: context.tenantId, guardianId: context.guardianProfileId },
      select: { id: true },
    });
    if (!linked) throw new HostelError('This outpass does not belong to your linked student.', 403);
    await prisma.$executeRaw`
      UPDATE campusos_hostel.outpasses
      SET parent_approval = ${input.decision}, parent_approved_by = ${context.userId}::uuid, updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.outpassId}::uuid AND status = 'PENDING'
    `;
  } else if (context.activeRole === 'WARDEN' || context.activeRole === 'INSTITUTION_ADMIN') {
    await prisma.$executeRaw`
      UPDATE campusos_hostel.outpasses
      SET warden_approval = ${input.decision}, warden_approved_by = ${context.userId}::uuid, updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.outpassId}::uuid AND status = 'PENDING'
    `;
  } else {
    throw new HostelError('This role cannot approve outpass requests.', 403);
  }
  await refreshOutpassStatus(context.tenantId, input.outpassId);
  return { success: true };
}

export async function createHostelIncident(input: {
  studentId?: string | null;
  kind: HostelIncidentView['kind'];
  title: string;
  description?: string | null;
  proposedChargeAmount?: number | null;
}) {
  const context = await requireActiveUserContext();
  if (!OPERATIONS_ROLES.has(context.activeRole)) throw new HostelError('Warden or Institution Admin access is required.', 403);
  if (input.studentId) {
    const student = await prisma.student.findFirst({ where: { id: input.studentId, tenantId: context.tenantId }, select: { id: true } });
    if (!student) throw new HostelError('Student does not belong to this institution.', 404);
  }
  const amount = input.proposedChargeAmount == null ? null : Number(input.proposedChargeAmount);
  if (amount != null && (!Number.isFinite(amount) || amount < 0 || amount > 10_000_000)) throw new HostelError('Proposed charge is outside the supported range.');
  const settings = await readSettings(context.tenantId);
  const allocations = await readAllocations(context.tenantId);
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.incidents (
      id, tenant_id, student_id, allocation_id, kind, title, description,
      status, charge_amount, currency, reported_by
    ) VALUES (
      ${id}::uuid, ${context.tenantId}::uuid, ${input.studentId ?? null}::uuid,
      ${input.studentId ? allocations.get(input.studentId)?.id ?? null : null}::uuid,
      ${input.kind}, ${input.title.trim()}, ${input.description?.trim() || null},
      'UNDER_REVIEW', ${amount}, ${amount == null ? null : settings.currency}, ${context.userId}::uuid
    )
  `;
  return { id, reviewRequired: amount != null };
}

export async function createHostelProvider(input: { name: string; externalCode?: string | null }) {
  const context = await requireInstitutionAdmin();
  const id = randomUUID();
  const token = `hostel_${randomBytes(32).toString('base64url')}`;
  const tokenHash = createHash('sha256').update(token).digest('hex');
  await prisma.$executeRaw`
    INSERT INTO campusos_hostel.providers (id, tenant_id, name, external_code, token_hash, created_by)
    VALUES (${id}::uuid, ${context.tenantId}::uuid, ${input.name.trim()}, ${input.externalCode?.trim() || null}, ${tokenHash}, ${context.userId}::uuid)
  `;
  return { id, deviceToken: token };
}

async function providerFromToken(rawToken: string): Promise<ProviderAuthRow> {
  const hash = createHash('sha256').update(rawToken).digest('hex');
  const rows = await prisma.$queryRaw<ProviderAuthRow[]>`
    SELECT p.id, p.tenant_id, p.name, p.enabled,
           COALESCE(s.enabled, false) AS module_enabled,
           COALESCE(s.third_party_sync_enabled, false) AS sync_enabled
    FROM campusos_hostel.providers p
    LEFT JOIN campusos_hostel.settings s ON s.tenant_id = p.tenant_id
    WHERE p.token_hash = ${hash}
    LIMIT 1
  `;
  const provider = rows[0];
  if (!provider || !provider.enabled || !provider.module_enabled || !provider.sync_enabled) {
    throw new HostelError('Provider credential is invalid or sync is disabled.', 401);
  }
  return provider;
}

export async function syncThirdPartyHostel(input: {
  token: string;
  snapshotRef: string;
  students: Array<{
    rollNumber: string;
    externalStudentRef?: string | null;
    externalAllocationRef: string;
    facilityName: string;
    building?: string | null;
    roomNumber?: string | null;
    bedLabel?: string | null;
    mealPlan?: string | null;
    status?: 'ACTIVE' | 'RESERVED' | 'CHECKED_OUT';
    charges?: Array<{
      externalChargeRef: string;
      category: HostelCharge['category'];
      description: string;
      amount: number;
      paidAmount?: number;
      currency?: string;
      dueDate?: string | null;
      status?: HostelCharge['status'];
    }>;
  }>;
}) {
  const provider = await providerFromToken(input.token);
  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_hostel.provider_sync_runs
    WHERE provider_id = ${provider.id}::uuid AND snapshot_ref = ${input.snapshotRef}
    LIMIT 1
  `;
  if (existing[0]) return { duplicate: true, accepted: 0, rejected: 0 };

  let accepted = 0;
  let rejected = 0;
  for (const item of input.students.slice(0, 500)) {
    try {
      const students = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM public.students
        WHERE tenant_id = ${provider.tenant_id}::uuid AND "rollNumber" = ${item.rollNumber.trim()}
        LIMIT 1
      `;
      const student = students[0];
      if (!student) { rejected += 1; continue; }

      let facilities = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM campusos_hostel.facilities
        WHERE tenant_id = ${provider.tenant_id}::uuid AND provider_id = ${provider.id}::uuid
          AND name = ${item.facilityName.trim()} AND active = true LIMIT 1
      `;
      let facilityId = facilities[0]?.id;
      if (!facilityId) {
        facilityId = randomUUID();
        await prisma.$executeRaw`
          INSERT INTO campusos_hostel.facilities (id, tenant_id, provider_id, name, building, ownership)
          VALUES (${facilityId}::uuid, ${provider.tenant_id}::uuid, ${provider.id}::uuid,
                  ${item.facilityName.trim()}, ${item.building?.trim() || null}, 'THIRD_PARTY')
        `;
      }

      let roomId: string | null = null;
      if (item.roomNumber?.trim()) {
        const rooms = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT id FROM campusos_hostel.rooms
          WHERE tenant_id = ${provider.tenant_id}::uuid AND facility_id = ${facilityId}::uuid
            AND room_number = ${item.roomNumber.trim()} LIMIT 1
        `;
        roomId = rooms[0]?.id ?? null;
        if (!roomId) {
          roomId = randomUUID();
          await prisma.$executeRaw`
            INSERT INTO campusos_hostel.rooms (id, tenant_id, facility_id, room_number, capacity)
            VALUES (${roomId}::uuid, ${provider.tenant_id}::uuid, ${facilityId}::uuid, ${item.roomNumber.trim()}, 1)
          `;
        }
      }

      const allocationId = randomUUID();
      await prisma.$executeRaw`
        INSERT INTO campusos_hostel.allocations (
          id, tenant_id, student_id, facility_id, room_id, provider_id,
          external_student_ref, external_allocation_ref, bed_label, meal_plan, status, source
        ) VALUES (
          ${allocationId}::uuid, ${provider.tenant_id}::uuid, ${student.id}::uuid,
          ${facilityId}::uuid, ${roomId}::uuid, ${provider.id}::uuid,
          ${item.externalStudentRef ?? null}, ${item.externalAllocationRef}, ${item.bedLabel ?? null},
          ${item.mealPlan ?? null}, ${item.status ?? 'ACTIVE'}, 'THIRD_PARTY'
        )
        ON CONFLICT (provider_id, external_allocation_ref) WHERE provider_id IS NOT NULL AND external_allocation_ref IS NOT NULL
        DO UPDATE SET room_id = EXCLUDED.room_id, bed_label = EXCLUDED.bed_label,
                      meal_plan = EXCLUDED.meal_plan, status = EXCLUDED.status, updated_at = now()
      `;
      await prisma.$executeRaw`
        INSERT INTO campusos_hostel.student_profiles (tenant_id, student_id, hostel_enrolled, updated_at)
        VALUES (${provider.tenant_id}::uuid, ${student.id}::uuid, true, now())
        ON CONFLICT (tenant_id, student_id) DO UPDATE SET hostel_enrolled = true, updated_at = now()
      `;

      for (const charge of (item.charges ?? []).slice(0, 50)) {
        if (!Number.isFinite(charge.amount) || charge.amount < 0) continue;
        const chargeId = randomUUID();
        const paid = Math.max(0, Math.min(charge.amount, Number(charge.paidAmount ?? 0)));
        await prisma.$executeRaw`
          INSERT INTO campusos_hostel.charges (
            id, tenant_id, student_id, allocation_id, provider_id, external_charge_ref,
            category, description, amount, paid_amount, currency, due_date, status, source
          ) VALUES (
            ${chargeId}::uuid, ${provider.tenant_id}::uuid, ${student.id}::uuid,
            (SELECT id FROM campusos_hostel.allocations WHERE provider_id = ${provider.id}::uuid AND external_allocation_ref = ${item.externalAllocationRef} LIMIT 1),
            ${provider.id}::uuid, ${charge.externalChargeRef}, ${charge.category}, ${charge.description.trim()},
            ${charge.amount}, ${paid}, ${(charge.currency ?? 'INR').toUpperCase()}, ${charge.dueDate ?? null}::date,
            ${charge.status ?? (paid >= charge.amount ? 'PAID' : paid > 0 ? 'PARTIAL' : 'DUE')}, 'THIRD_PARTY'
          )
          ON CONFLICT (provider_id, external_charge_ref) WHERE provider_id IS NOT NULL AND external_charge_ref IS NOT NULL
          DO UPDATE SET amount = EXCLUDED.amount, paid_amount = EXCLUDED.paid_amount,
                        due_date = EXCLUDED.due_date, status = EXCLUDED.status, description = EXCLUDED.description,
                        updated_at = now()
        `;
      }
      accepted += 1;
    } catch (error) {
      console.error('Third-party hostel student sync row rejected:', error);
      rejected += 1;
    }
  }
  const runId = randomUUID();
  const received = Math.min(input.students.length, 500);
  const status = accepted === 0 && rejected > 0 ? 'REJECTED' : rejected > 0 ? 'PARTIAL' : 'ACCEPTED';
  await prisma.$transaction([
    prisma.$executeRaw`
      INSERT INTO campusos_hostel.provider_sync_runs (
        id, tenant_id, provider_id, snapshot_ref, received_students, accepted_students, rejected_students, status
      ) VALUES (${runId}::uuid, ${provider.tenant_id}::uuid, ${provider.id}::uuid, ${input.snapshotRef}, ${received}, ${accepted}, ${rejected}, ${status})
    `,
    prisma.$executeRaw`
      UPDATE campusos_hostel.providers SET last_sync_at = now(), updated_at = now() WHERE id = ${provider.id}::uuid
    `,
  ]);
  return { duplicate: false, accepted, rejected };
}
