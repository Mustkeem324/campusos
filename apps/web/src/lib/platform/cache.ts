/**
 * Vendor-neutral distributed cache contract. Web instances deliberately do
 * not fall back to an in-memory data cache: that would make responses depend
 * on instance affinity. Configure a Redis/managed-cache adapter at bootstrap.
 */
export interface DistributedCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
  delete(key: string): Promise<void>;
}

let cache: DistributedCache | undefined;
const inFlight = new Map<string, Promise<unknown>>();

export function configureDistributedCache(adapter: DistributedCache | undefined): void {
  cache = adapter;
}

export function tenantCacheKey(tenantId: string, resource: string): string {
  return `navemora:v2:tenant:${tenantId}:${resource}`;
}

export async function cacheAside<T>(
  key: string,
  ttlSeconds: number,
  loader: () => Promise<T>,
): Promise<{ value: T; cache: 'hit' | 'miss' | 'disabled' }> {
  if (!cache) return { value: await loader(), cache: 'disabled' };
  const existing = await cache.get<T>(key);
  if (existing !== null) return { value: existing, cache: 'hit' };

  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return { value: await pending, cache: 'miss' };

  const work = loader().then(async (value) => {
    await cache!.set(key, value, ttlSeconds);
    return value;
  }).finally(() => inFlight.delete(key));
  inFlight.set(key, work);
  return { value: await work, cache: 'miss' };
}

export async function invalidateCache(key: string): Promise<void> {
  await cache?.delete(key);
}
