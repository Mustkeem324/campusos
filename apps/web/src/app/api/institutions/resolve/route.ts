import { NextResponse } from 'next/server';

import { prisma } from '../../../../lib/db';
import {
  checkPublicRateLimit,
  InvalidJsonError,
  PayloadTooLargeError,
  readJsonWithLimit,
  requestIp,
} from '../../../../lib/public-rate-limit';

const WORKSPACE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const LOOKUP_BODY_LIMIT_BYTES = 2 * 1024;

export async function POST(request: Request) {
  try {
    const ip = requestIp(request);
    const rateLimit = checkPublicRateLimit({ key: `institution-lookup:${ip}`, limit: 20, windowMs: 10 * 60_000 });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: 'Too many workspace lookups. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
      );
    }

    const body = await readJsonWithLimit(request, LOOKUP_BODY_LIMIT_BYTES);
    const payload = body && typeof body === 'object' ? body as Record<string, unknown> : {};
    const subdomain = String(payload.subdomain ?? '').trim().toLowerCase();

    if (!WORKSPACE_PATTERN.test(subdomain)) {
      return NextResponse.json({ error: 'Enter a valid institution workspace.' }, { status: 400 });
    }

    const institution = await prisma.institution.findUnique({
      where: { subdomain },
      select: { name: true, subdomain: true, status: true, logoUrl: true },
    });

    if (!institution || ['SUSPENDED', 'INACTIVE', 'DISABLED'].includes(institution.status.toUpperCase())) {
      return NextResponse.json({ error: 'Institution workspace not found or unavailable.' }, { status: 404 });
    }

    return NextResponse.json({
      institution: {
        name: institution.name,
        subdomain: institution.subdomain,
        logoUrl: institution.logoUrl,
      },
      loginUrl: `/login?workspace=${encodeURIComponent(institution.subdomain)}`,
    });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) return NextResponse.json({ error: 'Request payload is too large.' }, { status: 413 });
    if (error instanceof InvalidJsonError) return NextResponse.json({ error: 'Request body must be valid JSON.' }, { status: 400 });
    console.error('Institution workspace resolution failed:', error);
    return NextResponse.json({ error: 'Unable to verify the institution workspace right now.' }, { status: 500 });
  }
}
