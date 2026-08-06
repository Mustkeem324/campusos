# CampusOS Phase 8 — Personal Workspace and Dashboard Customisation

Phase 8 adds a secure user-scoped workspace layer across every role dashboard.

## Phase 8A — Personal workspace and sidebar profile menu

Delivered capabilities:

- Sidebar profile trigger and slide-out account menu
- User, role, institution and security status
- Unread notification, pending approval, support-case and active-session counters
- Recent user audit activity
- Quick links to profile, Phase 7 command centre, notifications, settings and helpdesk
- Light/dark appearance control
- Current-device and all-device sign-out actions
- Tenant-scoped, user-scoped backend overview endpoint

## Phase 8B — Custom dashboard widgets and saved layouts

Backend-first capabilities:

- Role-authorised widget catalogue
- Recommended role-specific default layout
- Multiple named layouts and active layout per dashboard surface
- Create, copy, rename, update, activate, delete and reset APIs
- Server-side 12-column grid, overlap and size validation
- Bounded widget settings and preference document size
- Optimistic revision control and atomic lost-update protection
- Tenant-scoped and user-scoped persistence in existing preferences JSON
- Audit event for each successful mutation
- No database schema migration in the backend foundation release

See [`phase-8b-dashboard-layouts.md`](./phase-8b-dashboard-layouts.md) for the API contract and security rules.

## Shared safety boundaries

- No password hashes, MFA secrets, session tokens or protected record contents are returned
- Identity, tenant and role are always resolved server-side
- Widgets are filtered by the persisted active role
- Recent activity and saved layouts are limited to the authenticated user and tenant
- Backend customisation is additive and does not replace the full role dashboards

## Next Phase 8 releases

1. Phase 8A — Personal workspace and sidebar profile menu — delivered
2. Phase 8B — Custom dashboard widgets and saved layouts — backend foundation
3. Phase 8C — Universal search and recent-item history
4. Phase 8D — Workflow inbox, delegation and SLA escalation
5. Phase 8E — Integration health and background-job operations
6. Phase 8F — Accessibility, localisation and low-bandwidth mode
