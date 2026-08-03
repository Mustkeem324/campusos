# 🎓 CampusOS — Next-Generation Multi-Tenant University & College ERP Platform

> **The World's Most Advanced, AI-Native, Multi-Tenant Educational Operating System**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-95%20Passed-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/Playwright-19%20Passed-2EAD33?style=flat-square&logo=playwright)](https://playwright.dev/)
[![Build Status](https://img.shields.io/badge/Build-105%20Routes%20Passing-brightgreen?style=flat-square)](#)

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

3. **Dual Automated Verification Pipeline**  
   - **60/60 Vitest files passing** (`95/95` assertions)
   - **19/19 Playwright browser E2E tests passing** (`0` skipped, `0` failed)
   - **105/105 Next.js App Router pages compiling with 0 errors**

---

## 📋 Comprehensive 70-Phase Platform Breakdown

### Phases 0–10 — Core Foundation, Tenancy & Academic Engine
- **Phase 0 — Monorepo Architecture**: Turborepo, Next.js 14 App Router, TypeScript 5, Tailwind CSS design system tokens (`#F6F8FC` surface, `#1754E8` primary).
- **Phase 1 — Tenancy & RBAC**: Row-Level Security, 8-role permission matrix (`can()`), and Super Admin impersonation banner.
- **Phase 2 — Academic Core & Registration**: Credit limits, atomic seat reservation engine, and constraint satisfaction timetable solver.
- **Phase 3 — Timetable, Attendance & LMS**: 75% attendance shortage gatekeeper, gradebook math, and video learning stage.
- **Phase 4 — Exams & Moderation**: Anti-cheating checkerboard seat generator, 3-tier marks lock chain (Faculty $\rightarrow$ HOD $\rightarrow$ COE), and $+2$ grace mark moderation.
- **Phase 5 — Fees, Payments & Treasury Engine**: Webhook Idempotency Guard (HMAC-SHA256), Razorpay/Stripe console, and Tally ERP exporter.
- **Phase 6 — Campus Life**: Dual-approval hostel outpasses, live bus GPS tracking, library OPAC fine engine, and QR certificate builder.
- **Phase 7 — Admissions CRM & Placements**: 1-Click Lead $\rightarrow$ Student converter, ATS resume builder, and CGPA placement filters.
- **Phase 8 — AI Copilot & Retention**: Prompt-injection shielded RAG AI Copilot and multi-factor student dropout risk scoring.
- **Phase 9 — Production Hardening**: AES-256-GCM PII encryption, sliding-window rate limiters, and `/api/health` check.
- **Phase 10 — Omnichannel Comms**: WhatsApp $\rightarrow$ SMS $\rightarrow$ Email fallback engine and Emergency Panic Broadcast console.

### Phases 11–20 — Compliance, Research & Operations
- **Phase 11 — DigiLocker & NAAC**: NAD marksheet push adapter, Academic Bank of Credits (ABC ID) deposit, and NAAC Criteria 1–7 metrics.
- **Phase 12 — Research & Patents**: Utilization Certificate (UC) generator, faculty h-index calculator, and 70/20/10 patent royalty split.
- **Phase 13 — Operations & Assets**: 3-way procurement match (PO vs GRN vs Invoice), asset depreciation schedules, and QR visitor passes.
- **Phase 14 — HR & Payroll**: Monthly staff payroll (Base, HRA 40%, DA 50%, PF 12%, TDS 10%) and NACH disbursement CSV exporter.
- **Phase 15 — Health & Safety**: Mobile SOS GPS panic broadcast, anonymized POSH / ICC portal, and UDID extra exam time calculator.
- **Phase 16 — Gamification & Clubs**: 14-day attendance streak (+250 XP bonus), level progression, and event certificates.
- **Phase 17 — Multi-Campus**: Consolidated group treasury ($3M USD), INR $\leftrightarrow$ USD currency conversion, and ECTS to US credit conversion.
- **Phase 18 — SaaS Business Layer**: 3-minute self-serve tenant onboarding wizard and $1/student monthly usage metering engine.
- **Phase 19 — Operational Resilience**: Prometheus `/api/metrics` timeseries exporter and Chaos Monkey DB fallback testing.
- **Phase 20 — Public Verification & ROI**: Public certificate lookup by hash (`CERT-2026-9941`) and ROI calculator.

### Phases 21–50 — Governance, Legal & Enterprise Modules
- **Phases 21–30 — Specialized Consoles**: Built dedicated management consoles for Governance & Board Meetings, Digital Campus ID & Wallet, International Mobility & Visa Tracking, Microcredentials & Digital Badges, Data Migration Control Tower, Legal Risk & Contracts, Sustainability & ESG Carbon Tracking, and AI Model Governance & Bias Auditing.
- **Phases 31–50 — UI & Workflow Expansion**: Complete coverage for Smart Community Forums, Results Processing, Real-Time Live Sessions, Legal Centre (`/legal/privacy`, `/legal/terms`, `/legal/dpa`, `/legal/cookies`), and Account Dropdowns.

### Phases 51–60 — UI Excellence & Design-System Consolidation
- **Visual Design Standard**: Zero gradients, zero neon, zero decorative blobs, zero glassmorphism. Standardized enterprise color palette (`#F6F8FC` background, `#FFFFFF` surfaces, `#1754E8` primary actions, `#101A32` dark navy text/headers).
- **Responsive Architecture**: Tested layouts from 320px to 1920px width across phone, tablet, and desktop viewports.
- **5-Level Information Hierarchy**: Standardized dashboards around (1) Immediate Status, (2) Action Required, (3) Operational Insights, (4) Recent Activity, and (5) Quick Actions.

### Phases 61–70 — Real-Browser Verification, Accessibility & Release Evidence
- **Browser Playwright E2E Suite**: 19/19 Playwright tests passing against live Next.js HTTP routes in Chromium.
- **WCAG 2.1 AA Accessibility**: Added skip-to-content landmarks, keyboard focus rings, modal/drawer focus traps, and screen-reader announcements.
- **Production Build Clean Sign-Off**: 105/105 Next.js routes compiled cleanly with zero lint or type errors.

---

## 🧪 Test Suite Execution

### 1. Vitest Unit & Integration Tests
```bash
export $(cat apps/web/.env | xargs) && npx vitest run
```
```text
 Test Files  60 passed (60)
      Tests  95 passed (95)
   Start at  03:15:50
   Duration  5.19s
```

### 2. Playwright Browser E2E Tests
```bash
npx playwright test --project=chromium
```
```text
Running 19 tests using 6 workers
  19 passed (5.1s)
```

### 3. TypeScript Monorepo Check
```bash
npx tsc --noEmit --project apps/web/tsconfig.json
```
```text
Clean compilation (0 errors).
```

### 4. Next.js Production Build
```bash
npx next build
```
```text
  ▲ Next.js 14.2.15
 ✓ Compiled successfully
 ✓ Generating static pages (105/105)
```

---

## 💻 Local Development Setup

```bash
# Clone repository
git clone https://github.com/Mustkeem324/campusos.git
cd campusos

# Install dependencies
npm install

# Seed demo database
node apps/web/scripts/seed-demo.js

# Start local dev server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 📄 License

Copyright © 2026 CampusOS Platform. All rights reserved.
