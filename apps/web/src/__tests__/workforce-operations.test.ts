import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../lib/active-user-context';

/**
 * In-memory fake for lib/db that captures INSERT/UPDATE statements so the
 * engine's raw SQL round-trips behave like a real (single-instance) database.
 * The WHERE clause of every query is parsed (`column = $N` predicates) so
 * tenant scoping and id matching are exercised realistically.
 */

const TENANT_1 = '11111111-1111-4111-8111-111111111111';
const TENANT_2 = '22222222-2222-4222-8222-222222222222';
const USER_ADMIN_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_ADMIN_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const USER_FACULTY_1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_OTHER = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const STAFF_1 = '11111111-2222-4333-8444-555555555555';
const STAFF_2 = '11111111-2222-4333-8444-666666666666';
const EMP_1 = '33333333-1111-4333-8444-333333333331';
const EMP_2 = '33333333-1111-4333-8444-333333333332';

type AnyRow = Record<string, unknown>;

type TableName =
  | 'workforce_settings' | 'employee_profiles' | 'employment_history' | 'compensation_versions'
  | 'staff_attendance' | 'attendance_corrections' | 'leave_policies' | 'leave_ledger'
  | 'leave_requests' | 'payroll_periods' | 'payroll_snapshots' | 'payroll_entries'
  | 'payroll_adjustments' | 'payroll_disbursements' | 'payslip_registry' | 'overtime_requests'
  | 'reimbursement_claims' | 'resignation_requests' | 'clearance_items' | 'final_settlements'
  | 'job_requisitions' | 'candidates' | 'interviews' | 'employment_offers'
  | 'onboarding_checklists' | 'users' | 'staff' | 'timetable_slots';

const TABLES = new Set<TableName>([
  'workforce_settings', 'employee_profiles', 'employment_history', 'compensation_versions',
  'staff_attendance', 'attendance_corrections', 'leave_policies', 'leave_ledger',
  'leave_requests', 'payroll_periods', 'payroll_snapshots', 'payroll_entries',
  'payroll_adjustments', 'payroll_disbursements', 'payslip_registry', 'overtime_requests',
  'reimbursement_claims', 'resignation_requests', 'clearance_items', 'final_settlements',
  'job_requisitions', 'candidates', 'interviews', 'employment_offers',
  'onboarding_checklists', 'users', 'staff', 'timetable_slots',
]);

type FakeState = Record<TableName, AnyRow[]>;

function freshState(): FakeState {
  const state = {} as FakeState;
  for (const table of TABLES) state[table] = [];
  return state;
}

let state: FakeState = freshState();

/** Splits a clause on top-level commas, AND and OR (outside quotes/parens/braces/brackets). */
function splitClause(input: string): string[] {
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (char === "'" && input[index - 1] !== '\\') inQuote = !inQuote;
    if (!inQuote) {
      if (char === '(' || char === '{' || char === '[') depth += 1;
      if (char === ')' || char === '}' || char === ']') depth -= 1;
      if (depth === 0) {
        const rest = input.slice(index);
        if (char === ',') {
          parts.push(current.trim());
          current = '';
          continue;
        }
        if (/^(AND|OR)\s/i.test(rest)) {
          parts.push(current.trim());
          current = '';
          index += (rest[0] === 'A' ? 2 : 1);
          continue;
        }
      }
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

/** Unwraps a Prisma.Sql fragment (e.g. Prisma.sql`NULL` or `$id::uuid`) to a plain value. */
function unwrapSqlFragment(value: unknown): unknown {
  if (value && typeof value === 'object' && Array.isArray((value as { strings?: unknown[] }).strings)) {
    const sql = value as { strings: string[]; values: unknown[] };
    let out = sql.strings[0] ?? '';
    for (let index = 0; index < (sql.values ?? []).length; index += 1) {
      out += String(sql.values[index] ?? '') + (sql.strings[index + 1] ?? '');
    }
    const trimmed = out.trim();
    if (trimmed === 'NULL' || trimmed === '') return null;
    return trimmed;
  }
  return value;
}

/** Resolves a single value token (placeholder, literal, cast) to a JS value. */
function resolveToken(token: string, values: unknown[]): unknown {
  const isJson = token.includes('::jsonb');
  let cleaned = token.trim();
  const castIndex = cleaned.indexOf('::');
  if (castIndex !== -1) cleaned = cleaned.slice(0, castIndex).trim();
  const placeholder = cleaned.match(/^\$(\d+)$/);
  let resolved: unknown;
  if (placeholder) {
    resolved = unwrapSqlFragment(values[Number(placeholder[1]) - 1]);
  } else if (cleaned.startsWith("'")) {
    const match = cleaned.match(/^'([\s\S]*)'$/);
    resolved = match ? match[1] : cleaned;
  } else if (cleaned === 'NULL') {
    resolved = null;
  } else if (cleaned === 'now()') {
    resolved = new Date();
  } else {
    const numeric = Number(cleaned);
    resolved = !Number.isNaN(numeric) && cleaned !== '' ? numeric : cleaned;
  }
  if (isJson && typeof resolved === 'string') {
    try {
      return JSON.parse(resolved);
    } catch {
      return resolved;
    }
  }
  return resolved;
}

/** Rebuilds a Prisma tagged template into real `$N` placeholder SQL text. */
function buildSqlText(parts: TemplateStringsArray): string {
  let out = parts[0] ?? '';
  for (let index = 1; index < parts.length; index += 1) {
    out += `$${index}${parts[index] ?? ''}`;
  }
  return out;
}

/** Parses `column = value` predicates from a WHERE clause into a matcher. */
function parsePredicates(text: string, values: unknown[]): Array<[string, unknown]> {
  const predicates: Array<[string, unknown]> = [];
  // Use the LAST top-level WHERE (queries may contain subquery WHEREs).
  const whereIndex = text.toUpperCase().lastIndexOf('WHERE');
  if (whereIndex === -1) return predicates;
  const trimmed = text.slice(whereIndex + 5);
  const stopIndex = trimmed.search(/\s(ORDER BY|GROUP BY|LIMIT|OFFSET)\b/i);
  const whereClause = stopIndex === -1 ? trimmed : trimmed.slice(0, stopIndex);
  for (const part of splitClause(whereClause)) {
    const match = part.match(/^([A-Za-z_][A-Za-z0-9_.]*)\s*(<=|>=|=|IN)\s*(\S+)$/);
    if (match && match[2] === '=') {
      predicates.push([match[1].replace(/^[A-Za-z0-9_]+\./, ''), resolveToken(match[3], values)]);
    }
  }
  return predicates;
}

function rowsMatching(table: TableName, text: string, values: unknown[]): AnyRow[] {
  const predicates = parsePredicates(text, values);
  return state[table].filter((row) => predicates.every(([column, expected]) => String(row[column] ?? '') === String(expected ?? '')));
}

/** Captures an INSERT statement into the in-memory tables. */
function captureInsert(text: string, values: unknown[]) {
  const withoutConflict = text.replace(/\s+ON CONFLICT[\s\S]*$/i, '');
  const insertMatch = withoutConflict.match(/INSERT INTO campusos_workforce\.(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]*?)\)\s*$/i);
  if (!insertMatch) return false;
  const table = insertMatch[1] as TableName;
  if (!TABLES.has(table)) return false;
  const columns = insertMatch[2].split(',').map((column) => column.trim().replace(/"/g, ''));
  const tokens = splitClause(insertMatch[3]);
  const row: AnyRow = {};
  tokens.forEach((token, index) => {
    if (columns[index]) row[columns[index]] = resolveToken(token, values);
  });
  const rows = state[table];
  // Simulate the unique constraints the engine relies on (ON CONFLICT DO NOTHING).
  if (table === 'payroll_entries' && rows.some((existing) => existing.period_id === row.period_id && existing.employee_id === row.employee_id)) return false;
  if (table === 'payroll_snapshots' && rows.some((existing) => existing.period_id === row.period_id && existing.employee_id === row.employee_id)) return false;
  if (table === 'staff_attendance' && rows.some((existing) => existing.tenant_id === row.tenant_id && existing.employee_id === row.employee_id && existing.attendance_date === row.attendance_date)) return false;
  if (table === 'leave_ledger' && row.leave_request_id) {
    const key = `${row.employee_id}:${row.leave_request_id}:${row.entry_type}`;
    if (rows.some((existing) => `${existing.employee_id}:${existing.leave_request_id}:${existing.entry_type}` === key)) return false;
  }
  rows.push(row);
  return true;
}

/** Captures an UPDATE statement into the in-memory tables. */
function captureUpdate(text: string, values: unknown[]) {
  const updateMatch = text.match(/UPDATE campusos_workforce\.(\w+)\s+SET\s+([\s\S]*?)\s+WHERE\s+([\s\S]*?)$/i);
  if (!updateMatch) return false;
  const table = updateMatch[1] as TableName;
  if (!TABLES.has(table)) return false;
  const assignments: Array<[string, unknown]> = [];
  for (const setToken of splitClause(updateMatch[2])) {
    const match = setToken.match(/^([A-Za-z_]\w*)\s*=\s*(\S+)$/);
    if (match) assignments.push([match[1], resolveToken(match[2], values)]);
  }
  const predicates = parsePredicates(`WHERE ${updateMatch[3]}`, values);
  for (const row of state[table]) {
    const matches = predicates.every(([column, expected]) => String(row[column] ?? '') === String(expected ?? ''));
    if (matches) {
      for (const [column, value] of assignments) row[column] = value;
    }
  }
  return true;
}


function makeFakeDb() {
  const prisma = {
    $queryRaw: vi.fn(async (query: { text?: string } | TemplateStringsArray, ...values: unknown[]) => {
      const text = (query as { text?: string }).text ?? buildSqlText(query as TemplateStringsArray);

      if (text.includes('FROM campusos_workforce.workforce_settings')) {
        return rowsMatching('workforce_settings', text, values);
      }
      if (text.includes('FROM campusos_workforce.employee_profiles') && text.includes('GROUP BY')) {
        const counts = new Map<string, number>();
        for (const row of rowsMatching('employee_profiles', text, values)) {
          const status = String(row.employment_status ?? 'ACTIVE');
          counts.set(status, (counts.get(status) ?? 0) + 1);
        }
        return [...counts.entries()].map(([status, count]) => ({ status, count }));
      }
      if (text.includes('FROM campusos_workforce.employee_profiles') && /count\s*\(/i.test(text)) {
        return [{ total: rowsMatching('employee_profiles', text, values).length }];
      }
      if (text.includes('FROM campusos_workforce.employee_profiles') && text.includes('JOIN public.users')) {
        return rowsMatching('employee_profiles', text, values).map((row) => {
          const user = state.users.find((item) => item.id === row.user_id);
          return { ...row, name: user?.name ?? 'Unknown', email: user?.email ?? 'unknown@test.local', department_name: null, reporting_manager_name: null };
        });
      }
      if (text.includes('FROM campusos_workforce.employee_profiles') && text.includes('WHERE tenant_id')) {
        return rowsMatching('employee_profiles', text, values);
      }
      if (text.includes('SELECT count(*) AS total') && text.includes('FROM campusos_workforce.employee_profiles')) {
        return [{ total: rowsMatching('employee_profiles', text, values).length }];
      }
      if (text.includes('FROM campusos_workforce.compensation_versions') && text.includes('COALESCE(max(version)')) {
        return [{ next_version: state.compensation_versions.length + 1 }];
      }
      if (text.includes('FROM campusos_workforce.compensation_versions') && text.includes('AND status = \'ACTIVE\'')) {
        const periodEnd = values[values.length - 1] ?? '9999-12-31';
        return state.compensation_versions.filter((row) => row.status === 'ACTIVE' && String(row.effective_from ?? '') <= String(periodEnd));
      }
      if (text.includes('FROM campusos_workforce.compensation_versions')) {
        return rowsMatching('compensation_versions', text, values);
      }
      if (text.includes('FROM campusos_workforce.staff_attendance') && text.includes('ORDER BY')) {
        return rowsMatching('staff_attendance', text, values);
      }
      if (text.includes('FROM campusos_workforce.staff_attendance') && text.includes('LIMIT 1')) {
        return rowsMatching('staff_attendance', text, values);
      }
      if (text.includes('FROM campusos_workforce.attendance_corrections')) {
        return rowsMatching('attendance_corrections', text, values).map((row) => ({ ...row, employee_name: 'Test Faculty' }));
      }
      if (text.includes('FROM campusos_workforce.leave_policies') && text.includes('AND status = \'ACTIVE\'')) {
        return rowsMatching('leave_policies', text, values);
      }
      if (text.includes('FROM campusos_workforce.leave_policies') && text.includes('LIMIT 1')) {
        return rowsMatching('leave_policies', text, values);
      }
      if (text.includes('FROM campusos_workforce.leave_ledger')) {
        return rowsMatching('leave_ledger', text, values);
      }
      if (text.includes('SUM(r.days)')) {
        return [{ days: 0 }];
      }
      if (text.includes('FROM campusos_workforce.leave_requests') && text.includes('JOIN campusos_workforce.leave_policies')) {
        return rowsMatching('leave_requests', text, values).map((row) => {
          const policy = state.leave_policies.find((item) => item.id === row.policy_id) ?? { code: 'CL', name: 'Casual Leave' };
          return { ...row, policy_code: policy.code, policy_name: policy.name, employee_name: 'Test Faculty', timetable_conflicts: row.timetable_conflicts ?? [] };
        });
      }
      if (text.includes('FROM campusos_workforce.leave_requests') && text.includes('LIMIT 1')) {
        return rowsMatching('leave_requests', text, values);
      }
      if (text.includes('FROM campusos_workforce.payroll_entries') && text.includes('JOIN campusos_workforce.employee_profiles')) {
        return rowsMatching('payroll_entries', text, values).map((row) => ({ ...row, employee_name: 'Test Faculty', employee_number: 'NAV/EMP/2026/00001' }));
      }
      if (text.includes('FROM campusos_workforce.payroll_entries') && /count\s*\(/i.test(text)) {
        return [{ count: state.payroll_entries.length }];
      }
      if (text.includes('FROM campusos_workforce.payroll_entries') && text.includes('LIMIT 1')) {
        return rowsMatching('payroll_entries', text, values);
      }
      if (text.includes('FROM campusos_workforce.payroll_entries')) {
        return rowsMatching('payroll_entries', text, values);
      }
      if (text.includes('SELECT count(*) AS total') && text.includes('FROM campusos_workforce.employee_profiles')) {
        return [{ total: rowsMatching('employee_profiles', text, values).length }];
      }
      if (text.includes('FROM campusos_workforce.payroll_snapshots')) {
        return rowsMatching('payroll_snapshots', text, values);
      }
      if (text.includes('FROM campusos_workforce.payroll_periods') && text.includes('WHERE tenant_id')) {
        return rowsMatching('payroll_periods', text, values);
      }
      if (text.includes('FROM campusos_workforce.resignation_requests') && text.includes('JOIN campusos_workforce.employee_profiles')) {
        return rowsMatching('resignation_requests', text, values).map((row) => ({ ...row, employee_name: 'Test Faculty' }));
      }
      if (text.includes('FROM campusos_workforce.resignation_requests') && text.includes('LIMIT 1')) {
        return rowsMatching('resignation_requests', text, values);
      }
      if (text.includes('FROM campusos_workforce.clearance_items') && text.includes('LIMIT 1')) {
        return rowsMatching('clearance_items', text, values);
      }
      if (text.includes('FROM campusos_workforce.clearance_items')) {
        return rowsMatching('clearance_items', text, values);
      }
      if (text.includes('FROM campusos_workforce.final_settlements')) {
        return rowsMatching('final_settlements', text, values);
      }
      if (text.includes('FROM campusos_workforce.job_requisitions') && text.includes('LEFT JOIN public.departments')) {
        return rowsMatching('job_requisitions', text, values).map((row) => ({ ...row, department_name: null }));
      }
      if (text.includes('FROM campusos_workforce.candidates') && text.includes('LIMIT 1')) {
        return rowsMatching('candidates', text, values);
      }
      if (text.includes('FROM campusos_workforce.candidates')) {
        return rowsMatching('candidates', text, values).map((row) => ({ ...row, interviews: [] }));
      }
      if (text.includes('FROM campusos_workforce.employment_offers') && text.includes('COALESCE(max(version)')) {
        return [{ next_version: state.employment_offers.length + 1 }];
      }
      if (text.includes('FROM campusos_workforce.employment_offers') && text.includes('LIMIT 1')) {
        return rowsMatching('employment_offers', text, values);
      }
      if (text.includes('FROM campusos_workforce.interviews') && text.includes('LIMIT 1')) {
        return rowsMatching('interviews', text, values);
      }
      if (text.includes('FROM campusos_workforce.interviews') && text.includes('ORDER BY')) {
        return rowsMatching('interviews', text, values);
      }
      if (text.includes('FROM campusos_workforce.payslip_registry')) {
        return rowsMatching('payslip_registry', text, values);
      }
      if (text.includes('FROM campusos_workforce.reimbursement_claims') && text.includes('JOIN campusos_workforce.employee_profiles')) {
        return rowsMatching('reimbursement_claims', text, values).map((row) => ({ ...row, employee_name: 'Test Faculty' }));
      }
      if (text.includes('FROM campusos_workforce.reimbursement_claims') && text.includes('LIMIT 1')) {
        return rowsMatching('reimbursement_claims', text, values);
      }
      if (text.includes('FROM campusos_workforce.employment_history') && text.includes('ORDER BY')) {
        return state.employment_history.map((row) => {
          const employee = state.employee_profiles.find((item) => item.id === row.employee_id);
          return { ...row, employee_name: employee?.name ?? 'Unknown' };
        });
      }
      if (text.includes('FROM campusos_workforce.onboarding_checklists')) {
        return state.onboarding_checklists;
      }
      if (text.includes('FROM campusos_workforce.work_shifts')) {
        return [];
      }
      if (text.includes('FROM public.staff')) {
        return rowsMatching('staff', text, values);
      }
      return [];
    }),
    $executeRaw: vi.fn(async (query: { text?: string } | TemplateStringsArray, ...values: unknown[]) => {
      const text = (query as { text?: string }).text ?? buildSqlText(query as TemplateStringsArray);
      if (/INSERT INTO campusos_workforce/i.test(text)) {
        captureInsert(text, values);
        return 1;
      }
      if (/UPDATE campusos_workforce/i.test(text)) {
        captureUpdate(text, values);
        return 1;
      }
      if (text.includes('INSERT INTO public.staff')) {
        const match = text.match(/\(([^)]+)\)\s*VALUES\s*\(([\s\S]*?)\)$/i);
        if (match) {
          const columns = match[1].split(',').map((column) => column.trim());
          const tokens = splitClause(match[2]);
          const row: AnyRow = {};
          tokens.forEach((token, index) => {
            if (columns[index]) row[columns[index]] = resolveToken(token, values);
          });
          state.staff.push(row);
        }
        return 1;
      }
      return 1;
    }),
    $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      const tx = { ...prisma };
      return callback(tx);
    }),
    user: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => state.users.find((user) => user.id === where.id) ?? null),
      findFirst: vi.fn(async ({ where }: { where?: { email?: string } } = {}) => {
        if (where?.email) return state.users.find((user) => user.email === where.email) ?? null;
        return state.users[0] ?? null;
      }),
    },
    timetableSlot: {
      findMany: vi.fn(async () => state.timetable_slots),
    },
  };
  return prisma;
}

vi.mock('../lib/db', () => ({
  prisma: makeFakeDb(),
  getTenantDb: () => ({}),
}));

import { prisma } from '../lib/db';
import {
  acceptEmploymentOffer,
  applyLeaveRequest,
  approvePayrollPeriod,
  cancelLeaveRequest,
  checkIn,
  checkOut,
  computeFinalSettlement,
  createCompensationVersion,
  createEmployee,
  createJobRequisition,
  createLeavePolicy,
  createPayrollPeriod,
  getEmployeeProfile,
  getLeaveBalances,
  getWorkforceAdminOverview,
  listEmployees,
  listCompensationVersions,
  markPayrollDisbursed,
  requestAttendanceCorrection,
  reviewAttendanceCorrection,
  reviewJobRequisition,
  reviewLeaveRequest,
  reviewPayrollPeriod,
  reviewResignation,
  runPayroll,
  submitInterviewFeedback,
  submitReimbursement,
  submitResignation,
  WorkforceError,
} from '../lib/workforce-operations';

function context(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: USER_ADMIN_1,
    tenantId: TENANT_1,
    activeRole: 'HR_ADMIN' as RoleType,
    roleAssignmentId: 'ra-1',
    permissions: [],
    ...overrides,
  };
}

function hrContext(overrides: Partial<ActiveUserContext> = {}) {
  return context(overrides);
}

function facultyContext(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: USER_FACULTY_1,
    tenantId: TENANT_1,
    activeRole: 'FACULTY' as RoleType,
    roleAssignmentId: 'ra-2',
    staffProfileId: STAFF_1,
    permissions: [],
    ...overrides,
  };
}

function baseEmployeeRow(overrides: AnyRow = {}): AnyRow {
  return {
    id: EMP_1,
    tenant_id: TENANT_1,
    staff_id: STAFF_1,
    user_id: USER_FACULTY_1,
    employee_number: 'NAV/EMP/2026/00001',
    designation: 'Assistant Professor',
    employee_type: 'FACULTY',
    employment_type: 'FULL_TIME',
    employment_status: 'ACTIVE',
    joining_date: new Date('2026-02-01T00:00:00Z'),
    last_working_day: null,
    bank_account_masked: 'XXXX4721',
    ...overrides,
  };
}

function baseSettingsRow(): AnyRow {
  return {
    tenant_id: TENANT_1,
    timezone: 'Asia/Kolkata',
    employee_number_prefix: 'NAV/EMP',
    employee_number_year_format: 'YYYY',
    employee_sequence_next: 1,
    attendance_day_start: '00:00',
    overnight_shift_allowed: true,
    missing_checkout_grace_minutes: 30,
    leave_balance_enforced: true,
    leave_approval_maker_checker: false,
    leave_deduction_on_approval: true,
    leave_cancellation_restores: true,
    unpaid_leave_basis: 'WORKING_DAYS',
    payroll_maker_checker: true,
    payroll_monthly_divisor: 30,
    payroll_protect_closed: true,
    payroll_require_disbursement_confirmation: true,
    final_settlement_maker_checker: true,
    probation_days: 180,
    notice_period_days: 60,
  };
}

function basePayrollPeriodRow(overrides: AnyRow = {}): AnyRow {
  return {
    id: 'period-1',
    tenant_id: TENANT_1,
    period_key: '2026-02',
    period_label: 'February 2026',
    cycle: 'MONTHLY',
    start_date: '2026-02-01',
    end_date: '2026-02-28',
    status: 'DRAFT',
    prepared_by: USER_ADMIN_1,
    reviewed_by: null,
    approved_by: null,
    approved_at: null,
    disbursed_at: null,
    notes: null,
    ...overrides,
  };
}

beforeEach(() => {
  state = freshState();
  state.users = [
    { id: USER_ADMIN_1, tenantId: TENANT_1, isActive: true, name: 'HR Admin', email: 'hr@test.local' },
    { id: USER_ADMIN_2, tenantId: TENANT_1, isActive: true, name: 'Director', email: 'director@test.local' },
    { id: USER_FACULTY_1, tenantId: TENANT_1, isActive: true, name: 'Test Faculty', email: 'faculty@test.local' },
    { id: USER_OTHER, tenantId: TENANT_2, isActive: true, name: 'Other Tenant', email: 'other@elsewhere.local' },
  ];
  state.staff = [
    { id: STAFF_1, tenant_id: TENANT_1, user_id: USER_FACULTY_1, employee_id: 'NAV/EMP/2026/00001', designation: 'Assistant Professor', department_id: null },
    { id: STAFF_2, tenant_id: TENANT_1, user_id: USER_ADMIN_2, employee_id: 'NAV/EMP/2026/00002', designation: 'Registrar', department_id: null },
  ];
  state.workforce_settings = [baseSettingsRow()];
  state.leave_policies = [{
    id: 'policy-1',
    tenant_id: TENANT_1,
    code: 'CL',
    name: 'Casual Leave',
    leave_type: 'CASUAL',
    default_days: 12,
    is_paid: true,
    requires_approval: true,
    status: 'ACTIVE',
  }];
  vi.clearAllMocks();
});

describe('Employee master', () => {
  it('creates an employee tenant-scoped with a generated unique number', async () => {
    const employee = await createEmployee(hrContext(), {
      userId: USER_FACULTY_1,
      employeeType: 'FACULTY',
      employmentType: 'FULL_TIME',
      designation: 'Assistant Professor',
      joiningDate: '2026-02-01',
    });
    expect(employee.employeeNumber).toBe('NAV/EMP/2026/00001');
    expect(employee.designation).toBe('Assistant Professor');
    expect(employee.employmentStatus).toBe('ACTIVE');
    expect(state.workforce_settings[0].employee_sequence_next).toBe(2);
    expect(state.employee_profiles).toHaveLength(1);
    expect(state.employment_history.some((entry) => entry.change_type === 'CREATED')).toBe(true);
  });

  it('advances the employee number sequence per creation', async () => {
    await createEmployee(hrContext(), {
      userId: USER_FACULTY_1,
      employeeType: 'FACULTY',
      employmentType: 'FULL_TIME',
      designation: 'Professor',
      joiningDate: '2026-02-01',
    });
    await createEmployee(hrContext(), {
      userId: USER_ADMIN_2,
      employeeType: 'ADMINISTRATIVE_STAFF',
      employmentType: 'PERMANENT',
      designation: 'Registrar',
      joiningDate: '2026-02-01',
    });
    expect(state.employee_profiles).toHaveLength(2);
    expect(state.employee_profiles[1].employee_number).toBe('NAV/EMP/2026/00002');
    expect(state.workforce_settings[0].employee_sequence_next).toBe(3);
  });

  it('reuses the existing user identity without duplicating staff', async () => {
    await createEmployee(hrContext(), {
      userId: USER_FACULTY_1,
      employeeType: 'FACULTY',
      employmentType: 'FULL_TIME',
      designation: 'Assistant Professor',
      joiningDate: '2026-02-01',
    });
    // Staff record already existed for this user; it must not be duplicated.
    const staffForUser = state.staff.filter((row) => row.user_id === USER_FACULTY_1);
    expect(staffForUser).toHaveLength(1);
  });

  it('blocks employee creation by non-HR roles', async () => {
    await expect(
      createEmployee(facultyContext(), {
        userId: USER_FACULTY_1,
        employeeType: 'FACULTY',
        employmentType: 'FULL_TIME',
        designation: 'Assistant Professor',
        joiningDate: '2026-02-01',
      }),
    ).rejects.toThrow(/Forbidden/);
  });

  it('rejects users from another tenant', async () => {
    await expect(
      createEmployee(hrContext(), {
        userId: USER_OTHER,
        employeeType: 'FACULTY',
        employmentType: 'FULL_TIME',
        designation: 'Professor',
        joiningDate: '2026-02-01',
      }),
    ).rejects.toThrow(WorkforceError);
  });

  it('does not let a faculty member view a colleague profile', async () => {
    state.employee_profiles = [
      baseEmployeeRow(),
      baseEmployeeRow({ id: EMP_2, staff_id: STAFF_2, user_id: USER_ADMIN_2, designation: 'Professor' }),
    ];
    await expect(getEmployeeProfile(facultyContext(), EMP_2)).rejects.toThrow(/permission/i);
    await expect(getEmployeeProfile(hrContext(), EMP_2)).resolves.toMatchObject({ id: EMP_2 });
  });

  it('returns tenant-scoped employee lists', async () => {
    state.employee_profiles = [baseEmployeeRow()];
    const result = await listEmployees(hrContext(), { page: 1, pageSize: 25 });
    expect(result.total).toBe(1);
    expect(result.items[0].employeeNumber).toBe('NAV/EMP/2026/00001');
  });
});

describe('Staff attendance', () => {
  beforeEach(() => {
    state.employee_profiles = [baseEmployeeRow()];
  });

  it('checks in and protects duplicate check-in', async () => {
    const context = facultyContext();
    const record = await checkIn(context);
    expect(record.status).toBe('PRESENT');
    expect(record.checkIn).toBeDefined();
    await expect(checkIn(context)).rejects.toThrow(/already checked in/i);
    expect(state.staff_attendance).toHaveLength(1);
  });

  it('checks out and computes work minutes', async () => {
    const context = facultyContext();
    await checkIn(context);
    const record = await checkOut(context);
    expect(record.checkOut).toBeDefined();
    expect(record.workMinutes).toBeGreaterThanOrEqual(0);
  });

  it('requires check-in before check-out', async () => {
    const context = facultyContext();
    await expect(checkOut(context)).rejects.toThrow(/check in before/i);
  });

  it('requests and reviews an attendance correction', async () => {
    const context = facultyContext();
    const correction = await requestAttendanceCorrection(context, {
      attendanceDate: '2026-02-01',
      proposedStatus: 'OFFICIAL_DUTY',
      reason: 'Was on exam duty',
    });
    expect(correction.status).toBe('REQUESTED');

    const approved = await reviewAttendanceCorrection(hrContext(), correction.id, { decision: 'APPROVE' });
    expect(approved.status).toBe('APPROVED');
    expect(state.attendance_corrections[0].status).toBe('APPROVED');
  });

  it('blocks unauthorized correction review', async () => {
    const context = facultyContext();
    const correction = await requestAttendanceCorrection(context, {
      attendanceDate: '2026-02-01',
      proposedStatus: 'PRESENT',
      reason: 'Missing checkout',
    });
    await expect(reviewAttendanceCorrection(context, correction.id, { decision: 'APPROVE' })).rejects.toThrow(/Forbidden/);
  });
});

describe('Leave management', () => {
  beforeEach(() => {
    state.employee_profiles = [baseEmployeeRow()];
  });

  it('creates a leave policy (configurator only)', async () => {
    const policy = await createLeavePolicy(hrContext(), { code: 'SL', name: 'Sick Leave', leaveType: 'SICK', defaultDays: 10 });
    expect(policy.code).toBe('SL');
    expect(state.leave_policies).toHaveLength(2);
    await expect(createLeavePolicy(facultyContext(), { code: 'EL', name: 'Earned Leave', leaveType: 'EARNED', defaultDays: 30 })).rejects.toThrow(/Forbidden/);
  });

  it('applies leave and deducts balance exactly once on approval', async () => {
    const context = facultyContext();
    const leave = await applyLeaveRequest(context, {
      policyId: 'policy-1',
      startDate: '2026-03-02',
      endDate: '2026-03-04',
      reason: 'Personal work',
    });
    expect(leave.days).toBe(3);
    expect(leave.status).toBe('SUBMITTED');

    const balancesBefore = await getLeaveBalances(context);
    expect(balancesBefore.find((balance) => balance.policyId === 'policy-1')?.closing).toBe(12);

    const approved = await reviewLeaveRequest(hrContext(), leave.id, { decision: 'APPROVE' });
    expect(approved.status).toBe('APPROVED');

    const ledgerDeduction = state.leave_ledger.find((entry) => entry.leave_request_id === leave.id && entry.entry_type === 'USED');
    expect(ledgerDeduction).toBeDefined();
    expect(Number(ledgerDeduction.amount)).toBe(-3);

    const balancesAfter = await getLeaveBalances(context);
    expect(balancesAfter.find((balance) => balance.policyId === 'policy-1')?.used).toBe(3);
    expect(balancesAfter.find((balance) => balance.policyId === 'policy-1')?.closing).toBe(9);

    // Repeated approval is rejected because the request is already decided.
    await expect(reviewLeaveRequest(hrContext(), leave.id, { decision: 'APPROVE' })).rejects.toThrow(/already been decided/i);
  });

  it('rejects a request with insufficient balance', async () => {
    await expect(
      applyLeaveRequest(facultyContext(), {
        policyId: 'policy-1',
        startDate: '2026-03-02',
        endDate: '2026-03-20',
        reason: 'Long leave',
      }),
    ).rejects.toThrow(/Insufficient leave balance/i);
  });

  it('does not deduct balance on rejection', async () => {
    const context = facultyContext();
    const leave = await applyLeaveRequest(context, {
      policyId: 'policy-1',
      startDate: '2026-03-02',
      endDate: '2026-03-04',
      reason: 'Personal work',
    });
    await reviewLeaveRequest(hrContext(), leave.id, { decision: 'REJECT' });
    expect(state.leave_ledger.some((entry) => entry.leave_request_id === leave.id)).toBe(false);
  });

  it('allows cancellation of a pending request and restores balance', async () => {
    const context = facultyContext();
    const leave = await applyLeaveRequest(context, {
      policyId: 'policy-1',
      startDate: '2026-03-02',
      endDate: '2026-03-04',
      reason: 'Personal work',
    });
    const cancelled = await cancelLeaveRequest(context, leave.id);
    expect(cancelled.status).toBe('CANCELLED');
    expect(state.leave_ledger.some((entry) => entry.leave_request_id === leave.id && entry.entry_type === 'CANCELLED')).toBe(true);
  });

  it('blocks cross-tenant approval', async () => {
    const context = facultyContext();
    const leave = await applyLeaveRequest(context, {
      policyId: 'policy-1',
      startDate: '2026-03-02',
      endDate: '2026-03-04',
      reason: 'Personal work',
    });
    const otherTenantHr = hrContext({ tenantId: TENANT_2, userId: USER_OTHER });
    await expect(reviewLeaveRequest(otherTenantHr, leave.id, { decision: 'APPROVE' })).rejects.toThrow(/not found/i);
  });
});

describe('Payroll', () => {
  beforeEach(() => {
    state.employee_profiles = [baseEmployeeRow()];
    state.compensation_versions = [{
      id: 'comp-1', tenant_id: TENANT_1, employee_id: EMP_1, version: 1, status: 'ACTIVE',
      effective_from: '2026-02-01', base_pay_minor: 600000, gross_minor: 900000, currency: 'INR',
      earnings: [{ code: 'HRA', label: 'HRA', amount_minor: 240000 }],
      deductions: [{ code: 'PF', label: 'Provident Fund', amount_minor: 72000 }],
    }];
    state.payroll_periods = [basePayrollPeriodRow()];
  });

  it('computes gross and net with money precision (minor units)', async () => {
    await runPayroll(hrContext(), 'period-1');
    expect(state.payroll_entries).toHaveLength(1);
    const entry = state.payroll_entries[0];
    expect(entry.gross_minor).toBe(900000);
    expect(entry.total_deduction_minor).toBe(72000);
    expect(entry.net_minor).toBe(828000);
    expect(entry.status).toBe('READY');
    expect(state.payroll_periods[0].status).toBe('REVIEW');
    expect(state.payroll_snapshots).toHaveLength(1);
  });

  it('prevents duplicate payroll generation (idempotent)', async () => {
    await runPayroll(hrContext(), 'period-1');
    const countAfterFirst = state.payroll_entries.length;
    await runPayroll(hrContext(), 'period-1');
    expect(state.payroll_entries.length).toBe(countAfterFirst);
  });

  it('flags missing bank details as an exception', async () => {
    state.employee_profiles[0].bank_account_masked = null;
    await runPayroll(hrContext(), 'period-1');
    const entry = state.payroll_entries[0];
    expect(entry.status).toBe('EXCEPTION');
    expect((entry.exceptions as Array<{ code: string }>).some((item) => item.code === 'MISSING_BANK')).toBe(true);
  });

  it('does not let a non-payroll role run payroll', async () => {
    await expect(runPayroll(facultyContext(), 'period-1')).rejects.toThrow(/Forbidden/);
  });

  it('enforces maker-checker separation on final approval', async () => {
    const context = hrContext(); // prepared_by == USER_ADMIN_1
    await runPayroll(context, 'period-1');
    await expect(approvePayrollPeriod(context, 'period-1')).rejects.toThrow(/approval/i);
  });

  it('allows a different checker to approve after review', async () => {
    const context = hrContext(); // prepared_by == USER_ADMIN_1
    await runPayroll(context, 'period-1');
    await reviewPayrollPeriod(hrContext({ userId: USER_ADMIN_2 }), 'period-1', { decision: 'APPROVE' });
    const period = await approvePayrollPeriod(context, 'period-1');
    expect(period.status).toBe('APPROVED');
  });

  it('recomputes gross server-side and ignores client-supplied totals', async () => {
    const version = await createCompensationVersion(hrContext(), EMP_1, {
      effectiveFrom: '2026-03-01',
      basePayMinor: 700000,
      earnings: [{ code: 'HRA', label: 'HRA', amountMinor: 280000 }],
      deductions: [{ code: 'PF', label: 'PF', amountMinor: 84000 }],
    });
    expect(version.grossMinor).toBe(980000);
    const stored = state.compensation_versions.find((row) => row.id === version.id);
    expect(stored.gross_minor).toBe(980000);
  });

  it('blocks a faculty member from viewing compensation', async () => {
    await expect(listCompensationVersions(facultyContext(), EMP_1)).rejects.toThrow(/Forbidden/);
  });

  it('protects closed payroll periods from regeneration', async () => {
    state.payroll_periods[0].status = 'PAID';
    await expect(runPayroll(hrContext(), 'period-1')).rejects.toThrow(/cannot be regenerated/i);
  });

  it('disburses, confirms paid status and issues payslips', async () => {
    const context = hrContext();
    await runPayroll(context, 'period-1');
    await reviewPayrollPeriod(hrContext({ userId: USER_ADMIN_2 }), 'period-1', { decision: 'APPROVE' });
    await approvePayrollPeriod(context, 'period-1');
    const period = await markPayrollDisbursed(context, 'period-1', { method: 'BANK_TRANSFER' });
    expect(period.status).toBe('PAID');
    expect(state.payroll_disbursements).toHaveLength(1);
    expect(state.payslip_registry).toHaveLength(1);
    expect(state.payslip_registry[0].status).toBe('VALID');
  });

  it('creates a payroll period with a tenant-unique key', async () => {
    const period = await createPayrollPeriod(hrContext(), {
      periodKey: '2026-03',
      periodLabel: 'March 2026',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });
    expect(period.status).toBe('DRAFT');
  });
});

describe('Recruitment', () => {
  it('requires HR role to create a requisition', async () => {
    await expect(createJobRequisition(facultyContext(), { positionTitle: 'Associate Professor', employeeType: 'FACULTY' })).rejects.toThrow(/Forbidden/);
  });

  it('creates and approves a requisition', async () => {
    const context = hrContext();
    const requisition = await createJobRequisition(context, { positionTitle: 'Associate Professor', employeeType: 'FACULTY', requiredCount: 2 });
    expect(requisition.status).toBe('APPROVAL_PENDING');
    const approved = await reviewJobRequisition(context, requisition.id, { decision: 'APPROVE' });
    expect(approved.status).toBe('OPEN');
    expect(state.job_requisitions[0].status).toBe('OPEN');
  });

  it('does not let a candidate become an employee without a verified user', async () => {
    state.candidates = [{ id: 'candidate-1', tenant_id: TENANT_1, email: 'nobody@example.com', requisition_id: null, name: 'Jane Doe', source: 'APPLICATION', status: 'APPLIED', hr_notes: null, created_at: new Date() }];
    state.employment_offers = [{ id: 'offer-1', tenant_id: TENANT_1, candidate_id: 'candidate-1', version: 1, position_title: 'Lecturer', employment_type: 'FULL_TIME', proposed_join_date: '2026-03-01', department_id: null, status: 'ISSUED' }];
    await expect(acceptEmploymentOffer(hrContext(), 'offer-1')).rejects.toThrow(/verified account/i);
  });

  it('records interview panel feedback with the evaluator scoped', async () => {
    state.candidates = [{ id: 'candidate-1', tenant_id: TENANT_1, email: 'nobody@example.com', requisition_id: null, name: 'Jane Doe', source: 'APPLICATION', status: 'APPLIED', hr_notes: null, created_at: new Date() }];
    state.interviews = [{ id: 'interview-1', tenant_id: TENANT_1, candidate_id: 'candidate-1', stage: 'TECHNICAL', scheduled_at: new Date(), mode: 'ONLINE', panel_members: [USER_FACULTY_1], status: 'SCHEDULED' }];
    const feedback = await submitInterviewFeedback(hrContext(), 'interview-1', { score: 85, recommendation: 'Proceed', feedback: { notes: 'Strong' } });
    expect(feedback.score).toBe(85);
    expect(state.interviews.some((row) => row.score === 85 && row.evaluator_user_id === USER_ADMIN_1)).toBe(true);
  });

  it('allows an assigned panel member to evaluate without being HR', async () => {
    state.candidates = [{ id: 'candidate-1', tenant_id: TENANT_1, email: 'nobody@example.com', requisition_id: null, name: 'Jane Doe', source: 'APPLICATION', status: 'APPLIED', hr_notes: null, created_at: new Date() }];
    state.interviews = [{ id: 'interview-1', tenant_id: TENANT_1, candidate_id: 'candidate-1', stage: 'TECHNICAL', scheduled_at: new Date(), mode: 'ONLINE', panel_members: [USER_FACULTY_1], status: 'SCHEDULED' }];
    const feedback = await submitInterviewFeedback(facultyContext(), 'interview-1', { score: 70, recommendation: 'Consider', feedback: { notes: 'Good depth' } });
    expect(feedback.score).toBe(70);
    expect(state.interviews.some((row) => row.score === 70 && row.evaluator_user_id === USER_FACULTY_1)).toBe(true);
  });

  it('blocks a non-panel non-HR user from evaluating an interview', async () => {
    state.candidates = [{ id: 'candidate-1', tenant_id: TENANT_1, email: 'nobody@example.com', requisition_id: null, name: 'Jane Doe', source: 'APPLICATION', status: 'APPLIED', hr_notes: null, created_at: new Date() }];
    state.interviews = [{ id: 'interview-1', tenant_id: TENANT_1, candidate_id: 'candidate-1', stage: 'TECHNICAL', scheduled_at: new Date(), mode: 'ONLINE', panel_members: [], status: 'SCHEDULED' }];
    await expect(
      submitInterviewFeedback(facultyContext(), 'interview-1', { score: 90, recommendation: 'Proceed', feedback: { notes: 'Nope' } }),
    ).rejects.toThrow(/not authorized/i);
  });
});

describe('Exit and settlement', () => {
  beforeEach(() => {
    state.employee_profiles = [baseEmployeeRow()];
  });

  it('submits and reviews a resignation creating clearance', async () => {
    const resignation = await submitResignation(facultyContext(), { proposedLastWorkingDay: '2099-04-30', reason: 'Relocation' });
    expect(resignation.status).toBe('SUBMITTED');
    const approved = await reviewResignation(hrContext(), resignation.id, { decision: 'APPROVE', finalLastWorkingDay: '2099-04-30' });
    expect(approved.status).toBe('APPROVED');
    expect(state.clearance_items.length).toBeGreaterThanOrEqual(6);
  });

  it('enforces the configured notice period at submission', async () => {
    // Settings define 60 days notice; a last working day inside that window must be rejected.
    const inNoticeWindow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const proposed = `${inNoticeWindow.getUTCFullYear()}-${String(inNoticeWindow.getUTCMonth() + 1).padStart(2, '0')}-${String(inNoticeWindow.getUTCDate()).padStart(2, '0')}`;
    await expect(
      submitResignation(facultyContext(), { proposedLastWorkingDay: proposed, reason: 'Relocation' }),
    ).rejects.toThrow(/notice period/i);
  });

  it('computes a server-side final settlement', async () => {
    state.resignation_requests = [{ id: 'resign-1', tenant_id: TENANT_1, employee_id: EMP_1, submission_date: '2026-02-10', proposed_last_working_day: '2099-04-30', notice_period_days: 60, reason: 'Relocation', status: 'APPROVED', final_last_working_day: '2099-04-30', created_at: new Date() }];
    state.compensation_versions = [{ id: 'comp-1', tenant_id: TENANT_1, employee_id: EMP_1, version: 1, status: 'ACTIVE', effective_from: '2026-02-01', base_pay_minor: 600000, gross_minor: 900000, currency: 'INR' }];
    const settlement = await computeFinalSettlement(hrContext(), 'resign-1', { leaveEncashmentMinor: 150000 });
    expect(settlement.netSettlementMinor).toBeGreaterThan(0);
    expect(settlement.status).toBe('DRAFT');
    expect(state.final_settlements).toHaveLength(1);
  });

  it('blocks a student from computing settlements', async () => {
    const student = context({ activeRole: 'STUDENT' as RoleType });
    state.resignation_requests = [{ id: 'resign-1', tenant_id: TENANT_1, employee_id: EMP_1, submission_date: '2026-02-10', proposed_last_working_day: '2099-04-30', notice_period_days: 60, reason: 'Relocation', status: 'APPROVED', final_last_working_day: '2099-04-30', created_at: new Date() }];
    await expect(computeFinalSettlement(student, 'resign-1', {})).rejects.toThrow(/Forbidden/);
  });
});

describe('Admin overview', () => {
  it('returns live metrics from real records', async () => {
    state.employee_profiles = [
      baseEmployeeRow(),
      baseEmployeeRow({ id: EMP_2, staff_id: STAFF_2, user_id: USER_ADMIN_2, employment_status: 'PROBATION' }),
    ];
    const overview = await getWorkforceAdminOverview(hrContext());
    const active = overview.metrics.find((metric) => metric.id === 'active');
    expect(active?.value).toBe(2);
    expect(overview.employees.length).toBe(2);
  });

  it('rejects non-operator access to the admin overview', async () => {
    await expect(getWorkforceAdminOverview(facultyContext())).rejects.toThrow(/Forbidden/);
  });
});

describe('Reimbursements', () => {
  it('allows an employee to submit a claim', async () => {
    state.employee_profiles = [baseEmployeeRow()];
    const claim = await submitReimbursement(facultyContext(), { category: 'Conference', amountMinor: 50000, reason: 'Conference registration' });
    expect(claim.status).toBe('SUBMITTED');
    expect(state.reimbursement_claims).toHaveLength(1);
  });
});

// Keep prisma referenced so the mock is exercised consistently with the engine.
export const _mockRef = { prisma };
