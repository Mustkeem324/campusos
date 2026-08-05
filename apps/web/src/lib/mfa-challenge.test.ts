import { describe, expect, it } from 'vitest';

import { createMfaChallenge, verifyMfaChallenge } from './mfa-challenge';

describe('MFA login challenge', () => {
  it('round-trips a signed challenge without exposing a raw user identifier', () => {
    const token = createMfaChallenge(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    );

    expect(token).not.toBe('11111111-1111-4111-8111-111111111111');
    expect(verifyMfaChallenge(token)).toEqual({
      purpose: 'campusos-mfa',
      userId: '11111111-1111-4111-8111-111111111111',
      tenantId: '22222222-2222-4222-8222-222222222222',
    });
  });

  it('rejects a modified challenge', () => {
    const token = createMfaChallenge(
      '11111111-1111-4111-8111-111111111111',
      '22222222-2222-4222-8222-222222222222',
    );
    expect(verifyMfaChallenge(`${token}x`)).toBeNull();
  });
});
