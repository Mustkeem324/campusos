'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  ClipboardList,
  Clock3,
  GraduationCap,
  LifeBuoy,
  ReceiptText,
  ShieldCheck,
  Users,
} from 'lucide-react';
import type { AdminDashboardData } from '@/lib/dashboard/contracts';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value));
}

/**
 * Administrator dashboard — a dedicated composition for INSTITUTION_ADMIN and
 * SUPER_ADMIN roles. Every value originates from the server-side
 * AdminDashboardData contract; the component only renders. Student records
 * appear exclusively as institution-level aggregates.
 */
export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  return (
    <section className="space-y-6" aria-label="Administrator dashboard">
      {/* Identity header */}
      <header className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft font-bold text-primary">
              {initials(data.identity.name)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                Institution Administration Portal
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-text-primary sm:text-2xl">
                Welcome back, {data.identity.name}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {data.identity.title} • {data.identity.email}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
              {data.academicsSummary.enrollments} active enrollments
            </span>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-5 border-t border-border pt-4">
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Quick actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {data.quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Risk alerts first (real exceptions before anything decorative) */}
      <AlertSection alerts={data.riskAlerts} />

      {/* Primary metrics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Institution summary">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* User & academic composition */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={Users} title="Users & academics" />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Students" value={data.userSummary.students} />
            <StatTile label="Faculty" value={data.userSummary.faculty} />
            <StatTile label="Parents / guardians" value={data.userSummary.parents} />
            <StatTile label="Departments" value={data.academicsSummary.departments} />
            <StatTile label="Courses" value={data.academicsSummary.courses} />
            <StatTile label="Course offerings" value={data.academicsSummary.courseOfferings} />
          </div>
        </section>

        {/* Finance summary */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={ReceiptText} title="Financial overview" href="/receipts" />
          <div className="mt-4 space-y-3">
            <FinanceRow label="Recorded collections" value={formatCurrency(data.financeSummary.collectedAmount)} />
            <FinanceRow label="Outstanding fees" value={formatCurrency(data.financeSummary.outstandingAmount)} />
            <FinanceRow label="Paid transactions" value={String(data.financeSummary.paymentCount)} />
            <FinanceRow label="Invoices issued" value={String(data.financeSummary.invoiceCount)} />
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Notices */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={ClipboardList} title="Institutional notices" href="/notifications" />
          {data.notices.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
              No notices have been published yet.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-border bg-surface-muted p-3.5">
                  <p className="text-sm font-bold text-text-primary">{notice.title}</p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">{notice.content}</p>
                  <p className="mt-2 text-[11px] text-text-muted">{formatDate(notice.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent activity */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={Clock3} title="Recent activity" href="/audit" />
          {data.recentActivity.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
              There is no recorded activity to show yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary">{item.action}</p>
                    <p className="mt-0.5 truncate text-xs text-text-secondary">{item.entity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Support cases */}
        <section className="lg:col-span-7 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={LifeBuoy} title="Support cases" href="/support/cases" />
          {data.supportCases.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">
              No support cases are open for this institution.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.supportCases.map((supportCase) => (
                <li key={supportCase.id} className="rounded-xl border border-border bg-surface-muted p-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{supportCase.title}</p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {supportCase.caseNumber} • {supportCase.category} • {supportCase.priority}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      {supportCase.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Administration modules */}
        <section className="lg:col-span-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
          <SectionHeading icon={ShieldCheck} title="Administration modules" />
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {adminModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="flex items-center gap-2 rounded-xl border border-border bg-surface-muted p-3 text-xs font-semibold text-text-primary transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
              >
                <module.icon size={15} className="shrink-0 text-primary" />
                {module.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

const adminModules = [
  { label: 'Admissions Hub', href: '/platform/admissions', icon: GraduationCap },
  { label: 'Departments', href: '/departments', icon: Building2 },
  { label: 'Audit Logs', href: '/audit', icon: Clock3 },
  { label: 'Security Settings', href: '/settings', icon: ShieldCheck },
];

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function AlertSection({ alerts }: { alerts: AdminDashboardData['riskAlerts'] }) {
  if (alerts.length === 0) return null;
  return (
    <section aria-label="Action required" className="space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className={`flex items-start gap-3 rounded-2xl border p-4 ${
            alert.level === 'danger'
              ? 'border-danger/30 bg-danger-soft'
              : alert.level === 'warning'
                ? 'border-warning/30 bg-warning-soft'
                : 'border-border bg-surface-muted'
          }`}
        >
          <AlertCircle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              alert.level === 'danger' ? 'text-danger' : alert.level === 'warning' ? 'text-warning' : 'text-primary'
            }`}
          />
          <div className="flex-1">
            <p className="text-sm font-semibold text-text-primary">{alert.message}</p>
          </div>
          {alert.href && (
            <Link href={alert.href} className="shrink-0 text-xs font-bold text-primary hover:underline">
              Act <ArrowRight className="inline h-3 w-3" />
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}

function MetricCard({ metric }: { metric: AdminDashboardData['metrics'][number] }) {
  return (
    <article className="min-w-0 rounded-2xl border border-border bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-text-secondary">{metric.label}</p>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary">{metric.value}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-text-muted">{metric.detail}</p>
    </article>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted p-3.5">
      <p className="text-lg font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-text-secondary">{label}</p>
    </div>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-surface-muted px-3.5 py-3">
      <p className="text-xs font-medium text-text-secondary">{label}</p>
      <p className="text-sm font-bold text-text-primary">{value}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, href }: { icon: React.ElementType; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-base font-bold text-text-primary">
        <Icon size={18} className="text-primary" /> {title}
      </h2>
      {href && (
        <Link href={href} className="text-xs font-semibold text-primary hover:underline">
          View all
        </Link>
      )}
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
}
