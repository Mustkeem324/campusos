import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashOneTimeToken } from '../lib/phase7';
import { signToken, verifyToken } from '../lib/auth';
import type { TokenPayload } from '../lib/auth';

const emailServiceMock = vi.hoisted(() => ({
  queueEmail: vi.fn(async (_args: unknown) => ({ id: 'email-1' })),
  processEmailQueue: vi.fn(async () => ({ processed: 0, failed: 0 })),
}));

vi.mock('../lib/email-service', () => emailServiceMock);

const dbMock = vi.hoisted(() => {
  const fakeTx = {
    institution: { create: vi.fn(async (args: any) => ({ id: 'inst-uuid', ...args.data })) },
    user: { create: vi.fn(async (args: any) => ({ id: 'user-uuid', ...args.data })) },
    auditLog: { create: vi.fn(async (args: any) => ({ id: 'audit-uuid', ...args.data })) },
  };
  return {
    prisma: {
      user: {
        findFirst: vi.fn(async () => null),
        findUnique: vi.fn(async () => null),
        findMany: vi.fn(async () => []),
        update: vi.fn(async (args: any) => ({ id: 'user-uuid', ...args.data })),
      },
      institution: { findUnique: vi.fn(async () => null) },
      emailQueue: { create: vi.fn(async (_args: any) => ({ id: 'email-1' })) },
      // Handles both callback-style ($transaction(fn)) and array-style
      // ($transaction([...])) transactions used across the codebase.
      $transaction: vi.fn(async (ops: any) =>
        Array.isArray(ops) ? Promise.all(ops) : ops(fakeTx),
      ),
      session: { deleteMany: vi.fn(async () => ({ count: 1 })) },
    },
    getTenantDb: vi.fn(() => ({})),
  };
});

vi.mock('../lib/db', () => dbMock);

function makeRequest(url = 'http://localhost/api', init: RequestInit = {}, ip = '203.0.113.42') {
  const headers = new Headers(init.headers);
  headers.set('x-forwarded-for', ip);
  return new Request(url, { ...init, headers });
}

const SAMPLE_PAYLOAD: TokenPayload = {
  sessionId: 's'.repeat(64),
  userId: 'u'.repeat(36),
  tenantId: 't'.repeat(36),
  role: 'STUDENT',
};

const env = process.env as Record<string, string | undefined>;

function resetNodeEnv(value: string | undefined) {
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

describe('Audit regression: session signing secret', () => {
  const originalSecret = env.JWT_SECRET;
  const originalNodeEnv = env.NODE_ENV;

  afterEach(() => {
    if (originalSecret) env.JWT_SECRET = originalSecret;
    else delete env.JWT_SECRET;
    resetNodeEnv(originalNodeEnv);
  });

  it('signs and verifies a token when JWT_SECRET is configured', () => {
    env.JWT_SECRET = 'a-strong-test-secret-with-more-than-32-chars';
    const token = signToken(SAMPLE_PAYLOAD);
    expect(token).toBeTruthy();
    expect(verifyToken(token)).toMatchObject({ userId: SAMPLE_PAYLOAD.userId });
  });

  it('fails fast in production when JWT_SECRET is missing (no hardcoded fallback)', () => {
    delete env.JWT_SECRET;
    resetNodeEnv('production');
    expect(() => signToken(SAMPLE_PAYLOAD)).toThrow(/JWT_SECRET/);
    expect(() => verifyToken('anything')).toThrow(/JWT_SECRET/);
  });
});

describe('Audit regression: legacy MFA verify cannot be used to bypass 2FA', () => {
  it('rejects a raw user id (no signed challenge) as the userId field', async () => {
    const { POST } = await import('../app/api/auth/mfa/verify/route');
    const rawUserId = '12345678-1234-4234-8234-123456789012'; // 36 chars < 40
    const res = await POST(
      makeRequest('http://localhost/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ userId: rawUserId, code: '123456' }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects an invalid (non-challenge) token even with the legacy mock code', async () => {
    const { POST } = await import('../app/api/auth/mfa/verify/route');
    const bogus = 'a'.repeat(64); // looks like a JWT-shaped token but is not signed
    const res = await POST(
      makeRequest('http://localhost/api/auth/mfa/verify', {
        method: 'POST',
        body: JSON.stringify({ userId: bogus, code: '123456' }),
      }),
    );
    expect(res.status).toBe(401);
    expect(dbMock.prisma.user.findFirst).not.toHaveBeenCalled();
  });
});

describe('Audit regression: legacy payment webhook cannot be forged without a secret', () => {
  const original = process.env.PAYMENT_WEBHOOK_SECRET;

  afterEach(() => {
    if (original) process.env.PAYMENT_WEBHOOK_SECRET = original;
    else delete process.env.PAYMENT_WEBHOOK_SECRET;
    vi.clearAllMocks();
  });

  it('returns 503 when no webhook secret is configured (no dev fallback)', async () => {
    delete process.env.PAYMENT_WEBHOOK_SECRET;
    const { POST } = await import('../app/api/payments/webhook/route');
    const res = await POST(
      makeRequest('http://localhost/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment.captured' }),
        headers: { 'x-payment-signature': 'anything' },
      }),
    );
    expect(res.status).toBe(503);
  });

  it('returns 400 for an invalid signature when a secret is configured', async () => {
    process.env.PAYMENT_WEBHOOK_SECRET = 'configured-secret';
    const { POST } = await import('../app/api/payments/webhook/route');
    const res = await POST(
      makeRequest('http://localhost/api/payments/webhook', {
        method: 'POST',
        body: JSON.stringify({ type: 'payment.captured', payload: {} }),
        headers: { 'x-payment-signature': 'forged-signature' },
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('Audit regression: password reset token is stored hashed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    emailServiceMock.queueEmail.mockClear();
  });

  it('stores only a hash and emails the raw token in the reset link', async () => {
    // Canonical route (/api/auth/password/forgot) resolves candidates with
    // findMany and only proceeds when exactly one active account matches.
    dbMock.prisma.user.findMany.mockResolvedValueOnce([
      { id: 'user-uuid', tenantId: 'tenant-uuid', email: 'admin@example.com', name: 'Admin' },
    ]);

    const { POST } = await import('../app/api/auth/password/forgot/route');
    const res = await POST(
      makeRequest('http://localhost/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@example.com' }),
      }),
    );
    expect(res.status).toBe(200);

    // Email must contain the raw token in the reset link
    const emailCall = dbMock.prisma.emailQueue.create.mock.calls[0]?.[0] as unknown as { data: { body: string } };
    const rawToken = /token=([^&\s]+)/.exec(emailCall.data.body)?.[1] ?? '';
    expect(rawToken.length).toBeGreaterThan(20);

    // The database must store the hash, never the raw token
    const updateCall = dbMock.prisma.user.update.mock.calls[0]?.[0] as { data: { resetToken: string } };
    expect(updateCall.data.resetToken).toBe(hashOneTimeToken(rawToken));
    expect(updateCall.data.resetToken).not.toBe(rawToken);
  });

  it('returns a generic response for unknown emails (no enumeration)', async () => {
    dbMock.prisma.user.findMany.mockResolvedValueOnce([]);
    const { POST } = await import('../app/api/auth/password/forgot/route');
    const res = await POST(
      makeRequest('http://localhost/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email: 'nobody@example.com' }),
      }),
    );
    expect(res.status).toBe(200);
    expect(dbMock.prisma.emailQueue.create).not.toHaveBeenCalled();
  });

  it('rate limits repeated requests from the same IP', async () => {
    dbMock.prisma.user.findMany.mockResolvedValue([]);
    const { POST } = await import('../app/api/auth/password/forgot/route');
    let lastStatus = 0;
    for (let i = 0; i < 7; i += 1) {
      const res = await POST(
        makeRequest('http://localhost/api/auth/password/forgot', {
          method: 'POST',
          body: JSON.stringify({ email: `user${i}@example.com` }),
        }, '198.51.100.7'), // dedicated IP for this test
      );
      lastStatus = res.status;
    }
    expect(lastStatus).toBe(429);
  });
});

describe('Audit regression: institution signup completes the activation flow', () => {
  const fakeTx = {
    institution: { create: vi.fn(async (args: any) => ({ id: 'inst-uuid', ...args.data })) },
    user: { create: vi.fn(async (args: any) => ({ id: 'user-uuid', ...args.data })) },
    auditLog: { create: vi.fn(async () => ({ id: 'a' })) },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    emailServiceMock.queueEmail.mockClear();
    dbMock.prisma.user.findFirst.mockResolvedValue(null);
    dbMock.prisma.institution.findUnique.mockResolvedValue(null);
    fakeTx.institution.create.mockClear();
    fakeTx.user.create.mockClear();
    fakeTx.auditLog.create.mockClear();
    dbMock.prisma.$transaction.mockImplementation(async (fn: any) => fn(fakeTx));
  });

  it('queues an activation email whose token matches the persisted verification token', async () => {
    const { POST } = await import('../app/api/auth/signup/route');
    const res = await POST(
      makeRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          legalName: 'Northwest Institute',
          officialEmail: 'admin@northwest.edu',
          contactFirstName: 'Ada',
          contactLastName: 'Lovelace',
          consent: true,
        }),
      }),
    );
    expect(res.status).toBe(200);

    const emailCall = emailServiceMock.queueEmail.mock.calls[0]?.[0] as unknown as { body: string };
    expect(emailCall).toBeDefined();
    const linkMatch = /activate-account\?token=([^&\s]+)/.exec(emailCall.body);
    expect(linkMatch).toBeTruthy();

    // The token embedded in the emailed link must be the verificationToken
    // persisted on the freshly created user.
    const createdUser = fakeTx.user.create.mock.calls[0]?.[0] as { data: { verificationToken: string } };
    expect(createdUser.data.verificationToken).toBe(linkMatch?.[1]);
  });

  it('generates a non-empty fallback subdomain for non-Latin institution names', async () => {
    const { POST } = await import('../app/api/auth/signup/route');
    const res = await POST(
      makeRequest('http://localhost/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          legalName: 'एक्सेल इंस्टिट्यूट',
          officialEmail: 'admin@institute.example',
          contactFirstName: 'Ravi',
          contactLastName: 'Kumar',
          consent: true,
        }),
      }),
    );
    expect(res.status).toBe(200);

    const createdInstitution = fakeTx.institution.create.mock.calls[0]?.[0] as { data: { subdomain: string } };
    expect(createdInstitution.data.subdomain.length).toBeGreaterThan(0);
    expect(createdInstitution.data.subdomain.startsWith('institution-')).toBe(true);
  });
});

describe('Audit regression: activation requires a token AND a password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbMock.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-uuid',
      tenantId: 'tenant-uuid',
      createdAt: new Date(),
    });
  });

  it('rejects activation without a password (page contract)', async () => {
    const { POST } = await import('../app/api/auth/activate-account/route');
    const res = await POST(
      makeRequest('http://localhost/api/auth/activate-account', {
        method: 'POST',
        body: JSON.stringify({ token: 'x'.repeat(64) }),
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects an expired activation token', async () => {
    dbMock.prisma.user.findUnique.mockReset();
    dbMock.prisma.user.findUnique.mockResolvedValueOnce({
      id: 'user-uuid',
      tenantId: 'tenant-uuid',
      createdAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000), // 31 days old
    });
    const { POST } = await import('../app/api/auth/activate-account/route');
    const res = await POST(
      makeRequest('http://localhost/api/auth/activate-account', {
        method: 'POST',
        body: JSON.stringify({ token: 'x'.repeat(64), password: 'Str0ng!Passw0rd' }),
      }),
    );
    expect(res.status).toBe(400);
  });
});

describe('Audit regression: email queue cron requires a shared secret', () => {
  const original = env.CRON_SECRET;

  afterEach(() => {
    if (original) env.CRON_SECRET = original;
    else delete env.CRON_SECRET;
    vi.clearAllMocks();
  });

  it('rejects unauthenticated cron invocations', async () => {
    delete env.CRON_SECRET;
    const { GET } = await import('../app/api/cron/process-email-queue/route');
    const res = await GET(makeRequest('http://localhost/api/cron/process-email-queue'));
    expect(res.status).toBe(401);
  });

  it('rejects a wrong secret header', async () => {
    env.CRON_SECRET = 'correct-secret';
    const { GET } = await import('../app/api/cron/process-email-queue/route');
    const res = await GET(
      makeRequest('http://localhost/api/cron/process-email-queue', { headers: { 'x-cron-secret': 'wrong' } }),
    );
    expect(res.status).toBe(401);
  });

  it('drains the queue when the secret matches', async () => {
    env.CRON_SECRET = 'correct-secret';
    emailServiceMock.processEmailQueue.mockResolvedValueOnce({ processed: 2, failed: 0 });
    const { GET } = await import('../app/api/cron/process-email-queue/route');
    const res = await GET(
      makeRequest('http://localhost/api/cron/process-email-queue', { headers: { 'x-cron-secret': 'correct-secret' } }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { success: boolean; processed: number };
    expect(json.success).toBe(true);
    expect(json.processed).toBe(2);
  });
});
