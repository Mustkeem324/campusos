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

describe('API-wide dangerous security patterns', () => {
  it('contains no hard-coded OTP/PIN authentication checks', () => {
    const violations: string[] = [];
    const pattern = /\b(?:code|otp|pin)\s*===?\s*['"]\d{4,8}['"]/gi;
    for (const file of routeFiles(API_ROOT)) {
      const content = readFileSync(file, 'utf8');
      if (pattern.test(content)) violations.push(relative(API_ROOT, file));
      pattern.lastIndex = 0;
    }
    expect(violations, `Hard-coded OTP/PIN checks found:\n${violations.join('\n')}`).toEqual([]);
  });

  it('contains no literal fallback for secret/key/token/password environment variables', () => {
    const violations: string[] = [];
    const pattern = /process\.env\.[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY|API_KEY)[A-Z0-9_]*\s*\|\|\s*['"][^'"]+['"]/g;
    for (const file of routeFiles(API_ROOT)) {
      const content = readFileSync(file, 'utf8');
      if (pattern.test(content)) violations.push(relative(API_ROOT, file));
      pattern.lastIndex = 0;
    }
    expect(violations, `Literal secret fallbacks found:\n${violations.join('\n')}`).toEqual([]);
  });

  it('keeps retired auth and generic payment downgrade routes inert', () => {
    const paymentCreate = readFileSync(resolve(API_ROOT, 'payments/create/route.ts'), 'utf8');
    const paymentWebhook = readFileSync(resolve(API_ROOT, 'payments/webhook/route.ts'), 'utf8');
    const legacyVerifyEmail = readFileSync(resolve(API_ROOT, 'auth/verify-email/route.ts'), 'utf8');
    expect(paymentCreate).toContain('{ status: 410 }');
    expect(paymentWebhook).toContain('{ status: 410 }');
    expect(legacyVerifyEmail).toContain('{ status: 410 }');
    expect(paymentCreate).not.toContain('mock_public_key');
    expect(paymentCreate).not.toContain('crypto.randomBytes');
  });
});
