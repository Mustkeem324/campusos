/**
 * Shared guardrails for operational list APIs. Cursor payloads intentionally
 * carry the tenant scope so a cursor copied from another institution is never
 * accepted as a valid continuation token.
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

type CursorPayload = {
  v: 1;
  tenantId: string;
  id: string;
};

export class InvalidCursorError extends Error {
  constructor() {
    super('The pagination cursor is invalid or belongs to another tenant.');
    this.name = 'InvalidCursorError';
  }
}

function base64UrlEncode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function base64UrlDecode(value: string): string {
  return Buffer.from(value, 'base64url').toString('utf8');
}

export function pageSize(value: string | null | undefined, fallback = DEFAULT_PAGE_SIZE): number {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, MAX_PAGE_SIZE);
}

export function encodeCursor(tenantId: string, id: string): string {
  return base64UrlEncode(JSON.stringify({ v: 1, tenantId, id } satisfies CursorPayload));
}

export function decodeCursor(cursor: string | null, tenantId: string): string | undefined {
  if (!cursor) return undefined;
  try {
    const value = JSON.parse(base64UrlDecode(cursor)) as Partial<CursorPayload>;
    if (value.v !== 1 || value.tenantId !== tenantId || typeof value.id !== 'string' || !value.id) {
      throw new InvalidCursorError();
    }
    return value.id;
  } catch (error) {
    if (error instanceof InvalidCursorError) throw error;
    throw new InvalidCursorError();
  }
}

export function pageInfo<T extends { id: string }>(rows: T[], size: number, tenantId: string) {
  const hasNextPage = rows.length > size;
  const items = hasNextPage ? rows.slice(0, size) : rows;
  const last = items.at(-1);
  return {
    items,
    pageInfo: {
      hasNextPage,
      nextCursor: hasNextPage && last ? encodeCursor(tenantId, last.id) : null,
    },
  };
}
