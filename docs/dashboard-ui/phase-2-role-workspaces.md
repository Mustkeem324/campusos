# CampusOS Dashboard UI Phase 2 — Professional Role Workspaces

## Objective

Replace the generic “dashboard is being prepared” placeholder with a professional, role-specific workspace for every recognised operational role that does not yet have a dedicated data dashboard.

## Base dependency

This phase is stacked on:

`feature/professional-dashboard-ui`

The shared shell, header, sidebar and account-menu modernization should be merged before or together with this phase.

## Roles covered

- Registrar
- Dean
- Head of Department
- Finance Officer
- Accountant
- HR Administrator
- Warden
- Librarian
- Transport Manager
- Placement Officer
- Admissions Counsellor
- Examination Controller

Dedicated Student, Faculty, Parent, Institution Administrator and Super Administrator dashboards continue using their existing server-backed compositions.

## User experience

Every covered role receives:

- A role-specific heading and description
- Role-specific workflow actions
- Key responsibility guidance
- Visible server-verified role context
- Configured permission count
- Safe-workspace guidance
- No silent fallback to another role dashboard
- No invented counts, charts, alerts or operational status
- Responsive enterprise UI using the CampusOS design system

## Security constraints

This phase does not change:

- Authentication
- Session verification
- Role assignment
- Tenant isolation
- Route authorization
- Permissions
- Dashboard APIs
- Database schema
- Academic, finance, attendance or examination business logic

Dashboard action cards are navigation only. Every destination must continue enforcing its own server-side authorization.

## Verification

Run:

```bash
npm run typecheck
npm test
npm run build
```

Review `/dashboard` using each covered role and confirm:

- Correct role-specific title and actions
- No cross-role identity flash
- No redirect loop
- No admin/faculty/student fallback
- Keyboard access
- Mobile layout at 320px, 375px and 430px
- Tablet and desktop layouts
- Light and dark theme readability
- Existing dedicated role dashboards still redirect correctly

## Next phase

Dashboard UI Phase 3 should add server-backed data contracts and dedicated dashboards for the highest-priority operational roles, starting with Registrar, Finance Officer, Examination Controller and Admissions Counsellor. No real operational metrics should be displayed until their tenant-scoped loaders and authorization tests exist.
