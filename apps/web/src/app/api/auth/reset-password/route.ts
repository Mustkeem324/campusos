import { NextResponse } from 'next/server';

import {
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
} from '../../../../lib/public-rate-limit';
import { POST as securePasswordReset } from '../password/reset/route';

const LEGACY_RESET_BODY_LIMIT_BYTES = 8 * 1024;

/**
 * Compatibility adapter for clients that still send `{ token, password }` to
 * the historical URL. All security decisions are delegated to the canonical
 * single-use, rate-limited reset handler.
 */
export async function POST(request: Request) {
  try {
    const body = await readJsonWithLimit(request, LEGACY_RESET_BODY_LIMIT_BYTES);
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const headers = new Headers(request.headers);
    headers.delete('content-length');
    headers.set('content-type', 'application/json');

    return securePasswordReset(new Request(request.url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        token: payload.token,
        newPassword: payload.newPassword ?? payload.password,
      }),
    }));
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) {
      return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    }
    if (error instanceof InvalidJsonError) {
      return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    }
    console.error('Legacy password reset adapter failed:', error);
    return NextResponse.json({ error: 'Unable to reset the password.' }, { status: 500 });
  }
}
