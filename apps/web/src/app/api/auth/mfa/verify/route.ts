import { NextResponse } from 'next/server';
import { z } from 'zod';

import { completeMfaLogin } from '@/lib/mfa-session';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '@/lib/public-rate-limit';

const MFA_BODY_LIMIT_BYTES = 4 * 1024;
const MFA_RATE_LIMIT_PER_IP = 20;
const MFA_RATE_WINDOW_MS = 10 * 60_000;

const verifySchema = z.object({
  // Kept as `userId` for backward compatibility with legacy callers, but its
  // value is now required to be a signed, short-lived MFA challenge - never a
  // raw account identifier. A raw userId is rejected so this endpoint can no
  // longer be used to authenticate as an arbitrary account.
  userId: z.string().min(40),
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(request: Request) {
  try {
    const clientIp = requestIp(request);
    const rateLimit = checkPublicRateLimit({
      key: `mfa:${clientIp}`,
      limit: MFA_RATE_LIMIT_PER_IP,
      windowMs: MFA_RATE_WINDOW_MS,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many verification attempts. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonWithLimit(request, MFA_BODY_LIMIT_BYTES);
    const { userId: challengeToken, code } = verifySchema.parse(body);

    return await completeMfaLogin(request, challengeToken, code, false);
  } catch (error: unknown) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Enter a valid 6-digit authentication code.' }, { status: 400 });
    }
    console.error('MFA verification failed:', error);
    return NextResponse.json({ error: 'Unable to verify the authentication code.' }, { status: 500 });
  }
}
