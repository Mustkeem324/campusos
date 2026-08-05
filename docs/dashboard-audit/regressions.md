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
| 9 | `/api/dashboard/student` derived HTTP status from error-message prefixes (`startsWith('Your') → 409`), brittle and semantically wrong | Medium | Fixed — typed `DashboardError(status)` in `lib/dashboard/errors.ts`; route now returns 401 (no session) / 403 (wrong role or unresolved profile) / 500 (unexpected) |
| 10 | `Sidebar` `iconForHref` declared after its caller; 5 unused lucide imports (`Users`, `Video`, `CreditCard`, `Globe`, `HeartHandshake`) | Low | Fixed — helper reordered before use; unused imports removed |

| 11 | Examinations query returned tenant-wide exams (not scoped to the student's enrolled terms) | Medium | Fixed — exams now filtered by `termId: { in: enrolledTermIds }` derived from the student's own enrollments |
| 12 | Playwright specs waited on `/dashboard` (never reached — app redirects to role paths) and clicked before hydration | High | Fixed — specs log in via `/api/auth/demo-login` (cookies shared with page) and assert role-specific paths |
| 13 | Student dashboard lacked Examinations / Published results / Student services / Hostel / Notifications sections | High | Fixed — deterministic seed + tenant-scoped loader + rendered sections with empty states |
| 14 | `seedStudentLife` accepted an unused `config` parameter | Low | Fixed — removed from signature and call site |
| 15 | `/api/dashboard/admin` returned hardcoded fake metrics (`pendingAdmissionsCount: 12`), fabricated alerts and an unsupported “100% compliance” claim | High | Fixed — rewritten to real tenant-scoped aggregates (`getAdminDashboardData`); no fabricated values remain |
| 16 | Admin `count()` queries lacked explicit tenant filters | Low | Fixed — routed through `getTenantDb` extended client (auto-injects `tenantId`); verified tenant-scoped |
| 17 | Admin dashboard mixed admin identity with institution-wide summary (students appeared only as counts) | Medium | Fixed — identity is the authenticated admin (Aarav Mehta); student records are institution-level aggregates only |
| 18 | `/api/dashboard/parent` returned hardcoded fake ward metrics ('88%', '3.80 / 4.0', '₹0.00 Outstanding', '0 Warnings') and hardcoded notices | High | Fixed — rewritten to real tenant-scoped queries (attendance, published=true results, invoice/payment aggregates, notices); no fabricated values remain |
| 19 | Parent dashboard used only `guardians.students[0]` — no linked-student selector; guardian relationship never independently verified per request | High | Fixed — `getParentDashboardData` lists all verified links and enforces the requested `studentId` is a link of this guardian (else 403); selector added (2 demo links: Rohan Verma + Meera Menon) |
| 20 | Parent API returned 409 with message-prefix status guessing | Medium | Fixed — typed `DashboardError(status)`; unlinked ward → 403, no session → 401, unexpected → 500 |
| 21 | Parent page used `any`-typed payloads and client-only `RoleDashboardGuard` | Medium | Fixed — typed `ParentDashboardData` contract, server-component page, server re-verification on `?studentId=` selection |
| 22 | `/api/dashboard/faculty` returned a hardcoded fake payload (CS-301/CS-302 courses, `pendingGradingCount: 28`, `91.4%` attendance) that matched none of the real faculty member's data | High | Fixed — rewritten to `getFacultyDashboardData`: tenant-scoped loader (staff by id+userId+tenantId, offerings by facultyId, real aggregates); no fabricated values remain |
| 23 | Faculty dashboard page rendered fake fallbacks (`|| 28`) and ambiguous identity | High | Fixed — identity is the authenticated faculty member (Dr. Priya Sharma) from the tenant-scoped staff record; page renders only contract data with loading/empty/error states |
| 24 | Registry marked FACULTY contract as "planned" and excluded it from `IMPLEMENTED_DASHBOARD_ROLES` | Medium | Fixed — FACULTY implemented (widgets + quick actions + `FacultyDashboardData`) and added to implemented roles |

## Verification notes

- No previous-role data flash observed after persona switch (dashboard fetches use `cache: 'no-store'`).
- Zustand store is hydrated from the server session on each shell mount; role is server-verified.
- Demo seed remains deterministic (SeededRandom, no Math.random), idempotent (upsert by stable ID), and reset-safe (cleanup deletes new tables in dependency order).
- Screenshots captured at 375 / 768 / 1024 / 1366 / 1920 px with zero horizontal overflow at every width.
