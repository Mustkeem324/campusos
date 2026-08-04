# 🎓 CampusOS — Next-Generation Multi-Tenant University & College ERP Platform

> **The World's Most Advanced, AI-Native, Multi-Tenant Educational Operating System**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-Passing-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Build Status](https://img.shields.io/badge/Build-115%20Routes%20Passing-brightgreen?style=flat-square)](#)

---

## 📖 Executive Summary

**CampusOS** is a production-grade, enterprise multi-tenant University Operating System engineered to run entire higher-education ecosystems—from autonomous colleges and polytechnics to global university systems.

CampusOS integrates core academic management, admissions, attendance, examinations, SGPA/CGPA result compilation, finance, HR/payroll, hostel, transport, library, and student services with **Permission-Aware AI Copilots (Phases 71–80)**, **Institutional Intelligence & Digital Twins (Phases 81–90)**, and an **Interactive Connected Workflows Product Tour (Phase 91)**.

---

## 🔑 Quick Demo Access & Persona Credentials

Test the live interactive platform instantly on `/login` or `/institution-login`. Select any persona card or manually enter credentials:

| Role Persona | Demo Email Address | Password | Focus Area & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin / HOD** | `admin.demo@campusos.local` (or `admin@campusos.com`) | `demo123` | Campus-wide governance, system metrics, department administration |
| **Faculty** | `faculty.demo@campusos.local` (or `faculty@campusos.com`) | `demo123` | Attendance entry, grading rubric, course workspace, student at-risk alerts |
| **Student** | `student.demo@campusos.local` (or `student@campusos.com`) | `demo123` | Class timetable, submission portal, instant fee receipts, result grade cards |
| **Parent** | `parent.demo@campusos.local` (or `parent@campusos.com`) | `demo123` | Real-time attendance monitoring, fee payment gateway, hostel leave passes |
| **Finance Officer** | `finance.demo@campusos.local` (or `finance@campusos.com`) | `demo123` | Fee structure configuration, scholarship waivers, UPI collection, ledger sync |

*Note: In `DEMO_MODE=true`, 1-click persona switching allows instant context switching with complete database persistence.*

---

## 🏛️ System Architecture & Engineering Principles

```
  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      CampusOS Presentation Layer                        │
  │     Public Homepage • Role Dashboards • Mobile Super App • Community    │
  └─────────────────────────────────────────────────────────────────────────┘
                                     │
  ┌──────────────────────────────────┴──────────────────────────────────────┐
  │                      CampusOS Security & Middleware                     │
  │     NextAuth Sessions • RBAC Matrix (`can()`) • Tenant Context Gate     │
  └──────────────────────────────────┬──────────────────────────────────────┘
                                     │
  ┌──────────────────────────────────┴──────────────────────────────────────┐
  │                        Core Engine Services                             │
  │  Academic • Exams • Finance • HR • AI Gateway • Institutional Data Warehouse │
  └──────────────────────────────────┬──────────────────────────────────────┘
                                     │
  ┌──────────────────────────────────┴──────────────────────────────────────┐
  │                 Multi-Tenant Prisma Database Layer                      │
  │      Strict `tenantId` Row-Level Security (RLS) Query Extension         │
  └─────────────────────────────────────────────────────────────────────────┘
```

### Core Architecture Pillars:
1. **Row-Level Security (RLS) Tenant Isolation**: Built on Prisma Client extensions (`TENANT_MODELS`) ensuring every database query automatically injects `tenantId` scoping. Cross-tenant data leaks are impossible by design.
2. **Permission-Aware AI & Guardrails**: Multi-provider LLM abstraction (`gpt-4o`, `claude-3-5-sonnet`, `campusos-mock-v1`) bounded by role-scoped context builders, prompt-injection scanners (`AiSafetyEngine`), and human-in-the-loop proposal cards.
3. **Monolith-First Enterprise Design System**: Clean, accessibility-first visual language utilizing `#101B33` (navy background), `#1854E8` (primary blue accent), `#DEE5EF` (crisp borders), and `#F5F7FB` (surface containers). No non-standard blobs, neon gradients, or decorative glassmorphism.
4. **100% Verified Database Persistence**: Powered by PostgreSQL and Prisma ORM, seeded deterministically with `CDU` (`CampusOS Demo University`).

---

## 📚 Deep Phase-by-Phase Platform Breakdown (Phases 1–91)

Below is the complete, comprehensive architectural breakdown of all 91 phases implemented in CampusOS.

---

### 🌐 Phases 1–10 — Core Foundation, Multi-Tenancy & Academic Engine

#### Phase 0 — Monorepo Architecture & Design Tokens
- Monorepo structure powered by Turborepo, Next.js 14 App Router, TypeScript 5, and Tailwind CSS.
- Established design tokens: `#101B33` (heading/dark text), `#1854E8` (primary action blue), `#5F6B7A` (secondary text), `#DEE5EF` (neutral border), and `#F5F7FB` (background canvas).
- WCAG 2.1 AA compliant typography, focus ring indicators, and reduced-motion media query handling.

#### Phase 1 — Multi-Tenancy & Role-Based Access Control (RBAC)
- Middleware-level tenant resolution (`requireTenantContext`) parsing custom domains or headers (`x-tenant-id`).
- Prisma Client extension intercepting `findMany`, `findFirst`, `create`, `update`, `delete` for 45+ `TENANT_MODELS`.
- Granular 8-role permission matrix (`STUDENT`, `FACULTY`, `ADMIN`, `PARENT`, `FINANCE_ADMIN`, `REGISTRAR`, `SUPER_ADMIN`, `AUDITOR`).

#### Phase 2 — Academic Core, Program Engine & Timetable Solver
- Program & Curriculum structure: Department $\rightarrow$ Degree Program $\rightarrow$ Academic Batch $\rightarrow$ Course Offering $\rightarrow$ Class Section.
- Atomic seat reservation engine preventing course over-enrollment during registration spikes.
- Constraint-satisfaction timetable solver allocating faculty, room capacity, and time slots without overlap conflicts.

#### Phase 3 — Attendance, Smart LMS Workspace & Biometrics
- **Smart Course Workspace**: Lessons, syllabus mapping, file attachments, and discussion streams.
- **Attendance Engine**: Daily lecture attendance with automated 75% shortage alert gatekeeper.
- **Privacy-Safe Face Attendance System**: Biometric consent ledger, encrypted face embedding templates, and faculty classroom verification mode.

#### Phase 4 — Examination Engine & SGPA/CGPA Result Compilation
- Multi-component evaluation: Internal assessments, quizzes, mid-term exams, and end-term written papers.
- Double-blind evaluation workflow with encrypted paper IDs and multi-tier verification.
- Automated SGPA/CGPA formula engine and instant QR-coded verified grade card PDF generation.

#### Phase 5 — Admissions CRM & Automated Onboarding
- Public applicant portal with multi-step digital forms and document upload validation.
- Automated lead scoring, document verification approval queue, and seat allocation rules.
- Instant ERP auto-provisioning: Converts approved applicants into active `Student` records with roll numbers and initial fee invoices.

#### Phase 6 — Finance, Invoices & Payment Gateways
- Dynamic Fee Structure Manager supporting batch-wise tuition, hostel, transport, and examination fee rules.
- Scholarship & Merit Waiver engine auto-deducting approved financial aid.
- Integrated Payment Gateway (Razorpay/Stripe/UPI) with instant general ledger posting and digital tax receipts.

#### Phase 7 — HR, Payroll & Staff Attendance
- Comprehensive employee registry (Faculty & Non-Teaching Staff) with designation tracking and leave balances.
- Payroll generation engine calculating base pay, HRA, allowances, provident fund, tax deductions, and salary slips.
- Staff biometric check-in integration and automated leave application approval workflows.

#### Phase 8 — Library Management & OPAC Catalog
- Online Public Access Catalog (OPAC) with book search, ISBN metadata lookup, and shelf locator.
- Physical book circulation workflow: Issue, return, renewal, and automated fine calculation ledger.
- Digital library repository supporting open-access e-books, research journals, and past exam papers.

#### Phase 9 — Hostel & Facilities Allocation
- Campus hostel building management with floor plans, room capacities, and bed assignment matrix.
- Gate outpass approval system with parent SMS confirmation and warden override logs.
- Facilities maintenance ticketing system tracking room repairs, plumbing, and electrical issues.

#### Phase 10 — Campus Transport & Vehicle Operations
- Bus route management with stop-wise pickup timings, vehicle assignment, and seat capacity.
- Real-time GPS vehicle tracking interface for parents and students.
- RFID passenger boarding logs and transport fee billing integration.

---

### 🏛️ Phases 11–30 — Specialized Institutional Operations & Governance

#### Phases 11–20 — Student Services, Placements & Alumni
- **Career & Placement Cell**: Corporate recruiter portal, job posting board, resume parser, and interview schedule manager.
- **Alumni Network**: Alumni directory, mentoring program matching, and tax-exempt donation ledger.
- **Transcript & Verification Portal**: Digital transcript request queue, registrar approval workflow, and third-party credential verification link.

#### Phase 21 — Governance & Committee Management (`/governance`)
- Formal committee setup (Academic Council, Board of Governors, Disciplinary Committee).
- Meeting agenda creation, quorum tracking, live voting recorder, and digital minute sign-off.

#### Phase 22 — Digital Campus ID, Wallet & Commerce (`/campus/id`)
- Visual Digital ID Card with front/back flip animation, emergency contacts, barcode, and QR code.
- NFC badge access control toggles (Hostel, Library, Lab, Campus Gate) with real-time access logs.
- Integrated Campus Wallet with live ₹2,450 balance, spending analytics, and UPI top-up gateway.

#### Phase 23 — International Students & Global Mobility (`/international`)
- International student registry tracking nationality, passport details, visa expiry, and FRRO registration status.
- Visa renewal countdown reminders and required document checklists.
- Study abroad exchange programs, credit equivalence calculator, and partner university mapping.

#### Phase 24 — Microcredentials & Stackable Degrees (`/academics/microcredentials`)
- Microcredential catalog featuring Coursera, edX, NPTEL, and university-issued skill badges.
- Stackable learning pathways showing progress from single skill certificate to full diploma/degree.
- Blockchain-verified digital badge wallet with instant verification links.

#### Phase 25 — Data Migration Factory & Implementation Tower (`/system/migration`)
- Migration control room supporting legacy ERP, CSV, Excel, SQL Server, and Oracle data extractors.
- Field mapping editor with data transformation rules, data quality scoring, and duplicate detection.
- Implementation Gantt chart tracker, Go/No-Go milestone gates, and instant rollback snapshots.

#### Phase 26 — Legal, Risk & Contract Management (`/compliance/legal`)
- Contract lifecycle repository tracking vendors, MOUs, faculty SLAs, renewal dates, and legal terms.
- 5x5 Risk Heat Map matrix categorizing risks by likelihood vs. impact with mitigation strategies.
- Compliance calendar tracking mandatory regulatory filings (AICTE, UGC, NAAC, NIRF, Tax).

#### Phase 27 — Campus Sustainability & ESG Operations (`/campus/sustainability`)
- ESG Dashboard featuring circular progress indicators for Environmental, Social, and Governance scores.
- Monthly Carbon Footprint Tracker (energy, transport, water, waste) with year-over-year targets.
- Building-wise energy efficiency ratings (Grades A–F) and UN Sustainable Development Goals (SDG) alignment map.

#### Phase 28 — AI Governance & Model Operations (`/ai/governance`)
- Enterprise AI Model Registry tracking active ML models, versions, framework types, and evaluation metrics (Accuracy, F1 Score, Latency).
- Data drift detection alerts and demographic bias audit logs (Gender, Ethnicity, Socioeconomic status).
- Feature importance explainability reports (SHAP/LIME) and AI incident log registry.

#### Phase 29 — Community Hub & University Forum (`/community`)
- Production-grade campus social hub replacing basic thread lists.
- Post types: Text, Image, Video, GIF, File, Poll, Announcement, and Urgent Notice.
- Lazy-loaded replies, nested sub-replies, upvotes/downvotes, bookmarks, user mentions (`@user`), hashtags (`#tag`), and report moderation.

#### Phase 30 — Advanced User Account Dropdown & Preferences (`AccountDropdown.tsx`)
- Header user popover featuring Profile Summary, Role/Campus Switcher, and 6 specialized tab sections.
- Preferences: Theme mode, interface language, accessibility contrast, start page default.
- Security & Privacy: Password change form, 2FA status, active sessions killer, and privacy controls.

---

### ⚖️ Phases 31–70 — Enterprise UI Excellence, Legal Compliance & Verification

#### Phases 31–50 — Component Hardening & Real DB Binding
- Eliminated all static mock fallbacks in core dashboards; connected every form action to database mutations.
- Standardized data table components with sorting, multi-column search, pagination, and empty states.

#### Phases 51–60 — Accessibility (WCAG 2.1 AA) & Mobile Responsiveness
- Implemented keyboard navigation across all interactive widgets (Dialogs, Menus, Accordions, Tabs).
- Added `aria-live` regions for dynamic state changes and high-contrast color text ratios ($> 4.5:1$).

#### Phases 61–70 — Global Legal Compliance Suite
- Published production legal pages:
  - `/legal/privacy`: Data privacy policy compliant with India DPDP, EU GDPR, and US FERPA.
  - `/legal/terms`: University software terms of service and acceptable use policy.
  - `/legal/cookies`: Cookie consent disclosures and category management.
  - `/legal/dpa`: Data Processing Addendum for institutional tenant administrators.
  - `/privacy/data-request`: Data Subject Access Request (DSAR) submission and tracking portal.
  - `/grievance`: Formal student/staff grievance submission and statutory ombudsperson routing.

---

### 🤖 Phases 71–80 — Permission-Aware AI Copilots, Institutional RAG & AI Safety

#### Phase 71 — Shared AI Gateway
- Unified API gateway (`/api/ai/gateway`) abstracting LLM providers (`gpt-4o`, `claude-3-5-sonnet`, `campusos-mock-v1`).
- Standardized request format, streaming response interface, and error handling.

#### Phase 72 — Tenant AI Policy & Budget Engine
- Policy enforcement layer restricting AI tool access based on tenant subscription tier and user role.
- Token consumption rate-limiting and monthly budget caps with warning notifications.

#### Phase 73 — Permission-Aware Context Builder
- Server-side context assembler gathering real-time user state (attendance %, upcoming exams, library dues, active courses) while enforcing strict RBAC filters before passing context to the LLM.

#### Phase 74 — Institution-Isolated RAG Engine
- RAG knowledge pipeline indexing institutional handbooks, academic regulations, syllabus documents, and FAQs into tenant-isolated vector embeddings.

#### Phase 75 — Student, Faculty & Admin AI Copilots
- Dedicated AI assistant drawer widgets:
  - `/student/ai-assistant`: Instant answers on timetable, homework help, exam prep, and fee status.
  - `/faculty/ai-assistant`: Automated quiz generation, lesson plan drafting, and at-risk student summary.

#### Phase 76 — Safe AI Action Proposals
- Human-in-the-loop workflow: AI cannot directly alter database records. High-impact suggestions (e.g. creating a quiz or issuing a warning) generate structured Proposal Cards requiring explicit user button approval.

#### Phase 77 — AI Tool Registry & Safety Guardrails
- Tool registry defining permitted functions (`search_library`, `get_attendance_summary`) while strictly prohibiting autonomous alterations to marks, attendance logs, or financial balances.

#### Phase 78 — Prompt-Injection Defenses & PII Redaction
- Integrated `AiSafetyEngine` scanning incoming prompts for injection attacks, jailbreak attempts, and sensitive PII (Aadhaar, credit card numbers, passwords) prior to LLM processing.

#### Phase 79 — Institutional Knowledge Base Admin (`/ai/knowledge`)
- Admin workspace to upload, index, re-sync, or archive institutional RAG documents with chunk preview.

#### Phase 80 — Observability, Telemetry & Audit Logs (`ai_audit_logs`)
- Immutable security audit log table capturing user ID, tenant ID, prompt hash, tokens consumed, provider model, safety checks, and execution latency.

---

### 📊 Phases 81–90 — Institutional Intelligence, Digital-Twin Planning & Ecosystem

#### Phase 81 — Governed Institutional Data Warehouse (`/planning/warehouse`)
- Certified Semantic Metrics Layer defining standard university KPIs (Retention Rate, Graduation Rate, Student-Faculty Ratio, Cost Per Student).
- Status badges: `CERTIFIED`, `UNDER_REVIEW`, `DEPRECATED`.

#### Phase 82 — Digital Twin & Scenario Planning (`/planning/scenarios`)
- Interactive institutional simulation engine allowing leadership to model "What-If" scenarios (e.g. 15% student intake increase, fee restructuring, new campus construction) without mutating live operational databases.

#### Phase 83 — Student Success Command Centre (`/student-success`)
- Holistic student risk tracking console combining attendance trends, GPA trajectory, fee dues, and hostel check-in logs into a unified risk index score.

#### Phase 84 — Secure Integration Hub (`/integrations/catalog`)
- Enterprise connector catalog supporting 1-click integrations: DigiLocker, Razorpay, Google Workspace, Microsoft Teams, WhatsApp Business API, and Moodle.

#### Phase 85 — Developer Platform & App Marketplace (`/marketplace/apps`)
- Open developer ecosystem allowing third-party software vendors to list approved CampusOS apps with granular permission scoping (`read:attendance`, `write:assignments`).

#### Phase 86 — Campus Mobile Super App & Offline Sync Engine
- Touch-friendly, mobile-first navigation drawer with bottom bar support.
- Offline synchronization queue caching attendance records and assignment drafts locally when offline and syncing automatically upon network restoration.

#### Phase 87 — Smart Campus & IoT Operations (`/smart-campus`)
- Real-time IoT sensor management interface: Classroom occupancy sensors, HVAC energy meters, smart water meters, and automated RFID gate barriers.

#### Phase 88 — Implementation & Adoption Control Tower (`/implementation/projects`)
- 6-phase university deployment project tracker with milestone deliverables, user adoption progress, and training completion metrics.

#### Phase 89 — Enterprise Support & SLA Management (`/support/cases`)
- 24/7 technical support ticket portal with guaranteed SLA response countdowns, severity escalation, and direct engineering team messaging.

#### Phase 90 — Global & Regional Enterprise Configuration
- Multi-region compliance and localization presets:
  - **India Region**: DPDP compliance, UPI payments, Aadhaar/DigiLocker integration, AICTE/UGC reports.
  - **US Region**: FERPA privacy rules, Stripe/Plaid payments, Canvas LMS sync, IPEDS reporting.
  - **Global Region**: GDPR privacy compliance, multi-currency support, I18n translation strings.

---

### 🎨 Phase 91 — Interactive Product Tour & Connected Institutional Workflows

#### Phase 91 Overview
Implemented an interactive product tour section ([`ProductTourSection.tsx`](file:///home/nx-pro/campusos/apps/web/src/components/public/homepage/ProductTourSection.tsx)) directly on the public homepage to visually demonstrate how CampusOS connects university departments into a single seamless operational flow.

#### Connected Workflow Tracks:
1. **Admissions to Enrollment**: Application verification $\rightarrow$ Seat approval $\rightarrow$ ERP profile auto-creation $\rightarrow$ Semester invoice issuance.
2. **Academics & Attendance**: Course mapping $\rightarrow$ Biometric/mobile check-in $\rightarrow$ Attendance calculation $\rightarrow$ Automated at-risk alert dispatch.
3. **Examinations & Results**: Exam scheduling $\rightarrow$ Double-blind marks entry $\rightarrow$ Board verification $\rightarrow$ Instant SGPA/CGPA grade card release.
4. **Finance & Treasury**: Fee template configuration $\rightarrow$ Scholarship waiver adjustment $\rightarrow$ UPI gateway payment $\rightarrow$ Real-time general ledger posting.
5. **Student Services & Helpdesk**: Digital ticket submission $\rightarrow$ Intelligent SLA routing $\rightarrow$ Cryptographic digital signature $\rightarrow$ Student vault release.

#### Console Features:
- **Interactive Role & Workflow Selector**: Switch between 5 operational tracks with keyboard accessibility (`role="tablist"`).
- **Step Execution Explorer**: Click individual steps to view actor role, system action status, and description.
- **Automated Event Bus Dispatcher**: Shows live event logs (`timestamp`, `event`, `payload`, `status`).
- **SQL Database Mutation Preview**: Displays exact SQL query generated during workflow execution.
- **Enterprise Trust & Governance Panel**: Highlights Row-Level Security (RLS), Role-Based Access Control (RBAC), Immutable Audit Logging, and Zero-Data Leakage.
- **Automated Testing**: Covered by Playwright E2E test suite ([`product-tour.spec.ts`](file:///home/nx-pro/campusos/apps/web/tests/product-tour.spec.ts)) with 100% pass rate.

---

## 🛠️ Verification, Testing & Build Commands

Run the following commands from the root directory to verify code health, type safety, test suites, and build stability:

```bash
# 1. Typecheck the Next.js Web Application
npx tsc --noEmit --project apps/web/tsconfig.json

# 2. Run Vitest Unit & Integration Test Suite
npx vitest run

# 3. Run Playwright E2E Browser Tests
npx playwright test tests/product-tour.spec.ts --project=chromium
npx playwright test tests/demo-persona-isolation.spec.ts --project=chromium
npx playwright test tests/demo-scenarios.spec.ts --project=chromium
npx playwright test tests/student-profile-redesign.spec.ts --project=chromium

# 4. Execute Next.js Production Build (Compiles 120+ Routes)
npm run build
```

---

## 🏛️ Phase 92 & Phase 93 Platform Architecture Update

### Phase 92 — Demo Persona Isolation, Dashboard Scoping & Role Guided Tutorials
- **Persona Identity Isolation**: Strict server-side session identity resolution guaranteeing zero leakage of Rohan Verma's student details into Admin (`Aarav Mehta`) or Faculty (`Dr. Priya Sharma`) views.
- **Parent Guardian Linkage**: `Anita Verma` accesses `Rohan Verma`'s academic record exclusively via verified `GuardianStudent` database relations.
- **Persistent Utility Banner**: Compact, non-intrusive `DemoEnvironmentBanner` with role pill, 1-click role switcher, tutorial restarter, and mobile bottom-sheet drawer (`DemoOptionsSheet`).
- **Role-Based Onboarding Tours**: Interactive 6-step guided onboarding tours (`DemoOnboardingProvider`) tailored for Admin, Faculty, Student, and Parent.
- **"How CampusOS Works" Centre**: Interactive architecture diagram and role exploration checklists (`/demo/how-it-works`).
- **Student Benefits & Developer Pack Hub**: Curated perks console (`/student-benefits`) offering $3,850+/year in free developer tools.

### Phase 93 — Interactive Cross-Role Demo Scenario Engine & Reversible Story Mode
- **Scenario Catalogue & Workspace**: 6 end-to-end institutional scenarios (`/demo/scenarios` & `/demo/scenarios/[scenarioId]`):
  1. **Assignment Submission and Grading** (Student $\rightarrow$ Faculty $\rightarrow$ Student)
  2. **Attendance Session and Student Update** (Faculty $\rightarrow$ Student $\rightarrow$ Parent)
  3. **Fee Invoice and Sandbox Payment** (Admin $\rightarrow$ Student $\rightarrow$ Parent $\rightarrow$ Admin)
  4. **Student Service Request** (Student $\rightarrow$ Admin $\rightarrow$ Student)
  5. **Examination Marks and Result Review** (Faculty $\rightarrow$ Admin $\rightarrow$ Student $\rightarrow$ Parent)
  6. **Admissions Application to Enrollment** (Admin)
- **Transactional Reset Engine**: Atomic scenario reset (`DemoScenarioInstance` & `DemoScenarioEvent`) returning affected records to pre-scenario state without global tenant reseed.
- **"What Changed in CampusOS?" Panel**: Educational authorization explainer detailing real-time RLS rules and audit events.

### Student Profile Redesign
- **Identity Header**: Clean initials avatar (`RV`), prominent student name, roll number (`STU-24-001`), admission ID (`3744`), and single non-duplicated scholarship badge.
- **Consistent Metric Cards**: Replaced pastel colored cards with unified white surface cards (`#FFFFFF`), neutral border (`#DFE6F0`), and soft blue icon containers.
- **Responsive Layout**: Controlled max-width (`1360px`), responsive 4-col detail grid, keyboard-navigable profile tabs (`Overview`, `Academic Journey`, `Attendance Ledger`, `Documents`, `Certificates`, `Requests`).

---

## 🚀 Getting Started with Local Development

### Prerequisites:
- Node.js 18.x or 20.x
- npm 9.x+ or pnpm 8.x+
- PostgreSQL database (or local SQLite/Docker container)

### Step-by-Step Installation:

```bash
# 1. Clone the repository
git clone https://github.com/campusos/campusos.git
cd campusos

# 2. Install workspace dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Sync Prisma Database Schema & Seed Data
npx prisma db push
node scripts/seed-demo.js

# 5. Start the Development Server
npm run dev
```

Open `http://localhost:3000` in your web browser to explore the homepage, interactive product tour, and login portal.

---

## 📄 License & Attribution

CampusOS is proprietary enterprise software developed for higher education institutions worldwide. All rights reserved. Designed and built with extreme architectural precision by the Principal Enterprise SaaS Architect & Engineering Team.

