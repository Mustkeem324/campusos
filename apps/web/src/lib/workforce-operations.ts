import 'server-only';

import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';

import { requireActiveUserContext, type ActiveUserContext } from './active-user-context';
import { prisma } from './db';
import {
  fromMinor,
  nonNegativeMinor,
  roundMinor,
  sumMinor,
  type MoneyMinor,
} from './finance-money';
import {
  assertWorkforcePermission,
  canAccessPayroll,
  canApproveLeave,
  canApprovePayroll,
  canReviewAttendanceCorrections,
  canReviewExits,
  canReviewRecruitment,
  canReviewReimbursements,
  isWorkforceConfigurator,
  isWorkforceHr,
  isWorkforceOperator,
  makerCheckerSeparated,
} from './workforce-policy';
import type {
  AttendanceCorrectionView,
  CandidateView,
  ClearanceItemView,
  CompensationVersionView,
  EmployeeProfileView,
  EmployeeSelfServiceWorkspace,
  FinalSettlementView,
  InterviewFeedbackInput,
  JobRequisitionView,
  LeaveBalanceView,
  LeaveRequestView,
  PayslipView,
  PayrollPeriodView,
  ReimbursementClaimView,
  ResignationRequestView,
  StaffAttendanceView,
  WorkforceAdminOverview,
  WorkforceSettings,
} from './workforce-operations-types';

export class WorkforceError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = 'WorkforceError';
  }
}

// ---------------------------------------------------------------------------
// Row / helpers
// ---------------------------------------------------------------------------

type SettingsRow = {
  timezone: string;
  employee_number_prefix: string;
  employee_number_year_format: string;
  employee_sequence_next: bigint | number | string;
  attendance_day_start: string;
  overnight_shift_allowed: boolean;
  missing_checkout_grace_minutes: number;
  leave_balance_enforced: boolean;
  leave_approval_maker_checker: boolean;
  leave_deduction_on_approval: boolean;
  leave_cancellation_restores: boolean;
  unpaid_leave_basis: string;
  payroll_maker_checker: boolean;
  payroll_monthly_divisor: number;
  payroll_protect_closed: boolean;
  payroll_require_disbursement_confirmation: boolean;
  final_settlement_maker_checker: boolean;
  probation_days: number;
  notice_period_days: number;
};

const DEFAULT_WORKFORCE_SETTINGS: WorkforceSettings = {
  timezone: 'Asia/Kolkata',
  employeeNumberPrefix: 'NAV/EMP',
  employeeNumberYearFormat: 'YYYY',
  attendanceDayStart: '00:00',
  overnightShiftAllowed: true,
  missingCheckoutGraceMinutes: 30,
  leaveBalanceEnforced: true,
  leaveApprovalMakerChecker: false,
  leaveDeductionOnApproval: true,
  leaveCancellationRestores: true,
  unpaidLeaveBasis: 'WORKING_DAYS',
  payrollMakerChecker: true,
  payrollMonthlyDivisor: 30,
  payrollProtectClosed: true,
  payrollRequireDisbursementConfirmation: true,
  finalSettlementMakerChecker: true,
  probationDays: 180,
  noticePeriodDays: 60,
};

function dbNumber(value: bigint | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

function parseBooleanRow(value: boolean | number | null | undefined): boolean {
  return value === true || value === 1;
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

function addDays(value: Date | string, days: number): Date {
  const date = typeof value === 'string' ? new Date(`${value}T00:00:00Z`) : new Date(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

/** Days between two YYYY-MM-DD dates inclusive. */
function inclusiveDayCount(start: string, end: string): number {
  const startMs = new Date(`${start}T00:00:00Z`).getTime();
  const endMs = new Date(`${end}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((endMs - startMs) / 86_400_000) + 1);
}

/** Weekday (0=Sunday) of a YYYY-MM-DD date. */
function weekdayOf(date: string): number {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function getWorkforceSettingsRow(tenantId: string): Promise<SettingsRow | null> {
  try {
    const rows = await prisma.$queryRaw<SettingsRow[]>`
      SELECT timezone, employee_number_prefix, employee_number_year_format, employee_sequence_next,
             attendance_day_start, overnight_shift_allowed, missing_checkout_grace_minutes,
             leave_balance_enforced, leave_approval_maker_checker, leave_deduction_on_approval,
             leave_cancellation_restores, unpaid_leave_basis, payroll_maker_checker,
             payroll_monthly_divisor, payroll_protect_closed,
             payroll_require_disbursement_confirmation, final_settlement_maker_checker,
             probation_days, notice_period_days
      FROM campusos_workforce.workforce_settings
      WHERE tenant_id = ${tenantId}::uuid
      LIMIT 1
    `;
    return rows[0] ?? null;
  } catch {
    return null;
  }
}

export async function getWorkforceSettings(tenantId: string): Promise<WorkforceSettings> {
  const row = await getWorkforceSettingsRow(tenantId);
  if (!row) return { ...DEFAULT_WORKFORCE_SETTINGS };
  return {
    timezone: row.timezone || 'Asia/Kolkata',
    employeeNumberPrefix: row.employee_number_prefix || 'NAV/EMP',
    employeeNumberYearFormat: row.employee_number_year_format || 'YYYY',
    attendanceDayStart: row.attendance_day_start || '00:00',
    overnightShiftAllowed: parseBooleanRow(row.overnight_shift_allowed),
    missingCheckoutGraceMinutes: row.missing_checkout_grace_minutes ?? 30,
    leaveBalanceEnforced: parseBooleanRow(row.leave_balance_enforced),
    leaveApprovalMakerChecker: parseBooleanRow(row.leave_approval_maker_checker),
    leaveDeductionOnApproval: parseBooleanRow(row.leave_deduction_on_approval),
    leaveCancellationRestores: parseBooleanRow(row.leave_cancellation_restores),
    unpaidLeaveBasis: (['CALENDAR_DAYS', 'WORKING_DAYS'] as const).includes(row.unpaid_leave_basis as never)
      ? (row.unpaid_leave_basis as WorkforceSettings['unpaidLeaveBasis'])
      : 'WORKING_DAYS',
    payrollMakerChecker: parseBooleanRow(row.payroll_maker_checker),
    payrollMonthlyDivisor: row.payroll_monthly_divisor ?? 30,
    payrollProtectClosed: parseBooleanRow(row.payroll_protect_closed),
    payrollRequireDisbursementConfirmation: parseBooleanRow(row.payroll_require_disbursement_confirmation),
    finalSettlementMakerChecker: parseBooleanRow(row.final_settlement_maker_checker),
    probationDays: row.probation_days ?? 180,
    noticePeriodDays: row.notice_period_days ?? 60,
  };
}

async function ensureWorkforceSettingsRow(tenantId: string) {
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.workforce_settings (tenant_id, updated_at)
    VALUES (${tenantId}::uuid, now())
    ON CONFLICT (tenant_id) DO NOTHING
  `;
}

export async function updateWorkforceSettings(
  context: ActiveUserContext,
  patch: Partial<WorkforceSettings>,
): Promise<WorkforceSettings> {
  assertWorkforcePermission(isWorkforceConfigurator(context), 'workforce:configure');
  const settings = await getWorkforceSettings(context.tenantId);

  const timezone = patch.timezone ?? settings.timezone;
  try {
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format();
  } catch {
    throw new WorkforceError('Timezone is invalid.', 400);
  }

  await ensureWorkforceSettingsRow(context.tenantId);

  await prisma.$executeRaw`
    UPDATE campusos_workforce.workforce_settings
    SET timezone = ${timezone},
        employee_number_prefix = ${(patch.employeeNumberPrefix ?? settings.employeeNumberPrefix).slice(0, 24)},
        employee_number_year_format = ${(patch.employeeNumberYearFormat ?? settings.employeeNumberYearFormat).slice(0, 8)},
        attendance_day_start = ${patch.attendanceDayStart ?? settings.attendanceDayStart},
        overnight_shift_allowed = ${patch.overnightShiftAllowed ?? settings.overnightShiftAllowed},
        missing_checkout_grace_minutes = ${patch.missingCheckoutGraceMinutes ?? settings.missingCheckoutGraceMinutes},
        leave_balance_enforced = ${patch.leaveBalanceEnforced ?? settings.leaveBalanceEnforced},
        leave_approval_maker_checker = ${patch.leaveApprovalMakerChecker ?? settings.leaveApprovalMakerChecker},
        leave_deduction_on_approval = ${patch.leaveDeductionOnApproval ?? settings.leaveDeductionOnApproval},
        leave_cancellation_restores = ${patch.leaveCancellationRestores ?? settings.leaveCancellationRestores},
        unpaid_leave_basis = ${patch.unpaidLeaveBasis ?? settings.unpaidLeaveBasis},
        payroll_maker_checker = ${patch.payrollMakerChecker ?? settings.payrollMakerChecker},
        payroll_monthly_divisor = ${patch.payrollMonthlyDivisor ?? settings.payrollMonthlyDivisor},
        payroll_protect_closed = ${patch.payrollProtectClosed ?? settings.payrollProtectClosed},
        payroll_require_disbursement_confirmation = ${patch.payrollRequireDisbursementConfirmation ?? settings.payrollRequireDisbursementConfirmation},
        final_settlement_maker_checker = ${patch.finalSettlementMakerChecker ?? settings.finalSettlementMakerChecker},
        probation_days = ${patch.probationDays ?? settings.probationDays},
        notice_period_days = ${patch.noticePeriodDays ?? settings.noticePeriodDays},
        updated_by = ${context.userId}::uuid,
        updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid
  `;
  await writeWorkforceAudit(context, 'SETTINGS_UPDATED', 'workforce_settings', context.tenantId, settings, patch, 'Workforce policy settings updated');
  return getWorkforceSettings(context.tenantId);
}

async function writeWorkforceAudit(
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
      INSERT INTO campusos_workforce.workforce_audit_events
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
// Employee number generation (concurrency safe, server generated)
// ---------------------------------------------------------------------------

function formatEmployeeNumber(prefix: string, year: string, sequence: number): string {
  return `${prefix}/${year}/${String(sequence).padStart(5, '0')}`;
}

function employeeNumberYear(format: string, joiningDate: string): string {
  const year = joiningDate.slice(0, 4);
  if (format === 'YY') return year.slice(2);
  return year;
}

// ---------------------------------------------------------------------------
// Employee master
// ---------------------------------------------------------------------------

type EmployeeRow = {
  id: string;
  staff_id: string;
  user_id: string;
  employee_number: string;
  employee_type: string;
  employment_type: string;
  designation: string;
  grade: string | null;
  department_id: string | null;
  department_name: string | null;
  campus_id: string | null;
  reporting_manager_id: string | null;
  reporting_manager_name: string | null;
  joining_date: Date;
  confirmation_date: Date | null;
  contract_start: Date | null;
  contract_end: Date | null;
  work_location: string | null;
  work_mode: string;
  employment_status: string;
  personal_email: string | null;
  work_email: string | null;
  phone: string | null;
  emergency_contact: unknown;
  bank_account_masked: string | null;
  bank_ifsc: string | null;
  last_working_day: Date | null;
  exit_reason: string | null;
  name: string;
  email: string;
};

function mapEmployeeRow(row: EmployeeRow): EmployeeProfileView {
  return {
    id: row.id,
    staffId: row.staff_id,
    userId: row.user_id,
    employeeNumber: row.employee_number,
    employeeType: row.employee_type,
    employmentType: row.employment_type,
    designation: row.designation,
    grade: row.grade,
    departmentId: row.department_id,
    departmentName: row.department_name,
    campusId: row.campus_id,
    reportingManagerId: row.reporting_manager_id,
    reportingManagerName: row.reporting_manager_name,
    joiningDate: row.joining_date ? dateOnly(row.joining_date, 'UTC') : '',
    confirmationDate: row.confirmation_date ? dateOnly(row.confirmation_date, 'UTC') : null,
    contractStart: row.contract_start ? dateOnly(row.contract_start, 'UTC') : null,
    contractEnd: row.contract_end ? dateOnly(row.contract_end, 'UTC') : null,
    workLocation: row.work_location,
    workMode: row.work_mode,
    employmentStatus: row.employment_status as EmployeeProfileView['employmentStatus'],
    personalEmail: row.personal_email,
    workEmail: row.work_email,
    phone: row.phone,
    emergencyContact: row.emergency_contact ?? {},
    bankAccountMasked: row.bank_account_masked,
    bankIfsc: row.bank_ifsc,
    lastWorkingDay: row.last_working_day ? dateOnly(row.last_working_day, 'UTC') : null,
    exitReason: row.exit_reason,
    name: row.name,
    email: row.email,
  };
}

/** Resolves the workforce employee profile for a user in the tenant, if any. */
export async function resolveEmployeeProfileForUser(
  context: ActiveUserContext,
): Promise<EmployeeProfileView | null> {
  const rows = await prisma.$queryRaw<EmployeeRow[]>`
    SELECT p.id, p.staff_id, p.user_id, p.employee_number, p.employee_type, p.employment_type,
           p.designation, p.grade, p.department_id, d.name AS department_name, p.campus_id,
           p.reporting_manager_id, m.name AS reporting_manager_name,
           p.joining_date, p.confirmation_date, p.contract_start, p.contract_end,
           p.work_location, p.work_mode, p.employment_status, p.personal_email, p.work_email,
           p.phone, p.emergency_contact, p.bank_account_masked, p.bank_ifsc,
           p.last_working_day, p.exit_reason,
           u.name, u.email
    FROM campusos_workforce.employee_profiles p
    JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.departments d ON d.id = p.department_id
    LEFT JOIN public.users m ON m.id = (SELECT ep.user_id FROM campusos_workforce.employee_profiles ep WHERE ep.id = p.reporting_manager_id)
    WHERE p.tenant_id = ${context.tenantId}::uuid AND p.user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  return rows[0] ? mapEmployeeRow(rows[0]) : null;
}

export async function createEmployee(
  context: ActiveUserContext,
  input: {
    userId: string;
    employeeType: string;
    employmentType: string;
    designation: string;
    grade?: string;
    departmentId?: string;
    campusId?: string;
    reportingManagerId?: string;
    joiningDate: string;
    contractStart?: string;
    contractEnd?: string;
    workLocation?: string;
    workMode?: string;
    personalEmail?: string;
    workEmail?: string;
    phone?: string;
    emergencyContact?: Record<string, unknown>;
    bankAccountMasked?: string;
    bankIfsc?: string;
  },
): Promise<EmployeeProfileView> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:employees:create');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.userId)) {
    throw new WorkforceError('Invalid user identifier.', 400);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.joiningDate)) {
    throw new WorkforceError('Joining date must be a valid YYYY-MM-DD date.', 400);
  }
  if (!input.designation.trim()) throw new WorkforceError('Designation is required.', 400);

  // The user must exist and belong to the active institution. Existing verified
  // identities are reused idempotently — never duplicated.
  const user = await prisma.user.findUnique({ where: { id: input.userId }, select: { id: true, tenantId: true, isActive: true } });
  if (!user || user.tenantId !== context.tenantId) {
    throw new WorkforceError('The user does not belong to this institution.', 404);
  }

  const settings = await getWorkforceSettings(context.tenantId);
  await ensureWorkforceSettingsRow(context.tenantId);

  let employeeId = randomUUID();
  try {
    await prisma.$transaction(async (tx) => {
      // Reserve the next employee number inside the transaction (concurrency safe).
      const seqRows = await tx.$queryRaw<Array<{ employee_sequence_next: bigint | number | string }>>`
        SELECT employee_sequence_next
        FROM campusos_workforce.workforce_settings
        WHERE tenant_id = ${context.tenantId}::uuid
        FOR UPDATE
      `;
      let sequence = dbNumber(seqRows[0]?.employee_sequence_next ?? 1);

      // Reuse an existing staff record for this user when present (legacy faculty).
      const existingStaff = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM public.staff WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${input.userId}::uuid LIMIT 1
      `;
      let staffId = existingStaff[0]?.id ?? randomUUID();

      if (!existingStaff[0]) {
        await tx.$executeRaw`
          INSERT INTO public.staff (id, tenant_id, user_id, employee_id, designation, department_id)
          VALUES (${staffId}::uuid, ${context.tenantId}::uuid, ${input.userId}::uuid,
                  ${formatEmployeeNumber(settings.employeeNumberPrefix, employeeNumberYear(settings.employeeNumberYearFormat, input.joiningDate), sequence)},
                  ${input.designation}, ${input.departmentId ? Prisma.sql`${input.departmentId}::uuid` : Prisma.sql`NULL`})
        `;
      }

      const employeeNumber = formatEmployeeNumber(
        settings.employeeNumberPrefix,
        employeeNumberYear(settings.employeeNumberYearFormat, input.joiningDate),
        sequence,
      );
      sequence += 1;

      const bankAccountMasked = input.bankAccountMasked
        ? `XXXXXX${input.bankAccountMasked.replace(/[^0-9]/g, '').slice(-4)}`
        : null;

      await tx.$executeRaw`
        INSERT INTO campusos_workforce.employee_profiles
          (id, tenant_id, staff_id, user_id, employee_number, employee_type, employment_type,
           designation, grade, department_id, campus_id, reporting_manager_id, joining_date,
           confirmation_date, contract_start, contract_end, work_location, work_mode,
           employment_status, personal_email, work_email, phone, emergency_contact,
           bank_account_masked, bank_ifsc, created_by, created_at, updated_at)
        VALUES
          (${employeeId}::uuid, ${context.tenantId}::uuid, ${staffId}::uuid, ${input.userId}::uuid,
           ${employeeNumber}, ${input.employeeType}, ${input.employmentType}, ${input.designation},
           ${input.grade ?? null}, ${input.departmentId ? Prisma.sql`${input.departmentId}::uuid` : Prisma.sql`NULL`},
           ${input.campusId ? Prisma.sql`${input.campusId}::uuid` : Prisma.sql`NULL`},
           ${input.reportingManagerId ? Prisma.sql`${input.reportingManagerId}::uuid` : Prisma.sql`NULL`},
           ${input.joiningDate}::date, ${input.joiningDate}::date,
           ${input.contractStart ? Prisma.sql`${input.contractStart}::date` : Prisma.sql`NULL`},
           ${input.contractEnd ? Prisma.sql`${input.contractEnd}::date` : Prisma.sql`NULL`},
           ${input.workLocation ?? null}, ${input.workMode ?? 'OFFLINE'}, 'ACTIVE',
           ${input.personalEmail ?? null}, ${input.workEmail ?? null}, ${input.phone ?? null},
           ${JSON.stringify(input.emergencyContact ?? {})}::jsonb, ${bankAccountMasked},
           ${input.bankIfsc ?? null}, ${context.userId}::uuid, now(), now())
      `;

      await tx.$executeRaw`
        INSERT INTO campusos_workforce.employment_history
          (id, tenant_id, employee_id, change_type, effective_from, new_state, reason,
           actor_user_id, actor_role, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${employeeId}::uuid, 'CREATED',
           ${input.joiningDate}::date, ${JSON.stringify({ designation: input.designation, employeeType: input.employeeType, employmentType: input.employmentType })}::jsonb,
           'Employee profile created', ${context.userId}::uuid, ${context.activeRole}, now())
      `;

      await tx.$executeRaw`
        UPDATE campusos_workforce.workforce_settings
        SET employee_sequence_next = ${sequence}, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid
      `;
    }, { timeout: 30_000 });
  } catch (error) {
    if (error instanceof WorkforceError) throw error;
    const message = error instanceof Error ? error.message : 'Unable to create the employee.';
    if (message.includes('employee_profiles_number_uq') || message.includes('unique constraint')) {
      throw new WorkforceError('An employee with that number already exists. Retry the request.', 409);
    }
    throw error;
  }

  await writeWorkforceAudit(
    context,
    'EMPLOYEE_CREATED',
    'employee_profiles',
    employeeId,
    null,
    { designation: input.designation, employeeType: input.employeeType, joiningDate: input.joiningDate },
    'Employee profile created',
  );
  const created = await getEmployeeProfile(context, employeeId);
  return created;
}

export async function listEmployees(
  context: ActiveUserContext,
  filters: { search?: string; departmentId?: string; status?: string; employeeType?: string; page?: number; pageSize?: number } = {},
): Promise<{ items: EmployeeProfileView[]; total: number; page: number; pageSize: number }> {
  assertWorkforcePermission(isWorkforceOperator(context), 'workforce:employees:read');

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const conditions: string[] = ['p.tenant_id = $1::uuid'];
  const params: unknown[] = [context.tenantId];

  if (filters.departmentId) {
    conditions.push(`p.department_id = $${params.length + 1}::uuid`);
    params.push(filters.departmentId);
  }
  if (filters.status) {
    conditions.push(`p.employment_status = $${params.length + 1}`);
    params.push(filters.status);
  }
  if (filters.employeeType) {
    conditions.push(`p.employee_type = $${params.length + 1}`);
    params.push(filters.employeeType);
  }
  if (filters.search?.trim()) {
    conditions.push(`(p.employee_number ILIKE $${params.length + 1} OR u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR p.designation ILIKE $${params.length + 1})`);
    params.push(`%${filters.search.trim()}%`);
  }

  const whereSql = conditions.join(' AND ');

  const countRows = await prisma.$queryRaw<Array<{ total: bigint | number }>>(Prisma.sql`
    SELECT count(*) AS total
    FROM campusos_workforce.employee_profiles p
    JOIN public.users u ON u.id = p.user_id
    WHERE ${Prisma.raw(whereSql)}
  `, ...params);
  const total = dbNumber(countRows[0]?.total ?? 0);

  const rows = await prisma.$queryRaw<EmployeeRow[]>(Prisma.sql`
    SELECT p.id, p.staff_id, p.user_id, p.employee_number, p.employee_type, p.employment_type,
           p.designation, p.grade, p.department_id, d.name AS department_name, p.campus_id,
           p.reporting_manager_id, m.name AS reporting_manager_name,
           p.joining_date, p.confirmation_date, p.contract_start, p.contract_end,
           p.work_location, p.work_mode, p.employment_status, p.personal_email, p.work_email,
           p.phone, p.emergency_contact, p.bank_account_masked, p.bank_ifsc,
           p.last_working_day, p.exit_reason, u.name, u.email
    FROM campusos_workforce.employee_profiles p
    JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.departments d ON d.id = p.department_id
    LEFT JOIN public.users m ON m.id = (SELECT ep.user_id FROM campusos_workforce.employee_profiles ep WHERE ep.id = p.reporting_manager_id)
    WHERE ${Prisma.raw(whereSql)}
    ORDER BY p.joining_date DESC
    LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
  `, ...params);

  return { items: rows.map(mapEmployeeRow), total, page, pageSize };
}

export async function getEmployeeProfile(context: ActiveUserContext, employeeId: string): Promise<EmployeeProfileView> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(employeeId)) {
    throw new WorkforceError('Invalid employee identifier.', 400);
  }
  const own = await resolveEmployeeProfileForUser(context);
  if (!isWorkforceOperator(context) && own?.id !== employeeId) {
    throw new WorkforceError('You do not have permission to view this employee record.', 403);
  }
  const rows = await prisma.$queryRaw<EmployeeRow[]>`
    SELECT p.id, p.staff_id, p.user_id, p.employee_number, p.employee_type, p.employment_type,
           p.designation, p.grade, p.department_id, d.name AS department_name, p.campus_id,
           p.reporting_manager_id, m.name AS reporting_manager_name,
           p.joining_date, p.confirmation_date, p.contract_start, p.contract_end,
           p.work_location, p.work_mode, p.employment_status, p.personal_email, p.work_email,
           p.phone, p.emergency_contact, p.bank_account_masked, p.bank_ifsc,
           p.last_working_day, p.exit_reason, u.name, u.email
    FROM campusos_workforce.employee_profiles p
    JOIN public.users u ON u.id = p.user_id
    LEFT JOIN public.departments d ON d.id = p.department_id
    LEFT JOIN public.users m ON m.id = (SELECT ep.user_id FROM campusos_workforce.employee_profiles ep WHERE ep.id = p.reporting_manager_id)
    WHERE p.tenant_id = ${context.tenantId}::uuid AND p.id = ${employeeId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Employee not found.', 404);
  return mapEmployeeRow(rows[0]);
}

export async function updateEmploymentStatus(
  context: ActiveUserContext,
  employeeId: string,
  input: { status: string; effectiveDate: string; reason: string },
): Promise<EmployeeProfileView> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:employees:status');
  const current = await getEmployeeProfile(context, employeeId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveDate)) {
    throw new WorkforceError('Effective date must be a valid YYYY-MM-DD date.', 400);
  }
  if (!input.reason.trim()) throw new WorkforceError('A reason is required for a status change.', 400);

  await prisma.$executeRaw`
    UPDATE campusos_workforce.employee_profiles
    SET employment_status = ${input.status}, last_working_day = ${input.effectiveDate}::date,
        exit_reason = ${input.reason}, updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${employeeId}::uuid
  `;
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.employment_history
      (id, tenant_id, employee_id, change_type, effective_from, previous_state, new_state, reason,
       actor_user_id, actor_role, created_at)
    VALUES
      (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${employeeId}::uuid, 'STATUS_CHANGE',
       ${input.effectiveDate}::date, ${JSON.stringify({ employment_status: current.employmentStatus })}::jsonb,
       ${JSON.stringify({ employment_status: input.status, last_working_day: input.effectiveDate })}::jsonb,
       ${input.reason}, ${context.userId}::uuid, ${context.activeRole}, now())
  `;
  await writeWorkforceAudit(
    context,
    'EMPLOYEE_STATUS_CHANGED',
    'employee_profiles',
    employeeId,
    { employment_status: current.employmentStatus },
    { employment_status: input.status, effectiveDate: input.effectiveDate },
    input.reason,
  );
  return getEmployeeProfile(context, employeeId);
}

// ---------------------------------------------------------------------------
// Compensation
// ---------------------------------------------------------------------------

type CompensationRow = {
  id: string;
  version: number;
  effective_from: Date;
  base_pay_minor: bigint | number | string;
  earnings: unknown;
  deductions: unknown;
  employer_contributions: unknown;
  gross_minor: bigint | number | string;
  ctc_minor: bigint | number | string;
  currency: string;
  status: string;
  created_by: string;
  created_at: Date;
};

function mapCompensationRow(row: CompensationRow): CompensationVersionView {
  const earnings = Array.isArray(row.earnings) ? row.earnings : [];
  const deductions = Array.isArray(row.deductions) ? row.deductions : [];
  const contributions = Array.isArray(row.employer_contributions) ? row.employer_contributions : [];
  return {
    id: row.id,
    version: row.version,
    effectiveFrom: dateOnly(row.effective_from, 'UTC'),
    basePayMinor: dbNumber(row.base_pay_minor),
    earnings: earnings as CompensationVersionView['earnings'],
    deductions: deductions as CompensationVersionView['deductions'],
    employerContributions: contributions as CompensationVersionView['employerContributions'],
    grossMinor: dbNumber(row.gross_minor),
    ctcMinor: dbNumber(row.ctc_minor),
    currency: row.currency,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at.toISOString(),
  };
}

export async function createCompensationVersion(
  context: ActiveUserContext,
  employeeId: string,
  input: {
    effectiveFrom: string;
    basePayMinor: MoneyMinor;
    earnings?: Array<{ code: string; label: string; amountMinor: MoneyMinor }>;
    deductions?: Array<{ code: string; label: string; amountMinor: MoneyMinor; percentage?: number }>;
    employerContributions?: Array<{ code: string; label: string; amountMinor: MoneyMinor }>;
    currency?: string;
  },
): Promise<CompensationVersionView> {
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:compensation:create');
  await getEmployeeProfile(context, employeeId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effectiveFrom)) {
    throw new WorkforceError('Effective date must be a valid YYYY-MM-DD date.', 400);
  }
  if (input.basePayMinor < 0) throw new WorkforceError('Base pay cannot be negative.', 400);
  const currency = (input.currency ?? 'INR').toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) throw new WorkforceError('Currency must be a 3-letter ISO code.', 400);

  const earnings = (input.earnings ?? []).map((item) => ({
    code: item.code,
    label: item.label,
    amount_minor: item.amountMinor,
  }));
  const deductions = (input.deductions ?? []).map((item) => ({
    code: item.code,
    label: item.label,
    amount_minor: item.amountMinor,
    percentage: item.percentage ?? 0,
  }));
  const contributions = (input.employerContributions ?? []).map((item) => ({
    code: item.code,
    label: item.label,
    amount_minor: item.amountMinor,
  }));

  // Authoritative gross is computed server-side from the parts — the client
  // never supplies the final gross/net.
  const grossMinor = roundMinor(input.basePayMinor + sumMinor(earnings.map((item) => dbNumber(item.amount_minor))));
  const ctcMinor = roundMinor(grossMinor + sumMinor(contributions.map((item) => dbNumber(item.amount_minor))));

  const versionRow = await prisma.$queryRaw<Array<{ next_version: bigint | number }>>`
    SELECT COALESCE(max(version), 0) + 1 AS next_version
    FROM campusos_workforce.compensation_versions
    WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employeeId}::uuid
  `;
  const version = dbNumber(versionRow[0]?.next_version ?? 1);

  const compensationId = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_workforce.compensation_versions
      SET status = 'SUPERSEDED', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employeeId}::uuid AND status = 'ACTIVE'
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_workforce.compensation_versions
        (id, tenant_id, employee_id, version, effective_from, base_pay_minor, earnings,
         deductions, employer_contributions, gross_minor, ctc_minor, currency, status,
         created_by, created_role, created_at)
      VALUES
        (${compensationId}::uuid, ${context.tenantId}::uuid, ${employeeId}::uuid, ${version},
         ${input.effectiveFrom}::date, ${input.basePayMinor}, ${JSON.stringify(earnings)}::jsonb,
         ${JSON.stringify(deductions)}::jsonb, ${JSON.stringify(contributions)}::jsonb,
         ${grossMinor}, ${ctcMinor}, ${currency}, 'ACTIVE', ${context.userId}::uuid,
         ${context.activeRole}, now())
    `;
    await tx.$executeRaw`
      INSERT INTO campusos_workforce.employment_history
        (id, tenant_id, employee_id, change_type, effective_from, new_state, reason,
         actor_user_id, actor_role, created_at)
      VALUES
        (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${employeeId}::uuid, 'INCREMENT',
         ${input.effectiveFrom}::date, ${JSON.stringify({ compensation_version: version, gross_minor: grossMinor })}::jsonb,
         'Compensation structure created', ${context.userId}::uuid, ${context.activeRole}, now())
    `;
  }, { timeout: 30_000 });

  await writeWorkforceAudit(
    context,
    'COMPENSATION_CREATED',
    'compensation_versions',
    compensationId,
    null,
    { employeeId, version, effectiveFrom: input.effectiveFrom, grossMinor, ctcMinor },
    'Compensation structure created',
  );
  const rows = await prisma.$queryRaw<CompensationRow[]>`
    SELECT id, version, effective_from, base_pay_minor, earnings, deductions,
           employer_contributions, gross_minor, ctc_minor, currency, status, created_by, created_at
    FROM campusos_workforce.compensation_versions
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${compensationId}::uuid
    LIMIT 1
  `;
  return mapCompensationRow(rows[0]);
}

export async function listCompensationVersions(
  context: ActiveUserContext,
  employeeId: string,
): Promise<CompensationVersionView[]> {
  // Compensation is sensitive: only payroll roles may read salary structures.
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:compensation:read');
  await getEmployeeProfile(context, employeeId);
  const rows = await prisma.$queryRaw<CompensationRow[]>`
    SELECT id, version, effective_from, base_pay_minor, earnings, deductions,
           employer_contributions, gross_minor, ctc_minor, currency, status, created_by, created_at
    FROM campusos_workforce.compensation_versions
    WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employeeId}::uuid
    ORDER BY version DESC
  `;
  return rows.map(mapCompensationRow);
}

// ---------------------------------------------------------------------------
// Staff attendance (separate from student academic attendance)
// ---------------------------------------------------------------------------

type AttendanceRow = {
  id: string;
  attendance_date: Date;
  shift_name: string | null;
  check_in: Date | null;
  check_out: Date | null;
  work_minutes: number | null;
  status: string;
  source: string;
  note: string | null;
};

function mapAttendanceRow(row: AttendanceRow): StaffAttendanceView {
  return {
    id: row.id,
    attendanceDate: dateOnly(row.attendance_date, 'UTC'),
    shiftName: row.shift_name,
    checkIn: row.check_in ? row.check_in.toISOString() : null,
    checkOut: row.check_out ? row.check_out.toISOString() : null,
    workMinutes: row.work_minutes,
    status: row.status as StaffAttendanceView['status'],
    source: row.source,
    note: row.note,
  };
}

async function requireOwnEmployee(context: ActiveUserContext): Promise<{ id: string }> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_workforce.employee_profiles
    WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${context.userId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('No workforce employee profile is linked to this account.', 404);
  return rows[0];
}

export async function checkIn(context: ActiveUserContext): Promise<StaffAttendanceView> {
  const employee = await requireOwnEmployee(context);
  const settings = await getWorkforceSettings(context.tenantId);
  const today = dateOnly(new Date(), settings.timezone);

  const existing = await prisma.$queryRaw<AttendanceRow[]>`
    SELECT a.id, a.attendance_date, s.name AS shift_name, a.check_in, a.check_out,
           a.work_minutes, a.status, a.source, a.note
    FROM campusos_workforce.staff_attendance a
    LEFT JOIN campusos_workforce.work_shifts s ON s.id = a.shift_id
    WHERE a.tenant_id = ${context.tenantId}::uuid AND a.employee_id = ${employee.id}::uuid
      AND a.attendance_date = ${today}::date
    LIMIT 1
  `;

  const attendanceId = randomUUID();
  const now = new Date();
  if (existing[0]) {
    if (existing[0].check_in) {
      throw new WorkforceError('You are already checked in for today.', 409);
    }
    await prisma.$executeRaw`
      UPDATE campusos_workforce.staff_attendance
      SET check_in = ${now}, status = 'PRESENT', source = 'MANUAL', updated_at = now()
      WHERE id = ${existing[0].id}::uuid AND tenant_id = ${context.tenantId}::uuid
    `;
    return getAttendanceById(context, existing[0].id);
  }

  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.staff_attendance
      (id, tenant_id, employee_id, attendance_date, check_in, status, source, created_at, updated_at)
    VALUES
      (${attendanceId}::uuid, ${context.tenantId}::uuid, ${employee.id}::uuid, ${today}::date,
       ${now}, 'PRESENT', 'MANUAL', now(), now())
  `;
  return getAttendanceById(context, attendanceId);
}

export async function checkOut(context: ActiveUserContext): Promise<StaffAttendanceView> {
  const employee = await requireOwnEmployee(context);
  const settings = await getWorkforceSettings(context.tenantId);
  const today = dateOnly(new Date(), settings.timezone);

  const existing = await prisma.$queryRaw<AttendanceRow[]>`
    SELECT a.id, a.attendance_date, s.name AS shift_name, a.check_in, a.check_out,
           a.work_minutes, a.status, a.source, a.note
    FROM campusos_workforce.staff_attendance a
    LEFT JOIN campusos_workforce.work_shifts s ON s.id = a.shift_id
    WHERE a.tenant_id = ${context.tenantId}::uuid AND a.employee_id = ${employee.id}::uuid
      AND a.attendance_date = ${today}::date
    LIMIT 1
  `;
  if (!existing[0]?.check_in) {
    throw new WorkforceError('You must check in before checking out.', 400);
  }
  if (existing[0].check_out) {
    throw new WorkforceError('You have already checked out for today.', 409);
  }

  const now = new Date();
  const checkIn = existing[0].check_in;
  // Overnight shift: checkout earlier than check-in crosses midnight.
  let minutes = Math.round((now.getTime() - checkIn.getTime()) / 60_000);
  if (minutes < 0 && settings.overnightShiftAllowed) minutes += 24 * 60;

  await prisma.$executeRaw`
    UPDATE campusos_workforce.staff_attendance
    SET check_out = ${now}, work_minutes = ${minutes}, updated_at = now()
    WHERE id = ${existing[0].id}::uuid AND tenant_id = ${context.tenantId}::uuid
  `;
  return getAttendanceById(context, existing[0].id);
}

async function getAttendanceById(context: ActiveUserContext, attendanceId: string): Promise<StaffAttendanceView> {
  const rows = await prisma.$queryRaw<AttendanceRow[]>`
    SELECT a.id, a.attendance_date, s.name AS shift_name, a.check_in, a.check_out,
           a.work_minutes, a.status, a.source, a.note
    FROM campusos_workforce.staff_attendance a
    LEFT JOIN campusos_workforce.work_shifts s ON s.id = a.shift_id
    WHERE a.tenant_id = ${context.tenantId}::uuid AND a.id = ${attendanceId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Attendance record not found.', 404);
  return mapAttendanceRow(rows[0]);
}

export async function listMyAttendance(
  context: ActiveUserContext,
  limit = 30,
): Promise<StaffAttendanceView[]> {
  const employee = await requireOwnEmployee(context);
  const rows = await prisma.$queryRaw<AttendanceRow[]>`
    SELECT a.id, a.attendance_date, s.name AS shift_name, a.check_in, a.check_out,
           a.work_minutes, a.status, a.source, a.note
    FROM campusos_workforce.staff_attendance a
    LEFT JOIN campusos_workforce.work_shifts s ON s.id = a.shift_id
    WHERE a.tenant_id = ${context.tenantId}::uuid AND a.employee_id = ${employee.id}::uuid
    ORDER BY a.attendance_date DESC
    LIMIT ${Math.min(120, limit)}
  `;
  return rows.map(mapAttendanceRow);
}

// ---------------------------------------------------------------------------
// Attendance corrections
// ---------------------------------------------------------------------------

export async function requestAttendanceCorrection(
  context: ActiveUserContext,
  input: { attendanceId?: string; attendanceDate?: string; proposedCheckIn?: string; proposedCheckOut?: string; proposedStatus?: string; reason: string },
): Promise<AttendanceCorrectionView> {
  const employee = await requireOwnEmployee(context);
  if (!input.reason.trim()) throw new WorkforceError('A reason is required for a correction.', 400);

  let attendanceId = input.attendanceId;
  if (!attendanceId && input.attendanceDate) {
    const rows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_workforce.staff_attendance
      WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employee.id}::uuid
        AND attendance_date = ${input.attendanceDate}::date
      LIMIT 1
    `;
    attendanceId = rows[0]?.id;
  }

  let originalState: Record<string, unknown> = {};
  if (attendanceId) {
    const rows = await prisma.$queryRaw<Array<{ check_in: Date | null; check_out: Date | null; status: string }>>`
      SELECT check_in, check_out, status FROM campusos_workforce.staff_attendance
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${attendanceId}::uuid
      LIMIT 1
    `;
    if (rows[0]) {
      originalState = {
        checkIn: rows[0].check_in ? rows[0].check_in.toISOString() : null,
        checkOut: rows[0].check_out ? rows[0].check_out.toISOString() : null,
        status: rows[0].status,
      };
    }
  }

  const proposedState: Record<string, unknown> = {
    checkIn: input.proposedCheckIn ?? originalState.checkIn ?? null,
    checkOut: input.proposedCheckOut ?? originalState.checkOut ?? null,
    status: input.proposedStatus ?? originalState.status ?? 'PRESENT',
  };

  const correctionId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.attendance_corrections
      (id, tenant_id, employee_id, attendance_id, original_state, proposed_state, reason,
       status, requested_by, created_at, updated_at)
    VALUES
      (${correctionId}::uuid, ${context.tenantId}::uuid, ${employee.id}::uuid,
       ${attendanceId ? Prisma.sql`${attendanceId}::uuid` : Prisma.sql`NULL`},
       ${JSON.stringify(originalState)}::jsonb, ${JSON.stringify(proposedState)}::jsonb,
       ${input.reason}, 'REQUESTED', ${context.userId}::uuid, now(), now())
  `;
  await writeWorkforceAudit(context, 'ATTENDANCE_CORRECTION_REQUESTED', 'attendance_corrections', correctionId, originalState, proposedState, input.reason);
  return getCorrectionById(context, correctionId);
}

export async function reviewAttendanceCorrection(
  context: ActiveUserContext,
  correctionId: string,
  input: { decision: 'APPROVE' | 'REJECT'; note?: string },
): Promise<AttendanceCorrectionView> {
  assertWorkforcePermission(canReviewAttendanceCorrections(context), 'workforce:attendance:corrections:review');
  const current = await getCorrectionById(context, correctionId);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_workforce.attendance_corrections
      SET status = ${input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'},
          reviewed_by = ${context.userId}::uuid, review_note = ${input.note ?? null},
          reviewed_at = now(), updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${correctionId}::uuid
    `;
    if (input.decision === 'APPROVE' && current.attendanceDate) {
      const proposed = (current.proposedState ?? {}) as Record<string, unknown>;
      await tx.$executeRaw`
        UPDATE campusos_workforce.staff_attendance
        SET check_in = ${proposed.checkIn ? new Date(String(proposed.checkIn)) : Prisma.sql`NULL`},
            check_out = ${proposed.checkOut ? new Date(String(proposed.checkOut)) : Prisma.sql`NULL`},
            status = ${String(proposed.status ?? 'PRESENT')},
            source = 'CORRECTION', updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid
          AND attendance_date = ${current.attendanceDate}::date
          AND employee_id = (SELECT employee_id FROM campusos_workforce.attendance_corrections WHERE id = ${correctionId}::uuid)
      `;
    }
  }, { timeout: 30_000 });

  await writeWorkforceAudit(
    context,
    input.decision === 'APPROVE' ? 'ATTENDANCE_CORRECTION_APPROVED' : 'ATTENDANCE_CORRECTION_REJECTED',
    'attendance_corrections',
    correctionId,
    { status: current.status },
    { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    input.note,
  );
  return getCorrectionById(context, correctionId);
}

async function getCorrectionById(context: ActiveUserContext, correctionId: string): Promise<AttendanceCorrectionView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    attendance_date: Date | null;
    original_state: unknown;
    proposed_state: unknown;
    reason: string;
    status: string;
    requested_by: string;
    created_at: Date;
    employee_name: string;
  }>>`
    SELECT c.id, c.employee_id, a.attendance_date, c.original_state, c.proposed_state,
           c.reason, c.status, c.requested_by, c.created_at, u.name AS employee_name
    FROM campusos_workforce.attendance_corrections c
    LEFT JOIN campusos_workforce.staff_attendance a ON a.id = c.attendance_id
    LEFT JOIN campusos_workforce.employee_profiles p ON p.id = c.employee_id
    LEFT JOIN public.users u ON u.id = p.user_id
    WHERE c.tenant_id = ${context.tenantId}::uuid AND c.id = ${correctionId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Attendance correction not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    attendanceDate: row.attendance_date ? dateOnly(row.attendance_date, 'UTC') : null,
    originalState: row.original_state ?? {},
    proposedState: row.proposed_state ?? {},
    reason: row.reason,
    status: row.status as AttendanceCorrectionView['status'],
    requestedBy: row.requested_by,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Leave
// ---------------------------------------------------------------------------

export async function createLeavePolicy(
  context: ActiveUserContext,
  input: {
    code: string;
    name: string;
    leaveType: string;
    defaultDays: number;
    accrualEnabled?: boolean;
    accrualPerYear?: number;
    carryForwardLimit?: number;
    isPaid?: boolean;
    requiresApproval?: boolean;
    appliesTo?: string[];
  },
): Promise<{ id: string; code: string; name: string }> {
  assertWorkforcePermission(isWorkforceConfigurator(context), 'workforce:leave:policies');
  const code = input.code.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
  if (!code) throw new WorkforceError('Leave policy code is required.', 400);
  if (!input.name.trim()) throw new WorkforceError('Leave policy name is required.', 400);
  if (input.defaultDays < 0) throw new WorkforceError('Default days cannot be negative.', 400);

  const policyId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.leave_policies
      (id, tenant_id, code, name, leave_type, default_days, accrual_enabled, accrual_per_year,
       carry_forward_limit, is_paid, requires_approval, applies_to, status, created_by, created_at, updated_at)
    VALUES
      (${policyId}::uuid, ${context.tenantId}::uuid, ${code}, ${input.name}, ${input.leaveType},
       ${input.defaultDays}, ${input.accrualEnabled ?? false}, ${input.accrualPerYear ?? 0},
       ${input.carryForwardLimit ?? 0}, ${input.isPaid ?? true}, ${input.requiresApproval ?? true},
       ${JSON.stringify(input.appliesTo ?? ['ALL'])}::jsonb, 'ACTIVE', ${context.userId}::uuid, now(), now())
  `;
  await writeWorkforceAudit(context, 'LEAVE_POLICY_CREATED', 'leave_policies', policyId, null, input, 'Leave policy created');
  return { id: policyId, code, name: input.name };
}

export async function listLeavePolicies(context: ActiveUserContext): Promise<Array<{ id: string; code: string; name: string; leaveType: string; defaultDays: number; isPaid: boolean; status: string }>> {
  const rows = await prisma.$queryRaw<Array<{ id: string; code: string; name: string; leave_type: string; default_days: bigint | number; is_paid: boolean; status: string }>>`
    SELECT id, code, name, leave_type, default_days, is_paid, status
    FROM campusos_workforce.leave_policies
    WHERE tenant_id = ${context.tenantId}::uuid AND status = 'ACTIVE'
    ORDER BY name
  `;
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    leaveType: row.leave_type,
    defaultDays: dbNumber(row.default_days),
    isPaid: parseBooleanRow(row.is_paid),
    status: row.status,
  }));
}

export async function getLeaveBalances(context: ActiveUserContext, employeeId?: string): Promise<LeaveBalanceView[]> {
  let targetEmployeeId = employeeId;
  if (!targetEmployeeId) {
    const employee = await requireOwnEmployee(context);
    targetEmployeeId = employee.id;
  } else if (!isWorkforceOperator(context)) {
    const own = await requireOwnEmployee(context);
    if (own.id !== targetEmployeeId) throw new WorkforceError('You may only view your own leave balances.', 403);
  }

  const policies = await prisma.$queryRaw<Array<{ id: string; code: string; name: string; leave_type: string; default_days: bigint | number; is_paid: boolean }>>`
    SELECT id, code, name, leave_type, default_days, is_paid
    FROM campusos_workforce.leave_policies
    WHERE tenant_id = ${context.tenantId}::uuid AND status = 'ACTIVE'
    ORDER BY name
  `;

  const ledger = await prisma.$queryRaw<Array<{ policy_id: string; entry_type: string; amount: number }>>`
    SELECT policy_id, entry_type, amount
    FROM campusos_workforce.leave_ledger
    WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${targetEmployeeId}::uuid
  `;

  // Ledger amounts are signed: USED/EXPIRED are stored negative, EARNED and
  // RESTORED/CANCELLED positive, ADJUSTMENT either. Buckets below carry the
  // magnitude so the closing formula is `opening + earned + adjusted +
  // restored - used - expired` and can never double-count.
  const sums = new Map<string, Record<string, number>>();
  for (const entry of ledger) {
    const bucket = sums.get(entry.policy_id) ?? { OPENING: 0, EARNED: 0, USED: 0, ADJUSTMENT: 0, EXPIRED: 0, RESTORED: 0 };
    const magnitude = Math.abs(Number(entry.amount));
    const type = entry.entry_type;
    if (type === 'USED' || type === 'EXPIRED') {
      bucket[type] += magnitude;
    } else if (type === 'CANCELLED') {
      // Cancellation restores the balance: fold it into RESTORED so the closing
      // formula (opening + earned + adjusted + restored - used - expired) counts it.
      bucket.RESTORED += Number(entry.amount);
    } else {
      bucket[type as keyof typeof bucket] += Number(entry.amount);
    }
    sums.set(entry.policy_id, bucket);
  }

  return policies.map((policy) => {
    const bucket = sums.get(policy.id) ?? { OPENING: 0, EARNED: 0, USED: 0, ADJUSTMENT: 0, EXPIRED: 0, RESTORED: 0 };
    const opening = bucket.OPENING ?? 0;
    const earned = bucket.EARNED ?? 0;
    const used = bucket.USED ?? 0;
    const adjusted = bucket.ADJUSTMENT ?? 0;
    const expired = bucket.EXPIRED ?? 0;
    const restored = bucket.RESTORED ?? 0;
    // When no explicit OPENING ledger entry exists, the policy default is the
    // opening balance. This must hold even after USED/ADJUSTED entries exist
    // (otherwise the first deduction would silently zero out the opening).
    const effectiveOpening = opening === 0 ? dbNumber(policy.default_days) : opening;
    const closing = effectiveOpening + earned + adjusted + restored - used - expired;
    return {
      policyId: policy.id,
      code: policy.code,
      name: policy.name,
      leaveType: policy.leave_type,
      opening: effectiveOpening,
      earned,
      used,
      adjusted,
      expired,
      restored,
      closing,
      isPaid: parseBooleanRow(policy.is_paid),
    };
  });
}

/** Detects faculty timetable conflicts for a date range (server-side). */
async function detectTimetableConflicts(context: ActiveUserContext, staffId: string, startDate: string, endDate: string): Promise<Array<{ day: string; courseCode?: string; courseName?: string; time?: string }>> {
  const conflicts: Array<{ day: string; courseCode?: string; courseName?: string; time?: string }> = [];
  const dayCount = inclusiveDayCount(startDate, endDate);
  if (dayCount > 366) return conflicts;
  const days = new Set<number>();
  for (let index = 0; index < dayCount; index += 1) {
    days.add(weekdayOf(dateOnly(addDays(startDate, index), 'UTC')));
  }
  try {
    const slots = await prisma.timetableSlot.findMany({
      where: { courseOffering: { facultyId: staffId, tenantId: context.tenantId }, dayOfWeek: { in: [...days] } },
      include: { courseOffering: { include: { course: { select: { code: true, title: true } } } } },
    });
    for (const slot of slots) {
      conflicts.push({
        day: WEEKDAY_NAMES[slot.dayOfWeek] ?? String(slot.dayOfWeek),
        courseCode: slot.courseOffering.course.code,
        courseName: slot.courseOffering.course.title,
        time: `${slot.startTime}–${slot.endTime}`,
      });
    }
  } catch {
    // Timetable lookup is best-effort; leave request never fails because of it.
  }
  return conflicts;
}

export async function applyLeaveRequest(
  context: ActiveUserContext,
  input: { policyId: string; startDate: string; endDate: string; reason: string; supportingDocRef?: string },
): Promise<LeaveRequestView> {
  const employee = await requireOwnEmployee(context);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
    throw new WorkforceError('Leave dates must be valid YYYY-MM-DD dates.', 400);
  }
  if (input.endDate < input.startDate) throw new WorkforceError('Leave end date must not be before the start date.', 400);
  if (!input.reason.trim()) throw new WorkforceError('A reason is required.', 400);

  const policyRows = await prisma.$queryRaw<Array<{ id: string; code: string; name: string; default_days: bigint | number; requires_approval: boolean; is_paid: boolean }>>`
    SELECT id, code, name, default_days, requires_approval, is_paid
    FROM campusos_workforce.leave_policies
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${input.policyId}::uuid AND status = 'ACTIVE'
    LIMIT 1
  `;
  if (!policyRows[0]) throw new WorkforceError('Leave policy not found.', 404);

  const days = inclusiveDayCount(input.startDate, input.endDate);
  if (days > 366) throw new WorkforceError('Leave period is too long.', 400);

  const settings = await getWorkforceSettings(context.tenantId);
  if (settings.leaveBalanceEnforced) {
    const balances = await getLeaveBalances(context);
    const policy = balances.find((balance) => balance.policyId === input.policyId);
    if (policy && policy.leaveType !== 'UNPAID' && policy.closing < days) {
      throw new WorkforceError(`Insufficient leave balance: ${policy.code} has ${policy.closing} day(s) available.`, 400);
    }
  }

  // Faculty leave must surface scheduled-class conflicts for substitution work.
  const staffRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM public.staff WHERE tenant_id = ${context.tenantId}::uuid AND user_id = ${context.userId}::uuid LIMIT 1
  `;
  const conflicts = staffRows[0]
    ? await detectTimetableConflicts(context, staffRows[0].id, input.startDate, input.endDate)
    : [];

  const requestId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.leave_requests
      (id, tenant_id, employee_id, policy_id, start_date, end_date, days, reason,
       supporting_doc_ref, status, timetable_conflicts, created_at, updated_at)
    VALUES
      (${requestId}::uuid, ${context.tenantId}::uuid, ${employee.id}::uuid, ${input.policyId}::uuid,
       ${input.startDate}::date, ${input.endDate}::date, ${days}, ${input.reason},
       ${input.supportingDocRef ?? null}, 'SUBMITTED', ${JSON.stringify(conflicts)}::jsonb, now(), now())
  `;
  await writeWorkforceAudit(
    context,
    'LEAVE_REQUESTED',
    'leave_requests',
    requestId,
    null,
    { policyId: input.policyId, startDate: input.startDate, endDate: input.endDate, days },
    input.reason,
  );
  return getLeaveRequestById(context, requestId);
}

export async function reviewLeaveRequest(
  context: ActiveUserContext,
  requestId: string,
  input: { decision: 'APPROVE' | 'REJECT'; note?: string },
): Promise<LeaveRequestView> {
  assertWorkforcePermission(canApproveLeave(context), 'workforce:leave:approve');
  const current = await getLeaveRequestById(context, requestId);
  if (current.status !== 'SUBMITTED' && current.status !== 'MANAGER_APPROVAL' && current.status !== 'HR_REVIEW') {
    throw new WorkforceError('This leave request has already been decided.', 409);
  }
  const settings = await getWorkforceSettings(context.tenantId);

  await prisma.$transaction(async (tx) => {
    if (input.decision === 'APPROVE') {
      const nextStatus = settings.leaveApprovalMakerChecker && current.status === 'SUBMITTED' ? 'HR_REVIEW' : 'APPROVED';
      await tx.$executeRaw`
        UPDATE campusos_workforce.leave_requests
        SET status = ${nextStatus}, manager_user_id = ${context.userId}::uuid,
            manager_note = ${input.note ?? null}, manager_reviewed_at = now(), updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requestId}::uuid
      `;
      if (nextStatus === 'APPROVED') {
        // Deduct the leave balance exactly once. The unique partial index on
        // leave_ledger(employee_id, leave_request_id) for USED entries makes a
        // repeated approval call idempotent at the database level.
        const balances = await getLeaveBalances(context, current.employeeId);
        const policy = balances.find((balance) => balance.policyId === current.policyId);
        const closing = policy ? policy.closing : 0;
        await tx.$executeRaw`
          INSERT INTO campusos_workforce.leave_ledger
            (id, tenant_id, employee_id, policy_id, entry_type, amount, balance_after,
             leave_request_id, reason, actor_user_id, actor_role, created_at)
          VALUES
            (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${current.employeeId}::uuid,
             ${current.policyId}::uuid, 'USED', ${-current.days}, ${closing - current.days},
             ${requestId}::uuid, 'Approved leave', ${context.userId}::uuid, ${context.activeRole}, now())
          ON CONFLICT DO NOTHING
        `;
        await tx.$executeRaw`
          UPDATE campusos_workforce.leave_requests
          SET decided_by = ${context.userId}::uuid, decided_at = now(), updated_at = now()
          WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requestId}::uuid
        `;
      }
    } else {
      await tx.$executeRaw`
        UPDATE campusos_workforce.leave_requests
        SET status = 'REJECTED', decided_by = ${context.userId}::uuid, decided_at = now(),
            manager_note = ${input.note ?? null}, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requestId}::uuid
      `;
    }
  }, { timeout: 30_000 });

  await writeWorkforceAudit(
    context,
    input.decision === 'APPROVE' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
    'leave_requests',
    requestId,
    { status: current.status },
    { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    input.note,
  );
  return getLeaveRequestById(context, requestId);
}

export async function cancelLeaveRequest(context: ActiveUserContext, requestId: string): Promise<LeaveRequestView> {
  const current = await getLeaveRequestById(context, requestId);
  const own = await resolveEmployeeProfileForUser(context);
  if (own?.id !== current.employeeId && !isWorkforceOperator(context)) {
    throw new WorkforceError('You may only cancel your own leave requests.', 403);
  }
  if (current.status === 'APPROVED' || current.status === 'REJECTED') {
    throw new WorkforceError('A decided leave request cannot be cancelled by this flow.', 409);
  }
  const settings = await getWorkforceSettings(context.tenantId);

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_workforce.leave_requests
      SET status = 'CANCELLED', cancelled_at = now(), updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requestId}::uuid
    `;
    if (settings.leaveCancellationRestores) {
      const balances = await getLeaveBalances(context, current.employeeId);
      const policy = balances.find((balance) => balance.policyId === current.policyId);
      const closing = policy ? policy.closing : 0;
      await tx.$executeRaw`
        INSERT INTO campusos_workforce.leave_ledger
          (id, tenant_id, employee_id, policy_id, entry_type, amount, balance_after,
           leave_request_id, reason, actor_user_id, actor_role, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${current.employeeId}::uuid,
           ${current.policyId}::uuid, 'CANCELLED', ${current.days}, ${closing + current.days},
           ${requestId}::uuid, 'Leave request cancelled', ${context.userId}::uuid, ${context.activeRole}, now())
        ON CONFLICT DO NOTHING
      `;
    }
  }, { timeout: 30_000 });

  await writeWorkforceAudit(context, 'LEAVE_CANCELLED', 'leave_requests', requestId, { status: current.status }, { status: 'CANCELLED' }, 'Leave request cancelled');
  return getLeaveRequestById(context, requestId);
}

async function getLeaveRequestById(context: ActiveUserContext, requestId: string): Promise<LeaveRequestView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    policy_id: string;
    policy_code: string;
    policy_name: string;
    start_date: Date;
    end_date: Date;
    days: number;
    reason: string;
    status: string;
    timetable_conflicts: unknown;
    manager_reviewed_at: Date | null;
    hr_reviewed_at: Date | null;
    decided_at: Date | null;
    created_at: Date;
    employee_name: string;
  }>>`
    SELECT r.id, r.employee_id, r.policy_id, p.code AS policy_code, p.name AS policy_name,
           r.start_date, r.end_date, r.days, r.reason, r.status, r.timetable_conflicts,
           r.manager_reviewed_at, r.hr_reviewed_at, r.decided_at, r.created_at, u.name AS employee_name
    FROM campusos_workforce.leave_requests r
    JOIN campusos_workforce.leave_policies p ON p.id = r.policy_id
    JOIN campusos_workforce.employee_profiles e ON e.id = r.employee_id
    JOIN public.users u ON u.id = e.user_id
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.id = ${requestId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Leave request not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    policyId: row.policy_id,
    policyCode: row.policy_code,
    policyName: row.policy_name,
    startDate: dateOnly(row.start_date, 'UTC'),
    endDate: dateOnly(row.end_date, 'UTC'),
    days: row.days,
    reason: row.reason,
    status: row.status as LeaveRequestView['status'],
    timetableConflicts: Array.isArray(row.timetable_conflicts) ? row.timetable_conflicts : [],
    managerReviewedAt: row.manager_reviewed_at ? row.manager_reviewed_at.toISOString() : null,
    hrReviewedAt: row.hr_reviewed_at ? row.hr_reviewed_at.toISOString() : null,
    decidedAt: row.decided_at ? row.decided_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listLeaveRequests(
  context: ActiveUserContext,
  status?: string,
): Promise<LeaveRequestView[]> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    policy_id: string;
    policy_code: string;
    policy_name: string;
    start_date: Date;
    end_date: Date;
    days: number;
    reason: string;
    status: string;
    timetable_conflicts: unknown;
    manager_reviewed_at: Date | null;
    hr_reviewed_at: Date | null;
    decided_at: Date | null;
    created_at: Date;
    employee_name: string;
  }>>(Prisma.sql`
    SELECT r.id, r.employee_id, r.policy_id, p.code AS policy_code, p.name AS policy_name,
           r.start_date, r.end_date, r.days, r.reason, r.status, r.timetable_conflicts,
           r.manager_reviewed_at, r.hr_reviewed_at, r.decided_at, r.created_at, u.name AS employee_name
    FROM campusos_workforce.leave_requests r
    JOIN campusos_workforce.leave_policies p ON p.id = r.policy_id
    JOIN campusos_workforce.employee_profiles e ON e.id = r.employee_id
    JOIN public.users u ON u.id = e.user_id
    WHERE r.tenant_id = ${context.tenantId}::uuid
      ${status ? Prisma.sql`AND r.status = ${status}` : Prisma.empty}
    ORDER BY r.created_at DESC
    LIMIT 200
  `);
  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    policyId: row.policy_id,
    policyCode: row.policy_code,
    policyName: row.policy_name,
    startDate: dateOnly(row.start_date, 'UTC'),
    endDate: dateOnly(row.end_date, 'UTC'),
    days: row.days,
    reason: row.reason,
    status: row.status as LeaveRequestView['status'],
    timetableConflicts: Array.isArray(row.timetable_conflicts) ? row.timetable_conflicts : [],
    managerReviewedAt: row.manager_reviewed_at ? row.manager_reviewed_at.toISOString() : null,
    hrReviewedAt: row.hr_reviewed_at ? row.hr_reviewed_at.toISOString() : null,
    decidedAt: row.decided_at ? row.decided_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Payroll
// ---------------------------------------------------------------------------

export async function createPayrollPeriod(
  context: ActiveUserContext,
  input: { periodKey: string; periodLabel: string; cycle?: string; startDate: string; endDate: string; notes?: string },
): Promise<PayrollPeriodView> {
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:periods:create');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) {
    throw new WorkforceError('Payroll period dates must be valid YYYY-MM-DD dates.', 400);
  }
  if (input.endDate < input.startDate) throw new WorkforceError('Payroll period end must not be before the start.', 400);
  const periodKey = input.periodKey.trim();
  if (!periodKey) throw new WorkforceError('A period key is required.', 400);

  const periodId = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_workforce.payroll_periods
        (id, tenant_id, period_key, period_label, cycle, start_date, end_date, status,
         prepared_by, notes, created_at, updated_at)
      VALUES
        (${periodId}::uuid, ${context.tenantId}::uuid, ${periodKey}, ${input.periodLabel},
         ${input.cycle ?? 'MONTHLY'}, ${input.startDate}::date, ${input.endDate}::date, 'DRAFT',
         ${context.userId}::uuid, ${input.notes ?? null}, now(), now())
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('payroll_periods_key_uq')) {
      throw new WorkforceError('A payroll period with this key already exists.', 409);
    }
    throw error;
  }
  await writeWorkforceAudit(context, 'PAYROLL_PERIOD_CREATED', 'payroll_periods', periodId, null, input, 'Payroll period created');
  return getPayrollPeriod(context, periodId);
}

export async function getPayrollPeriod(context: ActiveUserContext, periodId: string): Promise<PayrollPeriodView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    period_key: string;
    period_label: string;
    cycle: string;
    start_date: Date;
    end_date: Date;
    status: string;
    prepared_by: string | null;
    reviewed_by: string | null;
    approved_by: string | null;
    approved_at: Date | null;
    disbursed_at: Date | null;
    notes: string | null;
  }>>`
    SELECT id, period_key, period_label, cycle, start_date, end_date, status,
           prepared_by, reviewed_by, approved_by, approved_at, disbursed_at, notes
    FROM campusos_workforce.payroll_periods
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Payroll period not found.', 404);
  const row = rows[0];
  const entries = await listPayrollEntries(context, periodId);
  return {
    id: row.id,
    periodKey: row.period_key,
    periodLabel: row.period_label,
    cycle: row.cycle,
    startDate: dateOnly(row.start_date, 'UTC'),
    endDate: dateOnly(row.end_date, 'UTC'),
    status: row.status as PayrollPeriodView['status'],
    preparedBy: row.prepared_by,
    reviewedBy: row.reviewed_by,
    approvedBy: row.approved_by,
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
    disbursedAt: row.disbursed_at ? row.disbursed_at.toISOString() : null,
    notes: row.notes,
    entries,
  };
}

async function listPayrollEntries(context: ActiveUserContext, periodId: string): Promise<PayrollPeriodView['entries']> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    employee_name: string;
    employee_number: string;
    earnings: unknown;
    deductions: unknown;
    gross_minor: bigint | number | string;
    total_deduction_minor: bigint | number | string;
    net_minor: bigint | number | string;
    currency: string;
    status: string;
    exceptions: unknown;
  }>>`
    SELECT e.id, e.employee_id, u.name AS employee_name, p.employee_number,
           e.earnings, e.deductions, e.gross_minor, e.total_deduction_minor, e.net_minor,
           e.currency, e.status, e.exceptions
    FROM campusos_workforce.payroll_entries e
    JOIN campusos_workforce.employee_profiles p ON p.id = e.employee_id
    JOIN public.users u ON u.id = p.user_id
    WHERE e.tenant_id = ${context.tenantId}::uuid AND e.period_id = ${periodId}::uuid
    ORDER BY u.name
  `;
  return rows.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    employeeNumber: row.employee_number,
    earnings: Array.isArray(row.earnings) ? (row.earnings as PayrollPeriodView['entries'][number]['earnings']) : [],
    deductions: Array.isArray(row.deductions) ? (row.deductions as PayrollPeriodView['entries'][number]['deductions']) : [],
    grossMinor: dbNumber(row.gross_minor),
    totalDeductionMinor: dbNumber(row.total_deduction_minor),
    netMinor: dbNumber(row.net_minor),
    currency: row.currency,
    status: row.status as PayrollPeriodView['entries'][number]['status'],
    exceptions: Array.isArray(row.exceptions) ? (row.exceptions as PayrollPeriodView['entries'][number]['exceptions']) : [],
  }));
}

/**
 * Runs payroll for a period. Idempotent: re-running never duplicates entries
 * (unique period_id + employee_id) and skips employees already processed.
 * Compensation, proration, unpaid leave and overtime are all computed
 * server-side from frozen snapshots.
 */
export async function runPayroll(
  context: ActiveUserContext,
  periodId: string,
): Promise<{ processed: number; skipped: number; exceptions: number }> {
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:run');
  const period = await getPayrollPeriod(context, periodId);
  if (period.status === 'CLOSED' || period.status === 'PAID') {
    throw new WorkforceError('Closed or paid payroll periods cannot be regenerated.', 409);
  }
  const settings = await getWorkforceSettings(context.tenantId);

  const employees = await prisma.$queryRaw<Array<{
    id: string;
    staff_id: string;
    employee_number: string;
    joining_date: Date;
    last_working_day: Date | null;
    employment_status: string;
    bank_account_masked: string | null;
  }>>`
    SELECT id, staff_id, employee_number, joining_date, last_working_day, employment_status, bank_account_masked
    FROM campusos_workforce.employee_profiles
    WHERE tenant_id = ${context.tenantId}::uuid
      AND employment_status IN ('ACTIVE', 'PROBATION', 'ON_LEAVE', 'NOTICE_PERIOD', 'SEPARATION_PENDING')
  `;

  let processed = 0;
  let skipped = 0;
  let exceptions = 0;

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_workforce.payroll_periods
      SET status = 'PROCESSING', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
    `;

    for (const employee of employees) {
      // Skip employees already processed in this period (idempotency).
      const existing = await tx.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM campusos_workforce.payroll_entries
        WHERE tenant_id = ${context.tenantId}::uuid AND period_id = ${periodId}::uuid AND employee_id = ${employee.id}::uuid
        LIMIT 1
      `;
      if (existing[0]) {
        skipped += 1;
        continue;
      }

      const compensation = await tx.$queryRaw<Array<{
        id: string;
        base_pay_minor: bigint | number | string;
        earnings: unknown;
        deductions: unknown;
        gross_minor: bigint | number | string;
        currency: string;
      }>>`
        SELECT id, base_pay_minor, earnings, deductions, gross_minor, currency
        FROM campusos_workforce.compensation_versions
        WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employee.id}::uuid
          AND status = 'ACTIVE' AND effective_from <= ${period.endDate}::date
        ORDER BY effective_from DESC
        LIMIT 1
      `;

      const entryExceptions: Array<{ code: string; message: string }> = [];
      if (!compensation[0]) {
        entryExceptions.push({ code: 'MISSING_COMPENSATION', message: 'No active compensation structure for this period.' });
      }
      if (!employee.bank_account_masked && settings.payrollRequireDisbursementConfirmation) {
        entryExceptions.push({ code: 'MISSING_BANK', message: 'Bank account details are missing.' });
      }

      const grossBase = compensation[0] ? dbNumber(compensation[0].gross_minor) : 0;
      const currency = compensation[0]?.currency ?? 'INR';
      const earningsList = compensation[0] && Array.isArray(compensation[0].earnings)
        ? (compensation[0].earnings as Array<{ code: string; label: string; amount_minor: bigint | number | string }>)
        : [];
      const deductionList = compensation[0] && Array.isArray(compensation[0].deductions)
        ? (compensation[0].deductions as Array<{ code: string; label: string; amount_minor: bigint | number | string; percentage?: number }>)
        : [];

      // Deterministic proration for new joiners / exits.
      let proration = 1;
      const periodDays = inclusiveDayCount(period.startDate, period.endDate);
      const joinDate = dateOnly(employee.joining_date, 'UTC');
      if (joinDate > period.startDate) {
        proration = inclusiveDayCount(joinDate, period.endDate) / Math.max(1, periodDays);
      }
      const lastDay = employee.last_working_day ? dateOnly(employee.last_working_day, 'UTC') : null;
      if (lastDay && lastDay < period.endDate) {
        proration = Math.min(proration, inclusiveDayCount(period.startDate, lastDay) / Math.max(1, periodDays));
      }
      proration = Math.max(0, Math.min(1, proration));

      const proratedEarnings = earningsList.map((item) => ({
        code: item.code,
        label: item.label,
        amount_minor: roundMinor(dbNumber(item.amount_minor) * proration),
      }));
      const proratedBase = roundMinor(grossBase * proration);

      // Unpaid leave deduction from approved UNPAID leave overlapping the period.
      const unpaidLeave = await tx.$queryRaw<Array<{ days: bigint | number }>>`
        SELECT COALESCE(SUM(r.days), 0) AS days
        FROM campusos_workforce.leave_requests r
        JOIN campusos_workforce.leave_policies p ON p.id = r.policy_id
        WHERE r.tenant_id = ${context.tenantId}::uuid
          AND r.employee_id = ${employee.id}::uuid
          AND r.status = 'APPROVED'
          AND p.leave_type = 'UNPAID'
          AND r.end_date >= ${period.startDate}::date
          AND r.start_date <= ${period.endDate}::date
      `;
      const unpaidDays = dbNumber(unpaidLeave[0]?.days ?? 0);
      const perDayMinor = settings.payrollMonthlyDivisor > 0
        ? roundMinor(proratedBase / settings.payrollMonthlyDivisor)
        : 0;
      const unpaidDeductionMinor = roundMinor(perDayMinor * unpaidDays);

      // Approved overtime with payroll eligibility.
      const overtime = await tx.$queryRaw<Array<{ minutes: bigint | number }>>`
        SELECT COALESCE(SUM(approved_minutes), 0) AS minutes
        FROM campusos_workforce.overtime_requests
        WHERE tenant_id = ${context.tenantId}::uuid
          AND employee_id = ${employee.id}::uuid
          AND status = 'APPROVED' AND payroll_eligible = true
          AND work_date BETWEEN ${period.startDate}::date AND ${period.endDate}::date
      `;
      const overtimeMinutes = dbNumber(overtime[0]?.minutes ?? 0);
      const overtimeRate = await tx.$queryRaw<Array<{ rate: bigint | number }>>`
        SELECT COALESCE(max(hourly_rate_minor), 0) AS rate
        FROM campusos_workforce.overtime_requests
        WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employee.id}::uuid
          AND status = 'APPROVED' AND payroll_eligible = true
      `;
      const overtimeMinor = overtimeRate[0]
        ? roundMinor((overtimeMinutes / 60) * dbNumber(overtimeRate[0].rate))
        : 0;

      // Approved payroll adjustments in the period.
      const adjustments = await tx.$queryRaw<Array<{ total: bigint | number | null }>>`
        SELECT COALESCE(SUM(amount_minor), 0) AS total
        FROM campusos_workforce.payroll_adjustments
        WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${employee.id}::uuid
          AND period_id = ${periodId}::uuid AND status = 'APPROVED'
      `;
      const adjustmentMinor = dbNumber(adjustments[0]?.total ?? 0);

      const grossMinor = roundMinor(proratedBase + overtimeMinor + (adjustmentMinor > 0 ? adjustmentMinor : 0));
      const deductionMinor = roundMinor(
        sumMinor(deductionList.map((item) => dbNumber(item.amount_minor))) + unpaidDeductionMinor + (adjustmentMinor < 0 ? -adjustmentMinor : 0),
      );
      const netMinor = nonNegativeMinor(grossMinor - deductionMinor);

      if (netMinor === 0 && grossMinor > 0) {
        entryExceptions.push({ code: 'NEGATIVE_NET', message: 'Deductions exceed earnings for this period.' });
      }

      const snapshotId = randomUUID();
      await tx.$executeRaw`
        INSERT INTO campusos_workforce.payroll_snapshots
          (id, tenant_id, period_id, employee_id, compensation_version_id, attendance_input,
           leave_input, adjustments_input, proration_rule, frozen_at)
        VALUES
          (${snapshotId}::uuid, ${context.tenantId}::uuid, ${periodId}::uuid, ${employee.id}::uuid,
           ${compensation[0]?.id ?? '00000000-0000-4000-8000-000000000000'}::uuid,
           ${JSON.stringify({ proration, overtimeMinutes, unpaidDays })}::jsonb,
           ${JSON.stringify({ unpaidDays })}::jsonb,
           ${JSON.stringify({ adjustmentMinor })}::jsonb,
           ${JSON.stringify({ basis: settings.unpaidLeaveBasis, monthlyDivisor: settings.payrollMonthlyDivisor })}::jsonb,
           now())
        ON CONFLICT (period_id, employee_id) DO NOTHING
      `;

      const earningsView = [...proratedEarnings, ...(overtimeMinor > 0 ? [{ code: 'OVERTIME', label: 'Approved overtime', amount_minor: overtimeMinor }] : []),
        ...(adjustmentMinor > 0 ? [{ code: 'ADJUSTMENT', label: 'Approved adjustment', amount_minor: adjustmentMinor }] : [])];
      const deductionsView = [...deductionList.map((item) => ({
        code: item.code,
        label: item.label,
        amount_minor: dbNumber(item.amount_minor),
      })),
      ...(unpaidDeductionMinor > 0 ? [{ code: 'UNPAID_LEAVE', label: 'Unpaid leave', amount_minor: unpaidDeductionMinor }] : []),
      ...(adjustmentMinor < 0 ? [{ code: 'RECOVERY', label: 'Approved recovery', amount_minor: -adjustmentMinor }] : [])];

      const entryStatus = entryExceptions.length > 0 ? 'EXCEPTION' : 'READY';
      if (entryExceptions.length > 0) exceptions += 1;

      await tx.$executeRaw`
        INSERT INTO campusos_workforce.payroll_entries
          (id, tenant_id, period_id, employee_id, snapshot_id, earnings, deductions,
           gross_minor, total_deduction_minor, net_minor, currency, status, exceptions,
           created_at, updated_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${periodId}::uuid, ${employee.id}::uuid,
           ${snapshotId}::uuid, ${JSON.stringify(earningsView)}::jsonb,
           ${JSON.stringify(deductionsView)}::jsonb, ${grossMinor}, ${deductionMinor}, ${netMinor},
           ${currency}, ${entryStatus}, ${JSON.stringify(entryExceptions)}::jsonb, now(), now())
        ON CONFLICT (period_id, employee_id) DO NOTHING
      `;
      processed += 1;
    }

    const entryCount = await tx.$queryRaw<Array<{ count: bigint | number }>>`
      SELECT count(*) AS count FROM campusos_workforce.payroll_entries
      WHERE tenant_id = ${context.tenantId}::uuid AND period_id = ${periodId}::uuid
    `;
    await tx.$executeRaw`
      UPDATE campusos_workforce.payroll_periods
      SET status = ${dbNumber(entryCount[0]?.count ?? 0) > 0 ? 'REVIEW' : 'DRAFT'}, updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
    `;
  }, { timeout: 120_000 });

  await writeWorkforceAudit(context, 'PAYROLL_RUN', 'payroll_periods', periodId, null, { processed, skipped, exceptions }, 'Payroll run completed');
  return { processed, skipped, exceptions };
}

export async function reviewPayrollPeriod(
  context: ActiveUserContext,
  periodId: string,
  input: { decision: 'APPROVE' | 'RETURN'; note?: string },
): Promise<PayrollPeriodView> {
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:review');
  const period = await getPayrollPeriod(context, periodId);
  if (period.status !== 'REVIEW' && period.status !== 'APPROVAL_PENDING') {
    throw new WorkforceError('This payroll period is not awaiting review.', 409);
  }

  if (input.decision === 'APPROVE') {
    assertWorkforcePermission(canApprovePayroll(context), 'payroll:approve');
    const settings = await getWorkforceSettings(context.tenantId);
    if (settings.payrollMakerChecker && !makerCheckerSeparated(context, period.preparedBy ?? '')) {
      throw new WorkforceError('Payroll maker-checker requires a different reviewer to approve this run.', 403);
    }
    await prisma.$executeRaw`
      UPDATE campusos_workforce.payroll_periods
      SET status = 'APPROVAL_PENDING', reviewed_by = ${context.userId}::uuid, updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
    `;
  } else {
    await prisma.$executeRaw`
      UPDATE campusos_workforce.payroll_periods
      SET status = 'REVIEW', notes = ${input.note ?? null}, updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
    `;
  }
  await writeWorkforceAudit(context, 'PAYROLL_REVIEWED', 'payroll_periods', periodId, { status: period.status }, { decision: input.decision }, input.note);
  return getPayrollPeriod(context, periodId);
}

export async function approvePayrollPeriod(context: ActiveUserContext, periodId: string, note?: string): Promise<PayrollPeriodView> {
  assertWorkforcePermission(canApprovePayroll(context), 'payroll:approve');
  const period = await getPayrollPeriod(context, periodId);
  if (period.status !== 'APPROVAL_PENDING') {
    throw new WorkforceError('This payroll period is not awaiting final approval.', 409);
  }
  const settings = await getWorkforceSettings(context.tenantId);
  if (settings.payrollMakerChecker && !makerCheckerSeparated(context, period.reviewedBy ?? period.preparedBy ?? '')) {
    throw new WorkforceError('Payroll maker-checker requires a different account to approve this run.', 403);
  }
  await prisma.$executeRaw`
    UPDATE campusos_workforce.payroll_periods
    SET status = 'APPROVED', approved_by = ${context.userId}::uuid, approved_at = now(),
        notes = ${note ?? null}, updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
  `;
  await prisma.$executeRaw`
    UPDATE campusos_workforce.payroll_entries
    SET status = 'APPROVED', updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND period_id = ${periodId}::uuid AND status IN ('READY', 'REVIEW')
  `;
  await writeWorkforceAudit(context, 'PAYROLL_APPROVED', 'payroll_periods', periodId, { status: period.status }, { status: 'APPROVED' }, note);
  return getPayrollPeriod(context, periodId);
}

export async function markPayrollDisbursed(
  context: ActiveUserContext,
  periodId: string,
  input: { method?: string; fileReference?: string },
): Promise<PayrollPeriodView> {
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:disburse');
  const period = await getPayrollPeriod(context, periodId);
  if (period.status !== 'APPROVED' && period.status !== 'DISBURSEMENT_PENDING') {
    throw new WorkforceError('Payroll must be approved before disbursement.', 409);
  }
  const settings = await getWorkforceSettings(context.tenantId);
  if (settings.payrollRequireDisbursementConfirmation && !input.fileReference && input.method === 'BANK_FILE') {
    throw new WorkforceError('A bank file reference is required to confirm disbursement.', 400);
  }

  const totalNet = period.entries.reduce((sum, entry) => sum + entry.netMinor, 0);
  const disbursementId = randomUUID();
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      INSERT INTO campusos_workforce.payroll_disbursements
        (id, tenant_id, period_id, method, file_reference, total_net_minor, status,
         sent_at, success_count, fail_count, created_by, created_at, updated_at)
      VALUES
        (${disbursementId}::uuid, ${context.tenantId}::uuid, ${periodId}::uuid,
         ${input.method ?? 'BANK_TRANSFER'}, ${input.fileReference ?? null}, ${totalNet},
         'SUCCESS', now(), ${period.entries.length}, 0, ${context.userId}::uuid, now(), now())
    `;
    await tx.$executeRaw`
      UPDATE campusos_workforce.payroll_periods
      SET status = 'PAID', disbursed_at = now(), updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${periodId}::uuid
    `;
    await tx.$executeRaw`
      UPDATE campusos_workforce.payroll_entries
      SET status = 'PAID', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND period_id = ${periodId}::uuid AND status = 'APPROVED'
    `;
    // Generate payslips only for confirmed disbursement.
    const entries = await tx.$queryRaw<Array<{ id: string; employee_id: string; gross_minor: bigint | number | string; net_minor: bigint | number | string; currency: string }>>`
      SELECT id, employee_id, gross_minor, net_minor, currency
      FROM campusos_workforce.payroll_entries
      WHERE tenant_id = ${context.tenantId}::uuid AND period_id = ${periodId}::uuid AND status = 'PAID'
    `;
    let index = 1;
    for (const entry of entries) {
      const payslipNumber = `${period.periodKey}/PS/${String(index).padStart(4, '0')}`;
      const verifyReference = `PS-${randomUUID().slice(0, 8).toUpperCase()}`;
      await tx.$executeRaw`
        INSERT INTO campusos_workforce.payslip_registry
          (id, tenant_id, employee_id, period_id, entry_id, payslip_number, verify_reference,
           gross_minor, net_minor, currency, status, issued_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${entry.employee_id}::uuid,
           ${periodId}::uuid, ${entry.id}::uuid, ${payslipNumber}, ${verifyReference},
           ${dbNumber(entry.gross_minor)}, ${dbNumber(entry.net_minor)}, ${entry.currency}, 'VALID', now())
        ON CONFLICT (entry_id) DO NOTHING
      `;
      index += 1;
    }
  }, { timeout: 60_000 });

  await writeWorkforceAudit(context, 'PAYROLL_DISBURSED', 'payroll_periods', periodId, { status: period.status }, { status: 'PAID', method: input.method }, 'Payroll disbursement confirmed');
  return getPayrollPeriod(context, periodId);
}

export async function getMyPayslips(context: ActiveUserContext): Promise<PayslipView[]> {
  const employee = await requireOwnEmployee(context);
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    payslip_number: string;
    verify_reference: string;
    period_label: string;
    period_start: Date;
    period_end: Date;
    gross_minor: bigint | number | string;
    net_minor: bigint | number | string;
    currency: string;
    status: string;
    issued_at: Date;
  }>>`
    SELECT ps.id, ps.payslip_number, ps.verify_reference, pp.period_label,
           pp.start_date AS period_start, pp.end_date AS period_end,
           ps.gross_minor, ps.net_minor, ps.currency, ps.status, ps.issued_at
    FROM campusos_workforce.payslip_registry ps
    JOIN campusos_workforce.payroll_periods pp ON pp.id = ps.period_id
    WHERE ps.tenant_id = ${context.tenantId}::uuid AND ps.employee_id = ${employee.id}::uuid
    ORDER BY ps.issued_at DESC
    LIMIT 60
  `;
  return rows.map((row) => ({
    id: row.id,
    payslipNumber: row.payslip_number,
    verifyReference: row.verify_reference,
    periodLabel: row.period_label,
    periodStart: dateOnly(row.period_start, 'UTC'),
    periodEnd: dateOnly(row.period_end, 'UTC'),
    grossMinor: dbNumber(row.gross_minor),
    netMinor: dbNumber(row.net_minor),
    currency: row.currency,
    status: row.status,
    issuedAt: row.issued_at.toISOString(),
  }));
}

// ---------------------------------------------------------------------------
// Reimbursements
// ---------------------------------------------------------------------------

export async function submitReimbursement(
  context: ActiveUserContext,
  input: { category: string; amountMinor: MoneyMinor; reason: string; documentRefs?: string[] },
): Promise<ReimbursementClaimView> {
  const employee = await requireOwnEmployee(context);
  if (!input.reason.trim()) throw new WorkforceError('A reason is required.', 400);
  if (input.amountMinor <= 0) throw new WorkforceError('Reimbursement amount must be positive.', 400);

  const claimId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.reimbursement_claims
      (id, tenant_id, employee_id, category, amount_minor, currency, reason, document_refs,
       status, requested_by, created_at)
    VALUES
      (${claimId}::uuid, ${context.tenantId}::uuid, ${employee.id}::uuid, ${input.category},
       ${input.amountMinor}, 'INR', ${input.reason}, ${JSON.stringify(input.documentRefs ?? [])}::jsonb,
       'SUBMITTED', ${context.userId}::uuid, now())
  `;
  await writeWorkforceAudit(context, 'REIMBURSEMENT_SUBMITTED', 'reimbursement_claims', claimId, null, input, input.reason);
  return getReimbursementById(context, claimId);
}

export async function reviewReimbursement(
  context: ActiveUserContext,
  claimId: string,
  input: { decision: 'APPROVE' | 'REJECT'; note?: string },
): Promise<ReimbursementClaimView> {
  assertWorkforcePermission(canReviewReimbursements(context), 'workforce:reimbursements:review');
  const current = await getReimbursementById(context, claimId);
  if (current.status !== 'SUBMITTED' && current.status !== 'MANAGER_APPROVAL' && current.status !== 'FINANCE_REVIEW') {
    throw new WorkforceError('This reimbursement claim has already been decided.', 409);
  }
  await prisma.$executeRaw`
    UPDATE campusos_workforce.reimbursement_claims
    SET status = ${input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED'},
        reviewed_by = ${context.userId}::uuid, review_note = ${input.note ?? null},
        reviewed_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${claimId}::uuid
  `;
  await writeWorkforceAudit(
    context,
    input.decision === 'APPROVE' ? 'REIMBURSEMENT_APPROVED' : 'REIMBURSEMENT_REJECTED',
    'reimbursement_claims',
    claimId,
    { status: current.status },
    { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED' },
    input.note,
  );
  return getReimbursementById(context, claimId);
}

async function getReimbursementById(context: ActiveUserContext, claimId: string): Promise<ReimbursementClaimView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    employee_name: string;
    category: string;
    amount_minor: bigint | number | string;
    currency: string;
    reason: string;
    status: string;
    created_at: Date;
  }>>`
    SELECT c.id, c.employee_id, u.name AS employee_name, c.category, c.amount_minor,
           c.currency, c.reason, c.status, c.created_at
    FROM campusos_workforce.reimbursement_claims c
    JOIN campusos_workforce.employee_profiles p ON p.id = c.employee_id
    JOIN public.users u ON u.id = p.user_id
    WHERE c.tenant_id = ${context.tenantId}::uuid AND c.id = ${claimId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Reimbursement claim not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    category: row.category,
    amountMinor: dbNumber(row.amount_minor),
    currency: row.currency,
    reason: row.reason,
    status: row.status,
    createdAt: row.created_at.toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Exit: resignations, clearances, final settlement
// ---------------------------------------------------------------------------

export async function submitResignation(
  context: ActiveUserContext,
  input: { proposedLastWorkingDay: string; reason: string },
): Promise<ResignationRequestView> {
  const employee = await requireOwnEmployee(context);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.proposedLastWorkingDay)) {
    throw new WorkforceError('Last working day must be a valid YYYY-MM-DD date.', 400);
  }
  if (!input.reason.trim()) throw new WorkforceError('A reason is required.', 400);

  const settings = await getWorkforceSettings(context.tenantId);
  const today = dateOnly(new Date(), settings.timezone);
  if (input.proposedLastWorkingDay < today) {
    throw new WorkforceError('The proposed last working day cannot be in the past.', 400);
  }
  // The employee cannot pick an arbitrary date as authoritative: the configured
  // notice period defines the earliest acceptable last working day unless HR
  // later approves a waiver during the review step.
  if (settings.noticePeriodDays > 0) {
    const earliest = addDays(input.proposedLastWorkingDay, -settings.noticePeriodDays);
    if (dateOnly(earliest, settings.timezone) < today) {
      throw new WorkforceError(
        `A minimum notice period of ${settings.noticePeriodDays} day(s) applies from today. An HR review may approve a shorter notice.`,
        400,
      );
    }
  }

  const requestId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.resignation_requests
      (id, tenant_id, employee_id, submission_date, proposed_last_working_day,
       notice_period_days, reason, status, created_at, updated_at)
    VALUES
      (${requestId}::uuid, ${context.tenantId}::uuid, ${employee.id}::uuid, ${today}::date,
       ${input.proposedLastWorkingDay}::date, ${settings.noticePeriodDays}, ${input.reason},
       'SUBMITTED', now(), now())
  `;
  await writeWorkforceAudit(context, 'RESIGNATION_SUBMITTED', 'resignation_requests', requestId, null, input, input.reason);
  return getResignationById(context, requestId);
}

export async function reviewResignation(
  context: ActiveUserContext,
  requestId: string,
  input: { decision: 'APPROVE' | 'REJECT'; note?: string; finalLastWorkingDay?: string },
): Promise<ResignationRequestView> {
  assertWorkforcePermission(canReviewExits(context), 'workforce:exits:review');
  const current = await getResignationById(context, requestId);
  if (current.status !== 'SUBMITTED' && current.status !== 'MANAGER_REVIEW' && current.status !== 'HR_REVIEW') {
    throw new WorkforceError('This resignation request has already been decided.', 409);
  }
  const finalDay = input.finalLastWorkingDay ?? current.proposedLastWorkingDay;

  await prisma.$transaction(async (tx) => {
    if (input.decision === 'APPROVE') {
      await tx.$executeRaw`
        UPDATE campusos_workforce.resignation_requests
        SET status = 'APPROVED', hr_user_id = ${context.userId}::uuid, hr_note = ${input.note ?? null},
            hr_reviewed_at = now(), final_last_working_day = ${finalDay}::date, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requestId}::uuid
      `;
      await tx.$executeRaw`
        UPDATE campusos_workforce.employee_profiles
        SET employment_status = 'NOTICE_PERIOD', last_working_day = ${finalDay}::date, updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${current.employeeId}::uuid
      `;
      // Create the standard clearance checklist.
      const departments = ['Department', 'IT', 'Library', 'Finance', 'Administration', 'Assets'];
      for (const department of departments) {
        await tx.$executeRaw`
          INSERT INTO campusos_workforce.clearance_items
            (id, tenant_id, resignation_id, employee_id, department, status, created_at)
          VALUES
            (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${requestId}::uuid,
             ${current.employeeId}::uuid, ${department}, 'PENDING', now())
        `;
      }
    } else {
      await tx.$executeRaw`
        UPDATE campusos_workforce.resignation_requests
        SET status = 'REJECTED', hr_user_id = ${context.userId}::uuid, hr_note = ${input.note ?? null},
            hr_reviewed_at = now(), updated_at = now()
        WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requestId}::uuid
      `;
    }
  }, { timeout: 30_000 });

  await writeWorkforceAudit(
    context,
    input.decision === 'APPROVE' ? 'RESIGNATION_APPROVED' : 'RESIGNATION_REJECTED',
    'resignation_requests',
    requestId,
    { status: current.status },
    { status: input.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED', finalLastWorkingDay: finalDay },
    input.note,
  );
  return getResignationById(context, requestId);
}

async function getResignationById(context: ActiveUserContext, requestId: string): Promise<ResignationRequestView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    employee_name: string;
    submission_date: Date;
    proposed_last_working_day: Date;
    notice_period_days: number;
    reason: string;
    status: string;
    final_last_working_day: Date | null;
    created_at: Date;
  }>>`
    SELECT r.id, r.employee_id, u.name AS employee_name, r.submission_date,
           r.proposed_last_working_day, r.notice_period_days, r.reason, r.status,
           r.final_last_working_day, r.created_at
    FROM campusos_workforce.resignation_requests r
    JOIN campusos_workforce.employee_profiles p ON p.id = r.employee_id
    JOIN public.users u ON u.id = p.user_id
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.id = ${requestId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Resignation request not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    submissionDate: dateOnly(row.submission_date, 'UTC'),
    proposedLastWorkingDay: dateOnly(row.proposed_last_working_day, 'UTC'),
    noticePeriodDays: row.notice_period_days,
    reason: row.reason,
    status: row.status,
    finalLastWorkingDay: row.final_last_working_day ? dateOnly(row.final_last_working_day, 'UTC') : null,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listClearanceItems(context: ActiveUserContext, resignationId: string): Promise<ClearanceItemView[]> {
  assertWorkforcePermission(canReviewExits(context), 'workforce:exits:clearance');
  const rows = await prisma.$queryRaw<Array<{ id: string; resignation_id: string | null; department: string; status: string; note: string | null; completed_at: Date | null }>>`
    SELECT id, resignation_id, department, status, note, completed_at
    FROM campusos_workforce.clearance_items
    WHERE tenant_id = ${context.tenantId}::uuid AND resignation_id = ${resignationId}::uuid
    ORDER BY department
  `;
  return rows.map((row) => ({
    id: row.id,
    resignationId: row.resignation_id,
    department: row.department,
    status: row.status as ClearanceItemView['status'],
    note: row.note,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  }));
}

export async function completeClearanceItem(
  context: ActiveUserContext,
  itemId: string,
  input: { status: 'CLEARED' | 'EXCEPTION' | 'WAIVED'; note?: string },
): Promise<ClearanceItemView> {
  assertWorkforcePermission(canReviewExits(context), 'workforce:exits:clearance');
  await prisma.$executeRaw`
    UPDATE campusos_workforce.clearance_items
    SET status = ${input.status}, note = ${input.note ?? null},
        completed_by = ${context.userId}::uuid, completed_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${itemId}::uuid
  `;
  await writeWorkforceAudit(context, 'CLEARANCE_UPDATED', 'clearance_items', itemId, null, input, input.note);
  const rows = await prisma.$queryRaw<Array<{ id: string; resignation_id: string | null; department: string; status: string; note: string | null; completed_at: Date | null }>>`
    SELECT id, resignation_id, department, status, note, completed_at
    FROM campusos_workforce.clearance_items
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${itemId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Clearance item not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    resignationId: row.resignation_id,
    department: row.department,
    status: row.status as ClearanceItemView['status'],
    note: row.note,
    completedAt: row.completed_at ? row.completed_at.toISOString() : null,
  };
}

export async function computeFinalSettlement(
  context: ActiveUserContext,
  resignationId: string,
  input: {
    leaveEncashmentMinor?: MoneyMinor;
    noticeRecoveryMinor?: MoneyMinor;
    approvedReimbursementsMinor?: MoneyMinor;
    advancesRecoveryMinor?: MoneyMinor;
    loanRecoveryMinor?: MoneyMinor;
    otherAdjustmentsMinor?: MoneyMinor;
  },
): Promise<FinalSettlementView> {
  assertWorkforcePermission(canAccessPayroll(context), 'payroll:settlement:create');
  const resignation = await getResignationById(context, resignationId);

  // Server-side salary calculation to the final working day.
  const compensation = await prisma.$queryRaw<Array<{ gross_minor: bigint | number | string; currency: string }>>`
    SELECT gross_minor, currency
    FROM campusos_workforce.compensation_versions
    WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${resignation.employeeId}::uuid
      AND status = 'ACTIVE' AND effective_from <= ${resignation.finalLastWorkingDay ?? resignation.proposedLastWorkingDay}::date
    ORDER BY effective_from DESC
    LIMIT 1
  `;
  const settings = await getWorkforceSettings(context.tenantId);
  const finalDay = resignation.finalLastWorkingDay ?? resignation.proposedLastWorkingDay;
  const start = resignation.submissionDate;
  const monthDays = inclusiveDayCount(`${finalDay.slice(0, 8)}01`, finalDay);
  const grossMonthly = compensation[0] ? dbNumber(compensation[0].gross_minor) : 0;
  const divisor = settings.payrollMonthlyDivisor > 0 ? settings.payrollMonthlyDivisor : 30;
  const salaryPayable = compensation[0]
    ? roundMinor((grossMonthly / divisor) * inclusiveDayCount(start, finalDay))
    : 0;

  const settlementId = randomUUID();
  const leaveEncashment = nonNegativeMinor(input.leaveEncashmentMinor ?? 0);
  const noticeRecovery = nonNegativeMinor(input.noticeRecoveryMinor ?? 0);
  const reimbursements = nonNegativeMinor(input.approvedReimbursementsMinor ?? 0);
  const advances = nonNegativeMinor(input.advancesRecoveryMinor ?? 0);
  const loans = nonNegativeMinor(input.loanRecoveryMinor ?? 0);
  const other = input.otherAdjustmentsMinor ?? 0;
  const net = salaryPayable + leaveEncashment + reimbursements + other - noticeRecovery - advances - loans;

  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.final_settlements
      (id, tenant_id, resignation_id, employee_id, salary_payable_minor, leave_encashment_minor,
       notice_recovery_minor, approved_reimbursements_minor, advances_recovery_minor,
       loan_recovery_minor, other_adjustments_minor, net_settlement_minor, currency,
       status, prepared_by, prepared_role, created_at, updated_at)
    VALUES
      (${settlementId}::uuid, ${context.tenantId}::uuid, ${resignationId}::uuid,
       ${resignation.employeeId}::uuid, ${salaryPayable}, ${leaveEncashment}, ${noticeRecovery},
       ${reimbursements}, ${advances}, ${loans}, ${other}, ${net},
       ${compensation[0]?.currency ?? 'INR'}, 'DRAFT', ${context.userId}::uuid,
       ${context.activeRole}, now(), now())
  `;
  await writeWorkforceAudit(context, 'FINAL_SETTLEMENT_COMPUTED', 'final_settlements', settlementId, null, { salaryPayable, net }, 'Final settlement computed');
  return getFinalSettlementById(context, settlementId);
}

async function getFinalSettlementById(context: ActiveUserContext, settlementId: string): Promise<FinalSettlementView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    resignation_id: string;
    salary_payable_minor: bigint | number | string;
    leave_encashment_minor: bigint | number | string;
    notice_recovery_minor: bigint | number | string;
    approved_reimbursements_minor: bigint | number | string;
    advances_recovery_minor: bigint | number | string;
    loan_recovery_minor: bigint | number | string;
    other_adjustments_minor: bigint | number | string;
    net_settlement_minor: bigint | number | string;
    currency: string;
    status: string;
    prepared_by: string;
    approved_at: Date | null;
  }>>`
    SELECT id, resignation_id, salary_payable_minor, leave_encashment_minor,
           notice_recovery_minor, approved_reimbursements_minor, advances_recovery_minor,
           loan_recovery_minor, other_adjustments_minor, net_settlement_minor, currency,
           status, prepared_by, approved_at
    FROM campusos_workforce.final_settlements
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${settlementId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Final settlement not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    resignationId: row.resignation_id,
    salaryPayableMinor: dbNumber(row.salary_payable_minor),
    leaveEncashmentMinor: dbNumber(row.leave_encashment_minor),
    noticeRecoveryMinor: dbNumber(row.notice_recovery_minor),
    approvedReimbursementsMinor: dbNumber(row.approved_reimbursements_minor),
    advancesRecoveryMinor: dbNumber(row.advances_recovery_minor),
    loanRecoveryMinor: dbNumber(row.loan_recovery_minor),
    otherAdjustmentsMinor: dbNumber(row.other_adjustments_minor),
    netSettlementMinor: dbNumber(row.net_settlement_minor),
    currency: row.currency,
    status: row.status,
    preparedBy: row.prepared_by,
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
  };
}

// ---------------------------------------------------------------------------
// Recruitment
// ---------------------------------------------------------------------------

export async function createJobRequisition(
  context: ActiveUserContext,
  input: {
    departmentId?: string;
    positionTitle: string;
    employeeType: string;
    requiredCount?: number;
    reason?: string;
    qualifications?: string;
    experienceYears?: number;
    compensationRange?: Record<string, unknown>;
    targetJoinDate?: string;
  },
): Promise<JobRequisitionView> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:recruitment:requisitions');
  if (!input.positionTitle.trim()) throw new WorkforceError('Position title is required.', 400);

  const requisitionId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.job_requisitions
      (id, tenant_id, department_id, position_title, employee_type, required_count, reason,
       qualifications, experience_years, compensation_range, target_join_date, status,
       requested_by, requested_role, created_at, updated_at)
    VALUES
      (${requisitionId}::uuid, ${context.tenantId}::uuid,
       ${input.departmentId ? Prisma.sql`${input.departmentId}::uuid` : Prisma.sql`NULL`},
       ${input.positionTitle}, ${input.employeeType}, ${input.requiredCount ?? 1},
       ${input.reason ?? null}, ${input.qualifications ?? null}, ${input.experienceYears ?? null},
       ${JSON.stringify(input.compensationRange ?? {})}::jsonb,
       ${input.targetJoinDate ? Prisma.sql`${input.targetJoinDate}::date` : Prisma.sql`NULL`},
       'APPROVAL_PENDING', ${context.userId}::uuid, ${context.activeRole}, now(), now())
  `;
  await writeWorkforceAudit(context, 'REQUISITION_CREATED', 'job_requisitions', requisitionId, null, input, 'Job requisition created');
  return getRequisitionById(context, requisitionId);
}

export async function reviewJobRequisition(
  context: ActiveUserContext,
  requisitionId: string,
  input: { decision: 'APPROVE' | 'REJECT'; note?: string },
): Promise<JobRequisitionView> {
  assertWorkforcePermission(canReviewRecruitment(context), 'workforce:recruitment:requisitions:review');
  const current = await getRequisitionById(context, requisitionId);
  if (current.status !== 'APPROVAL_PENDING') {
    throw new WorkforceError('This requisition is not awaiting approval.', 409);
  }
  await prisma.$executeRaw`
    UPDATE campusos_workforce.job_requisitions
    SET status = ${input.decision === 'APPROVE' ? 'OPEN' : 'CLOSED'},
        approved_by = ${context.userId}::uuid, approved_at = now(), updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${requisitionId}::uuid
  `;
  await writeWorkforceAudit(
    context,
    input.decision === 'APPROVE' ? 'REQUISITION_APPROVED' : 'REQUISITION_REJECTED',
    'job_requisitions',
    requisitionId,
    { status: current.status },
    { status: input.decision === 'APPROVE' ? 'OPEN' : 'CLOSED' },
    input.note,
  );
  return getRequisitionById(context, requisitionId);
}

async function getRequisitionById(context: ActiveUserContext, requisitionId: string): Promise<JobRequisitionView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    department_id: string | null;
    department_name: string | null;
    position_title: string;
    employee_type: string;
    required_count: number;
    reason: string | null;
    qualifications: string | null;
    experience_years: number | null;
    compensation_range: unknown;
    target_join_date: Date | null;
    status: string;
    requested_by: string;
    requested_role: string;
    created_at: Date;
  }>>`
    SELECT r.id, r.department_id, d.name AS department_name, r.position_title, r.employee_type,
           r.required_count, r.reason, r.qualifications, r.experience_years, r.compensation_range,
           r.target_join_date, r.status, r.requested_by, r.requested_role, r.created_at
    FROM campusos_workforce.job_requisitions r
    LEFT JOIN public.departments d ON d.id = r.department_id
    WHERE r.tenant_id = ${context.tenantId}::uuid AND r.id = ${requisitionId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Job requisition not found.', 404);
  const row = rows[0];
  return {
    id: row.id,
    departmentId: row.department_id,
    departmentName: row.department_name,
    positionTitle: row.position_title,
    employeeType: row.employee_type,
    requiredCount: row.required_count,
    reason: row.reason,
    qualifications: row.qualifications,
    experienceYears: row.experience_years,
    compensationRange: row.compensation_range ?? {},
    targetJoinDate: row.target_join_date ? dateOnly(row.target_join_date, 'UTC') : null,
    status: row.status,
    requestedBy: row.requested_by,
    requestedRole: row.requested_role,
    createdAt: row.created_at.toISOString(),
  };
}

export async function addCandidate(
  context: ActiveUserContext,
  input: { requisitionId?: string; name: string; email: string; phone?: string; resumeRef?: string; source?: string; hrNotes?: string },
): Promise<CandidateView> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:recruitment:candidates');
  if (!input.name.trim() || !input.email.trim()) throw new WorkforceError('Candidate name and email are required.', 400);
  const email = input.email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new WorkforceError('Candidate email is invalid.', 400);

  const candidateId = randomUUID();
  try {
    await prisma.$executeRaw`
      INSERT INTO campusos_workforce.candidates
        (id, tenant_id, requisition_id, name, email, phone, resume_ref, source, status,
         hr_notes, created_by, created_at, updated_at)
      VALUES
        (${candidateId}::uuid, ${context.tenantId}::uuid,
         ${input.requisitionId ? Prisma.sql`${input.requisitionId}::uuid` : Prisma.sql`NULL`},
         ${input.name}, ${email}, ${input.phone ?? null}, ${input.resumeRef ?? null},
         ${input.source ?? 'APPLICATION'}, 'APPLIED', ${input.hrNotes ?? null},
         ${context.userId}::uuid, now(), now())
    `;
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('candidates_tenant_email_uq')) {
      throw new WorkforceError('A candidate with this email already exists.', 409);
    }
    throw error;
  }
  await writeWorkforceAudit(context, 'CANDIDATE_ADDED', 'candidates', candidateId, null, { name: input.name, email }, 'Candidate added');
  return getCandidateById(context, candidateId);
}

export async function scheduleInterview(
  context: ActiveUserContext,
  input: { candidateId: string; stage: string; scheduledAt: string; mode?: string; meetingRef?: string; panelMemberUserIds?: string[] },
): Promise<CandidateView['interviews'][number]> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:recruitment:interviews');
  if (!/^\d{4}-\d{2}-\d{2}T/.test(input.scheduledAt)) {
    throw new WorkforceError('Interview time must be an ISO timestamp.', 400);
  }
  const interviewId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.interviews
      (id, tenant_id, candidate_id, stage, scheduled_at, mode, meeting_ref, panel_members,
       status, created_by, created_at, updated_at)
    VALUES
      (${interviewId}::uuid, ${context.tenantId}::uuid, ${input.candidateId}::uuid, ${input.stage},
       ${new Date(input.scheduledAt)}, ${input.mode ?? 'OFFLINE'}, ${input.meetingRef ?? null},
       ${JSON.stringify(input.panelMemberUserIds ?? [])}::jsonb, 'SCHEDULED',
       ${context.userId}::uuid, now(), now())
  `;
  await writeWorkforceAudit(context, 'INTERVIEW_SCHEDULED', 'interviews', interviewId, null, input, 'Interview scheduled');
  return {
    id: interviewId,
    stage: input.stage,
    scheduledAt: new Date(input.scheduledAt).toISOString(),
    mode: input.mode ?? 'OFFLINE',
    status: 'SCHEDULED',
    score: null,
    recommendation: null,
  };
}

export async function submitInterviewFeedback(
  context: ActiveUserContext,
  interviewId: string,
  input: InterviewFeedbackInput,
): Promise<CandidateView['interviews'][number]> {
  const interview = await prisma.$queryRaw<Array<{ id: string; candidate_id: string; stage: string; scheduled_at: Date; mode: string; panel_members: unknown; status: string }>>`
    SELECT id, candidate_id, stage, scheduled_at, mode, panel_members, status
    FROM campusos_workforce.interviews
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${interviewId}::uuid
    LIMIT 1
  `;
  if (!interview[0]) throw new WorkforceError('Interview not found.', 404);
  if (input.score < 0 || input.score > 100) throw new WorkforceError('Score must be between 0 and 100.', 400);

  // Only HR/recruitment operators or the interview's assigned panel members may
  // submit an evaluation. A random authenticated user must not be able to write
  // feedback for an interview they are not part of.
  const panelMembers = Array.isArray(interview[0].panel_members)
    ? (interview[0].panel_members as unknown[])
    : [];
  const isPanelMember = panelMembers.some(
    (member) => typeof member === 'string' && member === context.userId,
  );
  if (!isWorkforceHr(context) && !isPanelMember) {
    throw new WorkforceError('You are not authorized to evaluate this interview.', 403);
  }

  // The unique (candidate_id, stage, evaluator_user_id) constraint prevents one
  // panel member from overwriting another's evaluation. The evaluation is its
  // own row so the read-back below targets the record just written.
  const evaluationId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.interviews
      (id, tenant_id, candidate_id, stage, scheduled_at, mode, panel_members, feedback,
       score, recommendation, evaluator_user_id, status, created_by, created_at, updated_at)
    VALUES
      (${evaluationId}::uuid, ${context.tenantId}::uuid, ${interview[0].candidate_id}::uuid,
       ${interview[0].stage}, ${interview[0].scheduled_at}, ${interview[0].mode},
       ${JSON.stringify(interview[0].panel_members ?? [])}::jsonb,
       ${JSON.stringify(input.feedback)}::jsonb, ${input.score}, ${input.recommendation},
       ${context.userId}::uuid, 'COMPLETED', ${context.userId}::uuid, now(), now())
    ON CONFLICT (candidate_id, stage, evaluator_user_id) DO NOTHING
  `;
  await writeWorkforceAudit(context, 'INTERVIEW_FEEDBACK', 'interviews', interviewId, null, { score: input.score, recommendation: input.recommendation }, 'Interview feedback submitted');
  const rows = await prisma.$queryRaw<Array<{ id: string; stage: string; scheduled_at: Date; mode: string; status: string; score: number | null; recommendation: string | null }>>`
    SELECT id, stage, scheduled_at, mode, status, score, recommendation
    FROM campusos_workforce.interviews
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${evaluationId}::uuid
    LIMIT 1
  `;
  const row = rows[0];
  return {
    id: row.id,
    stage: row.stage,
    scheduledAt: row.scheduled_at.toISOString(),
    mode: row.mode,
    status: row.status,
    score: row.score,
    recommendation: row.recommendation,
  };
}

export async function createEmploymentOffer(
  context: ActiveUserContext,
  input: {
    candidateId: string;
    positionTitle: string;
    departmentId?: string;
    employmentType: string;
    proposedJoinDate?: string;
    compensation: Record<string, unknown>;
    probationMonths?: number;
    contractDurationMonths?: number;
    conditions?: string;
    offerExpiry?: string;
  },
): Promise<{ id: string; version: number; status: string }> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:recruitment:offers');
  const versionRow = await prisma.$queryRaw<Array<{ next_version: bigint | number }>>`
    SELECT COALESCE(max(version), 0) + 1 AS next_version
    FROM campusos_workforce.employment_offers
    WHERE tenant_id = ${context.tenantId}::uuid AND candidate_id = ${input.candidateId}::uuid
  `;
  const version = dbNumber(versionRow[0]?.next_version ?? 1);
  const offerId = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO campusos_workforce.employment_offers
      (id, tenant_id, candidate_id, version, position_title, department_id, employment_type,
       proposed_join_date, compensation, probation_months, contract_duration_months, conditions,
       offer_expiry, status, issued_by, created_at)
    VALUES
      (${offerId}::uuid, ${context.tenantId}::uuid, ${input.candidateId}::uuid, ${version},
       ${input.positionTitle}, ${input.departmentId ? Prisma.sql`${input.departmentId}::uuid` : Prisma.sql`NULL`},
       ${input.employmentType}, ${input.proposedJoinDate ? Prisma.sql`${input.proposedJoinDate}::date` : Prisma.sql`NULL`},
       ${JSON.stringify(input.compensation)}::jsonb, ${input.probationMonths ?? 6},
       ${input.contractDurationMonths ?? null}, ${input.conditions ?? null},
       ${input.offerExpiry ? Prisma.sql`${input.offerExpiry}::date` : Prisma.sql`NULL`},
       'DRAFT', ${context.userId}::uuid, now())
  `;
  await writeWorkforceAudit(context, 'OFFER_CREATED', 'employment_offers', offerId, null, { candidateId: input.candidateId, version }, 'Employment offer created');
  return { id: offerId, version, status: 'DRAFT' };
}

export async function acceptEmploymentOffer(
  context: ActiveUserContext,
  offerId: string,
): Promise<{ employeeId: string; offerStatus: string }> {
  assertWorkforcePermission(isWorkforceHr(context), 'workforce:recruitment:offers:accept');
  const offer = await prisma.$queryRaw<Array<{
    id: string;
    candidate_id: string;
    version: number;
    position_title: string;
    employment_type: string;
    proposed_join_date: Date | null;
    department_id: string | null;
    status: string;
  }>>`
    SELECT id, candidate_id, version, position_title, employment_type, proposed_join_date, department_id, status
    FROM campusos_workforce.employment_offers
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${offerId}::uuid
    LIMIT 1
  `;
  if (!offer[0]) throw new WorkforceError('Employment offer not found.', 404);
  if (offer[0].status !== 'DRAFT' && offer[0].status !== 'ISSUED') {
    throw new WorkforceError('This offer cannot be accepted in its current state.', 409);
  }

  // The candidate must resolve to a verified user in the tenant; an applicant
  // never gains employee permissions just by being a candidate.
  const candidate = await prisma.$queryRaw<Array<{ email: string }>>`
    SELECT email FROM campusos_workforce.candidates
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${offer[0].candidate_id}::uuid
    LIMIT 1
  `;
  if (!candidate[0]) throw new WorkforceError('Candidate record not found.', 404);
  const user = await prisma.user.findFirst({ where: { email: candidate[0].email }, select: { id: true, tenantId: true, isActive: true } });
  if (!user || user.tenantId !== context.tenantId) {
    throw new WorkforceError('Offer acceptance requires a verified account for the candidate before onboarding can begin.', 400);
  }

  const joinDate = offer[0].proposed_join_date ? dateOnly(offer[0].proposed_join_date, 'UTC') : dateOnly(new Date(), 'UTC');
  const employee = await createEmployee(context, {
    userId: user.id,
    employeeType: offer[0].position_title.includes('Faculty') || offer[0].position_title.includes('Professor') || offer[0].position_title.includes('Lecturer') ? 'FACULTY' : 'ADMINISTRATIVE_STAFF',
    employmentType: offer[0].employment_type,
    designation: offer[0].position_title,
    departmentId: offer[0].department_id ?? undefined,
    joiningDate: joinDate,
  });

  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE campusos_workforce.employment_offers
      SET status = 'ACCEPTED', accepted_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${offerId}::uuid
    `;
    await tx.$executeRaw`
      UPDATE campusos_workforce.candidates
      SET status = 'JOINED', updated_at = now()
      WHERE tenant_id = ${context.tenantId}::uuid AND id = ${offer[0].candidate_id}::uuid
    `;
    const checklist = ['Identity verification', 'Qualification documents', 'Bank details', 'Contract signature', 'System account', 'Department assignment'];
    for (const item of checklist) {
      await tx.$executeRaw`
        INSERT INTO campusos_workforce.onboarding_checklists
          (id, tenant_id, employee_id, item, category, status, created_at)
        VALUES
          (${randomUUID()}::uuid, ${context.tenantId}::uuid, ${employee.id}::uuid, ${item}, 'ONBOARDING', 'PENDING', now())
      `;
    }
  }, { timeout: 30_000 });

  await writeWorkforceAudit(context, 'OFFER_ACCEPTED', 'employment_offers', offerId, { status: offer[0].status }, { status: 'ACCEPTED', employeeId: employee.id }, 'Offer accepted, onboarding started');
  return { employeeId: employee.id, offerStatus: 'ACCEPTED' };
}

async function getCandidateById(context: ActiveUserContext, candidateId: string): Promise<CandidateView> {
  const rows = await prisma.$queryRaw<Array<{
    id: string;
    requisition_id: string | null;
    name: string;
    email: string;
    phone: string | null;
    source: string;
    status: string;
    hr_notes: string | null;
    created_at: Date;
  }>>`
    SELECT id, requisition_id, name, email, phone, source, status, hr_notes, created_at
    FROM campusos_workforce.candidates
    WHERE tenant_id = ${context.tenantId}::uuid AND id = ${candidateId}::uuid
    LIMIT 1
  `;
  if (!rows[0]) throw new WorkforceError('Candidate not found.', 404);
  const row = rows[0];
  const interviews = await prisma.$queryRaw<Array<{ id: string; stage: string; scheduled_at: Date; mode: string; status: string; score: number | null; recommendation: string | null }>>`
    SELECT id, stage, scheduled_at, mode, status, score, recommendation
    FROM campusos_workforce.interviews
    WHERE tenant_id = ${context.tenantId}::uuid AND candidate_id = ${candidateId}::uuid
    ORDER BY scheduled_at
  `;
  return {
    id: row.id,
    requisitionId: row.requisition_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    source: row.source,
    status: row.status,
    hrNotes: row.hr_notes,
    createdAt: row.created_at.toISOString(),
    interviews: interviews.map((interview) => ({
      id: interview.id,
      stage: interview.stage,
      scheduledAt: interview.scheduled_at.toISOString(),
      mode: interview.mode,
      status: interview.status,
      score: interview.score,
      recommendation: interview.recommendation,
    })),
  };
}

// ---------------------------------------------------------------------------
// Self service + admin overview
// ---------------------------------------------------------------------------

export async function getEmployeeSelfService(context: ActiveUserContext): Promise<EmployeeSelfServiceWorkspace> {
  const settings = await getWorkforceSettings(context.tenantId);
  const profile = await resolveEmployeeProfileForUser(context);
  const today = dateOnly(new Date(), settings.timezone);

  let todayAttendance: StaffAttendanceView | null = null;
  let recentAttendance: StaffAttendanceView[] = [];
  let leaveBalances: LeaveBalanceView[] = [];
  let myLeaveRequests: LeaveRequestView[] = [];
  let myPayslips: PayslipView[] = [];
  let myReimbursements: ReimbursementClaimView[] = [];
  let myResignation: ResignationRequestView | null = null;
  let onboardingTasks: EmployeeSelfServiceWorkspace['onboardingTasks'] = [];
  let shifts: EmployeeSelfServiceWorkspace['shifts'] = [];

  if (profile) {
    const todayRows = await prisma.$queryRaw<AttendanceRow[]>`
      SELECT a.id, a.attendance_date, s.name AS shift_name, a.check_in, a.check_out,
             a.work_minutes, a.status, a.source, a.note
      FROM campusos_workforce.staff_attendance a
      LEFT JOIN campusos_workforce.work_shifts s ON s.id = a.shift_id
      WHERE a.tenant_id = ${context.tenantId}::uuid AND a.employee_id = ${profile.id}::uuid
        AND a.attendance_date = ${today}::date
      LIMIT 1
    `;
    todayAttendance = todayRows[0] ? mapAttendanceRow(todayRows[0]) : null;
    recentAttendance = await listMyAttendance(context, 10);

    leaveBalances = await getLeaveBalances(context);
    const myRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_workforce.leave_requests
      WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${profile.id}::uuid
      ORDER BY created_at DESC LIMIT 20
    `;
    myLeaveRequests = [];
    for (const row of myRows) {
      myLeaveRequests.push(await getLeaveRequestById(context, row.id));
    }

    myPayslips = await getMyPayslips(context);

    const reimbursementRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_workforce.reimbursement_claims
      WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${profile.id}::uuid
      ORDER BY created_at DESC LIMIT 20
    `;
    myReimbursements = [];
    for (const row of reimbursementRows) {
      myReimbursements.push(await getReimbursementById(context, row.id));
    }

    const resignationRows = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT id FROM campusos_workforce.resignation_requests
      WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${profile.id}::uuid
      ORDER BY created_at DESC LIMIT 1
    `;
    if (resignationRows[0]) myResignation = await getResignationById(context, resignationRows[0].id);

    onboardingTasks = await prisma.$queryRaw<EmployeeSelfServiceWorkspace['onboardingTasks']>`
      SELECT id, item, category, status
      FROM campusos_workforce.onboarding_checklists
      WHERE tenant_id = ${context.tenantId}::uuid AND employee_id = ${profile.id}::uuid
      ORDER BY created_at
    `;

    shifts = await prisma.$queryRaw<EmployeeSelfServiceWorkspace['shifts']>`
      SELECT id, name, code, start_time, end_time
      FROM campusos_workforce.work_shifts
      WHERE tenant_id = ${context.tenantId}::uuid AND status = 'ACTIVE'
      ORDER BY name
    `;
  }

  return {
    profile,
    settings,
    todayAttendance,
    recentAttendance,
    leaveBalances,
    myLeaveRequests,
    myPayslips,
    myReimbursements,
    myResignation,
    onboardingTasks,
    shifts,
  };
}

export async function getWorkforceAdminOverview(context: ActiveUserContext): Promise<WorkforceAdminOverview> {
  assertWorkforcePermission(isWorkforceOperator(context), 'workforce:admin:overview');
  const settings = await getWorkforceSettings(context.tenantId);
  const today = dateOnly(new Date(), settings.timezone);

  const counts = await prisma.$queryRaw<Array<{ status: string; count: bigint | number }>>`
    SELECT employment_status AS status, count(*) AS count
    FROM campusos_workforce.employee_profiles
    WHERE tenant_id = ${context.tenantId}::uuid
    GROUP BY employment_status
  `;
  const countMap = new Map(counts.map((row) => [row.status, dbNumber(row.count)]));
  const totalActive =
    dbNumber(countMap.get('ACTIVE')) +
    dbNumber(countMap.get('PROBATION')) +
    dbNumber(countMap.get('ON_LEAVE')) +
    dbNumber(countMap.get('NOTICE_PERIOD'));

  const employees = await listEmployees(context, { pageSize: 50 });

  const pendingLeaveRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_workforce.leave_requests
    WHERE tenant_id = ${context.tenantId}::uuid
      AND status IN ('SUBMITTED', 'MANAGER_APPROVAL', 'HR_REVIEW')
    ORDER BY created_at DESC LIMIT 30
  `;
  const pendingLeaveRequests: LeaveRequestView[] = [];
  for (const row of pendingLeaveRows) pendingLeaveRequests.push(await getLeaveRequestById(context, row.id));

  const correctionRows = await prisma.$queryRaw<Array<{
    id: string;
    employee_id: string;
    attendance_date: Date | null;
    original_state: unknown;
    proposed_state: unknown;
    reason: string;
    status: string;
    requested_by: string;
    created_at: Date;
    employee_name: string;
  }>>`
    SELECT c.id, c.employee_id, a.attendance_date, c.original_state, c.proposed_state,
           c.reason, c.status, c.requested_by, c.created_at, u.name AS employee_name
    FROM campusos_workforce.attendance_corrections c
    LEFT JOIN campusos_workforce.staff_attendance a ON a.id = c.attendance_id
    LEFT JOIN campusos_workforce.employee_profiles p ON p.id = c.employee_id
    LEFT JOIN public.users u ON u.id = p.user_id
    WHERE c.tenant_id = ${context.tenantId}::uuid AND c.status = 'REQUESTED'
    ORDER BY c.created_at DESC LIMIT 30
  `;
  const pendingCorrections: AttendanceCorrectionView[] = correctionRows.map((row) => ({
    id: row.id,
    employeeId: row.employee_id,
    employeeName: row.employee_name,
    attendanceDate: row.attendance_date ? dateOnly(row.attendance_date, 'UTC') : null,
    originalState: row.original_state ?? {},
    proposedState: row.proposed_state ?? {},
    reason: row.reason,
    status: row.status as AttendanceCorrectionView['status'],
    requestedBy: row.requested_by,
    createdAt: row.created_at.toISOString(),
  }));

  const reimbursementRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_workforce.reimbursement_claims
    WHERE tenant_id = ${context.tenantId}::uuid AND status = 'SUBMITTED'
    ORDER BY created_at DESC LIMIT 30
  `;
  const pendingReimbursements: ReimbursementClaimView[] = [];
  for (const row of reimbursementRows) pendingReimbursements.push(await getReimbursementById(context, row.id));

  const resignationRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_workforce.resignation_requests
    WHERE tenant_id = ${context.tenantId}::uuid AND status IN ('SUBMITTED', 'MANAGER_REVIEW', 'HR_REVIEW')
    ORDER BY created_at DESC LIMIT 30
  `;
  const pendingResignations: ResignationRequestView[] = [];
  for (const row of resignationRows) pendingResignations.push(await getResignationById(context, row.id));

  const periodRows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM campusos_workforce.payroll_periods
    WHERE tenant_id = ${context.tenantId}::uuid
      AND status IN ('DRAFT', 'PROCESSING', 'REVIEW', 'APPROVAL_PENDING', 'APPROVED', 'DISBURSEMENT_PENDING')
    ORDER BY end_date DESC LIMIT 5
  `;
  const activePayrollPeriods: PayrollPeriodView[] = [];
  for (const row of periodRows) activePayrollPeriods.push(await getPayrollPeriod(context, row.id));

  const history = await prisma.$queryRaw<Array<{ id: string; change_type: string; employee_name: string; effective_from: Date; reason: string | null; created_at: Date }>>`
    SELECT h.id, h.change_type, u.name AS employee_name, h.effective_from, h.reason, h.created_at
    FROM campusos_workforce.employment_history h
    JOIN campusos_workforce.employee_profiles p ON p.id = h.employee_id
    JOIN public.users u ON u.id = p.user_id
    WHERE h.tenant_id = ${context.tenantId}::uuid
    ORDER BY h.created_at DESC LIMIT 12
  `;
  const recentHistory = history.map((row) => ({
    id: row.id,
    changeType: row.change_type,
    employeeName: row.employee_name,
    effectiveFrom: dateOnly(row.effective_from, 'UTC'),
    reason: row.reason,
    createdAt: row.created_at.toISOString(),
  }));

  // Expire any time-bounded authorizations whose window has passed.
  await prisma.$executeRaw`
    UPDATE campusos_workforce.temporary_role_assignments
    SET status = 'EXPIRED', updated_at = now()
    WHERE tenant_id = ${context.tenantId}::uuid AND status = 'ACTIVE' AND effective_until < ${today}::date
  `;

  const metrics = [
    { id: 'active', label: 'Active employees', value: totalActive, hint: 'ACTIVE + PROBATION + NOTICE_PERIOD', tone: 'positive' as const },
    { id: 'probation', label: 'On probation', value: dbNumber(countMap.get('PROBATION')), hint: 'Pending confirmation reviews', tone: 'neutral' as const },
    { id: 'on-leave', label: 'On leave today', value: dbNumber(countMap.get('ON_LEAVE')), hint: 'Explicit leave status', tone: 'warning' as const },
    { id: 'pending-leave', label: 'Pending leave approvals', value: pendingLeaveRequests.length, hint: 'Awaiting manager/HR decision', tone: pendingLeaveRequests.length > 0 ? 'warning' as const : 'neutral' as const },
    { id: 'corrections', label: 'Attendance corrections', value: pendingCorrections.length, hint: 'Awaiting review', tone: pendingCorrections.length > 0 ? 'warning' as const : 'neutral' as const },
    { id: 'reimbursements', label: 'Pending reimbursements', value: pendingReimbursements.length, hint: 'Awaiting approval', tone: pendingReimbursements.length > 0 ? 'warning' as const : 'neutral' as const },
    { id: 'resignations', label: 'Pending exits', value: pendingResignations.length, hint: 'Resignations awaiting decision', tone: pendingResignations.length > 0 ? 'warning' as const : 'neutral' as const },
    { id: 'payroll', label: 'Active payroll periods', value: activePayrollPeriods.length, hint: 'Open periods in flight', tone: activePayrollPeriods.length > 0 ? 'neutral' as const : 'positive' as const },
  ];

  return {
    settings,
    metrics,
    employees: employees.items,
    pendingLeaveRequests,
    pendingCorrections,
    pendingReimbursements,
    pendingResignations,
    activePayrollPeriods,
    recentHistory,
  };
}
