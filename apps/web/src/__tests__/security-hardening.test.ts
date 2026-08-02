import { describe, it, expect } from 'vitest';
import { encryptSensitiveField, decryptSensitiveField, checkSlidingWindowRateLimit } from '../lib/security-service';

describe('Phase 9 Production Security Hardening Test Suite', () => {
  it('should encrypt and decrypt sensitive fields with AES-256-GCM', () => {
    const sensitiveData = 'NATIONAL-ID-9941-2026';
    const enc = encryptSensitiveField(sensitiveData);

    expect(enc.encryptedData).not.toBe(sensitiveData);
    expect(enc.iv).toBeDefined();
    expect(enc.tag).toBeDefined();

    const dec = decryptSensitiveField(enc.encryptedData, enc.iv, enc.tag);
    expect(dec).toBe(sensitiveData);
  });

  it('should enforce Redis sliding window rate limit when request threshold is exceeded', () => {
    const key = 'test_ip_rate_limit';

    // Send 3 requests (Max allowed: 3)
    const r1 = checkSlidingWindowRateLimit(key, 3, 60000);
    const r2 = checkSlidingWindowRateLimit(key, 3, 60000);
    const r3 = checkSlidingWindowRateLimit(key, 3, 60000);

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(true);

    // 4th Request exceeds window threshold -> Must be blocked!
    const r4 = checkSlidingWindowRateLimit(key, 3, 60000);
    expect(r4.allowed).toBe(false);
    expect(r4.remaining).toBe(0);
  });
});
