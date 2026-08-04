# CampusOS Phase 95 — Blocked Roles & Features

## Roles without a dedicated dashboard (BLOCKED — recorded, not silently created)

These roles exist in the domain model (`RoleType` enum) but have no dedicated dashboard
composition yet. They receive the shared shell and a role-scoped dashboard landing page,
but full role workspaces are scheduled in later cycles.

- `REGISTRAR`
- `DEAN`
- `HOD`
- `FINANCE_OFFICER`
- `ACCOUNTANT`
- `HR_ADMIN`
- `WARDEN`
- `LIBRARIAN`
- `TRANSPORT_MANAGER`
- `PLACEMENT_OFFICER`
- `ADMISSIONS_COUNSELLOR`
- `EXAMINATION_CONTROLLER`

## Features not added (and why)

| Feature | Reason blocked |
|---|---|
| Student library section (per-student loans) | Schema-blocked: `Loan` has no student/user link; cannot prove ownership |
| Student transport section (assigned route) | Schema-blocked: `TransportRoute` has no student link |
| Student documents section | Schema-blocked: `Document` has no student/user link |
| Ticket-based student services | Schema-blocked: `Ticket` has no student link; `SupportCase` (userId-scoped) used instead |
| Live AI prompt bar inside student dashboard | Not a student dashboard task; duplicate of `/student/ai-assistant` |
| "Good Standing" hard-coded badge | Fake data; replaced by real attendance-derived status |
| Hard-coded "2 Lectures Today" schedule | Fake data; replaced by real timetable queries (empty state when none) |
| Hard-coded quick-action counts (e.g. "28 submissions") | Fake data; replaced by real counts |
| Fake currency/metric values ('₹0.00', '88%', '3.80 / 4.0') | Violates no-fake-data rule; real aggregates only |

## Notes

- No schema changes were required this cycle (no migration).
- No new roles were invented. Unsupported roles from the request list (e.g. "Vice Chancellor",
  "Leadership") are not in `RoleType` and are therefore recorded as BLOCKED, not created.
