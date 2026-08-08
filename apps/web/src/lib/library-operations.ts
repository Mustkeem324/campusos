import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import type { ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import { roundMinor, sumMinor, type MoneyMinor } from './finance-money';
import {
  assertLibraryPermission,
  canAuthorizeLibraryFine,
  canCirculate,
  canManageReadingLists,
  canRequestAcquisitions,
  canReviewAcquisitions,
  isLibraryBorrower,
  isLibraryConfigurator,
  isLibraryOperator,
} from './library-policy';
import type {
  AcquisitionView,
  CatalogRecordView,
  FineEventView,
  LibraryAdminOverview,
  LibraryClearanceView,
  LibraryMembershipView,
  LibrarySettings,
  LibraryWorkspaceView,
  LoanView,
  ReadingListView,
  ReservationView,
} from './library-operations-types';

export class LibraryError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'LibraryError';
  }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function dbNumber(value: bigint | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function parseBooleanRow(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
}

function parseJson<T>(value: unknown): T | null {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value) || typeof value === 'object') return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return null;
  }
}

/** Formats a Date to YYYY-MM-DD in the institution's timezone. */
function dateOnly(value: Date | string, timezone: string): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function addDaysUtc(value: Date | string, days: number): Date {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

function daysBetween(startIso: string, endIso: string): number {
  const start = new Date(`${startIso.slice(0, 10)}T00:00:00Z`).getTime();
  const end = new Date(`${endIso.slice(0, 10)}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

type SettingsRow = {
  timezone: string;
  currency: string;
  accession_prefix: string;
  accession_year_format: string;
  accession_sequence_next: bigint | number | string;
  default_student_loan_days: number;
  default_faculty_loan_days: number;
  default_max_renewals: number;
  default_max_active_loans: number;
  default_fine_per_day_minor: bigint | number | string;
  fine_grace_days: number;
  fine_max_cap_minor: bigint | number | string;
  reservation_hold_hours: number;
  reservation_max_active: number;
  clearance_requires_finance: boolean;
};

const DEFAULT_LIBRARY_SETTINGS: LibrarySettings = {
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  accessionPrefix: 'LIB',
  accessionYearFormat: 'YYYY',
  defaultStudentLoanDays: 14,
  defaultFacultyLoanDays: 30,
  defaultMaxRenewals: 1,
  defaultMaxActiveLoans: 4,
  defaultFinePerDayMinor: 500,
  fineGraceDays: 0,
  fineMaxCapMinor: 50_000,
  reservationHoldHours: 48,
  reservationMaxActive: 3,
  clearanceRequiresFinance: false,
};

async function getLibrarySettingsRow(tenantId: string): Promise<SettingsRow | null> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT timezone, currency, accession_prefix, accession_year_format, accession_sequence_next,
             default_student_loan_days, default_faculty_loan_days, default_max_renewals,
             default_max_active_loans, default_fine_per_day_minor, fine_grace_days,
             fine_max_cap_minor, reservation_hold_hours, reservation_max_active,
             clearance_requires_finance
      FROM campusos_library.library_settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getLibrarySettings(tenantId: string): Promise<LibrarySettings> {
  const row = await getLibrarySettingsRow(tenantId);
  if (!row) return { ...DEFAULT_LIBRARY_SETTINGS };
  return {
    timezone: row.timezone || 'Asia/Kolkata',
    currency: row.currency || 'INR',
    accessionPrefix: row.accession_prefix || 'LIB',
    accessionYearFormat: row.accession_year_format || 'YYYY',
    defaultStudentLoanDays: row.default_student_loan_days ?? 14,
    defaultFacultyLoanDays: row.default_faculty_loan_days ?? 30,
    defaultMaxRenewals: row.default_max_renewals ?? 1,
    defaultMaxActiveLoans: row.default_max_active_loans ?? 4,
    defaultFinePerDayMinor: dbNumber(row.default_fine_per_day_minor),
    fineGraceDays: row.fine_grace_days ?? 0,
    fineMaxCapMinor: dbNumber(row.fine_max_cap_minor),
    reservationHoldHours: row.reservation_hold_hours ?? 48,
    reservationMaxActive: row.reservation_max_active ?? 3,
    clearanceRequiresFinance: parseBooleanRow(row.clearance_requires_finance),
  };
}

async function ensureLibrarySettingsRow(tenantId: string) {
  await prisma.$executeRaw`
    INSERT INTO campusos_library.library_settings (tenant_id, updated_at)
    VALUES (${tenantId}::uuid, now())
    ON CONFLICT (tenant_id) DO NOTHING
  `;
}

export async function updateLibrarySettings(
  context: ActiveUserContext,
  patch: Partial<LibrarySettings>,
): Promise<LibrarySettings> {
  assertLibraryPermission(isLibraryConfigurator(context), 'library:settings:update');
  const settings = await getLibrarySettings(context.tenantId);

  const timezone = patch.timezone ?? settings.timezone;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  } catch {
    throw new LibraryError('Timezone is invalid.', 400);
  }
  const currency = (patch.currency ?? settings.currency).toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new LibraryError('Currency must be a 3-letter ISO code.', 400);

  await ensureLibrarySettingsRow(context.tenantId);
  await prisma.$executeRaw`
    UPDATE campusos_library.library_settings
    SET timezone = ${timezone},
        currency = ${currency},
        accession_prefix = ${(patch.accessionPrefix ?? settings.accessionPrefix).slice(0, 16)},
        accession_year_format = ${(patch.accessionYearFormat ?? settings.accessionYearFormat).slice(0, 8)},
        default_student_loan_days = ${patch.defaultStudentLoanDays ?? settings.defaultStudentLoanDays},
        default_faculty_loan_days = ${patch.defaultFacultyLoanDays ?? settings.defaultFacultyLoanDays},
        default_max_renewals = ${patch.defaultMaxRenewals ?? settings.defaultMaxRenewals},
        default_max_active_loans = ${patch.defaultMaxActiveLoans ?? settings.defaultMaxActiveLoans},
        default_fine_per_day_minor = ${patch.defaultFinePerDayMinor ?? settings.defaultFinePerDayMinor},
        fine_grace_days = ${patch.fineGraceDays ?? settings.fineGraceDays},
        fine_max_cap_minor = ${patch.fineMaxCapMinor ?? settings.fineMaxCapMinor},
        reservation_hold_hours = ${patch.reservationHoldHours ?? settings.reservationHoldHours},
        reservation_max_active = ${patch.reservationMaxActive ?? settings.reservationMaxActive},
        clearance_requires_finance = ${patch.clearanceRequiresFinance ?? settings.clearanceRequiresFinance},
        updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid
  `;
  await writeLibraryAudit(context, 'SETTINGS_UPDATED', 'library_settings', context.tenantId, settings, patch, 'Library policy settings updated');
  return getLibrarySettings(context.tenantId);
}

async function writeLibraryAudit(
  context: ActiveUserContext,
  action: string,
  targetType: string,
  targetId: string | null,
  previousState: unknown,
  newState: unknown,
  reason?: string,
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_library.library_audit_events
        (id, tenant_id, actor_user_id, actor_role, action, target_type, target_id,
         previous_state, new_state, reason, created_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid, ${context.activeRole},
         ${action}, ${targetType}, ${targetId}, ${JSON.stringify(previousState ?? null)}::jsonb,
         ${JSON.stringify(newState ?? null)}::jsonb, ${reason ?? null}, now())
    `;
  } catch {
    // Audit failures must never break the primary operation.
  }
}

// ---------------------------------------------------------------------------
// Memberships (derived from authoritative NAVEMORA identity)
// ---------------------------------------------------------------------------

function mapMembershipRow(row: {
  id: string;
  user_id: string;
  member_number: string;
  member_type: string;
  status: string;
  program_id: string | null;
  department_id: string | null;
  name: string;
  email: string;
}): LibraryMembershipView {
  return {
    id: row.id,
    userId: row.user_id,
    memberNumber: row.member_number,
    memberType: row.member_type,
    status: row.status,
    programId: row.program_id,
    departmentId: row.department_id,
    userName: row.name,
    email: row.email,
  };
}

/**
 * Server-derives (idempotently) the library membership for a user from their
 * authoritative NAVEMORA identity — never from client-side membership claims.
 */
export async function ensureLibraryMembership(context: ActiveUserContext): Promise<LibraryMembershipView | null> {
  if (!isLibraryBorrower(context) && !isLibraryOperator(context)) return null;

  const existing = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_library.library_memberships
    WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  if (existing[0]) return getMembershipById(context, existing[0].id);

  const identity = await prisma.$queryRaw<Array<{ member_type: string; program_id: string | null; department_id: string | null }>>`
    SELECT 'STUDENT' AS member_type, s.program_id, NULL::uuid AS department_id
    FROM public.students s
    WHERE s.tenant_id = ${context.tenantId}::uuid AND s.user_id = ${context.userId}::uuid AND s.is_active = true
    UNION ALL
    SELECT 'FACULTY' AS member_type, NULL::uuid AS program_id, st.department_id
    FROM public.staff st
    WHERE st.tenant_id = ${context.tenantId}::uuid AND st.user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  const memberType = context.activeRole === 'FACULTY' ? 'FACULTY' : identity[0]?.member_type ?? 'STUDENT';
  const settings = await getLibrarySettings(context.tenantId);
  await ensureLibrarySettingsRow(context.tenantId);

  let memberId: string = randomUUID();
  const memberNumber = `${settings.accessionPrefix}/MEM/${memberType.slice(0, 3)}/${Date.now().toString(36).toUpperCase()}`;
  try {
    await prisma.$transaction(async (tx) => {
      const seq = await tx.$queryRaw<Array<{ accession_sequence_next: bigint | number | string }>>`
        SELECT accession_sequence_next FROM campusos_library.library_settings
        WHERE tenant_id = ${context.tenantId}::uuid FOR UPDATE
      `;
      const next = dbNumber(seq[0]?.accession_sequence_next ?? 1);
      await tx.$executeRaw`
        INSERT INTO campusos_library.library_memberships
          (id, tenant_id, user_id, member_type, member_number, status, program_id, department_id,
           source, created_by, created_at, updated_at)
        VALUES
          (${memberId}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid, ${memberType},
           ${memberNumber}, 'ACTIVE', ${identity[0]?.program_id ? Prisma.sql`${identity[0].program_id}::uuid` : Prisma.sql`NULL`},
           ${identity[0]?.department_id ? Prisma.sql`${identity[0].department_id}::uuid` : Prisma.sql`NULL`},
           'DERIVED', ${context.userId}::uuid, now(), now())
      `;
      await tx.$executeRaw`
        UPDATE campusos_library.library_settings
        SET accession_sequence_next = ${next + 1}, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid
      `;
    }, { timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('library_memberships_tenant_user_uq') || message.includes('unique constraint')) {
      const again = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM campusos_library.library_memberships
        WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${context.userId}::uuid LIMIT 1
      `;
      if (again[0]) {
        memberId = again[0].id;
        return getMembershipById(context, memberId);
      }
    }
    throw error;
  }
  return getMembershipById(context, memberId);
}

export async function getMembershipById(context: ActiveUserContext, membershipId: string): Promise<LibraryMembershipView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; user_id: string; member_number: string; member_type: string; status: string;
    program_id: string | null; department_id: string | null; name: string; email: string;
  }>>`
    SELECT m.id, m.user_id, m.member_number, m.member_type, m.status, m.program_id, m.department_id,
           u.name, u.email
    FROM campusos_library.library_memberships m
    JOIN public.users u ON u.id = m.user_id
    WHERE m.tenant_id = ${context.tenantId}::uuid AND m.id = ${membershipId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('Library membership not found.', 404);
  return mapMembershipRow(rows[0]);
}

export async function listMemberships(context: ActiveUserContext): Promise<LibraryMembershipView[]> {
  assertLibraryPermission(isLibraryOperator(context), 'library:memberships:read');
  const rows = await prisma.$queryRaw<Array<{
    id: string; user_id: string; member_number: string; member_type: string; status: string;
    program_id: string | null; department_id: string | null; name: string; email: string;
  }>>`
    SELECT m.id, m.user_id, m.member_number, m.member_type, m.status, m.program_id, m.department_id,
           u.name, u.email
    FROM campusos_library.library_memberships m
    JOIN public.users u ON u.id = m.user_id
    WHERE m.tenant_id = ${context.tenantId}::uuid
    ORDER BY m.created_at DESC
    LIMIT 200
  `;
  return rows.map(mapMembershipRow);
}

export async function updateMembershipStatus(
  context: ActiveUserContext,
  membershipId: string,
  input: { status: string; reason: string },
): Promise<LibraryMembershipView> {
  assertLibraryPermission(canCirculate(context), 'library:memberships:status');
  const current = await getMembershipById(context, membershipId);
  const allowed = new Set(['ACTIVE', 'SUSPENDED', 'EXPIRED', 'BLOCKED', 'CLEARANCE_PENDING', 'CLOSED']);
  if (!allowed.has(input.status)) throw new LibraryError('Invalid membership status.', 400);
  if (!input.reason.trim()) throw new LibraryError('A reason is required.', 400);
  await prisma.$executeRaw`
    UPDATE campusos_library.library_memberships
    SET status = ${input.status}, updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${membershipId}::uuid
  `;
  await writeLibraryAudit(context, 'MEMBERSHIP_STATUS_CHANGED', 'library_memberships', membershipId, { status: current.status }, { status: input.status }, input.reason);
  return getMembershipById(context, membershipId);
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------

type CatalogRow = {
  id: string;
  title: string;
  subtitle: string | null;
  resource_type: string;
  publisher: string | null;
  edition: string | null;
  publication_year: number | null;
  isbn: string | null;
  issn: string | null;
  doi: string | null;
  language: string;
  subject: string | null;
  keywords: unknown;
  description: string | null;
  call_number: string | null;
  status: string;
};

type CopyRow = {
  id: string;
  accession_number: string;
  barcode: string | null;
  shelf: string | null;
  location_name: string | null;
  status: string;
  condition: string;
};

export async function createCatalogRecord(
  context: ActiveUserContext,
  input: {
    title: string;
    subtitle?: string;
    resourceType?: string;
    authors?: Array<{ name: string; role?: string }>;
    publisher?: string;
    edition?: string;
    publicationYear?: number;
    isbn?: string;
    issn?: string;
    doi?: string;
    language?: string;
    subject?: string;
    keywords?: string[];
    description?: string;
    callNumber?: string;
    copies?: Array<{ locationId?: string; barcode?: string; shelf?: string; condition?: string; priceMinor?: MoneyMinor }>;
  },
): Promise<CatalogRecordView> {
  assertLibraryPermission(isLibraryOperator(context), 'library:catalog:create');
  if (!input.title.trim()) throw new LibraryError('Title is required.', 400);
  const settings = await getLibrarySettings(context.tenantId);
  await ensureLibrarySettingsRow(context.tenantId);

  const recordId = randomUUID();
  const year = settings.accessionYearFormat === 'YYYY'
    ? String(new Date().getFullYear())
    : String(new Date().getFullYear()).slice(2);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_library.catalog_records
        (id, tenant_id, title, subtitle, resource_type, publisher, edition, publication_year,
         isbn, issn, doi, language, subject, keywords, description, classification, call_number,
         status, created_by, created_at, updated_at)
      VALUES
        (${recordId}::uuid, ${context.tenantId}::uuid, ${input.title.trim()}, ${input.subtitle ?? null},
         ${input.resourceType ?? 'BOOK'}, ${input.publisher ?? null}, ${input.edition ?? null},
         ${input.publicationYear ?? null}, ${input.isbn ?? null}, ${input.issn ?? null}, ${input.doi ?? null},
         ${input.language ?? 'English'}, ${input.subject ?? null}, ${JSON.stringify(input.keywords ?? [])}::jsonb,
         ${input.description ?? null}, ${input.subject ?? null}, ${input.callNumber ?? null},
         'ACTIVE', ${context.userId}::uuid, now(), now())
    `;
    const authors = input.authors?.length ? input.authors : [{ name: 'Unknown', role: 'AUTHOR' }];
    for (const [index, author] of authors.entries()) {
      await tx.$executeRaw`
        INSERT INTO campusos_library.catalog_authors (id, tenant_id, record_id, name, role, position)
        VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${recordId}::uuid,
                ${author.name.trim()}, ${author.role ?? 'AUTHOR'}, ${index})
      `;
    }
    // Reserve accession numbers for each physical copy (concurrency safe).
    for (const copy of input.copies ?? []) {
      const seq = await tx.$queryRaw<Array<{ accession_sequence_next: bigint | number | string }>>`
        SELECT accession_sequence_next FROM campusos_library.library_settings
        WHERE tenant_id = ${context.tenantId}::uuid FOR UPDATE
      `;
      const next = dbNumber(seq[0]?.accession_sequence_next ?? 1);
      const accessionNumber = `${settings.accessionPrefix}/${year}/${String(next).padStart(6, '0')}`;
      await tx.$executeRaw`
        INSERT INTO campusos_library.physical_copies
          (id, tenant_id, record_id, location_id, accession_number, barcode, shelf, condition, status,
           price_minor, currency, created_at, updated_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${recordId}::uuid,
           ${copy.locationId ? Prisma.sql`${copy.locationId}::uuid` : Prisma.sql`NULL`},
           ${accessionNumber}, ${copy.barcode ?? null}, ${copy.shelf ?? null}, ${copy.condition ?? 'GOOD'},
           ${copy.condition === 'DAMAGED' ? 'DAMAGED' : 'AVAILABLE'}, ${copy.priceMinor ?? null},
           ${settings.currency}, now(), now())
      `;
      await tx.$executeRaw`
        UPDATE campusos_library.library_settings
        SET accession_sequence_next = ${next + 1}, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid
      `;
    }
  }, { timeout: 30_000 });

  await writeLibraryAudit(
    context,
    'CATALOG_CREATED',
    'catalog_records',
    recordId,
    null,
    { title: input.title, resourceType: input.resourceType ?? 'BOOK', copies: (input.copies ?? []).length },
    'Catalog record created',
  );
  return getCatalogRecord(context, recordId);
}

export async function getCatalogRecord(context: ActiveUserContext, recordId: string): Promise<CatalogRecordView> {
  if (!UUID_RE.test(recordId)) throw new LibraryError('Invalid catalog record identifier.', 400);
  const rows = await prisma.$queryRaw<CatalogRow[]>`SELECT * FROM (
    SELECT r.id, r.title, r.subtitle, r.resource_type, r.publisher, r.edition, r.publication_year,
           r.isbn, r.issn, r.doi, r.language, r.subject, r.keywords, r.description, r.call_number, r.status
    FROM campusos_library.catalog_records r
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.id = ${recordId}::uuid
    LIMIT 1
  ) sub`;
  if (!rows[0]) throw new LibraryError('Catalog record not found.', 404);
  return enrichCatalogRow(context, rows[0]);
}

type CatalogQueryRow = CatalogRow & {
  available_copies: bigint | number;
  total_copies: bigint | number;
  active_loans: bigint | number;
  active_reservations: bigint | number;
};

async function enrichCatalogRow(context: ActiveUserContext, row: CatalogRow): Promise<CatalogRecordView> {
  const [authors, copies] = await Promise.all([
    prisma.$queryRaw<Array<{ id: string; name: string; role: string; position: number }>>`
      SELECT id, name, role, position FROM campusos_library.catalog_authors
      WHERE tenant_id = ${context.tenantId}::uuid AND record_id = ${row.id}::uuid
      ORDER BY position
    `,
    prisma.$queryRaw<Array<{
      id: string; accession_number: string; barcode: string | null; shelf: string | null;
      location_name: string | null; status: string; condition: string;
    }>>`
      SELECT c.id, c.accession_number, c.barcode, c.shelf, l.name AS location_name, c.status, c.condition
      FROM campusos_library.physical_copies c
      LEFT JOIN campusos_library.library_locations l ON l.id = c.location_id
      WHERE c.tenant_id = ${context.tenantId}::uuid AND c.record_id = ${row.id}::uuid
      ORDER BY c.accession_number
    `,
  ]);
  const [loanCount, reservationCount] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT count(*) AS total
      FROM campusos_library.loans l
      JOIN campusos_library.physical_copies c ON c.id = l.copy_id
      WHERE l.tenant_id = ${context.tenantId}::uuid AND c.record_id = ${row.id}::uuid AND l.returned_at IS NULL
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT count(*) AS total FROM campusos_library.reservations
      WHERE tenant_id = ${context.tenantId}::uuid AND record_id = ${row.id}::uuid AND status = 'ACTIVE'
    `,
  ]);
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    resourceType: row.resource_type,
    publisher: row.publisher,
    edition: row.edition,
    publicationYear: row.publication_year,
    isbn: row.isbn,
    issn: row.issn,
    doi: row.doi,
    language: row.language,
    subject: row.subject,
    keywords: parseJson<unknown[]>(row.keywords) ?? [],
    description: row.description,
    callNumber: row.call_number,
    status: row.status,
    authors,
    copies: copies.map((copy) => ({
      id: copy.id,
      accessionNumber: copy.accession_number,
      barcode: copy.barcode,
      shelf: copy.shelf,
      locationName: copy.location_name,
      status: copy.status,
      condition: copy.condition,
    })),
    availableCopies: Math.max(0, copies.filter((copy) => copy.status === 'AVAILABLE').length),
    totalCopies: copies.length,
    activeLoans: dbNumber(loanCount[0]?.total ?? 0),
    activeReservations: dbNumber(reservationCount[0]?.total ?? 0),
  };
}

export async function listCatalog(
  context: ActiveUserContext,
  filters: { search?: string; resourceType?: string; availableOnly?: boolean; page?: number; pageSize?: number } = {},
): Promise<{ items: CatalogRecordView[]; total: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 24));
  const conditions: string[] = ['r.tenant_id = $1::uuid'];
  const params: unknown[] = [context.tenantId];
  if (filters.search?.trim()) {
    conditions.push(`(r.title ILIKE $${params.length + 1} OR r.isbn ILIKE $${params.length + 1} OR r.subject ILIKE $${params.length + 1} OR r.call_number ILIKE $${params.length + 1} OR EXISTS (SELECT 1 FROM campusos_library.catalog_authors a WHERE a.record_id = r.id AND a.name ILIKE $${params.length + 1}))`);
    params.push(`%${filters.search.trim()}%`);
  }
  if (filters.resourceType) {
    conditions.push(`r.resource_type = $${params.length + 1}`);
    params.push(filters.resourceType);
  }
  const whereSql = conditions.join(' AND ');

  const countRows = await prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
    SELECT count(*) AS total
    FROM campusos_library.catalog_records r
    WHERE ${Prisma.raw(whereSql)}
  `, ...params);

  const rows = await prisma.$queryRaw<CatalogRow[]>(Prisma.sql`
    SELECT r.id, r.title, r.subtitle, r.resource_type, r.publisher, r.edition, r.publication_year,
           r.isbn, r.issn, r.doi, r.language, r.subject, r.keywords, r.description, r.call_number, r.status
    FROM campusos_library.catalog_records r
    WHERE ${Prisma.raw(whereSql)}
    ORDER BY r.created_at DESC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `, ...params);

  let items = await Promise.all(rows.map((row) => enrichCatalogRow(context, row)));
  if (filters.availableOnly) items = items.filter((item) => item.availableCopies > 0);
  return { items, total: dbNumber(countRows[0]?.total ?? 0) };
}

export async function addPhysicalCopies(
  context: ActiveUserContext,
  recordId: string,
  input: { copies: Array<{ locationId?: string; barcode?: string; shelf?: string; condition?: string; priceMinor?: MoneyMinor }> },
): Promise<CatalogRecordView> {
  assertLibraryPermission(isLibraryOperator(context), 'library:catalog:copies');
  await getCatalogRecord(context, recordId);
  const settings = await getLibrarySettings(context.tenantId);
  await ensureLibrarySettingsRow(context.tenantId);
  const year = settings.accessionYearFormat === 'YYYY' ? String(new Date().getFullYear()) : String(new Date().getFullYear()).slice(2);

  await prisma.$transaction(async (tx) => {
    for (const copy of input.copies) {
      const seq = await tx.$queryRaw<Array<{ accession_sequence_next: bigint | number | string }>>`
        SELECT accession_sequence_next FROM campusos_library.library_settings
        WHERE tenant_id = ${context.tenantId}::uuid FOR UPDATE
      `;
      const next = dbNumber(seq[0]?.accession_sequence_next ?? 1);
      await tx.$executeRaw`
        INSERT INTO campusos_library.physical_copies
          (id, tenant_id, record_id, location_id, accession_number, barcode, shelf, condition, status,
           price_minor, currency, created_at, updated_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${recordId}::uuid,
           ${copy.locationId ? Prisma.sql`${copy.locationId}::uuid` : Prisma.sql`NULL`},
           ${`${settings.accessionPrefix}/${year}/${String(next).padStart(6, '0')}`}, ${copy.barcode ?? null},
           ${copy.shelf ?? null}, ${copy.condition ?? 'GOOD'}, ${copy.condition === 'DAMAGED' ? 'DAMAGED' : 'AVAILABLE'},
           ${copy.priceMinor ?? null}, ${settings.currency}, now(), now())
      `;
      await tx.$executeRaw`
        UPDATE campusos_library.library_settings
        SET accession_sequence_next = ${next + 1}, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid
      `;
    }
  }, { timeout: 30_000 });
  await writeLibraryAudit(context, 'COPIES_ADDED', 'catalog_records', recordId, null, { copies: input.copies.length }, 'Physical copies added');
  return getCatalogRecord(context, recordId);
}

export async function updateCopyStatus(
  context: ActiveUserContext,
  copyId: string,
  input: { status: string; note?: string },
): Promise<CatalogRecordView> {
  assertLibraryPermission(isLibraryOperator(context), 'library:copies:status');
  if (!UUID_RE.test(copyId)) throw new LibraryError('Invalid copy identifier.', 400);
  const copyRows = await prisma.$queryRaw<Array<{ record_id: string; status: string }>>`
    SELECT record_id, status FROM campusos_library.physical_copies
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${copyId}::uuid LIMIT 1
  `;
  if (!copyRows[0]) throw new LibraryError('Physical copy not found.', 404);
  await prisma.$executeRaw`
    UPDATE campusos_library.physical_copies
    SET status = ${input.status}, updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${copyId}::uuid
  `;
  await writeLibraryAudit(context, 'COPY_STATUS_CHANGED', 'physical_copies', copyId, { status: copyRows[0].status }, { status: input.status }, input.note);
  return getCatalogRecord(context, copyRows[0].record_id);
}

// ---------------------------------------------------------------------------
// Circulation (issue / renew / return)
// ---------------------------------------------------------------------------

type LoanRow = {
  id: string;
  copy_id: string;
  member_id: string;
  issue_date: Date;
  due_date: Date;
  returned_at: Date | null;
  renewal_count: number;
  status: string;
  member_name: string;
  accession_number: string;
  title: string;
};

function mapLoanRow(row: LoanRow, timezone: string, settings: LibrarySettings): LoanView {
  const returned = row.returned_at ? new Date(row.returned_at) : null;
  const overdue = !returned && new Date(row.due_date).getTime() < Date.now();
  const overdueDays = overdue ? daysBetween(row.due_date.toISOString(), new Date().toISOString()) : 0;
  let fineMinor = 0;
  if (overdue && settings.defaultFinePerDayMinor > 0) {
    const effective = Math.max(0, overdueDays - settings.fineGraceDays);
    fineMinor = roundMinor(Math.min(settings.fineMaxCapMinor, effective * settings.defaultFinePerDayMinor));
  }
  return {
    id: row.id,
    copyId: row.copy_id,
    memberId: row.member_id,
    memberName: row.member_name,
    accessionNumber: row.accession_number,
    title: row.title,
    issueDate: dateOnly(row.issue_date, timezone),
    dueDate: dateOnly(row.due_date, timezone),
    returnedAt: returned ? returned.toISOString() : null,
    renewalCount: row.renewal_count,
    status: row.status,
    overdueDays,
    fineMinor,
  };
}

async function getLoanById(context: ActiveUserContext, loanId: string, timezone: string, settings: LibrarySettings): Promise<LoanView> {
  const rows = await prisma.$queryRaw<LoanRow[]>`
    SELECT l.id, l.copy_id, l.member_id, l.issue_date, l.due_date, l.returned_at, l.renewal_count, l.status,
           u.name AS member_name, c.accession_number, r.title
    FROM campusos_library.loans l
    JOIN campusos_library.physical_copies c ON c.id = l.copy_id
    JOIN campusos_library.catalog_records r ON r.id = c.record_id
    JOIN campusos_library.library_memberships m ON m.id = l.member_id
    JOIN public.users u ON u.id = m.user_id
    WHERE l.tenant_id = ${context.tenantId}::uuid AND l.id = ${loanId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('Loan not found.', 404);
  return mapLoanRow(rows[0], timezone, settings);
}

async function requireActiveMembership(context: ActiveUserContext): Promise<{ id: string; member_type: string }> {
  const rows = await prisma.$queryRaw<Array<{ id: string; member_type: string }>>`
    SELECT id, member_type FROM campusos_library.library_memberships
    WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${context.userId}::uuid AND status = 'ACTIVE'
    LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('You do not have an active library membership.', 403);
  return rows[0];
}

export async function issuePhysicalItem(
  context: ActiveUserContext,
  input: { memberId: string; copyId: string },
): Promise<LoanView> {
  assertLibraryPermission(canCirculate(context), 'library:circulation:issue');
  if (!UUID_RE.test(input.memberId) || !UUID_RE.test(input.copyId)) throw new LibraryError('Invalid identifiers.', 400);
  const settings = await getLibrarySettings(context.tenantId);
  const member = await getMembershipById(context, input.memberId);
  if (member.status !== 'ACTIVE') throw new LibraryError('The member is not active.', 403);

  const copyRows = await prisma.$queryRaw<Array<{ id: string; status: string; record_id: string }>>`
    SELECT id, status, record_id FROM campusos_library.physical_copies
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.copyId}::uuid LIMIT 1
  `;
  if (!copyRows[0]) throw new LibraryError('Physical copy not found.', 404);
  if (copyRows[0].status === 'REFERENCE_ONLY') throw new LibraryError('Reference-only items cannot be issued.', 422);
  if (copyRows[0].status !== 'AVAILABLE') throw new LibraryError('That copy is not available for issue.', 409);

  const activeLoans = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT count(*) AS total FROM campusos_library.loans
    WHERE tenant_id = ${context.tenantId}::uuid AND member_id = ${input.memberId}::uuid AND returned_at IS NULL
  `;
  if (dbNumber(activeLoans[0]?.total ?? 0) >= settings.defaultMaxActiveLoans) {
    throw new LibraryError('The borrower has reached the active-loan limit.', 409);
  }

  const loanId = randomUUID();
  try {
    await prisma.$transaction(async (tx) => {
      const issueDate = new Date();
      const due = addDaysUtc(issueDate, settings.defaultStudentLoanDays + (member.memberType === 'FACULTY' ? settings.defaultFacultyLoanDays - settings.defaultStudentLoanDays : 0));
      await tx.$executeRaw`
        INSERT INTO campusos_library.loans
          (id, tenant_id, copy_id, member_id, issued_by, issue_date, due_date, renewal_count,
           policy_snapshot, status, created_at, updated_at)
        VALUES
          (${loanId}::uuid, ${context.tenantId}::uuid, ${input.copyId}::uuid, ${input.memberId}::uuid,
           ${context.userId}::uuid, ${issueDate}, ${due}, 0,
           ${JSON.stringify({ maxRenewals: settings.defaultMaxRenewals, finePerDayMinor: settings.defaultFinePerDayMinor })}::jsonb,
           'ACTIVE', now(), now())
      `;
      await tx.$executeRaw`
        UPDATE campusos_library.physical_copies
        SET status = 'ISSUED', updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.copyId}::uuid
      `;
      await tx.$executeRaw`
        INSERT INTO campusos_library.loan_events (id, tenant_id, loan_id, event_type, actor_user_id, actor_role, detail, created_at)
        VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${loanId}::uuid, 'ISSUED',
                ${context.userId}::uuid, ${context.activeRole}, ${JSON.stringify({ memberId: input.memberId, copyId: input.copyId })}::jsonb, now())
      `;
      // Fulfil the member's own reservation for this title if one is waiting.
      await tx.$executeRaw`
        UPDATE campusos_library.reservations
        SET status = 'FULFILLED', fulfilled_copy_id = ${input.copyId}::uuid
        WHERE tenant_id = ${context.tenantId}::uuid AND record_id = ${copyRows[0].record_id}::uuid
          AND member_id = ${input.memberId}::uuid AND status = 'ACTIVE'
      `;
    }, { timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('loans_active_copy_uq') || message.includes('unique constraint')) {
      throw new LibraryError('That physical copy has already been issued.', 409);
    }
    throw error;
  }
  await writeLibraryAudit(context, 'LOAN_ISSUED', 'loans', loanId, null, { memberId: input.memberId, copyId: input.copyId }, 'Physical item issued');
  return getLoanById(context, loanId, settings.timezone, settings);
}

export async function renewLoan(context: ActiveUserContext, loanId: string): Promise<LoanView> {
  const settings = await getLibrarySettings(context.tenantId);
  const current = await getLoanById(context, loanId, settings.timezone, settings);
  if (current.status !== 'ACTIVE' || current.returnedAt) throw new LibraryError('This loan is not renewable.', 409);
  if (!isLibraryOperator(context) && current.memberId !== (await requireActiveMembership(context)).id) {
    throw new LibraryError('You may only renew your own loans.', 403);
  }
  if (current.renewalCount >= settings.defaultMaxRenewals) throw new LibraryError('The renewal limit has been reached.', 409);

  const waiting = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT count(*) AS total
    FROM campusos_library.reservations r
    JOIN campusos_library.physical_copies c ON c.id = ${current.copyId}::uuid AND c.record_id = r.record_id
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.status = 'ACTIVE' AND r.member_id <> ${current.memberId}::uuid
  `;
  if (dbNumber(waiting[0]?.total ?? 0) > 0) throw new LibraryError('Another member is waiting for this title, so renewal is unavailable.', 409);

  const newDue = addDaysUtc(current.dueDate, settings.defaultStudentLoanDays);
  await prisma.$executeRaw`
    UPDATE campusos_library.loans
    SET due_date = ${newDue}, renewal_count = renewal_count + 1, updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${loanId}::uuid
  `;
  await prisma.$executeRaw`
    INSERT INTO campusos_library.loan_events (id, tenant_id, loan_id, event_type, actor_user_id, actor_role, detail, created_at)
    VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${loanId}::uuid, 'RENEWED',
            ${context.userId}::uuid, ${context.activeRole}, ${JSON.stringify({ newDue: newDue.toISOString() })}::jsonb, now())
  `;
  await writeLibraryAudit(context, 'LOAN_RENEWED', 'loans', loanId, { renewalCount: current.renewalCount }, { renewalCount: current.renewalCount + 1 }, 'Loan renewed');
  return getLoanById(context, loanId, settings.timezone, settings);
}

export async function returnLoan(context: ActiveUserContext, loanId: string): Promise<LoanView> {
  assertLibraryPermission(canCirculate(context), 'library:circulation:return');
  const settings = await getLibrarySettings(context.tenantId);
  const current = await getLoanById(context, loanId, settings.timezone, settings);
  if (current.status !== 'ACTIVE' || current.returnedAt) throw new LibraryError('This loan is already returned.', 409);

  const returnedAt = new Date();
  const fineMinor = current.overdueDays > 0 && settings.defaultFinePerDayMinor > 0
    ? roundMinor(Math.min(settings.fineMaxCapMinor, Math.max(0, current.overdueDays - settings.fineGraceDays) * settings.defaultFinePerDayMinor))
    : 0;

  try {
    await prisma.$transaction(async (tx) => {
      // The returned_at IS NULL guard makes a concurrent duplicate return
      // affect zero rows, so a second fine can never be assessed.
      const updated = await tx.$executeRaw`
        UPDATE campusos_library.loans
        SET returned_at = ${returnedAt}, returned_by = ${context.userId}::uuid,
            return_condition = 'GOOD', status = 'RETURNED', updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${loanId}::uuid
          AND returned_at IS NULL
      `;
      if (updated === 0) throw new LibraryError('This loan is already returned.', 409);
      await tx.$executeRaw`
        UPDATE campusos_library.physical_copies
        SET status = 'AVAILABLE', updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${current.copyId}::uuid
      `;
      await tx.$executeRaw`
        INSERT INTO campusos_library.loan_events (id, tenant_id, loan_id, event_type, actor_user_id, actor_role, detail, created_at)
        VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${loanId}::uuid, 'RETURNED',
                ${context.userId}::uuid, ${context.activeRole}, ${JSON.stringify({ returnedAt: returnedAt.toISOString() })}::jsonb, now())
      `;
      if (fineMinor > 0) {
        await tx.$executeRaw`
          INSERT INTO campusos_library.fine_events
            (id, tenant_id, member_id, loan_id, event_type, amount_minor, currency, reason, actor_user_id, actor_role, created_at)
          VALUES
            (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${current.memberId}::uuid, ${loanId}::uuid,
             'ASSESSED', ${fineMinor}, ${settings.currency},
             ${`Overdue by ${current.overdueDays} day(s)`}, ${context.userId}::uuid, ${context.activeRole}, now())
        `;
      }
    }, { timeout: 30_000 });
  } catch (error) {
    if (error instanceof LibraryError) throw error;
    throw new LibraryError('The return could not be completed.', 409);
  }

  await writeLibraryAudit(context, 'LOAN_RETURNED', 'loans', loanId, { status: 'ACTIVE' }, { status: 'RETURNED', fineMinor }, 'Physical item returned');
  return getLoanById(context, loanId, settings.timezone, settings);
}

// ---------------------------------------------------------------------------
// Fines
// ---------------------------------------------------------------------------

export async function listMemberFines(context: ActiveUserContext, memberId: string): Promise<FineEventView[]> {
  if (!isLibraryOperator(context)) {
    const own = await requireActiveMembership(context);
    if (own.id !== memberId) throw new LibraryError('You may only view your own fine history.', 403);
  }
  const rows = await prisma.$queryRaw<Array<{ id: string; event_type: string; amount_minor: bigint | number | string; currency: string; reason: string | null; finance_reference: string | null; created_at: Date }>>`
    SELECT id, event_type, amount_minor, currency, reason, finance_reference, created_at
    FROM campusos_library.fine_events
    WHERE tenant_id = ${context.tenantId}::uuid AND member_id = ${memberId}::uuid
    ORDER BY created_at DESC
    LIMIT 100
  `;
  return rows.map((row) => ({
    id: row.id,
    eventType: row.event_type,
    amountMinor: dbNumber(row.amount_minor),
    currency: row.currency,
    reason: row.reason,
    financeReference: row.finance_reference,
    createdAt: row.created_at.toISOString(),
  }));
}

export async function waiveFine(
  context: ActiveUserContext,
  fineId: string,
  input: { amountMinor?: MoneyMinor; reason: string },
): Promise<FineEventView> {
  assertLibraryPermission(canAuthorizeLibraryFine(context), 'library:fines:waive');
  if (!UUID_RE.test(fineId)) throw new LibraryError('Invalid fine identifier.', 400);
  if (!input.reason.trim()) throw new LibraryError('A reason is required for a fine waiver.', 400);
  const rows = await prisma.$queryRaw<Array<{ id: string; member_id: string; loan_id: string | null; event_type: string; amount_minor: bigint | number | string; currency: string; reason: string | null; finance_reference: string | null; created_at: Date }>>`
    SELECT id, member_id, loan_id, event_type, amount_minor, currency, reason, finance_reference, created_at
    FROM campusos_library.fine_events
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${fineId}::uuid LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('Fine event not found.', 404);
  if (rows[0].event_type === 'WAIVED') throw new LibraryError('This fine has already been waived.', 409);
  const assessedMinor = dbNumber(rows[0].amount_minor);
  const amount = input.amountMinor !== undefined ? input.amountMinor : assessedMinor;
  if (!Number.isFinite(amount) || amount <= 0) throw new LibraryError('The waiver amount must be a positive value.', 400);
  if (amount > assessedMinor) throw new LibraryError('The waiver cannot exceed the assessed fine.', 400);
  // Double-waiver protection: a WAIVED event may reference one assessed fine only.
  const existingWaiver = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_library.fine_events
    WHERE tenant_id = ${context.tenantId}::uuid AND related_fine_id = ${fineId}::uuid
    LIMIT 1
  `;
  if (existingWaiver[0]) throw new LibraryError('This fine has already been waived.', 409);
  const waivedId = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_library.fine_events
        (id, tenant_id, member_id, loan_id, related_fine_id, event_type, amount_minor, currency, reason, actor_user_id, actor_role, created_at)
      VALUES
        (${waivedId}::uuid, ${context.tenantId}::uuid, ${rows[0].member_id}::uuid, ${rows[0].loan_id ? Prisma.sql`${rows[0].loan_id}::uuid` : Prisma.sql`NULL`},
         ${fineId}::uuid, 'WAIVED', ${amount},
         ${rows[0].currency}, ${`Waiver of assessed fine — ${input.reason}`}, ${context.userId}::uuid, ${context.activeRole}, now())
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('fine_events_waiver_related_uq') || message.includes('unique constraint')) {
      throw new LibraryError('This fine has already been waived.', 409);
    }
    throw error;
  }
  await writeLibraryAudit(context, 'FINE_WAIVED', 'fine_events', fineId, { amountMinor: dbNumber(rows[0].amount_minor) }, { waivedAmountMinor: amount }, input.reason);
  const created = await prisma.$queryRaw<Array<{ id: string; event_type: string; amount_minor: bigint | number | string; currency: string; reason: string | null; finance_reference: string | null; created_at: Date }>>`
    SELECT id, event_type, amount_minor, currency, reason, finance_reference, created_at
    FROM campusos_library.fine_events WHERE id = ${waivedId}::uuid LIMIT 1
  `;
  return {
    id: created[0].id,
    eventType: created[0].event_type,
    amountMinor: dbNumber(created[0].amount_minor),
    currency: created[0].currency,
    reason: created[0].reason,
    financeReference: created[0].finance_reference,
    createdAt: created[0].created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Reservations
// ---------------------------------------------------------------------------

export async function reserveRecord(context: ActiveUserContext, recordId: string): Promise<ReservationView> {
  const member = await requireActiveMembership(context);
  if (!UUID_RE.test(recordId)) throw new LibraryError('Invalid catalog record identifier.', 400);
  const settings = await getLibrarySettings(context.tenantId);

  const record = await prisma.$queryRaw<Array<{ id: string; resource_type: string }>>`
    SELECT id, resource_type FROM campusos_library.catalog_records
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${recordId}::uuid AND status = 'ACTIVE' LIMIT 1
  `;
  if (!record[0]) throw new LibraryError('Catalog record not found.', 404);
  if (record[0].resource_type === 'EBOOK') throw new LibraryError('Digital titles cannot be reserved for physical pickup.', 422);

  const activeReservations = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT count(*) AS total FROM campusos_library.reservations
    WHERE tenant_id = ${context.tenantId}::uuid AND member_id = ${member.id}::uuid AND status = 'ACTIVE'
  `;
  if (dbNumber(activeReservations[0]?.total ?? 0) >= settings.reservationMaxActive) {
    throw new LibraryError('You have reached the active-reservation limit.', 409);
  }

  const reservationId = randomUUID();
  try {
    await prisma.$transaction(async (tx) => {
      const queue = await tx.$queryRaw<Array<{ next_position: bigint | number | null }>>`
        SELECT max(queue_position) AS next_position FROM campusos_library.reservations
        WHERE tenant_id = ${context.tenantId}::uuid AND record_id = ${recordId}::uuid AND status = 'ACTIVE'
      `;
      const position = dbNumber(queue[0]?.next_position ?? 0) + 1;
      await tx.$executeRaw`
        INSERT INTO campusos_library.reservations
          (id, tenant_id, record_id, member_id, queue_position, status, created_at)
        VALUES
          (${reservationId}::uuid, ${context.tenantId}::uuid, ${recordId}::uuid, ${member.id}::uuid,
           ${position}, 'ACTIVE', now())
      `;
    }, { timeout: 30_000 });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('reservations_tenant_member_record_uq') || message.includes('unique constraint')) {
      throw new LibraryError('You already have an active reservation for this title.', 409);
    }
    throw error;
  }
  await writeLibraryAudit(context, 'RESERVATION_CREATED', 'reservations', reservationId, null, { recordId, position: 0 }, 'Reservation created');
  return getReservationById(context, reservationId);
}

export async function cancelReservation(context: ActiveUserContext, reservationId: string): Promise<ReservationView> {
  const current = await getReservationById(context, reservationId);
  if (current.status !== 'ACTIVE') throw new LibraryError('This reservation is not active.', 409);
  if (!isLibraryOperator(context)) {
    const member = await requireActiveMembership(context);
    if (current.memberId !== member.id) throw new LibraryError('You may only cancel your own reservations.', 403);
  }
  await prisma.$executeRaw`
    UPDATE campusos_library.reservations
    SET status = 'CANCELLED'
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${reservationId}::uuid
  `;
  await writeLibraryAudit(context, 'RESERVATION_CANCELLED', 'reservations', reservationId, { status: 'ACTIVE' }, { status: 'CANCELLED' }, 'Reservation cancelled');
  return getReservationById(context, reservationId);
}

async function getReservationById(context: ActiveUserContext, reservationId: string): Promise<ReservationView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; record_id: string; member_id: string; queue_position: number; status: string;
    expires_at: Date | null; created_at: Date; title: string; member_name: string;
  }>>`
    SELECT r.id, r.record_id, r.member_id, r.queue_position, r.status, r.expires_at, r.created_at,
           c.title, u.name AS member_name
    FROM campusos_library.reservations r
    JOIN campusos_library.catalog_records c ON c.id = r.record_id
    JOIN campusos_library.library_memberships m ON m.id = r.member_id
    JOIN public.users u ON u.id = m.user_id
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.id = ${reservationId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('Reservation not found.', 404);
  return {
    id: rows[0].id,
    recordId: rows[0].record_id,
    title: rows[0].title,
    memberId: rows[0].member_id,
    memberName: rows[0].member_name,
    queuePosition: rows[0].queue_position,
    status: rows[0].status,
    expiresAt: rows[0].expires_at ? rows[0].expires_at.toISOString() : null,
    createdAt: rows[0].created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Acquisitions
// ---------------------------------------------------------------------------

export async function requestAcquisition(
  context: ActiveUserContext,
  input: {
    title: string;
    author?: string;
    isbn?: string;
    publisher?: string;
    edition?: string;
    estimatedPriceMinor?: MoneyMinor;
    currency?: string;
    reason?: string;
  },
): Promise<AcquisitionView> {
  assertLibraryPermission(canRequestAcquisitions(context), 'library:acquisitions:request');
  if (!input.title.trim()) throw new LibraryError('Title is required.', 400);
  const settings = await getLibrarySettings(context.tenantId);

  // Duplicate detection — warn, never block, additional copies.
  const warnings: string[] = [];
  if (input.isbn) {
    const dup = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT count(*) AS total FROM campusos_library.catalog_records
      WHERE tenant_id = ${context.tenantId}::uuid AND isbn = ${input.isbn} AND status = 'ACTIVE'
    `;
    if (dbNumber(dup[0]?.total ?? 0) > 0) warnings.push('A catalog record with this ISBN already exists.');
  }
  const titleDup = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT count(*) AS total FROM campusos_library.catalog_records
    WHERE tenant_id = ${context.tenantId}::uuid AND lower(title) = lower(${input.title.trim()}) AND status = 'ACTIVE'
  `;
  if (dbNumber(titleDup[0]?.total ?? 0) > 0) warnings.push('A similar title already exists in the catalog.');

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_library.acquisitions
      (id, tenant_id, requestor_user_id, requestor_role, title, author, isbn, publisher, edition,
       estimated_price_minor, currency, reason, status, duplicate_warnings, created_at, updated_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid, ${context.activeRole},
       ${input.title.trim()}, ${input.author ?? null}, ${input.isbn ?? null}, ${input.publisher ?? null},
       ${input.edition ?? null}, ${input.estimatedPriceMinor ?? null}, ${input.currency ?? settings.currency},
       ${input.reason ?? null}, 'REQUESTED', ${JSON.stringify(warnings)}::jsonb, now(), now())
  `;
  await writeLibraryAudit(context, 'ACQUISITION_REQUESTED', 'acquisitions', id, null, input, input.reason);
  return getAcquisitionById(context, id);
}

export async function reviewAcquisition(
  context: ActiveUserContext,
  acquisitionId: string,
  input: { decision: 'APPROVE' | 'REJECT'; note?: string },
): Promise<AcquisitionView> {
  assertLibraryPermission(canReviewAcquisitions(context), 'library:acquisitions:review');
  const current = await getAcquisitionById(context, acquisitionId);
  if (current.status !== 'REQUESTED' && current.status !== 'UNDER_REVIEW') {
    throw new LibraryError('This acquisition request cannot be reviewed in its current state.', 409);
  }
  await prisma.$executeRaw`
    UPDATE campusos_library.acquisitions
    SET status = ${input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'},
        reviewed_by = ${context.userId}::uuid, reviewed_at = now(), updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${acquisitionId}::uuid
  `;
  await writeLibraryAudit(context, input.decision === 'APPROVE' ? 'ACQUISITION_APPROVED' : 'ACQUISITION_REJECTED', 'acquisitions', acquisitionId, { status: current.status }, { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' }, input.note);
  return getAcquisitionById(context, acquisitionId);
}

async function getAcquisitionById(context: ActiveUserContext, acquisitionId: string): Promise<AcquisitionView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; title: string; author: string | null; isbn: string | null;
    estimated_price_minor: bigint | number | string | null; reason: string | null; status: string;
    duplicate_warnings: unknown; created_at: Date; requestor_name: string | null;
  }>>`
    SELECT a.id, a.title, a.author, a.isbn, a.estimated_price_minor, a.reason, a.status,
           a.duplicate_warnings, a.created_at, u.name AS requestor_name
    FROM campusos_library.acquisitions a
    LEFT JOIN public.users u ON u.id = a.requestor_user_id
    WHERE a.tenant_id = ${context.tenantId}::uuid AND a.id = ${acquisitionId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('Acquisition request not found.', 404);
  return {
    id: rows[0].id,
    title: rows[0].title,
    author: rows[0].author,
    isbn: rows[0].isbn,
    estimatedPriceMinor: rows[0].estimated_price_minor === null || rows[0].estimated_price_minor === undefined ? null : dbNumber(rows[0].estimated_price_minor),
    reason: rows[0].reason,
    status: rows[0].status,
    duplicateWarnings: parseJson<unknown[]>(rows[0].duplicate_warnings) ?? [],
    requestorName: rows[0].requestor_name,
    createdAt: rows[0].created_at.toISOString(),
  };
}

export async function listAcquisitions(context: ActiveUserContext, pendingOnly = false): Promise<AcquisitionView[]> {
  assertLibraryPermission(isLibraryOperator(context), 'library:acquisitions:read');
  const rows = await prisma.$queryRaw<Array<{
    id: string; title: string; author: string | null; isbn: string | null;
    estimated_price_minor: bigint | number | string | null; reason: string | null; status: string;
    duplicate_warnings: unknown; created_at: Date; requestor_name: string | null;
  }>>`
    SELECT a.id, a.title, a.author, a.isbn, a.estimated_price_minor, a.reason, a.status,
           a.duplicate_warnings, a.created_at, u.name AS requestor_name
    FROM campusos_library.acquisitions a
    LEFT JOIN public.users u ON u.id = a.requestor_user_id
    WHERE a.tenant_id = ${context.tenantId}::uuid
      AND (${pendingOnly} = false OR a.status IN ('REQUESTED', 'UNDER_REVIEW', 'BUDGET_REVIEW'))
    ORDER BY a.created_at DESC
    LIMIT 100
  `;
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    estimatedPriceMinor: row.estimated_price_minor === null || row.estimated_price_minor === undefined ? null : dbNumber(row.estimated_price_minor),
    reason: row.reason,
    status: row.status,
    duplicateWarnings: parseJson<unknown[]>(row.duplicate_warnings) ?? [],
    requestorName: row.requestor_name,
    createdAt: row.created_at.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Reading lists
// ---------------------------------------------------------------------------

export async function createReadingList(
  context: ActiveUserContext,
  input: { courseOfferingId?: string; title: string; listType?: string; items?: Array<{ recordId?: string; digitalId?: string; note?: string }> },
): Promise<ReadingListView> {
  assertLibraryPermission(canManageReadingLists(context), 'library:reading-lists:manage');
  if (!input.title.trim()) throw new LibraryError('Reading list title is required.', 400);
  const listId = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_library.reading_lists
        (id, tenant_id, course_offering_id, title, list_type, status, created_by, created_at, updated_at)
      VALUES
        (${listId}::uuid, ${context.tenantId}::uuid,
         ${input.courseOfferingId ? Prisma.sql`${input.courseOfferingId}::uuid` : Prisma.sql`NULL`},
         ${input.title.trim()}, ${input.listType ?? 'REQUIRED'}, 'ACTIVE', ${context.userId}::uuid, now(), now())
    `;
    for (const [index, item] of (input.items ?? []).entries()) {
      await tx.$executeRaw`
        INSERT INTO campusos_library.reading_list_items
          (id, tenant_id, list_id, record_id, digital_id, note, position)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${listId}::uuid,
           ${item.recordId ? Prisma.sql`${item.recordId}::uuid` : Prisma.sql`NULL`},
           ${item.digitalId ? Prisma.sql`${item.digitalId}::uuid` : Prisma.sql`NULL`},
           ${item.note ?? null}, ${index})
      `;
    }
  }, { timeout: 30_000 });
  await writeLibraryAudit(context, 'READING_LIST_CREATED', 'reading_lists', listId, null, input, 'Reading list created');
  return getReadingListById(context, listId);
}

async function getReadingListById(context: ActiveUserContext, listId: string): Promise<ReadingListView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string; course_offering_id: string | null; title: string; list_type: string;
    course_title: string | null; course_code: string | null;
  }>>`
    SELECT l.id, l.course_offering_id, l.title, l.list_type, co.title AS course_title, co.code AS course_code
    FROM campusos_library.reading_lists l
    LEFT JOIN public.course_offerings co ON co.id = l.course_offering_id
    WHERE l.tenant_id = ${context.tenantId}::uuid AND l.id = ${listId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new LibraryError('Reading list not found.', 404);
  const items = await prisma.$queryRaw<Array<{ id: string; record_id: string | null; digital_id: string | null; resource_title: string | null; note: string | null }>>`
    SELECT i.id, i.record_id, i.digital_id,
           COALESCE(c.title, d.title) AS resource_title, i.note
    FROM campusos_library.reading_list_items i
    LEFT JOIN campusos_library.catalog_records c ON c.id = i.record_id
    LEFT JOIN campusos_library.digital_resources d ON d.id = i.digital_id
    WHERE i.tenant_id = ${context.tenantId}::uuid AND i.list_id = ${listId}::uuid
    ORDER BY i.position
  `;
  return {
    id: rows[0].id,
    courseOfferingId: rows[0].course_offering_id,
    courseTitle: rows[0].course_title,
    courseCode: rows[0].course_code,
    title: rows[0].title,
    listType: rows[0].list_type,
    items: items.map((item) => ({
      id: item.id,
      recordId: item.record_id,
      digitalId: item.digital_id,
      resourceTitle: item.resource_title,
      note: item.note,
    })),
  };
}

export async function listMyReadingLists(context: ActiveUserContext): Promise<ReadingListView[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT DISTINCT l.id
    FROM campusos_library.reading_lists l
    WHERE l.tenant_id = ${context.tenantId}::uuid AND l.status = 'ACTIVE'
    ORDER BY l.created_at DESC
    LIMIT 50
  `;
  return Promise.all(rows.map((row) => getReadingListById(context, row.id)));
}

// ---------------------------------------------------------------------------
// Clearance
// ---------------------------------------------------------------------------

export async function getLibraryClearance(context: ActiveUserContext, memberId?: string): Promise<LibraryClearanceView> {
  let targetMemberId = memberId;
  if (!targetMemberId) {
    const member = await requireActiveMembership(context);
    targetMemberId = member.id;
  } else if (!isLibraryOperator(context)) {
    const member = await requireActiveMembership(context);
    if (member.id !== targetMemberId) throw new LibraryError('You may only view your own library clearance.', 403);
  }

  const [unreturned, lost, fineSum] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT count(*) AS total FROM campusos_library.loans
      WHERE tenant_id = ${context.tenantId}::uuid AND member_id = ${targetMemberId}::uuid AND returned_at IS NULL
    `,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`
      SELECT count(*) AS total
      FROM campusos_library.loans l
      JOIN campusos_library.physical_copies c ON c.id = l.copy_id
      WHERE l.tenant_id = ${context.tenantId}::uuid AND l.member_id = ${targetMemberId}::uuid
        AND l.returned_at IS NULL AND c.status IN ('LOST', 'DAMAGED')
    `,
    prisma.$queryRaw<Array<{ total: bigint | number | string | null }>>`
      -- Outstanding fines = assessed amount minus any linked resolution (waiver/
      -- adjustment/payment) per fine — never a member-level join.
      SELECT COALESCE(sum(
        f.amount_minor - COALESCE((SELECT sum(w.amount_minor) FROM campusos_library.fine_events w
           WHERE w.tenant_id = f.tenant_id AND w.related_fine_id = f.id), 0)
      ), 0) AS total
      FROM campusos_library.fine_events f
      WHERE f.tenant_id = ${context.tenantId}::uuid AND f.member_id = ${targetMemberId}::uuid
        AND f.event_type = 'ASSESSED'
      `,
  ]);

  const unpaidFine = dbNumber(fineSum[0]?.total ?? 0);
  const status = dbNumber(unreturned[0]?.total ?? 0) === 0 && unpaidFine === 0 ? 'CLEAR' : 'BLOCKED';
  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_library.library_clearance
      (id, tenant_id, member_id, clearance_status, unreturned_count, lost_count, unpaid_fine_minor,
       notes, checked_by, checked_at, created_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${targetMemberId}::uuid, ${status},
       ${dbNumber(unreturned[0]?.total ?? 0)}, ${dbNumber(lost[0]?.total ?? 0)}, ${unpaidFine},
       ${status === 'CLEAR' ? 'No outstanding library obligations' : 'Outstanding books or fines block clearance'},
       ${context.userId}::uuid, now(), now())
    ON CONFLICT (tenant_id, member_id)
    DO UPDATE SET clearance_status = EXCLUDED.clearance_status,
                  unreturned_count = EXCLUDED.unreturned_count,
                  lost_count = EXCLUDED.lost_count,
                  unpaid_fine_minor = EXCLUDED.unpaid_fine_minor,
                  notes = EXCLUDED.notes, checked_by = EXCLUDED.checked_by, checked_at = now()
  `;
  const rows = await prisma.$queryRaw<Array<{
    id: string; member_id: string; clearance_status: string; unreturned_count: bigint | number;
    lost_count: bigint | number; unpaid_fine_minor: bigint | number | string; notes: string | null;
    checked_at: Date | null; member_name: string;
  }>>`
    SELECT c.id, c.member_id, c.clearance_status, c.unreturned_count, c.lost_count,
           c.unpaid_fine_minor, c.notes, c.checked_at, u.name AS member_name
    FROM campusos_library.library_clearance c
    JOIN campusos_library.library_memberships m ON m.id = c.member_id
    JOIN public.users u ON u.id = m.user_id
    WHERE c.tenant_id = ${context.tenantId}::uuid AND c.member_id = ${targetMemberId}::uuid
    LIMIT 1
  `;
  return {
    id: rows[0].id,
    memberId: rows[0].member_id,
    memberName: rows[0].member_name,
    clearanceStatus: rows[0].clearance_status,
    unreturnedCount: dbNumber(rows[0].unreturned_count),
    lostCount: dbNumber(rows[0].lost_count),
    unpaidFineMinor: dbNumber(rows[0].unpaid_fine_minor),
    notes: rows[0].notes,
    checkedAt: rows[0].checked_at ? rows[0].checked_at.toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Workspace + admin overview
// ---------------------------------------------------------------------------

export async function getLibraryWorkspaceView(context: ActiveUserContext): Promise<LibraryWorkspaceView> {
  const settings = await getLibrarySettings(context.tenantId);
  const membership = await ensureLibraryMembership(context);
  const canManage = isLibraryOperator(context);
  const canBorrow = isLibraryBorrower(context);

  const catalogResult = await listCatalog(context, { pageSize: 20 });
  const featuredCatalog = catalogResult.items.slice(0, 8);
  const newArrivals = [...catalogResult.items].sort((a, b) => b.id.localeCompare(a.id)).slice(0, 6);

  let myLoans: LoanView[] = [];
  let myReservations: ReservationView[] = [];
  let myFines: FineEventView[] = [];
  if (membership) {
    const loanRows = await prisma.$queryRaw<LoanRow[]>`
      SELECT l.id, l.copy_id, l.member_id, l.issue_date, l.due_date, l.returned_at, l.renewal_count, l.status,
             u.name AS member_name, c.accession_number, r.title
      FROM campusos_library.loans l
      JOIN campusos_library.physical_copies c ON c.id = l.copy_id
      JOIN campusos_library.catalog_records r ON r.id = c.record_id
      JOIN campusos_library.library_memberships m ON m.id = l.member_id
      JOIN public.users u ON u.id = m.user_id
      WHERE l.tenant_id = ${context.tenantId}::uuid AND l.member_id = ${membership.id}::uuid
      ORDER BY l.created_at DESC LIMIT 30
    `;
    myLoans = loanRows.map((row) => mapLoanRow(row, settings.timezone, settings));
    const reservationRows = await prisma.$queryRaw<Array<{
      id: string; record_id: string; member_id: string; queue_position: number; status: string;
      expires_at: Date | null; created_at: Date; title: string; member_name: string;
    }>>`
      SELECT r.id, r.record_id, r.member_id, r.queue_position, r.status, r.expires_at, r.created_at,
             c.title, u.name AS member_name
      FROM campusos_library.reservations r
      JOIN campusos_library.catalog_records c ON c.id = r.record_id
      JOIN campusos_library.library_memberships m ON m.id = r.member_id
      JOIN public.users u ON u.id = m.user_id
      WHERE r.tenant_id = ${context.tenantId}::uuid AND r.member_id = ${membership.id}::uuid
      ORDER BY r.created_at DESC LIMIT 20
    `;
    myReservations = reservationRows.map((row) => ({
      id: row.id,
      recordId: row.record_id,
      title: row.title,
      memberId: row.member_id,
      memberName: row.member_name,
      queuePosition: row.queue_position,
      status: row.status,
      expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
    }));
    myFines = await listMemberFines(context, membership.id);
  }

  const myReadingLists = await listMyReadingLists(context);

  const [totalCatalog, totalCopies, activeLoans, activeReservations] = await Promise.all([
    prisma.$queryRaw<Array<{ total: bigint | number }>>`SELECT count(*) AS total FROM campusos_library.catalog_records WHERE tenant_id = ${context.tenantId}::uuid`,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`SELECT count(*) AS total FROM campusos_library.physical_copies WHERE tenant_id = ${context.tenantId}::uuid`,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`SELECT count(*) AS total FROM campusos_library.loans WHERE tenant_id = ${context.tenantId}::uuid AND returned_at IS NULL`,
    prisma.$queryRaw<Array<{ total: bigint | number }>>`SELECT count(*) AS total FROM campusos_library.reservations WHERE tenant_id = ${context.tenantId}::uuid AND status = 'ACTIVE'`,
  ]);

  return {
    settings,
    role: context.activeRole,
    canManage,
    canBorrow,
    currentUserId: context.userId,
    currentMembership: membership,
    myLoans,
    myReservations,
    myFines,
    myReadingLists,
    featuredCatalog,
    newArrivals,
    metrics: [
      { id: 'catalog', label: 'Catalog records', value: dbNumber(totalCatalog[0]?.total ?? 0), hint: 'Institution catalog', tone: 'neutral' },
      { id: 'copies', label: 'Physical copies', value: dbNumber(totalCopies[0]?.total ?? 0), hint: 'Across all locations', tone: 'neutral' },
      { id: 'loans', label: 'Active loans', value: dbNumber(activeLoans[0]?.total ?? 0), hint: 'Currently issued', tone: 'neutral' },
      { id: 'reservations', label: 'Active reservations', value: dbNumber(activeReservations[0]?.total ?? 0), hint: 'Waiting queues', tone: 'neutral' },
      { id: 'overdue', label: 'My overdue loans', value: myLoans.filter((loan) => !loan.returnedAt && loan.overdueDays > 0).length, hint: 'Return these soon', tone: myLoans.some((loan) => !loan.returnedAt && loan.overdueDays > 0) ? 'danger' : 'positive' },
    ],
  };
}

export async function getLibraryAdminOverview(context: ActiveUserContext): Promise<LibraryAdminOverview> {
  assertLibraryPermission(isLibraryOperator(context), 'library:admin:read');
  const settings = await getLibrarySettings(context.tenantId);
  const [memberships, catalogResult, loanRows, reservationRows, acquisitionRows] = await Promise.all([
    listMemberships(context),
    listCatalog(context, { pageSize: 100 }),
    prisma.$queryRaw<LoanRow[]>`
      SELECT l.id, l.copy_id, l.member_id, l.issue_date, l.due_date, l.returned_at, l.renewal_count, l.status,
             u.name AS member_name, c.accession_number, r.title
      FROM campusos_library.loans l
      JOIN campusos_library.physical_copies c ON c.id = l.copy_id
      JOIN campusos_library.catalog_records r ON r.id = c.record_id
      JOIN campusos_library.library_memberships m ON m.id = l.member_id
      JOIN public.users u ON u.id = m.user_id
      WHERE l.tenant_id = ${context.tenantId}::uuid
      ORDER BY l.created_at DESC LIMIT 200
    `,
    prisma.$queryRaw<Array<{
      id: string; record_id: string; member_id: string; queue_position: number; status: string;
      expires_at: Date | null; created_at: Date; title: string; member_name: string;
    }>>`
      SELECT r.id, r.record_id, r.member_id, r.queue_position, r.status, r.expires_at, r.created_at,
             c.title, u.name AS member_name
      FROM campusos_library.reservations r
      JOIN campusos_library.catalog_records c ON c.id = r.record_id
      JOIN campusos_library.library_memberships m ON m.id = r.member_id
      JOIN public.users u ON u.id = m.user_id
      WHERE r.tenant_id = ${context.tenantId}::uuid AND r.status = 'ACTIVE'
      ORDER BY r.created_at DESC LIMIT 100
    `,
    listAcquisitions(context, true),
  ]);

  const loans = loanRows.map((row) => mapLoanRow(row, settings.timezone, settings));
  const overdueLoans = loans.filter((loan) => !loan.returnedAt && loan.overdueDays > 0);
  const reservations = reservationRows.map((row) => ({
    id: row.id,
    recordId: row.record_id,
    title: row.title,
    memberId: row.member_id,
    memberName: row.member_name,
    queuePosition: row.queue_position,
    status: row.status,
    expiresAt: row.expires_at ? row.expires_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  }));

  const clearances = await Promise.all(
    memberships.slice(0, 50).map(async (member) => {
      try {
        return await getLibraryClearance(context, member.id);
      } catch {
        return null;
      }
    }),
  ).then((rows) => rows.filter((row): row is LibraryClearanceView => row !== null));

  const totalFine = await prisma.$queryRaw<Array<{ total: bigint | number | string | null }>>`
    SELECT COALESCE(sum(amount_minor), 0) AS total FROM campusos_library.fine_events
    WHERE tenant_id = ${context.tenantId}::uuid AND event_type = 'ASSESSED'
  `;

  return {
    settings,
    canCirculate: canCirculate(context),
    canAuthorizeFines: canAuthorizeLibraryFine(context),
    canReviewAcquisitions: canReviewAcquisitions(context),
    memberships,
    catalog: catalogResult.items,
    loans,
    overdueLoans,
    reservations,
    pendingAcquisitions: acquisitionRows,
    clearances,
    metrics: [
      { id: 'catalog', label: 'Catalog records', value: catalogResult.total, hint: 'Total titles', tone: 'neutral' },
      { id: 'copies', label: 'Physical copies', value: catalogResult.items.reduce((sum, item) => sum + item.totalCopies, 0), hint: 'All locations', tone: 'neutral' },
      { id: 'loans', label: 'Active loans', value: loans.filter((loan) => !loan.returnedAt).length, hint: 'Currently issued', tone: 'neutral' },
      { id: 'overdue', label: 'Overdue loans', value: overdueLoans.length, hint: 'Need follow-up', tone: overdueLoans.length > 0 ? 'danger' : 'positive' },
      { id: 'reservations', label: 'Active reservations', value: reservations.length, hint: 'Waiting queues', tone: 'neutral' },
      { id: 'members', label: 'Active members', value: memberships.filter((member) => member.status === 'ACTIVE').length, hint: 'Library members', tone: 'neutral' },
      { id: 'acquisitions', label: 'Pending acquisitions', value: acquisitionRows.length, hint: 'Awaiting review', tone: acquisitionRows.length > 0 ? 'warning' : 'positive' },
      { id: 'fines', label: 'Outstanding fines', value: dbNumber(totalFine[0]?.total ?? 0), hint: 'Minor units', tone: 'warning' },
    ],
  };
}
