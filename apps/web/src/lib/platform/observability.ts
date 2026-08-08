import { randomUUID } from 'node:crypto';

export const REQUEST_ID_HEADER = 'x-request-id';

export function requestId(headers: Headers): string {
  const supplied = headers.get(REQUEST_ID_HEADER);
  return supplied && /^[A-Za-z0-9_-]{8,128}$/.test(supplied) ? supplied : randomUUID();
}

export function logRequest(fields: {
  requestId: string;
  method: string;
  route: string;
  status: number;
  durationMs: number;
}): void {
  // Structured JSON is safe for log aggregation and intentionally excludes
  // request bodies, credentials, cookies, and query parameters.
  console.info(JSON.stringify({ event: 'http_request', ...fields }));
}
