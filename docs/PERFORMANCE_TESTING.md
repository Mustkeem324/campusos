# Performance testing

Run only against an isolated performance environment with synthetic tenants and no production data. Normal CI exercises pagination and architecture tests; the million-row benchmark is manual/nightly.

1. Provision PostgreSQL and apply the schema.
2. Seed realistic support entities, then run `npm run perf:seed-million-attendance -- --tenant <uuid> --course <uuid> --student <uuid>`. It inserts in resumable 5,000-row batches. Do not generate this data at app startup.
3. Capture `EXPLAIN (ANALYZE, BUFFERS)` for attendance summary/history, student search, and finance ledger aggregate.
4. Run k6 with `k6 run scripts/performance/api-smoke.k6.js`, setting `BASE_URL` and authenticated test headers.
5. Record dataset shape, p50/p95/p99, errors, DB connection count, query plans, queue depth, and web/worker resource use.

Increase load progressively (100, 500, 1,000 virtual users) and use separate spike/soak runs. A failed target is a diagnosis signal, not an invitation to claim unverified concurrency.
