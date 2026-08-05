# CampusOS Phase 7 Platform

Phase 7 connects the existing role dashboards to governed work, account security, audited reporting, mobile delivery and evidence-based intelligence.

## 7A — Action and Approval Centre

The approval centre reuses the reviewed `AiActionProposal` model as the common governed-request envelope. Every proposal includes a target record, reason, risk level, required permission and proposed values. Non-approver roles only see their own proposals. Reviewer queues are filtered by operational permission domain: finance roles cannot review academic proposals, librarians cannot review finance proposals, and equivalent boundaries apply to the other operational roles.

The proposer cannot approve their own request. Proposals marked `PROHIBITED` cannot be approved. Decisions notify the proposer and create an audit record.

Approved proposals are not automatically executed against protected academic, finance or identity records. Domain execution remains a separate reviewed workflow.

## 7B — Account Security

- Current-password verification before password change
- Strong password policy
- Other-session revocation after a password change
- Generic password-reset response to prevent account enumeration
- Cross-tenant ambiguity protection for duplicate email addresses
- SHA-256 reset-token storage with a 30-minute expiry
- Reset-email queue integration
- Authenticator TOTP setup and verification
- AES-256-GCM encryption for stored MFA secrets
- Signed five-minute MFA login challenges rather than exposed raw user identifiers
- MFA lockout handling and seven-day session/JWT alignment

Production must configure `JWT_SECRET` or `MFA_ENCRYPTION_KEY`. `MFA_CHALLENGE_SECRET` can be configured separately; otherwise `JWT_SECRET` signs MFA challenges. Development reset URLs are exposed only when both non-production mode and `CAMPUSOS_EXPOSE_RESET_TOKEN=true` are active.

## 7C — Reports and Export Studio

The studio exports role-authorised records as escaped CSV or a valid basic PDF. Available reports are selected from the active role and every export creates an audit record. Current report packs cover the signed-in account, institution users, student progress, finance ageing, library circulation and student-success cases.

## 7D — Finance and Library 2.0

Finance adds invoice totals, collections, overdue exposure, failed payments and pending refund visibility. It does not replace external payment capture or ledger-close processes.

Library adds catalogue quality and circulation intelligence. The current reviewed schema stores catalogue items, ISBN values and circulation timestamps. Returns, due dates, reservations and fines are submitted through the Action Centre until dedicated domain fields and migrations are approved; the UI does not invent them.

## 7E — Mobile PWA and Notifications

- Installable service worker
- Offline public fallback
- Framework build-asset caching only
- No API response, protected page or arbitrary user-image caching
- Browser-notification permission controls
- Per-category email, push and in-app preferences
- Push notification click-through support

A production push provider still requires deployment-specific subscription storage and VAPID configuration. The service worker and preference controls are provider-ready without inventing delivery success.

## 7F — Safe Copilot and Student Success

The Phase 7 copilot is intentionally read-only and deterministic. It answers only from role-authorised, tenant-scoped records, links to source workspaces, logs queries and blocks prompt-injection or secret-exfiltration patterns.

Student-success scans currently use persisted CGPA and overdue-invoice evidence. Cases are explainable, require human review and explicitly avoid behavioural judgement. Existing unresolved cases are not duplicated.

## Verification

```bash
npm ci
npm run db:generate
npm run lint -- --max-warnings=0
npm run typecheck
npm test
npm run build
```

No package or lockfile changes are required for Phase 7.
