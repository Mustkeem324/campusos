import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { RoleType } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { PayloadTooLargeError, readTextWithLimit } from '../lib/public-rate-limit';
import { hasPermission } from '../lib/rbac';
import { ROLE_PERMISSIONS as GRANULAR_ROLE_PERMISSIONS } from '../lib/types';

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), 'utf8');
}

describe('critical authentication and payment regressions', () => {
  it('keeps the nested MFA URL on the canonical challenge-based verifier', () => {
    const legacyMfa = source('apps/web/src/app/api/auth/mfa/verify/route.ts');
    expect(legacyMfa).toContain("export { POST } from '../../mfa-verify/route'");
    expect(legacyMfa).not.toContain('123456');
    expect(legacyMfa).not.toContain('createSession');
  });

  it('does not allow MFA setup to overwrite an already-enabled factor', () => {
    const securityRoute = source('apps/web/src/app/api/security/route.ts');
    expect(securityRoute).toContain('if (user.mfaEnabled)');
    expect(securityRoute).toContain('{ status: 409 }');
  });

  it('keeps production JWT signing fail-closed when JWT_SECRET is absent', () => {
    const auth = source('apps/web/src/lib/auth.ts');
    expect(auth).toContain("if (process.env.NODE_ENV === 'production')");
    expect(auth).toContain("throw new Error('JWT_SECRET must be configured in production.')");
  });

  it('retires the generic payment webhook instead of mutating the ledger', () => {
    const legacyWebhook = source('apps/web/src/app/api/payments/webhook/route.ts');
    expect(legacyWebhook).toContain('{ status: 410 }');
    expect(legacyWebhook).not.toContain('dev_secret_key');
    expect(legacyWebhook).not.toContain('prisma.payment');
  });

  it('routes the old forgot-password URL to the canonical hardened handler', () => {
    const legacyForgot = source('apps/web/src/app/api/auth/forgot-password/route.ts');
    expect(legacyForgot).toContain("export { POST } from '../password/forgot/route'");
    expect(legacyForgot).not.toContain('resetTokenExpiry');
  });

  it('keeps account activation on the password-setting API', () => {
    const activationPage = source('apps/web/src/app/(auth)/activate-account/page.tsx');
    expect(activationPage).toContain("fetch('/api/auth/activate-account'");
    expect(activationPage).toContain('password');
    expect(activationPage).not.toContain("fetch('/api/auth/activate'");
  });

  it('wires verification resend to the token-rotating API', () => {
    const verifyPage = source('apps/web/src/app/(auth)/verify-email/page.tsx');
    const resendRoute = source('apps/web/src/app/api/auth/resend-verification/route.ts');
    expect(verifyPage).toContain("fetch('/api/auth/resend-verification'");
    expect(resendRoute).toContain('hashOneTimeToken');
    expect(resendRoute).toContain('checkPublicRateLimit');
  });

  it('does not inject tenantId into nested chat models that lack that column', () => {
    const db = source('apps/web/src/lib/db.ts');
    const tenantList = db.slice(db.indexOf('const TENANT_MODELS'), db.indexOf('/**\n * Service Layer Authorization'));
    expect(tenantList).not.toContain("'ChatPollOption'");
    expect(tenantList).not.toContain("'ChatPollVote'");
  });

  it('keeps the RBAC matrix free of placeholder permissions and preserves admin read access', () => {
    const rbac = source('apps/web/src/lib/rbac.ts');
    expect(rbac).not.toContain('manage_academic_records');
    expect(rbac).not.toContain(' as any');
    expect(hasPermission('EXAMINATION_CONTROLLER', 'view_academic_records')).toBe(true);
    expect(hasPermission('EXAMINATION_CONTROLLER', 'edit_academic_records')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'view_finance')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'view_hostel')).toBe(true);
    expect(hasPermission('SUPER_ADMIN', 'view_library')).toBe(true);
    expect(hasPermission('INSTITUTION_ADMIN', 'view_finance')).toBe(true);
    expect(hasPermission('INSTITUTION_ADMIN', 'view_hostel')).toBe(true);
    expect(hasPermission('INSTITUTION_ADMIN', 'view_library')).toBe(true);
  });

  it('assigns granular permissions to every supported Prisma role', () => {
    for (const role of Object.values(RoleType)) {
      expect(GRANULAR_ROLE_PERMISSIONS[role], `${role} must have a permission entry`).toBeDefined();
      expect(GRANULAR_ROLE_PERMISSIONS[role].length, `${role} must not silently have zero permissions`).toBeGreaterThan(0);
    }
  });

  it('hard-caps streamed request bodies even without Content-Length', async () => {
    const request = new Request('http://localhost/api/test', {
      method: 'POST',
      body: 'x'.repeat(1025),
    });
    expect(request.headers.get('content-length')).toBeNull();
    await expect(readTextWithLimit(request, 1024)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });
});
