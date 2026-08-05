# CampusOS Experience Phase 4 — Premium Institutional Product Experience

## Objective

Create a coherent, premium CampusOS experience across authenticated dashboards and selected public pages while preserving the existing authorization, tenant-isolation and business-logic boundaries.

The design direction is executive, editorial and operational rather than decorative. It uses strong hierarchy, generous space, restrained visual depth, rich navy surfaces and clear paths from information to accountable action.

## Audited surfaces

### Authenticated workspace

- Shared dashboard shell
- Global header and command entry
- Role-aware sidebar and mobile navigation
- Workspace context and server-verified identity cues
- Operational dashboards for Registrar, Finance Officer, Examination Controller and Admissions Counsellor
- Professional navigation workspaces for remaining operational roles

### Public experience

- Homepage hero and fictional product canvas
- Institutional operating-story section
- Custom About CampusOS page

## Product principles

1. **Institution before software** — show institution, campus, role and workflow context.
2. **Accountability before automation** — prioritise exceptions, approvals and next actions.
3. **Trust before expansion** — preserve role boundaries, tenant isolation and honest system states.
4. **Operational depth before decorative reporting** — do not manufacture metrics to fill space.
5. **Premium restraint** — use strong structure, typography, spacing, borders and shadows without visual noise.

## Real and fictional information

Authenticated operational dashboards use existing tenant-scoped database models and server-verified user context.

The homepage product canvas contains illustrative values only and is visibly labelled as a fictional product preview. It must not be interpreted as customer, institution or production performance data.

## Security and scope protections

This phase does not:

- Add a second authentication system
- Change role assignment or permission behavior
- Change tenant-isolation rules
- Change academic, attendance, examination or finance calculations
- Add a database migration
- Expose institution-wide audit logs to operational roles
- Display individual student identity in finance or registrar summary cards
- Invent an admissions funnel where no reviewed applicant-pipeline model exists

Destination routes remain responsible for their own server-side authorization.

## Self-improvement opportunities identified

The implementation establishes the following next product opportunities without faking unfinished functionality:

- Dedicated real-data dashboards for Dean, HOD, Accountant, HR Admin, Warden, Librarian, Transport Manager and Placement Officer
- A reviewed admissions applicant-pipeline data model and workflow
- User-configurable dashboard composition with institution-approved defaults
- Saved operational views and filters
- Accessible trend visualisation backed by reviewed historical data contracts
- Cross-module exception queues with explicit ownership and due-state rules
- Institution-configurable executive reporting with source and freshness disclosure
- Visual regression coverage for public and authenticated design systems

## Verification

Run:

```bash
npm ci
npm run lint -- --max-warnings=0
npm run typecheck
npm test
npm run build
```

Review:

- Student, Faculty, Parent and Administrator dedicated dashboards
- Every remaining recognised role at `/dashboard`
- Two institutions to confirm tenant isolation
- Mobile widths 320px, 375px and 430px
- Tablet and desktop layouts
- Expanded and collapsed sidebar
- Mobile navigation drawer
- Keyboard navigation and focus visibility
- Light and dark modes
- Reduced-motion preference
- Homepage and About page links
- Fictional interface labels
- Empty, error and unavailable states

## Delivery dependency

This branch is based on `fix/next-build-warnings` so it can use the repaired npm quality gate, Vercel output configuration and environment-variable normalization. Merge the build-pipeline pull request first, then retarget this experience branch to `main`.
