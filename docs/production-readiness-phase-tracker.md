# CampusOS production-readiness tracker

Last updated: 2026-08-04

This is an evidence-backed working record. A phase is only marked `VERIFIED` after its relevant automated checks complete successfully. The programme must not be represented as certified or production-ready until all phases are verified.

| Phase | Scope | Current status | Issues found / fixes completed | Tests / verification | Remaining risk |
| --- | --- | --- | --- | --- | --- |
| 1 | Repository, route, security and delivery audit | IN_PROGRESS | 94 page routes, 52 API routes; production demo modules and high-risk live-session trust boundary identified. Dashboard now has server-backed role context and audit activity. Live-session APIs now derive user identity from the verified session and enforce course tenant/access checks. | Development server listener exists on port 3001 but sandbox cannot connect; focused TypeScript checks and 6 relevant tests pass. | Full route-by-route authenticated browser audit still required. |
| 2–50 | Detailed phases not supplied in the request | NOT_STARTED | Awaiting the defined scope for each numbered phase. | — | Cannot truthfully mark unspecified phases complete. |

## Phase 1 audit matrix (priority routes)

| Route | Role | Page / component | API / service | Database source | Permission / tenant scope | Current status | Required fix |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/dashboard` | All | `RoleDashboard` | `/api/dashboard` | role-scoped records, audit log | verified session and tenant DB | IMPLEMENTED | Continue adding role-specific operational metrics only where authoritative sources exist. |
| `/student/learning` | Student | student learning dashboard | `/api/student/learning` | enrollment, course modules, assignments, quizzes | verified student profile and tenant-scoped database | IMPLEMENTED | Add persisted lesson progress before displaying completion claims. |
| `/learning/courses/[courseId]` | Student, faculty, admin | course workspace | `/api/learning/courses/[courseId]` | course offering and related course records | enrollment/assigned-faculty/privileged-role check | IMPLEMENTED | Add assignment submission and quiz attempt workflows. |
| `/learning/courses/[courseId]/sessions/[sessionId]` | Enrolled student, assigned faculty | live-session page | join/chat/presence/participant/sync APIs | learning session and participant records | verified session, tenant course, enrollment/assigned faculty and participant checks | IMPLEMENTED / VERIFIED | Replace client mock video/Q&A UI and add integration tests for access-denied and cross-tenant cases. |
| `/lms` | Student/faculty | `LMSWorkspace` | none | demo modules | no durable record source | HIGH | Replace demo component with the protected course workspace or hide until its workflow is implemented. |
| `/timetable` | Academic roles | `TimetableWorkspace` | local solver | demo rooms | no tenant source | HIGH | Source rooms and requirements from tenant records before producing schedules. |
| course catalogue components | Student/admin | `CourseCatalogue` | local academic service | demo courses | no tenant source | HIGH | Back with tenant-scoped course API. |
| payments components | Student/finance | payment drawers and summary | payment APIs | invoice/payment records | mixed; client mock handling present | HIGH | Remove client simulation and retain signed, server-verified gateway/webhook workflow only. |
| `/faculty/courses/[courseId]/assignments/[assignmentId]/grade` | Faculty | grade page | none | none on page | no verified authorization on page | HIGH | Implement protected grading API and server-derived faculty/course check. |
| `/community` | Authenticated roles | `CommunityFeed` | community APIs | tenant-scoped community records | service permissions and tenant DB | IMPLEMENTED / AUDITED | Finish no-`any` cleanup and role-aware UI affordances. |
| public legal pages | Public | legal documents | none | static draft text | not applicable | HIGH | Obtain approved legal text before production publication. |

## Phase 1 evidence inventory

- Monorepo: Next.js application at `apps/web`; shared DB, config, and type packages.
- Delivery: Docker Compose has Postgres, Redis, MinIO and MailHog. CI workflow exists at `.github/workflows/ci.yml`.
- Database: Prisma schema and migrations are present; broad RLS coverage is not yet evidenced for all tenant-owned tables.
- Authentication: signed cookie session is verified against the database. Authorization remains inconsistent across older route handlers.
- Responsive: shared shell and major dashboard components have responsive improvements; the 94-route visual audit remains in progress.
- Known quality blockers: global typecheck has pre-existing failures outside the files repaired in this programme; no working global ESLint configuration was detected in earlier checks.

## Immediate repair queue

1. Replace client mock video/Q&A in the live-session page and add cross-tenant/access-denied integration tests.
2. Remove production-facing LMS, timetable and catalogue demo data.
3. Replace client-side payment simulation with a verifiable provider boundary.
4. Add migration-backed unique constraints for learning-session presence/participants, then test concurrent writes.
5. Establish a passing root typecheck, lint configuration, CI enforcement, and authenticated Playwright/a11y coverage.

## Files changed during Phase 1

- `apps/web/src/app/api/dashboard/route.ts`
- `apps/web/src/components/dashboard/RoleDashboard.tsx`
- `apps/web/src/lib/learning-session-access.ts`
- `apps/web/src/app/api/learning/courses/[courseId]/sessions/[sessionId]/{join,chat,participant,presence,sync}/route.ts`
