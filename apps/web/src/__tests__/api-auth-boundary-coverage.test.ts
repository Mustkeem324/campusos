import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

const API_ROOT = resolve(process.cwd(), 'apps/web/src/app/api');

function routeFiles(directory: string): string[] {
  const output: string[] = [];
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) output.push(...routeFiles(path));
    else if (name === 'route.ts' || name === 'route.js') output.push(path);
  }
  return output;
}

// Routes in this set are intentionally reachable before a user session exists,
// are read-only public content, or authenticate the caller cryptographically.
// Adding an entry requires manual review; this allowlist must not become a way to
// silence the discovery test for a route whose authorization is unclear.
const INTENTIONALLY_PUBLIC = new Set([
  'auth/login/route.ts',
  'auth/mfa-verify/route.ts',
  'auth/mfa/verify/route.ts',
  'auth/signup/route.ts',
  'auth/activate-account/route.ts',
  'auth/verify-email/route.ts',
  'auth/resend-verification/route.ts',
  'auth/password/forgot/route.ts',
  'auth/password/reset/route.ts',
  'auth/forgot-password/route.ts',
  'auth/reset-password/route.ts',
  'contact/route.ts',
  'health/route.ts',
  'institutions/resolve/route.ts',
  'payments/webhook/route.ts',
  'payments/webhooks/stripe/route.ts',
  'payments/webhooks/razorpay/route.ts',
  'public/careers/jobs/route.ts',
  'public/careers/jobs/[slug]/route.ts',
  'public/guides/[slug]/download/route.ts',
  'transport/gps/ingest/route.ts',
  'hostel/provider/sync/route.ts',
]);

const AUTH_BOUNDARY_MARKERS = [
  'requireActiveUserContext(',
  'getSessionFromCookies(',
  'requireTenantContext(',
  'requireCompanyAdminContext(',
  'requireCompanyAdmin(',
  'requirePlatformAdmin(',
  'requireBlogEditor(',
  'resolvePaymentRequestContext(',
  'resolvePaymentContext(',
  'verifyApiKey(',
  'requireApiKey(',
  'verifyKiosk',
  'requireKiosk',
  'Authorization',
];

describe('API authentication-boundary coverage', () => {
  it('requires every non-public API route to declare an auth boundary', () => {
    const uncovered: string[] = [];

    for (const file of routeFiles(API_ROOT)) {
      const route = relative(API_ROOT, file).replaceAll('\\', '/');
      if (INTENTIONALLY_PUBLIC.has(route)) continue;

      const source = readFileSync(file, 'utf8');
      if (!AUTH_BOUNDARY_MARKERS.some((marker) => source.includes(marker))) {
        uncovered.push(route);
      }
    }

    expect(
      uncovered,
      `API routes without an obvious authentication boundary or explicit public classification:\n${uncovered.join('\n')}`,
    ).toEqual([]);
  });
});
