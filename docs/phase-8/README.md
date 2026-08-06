# CampusOS Phase 8 — Personal Workspace and Sidebar Control Centre

Phase 8 starts with a lightweight, user-scoped account control layer that is available from every dashboard.

## Phase 8A scope

- Sidebar profile trigger and slide-out account menu
- User, role, institution and security status
- Unread notification, pending approval, support-case and active-session counters
- Recent user audit activity
- Quick links to profile, Phase 7 command centre, notifications, settings and helpdesk
- Light/dark appearance control
- Current-device and all-device sign-out actions
- Tenant-scoped, user-scoped backend overview endpoint

## Safety boundaries

- No password hashes, MFA secrets, session tokens or protected record contents are returned
- Approval counts follow the existing Phase 7 role policy
- Non-approver roles see only their own submitted proposals
- Recent activity is limited to the authenticated user and active tenant
- The panel is additive and does not replace the full profile or security pages

## Next Phase 8 releases

1. Phase 8A — Personal workspace and sidebar profile menu
2. Phase 8B — Custom dashboard widgets and saved layouts
3. Phase 8C — Universal search and recent-item history
4. Phase 8D — Workflow inbox, delegation and SLA escalation
5. Phase 8E — Integration health and background-job operations
6. Phase 8F — Accessibility, localisation and low-bandwidth mode
