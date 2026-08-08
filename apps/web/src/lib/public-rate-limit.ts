type RateLimitBucket = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

declare global {
  var __campusosPublicRateLimits: Map<string, RateLimitBucket> | undefined;
}

const buckets = globalThis.__campusosPublicRateLimits ?? new Map<string, RateLimitBucket>();
globalThis.__campusosPublicRateLimits = buckets;

function pruneExpired(now: number) {
  if (buckets.size < 2_000) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export function requestIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export function checkPublicRateLimit({ key, limit, windowMs }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneExpired(now);

  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: Math.max(0, limit - 1), retryAfterSeconds: Math.ceil(windowMs / 1000) };
  }

  current.count += 1;
  buckets.set(key, current);
  const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));

  return {
    allowed: current.count <= limit,
    remaining: Math.max(0, limit - current.count),
    retryAfterSeconds,
  };
}

export async function readJsonWithLimit(request: Request, maxBytes: number): Promise<unknown> {
  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new PayloadTooLargeError();
  }

  const text = await request.text();
  const actualBytes = new TextEncoder().encode(text).byteLength;
  if (actualBytes > maxBytes) throw new PayloadTooLargeError();

  try {
    return JSON.parse(text);
  } catch {
    throw new InvalidJsonError();
  }
}

export class PayloadTooLargeError extends Error {
  constructor() {
    super('Request payload is too large');
    this.name = 'PayloadTooLargeError';
  }
}

export class InvalidJsonError extends Error {
  constructor() {
    super('Request body must be valid JSON');
    this.name = 'InvalidJsonError';
  }
}
