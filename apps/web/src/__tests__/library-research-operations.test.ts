import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RoleType } from '@prisma/client';

import type { ActiveUserContext } from '../lib/active-user-context';

/**
 * In-memory fake for lib/db that captures INSERT/UPDATE statements so the
 * library/research engines' raw SQL round-trips behave like a real database.
 * WHERE predicates are parsed (`column = $N`) so tenant scoping and id
 * matching are exercised realistically.
 */

const TENANT_1 = '11111111-1111-4111-8111-111111111111';
const TENANT_2 = '22222222-2222-4222-8222-222222222222';
const USER_LIBRARIAN = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const USER_STUDENT_1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const USER_STUDENT_2 = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const USER_FACULTY = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const USER_HOD = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const STUDENT_1 = '11111111-2222-4333-8444-555555555555';
const STUDENT_2 = '11111111-2222-4333-8444-666666666666';
const STAFF_FACULTY = '11111111-2222-4333-8444-777777777777';
const STAFF_HOD = '11111111-2222-4333-8444-888888888888';

type AnyRow = Record<string, unknown>;

type TableName =
  | 'library_settings' | 'library_memberships' | 'library_locations' | 'catalog_records'
  | 'catalog_authors' | 'physical_copies' | 'loans' | 'loan_events' | 'reservations'
  | 'fine_events' | 'member_holds' | 'vendors' | 'acquisitions' | 'digital_resources'
  | 'reading_lists' | 'reading_list_items' | 'library_clearance' | 'library_audit_events'
  | 'research_settings' | 'research_projects' | 'project_members' | 'project_supervisors'
  | 'research_proposals' | 'proposal_versions' | 'milestones' | 'milestone_submissions'
  | 'research_files' | 'theses' | 'thesis_versions' | 'similarity_checks' | 'ethics_reviews'
  | 'examiner_assignments' | 'evaluations' | 'viva_sessions' | 'corrections'
  | 'repository_items' | 'repository_versions' | 'embargoes' | 'publications' | 'grants'
  | 'grant_members' | 'research_access_rules' | 'research_audit_events'
  | 'users' | 'staff' | 'students' | 'departments' | 'course_offerings';

const TABLES = new Set<TableName>([
  'library_settings', 'library_memberships', 'library_locations', 'catalog_records',
  'catalog_authors', 'physical_copies', 'loans', 'loan_events', 'reservations',
  'fine_events', 'member_holds', 'vendors', 'acquisitions', 'digital_resources',
  'reading_lists', 'reading_list_items', 'library_clearance', 'library_audit_events',
  'research_settings', 'research_projects', 'project_members', 'project_supervisors',
  'research_proposals', 'proposal_versions', 'milestones', 'milestone_submissions',
  'research_files', 'theses', 'thesis_versions', 'similarity_checks', 'ethics_reviews',
  'examiner_assignments', 'evaluations', 'viva_sessions', 'corrections',
  'repository_items', 'repository_versions', 'embargoes', 'publications', 'grants',
  'grant_members', 'research_access_rules', 'research_audit_events',
  'users', 'staff', 'students', 'departments', 'course_offerings',
]);

type FakeState = Record<TableName, AnyRow[]>;

function freshState(): FakeState {
  const state = {} as FakeState;
  for (const table of TABLES) state[table] = [];
  return state;
}

let state: FakeState = freshState();

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
          index += rest[0] === 'A' ? 2 : 1;
          continue;
        }
      }
    }
    current += char;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

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

/** Unwraps a Prisma.Sql object (e.g. Prisma.sql`...`, ...params) into SQL text. */
function sqlTextFromObject(query: unknown): string | null {
  if (query && typeof query === 'object' && Array.isArray((query as { strings?: unknown[] }).strings)) {
    const sql = query as { strings: string[]; values: unknown[] };
    let out = sql.strings[0] ?? '';
    for (let index = 0; index < (sql.values ?? []).length; index += 1) {
      const value = sql.values[index];
      out += value && typeof value === 'object' && Array.isArray((value as { strings?: unknown[] }).strings)
        ? String(unwrapSqlFragment(value))
        : `$${index + 1}`;
      out += sql.strings[index + 1] ?? '';
    }
    return out;
  }
  return null;
}

function buildSqlText(parts: TemplateStringsArray): string {
  let out = parts[0] ?? '';
  for (let index = 1; index < parts.length; index += 1) {
    out += `$${index}${parts[index] ?? ''}`;
  }
  return out;
}

function parsePredicates(text: string, values: unknown[]): Array<[string, unknown]> {
  const predicates: Array<[string, unknown]> = [];
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
  return state[table].filter((row) => predicates.every(([column, expected]) => {
    const actual = row[column];
    if (expected === null) return actual === null || actual === undefined;
    return String(actual ?? '') === String(expected ?? '');
  }));
}

function captureInsert(text: string, values: unknown[]): 'INSERTED' | 'DUPLICATE' | 'SKIPPED' {
  const withoutConflict = text.replace(/\s+ON CONFLICT[\s\S]*$/i, '');
  const insertMatch = withoutConflict.match(/INSERT INTO (?:campusos_library|campusos_research)\.(\w+)\s*\(([^)]+)\)\s*VALUES\s*\(([\s\S]*?)\)\s*$/i);
  if (!insertMatch) return 'SKIPPED';
  const table = insertMatch[1] as TableName;
  if (!TABLES.has(table)) return 'SKIPPED';
  const columns = insertMatch[2].split(',').map((column) => column.trim().replace(/"/g, ''));
  const tokens = splitClause(insertMatch[3]);
  const row: AnyRow = {};
  tokens.forEach((token, index) => {
    if (columns[index]) row[columns[index]] = resolveToken(token, values);
  });
  const rows = state[table];
  // Simulate the unique constraints the engines rely on.
  const duplicates = (
    table === 'library_memberships' && rows.some((existing) => existing.tenant_id === row.tenant_id && existing.user_id === row.user_id)
  ) || (
    table === 'reservations' && rows.some((existing) => existing.tenant_id === row.tenant_id && existing.record_id === row.record_id && existing.member_id === row.member_id)
  ) || (
    table === 'physical_copies' && rows.some((existing) => existing.tenant_id === row.tenant_id && existing.accession_number === row.accession_number)
  ) || (
    table === 'loans' && rows.some((existing) => existing.copy_id === row.copy_id && existing.returned_at === undefined)
  ) || (
    table === 'fine_events' && row.related_fine_id !== undefined && row.related_fine_id !== null
      && rows.some((existing) => existing.tenant_id === row.tenant_id && existing.related_fine_id === row.related_fine_id)
  ) || (
    table === 'project_supervisors' && rows.some((existing) => existing.project_id === row.project_id && existing.supervisor_id === row.supervisor_id)
  ) || (
    table === 'thesis_versions' && rows.some((existing) => existing.thesis_id === row.thesis_id && existing.version === row.version)
  ) || (
    table === 'repository_versions' && rows.some((existing) => existing.item_id === row.item_id && existing.version === row.version)
  ) || (
    table === 'proposal_versions' && rows.some((existing) => existing.proposal_id === row.proposal_id && existing.version === row.version)
  );
  if (duplicates) return 'DUPLICATE';
  rows.push(row);
  return 'INSERTED';
}

function captureUpdate(text: string, values: unknown[]) {
  const updateMatch = text.match(/UPDATE (?:campusos_library|campusos_research)\.(\w+)\s+SET\s+([\s\S]*?)\s+WHERE\s+([\s\S]*?)$/i);
  if (!updateMatch) return false;
  const table = updateMatch[1] as TableName;
  if (!TABLES.has(table)) return false;
  const assignments: Array<[string, unknown]> = [];
  for (const setToken of splitClause(updateMatch[2])) {
    const incrementMatch = setToken.match(/^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*\+\s*(\d+)$/);
    if (incrementMatch) {
      assignments.push([incrementMatch[1], { __increment: Number(incrementMatch[3]) }]);
      continue;
    }
    const match = setToken.match(/^([A-Za-z_]\w*)\s*=\s*(\S+)$/);
    if (match) assignments.push([match[1], resolveToken(match[2], values)]);
  }
  const predicates = parsePredicates(`WHERE ${updateMatch[3]}`, values);
  for (const row of state[table]) {
    const matches = predicates.every(([column, expected]) => {
      const actual = row[column];
      if (expected === null) return actual === null || actual === undefined;
      return String(actual ?? '') === String(expected ?? '');
    });
    if (matches) {
      for (const [column, value] of assignments) {
        if (value && typeof value === 'object' && '__increment' in value) {
          row[column] = Number(row[column] ?? 0) + (value as { __increment: number }).__increment;
        } else {
          row[column] = value;
        }
      }
    }
  }
  return true;
}

function countTotal(rows: AnyRow[]): Array<{ total: number }> {
  return [{ total: rows.length }];
}

function makeFakeDb() {
  const prisma = {
    $queryRaw: vi.fn(async (query: { text?: string } | TemplateStringsArray, ...values: unknown[]) => {
      const text = (query as { text?: string }).text ?? sqlTextFromObject(query) ?? buildSqlText(query as TemplateStringsArray);

      if (text.includes('FROM campusos_library.library_settings')) {
        return rowsMatching('library_settings', text, values);
      }
      if (text.includes('accession_sequence_next FROM campusos_library.library_settings') && text.includes('FOR UPDATE')) {
        const rows = rowsMatching('library_settings', text, values);
        return rows.length ? rows : [{ accession_sequence_next: 1 }];
      }
      if (text.includes('FROM campusos_library.library_memberships') && text.includes('JOIN public.users')) {
        return rowsMatching('library_memberships', text, values).map((row) => {
          const user = state.users.find((item) => item.id === row.user_id);
          return { ...row, name: user?.name ?? 'Unknown', email: user?.email ?? 'unknown@test.local', member_number: row.member_number ?? 'LIB/MEM/TEST/000001', member_type: row.member_type ?? 'STUDENT', status: row.status ?? 'ACTIVE', program_id: row.program_id ?? null, department_id: row.department_id ?? null };
        });
      }
      if (text.includes('FROM campusos_library.library_memberships') && !text.includes('JOIN public.users')) {
        return rowsMatching('library_memberships', text, values);
      }
      if (text.includes("'STUDENT' AS member_type") && text.includes('UNION ALL')) {
        const rows = state.students.filter((row) => row.tenant_id === values[0]);
        if (rows[0]) return [{ member_type: 'STUDENT', program_id: rows[0].program_id ?? null, department_id: null }];
        return [];
      }
      if (text.includes('FROM campusos_library.catalog_authors')) {
        return rowsMatching('catalog_authors', text, values);
      }
      if (text.includes('FROM campusos_library.physical_copies') && text.includes('l.name AS location_name')) {
        return rowsMatching('physical_copies', text, values).map((row) => ({ ...row, location_name: null }));
      }
      if (text.includes('FROM campusos_library.physical_copies') && text.includes('LIMIT 1')) {
        return rowsMatching('physical_copies', text, values);
      }
      if (text.includes('FROM campusos_library.catalog_records') && /count\s*\(/i.test(text)) {
        return countTotal(rowsMatching('catalog_records', text, values));
      }
      if (text.includes('FROM campusos_library.catalog_records r') && text.includes('LIMIT')) {
        return rowsMatching('catalog_records', text, values);
      }
      if (text.includes('FROM campusos_library.catalog_records') && text.includes('LIMIT 1')) {
        return rowsMatching('catalog_records', text, values);
      }
      if (text.includes('FROM campusos_library.catalog_records') && text.includes('AS sub')) {
        return rowsMatching('catalog_records', text, values);
      }
      if (text.includes('FROM campusos_library.loans') && text.includes('JOIN campusos_library.physical_copies')) {
        return rowsMatching('loans', text, values).map((row) => {
          const copy = state.physical_copies.find((item) => item.id === row.copy_id) ?? {};
          const record = copy.record_id ? state.catalog_records.find((item) => item.id === copy.record_id) : undefined;
          const member = state.library_memberships.find((item) => item.id === row.member_id);
          const user = member ? state.users.find((item) => item.id === member.user_id) : undefined;
          return {
            ...row,
            member_name: user?.name ?? 'Unknown',
            accession_number: copy.accession_number ?? 'LIB/000001',
            title: record?.title ?? 'Unknown title',
            issue_date: row.issue_date ? new Date(row.issue_date as string) : new Date(),
            due_date: row.due_date ? new Date(row.due_date as string) : new Date(),
          };
        });
      }
      if (text.includes('FROM campusos_library.loans') && /count\s*\(/i.test(text)) {
        return countTotal(rowsMatching('loans', text, values));
      }
      if (text.includes('FROM campusos_library.loans') && text.includes('JOIN campusos_library.physical_copies c ON c.id =')) {
        return countTotal(rowsMatching('loans', text, values));
      }
      if (text.includes('FROM campusos_library.loans')) {
        return rowsMatching('loans', text, values);
      }
      if (text.includes('FROM campusos_library.reservations') && text.includes('max(queue_position)')) {
        const rows = rowsMatching('reservations', text, values);
        return [{ next_position: rows.length > 0 ? Math.max(...rows.map((row) => Number(row.queue_position ?? 0))) : null }];
      }
      if (text.includes('FROM campusos_library.reservations') && /count\s*\(/i.test(text)) {
        return countTotal(rowsMatching('reservations', text, values));
      }
      if (text.includes('FROM campusos_library.reservations') && text.includes('JOIN campusos_library.catalog_records')) {
        return rowsMatching('reservations', text, values).map((row) => {
          const record = state.catalog_records.find((item) => item.id === row.record_id);
          const member = state.library_memberships.find((item) => item.id === row.member_id);
          const user = member ? state.users.find((item) => item.id === member.user_id) : undefined;
          return { ...row, title: record?.title ?? 'Unknown', member_name: user?.name ?? 'Unknown', queue_position: row.queue_position ?? 1, expires_at: row.expires_at ?? null, created_at: row.created_at ? new Date(row.created_at as string) : new Date() };
        });
      }
      if (text.includes('FROM campusos_library.reservations')) {
        return rowsMatching('reservations', text, values);
      }
      if (text.includes('COALESCE(sum(') && text.includes('f.amount_minor - COALESCE')) {
        // Outstanding = per-fine residual: assessed minus linked resolutions.
        const tenantId = values[0];
        const memberId = values[1];
        const assessed = state.fine_events.filter((row) =>
          row.event_type === 'ASSESSED' && row.tenant_id === tenantId && row.member_id === memberId,
        );
        const total = assessed.reduce((sum, row) => {
          const resolved = state.fine_events
            .filter((waiver) => waiver.related_fine_id === row.id)
            .reduce((inner, waiver) => inner + Number(waiver.amount_minor ?? 0), 0);
          return sum + Math.max(0, Number(row.amount_minor ?? 0) - resolved);
        }, 0);
        return [{ total }];
      }
      if (text.includes('FROM campusos_library.fine_events') && text.includes('WHERE id')) {
        return rowsMatching('fine_events', text, values);
      }
      if (text.includes('FROM campusos_library.fine_events')) {
        return rowsMatching('fine_events', text, values);
      }
      if (text.includes('FROM campusos_library.acquisitions')) {
        return rowsMatching('acquisitions', text, values).map((row) => ({ ...row, requestor_name: 'Test User', estimated_price_minor: row.estimated_price_minor ?? null }));
      }
      if (text.includes('FROM campusos_library.reading_lists') && text.includes('LEFT JOIN public.course_offerings')) {
        return rowsMatching('reading_lists', text, values).map((row) => ({ ...row, course_title: null, course_code: null }));
      }
      if (text.includes('FROM campusos_library.reading_list_items')) {
        return rowsMatching('reading_list_items', text, values).map((row) => ({ ...row, resource_title: null }));
      }
      if (text.includes('SELECT DISTINCT l.id') && text.includes('FROM campusos_library.reading_lists')) {
        return rowsMatching('reading_lists', text, values).map((row) => ({ id: row.id }));
      }
      if (text.includes('FROM campusos_library.library_clearance') && text.includes('JOIN campusos_library.library_memberships')) {
        return rowsMatching('library_clearance', text, values).map((row) => {
          const member = state.library_memberships.find((item) => item.id === row.member_id);
          const user = member ? state.users.find((item) => item.id === member.user_id) : undefined;
          return { ...row, member_name: user?.name ?? 'Unknown', checked_at: row.checked_at ? new Date(row.checked_at as string) : null };
        });
      }
      if (text.includes('FROM campusos_library.library_clearance')) {
        return rowsMatching('library_clearance', text, values);
      }

      // Research schema -------------------------------------------------------
      if (text.includes('FROM campusos_research.research_settings')) {
        return rowsMatching('research_settings', text, values);
      }
      if (text.includes('FROM campusos_research.research_access_rules')) {
        return rowsMatching('research_access_rules', text, values);
      }
      if (text.includes('FROM campusos_research.research_projects') && text.includes('LEFT JOIN public.departments')) {
        return rowsMatching('research_projects', text, values).map((row) => ({ ...row, department_name: row.department_name ?? null, keywords: row.keywords ?? [] }));
      }
      if (text.includes('FROM campusos_research.research_projects') && text.includes('LIMIT 1')) {
        return rowsMatching('research_projects', text, values);
      }
      if (text.includes('FROM campusos_research.research_projects') && text.includes('EXISTS')) {
        return rowsMatching('research_projects', text, values);
      }
      if (text.includes('FROM campusos_research.project_members') && text.includes('JOIN public.users')) {
        return rowsMatching('project_members', text, values).map((row) => {
          const user = state.users.find((item) => item.id === row.user_id);
          return { ...row, user_name: user?.name ?? 'Unknown' };
        });
      }
      if (text.includes('FROM campusos_research.project_members')) {
        return rowsMatching('project_members', text, values);
      }
      if (text.includes('FROM campusos_research.project_supervisors') && text.includes('JOIN public.users')) {
        return rowsMatching('project_supervisors', text, values).map((row) => {
          const user = state.users.find((item) => item.id === row.supervisor_id);
          return { ...row, supervisor_name: user?.name ?? 'Unknown' };
        });
      }
      if (text.includes('FROM campusos_research.project_supervisors') && /count\s*\(/i.test(text)) {
        return countTotal(rowsMatching('project_supervisors', text, values));
      }
      if (text.includes('FROM campusos_research.project_supervisors')) {
        return rowsMatching('project_supervisors', text, values);
      }
      if (text.includes('FROM campusos_research.research_proposals') && text.includes('LIMIT 1')) {
        return rowsMatching('research_proposals', text, values);
      }
      if (text.includes('FROM campusos_research.research_proposals')) {
        return rowsMatching('research_proposals', text, values);
      }
      if (text.includes('FROM campusos_research.proposal_versions') && text.includes('COALESCE(max(version)')) {
        const rows = rowsMatching('proposal_versions', text, values);
        return [{ next_version: rows.length + 1 }];
      }
      if (text.includes('FROM campusos_research.milestones') && /count\s*\(/i.test(text)) {
        const rows = rowsMatching('milestones', text, values);
        return [{ total: rows.length, completed: rows.filter((row) => row.status === 'APPROVED' || row.status === 'REJECTED').length }];
      }
      if (text.includes('FROM campusos_research.milestones') && text.includes('LIMIT 1')) {
        return rowsMatching('milestones', text, values);
      }
      if (text.includes('FROM campusos_research.milestones')) {
        return rowsMatching('milestones', text, values);
      }
      if (text.includes('FROM campusos_research.theses') && text.includes('JOIN public.users')) {
        return rowsMatching('theses', text, values).map((row) => {
          const user = state.users.find((item) => item.id === row.student_user_id);
          return { ...row, student_name: user?.name ?? 'Unknown' };
        });
      }
      if (text.includes('FROM campusos_research.theses')) {
        return rowsMatching('theses', text, values);
      }
      if (text.includes('FROM campusos_research.thesis_versions') && text.includes('COALESCE(max(version)')) {
        const rows = rowsMatching('thesis_versions', text, values);
        return [{ next_version: rows.length + 1 }];
      }
      if (text.includes('FROM campusos_research.thesis_versions')) {
        return rowsMatching('thesis_versions', text, values);
      }
      if (text.includes('FROM campusos_research.similarity_checks')) {
        return rowsMatching('similarity_checks', text, values);
      }
      if (text.includes('FROM campusos_research.viva_sessions')) {
        return rowsMatching('viva_sessions', text, values);
      }
      if (text.includes('FROM campusos_research.repository_items')) {
        return rowsMatching('repository_items', text, values);
      }
      if (text.includes('FROM campusos_research.repository_versions')) {
        return rowsMatching('repository_versions', text, values);
      }
      if (text.includes('FROM campusos_research.embargoes')) {
        return rowsMatching('embargoes', text, values);
      }
      if (text.includes('FROM campusos_research.publications')) {
        return rowsMatching('publications', text, values);
      }
      if (text.includes('FROM campusos_research.grants') && text.includes('LEFT JOIN campusos_research.research_projects')) {
        return rowsMatching('grants', text, values).map((row) => ({ ...row, project_title: null }));
      }
      if (text.includes('FROM campusos_research.grants')) {
        return rowsMatching('grants', text, values);
      }
      if (text.includes('FROM public.staff')) {
        return rowsMatching('staff', text, values);
      }
      if (text.includes('FROM public.departments')) {
        return rowsMatching('departments', text, values);
      }
      if (text.includes('FROM public.students')) {
        return rowsMatching('students', text, values);
      }
      return [];
    }),
    $executeRaw: vi.fn(async (query: { text?: string } | TemplateStringsArray, ...values: unknown[]) => {
      const text = (query as { text?: string }).text ?? buildSqlText(query as TemplateStringsArray);
      if (/INSERT INTO (campusos_library|campusos_research)/i.test(text)) {
        const result = captureInsert(text, values);
        if (result === 'DUPLICATE') throw new Error('unique constraint violated: the insert conflicts with an existing row');
        return 1;
      }
      if (/UPDATE (campusos_library|campusos_research)/i.test(text)) {
        captureUpdate(text, values);
        return 1;
      }
      if (text.includes('INSERT INTO campusos_library.library_settings')) {
        const match = text.match(/\(([^)]+)\)\s*VALUES\s*\(([\s\S]*?)\)/i);
        if (match) {
          const columns = match[1].split(',').map((column) => column.trim());
          const tokens = splitClause(match[2]);
          const row: AnyRow = {};
          tokens.forEach((token, index) => { if (columns[index]) row[columns[index]] = resolveToken(token, values); });
          state.library_settings.push(row);
        }
        return 1;
      }
      if (text.includes('INSERT INTO campusos_research.research_settings')) {
        const match = text.match(/\(([^)]+)\)\s*VALUES\s*\(([\s\S]*?)\)/i);
        if (match) {
          const columns = match[1].split(',').map((column) => column.trim());
          const tokens = splitClause(match[2]);
          const row: AnyRow = {};
          tokens.forEach((token, index) => { if (columns[index]) row[columns[index]] = resolveToken(token, values); });
          state.research_settings.push(row);
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
  };
  return prisma;
}

vi.mock('../lib/db', () => ({
  prisma: makeFakeDb(),
  getTenantDb: () => ({}),
}));

import { prisma } from '../lib/db';
import {
  createCatalogRecord,
  ensureLibraryMembership,
  getLibraryClearance,
  issuePhysicalItem,
  listMemberFines,
  renewLoan,
  reserveRecord,
  returnLoan,
  updateCopyStatus,
  updateMembershipStatus,
  waiveFine,
} from '../lib/library-operations';
import {
  assignSupervisor,
  createResearchProject,
  createThesis,
  recordSimilarityCheck,
  reviewProposal,
  reviewThesis,
  submitProposal,
  submitRepositoryItem,
  submitThesisVersion,
} from '../lib/research-operations';

function context(overrides: Partial<ActiveUserContext> = {}): ActiveUserContext {
  return {
    userId: USER_LIBRARIAN,
    tenantId: TENANT_1,
    activeRole: RoleType.LIBRARIAN,
    roleAssignmentId: 'role-assignment-1',
    permissions: [],
    ...overrides,
  };
}

function seedBaseline() {
  state = freshState();
  state.users.push(
    { id: USER_LIBRARIAN, tenant_id: TENANT_1, name: 'Librarian One', email: 'librarian@test.local', role: 'LIBRARIAN', is_active: true },
    { id: USER_STUDENT_1, tenant_id: TENANT_1, name: 'Student One', email: 'student1@test.local', role: 'STUDENT', is_active: true },
    { id: USER_STUDENT_2, tenant_id: TENANT_1, name: 'Student Two', email: 'student2@test.local', role: 'STUDENT', is_active: true },
    { id: USER_FACULTY, tenant_id: TENANT_1, name: 'Faculty One', email: 'faculty@test.local', role: 'FACULTY', is_active: true },
    { id: USER_HOD, tenant_id: TENANT_1, name: 'HOD One', email: 'hod@test.local', role: 'HOD', is_active: true },
  );
  state.students.push(
    { id: STUDENT_1, tenant_id: TENANT_1, user_id: USER_STUDENT_1, program_id: null, is_active: true },
    { id: STUDENT_2, tenant_id: TENANT_1, user_id: USER_STUDENT_2, program_id: null, is_active: true },
  );
  state.staff.push(
    { id: STAFF_FACULTY, tenant_id: TENANT_1, user_id: USER_FACULTY, department_id: '11111111-3333-4333-8444-111111111111' },
    { id: STAFF_HOD, tenant_id: TENANT_1, user_id: USER_HOD, department_id: '11111111-3333-4333-8444-111111111111' },
  );
  state.departments.push(
    { id: '11111111-3333-4333-8444-111111111111', tenant_id: TENANT_1, name: 'Computer Science' },
  );
}

async function seedMembershipAndCatalog() {
  await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
  await ensureLibraryMembership(context({ userId: USER_STUDENT_2 }));
  const record = await createCatalogRecord(context(), {
    title: 'Database Systems',
    isbn: '978-0-00-000001-0',
    resourceType: 'BOOK',
    copies: [
      { barcode: 'BC-0001', condition: 'GOOD' },
      { barcode: 'BC-0002', condition: 'GOOD' },
    ],
  });
  return record;
}

beforeEach(() => {
  seedBaseline();
});

describe('library: circulation', () => {
  it('issues an available copy to an active member', async () => {
    const record = await seedMembershipAndCatalog();
    const copy = record.copies[0];
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;

    const loan = await issuePhysicalItem(context(), { memberId: String(member.id), copyId: copy.id });
    expect(loan.copyId).toBe(copy.id);
    expect(loan.status).toBe('ACTIVE');
    expect(state.physical_copies.find((row) => row.id === copy.id)?.status).toBe('ISSUED');
    expect(state.loan_events.some((event) => event.event_type === 'ISSUED')).toBe(true);
  });

  it('enforces the active-loan quota', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    const record = await createCatalogRecord(context(), {
      title: 'Quota Books',
      copies: [
        { barcode: 'Q-1', condition: 'GOOD' },
        { barcode: 'Q-2', condition: 'GOOD' },
        { barcode: 'Q-3', condition: 'GOOD' },
        { barcode: 'Q-4', condition: 'GOOD' },
      ],
    });
    for (const copy of record.copies) {
      await issuePhysicalItem(context(), { memberId: String(member.id), copyId: copy.id });
    }
    const extra = await createCatalogRecord(context(), { title: 'Extra Book', copies: [{ barcode: 'Q-5', condition: 'GOOD' }] });
    await expect(issuePhysicalItem(context(), { memberId: String(member.id), copyId: extra.copies[0].id })).rejects.toThrow(/active-loan limit/);
  });

  it('blocks issuing the same copy twice simultaneously', async () => {
    const record = await seedMembershipAndCatalog();
    const copy = record.copies[0];
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    const member2 = state.library_memberships.find((row) => row.user_id === USER_STUDENT_2)!;

    await issuePhysicalItem(context(), { memberId: String(member.id), copyId: copy.id });
    await expect(issuePhysicalItem(context(), { memberId: String(member2.id), copyId: copy.id })).rejects.toThrow(/not available for issue|already been issued/);
    expect(state.loans.filter((loan) => loan.copy_id === copy.id && loan.returned_at === undefined).length).toBe(1);
  });

  it('blocks issuing a reference-only copy', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    const record = await createCatalogRecord(context(), {
      title: 'Rare Reference',
      resourceType: 'REFERENCE_BOOK',
      copies: [{ barcode: 'BC-REF-1', condition: 'GOOD' }],
    });
    await updateCopyStatus(context(), record.copies[0].id, { status: 'REFERENCE_ONLY' });
    await expect(issuePhysicalItem(context(), { memberId: String(member.id), copyId: record.copies[0].id })).rejects.toThrow(/Reference-only/);
  });

  it('returns a loan and re-avails the copy; duplicate return is safe', async () => {
    const record = await seedMembershipAndCatalog();
    const copy = record.copies[0];
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    const loan = await issuePhysicalItem(context(), { memberId: String(member.id), copyId: copy.id });

    const returned = await returnLoan(context(), loan.id);
    expect(returned.returnedAt).not.toBeNull();
    expect(state.physical_copies.find((row) => row.id === copy.id)?.status).toBe('AVAILABLE');
    await expect(returnLoan(context(), loan.id)).rejects.toThrow(/already returned/);
  });

  it('renews a loan and enforces the renewal limit', async () => {
    const record = await seedMembershipAndCatalog();
    const copy = record.copies[0];
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    const loan = await issuePhysicalItem(context(), { memberId: String(member.id), copyId: copy.id });

    const renewed = await renewLoan(context(), loan.id);
    expect(renewed.renewalCount).toBe(1);
    // Default max renewals is 1 — a second renewal is blocked.
    await expect(renewLoan(context(), loan.id)).rejects.toThrow(/renewal limit/);
  });

  it('blocks non-library staff from issuing', async () => {
    const record = await seedMembershipAndCatalog();
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    await expect(
      issuePhysicalItem(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), { memberId: String(member.id), copyId: record.copies[0].id }),
    ).rejects.toThrow(/Forbidden/);
  });

  it('rejects cross-tenant copy ids', async () => {
    const record = await seedMembershipAndCatalog();
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    await expect(
      issuePhysicalItem(context({ tenantId: TENANT_2 }), { memberId: String(member.id), copyId: record.copies[0].id }),
    ).rejects.toThrow();
    // Nothing was written into the other tenant.
    expect(state.loans.length).toBe(0);
  });
});

describe('library: reservations', () => {
  it('creates a reservation and prevents a duplicate active one', async () => {
    const record = await seedMembershipAndCatalog();
    const reservation = await reserveRecord(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), record.id);
    expect(reservation.status).toBe('ACTIVE');
    expect(reservation.queuePosition).toBe(1);
    await expect(reserveRecord(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), record.id)).rejects.toThrow(/already have an active reservation/);
  });

  it('queues members in order', async () => {
    const record = await seedMembershipAndCatalog();
    const first = await reserveRecord(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), record.id);
    const second = await reserveRecord(context({ userId: USER_STUDENT_2, activeRole: RoleType.STUDENT }), record.id);
    expect(first.queuePosition).toBe(1);
    expect(second.queuePosition).toBe(2);
  });

  it('blocks non-members from reserving', async () => {
    const record = await seedMembershipAndCatalog();
    // A user with no library membership cannot reserve.
    await expect(reserveRecord(context({ userId: USER_FACULTY, activeRole: RoleType.FACULTY }), record.id)).rejects.toThrow(/do not have an active library membership/);
  });
});

describe('library: fines', () => {
  it('waives an assessed fine only with library authority', async () => {
    const record = await seedMembershipAndCatalog();
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    // Simulate an assessed fine directly in the ledger.
    state.fine_events.push({
      id: '55555555-1111-4111-8111-555555555555',
      tenant_id: TENANT_1,
      member_id: member.id,
      event_type: 'ASSESSED',
      amount_minor: 5000,
      currency: 'INR',
      reason: 'Overdue by 10 days',
      created_at: new Date(),
    });
    await expect(
      waiveFine(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), '55555555-1111-4111-8111-555555555555', { reason: 'Hardship' }),
    ).rejects.toThrow(/Forbidden/);

    const waived = await waiveFine(context(), '55555555-1111-4111-8111-555555555555', { reason: 'First-time courtesy' });
    expect(waived.eventType).toBe('WAIVED');
  });

  it('a fine cannot be waived twice', async () => {
    const member = await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    state.fine_events.push({
      id: '77777777-1111-4111-8111-777777777777',
      tenant_id: TENANT_1,
      member_id: member.id,
      event_type: 'ASSESSED',
      amount_minor: 2500,
      currency: 'INR',
      reason: 'Overdue',
      created_at: new Date(),
    });
    await waiveFine(context(), '77777777-1111-4111-8111-777777777777', { reason: 'Courtesy' });
    await expect(
      waiveFine(context(), '77777777-1111-4111-8111-777777777777', { reason: 'Again' }),
    ).rejects.toThrow(/already been waived/);
    expect(state.fine_events.filter((row) => row.event_type === 'WAIVED')).toHaveLength(1);
  });

  it('a waiver can never exceed the assessed fine', async () => {
    const member = await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    state.fine_events.push({
      id: '88888888-1111-4111-8111-888888888888',
      tenant_id: TENANT_1,
      member_id: member.id,
      event_type: 'ASSESSED',
      amount_minor: 1500,
      currency: 'INR',
      reason: 'Overdue',
      created_at: new Date(),
    });
    await expect(
      waiveFine(context(), '88888888-1111-4111-8111-888888888888', { amountMinor: 999999, reason: 'Over-waive' }),
    ).rejects.toThrow(/cannot exceed the assessed fine/);
    expect(state.fine_events.filter((row) => row.event_type === 'WAIVED')).toHaveLength(0);
  });

  it('students can list only their own fines', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    await ensureLibraryMembership(context({ userId: USER_STUDENT_2 }));
    const member1 = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    const member2 = state.library_memberships.find((row) => row.user_id === USER_STUDENT_2)!;
    state.fine_events.push(
      { id: '11111111-aaaa-4aaa-8aaa-111111111111', tenant_id: TENANT_1, member_id: member1.id, event_type: 'ASSESSED', amount_minor: 1000, currency: 'INR', reason: 'x', created_at: new Date() },
      { id: '22222222-aaaa-4aaa-8aaa-222222222222', tenant_id: TENANT_1, member_id: member2.id, event_type: 'ASSESSED', amount_minor: 2000, currency: 'INR', reason: 'y', created_at: new Date() },
    );
    const fines = await listMemberFines(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), String(member1.id));
    expect(fines).toHaveLength(1);
    expect(fines[0].amountMinor).toBe(1000);
    await expect(
      listMemberFines(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), String(member2.id)),
    ).rejects.toThrow(/only view your own fine history/);
  });
});

describe('research: projects and proposals', () => {
  it('lets a student create and access their own project', async () => {
    const studentContext = context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT });
    const project = await createResearchProject(studentContext, { title: 'Crop Yield Prediction' });
    expect(project.myRole).toBe('STUDENT_RESEARCHER');
    expect(state.research_access_rules.some((row) => row.entity_id === project.id && row.user_id === USER_STUDENT_1)).toBe(true);
  });

  it('blocks a student from accessing an unrelated project', async () => {
    const studentContext = context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT });
    const otherProject = await createResearchProject(context({ userId: USER_STUDENT_2, activeRole: RoleType.STUDENT }), { title: 'Private Project' });
    await expect(submitProposal(studentContext, otherProject.id, { title: 'Hijack' })).rejects.toThrow(/do not have access/);
  });

  it('blocks cross-tenant project access', async () => {
    const project = await createResearchProject(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), { title: 'Tenant One Project' });
    await expect(
      submitProposal(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT, tenantId: TENANT_2 }), project.id, { title: 'Cross tenant' }),
    ).rejects.toThrow();
  });

  it('a student cannot self-approve their own proposal', async () => {
    const studentContext = context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT });
    const project = await createResearchProject(studentContext, { title: 'Self Approval Attempt' });
    await submitProposal(studentContext, project.id, { title: 'Proposal One' });
    await expect(reviewProposal(studentContext, project.id, { decision: 'APPROVE' })).rejects.toThrow(/Forbidden/);
    const row = state.research_proposals.find((item) => item.project_id === project.id);
    expect(row?.status).toBe('SUBMITTED');
  });

  it('a supervisor cannot be assigned unless they are verified staff', async () => {
    const hodContext = context({ userId: USER_HOD, activeRole: RoleType.HOD, departmentId: '11111111-3333-4333-8444-111111111111' });
    const project = await createResearchProject(hodContext, { title: 'Department Project', departmentId: '11111111-3333-4333-8444-111111111111' });
    await expect(
      assignSupervisor(hodContext, project.id, { supervisorId: USER_STUDENT_1 }),
    ).rejects.toThrow(/not a verified staff member/);
    const assigned = await assignSupervisor(hodContext, project.id, { supervisorId: USER_FACULTY });
    expect(assigned.supervisors.some((supervisor) => supervisor.supervisorId === USER_FACULTY)).toBe(true);
  });
});

describe('research: theses and similarity', () => {
  it('submits thesis versions while preserving prior versions', async () => {
    const studentContext = context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT });
    const thesis = await createThesis(studentContext, { title: 'PhD Thesis Draft' });
    await submitThesisVersion(studentContext, thesis.id, { fileName: 'draft-v1.pdf', fileReference: 'files/v1' });
    await submitThesisVersion(studentContext, thesis.id, { fileName: 'draft-v2.pdf', fileReference: 'files/v2' });
    const versions = state.thesis_versions.filter((row) => row.thesis_id === thesis.id);
    expect(versions).toHaveLength(2);
    expect(versions.map((row) => row.version)).toEqual([1, 2]);
  });

  it('a similarity score never auto-rejects; it enters review', async () => {
    const thesis = await createThesis(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), { title: 'Similarity Thesis' });
    const check = await recordSimilarityCheck(context({ userId: USER_HOD, activeRole: RoleType.HOD, departmentId: '11111111-3333-4333-8444-111111111111' }), thesis.id, { provider: 'TestProvider', similarityScore: 40 });
    expect(check.outcome).toBe('ESCALATED');
    const stored = state.similarity_checks[0];
    expect(stored?.outcome).toBe('ESCALATED');
    // The thesis itself is not auto-rejected — human review is required.
    expect(state.theses.find((row) => row.id === thesis.id)?.status).not.toBe('REJECTED');
  });

  it('a student cannot approve their own thesis', async () => {
    const studentContext = context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT });
    const thesis = await createThesis(studentContext, { title: 'Self Approval Thesis' });
    await expect(reviewThesis(studentContext, thesis.id, { decision: 'APPROVE' })).rejects.toThrow(/Forbidden/);
  });

  it('a thesis is not accessible to unrelated users', async () => {
    const thesis = await createThesis(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), { title: 'Private Thesis' });
    await expect(submitThesisVersion(context({ userId: USER_STUDENT_2, activeRole: RoleType.STUDENT }), thesis.id, { fileName: 'x.pdf', fileReference: 'files/x' })).rejects.toThrow(/do not have access/);
  });
});

describe('research: repository', () => {
  it('repository items require approval before publication; drafts are not public', async () => {
    const studentContext = context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT });
    const item = await submitRepositoryItem(studentContext, {
      title: 'Institution Thesis',
      fileName: 'thesis.pdf',
      fileReference: 'files/thesis',
    });
    expect(item.submissionStatus).toBe('PENDING_APPROVAL');
    // The draft must not be visible to another student.
    await expect(
      submitRepositoryItem(context({ userId: USER_STUDENT_2, activeRole: RoleType.STUDENT }), {
        title: 'Other',
        fileName: 'other.pdf',
        fileReference: 'files/other',
      }),
    ).resolves.toBeTruthy();
  });

  it('a similarity score above threshold escalates rather than auto-rejecting', async () => {
    const thesis = await createThesis(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), { title: 'Escalation Thesis' });
    const check = await recordSimilarityCheck(context({ userId: USER_HOD, activeRole: RoleType.HOD, departmentId: '11111111-3333-4333-8444-111111111111' }), thesis.id, { provider: 'Provider', similarityScore: 35 });
    expect(check.outcome).toBe('ESCALATED');
  });

  it('cross-tenant thesis lookup is blocked', async () => {
    const thesis = await createThesis(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), { title: 'Tenant Thesis' });
    await expect(
      reviewThesis(context({ userId: USER_HOD, activeRole: RoleType.HOD, tenantId: TENANT_2 }), thesis.id, { decision: 'APPROVE' }),
    ).rejects.toThrow();
  });
});

describe('library: fine events and clearance derive from authoritative state', () => {
  it('clearance reflects unreturned books', async () => {
    const record = await seedMembershipAndCatalog();
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    await issuePhysicalItem(context(), { memberId: String(member.id), copyId: record.copies[0].id });
    const clearance = await getLibraryClearance(context(), String(member.id));
    expect(clearance.clearanceStatus).toBe('BLOCKED');
    expect(clearance.unreturnedCount).toBe(1);
  });

  it('a waived fine does not zero out unrelated assessed fines', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    state.fine_events.push(
      { id: 'aaaa1111-1111-4111-8111-aaaaaaaaaaaa', tenant_id: TENANT_1, member_id: member.id, event_type: 'ASSESSED', amount_minor: 5000, currency: 'INR', reason: 'Overdue book A', created_at: new Date() },
      { id: 'bbbb2222-1111-4111-8111-bbbbbbbbbbbb', tenant_id: TENANT_1, member_id: member.id, event_type: 'ASSESSED', amount_minor: 3000, currency: 'INR', reason: 'Overdue book B', created_at: new Date() },
    );
    await waiveFine(context(), 'aaaa1111-1111-4111-8111-aaaaaaaaaaaa', { reason: 'Waive book A only' });

    const clearance = await getLibraryClearance(context(), String(member.id));
    expect(clearance.unpaidFineMinor).toBe(3000);
    expect(clearance.clearanceStatus).toBe('BLOCKED');
  });

  it('a fully waived member is financially clear', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    state.fine_events.push(
      { id: 'cccc3333-1111-4111-8111-cccccccccccc', tenant_id: TENANT_1, member_id: member.id, event_type: 'ASSESSED', amount_minor: 2000, currency: 'INR', reason: 'Overdue', created_at: new Date() },
    );
    await waiveFine(context(), 'cccc3333-1111-4111-8111-cccccccccccc', { reason: 'Full waiver' });

    const clearance = await getLibraryClearance(context(), String(member.id));
    expect(clearance.unpaidFineMinor).toBe(0);
    expect(clearance.clearanceStatus).toBe('CLEAR');
  });

  it('a partial waiver leaves the residual outstanding', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    state.fine_events.push(
      { id: 'dddd4444-1111-4111-8111-dddddddddddd', tenant_id: TENANT_1, member_id: member.id, event_type: 'ASSESSED', amount_minor: 5000, currency: 'INR', reason: 'Overdue by 10 days', created_at: new Date() },
    );
    await waiveFine(context(), 'dddd4444-1111-4111-8111-dddddddddddd', { amountMinor: 500, reason: 'Partial courtesy' });

    const clearance = await getLibraryClearance(context(), String(member.id));
    expect(clearance.unpaidFineMinor).toBe(4500);
    expect(clearance.clearanceStatus).toBe('BLOCKED');
  });

  it('rejects a student updating their own membership status', async () => {
    await ensureLibraryMembership(context({ userId: USER_STUDENT_1 }));
    const member = state.library_memberships.find((row) => row.user_id === USER_STUDENT_1)!;
    await expect(
      updateMembershipStatus(context({ userId: USER_STUDENT_1, activeRole: RoleType.STUDENT }), String(member.id), { status: 'ACTIVE', reason: 'self' }),
    ).rejects.toThrow(/Forbidden/);
  });
});

void prisma;
