# 🎓 CampusOS — Next-Generation Multi-Tenant University & College ERP Platform

> **The World's Most Advanced, AI-Native, Multi-Tenant Educational Operating System**

[![Next.js](https://img.shields.io/badge/Next.js-14.2.35-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-82%20Passed-6E9F18?style=flat-square&logo=vitest)](https://vitest.dev/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](#)

---

## 🚀 Recent Major Updates

**1. The CampusOS Blueprint Architecture Portal**  
A premium, interactive technical deep-dive available at `/blueprint`. It details the 15 core architectural systems, compliance matrices (India/US/Global), AI governance principles, and multitenancy infrastructure mapping in a beautiful, gradient-free, accessible enterprise UI.

**2. Unified Authentication & Public Experience**  
Redesigned public landing pages and authentication flows. Real-time state persistence using `zustand/middleware` ensures immediate role-based dashboard delivery post-login. The dashboard is protected and isolated by Next.js app routing logic and strictly typed schemas.

---

## 🏛️ Platform Overview

**CampusOS** is a multi-tenant higher education ERP platform built to manage modern university systems. Built on Next.js 14 App Router, React 19, TypeScript, PostgreSQL Row Level Security (RLS), Redis, and BullMQ, CampusOS orchestrates every dimension of institutional governance across **20 Sequential Implementation Phases**.

---

## 🏗️ Architecture & Security Model

- **Multi-Tenant Security**: Enforced via PostgreSQL Row-Level Security (RLS) (`tenant_id` mandatory on every schema table).
- **8-Role RBAC Model**: Super Admin, Institution Admin, HOD, Faculty, Student, Parent, Warden, Accountant.
- **AI-Native Operations**: RAG AI Copilot guarded against prompt-injection attacks with multi-factor student dropout retention risk scoring.
- **Government Compliance**: DigiLocker / NAD marksheet push adapter, Academic Bank of Credits (ABC / APAAR ID) credit deposit, and NAAC Criteria 1–7 metrics (Projected **Grade A++**).

---

## 📋 Comprehensive Phase-by-Phase Detailed Breakdown

### Phase 0 — Architecture & Foundation Setup
- **Goal**: Monorepo scaffolding, design system configuration, and type-safe environment setup.
- **Deliverables**: Turborepo workspace (`apps/web`, `packages/db`, `packages/types`, `packages/config`), Next.js 14 App Router integration, Tailwind CSS tokens, and Shadcn UI components.
- **Verification**: Type-safe environment validation (`env.test.ts`).

### Phase 1 — Identity, Tenancy & RBAC Security
- **Goal**: Multi-tenant isolation and 8-role RBAC authorization matrix.
- **Deliverables**: PostgreSQL Row-Level Security policies, role permission evaluator (`can()`), tenant isolation guard, and interactive Impersonation Banner.
- **Verification**: `tenant-security.test.ts`, `rbac-security.test.ts`, `permissions.test.ts`.

### Phase 2 — Academic Core, Courses & Registration
- **Goal**: Curriculum management, prerequisite enforcement, and atomic seat reservation.
- **Deliverables**: Backlog/CGPA credit limit gatekeeper, atomic seat reservation engine, and constraint satisfaction (CSP) timetable solver.
- **Verification**: `registration-rules.test.ts`, `concurrent-registration.test.ts`, `timetable-solver.test.ts`.

### Phase 3 — Timetable, Attendance & LMS Engine
- **Goal**: Attendance tracking and LMS course workspace.
- **Deliverables**: 75% attendance shortage gatekeeper (shortage flag generation), LMS gradebook math, assignment submission portal, and video lecture player.
- **Verification**: `attendance-shortage.test.ts`, `lms-gradebook.test.ts`.

### Phase 4 — Exams, Results & Moderation Math
- **Goal**: Examination seating, 3-tier marks lock chain, and moderation math.
- **Deliverables**: Anti-cheating checkerboard seat interleaving algorithm (CS/ME/EE branches), COE 3-tier lock chain (Faculty $\rightarrow$ HOD $\rightarrow$ COE), and $+2$ grace mark moderation.
- **Verification**: `seating-generator.test.ts`, `exam-eligibility.test.ts`, `result-processing.test.ts`.

### Phase 5 — Fees, Payments & Treasury Engine
- **Goal**: Fee structure management, payment gateways, and accounting exports.
- **Deliverables**: Webhook Idempotency Guard (HMAC-SHA256 verification), daily late fee slab rule ($\$10/\text{day}$ after due date), Razorpay/Stripe payment console, and Tally ERP CSV exporter.
- **Verification**: `webhook-idempotency.test.ts`, `fee-calculations.test.ts`, `defaulter-hold.test.ts`.

### Phase 6 — Campus Life Modules
- **Goal**: Hostel management, transport tracking, OPAC library, and helpdesk.
- **Deliverables**: Parent + Warden dual-approval outpass workflow, live bus GPS telemetry, library OPAC fine calculator ($\$1/\text{day}$), and instant certificate generator.
- **Verification**: `hostel-outpass.test.ts`, `library-fines.test.ts`, `helpdesk-certificates.test.ts`.

### Phase 7 — Student Lifecycle CRM & Placements
- **Goal**: Admissions CRM, corporate placement drives, and alumni network.
- **Deliverables**: 1-Click Admissions Lead $\rightarrow$ Active Student conversion engine, Placement Drive CGPA/backlog eligibility filter, ATS resume builder, and Student $\rightarrow$ Alumnus converter.
- **Verification**: `lead-to-student.test.ts`, `student-to-alumni.test.ts`, `placement-eligibility.test.ts`.

### Phase 8 — Role AI Copilot & Automation Engine
- **Goal**: AI Copilot, student retention risk engine, and workflow automations.
- **Deliverables**: Prompt-injection shielded role-aware RAG AI Copilot, multi-factor student risk score calculator (Attendance + Marks + Dues + LMS activity), and Zapier-style workflow automation builder.
- **Verification**: `ai-copilot-security.test.ts`, `retention-risk.test.ts`, `automation-engine.test.ts`.

### Phase 9 — Production Hardening, AES-256 & Offline Sync
- **Goal**: Data encryption, rate limiting, and offline PWA synchronization.
- **Deliverables**: AES-256-GCM field-level PII encryption/decryption, Redis sliding window rate limiter, Last-Write-Wins (LWW) offline mutation sync queue, and `/api/health` readiness endpoint.
- **Verification**: `security-hardening.test.ts`, `offline-sync.test.ts`, `system-health.test.ts`.

### Phase 10 — Omnichannel Comms & Emergency Panic Broadcast
- **Goal**: Multi-channel notification engine and emergency campus alerts.
- **Deliverables**: Automatic Channel Fallback Engine (WhatsApp $\rightarrow$ SMS $\rightarrow$ Email), quiet hours evaluator ($22:00 - 07:00$), and Emergency Panic Broadcast console.
- **Verification**: `notification-fallback.test.ts`, `emergency-broadcast.test.ts`.

### Phase 11 — DigiLocker, ABC Credit Bank & NAAC Accreditation
- **Goal**: Government compliance integrations and NAAC accreditation workspace.
- **Deliverables**: DigiLocker / NAD marksheet push adapter with SHA-256 tamper-evident hash, Academic Bank of Credits (ABC / APAAR ID) credit deposit, and NAAC Criteria 1–7 metric puller (**Grade A++ Projected**).
- **Verification**: `digilocker-push.test.ts`, `abc-credit-bank.test.ts`, `naac-metrics.test.ts`.

### Phase 12 — Research, Grants, Patents & Innovation
- **Goal**: Research grant lifecycle, publication metrics, and patent royalties.
- **Deliverables**: Research grant proposal to Utilization Certificate (UC) generator, automated faculty h-index calculator, and 70/20/10 patent commercialization royalty split calculator.
- **Verification**: `research-grants.test.ts`, `h-index-calculator.test.ts`, `patent-royalties.test.ts`.

### Phase 13 — Operations, Procurement, Facilities & Assets
- **Goal**: Procurement 3-way match, physical asset tracking, and visitor passes.
- **Deliverables**: Procurement 3-Way Match Audit (PO vs GRN vs Invoice), straight-line asset depreciation schedule generator, inventory reorder alerts, and QR visitor pass issuance.
- **Verification**: `three-way-match.test.ts`, `asset-depreciation.test.ts`, `inventory-alerts.test.ts`.

### Phase 14 — HR, Staff, Payroll & Performance
- **Goal**: Staff payroll processing, tax withholding, and leave ledgers.
- **Deliverables**: Monthly staff payroll engine (Base Pay, HRA 40%, DA 50%, PF 12%, TDS 10%), NACH/NEFT bank disbursement CSV exporter, and staff leave balance ledger.
- **Verification**: `payroll-calculation.test.ts`, `nach-bank-file.test.ts`, `staff-leave-ledger.test.ts`.

### Phase 15 — Health, Safety, Disability & Campus Wellness
- **Goal**: Mobile SOS panic alert, POSH/ICC portal, and disability accommodations.
- **Deliverables**: Mobile SOS Panic Button with live GPS coordinate broadcast to security control room, anonymized POSH / ICC complaint filing portal, and UDID extra exam time calculator.
- **Verification**: `sos-gps-broadcast.test.ts`, `posh-confidential.test.ts`, `disability-accommodation.test.ts`.

### Phase 16 — Student Engagement, Gamification & Clubs
- **Goal**: Gamification XP progression, attendance streaks, and event certificates.
- **Deliverables**: 14-day attendance streak badge evaluator (+250 XP bonus), student XP level progression calculator, and QR venue check-in event participation certificate generator.
- **Verification**: `gamification-badges.test.ts`, `event-qr-certificate.test.ts`, `xp-progression.test.ts`.

### Phase 17 — Multi-Campus, Franchising & Internationalization
- **Goal**: Multi-campus treasury consolidation, cross-campus electives, and currency conversion.
- **Deliverables**: Multi-campus group treasury financial aggregator ($3M USD total), cross-campus elective enrollment with real-time currency conversion (INR $\leftrightarrow$ USD), and ECTS to US credit converter.
- **Verification**: `multicampus-financials.test.ts`, `cross-campus-enrollment.test.ts`, `ects-credit-conversion.test.ts`.

### Phase 18 — SaaS Business Layer, Self-Serve Subscription & Metering
- **Goal**: Multi-tenant SaaS billing, self-serve provisioning, and feature flags.
- **Deliverables**: Instant 3-minute self-serve tenant onboarding wizard (`tenant.campusos.app`), plan feature flag entitlement matrix (Starter vs Growth vs Enterprise), and $1/student monthly usage metering engine.
- **Verification**: `tenant-provisioning.test.ts`, `plan-feature-flags.test.ts`, `usage-metering.test.ts`.

### Phase 19 — Operational Excellence, Chaos Testing & Observability
- **Goal**: Prometheus metrics exporter and Chaos Monkey resilience testing.
- **Deliverables**: Prometheus `/api/metrics` timeseries metric exporter (`http_requests_total`, `active_tenant_count`), Chaos Monkey DB outage simulator with degraded Redis cache fallback, and PITR disaster recovery.
- **Verification**: `chaos-db-fallback.test.ts`, `prometheus-metrics.test.ts`, `disaster-recovery.test.ts`.

### Phase 20 — Public Portal, SEO Landing Page & Full Verification
- **Goal**: Public certificate verification portal, ROI calculator, and production build check.
- **Deliverables**: Public instant certificate verification portal by hash (`CERT-2026-9941`), interactive institutional ROI calculator, 82-test Vitest execution, and zero-warning Next.js production build (`npm run build`).
- **Verification**: `public-certificate-lookup.test.ts`, `roi-calculator.test.ts`.

---

## 🧪 Test Suite Summary

Run the complete 82-test Vitest suite across all 20 phases:

```bash
npx vitest run
```

```
 Test Files  58 passed (58)
      Tests  82 passed (82)
   Start at  23:13:14
   Duration  3.94s
```

---

## 🛠️ Production Build Verification

Verify optimized production compilation:

```bash
npx next build
```

```
   Creating an optimized production build ...
 ✓ Compiled successfully
   Linting and checking validity of types     ✓ Linting and checking validity of types 
   Collecting page data     ✓ Collecting page data 
 ✓ Generating static pages (4/4)
   Collecting build traces     ✓ Collecting build traces 
   Finalizing page optimization     ✓ Finalizing page optimization 
```

---

## 📤 How to Push to GitHub

To push this repository to your GitHub account:

```bash
# 1. Add your GitHub remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/campusos-erp.git

# 2. Rename branch to main if needed
git branch -M main

# 3. Push to GitHub
git push -u origin main
```

---

## 💻 Local Development Setup

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/campusos-erp.git
cd campusos-erp

# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000 in your browser
```

---

## 📄 License

Copyright © 2026 CampusOS Platform. All rights reserved.
