# CampusOS Dashboard UI Phase 3 — Server-Backed Operational Dashboards

This phase adds real, tenant-scoped operational data to the role workspaces for Registrar, Finance Officer, Examination Controller and Admissions Counsellor.

It is an implementation phase, not a prompt or placeholder specification.

## Rules

- Use existing database models only.
- Do not create fake metrics, charts, alerts or activity.
- Every query must use the server-verified tenant context.
- Every role must receive only data suitable for that role.
- Recent activity is limited to the authenticated user's own audit events.
- No database migration is required.
- No authentication, role assignment or permission behavior is changed.
- The Admissions Counsellor dashboard shows current institutional admissions readiness and programme configuration. It does not invent an applicant funnel because the current schema does not expose a reviewed applicant-pipeline model.

## Roles

- REGISTRAR
- FINANCE_OFFICER
- EXAMINATION_CONTROLLER
- ADMISSIONS_COUNSELLOR

## Verification

```bash
npm run typecheck
npm test
npm run build
```

Test each role using an authenticated, tenant-scoped account and confirm that another tenant's records never appear.
