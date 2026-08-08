# NAVEMORA scalability architecture

## Current production shape

Web/API instances are stateless and may run behind a CDN and load balancer. PostgreSQL is the transactional source of truth; the shared Prisma client provides connection reuse per runtime. An optional, vendor-neutral distributed cache adapter and worker queue sit outside the web tier. Files belong in object storage, accessed through tenant-scoped keys and short-lived signed URLs rather than local disks.

`Client → CDN/LB → web/API replicas → PostgreSQL primary`

`                             ↘ distributed cache / queue → independently scaled workers`

Read replicas are reserved for explicitly replica-safe historical reporting. Writes and immediate post-write reads remain on the primary.

## Guardrails now in code

- List APIs use server-clamped pages (default 50, maximum 100); notifications and users use opaque tenant-bound cursors.
- Tenant identifiers are present in hot-path indexes and cursor validation prevents cross-tenant continuation.
- Unique database constraints protect enrollment-style identifiers, employee numbers, attendance records, and payment transaction IDs against check-then-insert races.
- Slow database queries emit parameter-free structured warnings above `DB_SLOW_QUERY_MS` (500 ms by default).
- `/api/health/live` is process-only; `/api/health/ready` verifies the database with a bounded probe. `/api/health` remains compatible.
- A request ID is generated or propagated as `x-request-id`; never log bodies, tokens, or SQL parameters.

## Cache and jobs

`platform/cache.ts` intentionally has no in-process value-cache fallback. Configure a Redis/managed implementation with `configureDistributedCache`; keys must be versioned and tenant namespaced. Use cache-aside only for non-authoritative, TTL-defined data and invalidate on the write that changes it. Heavy exports, payroll, imports, notification fan-out, and email delivery belong in an independently deployed worker with idempotency keys, bounded concurrency, retry/backoff, and a dead-letter state.

## Failure and deployment model

Database, cache, queue, and object storage are managed HA dependencies. Cache loss degrades to database reads; queue and optional integration loss must not invalidate committed finance/academic transactions. Set strict external timeouts and isolate expensive worker pools. Deploy additive schema changes first, backfill in throttled/restartable jobs, then switch reads/writes. On large databases build indexes concurrently through the production runbook.

## Targets and evidence

Targets are p50 <150 ms, p95 <500 ms, p99 <1 s for normal cached/read APIs; complex reporting p95 <2 s. They are targets, not capacity claims. Publish environment, dataset size, k6 results, and `EXPLAIN (ANALYZE, BUFFERS)` evidence before declaring capacity.
