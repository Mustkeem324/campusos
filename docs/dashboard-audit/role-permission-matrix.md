# CampusOS Role → Permission Matrix (Phase 95 Audit)

Audited against `packages/db/prisma/schema.prisma` (`enum RoleType`), `apps/web/src/lib/rbac.ts`,
`apps/web/src/lib/types.ts` (`ROLE_PERMISSIONS`), and `apps/web/src/lib/active-user-context.ts`.

## Role inventory (source of truth: Prisma `RoleType`)

| Role | Dedicated dashboard | Status (Phase 95) |
|---|---|---|
| `SUPER_ADMIN` | `/dashboard/admin` | PLANNED |
| `INSTITUTION_ADMIN` | `/dashboard/admin` | PLANNED |
| `REGISTRAR` | — | BLOCKED (no dedicated dashboard yet) |
| `DEAN` | — | BLOCKED (no dedicated dashboard yet) |
| `HOD` | — | BLOCKED (no dedicated dashboard yet) |
| `FACULTY` | `/dashboard/faculty` | AUDITED, not repaired this cycle |
| `STUDENT` | `/dashboard/student` | **VERIFIED this cycle** |
| `PARENT` | `/dashboard/parent` | AUDITED, not repaired this cycle |
| `FINANCE_OFFICER` | — | BLOCKED |
| `ACCOUNTANT` | — | BLOCKED |
| `HR_ADMIN` | — | BLOCKED |
| `WARDEN` | — | BLOCKED |
| `LIBRARIAN` | — | BLOCKED |
| `TRANSPORT_MANAGER` | — | BLOCKED |
| `PLACEMENT_OFFICER` | — | BLOCKED |
| `ADMISSIONS_COUNSELLOR` | — | BLOCKED |
| `EXAMINATION_CONTROLLER` | — | BLOCKED |

## Permission model

Two permission systems exist and are both preserved:

1. `lib/rbac.ts` — coarse `ROLE_PERMISSIONS: Record<RoleType, Permission[]>` with `hasPermission`/`requirePermission`.
2. `lib/types.ts` — fine-grained `ROLE_PERMISSIONS: Partial<Record<UserRole, PermissionString[]>>` with `can(role, resource, action, scope)`.

Both are server-side and used by API routes. `active-user-context.ts` resolves the active role
from the session + persisted `User.role` and derives `permissions` for the session.

## Server authorization chain (student dashboard)

```
GET /dashboard/student
  → (dashboard)/layout.tsx            session cookie → redirect /login if absent
  → page: requireActiveUserContext()  session + tenant + persisted role agreement
  → getStudentDashboardData(ctx)      server loader: tenant-scoped Prisma queries
  → role !== 'STUDENT'                server-side 403/redirect (no client trust)
GET /api/dashboard/student
  → requireActiveUserContext()        same chain
  → role !== 'STUDENT' → 403
  → student scoped by id + userId + tenantId
```

## Guardrails

- Every Prisma query in a dashboard loader goes through `getTenantDb(tenantId)` (RLS extension).
- A role other than `STUDENT` cannot resolve the student profile (`studentProfileId` is only set
  for `STUDENT` sessions), so cross-role access is structurally rejected.
