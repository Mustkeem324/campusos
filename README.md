# 🎓 CampusOS — Next-Generation Multi-Tenant University & College ERP Platform

> **The World's Most Advanced, AI-Native, Multi-Tenant Educational Operating System**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-104%20Passed-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-19%20Passed-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Build Status](https://img.shields.io/badge/Build-115%20Routes%20Passing-brightgreen?style=flat-square)](#)

---

## 🔑 Quick Demo Login Credentials

You can test the live interactive dashboard instantly on `/login`. Select any persona card or manually enter credentials:

| Role Persona | Demo Email Address | Password | Persona Target |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin.demo@campusos.local` (or `admin@campusos.com`) | `demo123` | Institutional Oversight & Governance |
| **Faculty** | `faculty.demo@campusos.local` (or `faculty@campusos.com`) | `demo123` | Attendance, Grading & Course Workspace |
| **Student** | `student.demo@campusos.local` (or `student@campusos.com`) | `demo123` | Classes, Submissions, Fees & Results |
| **Parent** | `parent.demo@campusos.local` (or `parent@campusos.com`) | `demo123` | Linked Student Attendance & Academic Dues |

*Note: Demo server mode (`DEMO_MODE=true`) allows instant 1-click persona switching with real DB-backed sessions.*

---

## 🚀 Key Architectural Highlights

1. **The CampusOS Blueprint Architecture Portal (`/blueprint`)**  
   Interactive enterprise architecture deep-dive featuring 15 technical systems, regional compliance frameworks (India DPDP / US FERPA / Global GDPR), AI governance guardrails, and tenant security models.

2. **100% Real Database Persistence**  
   Multi-tenant PostgreSQL schema driven by Prisma ORM with strict Row Level Security (RLS) policies. Seeded deterministically with institution `CDU` (`CampusOS Demo University`).

3. **Multi-Tenant Permission-Aware RAG AI Layer (Phases 71–80)**  
   Institutional RAG knowledge retrieval, role-scoped prompt context builders, prompt injection scanners (`AiSafetyEngine`), human-in-the-loop action proposals, and model audit logs (`ai_audit_logs`).

4. **Institutional Intelligence & Ecosystem (Phases 81–90)**  
   Governed Data Warehouse & Certified Semantic Metrics, Digital Twin Scenario Planning, Student Success Command Centre, Integration Hub, Developer Platform & Marketplace, Smart Campus IoT, Implementation Control Tower, and Enterprise Support SLA Management.

5. **Automated Verification Metrics**  
   - **62/62 Vitest files passing** (`104/104` assertions)
   - **19/19 Playwright browser E2E tests passing** (`0` skipped, `0` failed)
   - **115/115 Next.js App Router pages compiling with 0 errors**

---

## 📋 Comprehensive 90-Phase Platform Breakdown

### Phases 0–10 — Core Foundation, Tenancy & Academic Engine
- **Phase 0 — Monorepo Architecture**: Turborepo, Next.js 14 App Router, TypeScript 5, Tailwind CSS design system tokens (`#F6F8FC` surface, `#1754E8` primary).
- **Phase 1 — Tenancy & RBAC**: Row-Level Security, 8-role permission matrix (`can()`), and Super Admin impersonation banner.
- **Phase 2 — Academic Core & Registration**: Credit limits, atomic seat reservation engine, and constraint satisfaction timetable solver.
- **Phase 3 — Timetable, Attendance & LMS**: 75% attendance shortage gatekeeper, gradebook math, and video learning stage.
- **Phase 4 — Examination & SGPA/CGPA Engine**: Grade scales, SGPA/CGPA formulas, and automated grade card processing.
- **Phase 5 — Admissions & CRM**: Application portal, lead scoring, document verification, and seat allocation.
- **Phase 6 — Finance, Receipts & Payments**: Razorpay/Stripe integration, fee structure manager, automated receipt generation.
- **Phase 7 — HR, Payroll & Leave Ledger**: Attendance tracking, salary breakdown, leave balance ledgers.
- **Phase 8 — Library & OPAC**: Book inventory, digital reservations, barcode/RFID tracking, fine calculations.
- **Phase 9 — Hostel & Facilities**: Bed allocation matrix, gate outpass approvals, complaint ticketing.
- **Phase 10 — Transport & Logistics**: Route planning, fleet tracking, RFID passenger logs, vehicle maintenance.

### Phases 11–30 — Specialized Institutional Operations & Governance
- **Phases 11–20 — Student Services, Placements & Alumni**: Placement portal, resume parser, alumni donation ledger, transcript dispatch.
- **Phases 21–30 — Institutional Governance & AI Control**:
  - `/governance`: Committee management, voting quorum, digital minute approvals.
  - `/campus/id`: Visual Digital ID Card, NFC badge toggle, campus wallet (₹ balance).
  - `/international`: Visa expiry tracking, FRRO compliance, study abroad credit transfer.
  - `/academics/microcredentials`: Stackable certificate pathways, Coursera/NPTEL integration, blockchain verification.
  - `/system/migration`: Data migration factory, ETL pipeline monitor, Gantt implementation tower.
  - `/compliance/legal`: Contract lifecycle, risk heat map (5x5 matrix), SLA monitoring.
  - `/campus/sustainability`: ESG score donut charts, carbon emissions tracker, UN SDG mapping.
  - `/ai/governance`: AI Model Registry, F1/Accuracy drift detection, fairness/bias audits.

### Phases 31–70 — Real-Browser Verification, UI Excellence & Compliance
- **Phases 31–50 — Advanced Module Polish & Verification**: 100% functional forms, real database actions, zero hard-coded dashboard fallbacks.
- **Phases 51–60 — UI Excellence & Visual Verification**: Standardized `#F6F8FC` surface, `#1754E8` primary accent, WCAG 2.1 AA accessibility compliance.
- **Phases 61–70 — Legal Compliance & Enterprise Evidence**:
  - `/legal/privacy`, `/legal/cookies`, `/legal/terms`, `/legal/dpa`, `/privacy/data-request`, `/grievance`.

### Phases 71–80 — Permission-Aware AI Assistants, Institutional RAG & Governance
- **Phase 71 — Shared AI Gateway**: Multi-provider provider abstraction (`campusos-mock-v1`, `gpt-4o`, `claude-3-5-sonnet`).
- **Phase 72 — Tenant AI Policy & Budget Engine**: Rate-limiting, monthly cost tracking, and role permission enforcement.
- **Phase 73 — Permission-Aware Context Builder**: Server-side user context assembly (attendance %, timetable, deadlines, dues).
- **Phase 74 — Institution-Isolated RAG Engine**: Vector & chunk-indexed RAG over approved institutional policy documents.
- **Phase 75 — Student & Faculty AI Copilots**: Workspace drawers (`/student/ai-assistant`, `/faculty/ai-assistant`).
- **Phase 76 — Safe AI Action Proposals**: Human-in-the-loop review cards for actions (quiz drafts, service request drafts).
- **Phase 77 — AI Tool Registry & Safety**: Strict prohibition on autonomous marks, attendance, or financial modifications.
- **Phase 78 — Prompt-Injection Defenses**: `AiSafetyEngine` pattern scanner and PII redaction (card numbers, Aadhaar).
- **Phase 79 — Institutional Knowledge Admin**: RAG Document Library management (`/ai/knowledge`).
- **Phase 80 — Observability & Telemetry**: Immutable security audit logs (`ai_audit_logs`).

### Phases 81–90 — Institutional Intelligence, Digital-Twin & Enterprise Delivery
- **Phase 81 — Data Warehouse & Semantic Metrics**: Governed metric definitions (`/planning/warehouse`) with CERTIFIED statuses.
- **Phase 82 — Digital Twin & Scenario Planning**: Growth simulation workspace (`/planning/scenarios`) without altering operational DB records.
- **Phase 83 — Student Success Command Centre**: Case management system (`/student-success`) for academic support and advisor assignments.
- **Phase 84 — Integration Hub**: Enterprise connector catalog (`/integrations/catalog`) for DigiLocker, Razorpay, Google Workspace, MS Teams.
- **Phase 85 — Developer Platform & Marketplace**: App marketplace portal (`/marketplace/apps`) with explicit permission request review.
- **Phase 86 — Campus Mobile Super App**: Touch-optimized responsive navigation drawer and safe offline synchronization queue.
- **Phase 87 — Smart Campus & IoT Command Centre**: Real-time occupancy sensors and energy meters (`/smart-campus`).
- **Phase 88 — Implementation & Adoption Control Tower**: 6-stage rollout project tracker (`/implementation/projects`).
- **Phase 89 — Enterprise Support & SLA Management**: 24/7 support case tracker (`/support/cases`).
- **Phase 90 — Global Enterprise Readiness**: Multi-region configuration presets (India / US / Global).

---

## 🛠️ Verification & Build Commands

```bash
# 1. Typecheck the entire codebase
npx tsc --noEmit --project apps/web/tsconfig.json

# 2. Run unit and integration test suite (62 files, 104 assertions)
npx vitest run

# 3. Run Playwright E2E browser tests (19 specs)
npx playwright test --project=chromium

# 4. Execute optimized Next.js production build (115 routes)
npm run build
```

---

*CampusOS is designed and built by the Principal Enterprise Architect & Engineering Team.*
