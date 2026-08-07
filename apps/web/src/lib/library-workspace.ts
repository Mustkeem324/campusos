import { randomUUID } from 'node:crypto';
import type { Prisma, RoleType } from '@prisma/client';

import type { ActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';

export const LIBRARY_CATALOG_ACTION = 'LIBRARY_CATALOG_V2';
export const LIBRARY_POLICY_ACTION = 'LIBRARY_POLICY_V2';
export const LIBRARY_LOAN_ACTION = 'LIBRARY_LOAN_V2';
export const LIBRARY_RESERVATION_ACTION = 'LIBRARY_RESERVATION_V2';

export const LIBRARY_MANAGER_ROLES = new Set<RoleType>(['LIBRARIAN', 'INSTITUTION_ADMIN', 'SUPER_ADMIN']);
export const LIBRARY_BORROWER_ROLES = new Set<RoleType>(['STUDENT', 'FACULTY']);

export type LibraryResourceType = 'PHYSICAL' | 'EBOOK' | 'HYBRID';
export type LibraryLoanMode = 'PHYSICAL' | 'DIGITAL';
export type LibraryReservationStatus = 'ACTIVE' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';

export type LibraryCopyMeta = {
  barcode: string;
  rfidTag?: string;
  accessionNumber: string;
  shelfLocation?: string;
};

export type LibraryDigitalMeta = {
  fileId?: string;
  externalUrl?: string;
  mimeType?: string;
  seats: number;
  loanDays: number;
  allowDownload: boolean;
};

export type LibraryCatalogMeta = {
  version: 2;
  author: string;
  category: string;
  publisher?: string;
  edition?: string;
  language: string;
  description?: string;
  coverUrl?: string;
  resourceType: LibraryResourceType;
  physicalCopies: LibraryCopyMeta[];
  digital?: LibraryDigitalMeta;
  acquisition?: { vendor?: string; purchasedAt?: string; unitCost?: number; currency?: string };
  tags: string[];
};

export type LibraryPolicy = {
  version: 2;
  studentLoanDays: number;
  facultyLoanDays: number;
  renewalDays: number;
  maxRenewals: number;
  maxActiveLoans: number;
  reservationHoldHours: number;
  finePerDay: number;
  currency: string;
  defaultDigitalLoanDays: number;
};

export type LibraryLoanMeta = {
  version: 2;
  loanId: string;
  itemId: string;
  borrowerUserId: string;
  borrowerName: string;
  borrowerEmail: string;
  borrowerRole: RoleType;
  mode: LibraryLoanMode;
  copyBarcode?: string;
  borrowedAt: string;
  dueAt: string;
  returnedAt?: string;
  renewedCount: number;
  finalFineAmount?: number;
};

export type LibraryReservationMeta = {
  version: 2;
  reservationId: string;
  itemId: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: string;
  expiresAt?: string;
  status: LibraryReservationStatus;
};

export type LibraryWorkspaceItem = {
  id: string;
  title: string;
  isbn: string | null;
  author: string;
  category: string;
  publisher?: string;
  edition?: string;
  language: string;
  description?: string;
  resourceType: LibraryResourceType;
  physical: { total: number; available: number; onLoan: number; reserved: number; shelfLocations: string[] };
  digital: { enabled: boolean; seats: number; availableSeats: number; activeLoans: number; loanDays: number; canReadOnline: boolean };
  tags: string[];
};

type LibraryItemRow = { id: string; title: string; isbn: string | null };
type AuditRow = { entity: string; diffJson: string | null };

type LibraryState = {
  items: LibraryWorkspaceItem[];
  loans: LibraryLoanMeta[];
  reservations: LibraryReservationMeta[];
  policy: LibraryPolicy;
  catalogMap: Map<string, LibraryCatalogMeta>;
};

const DEFAULT_POLICY: LibraryPolicy = {
  version: 2,
  studentLoanDays: 14,
  facultyLoanDays: 30,
  renewalDays: 7,
  maxRenewals: 2,
  maxActiveLoans: 5,
  reservationHoldHours: 48,
  finePerDay: 0,
  currency: 'INR',
  defaultDigitalLoanDays: 7,
};

function safeJson<T>(value: string | null | undefined): T | null {
  if (!value) return null;
  try { return JSON.parse(value) as T; } catch { return null; }
}

export function catalogEntity(itemId: string) { return `library-item:${itemId}`; }
function loanEntity(loanId: string) { return `library-loan:${loanId}`; }
function reservationEntity(reservationId: string) { return `library-reservation:${reservationId}`; }
function policyEntity(tenantId: string) { return `library-policy:${tenantId}`; }

export function isLibraryManager(role: RoleType) { return LIBRARY_MANAGER_ROLES.has(role); }
export function isLibraryBorrower(role: RoleType) { return LIBRARY_BORROWER_ROLES.has(role); }

function legacyCatalogMeta(title: string): LibraryCatalogMeta {
  return {
    version: 2,
    author: 'Author metadata pending',
    category: 'General',
    language: 'English',
    description: `${title} is a legacy catalogue record. A librarian can enrich it with copy, shelf, author and licensed digital-access metadata.`,
    resourceType: 'PHYSICAL',
    physicalCopies: [],
    tags: [],
  };
}

function foldAuditRows<T>(rows: AuditRow[]) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const parsed = safeJson<T>(row.diffJson);
    if (parsed) latest.set(row.entity, parsed);
  }
  return latest;
}

function activePolicy(value: string | null | undefined) {
  const parsed = safeJson<LibraryPolicy>(value);
  return parsed?.version === 2 ? parsed : DEFAULT_POLICY;
}

function loanIsCurrent(loan: LibraryLoanMeta) {
  if (loan.returnedAt) return false;
  return loan.mode === 'PHYSICAL' || new Date(loan.dueAt).getTime() > Date.now();
}

function buildLibraryState(
  items: LibraryItemRow[],
  catalogRows: AuditRow[],
  loanRows: AuditRow[],
  reservationRows: AuditRow[],
  policyJson?: string | null,
): LibraryState {
  const catalogMap = foldAuditRows<LibraryCatalogMeta>(catalogRows);
  const loans = [...foldAuditRows<LibraryLoanMeta>(loanRows).values()];
  const reservations = [...foldAuditRows<LibraryReservationMeta>(reservationRows).values()].map((reservation) => (
    reservation.status === 'ACTIVE' && reservation.expiresAt && new Date(reservation.expiresAt).getTime() < Date.now()
      ? { ...reservation, status: 'EXPIRED' as const }
      : reservation
  ));
  const policy = activePolicy(policyJson);

  const workspaceItems: LibraryWorkspaceItem[] = items.map((item) => {
    const meta = catalogMap.get(catalogEntity(item.id)) ?? legacyCatalogMeta(item.title);
    const activePhysical = loans.filter((loan) => loan.itemId === item.id && loan.mode === 'PHYSICAL' && !loan.returnedAt);
    const activeDigital = loans.filter((loan) => loan.itemId === item.id && loan.mode === 'DIGITAL' && loanIsCurrent(loan));
    const activeReservations = reservations.filter((reservation) => reservation.itemId === item.id && reservation.status === 'ACTIVE');
    const copies = meta.physicalCopies ?? [];
    const seats = Math.max(0, meta.digital?.seats ?? 0);
    return {
      id: item.id,
      title: item.title,
      isbn: item.isbn,
      author: meta.author,
      category: meta.category,
      publisher: meta.publisher,
      edition: meta.edition,
      language: meta.language,
      description: meta.description,
      resourceType: meta.resourceType,
      physical: {
        total: copies.length,
        available: Math.max(0, copies.length - activePhysical.length),
        onLoan: activePhysical.length,
        reserved: activeReservations.length,
        shelfLocations: [...new Set(copies.map((copy) => copy.shelfLocation).filter((value): value is string => Boolean(value)))],
      },
      digital: {
        enabled: Boolean(meta.digital?.fileId || meta.digital?.externalUrl),
        seats,
        availableSeats: Math.max(0, seats - activeDigital.length),
        activeLoans: activeDigital.length,
        loanDays: meta.digital?.loanDays ?? policy.defaultDigitalLoanDays,
        canReadOnline: Boolean(meta.digital?.fileId || meta.digital?.externalUrl),
      },
      tags: meta.tags ?? [],
    };
  });

  return { items: workspaceItems, loans, reservations, policy, catalogMap };
}

async function lockLibraryKeys(tx: Prisma.TransactionClient, keys: string[]) {
  const ordered = [...new Set(keys)].sort();
  for (const key of ordered) {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${key}))`;
  }
}

async function getLibraryStateFromTransaction(tx: Prisma.TransactionClient, tenantId: string): Promise<LibraryState> {
  const [items, catalogRows, loanRows, reservationRows, policyRow] = await Promise.all([
    tx.libraryItem.findMany({ where: { tenantId }, orderBy: { title: 'asc' }, select: { id: true, title: true, isbn: true } }),
    tx.auditLog.findMany({ where: { tenantId, action: LIBRARY_CATALOG_ACTION, entity: { startsWith: 'library-item:' } }, orderBy: { createdAt: 'asc' }, select: { entity: true, diffJson: true } }),
    tx.auditLog.findMany({ where: { tenantId, action: LIBRARY_LOAN_ACTION, entity: { startsWith: 'library-loan:' } }, orderBy: { createdAt: 'asc' }, select: { entity: true, diffJson: true } }),
    tx.auditLog.findMany({ where: { tenantId, action: LIBRARY_RESERVATION_ACTION, entity: { startsWith: 'library-reservation:' } }, orderBy: { createdAt: 'asc' }, select: { entity: true, diffJson: true } }),
    tx.auditLog.findFirst({ where: { tenantId, action: LIBRARY_POLICY_ACTION, entity: policyEntity(tenantId) }, orderBy: { createdAt: 'desc' }, select: { diffJson: true } }),
  ]);
  return buildLibraryState(items, catalogRows, loanRows, reservationRows, policyRow?.diffJson);
}

export async function getLibraryPolicy(tenantId: string): Promise<LibraryPolicy> {
  const row = await prisma.auditLog.findFirst({
    where: { tenantId, action: LIBRARY_POLICY_ACTION, entity: policyEntity(tenantId) },
    orderBy: { createdAt: 'desc' },
    select: { diffJson: true },
  });
  return activePolicy(row?.diffJson);
}

export async function setLibraryPolicy(context: ActiveUserContext, policy: LibraryPolicy) {
  if (!isLibraryManager(context.activeRole)) throw new Error('LIBRARY_FORBIDDEN');
  await prisma.auditLog.create({
    data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_POLICY_ACTION, entity: policyEntity(context.tenantId), diffJson: JSON.stringify(policy) },
  });
}

export async function getLibraryState(tenantId: string): Promise<LibraryState> {
  const [items, catalogRows, loanRows, reservationRows, policyRow] = await Promise.all([
    prisma.libraryItem.findMany({ where: { tenantId }, orderBy: { title: 'asc' }, select: { id: true, title: true, isbn: true } }),
    prisma.auditLog.findMany({ where: { tenantId, action: LIBRARY_CATALOG_ACTION, entity: { startsWith: 'library-item:' } }, orderBy: { createdAt: 'asc' }, select: { entity: true, diffJson: true } }),
    prisma.auditLog.findMany({ where: { tenantId, action: LIBRARY_LOAN_ACTION, entity: { startsWith: 'library-loan:' } }, orderBy: { createdAt: 'asc' }, select: { entity: true, diffJson: true } }),
    prisma.auditLog.findMany({ where: { tenantId, action: LIBRARY_RESERVATION_ACTION, entity: { startsWith: 'library-reservation:' } }, orderBy: { createdAt: 'asc' }, select: { entity: true, diffJson: true } }),
    prisma.auditLog.findFirst({ where: { tenantId, action: LIBRARY_POLICY_ACTION, entity: policyEntity(tenantId) }, orderBy: { createdAt: 'desc' }, select: { diffJson: true } }),
  ]);
  return buildLibraryState(items, catalogRows, loanRows, reservationRows, policyRow?.diffJson);
}

export async function getLibraryWorkspace(context: ActiveUserContext) {
  const state = await getLibraryState(context.tenantId);
  const manager = isLibraryManager(context.activeRole);
  const activeLoans = state.loans.filter(loanIsCurrent);
  const overdueLoans = activeLoans.filter((loan) => loan.mode === 'PHYSICAL' && new Date(loan.dueAt).getTime() < Date.now());
  const activeReservations = state.reservations.filter((reservation) => reservation.status === 'ACTIVE');
  return {
    role: context.activeRole,
    canManage: manager,
    canBorrow: isLibraryBorrower(context.activeRole),
    currentUserId: context.userId,
    items: state.items,
    loans: manager ? state.loans : state.loans.filter((loan) => loan.borrowerUserId === context.userId),
    reservations: manager ? state.reservations : state.reservations.filter((reservation) => reservation.userId === context.userId),
    policy: state.policy,
    metrics: {
      titles: state.items.length,
      physicalCopies: state.items.reduce((sum, item) => sum + item.physical.total, 0),
      availablePhysical: state.items.reduce((sum, item) => sum + item.physical.available, 0),
      digitalTitles: state.items.filter((item) => item.digital.enabled).length,
      activeLoans: activeLoans.length,
      activeBorrowers: new Set(activeLoans.map((loan) => loan.borrowerUserId)).size,
      overdueLoans: overdueLoans.length,
      activeReservations: activeReservations.length,
      digitalLoans: activeLoans.filter((loan) => loan.mode === 'DIGITAL').length,
    },
  };
}

function dueDateFor(role: RoleType, mode: LibraryLoanMode, policy: LibraryPolicy, digitalLoanDays?: number) {
  const days = mode === 'DIGITAL' ? digitalLoanDays ?? policy.defaultDigitalLoanDays : role === 'FACULTY' ? policy.facultyLoanDays : policy.studentLoanDays;
  const due = new Date();
  due.setDate(due.getDate() + Math.max(1, days));
  return due;
}

export function calculateLibraryFineAmount(dueAt: string, returnedAt: Date, policy: Pick<LibraryPolicy, 'finePerDay'>) {
  if (policy.finePerDay <= 0) return 0;
  const due = new Date(dueAt);
  if (returnedAt <= due) return 0;
  return Number((Math.ceil((returnedAt.getTime() - due.getTime()) / 86_400_000) * policy.finePerDay).toFixed(2));
}

async function promoteNextWaitingReservation(tx: Prisma.TransactionClient, context: ActiveUserContext, state: LibraryState, itemId: string, excludedReservationId?: string) {
  const next = state.reservations
    .filter((reservation) => reservation.itemId === itemId && reservation.status === 'ACTIVE' && !reservation.expiresAt && reservation.reservationId !== excludedReservationId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  if (!next) return;
  const promoted = { ...next, expiresAt: new Date(Date.now() + state.policy.reservationHoldHours * 3_600_000).toISOString() };
  await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_RESERVATION_ACTION, entity: reservationEntity(next.reservationId), diffJson: JSON.stringify(promoted) } });
}

export async function reserveLibraryItem(context: ActiveUserContext, itemId: string) {
  if (!isLibraryBorrower(context.activeRole)) throw new Error('LIBRARY_BORROWING_FORBIDDEN');
  return prisma.$transaction(async (tx) => {
    await lockLibraryKeys(tx, [`library:item:${context.tenantId}:${itemId}`, `library:user:${context.tenantId}:${context.userId}`]);
    const state = await getLibraryStateFromTransaction(tx, context.tenantId);
    const item = state.items.find((entry) => entry.id === itemId);
    if (!item || item.resourceType === 'EBOOK') throw new Error('LIBRARY_ITEM_NOT_RESERVABLE');
    if (state.reservations.some((reservation) => reservation.itemId === itemId && reservation.userId === context.userId && reservation.status === 'ACTIVE')) throw new Error('LIBRARY_ALREADY_RESERVED');
    const user = await tx.user.findFirst({ where: { id: context.userId, tenantId: context.tenantId }, select: { name: true, email: true } });
    if (!user) throw new Error('LIBRARY_USER_NOT_FOUND');
    const readyHolds = state.reservations.filter((reservation) => reservation.itemId === itemId && reservation.status === 'ACTIVE' && Boolean(reservation.expiresAt)).length;
    const canHoldNow = item.physical.available > readyHolds;
    const reservation: LibraryReservationMeta = {
      version: 2,
      reservationId: randomUUID(),
      itemId,
      userId: context.userId,
      userName: user.name,
      userEmail: user.email,
      createdAt: new Date().toISOString(),
      expiresAt: canHoldNow ? new Date(Date.now() + state.policy.reservationHoldHours * 3_600_000).toISOString() : undefined,
      status: 'ACTIVE',
    };
    await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_RESERVATION_ACTION, entity: reservationEntity(reservation.reservationId), diffJson: JSON.stringify(reservation) } });
    return reservation;
  });
}

export async function cancelLibraryReservation(context: ActiveUserContext, reservationId: string) {
  return prisma.$transaction(async (tx) => {
    const initial = await getLibraryStateFromTransaction(tx, context.tenantId);
    const initialReservation = initial.reservations.find((entry) => entry.reservationId === reservationId);
    if (!initialReservation) throw new Error('LIBRARY_RESERVATION_NOT_FOUND');
    await lockLibraryKeys(tx, [`library:item:${context.tenantId}:${initialReservation.itemId}`, `library:reservation:${context.tenantId}:${reservationId}`]);
    const state = await getLibraryStateFromTransaction(tx, context.tenantId);
    const reservation = state.reservations.find((entry) => entry.reservationId === reservationId);
    if (!reservation) throw new Error('LIBRARY_RESERVATION_NOT_FOUND');
    if (!isLibraryManager(context.activeRole) && reservation.userId !== context.userId) throw new Error('LIBRARY_FORBIDDEN');
    const updated = { ...reservation, status: 'CANCELLED' as const };
    await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_RESERVATION_ACTION, entity: reservationEntity(reservationId), diffJson: JSON.stringify(updated) } });
    if (reservation.expiresAt) await promoteNextWaitingReservation(tx, context, state, reservation.itemId, reservationId);
    return updated;
  });
}

export async function borrowDigitalItem(context: ActiveUserContext, itemId: string) {
  if (!isLibraryBorrower(context.activeRole)) throw new Error('LIBRARY_BORROWING_FORBIDDEN');
  return prisma.$transaction(async (tx) => {
    await lockLibraryKeys(tx, [`library:item:${context.tenantId}:${itemId}`, `library:user:${context.tenantId}:${context.userId}`]);
    const state = await getLibraryStateFromTransaction(tx, context.tenantId);
    const item = state.items.find((entry) => entry.id === itemId);
    const catalog = state.catalogMap.get(catalogEntity(itemId));
    if (!item || !item.digital.enabled || !catalog?.digital) throw new Error('LIBRARY_DIGITAL_UNAVAILABLE');
    if (state.loans.some((loan) => loan.borrowerUserId === context.userId && loan.itemId === itemId && loan.mode === 'DIGITAL' && loanIsCurrent(loan))) throw new Error('LIBRARY_ALREADY_BORROWED');
    if (state.loans.filter((loan) => loan.borrowerUserId === context.userId && loanIsCurrent(loan)).length >= state.policy.maxActiveLoans) throw new Error('LIBRARY_LOAN_LIMIT');
    if (item.digital.availableSeats <= 0) throw new Error('LIBRARY_NO_DIGITAL_SEATS');
    const user = await tx.user.findFirst({ where: { id: context.userId, tenantId: context.tenantId }, select: { name: true, email: true, role: true } });
    if (!user) throw new Error('LIBRARY_USER_NOT_FOUND');
    const loanRecord = await tx.loan.create({ data: { libraryItemId: itemId }, select: { id: true, borrowedAt: true } });
    const loan: LibraryLoanMeta = {
      version: 2,
      loanId: loanRecord.id,
      itemId,
      borrowerUserId: context.userId,
      borrowerName: user.name,
      borrowerEmail: user.email,
      borrowerRole: user.role,
      mode: 'DIGITAL',
      borrowedAt: loanRecord.borrowedAt.toISOString(),
      dueAt: dueDateFor(user.role, 'DIGITAL', state.policy, catalog.digital.loanDays).toISOString(),
      renewedCount: 0,
    };
    await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_LOAN_ACTION, entity: loanEntity(loan.loanId), diffJson: JSON.stringify(loan) } });
    return loan;
  });
}

export async function checkoutPhysicalItem(context: ActiveUserContext, borrowerEmail: string, barcode: string) {
  if (!isLibraryManager(context.activeRole)) throw new Error('LIBRARY_FORBIDDEN');
  const normalizedEmail = borrowerEmail.trim().toLowerCase();
  const normalizedBarcode = barcode.trim();

  return prisma.$transaction(async (tx) => {
    const initial = await getLibraryStateFromTransaction(tx, context.tenantId);
    const itemEntry = [...initial.catalogMap.entries()].find(([, meta]) => meta.physicalCopies.some((copy) => copy.barcode === normalizedBarcode || copy.rfidTag === normalizedBarcode));
    if (!itemEntry) throw new Error('LIBRARY_COPY_NOT_FOUND');
    const itemId = itemEntry[0].replace('library-item:', '');
    const initialBorrower = await tx.user.findFirst({ where: { tenantId: context.tenantId, email: normalizedEmail, isActive: true }, select: { id: true } });
    if (!initialBorrower) throw new Error('LIBRARY_BORROWER_NOT_FOUND');

    await lockLibraryKeys(tx, [
      `library:copy:${context.tenantId}:${normalizedBarcode}`,
      `library:item:${context.tenantId}:${itemId}`,
      `library:user:${context.tenantId}:${initialBorrower.id}`,
    ]);
    const state = await getLibraryStateFromTransaction(tx, context.tenantId);
    if (state.loans.some((loan) => loan.copyBarcode === normalizedBarcode && !loan.returnedAt)) throw new Error('LIBRARY_COPY_ALREADY_LOANED');
    const borrower = await tx.user.findFirst({ where: { id: initialBorrower.id, tenantId: context.tenantId, email: normalizedEmail, isActive: true }, select: { id: true, name: true, email: true, role: true } });
    if (!borrower || !isLibraryBorrower(borrower.role)) throw new Error('LIBRARY_BORROWER_NOT_FOUND');
    if (state.loans.filter((loan) => loan.borrowerUserId === borrower.id && loanIsCurrent(loan)).length >= state.policy.maxActiveLoans) throw new Error('LIBRARY_LOAN_LIMIT');

    const waiting = state.reservations
      .filter((reservation) => reservation.itemId === itemId && reservation.status === 'ACTIVE')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    if (waiting.length > 0 && waiting[0].userId !== borrower.id) throw new Error('LIBRARY_RESERVED_FOR_ANOTHER_MEMBER');

    const loanRecord = await tx.loan.create({ data: { libraryItemId: itemId }, select: { id: true, borrowedAt: true } });
    const loan: LibraryLoanMeta = {
      version: 2,
      loanId: loanRecord.id,
      itemId,
      borrowerUserId: borrower.id,
      borrowerName: borrower.name,
      borrowerEmail: borrower.email,
      borrowerRole: borrower.role,
      mode: 'PHYSICAL',
      copyBarcode: normalizedBarcode,
      borrowedAt: loanRecord.borrowedAt.toISOString(),
      dueAt: dueDateFor(borrower.role, 'PHYSICAL', state.policy).toISOString(),
      renewedCount: 0,
    };
    await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_LOAN_ACTION, entity: loanEntity(loan.loanId), diffJson: JSON.stringify(loan) } });
    const reservation = waiting.find((entry) => entry.userId === borrower.id);
    if (reservation) {
      const fulfilled = { ...reservation, status: 'FULFILLED' as const };
      await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_RESERVATION_ACTION, entity: reservationEntity(reservation.reservationId), diffJson: JSON.stringify(fulfilled) } });
      const item = state.items.find((entry) => entry.id === itemId);
      if (item && item.physical.available > 1) await promoteNextWaitingReservation(tx, context, state, itemId, reservation.reservationId);
    }
    return loan;
  });
}

export async function returnLibraryLoan(context: ActiveUserContext, loanId: string) {
  if (!isLibraryManager(context.activeRole)) throw new Error('LIBRARY_FORBIDDEN');
  return prisma.$transaction(async (tx) => {
    const initial = await getLibraryStateFromTransaction(tx, context.tenantId);
    const initialLoan = initial.loans.find((entry) => entry.loanId === loanId);
    if (!initialLoan) throw new Error('LIBRARY_LOAN_NOT_ACTIVE');
    await lockLibraryKeys(tx, [`library:item:${context.tenantId}:${initialLoan.itemId}`, `library:loan:${context.tenantId}:${loanId}`, `library:user:${context.tenantId}:${initialLoan.borrowerUserId}`]);
    const state = await getLibraryStateFromTransaction(tx, context.tenantId);
    const loan = state.loans.find((entry) => entry.loanId === loanId);
    if (!loan || loan.returnedAt) throw new Error('LIBRARY_LOAN_NOT_ACTIVE');
    const returnedAt = new Date();
    const updated = { ...loan, returnedAt: returnedAt.toISOString(), finalFineAmount: calculateLibraryFineAmount(loan.dueAt, returnedAt, state.policy) };
    await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_LOAN_ACTION, entity: loanEntity(loanId), diffJson: JSON.stringify(updated) } });
    if (loan.mode === 'PHYSICAL') await promoteNextWaitingReservation(tx, context, state, loan.itemId);
    return updated;
  });
}

export async function renewLibraryLoan(context: ActiveUserContext, loanId: string) {
  return prisma.$transaction(async (tx) => {
    const initial = await getLibraryStateFromTransaction(tx, context.tenantId);
    const initialLoan = initial.loans.find((entry) => entry.loanId === loanId);
    if (!initialLoan) throw new Error('LIBRARY_LOAN_NOT_RENEWABLE');
    await lockLibraryKeys(tx, [`library:item:${context.tenantId}:${initialLoan.itemId}`, `library:loan:${context.tenantId}:${loanId}`, `library:user:${context.tenantId}:${initialLoan.borrowerUserId}`]);
    const state = await getLibraryStateFromTransaction(tx, context.tenantId);
    const loan = state.loans.find((entry) => entry.loanId === loanId);
    if (!loan || loan.returnedAt || new Date(loan.dueAt).getTime() <= Date.now()) throw new Error('LIBRARY_LOAN_NOT_RENEWABLE');
    if (!isLibraryManager(context.activeRole) && loan.borrowerUserId !== context.userId) throw new Error('LIBRARY_FORBIDDEN');
    if (loan.renewedCount >= state.policy.maxRenewals) throw new Error('LIBRARY_RENEWAL_LIMIT');
    if (loan.mode === 'PHYSICAL' && state.reservations.some((reservation) => reservation.itemId === loan.itemId && reservation.userId !== loan.borrowerUserId && reservation.status === 'ACTIVE')) throw new Error('LIBRARY_WAITLIST_BLOCKS_RENEWAL');
    const nextDue = new Date(loan.dueAt);
    nextDue.setDate(nextDue.getDate() + state.policy.renewalDays);
    const updated = { ...loan, dueAt: nextDue.toISOString(), renewedCount: loan.renewedCount + 1 };
    await tx.auditLog.create({ data: { tenantId: context.tenantId, userId: context.userId, action: LIBRARY_LOAN_ACTION, entity: loanEntity(loanId), diffJson: JSON.stringify(updated) } });
    return updated;
  });
}

export async function getDigitalAccess(context: ActiveUserContext, itemId: string) {
  const state = await getLibraryState(context.tenantId);
  const catalog = state.catalogMap.get(catalogEntity(itemId));
  if (!catalog?.digital) throw new Error('LIBRARY_DIGITAL_UNAVAILABLE');
  if (!isLibraryManager(context.activeRole) && !state.loans.some((loan) => loan.itemId === itemId && loan.borrowerUserId === context.userId && loan.mode === 'DIGITAL' && loanIsCurrent(loan))) throw new Error('LIBRARY_DIGITAL_ACCESS_REQUIRED');
  return catalog.digital;
}

export function libraryError(error: unknown) {
  const code = error instanceof Error ? error.message : 'LIBRARY_UNKNOWN';
  const messages: Record<string, { status: number; error: string }> = {
    LIBRARY_FORBIDDEN: { status: 403, error: 'You are not authorised for this library action.' },
    LIBRARY_BORROWING_FORBIDDEN: { status: 403, error: 'Your role cannot borrow library resources.' },
    LIBRARY_ITEM_NOT_RESERVABLE: { status: 422, error: 'This resource cannot be reserved for physical pickup.' },
    LIBRARY_ALREADY_RESERVED: { status: 409, error: 'You already have an active reservation for this title.' },
    LIBRARY_RESERVATION_NOT_FOUND: { status: 404, error: 'Reservation not found.' },
    LIBRARY_DIGITAL_UNAVAILABLE: { status: 404, error: 'No licensed online copy is currently available.' },
    LIBRARY_ALREADY_BORROWED: { status: 409, error: 'You already have an active digital loan for this title.' },
    LIBRARY_LOAN_LIMIT: { status: 409, error: 'The borrower has reached the active-loan limit.' },
    LIBRARY_NO_DIGITAL_SEATS: { status: 409, error: 'All licensed digital seats are currently in use.' },
    LIBRARY_USER_NOT_FOUND: { status: 404, error: 'Library member could not be resolved.' },
    LIBRARY_COPY_NOT_FOUND: { status: 404, error: 'No physical copy matches that barcode or RFID value.' },
    LIBRARY_COPY_ALREADY_LOANED: { status: 409, error: 'That physical copy is already on loan.' },
    LIBRARY_BORROWER_NOT_FOUND: { status: 404, error: 'No eligible active student or faculty member matches that email.' },
    LIBRARY_RESERVED_FOR_ANOTHER_MEMBER: { status: 409, error: 'This title is currently held for another member who is ahead in the reservation queue.' },
    LIBRARY_LOAN_NOT_ACTIVE: { status: 409, error: 'That loan is no longer active.' },
    LIBRARY_LOAN_NOT_RENEWABLE: { status: 409, error: 'This loan cannot be renewed in its current state.' },
    LIBRARY_RENEWAL_LIMIT: { status: 409, error: 'The maximum number of renewals has been reached.' },
    LIBRARY_WAITLIST_BLOCKS_RENEWAL: { status: 409, error: 'Another member is waiting for this title, so renewal is unavailable.' },
    LIBRARY_DIGITAL_ACCESS_REQUIRED: { status: 403, error: 'Borrow this e-book before opening the protected copy.' },
  };
  return messages[code] ?? { status: 500, error: 'The library service could not complete that request.' };
}
