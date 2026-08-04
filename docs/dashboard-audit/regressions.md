# CampusOS Phase 95 — Regression Log

| # | Regression | Severity | Disposition |
|---|---|---|---|
| 1 | `/dashboard` redirect loop for unhandled roles (`dashboardPathForRole` returned `/dashboard` → redirect to self) | High | Fixed — registry now maps every role; unknown roles land on a role-scoped dashboard shell page |
| 2 | Role dashboards rendered without the shared shell (sidebar/header/banner) | High | Fixed — moved role dashboard pages under `(dashboard)` route group |
| 3 | Student dashboard showed hard-coded fake schedule/alerts/metrics | High | Fixed — real `StudentDashboardData` loader + component |
| 4 | `/api/dashboard/student` returned fabricated values | High | Fixed — now returns real aggregates, still enforces role + tenant scope |
| 5 | Sidebar defaulted all unhandled roles to FACULTY navigation | Medium | Fixed — registry-driven per-role navigation with safe default |
| 6 | Parent/faculty dashboards used `any`-typed payloads with weak error handling | Medium | AUDITED — deferred to their dedicated cycles |
| 7 | `/api/dashboard` generic fallback exposed institution-wide counts to any role | Medium | AUDITED — generic endpoint remains for platform roles only; unhandled roles no longer served by it |
| 8 | Client-only `RoleDashboardGuard` | Low | Kept as UX layer; server-side enforcement added at page + API level for Student |

## Verification notes

- No previous-role data flash observed after persona switch (dashboard fetches use `cache: 'no-store'`).
- Zustand store is hydrated from the server session on each shell mount; role is server-verified.
