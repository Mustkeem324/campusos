import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { getTenantDb, prisma } from './db';
import {
  addMinor,
  fromMinor,
  nonNegativeMinor,
  splitIntoInstallments,
  sumMinor,
  toMinor,
  type MoneyMinor,
} from './finance-money';
import {
  assertFinancePermission,
  canAwardScholarships,
  canManageFinancialHolds,
  canPostOfflinePayment,
  canReviewScholarships,
  isFinanceApprover,
  isFinanceConfigurator,
  isFinanceOperator,
  makerCheckerSeparated,
} from './finance-policy';
import type {
  AdminFinanceOverview,
  FeeCategory,
  FeeStructureHead,
  FeeStructureView,
  FinanceClearanceStatus,
  FinanceInvoiceView,
  FinanceSettings,
  FinancialHoldView,
  InvoiceGenerationPreview,
  LedgerEntryView,
  ReceiptVerification,
  RefundStatus,
  RefundView,
  ScholarshipApplicationStatus,
  ScholarshipApplicationView,
  ScholarshipProgramView,
  StudentFinanceWorkspace,
} from './finance-operations-types';

export class FinanceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'FinanceError';
  }
}

type SettingsRow = {
  currency: string;
  timezone: string;
  invoice_prefix: string;
  invoice_year_format: string;
  invoice_sequence_next: bigint | number | string;
  allow_partial_payments: boolean;
  allow_overpayment_credit: boolean;
  late_fee_model: string;
  late_fee_amount_minor: bigint | number | string;
  late_fee_percentage: string | number;
  late_fee_daily: boolean;
  late_fee_grace_days: number;
  late_fee_max_minor: bigint | number | string;
  scholarship_stacking_policy: string;
  scholarship_max_discount_pct: string | number;
  refund_requires_maker_checker: boolean;
  refund_high_value_minor: bigint | number | string;
  exam_requires_clearance: boolean;
};

type CategoryRow = {
  id: string;
  code: string;
  label: string;
  description: string | null;
  is_refundable: boolean;
  is_mandatory: boolean;
  is_active: boolean;
};

type StructureRow = {
  id: string;
  version: number;
  name: string;
  category_code: string | null;
  amount_minor: bigint | number | string;
  currency: string;
  academic_year_id: string | null;
  campus_id: string | null;
  program_ids: unknown;
  batch_ids: unknown;
  semester: string | null;
  study_modes: unknown;
  recurring: boolean;
  is_refundable: boolean;
  is_mandatory: boolean;
  tax_applicable: boolean;
  tax_rate: string | number;
  effective_from: Date;
  effective_until: Date | null;
  installment_eligibility: boolean;
  max_installments: number;
  scholarship_eligible: boolean;
  status: string;
  created_at: Date;
};

type ComponentRow = {
  fee_structure_id: string;
  name: string;
  category_code: string | null;
  amount_minor: bigint | number | string;
  is_recurring: boolean;
};

type LedgerRow = {
  id: string;
  entry_type: string;
  debit_minor: bigint | number | string;
  credit_minor: bigint | number | string;
  reference: string | null;
  reason: string | null;
  actor_role: string | null;
  created_at: Date;
};

type RefundRow = {
  id: string;
  payment_id: string;
  invoice_id: string | null;
  requested_minor: bigint | number | string;
  approved_minor: bigint | number | string | null;
  status: string;
  reason: string;
  requested_role: string;
  review_note: string | null;
  completion_reference: string | null;
  created_at: Date;
};

type ProgramRow = {
  id: string;
  name: string;
  provider: string | null;
  value_type: string;
  fixed_amount_minor: bigint | number | string;
  percentage: string | number;
  cap_minor: bigint | number | string;
  budget_minor: bigint | number | string;
  awarded_minor: bigint | number | string;
  program_ids: unknown;
  status: string;
  application_opens: Date | null;
  application_closes: Date | null;
  applies_to_components: unknown;
  stacking_allowed: boolean;
};

type ApplicationRow = {
  id: string;
  program_id: string;
  program_name: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  status: string;
  statement: string | null;
  document_refs: unknown;
  created_at: Date;
};

type HoldRow = {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  reason: string;
  amount_minor: bigint | number | string;
  impact_scope: unknown;
  status: string;
  created_at: Date;
};

type ReceiptVerifyRow = {
  receipt_number: string;
  amount_minor: bigint | number | string;
  currency: string;
  payment_method: string;
  status: string;
  issued_at: Date;
  institution_name: string;
};

type StudyModeRow = { study_mode: string };

function dbNumber(value: bigint | number | string) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dbPercent(value: string | number): number {
  const parsed = typeof value === 'string' ? Number(value) : value;
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function parseBooleanRow(value: boolean | null | undefined): boolean {
  return Boolean(value);
}

export const DEFAULT_FINANCE_SETTINGS: FinanceSettings = {
  currency: 'INR',
  timezone: 'Asia/Kolkata',
  invoicePrefix: 'INV',
  invoiceYearFormat: 'YYYY',
  allowPartialPayments: true,
  allowOverpaymentCredit: false,
  lateFeeModel: 'NONE',
  lateFeeAmountMinor: 0,
  lateFeePercentage: 0,
  lateFeeDaily: false,
  lateFeeGraceDays: 0,
  lateFeeMaxMinor: 0,
  scholarshipStackingPolicy: 'NO_STACKING',
  scholarshipMaxDiscountPct: 100,
  refundRequiresMakerChecker: true,
  refundHighValueMinor: 0,
  examRequiresClearance: false,
};

async function getFinanceSettingsRow(tenantId: string): Promise<SettingsRow | null> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT currency, timezone, invoice_prefix, invoice_year_format, invoice_sequence_next,
             allow_partial_payments, allow_overpayment_credit, late_fee_model,
             late_fee_amount_minor, late_fee_percentage, late_fee_daily, late_fee_grace_days,
             late_fee_max_minor, scholarship_stacking_policy, scholarship_max_discount_pct,
             refund_requires_maker_checker, refund_high_value_minor, exam_requires_clearance
      FROM campusos_finance.finance_settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getFinanceSettings(tenantId: string): Promise<FinanceSettings> {
  const row = await getFinanceSettingsRow(tenantId);
  if (!row) return { ...DEFAULT_FINANCE_SETTINGS };
  return {
    currency: row.currency || 'INR',
    timezone: row.timezone || 'Asia/Kolkata',
    invoicePrefix: row.invoice_prefix || 'INV',
    invoiceYearFormat: row.invoice_year_format || 'YYYY',
    allowPartialPayments: parseBooleanRow(row.allow_partial_payments),
    allowOverpaymentCredit: parseBooleanRow(row.allow_overpayment_credit),
    lateFeeModel: (['NONE', 'FIXED', 'PERCENTAGE', 'DAILY'] as const).includes(row.late_fee_model as never)
      ? (row.late_fee_model as FinanceSettings['lateFeeModel'])
      : 'NONE',
    lateFeeAmountMinor: dbNumber(row.late_fee_amount_minor),
    lateFeePercentage: dbPercent(row.late_fee_percentage),
    lateFeeDaily: parseBooleanRow(row.late_fee_daily),
    lateFeeGraceDays: row.late_fee_grace_days ?? 0,
    lateFeeMaxMinor: dbNumber(row.late_fee_max_minor),
    scholarshipStackingPolicy: (['NO_STACKING', 'LIMITED', 'UNLIMITED'] as const).includes(row.scholarship_stacking_policy as never)
      ? (row.scholarship_stacking_policy as FinanceSettings['scholarshipStackingPolicy'])
      : 'NO_STACKING',
    scholarshipMaxDiscountPct: dbPercent(row.scholarship_max_discount_pct),
    refundRequiresMakerChecker: parseBooleanRow(row.refund_requires_maker_checker),
    refundHighValueMinor: dbNumber(row.refund_high_value_minor),
    examRequiresClearance: parseBooleanRow(row.exam_requires_clearance),
  };
}

async function ensureFinanceSettingsRow(tenantId: string, currency = 'INR') {
  await prisma.$executeRaw`
    INSERT INTO campusos_finance.finance_settings (tenant_id, currency, updated_at)
    VALUES (${tenantId}::uuid, ${currency}, now())
    ON CONFLICT (tenant_id) DO NOTHING
  `;
}

export async function updateFinanceSettings(
  context: ActiveUserContext,
  patch: Partial<FinanceSettings>,
): Promise<FinanceSettings> {
  assertFinancePermission(isFinanceConfigurator(context), 'finance:configure');
  const settings = await getFinanceSettings(context.tenantId);

  const currency = patch.currency ?? settings.currency;
  if (!/^[A-Z]{3}$/.test(currency)) throw new FinanceError('Currency must be a 3-letter ISO code.', 400);

  const timezone = patch.timezone ?? settings.timezone;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  } catch {
    throw new FinanceError('Timezone is invalid.', 400);
  }

  await ensureFinanceSettingsRow(context.tenantId, currency);

  await prisma.$executeRaw`
    UPDATE campusos_finance.finance_settings
    SET currency = ${currency},
        timezone = ${timezone},
        invoice_prefix = ${(patch.invoicePrefix ?? settings.invoicePrefix).slice(0, 12)},
        invoice_year_format = ${(patch.invoiceYearFormat ?? settings.invoiceYearFormat).slice(0, 8)},
        allow_partial_payments = ${patch.allowPartialPayments ?? settings.allowPartialPayments},
        allow_overpayment_credit = ${patch.allowOverpaymentCredit ?? settings.allowOverpaymentCredit},
        late_fee_model = ${patch.lateFeeModel ?? settings.lateFeeModel},
        late_fee_amount_minor = ${patch.lateFeeAmountMinor ?? settings.lateFeeAmountMinor},
        late_fee_percentage = ${patch.lateFeePercentage ?? settings.lateFeePercentage},
        late_fee_daily = ${patch.lateFeeDaily ?? settings.lateFeeDaily},
        late_fee_grace_days = ${patch.lateFeeGraceDays ?? settings.lateFeeGraceDays},
        late_fee_max_minor = ${patch.lateFeeMaxMinor ?? settings.lateFeeMaxMinor},
        scholarship_stacking_policy = ${patch.scholarshipStackingPolicy ?? settings.scholarshipStackingPolicy},
        scholarship_max_discount_pct = ${patch.scholarshipMaxDiscountPct ?? settings.scholarshipMaxDiscountPct},
        refund_requires_maker_checker = ${patch.refundRequiresMakerChecker ?? settings.refundRequiresMakerChecker},
        refund_high_value_minor = ${patch.refundHighValueMinor ?? settings.refundHighValueMinor},
        exam_requires_clearance = ${patch.examRequiresClearance ?? settings.examRequiresClearance},
        updated_by = ${context.userId}::uuid,
        updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid
  `;
  await writeFinanceAudit(context, 'SETTINGS_UPDATED', 'finance_settings', context.tenantId, null, { patch: Object.keys(patch) });
  return getFinanceSettings(context.tenantId);
}

// ---------------------------------------------------------------------------
// Audit trail
// ---------------------------------------------------------------------------
export async function writeFinanceAudit(
  context: ActiveUserContext,
  action: string,
  targetType: string,
  targetId: string | null,
  previousState: unknown = null,
  newState: unknown = null,
  reason: string | null = null,
) {
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_finance.finance_audit_events
        (id, tenant_id, actor_user_id, actor_role, action, target_type, target_id,
         previous_state, new_state, reason, created_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${context.userId}::uuid, ${context.activeRole},
         ${action}, ${targetType}, ${targetId}, CAST(${JSON.stringify(previousState ?? null)} AS jsonb),
         CAST(${JSON.stringify(newState ?? null)} AS jsonb), ${reason}, now())
    `;
  } catch (error) {
    console.error('Finance audit write failed:', error);
  }
}

// ---------------------------------------------------------------------------
// Fee categories
// ---------------------------------------------------------------------------
export async function listFeeCategories(tenantId: string): Promise<FeeCategory[]> {
  try {
    const rows = await prisma.$queryRaw<CategoryRow[]>`
      SELECT id, code, label, description, is_refundable, is_mandatory, is_active
      FROM campusos_finance.fee_categories
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY label ASC
    `;
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      label: row.label,
      description: row.description,
      isRefundable: parseBooleanRow(row.is_refundable),
      isMandatory: parseBooleanRow(row.is_mandatory),
      isActive: parseBooleanRow(row.is_active),
    }));
  } catch {
    return [];
  }
}

export async function createFeeCategory(
  context: ActiveUserContext,
  input: { code: string; label: string; description?: string; isRefundable?: boolean; isMandatory?: boolean },
): Promise<FeeCategory> {
  assertFinancePermission(isFinanceConfigurator(context), 'finance:configure');
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  const label = input.label.trim();
  if (code.length < 2 || code.length > 32) throw new FinanceError('Category code must be 2-32 characters.', 400);
  if (!label) throw new FinanceError('Category label is required.', 400);

  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_finance.fee_categories
        (id, tenant_id, code, label, description, is_refundable, is_mandatory, created_by, created_at, updated_at)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${code}, ${label}, ${input.description?.trim() || null},
         ${input.isRefundable ?? false}, ${input.isMandatory ?? true}, ${context.userId}::uuid, now(), now())
    `;
  } catch (error) {
    throw new FinanceError('A fee category with this code already exists.', 409);
  }
  await writeFinanceAudit(context, 'FEE_CATEGORY_CREATED', 'fee_categories', id, null, { code, label });
  return { id, code, label, description: input.description?.trim() || null, isRefundable: input.isRefundable ?? false, isMandatory: input.isMandatory ?? true, isActive: true };
}

// ---------------------------------------------------------------------------
// Fee structures
// ---------------------------------------------------------------------------
async function readFeeStructures(tenantId: string): Promise<Array<StructureRow & { heads: FeeStructureHead[] }>> {
  const rows = await prisma.$queryRaw<StructureRow[]>`
    SELECT id, version, name, category_code, amount_minor, currency, academic_year_id, campus_id,
           program_ids, batch_ids, semester, study_modes, recurring, is_refundable, is_mandatory,
           tax_applicable, tax_rate, effective_from, effective_until, installment_eligibility,
           max_installments, scholarship_eligible, status, created_at
    FROM campusos_finance.fee_structures
    WHERE tenant_id = ${tenantId}::uuid
    ORDER BY created_at DESC
    LIMIT 200
  `;
  if (rows.length === 0) return [];
  const structureIds = rows.map((row) => row.id);
  const components = await prisma.$queryRaw<ComponentRow[]>(Prisma.sql`
    SELECT fee_structure_id, name, category_code, amount_minor, is_recurring
    FROM campusos_finance.fee_structure_components
    WHERE fee_structure_id IN (${Prisma.join(structureIds.map((id) => Prisma.sql`${id}::uuid`))})
    ORDER BY sort_order ASC
  `);
  const componentGroups = new Map<string, FeeStructureHead[]>();
  for (const component of components) {
    const heads = componentGroups.get(component.fee_structure_id) ?? [];
    heads.push({
      name: component.name,
      categoryCode: component.category_code,
      amountMinor: dbNumber(component.amount_minor),
      isRecurring: parseBooleanRow(component.is_recurring),
    });
    componentGroups.set(component.fee_structure_id, heads);
  }
  return rows.map((row) => ({ ...row, heads: componentGroups.get(row.id) ?? [] }));
}

export async function listFeeStructures(tenantId: string): Promise<FeeStructureView[]> {
  try {
    const structures = await readFeeStructures(tenantId);
    return structures.map((row) => ({
      id: row.id,
      version: row.version,
      name: row.name,
      categoryCode: row.category_code,
      amountMinor: dbNumber(row.amount_minor),
      currency: row.currency,
      academicYearId: row.academic_year_id,
      campusId: row.campus_id,
      programIds: parseStringArray(row.program_ids),
      batchIds: parseStringArray(row.batch_ids),
      semester: row.semester,
      studyModes: parseStringArray(row.study_modes),
      recurring: parseBooleanRow(row.recurring),
      isRefundable: parseBooleanRow(row.is_refundable),
      isMandatory: parseBooleanRow(row.is_mandatory),
      taxApplicable: parseBooleanRow(row.tax_applicable),
      taxRate: dbPercent(row.tax_rate),
      effectiveFrom: row.effective_from.toISOString().slice(0, 10),
      effectiveUntil: row.effective_until ? row.effective_until.toISOString().slice(0, 10) : null,
      installmentEligibility: parseBooleanRow(row.installment_eligibility),
      maxInstallments: row.max_installments,
      scholarshipEligible: parseBooleanRow(row.scholarship_eligible),
      status: row.status === 'ARCHIVED' ? 'ARCHIVED' : 'ACTIVE',
      heads: row.heads,
      createdAt: row.created_at.toISOString(),
    }));
  } catch (error) {
    console.error('Fee structures unavailable:', error);
    return [];
  }
}

function normalizeProgramIds(ids: unknown): string[] {
  return parseStringArray(ids).filter((id) => /^[0-9a-f-]{36}$/i.test(id));
}

export async function createFeeStructure(
  context: ActiveUserContext,
  input: {
    name: string;
    categoryCode?: string;
    amountMinor: number;
    currency?: string;
    academicYearId?: string;
    campusId?: string;
    programIds?: string[];
    batchIds?: string[];
    semester?: string;
    studyModes?: string[];
    recurring?: boolean;
    isRefundable?: boolean;
    isMandatory?: boolean;
    taxApplicable?: boolean;
    taxRate?: number;
    effectiveFrom: string;
    effectiveUntil?: string;
    installmentEligibility?: boolean;
    maxInstallments?: number;
    scholarshipEligible?: boolean;
    heads?: FeeStructureHead[];
  },
): Promise<FeeStructureView> {
  assertFinancePermission(isFinanceConfigurator(context), 'finance:configure');
  const name = input.name.trim();
  if (!name) throw new FinanceError('Fee structure name is required.', 400);
  if (!Number.isInteger(input.amountMinor) || input.amountMinor < 0) {
    throw new FinanceError('Fee structure amount must be a non-negative whole minor-unit value.', 400);
  }
  const effectiveFrom = new Date(input.effectiveFrom);
  if (Number.isNaN(effectiveFrom.getTime())) throw new FinanceError('Effective from date is invalid.', 400);

  const currency = input.currency ?? 'INR';
  const id = randomUUID();
  const legacyId = randomUUID();

  const heads = (input.heads ?? []).map((head, index) => ({
    ...head,
    name: head.name.trim(),
    amountMinor: Number.isInteger(head.amountMinor) && head.amountMinor >= 0 ? head.amountMinor : 0,
    sortOrder: index,
  }));

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO public.fee_structures (id, tenant_id, name, amount)
      VALUES (${legacyId}::uuid, ${context.tenantId}::uuid, ${name}, ${fromMinor(input.amountMinor)})
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_finance.fee_structures
        (id, tenant_id, legacy_id, version, name, category_code, amount_minor, currency,
         academic_year_id, campus_id, program_ids, batch_ids, semester, study_modes,
         recurring, is_refundable, is_mandatory, tax_applicable, tax_rate,
         effective_from, effective_until, installment_eligibility, max_installments,
         scholarship_eligible, status, created_by, created_at, updated_at)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${legacyId}::uuid, 1, ${name}, ${input.categoryCode || null},
         ${input.amountMinor}, ${currency}, ${input.academicYearId || null}::uuid, ${input.campusId || null}::uuid,
         CAST(${JSON.stringify(normalizeProgramIds(input.programIds))} AS jsonb),
         CAST(${JSON.stringify(normalizeProgramIds(input.batchIds))} AS jsonb),
         ${input.semester?.trim() || null},
         CAST(${JSON.stringify(input.studyModes ?? ['OFFLINE', 'HYBRID', 'ONLINE'])} AS jsonb),
         ${input.recurring ?? false}, ${input.isRefundable ?? false}, ${input.isMandatory ?? true},
         ${input.taxApplicable ?? false}, ${input.taxRate ?? 0},
         ${effectiveFrom}::date, ${input.effectiveUntil ? new Date(input.effectiveUntil) : null}::date,
         ${input.installmentEligibility ?? false}, ${Math.max(1, input.maxInstallments ?? 1)},
         ${input.scholarshipEligible ?? true}, 'ACTIVE', ${context.userId}::uuid, now(), now())
    `;
    for (const head of heads) {
      await tx.$executeRaw`
        INSERT INTO campusos_finance.fee_structure_components
          (id, fee_structure_id, tenant_id, name, category_code, amount_minor, is_recurring, sort_order)
        VALUES
          (${randomUUID()}::uuid, ${id}::uuid, ${context.tenantId}::uuid, ${head.name},
           ${head.categoryCode || null}, ${head.amountMinor}, ${head.isRecurring ?? false}, ${head.sortOrder})
      `;
    }
  });

  await writeFinanceAudit(context, 'FEE_STRUCTURE_CREATED', 'fee_structures', id, null, { name, amountMinor: input.amountMinor, currency });

  return {
    id,
    version: 1,
    name,
    categoryCode: input.categoryCode || null,
    amountMinor: input.amountMinor,
    currency,
    academicYearId: input.academicYearId ?? null,
    campusId: input.campusId ?? null,
    programIds: normalizeProgramIds(input.programIds),
    batchIds: normalizeProgramIds(input.batchIds),
    semester: input.semester?.trim() || null,
    studyModes: input.studyModes ?? ['OFFLINE', 'HYBRID', 'ONLINE'],
    recurring: input.recurring ?? false,
    isRefundable: input.isRefundable ?? false,
    isMandatory: input.isMandatory ?? true,
    taxApplicable: input.taxApplicable ?? false,
    taxRate: input.taxRate ?? 0,
    effectiveFrom: input.effectiveFrom,
    effectiveUntil: input.effectiveUntil ?? null,
    installmentEligibility: input.installmentEligibility ?? false,
    maxInstallments: Math.max(1, input.maxInstallments ?? 1),
    scholarshipEligible: input.scholarshipEligible ?? true,
    status: 'ACTIVE',
    heads,
    createdAt: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Study mode resolution (uses the timetable/attendance operational profile)
// ---------------------------------------------------------------------------
export async function resolveStudyMode(tenantId: string, studentId: string): Promise<'ONLINE' | 'OFFLINE' | 'HYBRID' | null> {
  try {
    const rows = await prisma.$queryRaw<StudyModeRow[]>`
      SELECT study_mode
      FROM campusos_attendance.student_profiles
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid
      LIMIT 1
    `;
    const mode = rows[0]?.study_mode;
    return mode === 'ONLINE' || mode === 'OFFLINE' || mode === 'HYBRID' ? mode : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Invoice generation (idempotent, previewable, server-authorized)
// ---------------------------------------------------------------------------
type StructureDetailRow = StructureRow & { legacy_id: string | null; due_date_offset_days: number };

async function getStructureDetail(tenantId: string, structureId: string): Promise<StructureDetailRow | null> {
  const rows = await prisma.$queryRaw<StructureDetailRow[]>`
    SELECT id, legacy_id, version, name, category_code, amount_minor, currency, academic_year_id,
           campus_id, program_ids, batch_ids, semester, study_modes, recurring, is_refundable,
           is_mandatory, tax_applicable, tax_rate, effective_from, effective_until,
           installment_eligibility, max_installments, scholarship_eligible, status, created_at,
           due_date_offset_days
    FROM campusos_finance.fee_structures
    WHERE tenant_id = ${tenantId}::uuid AND id = ${structureId}::uuid
    LIMIT 1
  `;
  return rows[0] ?? null;
}

async function candidateStudents(
  tenantId: string,
  structure: StructureDetailRow,
): Promise<Array<{ id: string; name: string; rollNumber: string }>> {
  const programIds = parseStringArray(structure.program_ids);
  const batchIds = parseStringArray(structure.batch_ids);
  const db = getTenantDb(tenantId);

  // Resolve targeting to concrete batch ids, intersecting every scope the fee
  // structure applies to (explicit batches, programs, campus via
  // program -> department -> campus).
  let targetBatchIds: string[] | null = batchIds.length > 0 ? batchIds : null;

  if (targetBatchIds === null && programIds.length > 0) {
    const batches = await db.batch.findMany({ where: { programId: { in: programIds } }, select: { id: true } });
    targetBatchIds = batches.map((batch) => batch.id);
  }

  if (structure.campus_id) {
    const campusPrograms = await db.program.findMany({
      where: { department: { campusId: structure.campus_id } },
      select: { id: true },
    });
    const campusBatches = await db.batch.findMany({
      where: { programId: { in: campusPrograms.map((program) => program.id) } },
      select: { id: true },
    });
    const campusBatchIds = campusBatches.map((batch) => batch.id);
    targetBatchIds =
      targetBatchIds === null ? campusBatchIds : targetBatchIds.filter((id) => campusBatchIds.includes(id));
  }

  const where: Record<string, unknown> = { tenantId };
  if (targetBatchIds !== null) where.batchId = { in: targetBatchIds };

  const students = await db.student.findMany({
    where,
    select: {
      id: true,
      user: { select: { name: true } },
      rollNumber: true,
    },
    take: 2000,
  });
  return students.map((student) => ({ id: student.id, name: student.user.name, rollNumber: student.rollNumber }));
}

async function existingGeneratedInvoiceIds(tenantId: string, legacyId: string | null): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<Array<{ student_id: string }>>`
    SELECT student_id
    FROM public.invoices
    WHERE tenant_id = ${tenantId}::uuid AND fee_structure_id = ${legacyId}::uuid
  `;
  return new Set(rows.map((row) => row.student_id));
}

async function approvedScholarshipForStructure(
  tenantId: string,
  structure: StructureDetailRow,
): Promise<Array<{ student_id: string; awarded_minor: number }>> {
  try {
    const rows = await prisma.$queryRaw<Array<{ student_id: string; awarded_minor: bigint | number | string }>>`
      SELECT student_id, awarded_minor
      FROM campusos_finance.scholarship_awards
      WHERE tenant_id = ${tenantId}::uuid
        AND status = 'APPROVED'
        AND awarded_minor > 0
    `;
    return rows.map((row) => ({ student_id: row.student_id, awarded_minor: dbNumber(row.awarded_minor) }));
  } catch {
    return [];
  }
}

export async function previewInvoiceGeneration(
  context: ActiveUserContext,
  structureId: string,
): Promise<InvoiceGenerationPreview> {
  assertFinancePermission(isFinanceOperator(context), 'finance:operations');
  const structure = await getStructureDetail(context.tenantId, structureId);
  if (!structure) throw new FinanceError('Fee structure not found.', 404);
  if (structure.status !== 'ACTIVE') throw new FinanceError('Only active fee structures can generate invoices.', 409);

  const candidates = await candidateStudents(context.tenantId, structure);
  const existing = await existingGeneratedInvoiceIds(context.tenantId, structure.legacy_id);
  const fresh = candidates.filter((student) => !existing.has(student.id));
  const scholarships = await approvedScholarshipForStructure(context.tenantId, structure);

  const grossMinor = dbNumber(structure.amount_minor);
  let scholarshipMinor = 0;
  for (const student of fresh) {
    const award = scholarships.find((item) => item.student_id === student.id);
    scholarshipMinor += award ? Math.min(award.awarded_minor, grossMinor) : 0;
  }
  const sample = fresh.slice(0, 8);

  return {
    structure: {
      id: structure.id,
      version: structure.version,
      name: structure.name,
      categoryCode: structure.category_code,
      amountMinor: grossMinor,
      currency: structure.currency,
      academicYearId: structure.academic_year_id,
      campusId: structure.campus_id,
      programIds: parseStringArray(structure.program_ids),
      batchIds: parseStringArray(structure.batch_ids),
      semester: structure.semester,
      studyModes: parseStringArray(structure.study_modes),
      recurring: parseBooleanRow(structure.recurring),
      isRefundable: parseBooleanRow(structure.is_refundable),
      isMandatory: parseBooleanRow(structure.is_mandatory),
      taxApplicable: parseBooleanRow(structure.tax_applicable),
      taxRate: dbPercent(structure.tax_rate),
      effectiveFrom: structure.effective_from.toISOString().slice(0, 10),
      effectiveUntil: structure.effective_until ? structure.effective_until.toISOString().slice(0, 10) : null,
      installmentEligibility: parseBooleanRow(structure.installment_eligibility),
      maxInstallments: structure.max_installments,
      scholarshipEligible: parseBooleanRow(structure.scholarship_eligible),
      status: 'ACTIVE' as const,
      heads: [],
      createdAt: structure.created_at.toISOString(),
    },
    candidateCount: fresh.length,
    grossMinor: grossMinor * fresh.length,
    scholarshipMinor,
    netMinor: nonNegativeMinor(grossMinor * fresh.length - scholarshipMinor),
    excludedStudents: candidates.length - fresh.length,
    existingInvoiceCount: existing.size,
    sampleStudents: sample,
  };
}

function nextInvoiceNumber(settings: FinanceSettings, sequence: number): string {
  const year = new Date().getFullYear().toString();
  const yearPart = settings.invoiceYearFormat === 'YY' ? year.slice(2) : year;
  return `${settings.invoicePrefix}/${yearPart}/INV/${String(sequence).padStart(6, '0')}`;
}

export async function generateInvoices(context: ActiveUserContext, structureId: string): Promise<{ generated: number; skipped: number }> {
  assertFinancePermission(isFinanceOperator(context), 'finance:operations');
  const structure = await getStructureDetail(context.tenantId, structureId);
  if (!structure) throw new FinanceError('Fee structure not found.', 404);
  if (structure.status !== 'ACTIVE') throw new FinanceError('Only active fee structures can generate invoices.', 409);
  if (!structure.legacy_id) throw new FinanceError('Fee structure has no compatible legacy fee record.', 409);

  const candidates = await candidateStudents(context.tenantId, structure);
  const existing = await existingGeneratedInvoiceIds(context.tenantId, structure.legacy_id);
  const fresh = candidates.filter((student) => !existing.has(student.id));
  if (fresh.length === 0) return { generated: 0, skipped: candidates.length };

  const scholarships = await approvedScholarshipForStructure(context.tenantId, structure);
  const settings = await getFinanceSettings(context.tenantId);
  await ensureFinanceSettingsRow(context.tenantId, settings.currency);
  const grossMinor = dbNumber(structure.amount_minor);
  const dueDate = new Date(structure.effective_until ?? new Date());
  if (structure.effective_until) dueDate.setDate(dueDate.getDate() + (structure.due_date_offset_days ?? 0));

  let generated = 0;
  await prisma.$transaction(async (tx) => {
    // Reserve invoice sequence numbers for this batch inside the transaction.
    const seqRows = await tx.$queryRaw<Array<{ invoice_sequence_next: bigint | number | string }>>`
      SELECT invoice_sequence_next
      FROM campusos_finance.finance_settings
      WHERE tenant_id = ${context.tenantId}::uuid
      FOR UPDATE
    `;
    let sequence = dbNumber(seqRows[0]?.invoice_sequence_next ?? 1);

    for (const student of fresh) {
      const invoiceId = randomUUID();
      const legacyFeeId = structure.legacy_id;
      const award = scholarships.find((item) => item.student_id === student.id);
      const scholarshipMinor = award ? Math.min(award.awarded_minor, grossMinor) : 0;
      const netMinor = nonNegativeMinor(grossMinor - scholarshipMinor);
      const invoiceNumber = nextInvoiceNumber(settings, sequence);
      sequence += 1;

      await tx.$executeRaw`
        INSERT INTO public.invoices (id, tenant_id, student_id, fee_structure_id, amount, due_date, status)
        VALUES (${invoiceId}::uuid, ${context.tenantId}::uuid, ${student.id}::uuid, ${legacyFeeId}::uuid,
                ${fromMinor(netMinor)}, ${dueDate}, 'PENDING')
      `;
      await tx.$executeRaw`
        INSERT INTO campusos_finance.invoice_registry (id, tenant_id, invoice_id, invoice_number, issued_by, issued_at)
        VALUES (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${invoiceId}::uuid, ${invoiceNumber},
                ${context.userId}::uuid, now())
      `;
      await tx.$executeRaw`
        INSERT INTO campusos_finance.ledger_entries
          (id, tenant_id, student_id, entry_type, debit_minor, credit_minor, currency,
           invoice_id, reference, reason, actor_user_id, actor_role, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${student.id}::uuid, 'INVOICE_CHARGE',
           ${netMinor}, 0, ${structure.currency}, ${invoiceId}::uuid, ${invoiceNumber},
           ${structure.name}, ${context.userId}::uuid, ${context.activeRole}, now())
      `;
      if (scholarshipMinor > 0) {
        await tx.$executeRaw`
          INSERT INTO campusos_finance.ledger_entries
            (id, tenant_id, student_id, entry_type, debit_minor, credit_minor, currency,
             invoice_id, reference, reason, actor_user_id, actor_role, created_at)
          VALUES
            (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${student.id}::uuid, 'SCHOLARSHIP_CREDIT',
             0, ${scholarshipMinor}, ${structure.currency}, ${invoiceId}::uuid, ${invoiceNumber},
             'Approved scholarship applied at invoice generation', ${context.userId}::uuid, ${context.activeRole}, now())
        `;
      }
      if (structure.installment_eligibility && structure.max_installments > 1 && netMinor > 0) {
        const parts = splitIntoInstallments(netMinor, Math.min(structure.max_installments, 12));
        for (const [index, amountMinor] of parts.entries()) {
          const installmentDate = new Date(dueDate);
          installmentDate.setMonth(installmentDate.getMonth() + index);
          await tx.$executeRaw`
            INSERT INTO campusos_finance.installments
              (id, tenant_id, invoice_id, installment_number, amount_minor, due_date, status, created_at)
            VALUES
              (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${invoiceId}::uuid, ${index + 1},
               ${amountMinor}, ${installmentDate}::date, 'PENDING', now())
          `;
        }
      }
      generated += 1;
    }

    await tx.$executeRaw`
      UPDATE campusos_finance.finance_settings
      SET invoice_sequence_next = ${sequence}, updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid
    `;
  }, { timeout: 30_000 });

  await writeFinanceAudit(context, 'INVOICES_GENERATED', 'fee_structures', structureId, null, { generated, structure: structure.name });
  return { generated, skipped: candidates.length - fresh.length };
}

// ---------------------------------------------------------------------------
// Offline payment entry (finance roles only)
// ---------------------------------------------------------------------------
type InvoiceBalanceRow = {
  id: string;
  amount: number;
  student_id: string;
};

export async function recordOfflinePayment(
  context: ActiveUserContext,
  input: {
    invoiceIds: string[];
    amountMinor: number;
    method: 'CASH' | 'CHEQUE' | 'DD' | 'NETBANKING';
    paymentDate?: string;
    reference?: string;
    notes?: string;
  },
): Promise<{ receiptNumber: string; verifyReference: string }> {
  assertFinancePermission(canPostOfflinePayment(context), 'finance:offline-payment');
  const invoiceIds = Array.from(new Set(input.invoiceIds.filter(Boolean)));
  if (invoiceIds.length < 1 || invoiceIds.length > 50) throw new FinanceError('Select between 1 and 50 invoices.', 400);
  if (!Number.isInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new FinanceError('Payment amount must be a positive whole minor-unit value.', 400);
  }
  const paymentDate = input.paymentDate ? new Date(input.paymentDate) : new Date();
  if (Number.isNaN(paymentDate.getTime())) throw new FinanceError('Payment date is invalid.', 400);

  let receiptNumber = '';
  let verifyReference = '';
  await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<InvoiceBalanceRow[]>(Prisma.sql`
      SELECT id, amount, student_id
      FROM public.invoices
      WHERE tenant_id = ${context.tenantId}::uuid
        AND id IN (${Prisma.join(invoiceIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY id
      FOR UPDATE
    `);
    if (locked.length !== invoiceIds.length) {
      throw new FinanceError('One or more selected invoices are unavailable.', 400);
    }

    const balances = new Map<string, MoneyMinor>();
    for (const invoice of locked) {
      const payments = await tx.payment.findMany({
        where: { invoiceId: invoice.id, status: 'PAID' },
        select: { amount: true },
      });
      const paidMinor = sumMinor(payments.map((payment) => toMinor(payment.amount)));
      balances.set(invoice.id, nonNegativeMinor(toMinor(invoice.amount) - paidMinor));
    }
    const totalBalanceMinor = sumMinor(invoiceIds.map((id) => balances.get(id) ?? 0));
    if (input.amountMinor > totalBalanceMinor) {
      throw new FinanceError('Offline payment exceeds the remaining invoice balance and cannot be recorded.', 422);
    }

    let remaining = input.amountMinor;
    for (const invoiceId of invoiceIds) {
      const balanceMinor = balances.get(invoiceId) ?? 0;
      if (balanceMinor <= 0 || remaining <= 0) continue;
      const allocationMinor = Math.min(remaining, balanceMinor);
      const paymentId = randomUUID();
      const transactionId = `OFFLINE-${randomUUID().slice(0, 12).toUpperCase()}`;
      receiptNumber = `RCPT-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${randomUUID().slice(0, 8).toUpperCase()}`;
      verifyReference = `VRF-${randomUUID().slice(0, 16).toUpperCase()}`;

      await tx.payment.create({
        data: {
          tenantId: context.tenantId,
          invoiceId,
          amount: fromMinor(allocationMinor),
          method: input.method,
          status: 'PAID',
          transactionId: `${transactionId}:${invoiceId}`,
          paidAt: paymentDate,
        },
      });
      await tx.invoice.update({
        where: { id: invoiceId },
        data: { status: balanceMinor - allocationMinor <= 1 ? 'PAID' : 'PARTIAL' },
      });
      await tx.$executeRaw`
        INSERT INTO campusos_finance.ledger_entries
          (id, tenant_id, student_id, entry_type, debit_minor, credit_minor, currency,
           invoice_id, payment_id, reference, reason, actor_user_id, actor_role, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${locked.find((row) => row.id === invoiceId)?.student_id}::uuid,
           'PAYMENT', 0, ${allocationMinor}, 'INR', ${invoiceId}::uuid, ${paymentId}::uuid,
           ${transactionId}, ${input.notes?.trim() || 'Offline payment recorded by finance'}, ${context.userId}::uuid,
           ${context.activeRole}, now())
      `;
      await tx.$executeRaw`
        INSERT INTO campusos_finance.receipt_registry
          (id, tenant_id, payment_id, invoice_id, receipt_number, verify_reference, amount_minor,
           currency, payment_method, status, issued_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${paymentId}::uuid, ${invoiceId}::uuid,
           ${receiptNumber}, ${verifyReference}, ${allocationMinor}, 'INR', ${input.method}, 'VALID', now())
      `;
      remaining -= allocationMinor;
    }
  }, { timeout: 20_000 });

  await writeFinanceAudit(context, 'OFFLINE_PAYMENT_RECORDED', 'invoices', invoiceIds.join(','), null, {
    amountMinor: input.amountMinor,
    method: input.method,
    reference: input.reference?.trim() || null,
  });
  return { receiptNumber, verifyReference };
}

// ---------------------------------------------------------------------------
// Refund workflow
// ---------------------------------------------------------------------------
type RefundedRow = { refunded_minor: bigint | number | string };

export async function requestRefund(
  context: ActiveUserContext,
  input: { paymentId: string; requestedMinor: number; reason: string },
): Promise<RefundView> {
  if (!Number.isInteger(input.requestedMinor) || input.requestedMinor <= 0) {
    throw new FinanceError('Refund amount must be a positive whole minor-unit value.', 400);
  }
  const reason = input.reason.trim();
  if (reason.length < 5 || reason.length > 2000) throw new FinanceError('Provide a reason between 5 and 2000 characters.', 400);

  // Resolve authorized student ids (student owns payment, parent covers ward).
  // Finance operators (e.g. ACCOUNTANT) may request refunds institution-wide;
  // the payment lookup stays tenant-scoped regardless of the requester.
  const studentIds = await authorizedStudentIds(context);
  const operatorScoped = isFinanceOperator(context);

  const payments = await prisma.payment.findMany({
    where: {
      id: input.paymentId,
      tenantId: context.tenantId,
      status: 'PAID',
      ...(operatorScoped ? {} : { invoice: { studentId: { in: studentIds } } }),
    },
    select: {
      id: true,
      amount: true,
      invoiceId: true,
      invoice: { select: { studentId: true } },
      paidAt: true,
    },
  });
  const payment = payments[0];
  if (!payment) throw new FinanceError('The selected confirmed payment is not available for this account.', 404);

  const refundedRows = await prisma.$queryRaw<RefundedRow[]>`
    SELECT COALESCE(SUM(approved_minor), 0) AS refunded_minor
    FROM campusos_finance.refund_requests
    WHERE tenant_id = ${context.tenantId}::uuid
      AND payment_id = ${payment.id}::uuid
      AND status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED')
  `;
  const alreadyRefundedMinor = dbNumber(refundedRows[0]?.refunded_minor ?? 0);
  const refundableMinor = nonNegativeMinor(toMinor(payment.amount) - alreadyRefundedMinor);
  if (input.requestedMinor > refundableMinor) {
    throw new FinanceError('Refund cannot exceed the remaining refundable paid balance for this payment.', 422);
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_finance.refund_requests
      (id, tenant_id, student_id, payment_id, invoice_id, requested_minor, currency, status,
       reason, requested_by, requested_role, created_at, updated_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${payment.invoice.studentId}::uuid, ${payment.id}::uuid,
       ${payment.invoiceId}::uuid, ${input.requestedMinor}, 'INR', 'REQUESTED', ${reason},
       ${context.userId}::uuid, ${context.activeRole}, now(), now())
  `;
  await writeFinanceAudit(context, 'REFUND_REQUESTED', 'refund_requests', id, null, { requestedMinor: input.requestedMinor, reason }, reason);

  return {
    id,
    paymentId: payment.id,
    invoiceId: payment.invoiceId,
    requestedMinor: input.requestedMinor,
    approvedMinor: null,
    status: 'REQUESTED',
    reason,
    requestedRole: context.activeRole,
    reviewNote: null,
    completionReference: null,
    createdAt: new Date().toISOString(),
  };
}

export async function listRefundsForTenant(context: ActiveUserContext, scope: 'pending' | 'all' = 'pending'): Promise<RefundView[]> {
  if (scope === 'pending') {
    assertFinancePermission(isFinanceOperator(context), 'finance:operations');
  }
  const studentIds = isFinanceOperator(context) ? null : await authorizedStudentIds(context);

  try {
    const rows = await prisma.$queryRaw<RefundRow[]>`
      SELECT id, payment_id, invoice_id, requested_minor, approved_minor, status, reason,
             requested_role, review_note, completion_reference, created_at
      FROM campusos_finance.refund_requests
      WHERE tenant_id = ${context.tenantId}::uuid
        ${studentIds ? Prisma.sql`AND student_id IN (${Prisma.join(studentIds.map((id) => Prisma.sql`${id}::uuid`))})` : Prisma.empty}
        ${scope === 'pending' ? Prisma.sql`AND status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING')` : Prisma.empty}
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return rows.map(mapRefundRow);
  } catch {
    return [];
  }
}

function mapRefundRow(row: RefundRow): RefundView {
  return {
    id: row.id,
    paymentId: row.payment_id,
    invoiceId: row.invoice_id,
    requestedMinor: dbNumber(row.requested_minor),
    approvedMinor: row.approved_minor == null ? null : dbNumber(row.approved_minor),
    status: row.status as RefundStatus,
    reason: row.reason,
    requestedRole: row.requested_role,
    reviewNote: row.review_note,
    completionReference: row.completion_reference,
    createdAt: row.created_at.toISOString(),
  };
}

export async function reviewRefund(
  context: ActiveUserContext,
  refundId: string,
  action: 'APPROVE' | 'REJECT' | 'PROCESS' | 'COMPLETE' | 'CANCEL',
  note?: string,
): Promise<RefundView> {
  assertFinancePermission(isFinanceOperator(context), 'finance:operations');

  const rows = await prisma.$queryRaw<
    Array<
      RefundRow & {
        student_id: string;
        tenant_id: string;
        requested_by: string;
        reviewer_user_id: string | null;
        reviewed_at: Date | null;
        completed_at: Date | null;
      }
    >
  >`
    SELECT id, payment_id, invoice_id, requested_minor, approved_minor, status, reason,
           requested_role, review_note, completion_reference, created_at, student_id, tenant_id,
           requested_by, reviewer_user_id, reviewed_at, completed_at
    FROM campusos_finance.refund_requests
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${refundId}::uuid
    LIMIT 1
  `;
  const refund = rows[0];
  if (!refund) throw new FinanceError('Refund request not found.', 404);

  const settings = await getFinanceSettings(context.tenantId);
  const highValue = settings.refundHighValueMinor > 0 && dbNumber(refund.requested_minor) >= settings.refundHighValueMinor;
  const requiresChecker = settings.refundRequiresMakerChecker || highValue;
  const requestedByUserId = refund.requested_by ?? context.userId;

  if (requiresChecker && ['APPROVE', 'REJECT', 'PROCESS'].includes(action) && !makerCheckerSeparated(context, requestedByUserId)) {
    throw new FinanceError('Maker-checker separation is required for this refund: the request creator cannot decide it.', 403);
  }
  assertFinancePermission(isFinanceApprover(context), 'finance:approve');

  let nextStatus = refund.status;
  if (action === 'APPROVE') nextStatus = 'APPROVED';
  else if (action === 'REJECT') nextStatus = 'REJECTED';
  else if (action === 'PROCESS') nextStatus = 'PROCESSING';
  else if (action === 'COMPLETE') nextStatus = 'COMPLETED';
  else if (action === 'CANCEL') nextStatus = 'CANCELLED';

  let completionReference: string | null = null;
  await prisma.$transaction(async (tx) => {
    if (action === 'COMPLETE') {
      const locked = await tx.$queryRaw<Array<{ requested_minor: bigint | number | string; approved_minor: bigint | number | string | null }>>`
        SELECT requested_minor, approved_minor
        FROM campusos_finance.refund_requests
        WHERE id = ${refundId}::uuid
        FOR UPDATE
      `;
      if (!locked[0]) throw new FinanceError('Refund request not found.', 404);
      const effectiveMinor = locked[0].approved_minor != null ? dbNumber(locked[0].approved_minor) : dbNumber(locked[0].requested_minor);
      const payment = await tx.payment.findUnique({
        where: { id: refund.payment_id },
        select: { amount: true, invoiceId: true },
      });
      if (!payment) throw new FinanceError('Original payment not found.', 404);

      const refundedRows = await tx.$queryRaw<RefundedRow[]>`
        SELECT COALESCE(SUM(approved_minor), 0) AS refunded_minor
        FROM campusos_finance.refund_requests
        WHERE tenant_id = ${context.tenantId}::uuid
          AND payment_id = ${refund.payment_id}::uuid
          AND status = 'COMPLETED'
      `;
      const completedMinor = dbNumber(refundedRows[0]?.refunded_minor ?? 0);
      if (completedMinor + effectiveMinor > toMinor(payment.amount) + 1) {
        throw new FinanceError('Refund completion would exceed the refundable paid balance.', 422);
      }

      completionReference = `REFUND-${randomUUID().slice(0, 12).toUpperCase()}`;
      await tx.refund.create({
        data: {
          paymentId: refund.payment_id,
          amount: fromMinor(effectiveMinor),
          reason: refund.reason,
        },
      });
      await tx.$executeRaw`
        INSERT INTO campusos_finance.ledger_entries
          (id, tenant_id, student_id, entry_type, debit_minor, credit_minor, currency,
           payment_id, refund_id, reference, reason, actor_user_id, actor_role, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${refund.student_id}::uuid, 'REFUND',
           ${effectiveMinor}, 0, 'INR', ${refund.payment_id}::uuid, ${refund.id}::uuid,
           ${completionReference}, ${refund.reason}, ${context.userId}::uuid, ${context.activeRole}, now())
      `;
    }

    await tx.$executeRaw`
      UPDATE campusos_finance.refund_requests
      SET status = ${nextStatus},
          approved_minor = ${action === 'APPROVE' ? dbNumber(refund.requested_minor) : refund.approved_minor},
          reviewer_user_id = ${['APPROVE', 'REJECT', 'PROCESS', 'COMPLETE'].includes(action) ? context.userId : refund.reviewer_user_id}::uuid,
          review_note = ${note?.trim() ?? refund.review_note},
          reviewed_at = ${['APPROVE', 'REJECT', 'PROCESS', 'COMPLETE'].includes(action) ? new Date() : refund.reviewed_at},
          completion_reference = ${completionReference ?? refund.completion_reference},
          completed_at = ${action === 'COMPLETE' ? new Date() : refund.completed_at},
          updated_at = now()
      WHERE id = ${refundId}::uuid
    `;
  });

  await writeFinanceAudit(context, `REFUND_${action}`, 'refund_requests', refundId, { status: refund.status }, { status: nextStatus }, note?.trim() || null);

  return {
    id: refund.id,
    paymentId: refund.payment_id,
    invoiceId: refund.invoice_id,
    requestedMinor: dbNumber(refund.requested_minor),
    approvedMinor:
      action === 'APPROVE'
        ? dbNumber(refund.requested_minor)
        : refund.approved_minor == null
          ? null
          : dbNumber(refund.approved_minor),
    status: nextStatus as RefundStatus,
    reason: refund.reason,
    requestedRole: refund.requested_role,
    reviewNote: note?.trim() ?? refund.review_note,
    completionReference,
    createdAt: refund.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Scholarship programs
// ---------------------------------------------------------------------------
export async function listScholarshipPrograms(tenantId: string): Promise<ScholarshipProgramView[]> {
  try {
    const rows = await prisma.$queryRaw<ProgramRow[]>`
      SELECT id, name, provider, value_type, fixed_amount_minor, percentage, cap_minor,
             budget_minor, awarded_minor, program_ids, status, application_opens,
             application_closes, applies_to_components, stacking_allowed
      FROM campusos_finance.scholarship_programs
      WHERE tenant_id = ${tenantId}::uuid
      ORDER BY created_at DESC
      LIMIT 200
    `;
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      provider: row.provider,
      valueType: row.value_type,
      fixedAmountMinor: dbNumber(row.fixed_amount_minor),
      percentage: dbPercent(row.percentage),
      capMinor: dbNumber(row.cap_minor),
      budgetMinor: dbNumber(row.budget_minor),
      awardedMinor: dbNumber(row.awarded_minor),
      programIds: parseStringArray(row.program_ids),
      status: row.status,
      applicationOpens: row.application_opens ? row.application_opens.toISOString().slice(0, 10) : null,
      applicationCloses: row.application_closes ? row.application_closes.toISOString().slice(0, 10) : null,
      appliesToComponents: parseStringArray(row.applies_to_components),
      stackingAllowed: parseBooleanRow(row.stacking_allowed),
    }));
  } catch {
    return [];
  }
}

export async function createScholarshipProgram(
  context: ActiveUserContext,
  input: {
    name: string;
    provider?: string;
    valueType: string;
    fixedAmountMinor?: number;
    percentage?: number;
    capMinor?: number;
    budgetMinor?: number;
    programIds?: string[];
    status?: string;
    applicationOpens?: string;
    applicationCloses?: string;
    appliesToComponents?: string[];
    stackingAllowed?: boolean;
  },
): Promise<ScholarshipProgramView> {
  assertFinancePermission(isFinanceConfigurator(context), 'finance:configure');
  const name = input.name.trim();
  if (!name) throw new FinanceError('Scholarship name is required.', 400);
  if (!['FIXED', 'PERCENTAGE', 'FULL_TUITION', 'PARTIAL_TUITION', 'COMPONENT', 'CAPPED'].includes(input.valueType)) {
    throw new FinanceError('Invalid scholarship value type.', 400);
  }
  const budgetMinor = Number.isInteger(input.budgetMinor) && (input.budgetMinor ?? 0) >= 0 ? (input.budgetMinor ?? 0) : 0;

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_finance.scholarship_programs
      (id, tenant_id, name, provider, value_type, fixed_amount_minor, percentage, cap_minor,
       budget_minor, program_ids, status, application_opens, application_closes,
       applies_to_components, stacking_allowed, created_by, created_at, updated_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${name}, ${input.provider?.trim() || null},
       ${input.valueType}, ${input.fixedAmountMinor ?? 0}, ${input.percentage ?? 0}, ${input.capMinor ?? 0},
       ${budgetMinor}, CAST(${JSON.stringify(normalizeProgramIds(input.programIds))} AS jsonb),
       ${input.status && ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'].includes(input.status) ? input.status : 'DRAFT'},
       ${input.applicationOpens ? new Date(input.applicationOpens) : null}::date,
       ${input.applicationCloses ? new Date(input.applicationCloses) : null}::date,
       CAST(${JSON.stringify(input.appliesToComponents ?? ['TUITION'])} AS jsonb),
       ${input.stackingAllowed ?? false}, ${context.userId}::uuid, now(), now())
  `;
  await writeFinanceAudit(context, 'SCHOLARSHIP_PROGRAM_CREATED', 'scholarship_programs', id, null, { name, budgetMinor });

  return {
    id,
    name,
    provider: input.provider?.trim() || null,
    valueType: input.valueType,
    fixedAmountMinor: input.fixedAmountMinor ?? 0,
    percentage: input.percentage ?? 0,
    capMinor: input.capMinor ?? 0,
    budgetMinor,
    awardedMinor: 0,
    programIds: normalizeProgramIds(input.programIds),
    status: input.status && ['DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED'].includes(input.status) ? input.status : 'DRAFT',
    applicationOpens: input.applicationOpens ?? null,
    applicationCloses: input.applicationCloses ?? null,
    appliesToComponents: input.appliesToComponents ?? ['TUITION'],
    stackingAllowed: input.stackingAllowed ?? false,
  };
}

// ---------------------------------------------------------------------------
// Scholarship applications
// ---------------------------------------------------------------------------
async function authorizedStudentIds(context: ActiveUserContext): Promise<string[]> {
  if (context.activeRole === 'STUDENT') {
    if (!context.studentProfileId) throw new FinanceError('No student profile is available for this account.', 403);
    return [context.studentProfileId];
  }
  if (context.activeRole === 'PARENT') {
    const guardian = await prisma.guardian.findFirst({
      where: { tenantId: context.tenantId, userId: context.userId },
      select: { students: { select: { id: true } } },
    });
    const ids = guardian?.students.map((student) => student.id) ?? [];
    if (ids.length === 0) throw new FinanceError('No linked student is available for this account.', 403);
    return ids;
  }
  if (isFinanceOperator(context)) {
    // Finance operators act institution-wide; individual-student reads require explicit ids.
    return [];
  }
  throw new FinanceError('This account is not allowed to access student finance records.', 403);
}

export async function applyForScholarship(
  context: ActiveUserContext,
  input: { programId: string; statement?: string; documentRefs?: string[] },
): Promise<ScholarshipApplicationView> {
  const studentIds = await authorizedStudentIds(context);
  const studentId = studentIds[0];
  if (studentIds.length > 1) throw new FinanceError('Select a ward before applying for a scholarship.', 400);

  const programs = await prisma.$queryRaw<ProgramRow[]>`
    SELECT id, name, provider, value_type, fixed_amount_minor, percentage, cap_minor,
           budget_minor, awarded_minor, program_ids, status, application_opens,
           application_closes, applies_to_components, stacking_allowed
    FROM campusos_finance.scholarship_programs
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.programId}::uuid
    LIMIT 1
  `;
  const program = programs[0];
  if (!program) throw new FinanceError('Scholarship program not found.', 404);
  if (program.status !== 'OPEN') throw new FinanceError('This scholarship program is not currently open for applications.', 409);
  if (program.application_closes && new Date(program.application_closes) < new Date()) {
    throw new FinanceError('The application window for this scholarship has closed.', 409);
  }
  const programIds = parseStringArray(program.program_ids);
  if (programIds.length > 0) {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { batch: { select: { programId: true } } },
    });
    if (student && !programIds.includes(student.batch.programId)) {
      throw new FinanceError('This scholarship is not available for your program.', 403);
    }
  }

  const statement = input.statement?.trim() ?? null;
  const id = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_finance.scholarship_applications
        (id, tenant_id, program_id, student_id, status, statement, document_refs, applied_by, created_at, updated_at)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${input.programId}::uuid, ${studentId}::uuid,
         'SUBMITTED', ${statement}, CAST(${JSON.stringify(input.documentRefs ?? [])} AS jsonb),
         ${context.userId}::uuid, now(), now())
    `;
  } catch (error) {
    throw new FinanceError('You have already applied for this scholarship.', 409);
  }
  await writeFinanceAudit(context, 'SCHOLARSHIP_APPLICATION_SUBMITTED', 'scholarship_applications', id, null, { programId: input.programId }, statement ?? undefined);

  return {
    id,
    programId: input.programId,
    programName: program.name,
    studentId,
    studentName: '',
    rollNumber: '',
    status: 'SUBMITTED',
    statement,
    documentRefs: input.documentRefs ?? [],
    createdAt: new Date().toISOString(),
  };
}

export async function listScholarshipApplications(context: ActiveUserContext): Promise<ScholarshipApplicationView[]> {
  const studentIds = isFinanceOperator(context) ? null : await authorizedStudentIds(context);
  try {
    const rows = await prisma.$queryRaw<ApplicationRow[]>`
      SELECT application.id, application.program_id, program.name AS program_name,
             application.student_id, student_user.name AS student_name, student.roll_number,
             application.status, application.statement, application.document_refs, application.created_at
      FROM campusos_finance.scholarship_applications application
      JOIN campusos_finance.scholarship_programs program ON program.id = application.program_id
      JOIN public.students student ON student.id = application.student_id
      JOIN public.users student_user ON student_user.id = student.user_id
      WHERE application.tenant_id = ${context.tenantId}::uuid
        ${studentIds ? Prisma.sql`AND application.student_id IN (${Prisma.join(studentIds.map((id) => Prisma.sql`${id}::uuid`))})` : Prisma.empty}
      ORDER BY application.created_at DESC
      LIMIT 100
    `;
    return rows.map((row) => ({
      id: row.id,
      programId: row.program_id,
      programName: row.program_name,
      studentId: row.student_id,
      studentName: row.student_name,
      rollNumber: row.roll_number,
      status: row.status as ScholarshipApplicationStatus,
      statement: row.statement,
      documentRefs: parseStringArray(row.document_refs),
      createdAt: row.created_at.toISOString(),
    }));
  } catch {
    return [];
  }
}

export async function reviewScholarshipApplication(
  context: ActiveUserContext,
  applicationId: string,
  action: 'SHORTLIST' | 'APPROVE' | 'REJECT' | 'WAITLIST',
  note?: string,
): Promise<ScholarshipApplicationView> {
  assertFinancePermission(canReviewScholarships(context), 'finance:scholarship-review');
  const rows = await prisma.$queryRaw<Array<ApplicationRow & { tenant_id: string }>>`
    SELECT application.id, application.program_id, program.name AS program_name,
           application.student_id, student_user.name AS student_name, student.roll_number,
           application.status, application.statement, application.document_refs, application.created_at,
           application.tenant_id
    FROM campusos_finance.scholarship_applications application
    JOIN campusos_finance.scholarship_programs program ON program.id = application.program_id
    JOIN public.students student ON student.id = application.student_id
    JOIN public.users student_user ON student_user.id = student.user_id
    WHERE application.tenant_id = ${context.tenantId}::uuid AND application.id = ${applicationId}::uuid
    LIMIT 1
  `;
  const application = rows[0];
  if (!application) throw new FinanceError('Scholarship application not found.', 404);

  let nextStatus: ScholarshipApplicationStatus;
  if (action === 'SHORTLIST') nextStatus = 'SHORTLISTED';
  else if (action === 'APPROVE') nextStatus = 'APPROVED';
  else if (action === 'REJECT') nextStatus = 'REJECTED';
  else nextStatus = 'WAITLISTED';

  await prisma.$executeRaw`
    UPDATE campusos_finance.scholarship_applications
    SET status = ${nextStatus}, reviewer_user_id = ${context.userId}::uuid,
        reviewer_note = ${note?.trim() ?? null}, reviewed_at = now(), updated_at = now()
    WHERE id = ${applicationId}::uuid AND tenant_id = ${context.tenantId}::uuid
  `;
  await writeFinanceAudit(context, `SCHOLARSHIP_APPLICATION_${action}`, 'scholarship_applications', applicationId, { status: application.status }, { status: nextStatus }, note?.trim() || null);

  return {
    id: application.id,
    programId: application.program_id,
    programName: application.program_name,
    studentId: application.student_id,
    studentName: application.student_name,
    rollNumber: application.roll_number,
    status: nextStatus,
    statement: application.statement,
    documentRefs: parseStringArray(application.document_refs),
    createdAt: application.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Scholarship awards (budget + scope enforced, ledger credit created)
// ---------------------------------------------------------------------------
type AwardTargetRow = {
  student_id: string;
  student_name: string;
  roll_number: string;
  gross_eligible_minor: bigint | number | string;
};

export async function awardScholarship(
  context: ActiveUserContext,
  input: {
    programId: string;
    studentId: string;
    awardedMinor: number;
    applicationId?: string;
    note?: string;
  },
): Promise<{ id: string; awardedMinor: number; ledgerCreditCreated: boolean }> {
  assertFinancePermission(canAwardScholarships(context), 'finance:scholarship-award');
  if (!Number.isInteger(input.awardedMinor) || input.awardedMinor <= 0) {
    throw new FinanceError('Award amount must be a positive whole minor-unit value.', 400);
  }

  return prisma.$transaction(async (tx) => {
    const programs = await tx.$queryRaw<ProgramRow[]>`
      SELECT id, name, provider, value_type, fixed_amount_minor, percentage, cap_minor,
             budget_minor, awarded_minor, program_ids, status, application_opens,
             application_closes, applies_to_components, stacking_allowed
      FROM campusos_finance.scholarship_programs
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.programId}::uuid
      FOR UPDATE
    `;
    const program = programs[0];
    if (!program) throw new FinanceError('Scholarship program not found.', 404);

    const remainingBudget = dbNumber(program.budget_minor) - dbNumber(program.awarded_minor);
    if (input.awardedMinor > remainingBudget) {
      throw new FinanceError('This award exceeds the remaining scholarship budget.', 422);
    }

    const student = await tx.student.findUnique({
      where: { id: input.studentId },
      select: { tenantId: true },
    });
    if (!student || student.tenantId !== context.tenantId) {
      throw new FinanceError('The target student is not part of this institution.', 403);
    }

    const programIds = parseStringArray(program.program_ids);
    if (programIds.length > 0) {
      const batch = await tx.student.findUnique({
        where: { id: input.studentId },
        select: { batch: { select: { programId: true } } },
      });
      if (batch && !programIds.includes(batch.batch.programId)) {
        throw new FinanceError('This scholarship does not cover the student program.', 403);
      }
    }

    // Component scope check: compute against actual eligible invoices.
    const invoices = await tx.invoice.findMany({
      where: { tenantId: context.tenantId, studentId: input.studentId, status: { in: ['PENDING', 'PARTIAL'] } },
      select: { id: true, amount: true },
      orderBy: { dueDate: 'asc' },
    });
    const grossEligibleMinor = sumMinor(invoices.map((invoice) => toMinor(invoice.amount)));
    if (input.awardedMinor > grossEligibleMinor) {
      throw new FinanceError('Award exceeds the student gross eligible fees.', 422);
    }

    const id = randomUUID();
    await tx.$executeRaw`
      INSERT INTO campusos_finance.scholarship_awards
        (id, tenant_id, program_id, application_id, student_id, gross_eligible_minor, awarded_minor,
         currency, applies_to_components, applied_invoice_ids, status, approved_by, approved_role, approved_at, note)
      VALUES
        (${id}::uuid, ${context.tenantId}::uuid, ${input.programId}::uuid, ${input.applicationId || null}::uuid,
         ${input.studentId}::uuid, ${grossEligibleMinor}, ${input.awardedMinor}, 'INR',
         CAST(${JSON.stringify(parseStringArray(program.applies_to_components))} AS jsonb),
         CAST(${JSON.stringify(invoices.map((invoice) => invoice.id))} AS jsonb),
         'APPROVED', ${context.userId}::uuid, ${context.activeRole}, now(), ${input.note?.trim() || null})
    `;

    await tx.$executeRaw`
      UPDATE campusos_finance.scholarship_programs
      SET awarded_minor = awarded_minor + ${input.awardedMinor}, updated_at = now()
      WHERE id = ${input.programId}::uuid
    `;

    // Ledger credit.
    await tx.$executeRaw`
      INSERT INTO campusos_finance.ledger_entries
        (id, tenant_id, student_id, entry_type, debit_minor, credit_minor, currency,
         award_id, reference, reason, actor_user_id, actor_role, created_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${input.studentId}::uuid, 'SCHOLARSHIP_CREDIT',
         0, ${input.awardedMinor}, 'INR', ${id}::uuid, ${program.name},
         ${input.note?.trim() || `Scholarship award · ${program.name}`}, ${context.userId}::uuid,
         ${context.activeRole}, now())
    `;

    await writeFinanceAudit(context, 'SCHOLARSHIP_AWARDED', 'scholarship_awards', id, null, { programId: input.programId, awardedMinor: input.awardedMinor }, input.note?.trim() || null);
    return { id, awardedMinor: input.awardedMinor, ledgerCreditCreated: true };
  }, { timeout: 20_000 });
}

// ---------------------------------------------------------------------------
// Financial holds
// ---------------------------------------------------------------------------
export async function placeFinancialHold(
  context: ActiveUserContext,
  input: { studentId: string; reason: string; amountMinor?: number; impactScope?: string[] },
): Promise<FinancialHoldView> {
  assertFinancePermission(canManageFinancialHolds(context), 'finance:hold');
  const reason = input.reason.trim();
  if (reason.length < 5 || reason.length > 2000) throw new FinanceError('Provide a reason between 5 and 2000 characters.', 400);

  const student = await prisma.student.findUnique({
    where: { id: input.studentId },
    select: { tenantId: true, rollNumber: true, user: { select: { name: true } } },
  });
  if (!student || student.tenantId !== context.tenantId) {
    throw new FinanceError('The target student is not part of this institution.', 403);
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_finance.financial_holds
      (id, tenant_id, student_id, reason, amount_minor, impact_scope, status, created_by, created_at)
    VALUES
      (${id}::uuid, ${context.tenantId}::uuid, ${input.studentId}::uuid, ${reason},
       ${input.amountMinor ?? 0}, CAST(${JSON.stringify(input.impactScope ?? ['EXAM_REGISTRATION', 'DOCUMENT_ISSUANCE', 'REGISTRATION'])} AS jsonb),
       'ACTIVE', ${context.userId}::uuid, now())
  `;
  await writeFinanceAudit(context, 'FINANCIAL_HOLD_CREATED', 'financial_holds', id, null, { studentId: input.studentId, reason }, reason);

  return {
    id,
    studentId: input.studentId,
    studentName: student.user.name,
    rollNumber: student.rollNumber,
    reason,
    amountMinor: input.amountMinor ?? 0,
    impactScope: input.impactScope ?? ['EXAM_REGISTRATION', 'DOCUMENT_ISSUANCE', 'REGISTRATION'],
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };
}

export async function resolveFinancialHold(context: ActiveUserContext, holdId: string, note?: string): Promise<FinancialHoldView> {
  assertFinancePermission(canManageFinancialHolds(context), 'finance:hold');
  const rows = await prisma.$queryRaw<HoldRow[]>`
    SELECT id, student_id, reason, amount_minor, impact_scope, status, created_at
    FROM campusos_finance.financial_holds
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${holdId}::uuid
    LIMIT 1
  `;
  const hold = rows[0];
  if (!hold) throw new FinanceError('Financial hold not found.', 404);
  if (hold.status !== 'ACTIVE') throw new FinanceError('This hold is already resolved.', 409);

  await prisma.$executeRaw`
    UPDATE campusos_finance.financial_holds
    SET status = 'RESOLVED', resolved_by = ${context.userId}::uuid,
        resolution_note = ${note?.trim() ?? null}, resolved_at = now()
    WHERE id = ${holdId}::uuid AND tenant_id = ${context.tenantId}::uuid
  `;
  await writeFinanceAudit(context, 'FINANCIAL_HOLD_RESOLVED', 'financial_holds', holdId, { status: 'ACTIVE' }, { status: 'RESOLVED' }, note?.trim() || null);

  return {
    id: hold.id,
    studentId: hold.student_id,
    studentName: '',
    rollNumber: '',
    reason: hold.reason,
    amountMinor: dbNumber(hold.amount_minor),
    impactScope: parseStringArray(hold.impact_scope),
    status: 'RESOLVED',
    createdAt: hold.created_at.toISOString(),
  };
}

export async function listFinancialHolds(context: ActiveUserContext, activeOnly = true): Promise<FinancialHoldView[]> {
  assertFinancePermission(canManageFinancialHolds(context), 'finance:hold');
  try {
    const rows = await prisma.$queryRaw<HoldRow[]>`
      SELECT hold.id, hold.student_id, student_user.name AS student_name, student.roll_number,
             hold.reason, hold.amount_minor, hold.impact_scope, hold.status, hold.created_at
      FROM campusos_finance.financial_holds hold
      JOIN public.students student ON student.id = hold.student_id
      JOIN public.users student_user ON student_user.id = student.user_id
      WHERE hold.tenant_id = ${context.tenantId}::uuid
        ${activeOnly ? Prisma.sql`AND hold.status = 'ACTIVE'` : Prisma.empty}
      ORDER BY hold.created_at DESC
      LIMIT 100
    `;
    return rows.map((row) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      rollNumber: row.roll_number,
      reason: row.reason,
      amountMinor: dbNumber(row.amount_minor),
      impactScope: parseStringArray(row.impact_scope),
      status: row.status === 'RESOLVED' ? 'RESOLVED' : 'ACTIVE',
      createdAt: row.created_at.toISOString(),
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Student / parent finance workspace
// ---------------------------------------------------------------------------
async function studentInvoiceRows(context: ActiveUserContext, studentIds: string[]) {
  const db = getTenantDb(context.tenantId);
  return db.invoice.findMany({
    where: { studentId: { in: studentIds } },
    orderBy: { dueDate: 'asc' },
    select: {
      id: true,
      amount: true,
      dueDate: true,
      status: true,
      feeStructure: { select: { name: true } },
      student: { select: { id: true, rollNumber: true, user: { select: { name: true } } } },
      payments: { where: { status: 'PAID' }, select: { amount: true } },
    },
  });
}

async function ledgerForStudents(tenantId: string, studentIds: string[]) {
  try {
    const rows = await prisma.$queryRaw<LedgerRow[]>(Prisma.sql`
      SELECT id, entry_type, debit_minor, credit_minor, reference, reason, actor_role, created_at
      FROM campusos_finance.ledger_entries
      WHERE tenant_id = ${tenantId}::uuid
        AND student_id IN (${Prisma.join(studentIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY created_at DESC
      LIMIT 200
    `);
    return rows.map((row): LedgerEntryView => ({
      id: row.id,
      entryType: row.entry_type,
      debitMinor: dbNumber(row.debit_minor),
      creditMinor: dbNumber(row.credit_minor),
      reference: row.reference,
      reason: row.reason,
      actorRole: row.actor_role,
      createdAt: row.created_at.toISOString(),
    }));
  } catch {
    return [];
  }
}

async function installmentsForInvoices(tenantId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, Array<{ number: number; amountMinor: number; paidMinor: number; dueDate: string; status: string }>>();
  try {
    const rows = await prisma.$queryRaw<Array<{ invoice_id: string; installment_number: number; amount_minor: bigint | number | string; paid_minor: bigint | number | string; due_date: Date; status: string }>>(Prisma.sql`
      SELECT invoice_id, installment_number, amount_minor, paid_minor, due_date, status
      FROM campusos_finance.installments
      WHERE tenant_id = ${tenantId}::uuid
        AND invoice_id IN (${Prisma.join(invoiceIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY installment_number ASC
    `);
    const map = new Map<string, Array<{ number: number; amountMinor: number; paidMinor: number; dueDate: string; status: string }>>();
    for (const row of rows) {
      const existing = map.get(row.invoice_id) ?? [];
      existing.push({
        number: row.installment_number,
        amountMinor: dbNumber(row.amount_minor),
        paidMinor: dbNumber(row.paid_minor),
        dueDate: row.due_date.toISOString().slice(0, 10),
        status: row.status,
      });
      map.set(row.invoice_id, existing);
    }
    return map;
  } catch {
    return new Map();
  }
}

async function invoiceNumbersFor(tenantId: string, invoiceIds: string[]) {
  if (invoiceIds.length === 0) return new Map<string, string>();
  try {
    const rows = await prisma.$queryRaw<Array<{ invoice_id: string; invoice_number: string }>>(Prisma.sql`
      SELECT invoice_id, invoice_number
      FROM campusos_finance.invoice_registry
      WHERE tenant_id = ${tenantId}::uuid
        AND invoice_id IN (${Prisma.join(invoiceIds.map((id) => Prisma.sql`${id}::uuid`))})
    `);
    return new Map(rows.map((row) => [row.invoice_id, row.invoice_number]));
  } catch {
    return new Map();
  }
}

async function receiptsForStudent(tenantId: string, studentIds: string[]) {
  try {
    const rows = await prisma.$queryRaw<Array<{ payment_id: string; receipt_number: string; verify_reference: string; amount_minor: bigint | number | string; currency: string; payment_method: string; issued_at: Date }>>(Prisma.sql`
      SELECT registry.payment_id, registry.receipt_number, registry.verify_reference,
             registry.amount_minor, registry.currency, registry.payment_method, registry.issued_at
      FROM campusos_finance.receipt_registry registry
      JOIN public.payments payment ON payment.id = registry.payment_id
      JOIN public.invoices invoice ON invoice.id = payment.invoice_id
      WHERE registry.tenant_id = ${tenantId}::uuid
        AND invoice.student_id IN (${Prisma.join(studentIds.map((id) => Prisma.sql`${id}::uuid`))})
      ORDER BY registry.issued_at DESC
      LIMIT 60
    `);
    return rows.map((row) => ({
      id: row.payment_id,
      receiptNumber: row.receipt_number,
      verifyReference: row.verify_reference,
      amountMinor: dbNumber(row.amount_minor),
      currency: row.currency,
      paymentMethod: row.payment_method,
      issuedAt: row.issued_at.toISOString(),
    }));
  } catch {
    return [];
  }
}

function displayInvoiceStatus(status: string, outstandingMinor: MoneyMinor, dueDate: Date): FinanceInvoiceView['status'] {
  if (status === 'CANCELLED') return 'CANCELLED';
  if (status === 'VOID') return 'VOID';
  if (outstandingMinor <= 1) return 'PAID';
  if (status === 'PARTIAL') return 'PARTIALLY_PAID';
  if (dueDate.getTime() < Date.now()) return 'OVERDUE';
  return 'ISSUED';
}

async function scholarshipCreditsForStudent(tenantId: string, studentId: string): Promise<MoneyMinor> {
  try {
    const rows = await prisma.$queryRaw<Array<{ total_minor: bigint | number | string }>>`
      SELECT COALESCE(SUM(credit_minor), 0) AS total_minor
      FROM campusos_finance.ledger_entries
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid
        AND entry_type IN ('SCHOLARSHIP_CREDIT', 'CREDIT_NOTE', 'CONCESSION', 'WAIVER')
    `;
    return dbNumber(rows[0]?.total_minor ?? 0);
  } catch {
    return 0;
  }
}

async function activeHoldForStudent(tenantId: string, studentId: string): Promise<boolean> {
  try {
    const rows = await prisma.$queryRaw<Array<{ count: bigint | number | string }>>`
      SELECT COUNT(*) AS count
      FROM campusos_finance.financial_holds
      WHERE tenant_id = ${tenantId}::uuid AND student_id = ${studentId}::uuid AND status = 'ACTIVE'
    `;
    return dbNumber(rows[0]?.count ?? 0) > 0;
  } catch {
    return false;
  }
}

export async function getStudentFinanceWorkspace(context: ActiveUserContext): Promise<StudentFinanceWorkspace> {
  const studentIds = await authorizedStudentIds(context);
  const settings = await getFinanceSettings(context.tenantId);
  const [institution, invoices, ledger, refunds, scholarshipPrograms, applications, receipts, holdsActive] = await Promise.all([
    prisma.institution.findUnique({
      where: { id: context.tenantId },
      select: { id: true, name: true, subdomain: true },
    }),
    studentInvoiceRows(context, studentIds),
    ledgerForStudents(context.tenantId, studentIds),
    listRefundsForTenant(context, 'all'),
    listScholarshipPrograms(context.tenantId),
    listScholarshipApplications(context),
    receiptsForStudent(context.tenantId, studentIds),
    activeHoldForStudent(context.tenantId, studentIds[0]),
  ]);

  const invoiceIds = invoices.map((invoice) => invoice.id);
  const [installmentMap, numberMap] = await Promise.all([
    installmentsForInvoices(context.tenantId, invoiceIds),
    invoiceNumbersFor(context.tenantId, invoiceIds),
  ]);

  let totalOutstandingMinor = 0;
  let overdueMinor = 0;
  let paidMinor = 0;
  let scholarshipAwardedMinor = 0;
  let nextDueDate: string | null = null;

  const studentRow = invoices[0]?.student ?? null;
  const student = studentRow
    ? { id: studentRow.id, name: studentRow.user.name, rollNumber: studentRow.rollNumber }
    : null;
  const totalScholarshipMinor = student ? await scholarshipCreditsForStudent(context.tenantId, student.id) : 0;
  // Attribute scholarship/concession credits to the oldest due invoices first (FIFO)
  // so a single award is never counted against every invoice at once.
  let remainingCreditMinor = totalScholarshipMinor;
  const invoiceViews: FinanceInvoiceView[] = [];
  for (const invoice of invoices) {
    const grossMinor = toMinor(invoice.amount);
    const paidInvoiceMinor = sumMinor(invoice.payments.map((payment) => toMinor(payment.amount)));
    const scholarshipMinor = Math.min(remainingCreditMinor, nonNegativeMinor(grossMinor - paidInvoiceMinor));
    remainingCreditMinor -= scholarshipMinor;
    const outstandingMinor = nonNegativeMinor(grossMinor - paidInvoiceMinor - scholarshipMinor);
    const status = displayInvoiceStatus(invoice.status, outstandingMinor, invoice.dueDate);

    totalOutstandingMinor = addMinor(totalOutstandingMinor, outstandingMinor);
    paidMinor = addMinor(paidMinor, paidInvoiceMinor);
    scholarshipAwardedMinor = addMinor(scholarshipAwardedMinor, scholarshipMinor);
    if (status === 'OVERDUE') overdueMinor = addMinor(overdueMinor, outstandingMinor);
    if (outstandingMinor > 0 && (!nextDueDate || invoice.dueDate < new Date(nextDueDate))) {
      nextDueDate = invoice.dueDate.toISOString();
    }

    invoiceViews.push({
      id: invoice.id,
      invoiceNumber: numberMap.get(invoice.id) ?? `INV-${invoice.id.slice(0, 8).toUpperCase()}`,
      studentId: invoice.student.id,
      studentName: invoice.student.user.name,
      rollNumber: invoice.student.rollNumber,
      description: invoice.feeStructure.name,
      categoryCode: null,
      grossMinor,
      scholarshipMinor,
      creditsMinor: scholarshipMinor,
      lateFeeMinor: 0,
      paidMinor: paidInvoiceMinor,
      outstandingMinor,
      dueDate: invoice.dueDate.toISOString(),
      status,
      installments: installmentMap.get(invoice.id) ?? [],
    });
  }

  const clearance: FinanceClearanceStatus = holdsActive
    ? 'HOLD'
    : overdueMinor > 0
      ? 'OVERDUE'
      : totalOutstandingMinor > 0
        ? 'PARTIALLY_DUE'
        : 'CLEAR';

  return {
    role: context.activeRole,
    institution,
    student,
    settings,
    clearance,
    summary: {
      totalOutstandingMinor,
      overdueMinor,
      nextDueDate,
      paidMinor,
      scholarshipAwardedMinor,
    },
    invoices: invoiceViews,
    ledger,
    refunds,
    scholarships: {
      programs: scholarshipPrograms,
      applications,
    },
    receipts,
    canPay: context.activeRole === 'STUDENT' || context.activeRole === 'PARENT',
  };
}

// ---------------------------------------------------------------------------
// Admin finance overview
// ---------------------------------------------------------------------------
type KpiRow = {
  billed_minor: bigint | number | string;
  collected_minor: bigint | number | string;
  outstanding_minor: bigint | number | string;
  overdue_minor: bigint | number | string;
  collected_today_minor: bigint | number | string;
  collected_month_minor: bigint | number | string;
  partially_paid_count: bigint | number | string;
  pending_refund_count: bigint | number | string;
  unreconciled_manual_count: bigint | number | string;
  failed_attempt_count: bigint | number | string;
  credit_note_outstanding_minor: bigint | number | string;
};

export async function getAdminFinanceOverview(context: ActiveUserContext): Promise<AdminFinanceOverview> {
  assertFinancePermission(isFinanceOperator(context), 'finance:operations');
  const settings = await getFinanceSettings(context.tenantId);
  const [institution, feeCategories, feeStructures, refunds, programs, applications, holds, kpis] = await Promise.all([
    prisma.institution.findUnique({
      where: { id: context.tenantId },
      select: { id: true, name: true, subdomain: true },
    }),
    listFeeCategories(context.tenantId),
    listFeeStructures(context.tenantId),
    listRefundsForTenant(context, 'pending'),
    listScholarshipPrograms(context.tenantId),
    listScholarshipApplications(context),
    listFinancialHolds(context, true),
    loadFinanceKpis(context.tenantId),
  ]);

  return {
    role: context.activeRole,
    institution,
    settings,
    currency: settings.currency,
    summary: {
      billedMinor: dbNumber(kpis.billed_minor),
      collectedMinor: dbNumber(kpis.collected_minor),
      outstandingMinor: dbNumber(kpis.outstanding_minor),
      overdueMinor: dbNumber(kpis.overdue_minor),
      collectedTodayMinor: dbNumber(kpis.collected_today_minor),
      collectedThisMonthMinor: dbNumber(kpis.collected_month_minor),
      pendingRefundCount: refunds.length,
      scholarshipCommittedMinor: sumMinor(programs.map((program) => program.awardedMinor)),
      creditNoteOutstandingMinor: dbNumber(kpis.credit_note_outstanding_minor),
      activeHoldCount: holds.length,
      unreconciledManualCount: dbNumber(kpis.unreconciled_manual_count),
      failedAttemptCount: dbNumber(kpis.failed_attempt_count),
      partiallyPaidInvoiceCount: dbNumber(kpis.partially_paid_count),
    },
    feeCategories,
    feeStructures,
    pendingRefunds: refunds,
    scholarshipPrograms: programs,
    pendingScholarshipApplications: applications.filter((app) => !['APPROVED', 'REJECTED'].includes(app.status)),
    activeHolds: holds,
    recentAudit: [],
  };
}

async function loadFinanceKpis(tenantId: string) {
  try {
    const db = getTenantDb(tenantId);
    const [invoices, payments, refunds, manualRows, failedAttempts, outstandingCreditNotes] = await Promise.all([
      db.invoice.findMany({ select: { amount: true, dueDate: true, status: true, payments: { where: { status: 'PAID' }, select: { amount: true } } } }),
      db.payment.findMany({ where: { status: 'PAID' }, select: { amount: true, paidAt: true } }),
      prisma.$queryRaw<Array<{ count: bigint | number | string }>>`
        SELECT COUNT(*) AS count
        FROM campusos_finance.refund_requests
        WHERE tenant_id = ${tenantId}::uuid AND status IN ('REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING')
      `,
      prisma.$queryRaw<Array<{ count: bigint | number | string }>>`
        SELECT COUNT(*) AS count
        FROM campusos_finance.manual_payment_submissions
        WHERE tenant_id = ${tenantId}::uuid AND status = 'PENDING'
      `,
      prisma.$queryRaw<Array<{ count: bigint | number | string }>>`
        SELECT COUNT(*) AS count
        FROM campusos_finance.payment_attempts
        WHERE tenant_id = ${tenantId}::uuid AND status = 'FAILED'
      `,
      prisma.$queryRaw<Array<{ total_minor: bigint | number | string }>>`
        SELECT COALESCE(SUM(amount_minor), 0) AS total_minor
        FROM campusos_finance.credit_notes
        WHERE tenant_id = ${tenantId}::uuid AND status = 'ISSUED'
      `,
    ]);

    const billedMinor = sumMinor(invoices.map((invoice) => toMinor(invoice.amount)));
    const collectedMinor = sumMinor(payments.map((payment) => toMinor(payment.amount)));
    let outstandingMinor = 0;
    let overdueMinor = 0;
    let partiallyPaidCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    for (const invoice of invoices) {
      const paidMinor = sumMinor(invoice.payments.map((payment) => toMinor(payment.amount)));
      const balanceMinor = nonNegativeMinor(toMinor(invoice.amount) - paidMinor);
      if (balanceMinor > 0) {
        outstandingMinor = addMinor(outstandingMinor, balanceMinor);
        if (invoice.dueDate < today) overdueMinor = addMinor(overdueMinor, balanceMinor);
        if (invoice.status === 'PARTIAL') partiallyPaidCount += 1;
      }
    }
    const collectedTodayMinor = sumMinor(payments.filter((payment) => payment.paidAt >= today).map((payment) => toMinor(payment.amount)));
    const collectedMonthMinor = sumMinor(payments.filter((payment) => payment.paidAt >= monthStart).map((payment) => toMinor(payment.amount)));

    return {
      billed_minor: billedMinor,
      collected_minor: collectedMinor,
      outstanding_minor: outstandingMinor,
      overdue_minor: overdueMinor,
      collected_today_minor: collectedTodayMinor,
      collected_month_minor: collectedMonthMinor,
      partially_paid_count: partiallyPaidCount,
      pending_refund_count: dbNumber(refunds[0]?.count ?? 0),
      unreconciled_manual_count: dbNumber(manualRows[0]?.count ?? 0),
      failed_attempt_count: dbNumber(failedAttempts[0]?.count ?? 0),
      credit_note_outstanding_minor: dbNumber(outstandingCreditNotes[0]?.total_minor ?? 0),
    } as KpiRow;
  } catch (error) {
    console.error('Finance KPIs unavailable:', error);
    return {
      billed_minor: 0,
      collected_minor: 0,
      outstanding_minor: 0,
      overdue_minor: 0,
      collected_today_minor: 0,
      collected_month_minor: 0,
      partially_paid_count: 0,
      pending_refund_count: 0,
      unreconciled_manual_count: 0,
      failed_attempt_count: 0,
      credit_note_outstanding_minor: 0,
    } as KpiRow;
  }
}

// ---------------------------------------------------------------------------
// Receipt verification (public, minimal disclosure)
// ---------------------------------------------------------------------------
export async function verifyReceiptByReference(reference: string, tenantId?: string): Promise<ReceiptVerification | null> {
  const clean = reference.trim();
  if (!/^[A-Za-z0-9-]{8,64}$/.test(clean)) throw new FinanceError('Invalid receipt verification reference.', 400);
  try {
    const rows = await prisma.$queryRaw<ReceiptVerifyRow[]>`
      SELECT registry.receipt_number, registry.amount_minor, registry.currency,
             registry.payment_method, registry.status, registry.issued_at,
             institution.name AS institution_name
      FROM campusos_finance.receipt_registry registry
      JOIN public.institutions institution ON institution.id = registry.tenant_id
      WHERE registry.verify_reference = ${clean}
        ${tenantId ? Prisma.sql`AND registry.tenant_id = ${tenantId}::uuid` : Prisma.empty}
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) return null;
    return {
      status: row.status === 'REVOKED' ? 'REVOKED' : row.status === 'SUPERSEDED' ? 'SUPERSEDED' : 'VALID',
      institutionName: row.institution_name,
      receiptNumber: row.receipt_number,
      amountMinor: dbNumber(row.amount_minor),
      currency: row.currency,
      paymentMethod: row.payment_method,
      issuedAt: row.issued_at.toISOString(),
    };
  } catch (error) {
    console.error('Receipt verification unavailable:', error);
    return null;
  }
}
