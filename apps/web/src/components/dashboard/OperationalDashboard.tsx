'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BellRing,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  Landmark,
  ReceiptIndianRupee,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import type { DashboardMetric, RiskAlert } from '@/lib/dashboard/contracts';
import type {
  OperationalDashboardData,
  OperationalDashboardRole,
  OperationalRecord,
} from '@/lib/dashboard/operational-contracts';

const roleIcons: Record<OperationalDashboardRole, ElementType> = {
  REGISTRAR: FileCheck2,
  FINANCE_OFFICER: ReceiptIndianRupee,
  EXAMINATION_CONTROLLER: BookOpenCheck,
  ADMISSIONS_COUNSELLOR: Landmark,
};

export function OperationalDashboard({ data }: { data: OperationalDashboardData }) {
  const RoleIcon = roleIcons[data.role];

  return (
    <section className="space-y-6" aria-label={`${data.identity.title} dashboard`}>
      <header className="overflow-hidden rounded-3xl border border-border bg-surface shadow-sm">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-primary">
              <RoleIcon className="h-4 w-4" aria-hidden="true" />
              {data.heading.eyebrow}
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
              {data.heading.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
              {data.heading.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-secondary">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                {data.identity.title}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border bg-surface-muted px-3 py-2 text-xs font-semibold text-text-secondary">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
                Real tenant-scoped data
              </span>
            </div>
          </div>

          <aside className="border-t border-border bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9EBBEE]">Signed-in operator</p>
            <h2 className="mt-3 text-2xl font-bold">{data.identity.name}</h2>
            <p className="mt-2 break-all text-sm text-[#C7D3E4]">{data.identity.email}</p>
            <div className="mt-6 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#9EBBEE]" aria-hidden="true" />
                <p className="text-sm leading-6 text-[#C7D3E4]">
                  Dashboard figures are loaded on the server for the active institution. Individual records remain inside their authorised modules.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </header>

      <AlertSection alerts={data.riskAlerts} />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operational metrics">
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6" aria-labelledby="overview-heading">
        <SectionHeading icon={ClipboardList} title="Operational overview" id="overview-heading" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.summary.map((item) => {
            const content = (
              <>
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">{item.label}</p>
                <p className="mt-3 text-xl font-bold text-text-primary">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-text-secondary">{item.detail}</p>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-xl border border-border bg-surface-muted p-4 transition hover:border-primary/35 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {content}
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ) : (
              <article key={item.id} className="rounded-xl border border-border bg-surface-muted p-4">
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6 xl:col-span-7" aria-labelledby="records-heading">
          <SectionHeading icon={CalendarClock} title={data.recordsTitle} id="records-heading" />
          <p className="mt-2 text-sm leading-6 text-text-secondary">{data.recordsDescription}</p>

          {data.records.length === 0 ? (
            <EmptyState message="No matching records are available for this dashboard view." />
          ) : (
            <ul className="mt-5 space-y-3">
              {data.records.map((record) => (
                <RecordRow key={record.id} record={record} />
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6 xl:col-span-5" aria-labelledby="actions-heading">
          <SectionHeading icon={CheckCircle2} title="Quick actions" id="actions-heading" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {data.quickActions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="group flex min-h-16 items-center justify-between gap-4 rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm font-bold text-text-primary transition hover:border-primary/35 hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-primary transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6 xl:col-span-7" aria-labelledby="notices-heading">
          <SectionHeading icon={BellRing} title="Relevant notices" id="notices-heading" />
          {data.notices.length === 0 ? (
            <EmptyState message="No role-relevant institutional notices are available." />
          ) : (
            <ul className="mt-5 space-y-3">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-xl border border-border bg-surface-muted p-4">
                  <p className="text-sm font-bold text-text-primary">{notice.title}</p>
                  <p className="mt-2 text-sm leading-6 text-text-secondary">{notice.content}</p>
                  <p className="mt-3 text-xs text-text-muted">{formatDateTime(notice.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm sm:p-6 xl:col-span-5" aria-labelledby="activity-heading">
          <SectionHeading icon={Clock3} title="Your recent activity" id="activity-heading" />
          <p className="mt-2 text-xs leading-5 text-text-muted">
            Limited to audit events associated with your authenticated account.
          </p>
          {data.recentActivity.length === 0 ? (
            <EmptyState message="No recent activity is recorded for this account." />
          ) : (
            <ul className="mt-5 divide-y divide-border">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text-primary">{item.action}</p>
                    <p className="mt-1 truncate text-xs text-text-secondary">{item.entity}</p>
                    <p className="mt-1 text-[11px] text-text-muted">{formatDateTime(item.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: DashboardMetric }) {
  const toneClass = {
    neutral: 'border-border bg-surface',
    positive: 'border-success/25 bg-success-soft/40',
    warning: 'border-warning/30 bg-warning-soft/50',
    danger: 'border-danger/30 bg-danger-soft/50',
  }[metric.tone ?? 'neutral'];

  return (
    <article className={`min-w-0 rounded-2xl border p-5 shadow-sm ${toneClass}`}>
      <p className="text-sm font-semibold text-text-secondary">{metric.label}</p>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary">{metric.value ?? '—'}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-text-muted">{metric.detail}</p>
    </article>
  );
}

function RecordRow({ record }: { record: OperationalRecord }) {
  const content = (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-text-primary">{record.title}</p>
        <p className="mt-1 text-xs leading-5 text-text-secondary">{record.detail}</p>
      </div>
      {record.status && (
        <span className="shrink-0 rounded-full border border-primary/20 bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
          {formatStatus(record.status)}
        </span>
      )}
    </div>
  );

  return (
    <li>
      {record.href ? (
        <Link
          href={record.href}
          className="group flex min-h-20 items-center rounded-xl border border-border bg-surface-muted p-4 transition hover:border-primary/35 hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          {content}
          <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-primary transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      ) : (
        <div className="flex min-h-20 items-center rounded-xl border border-border bg-surface-muted p-4">{content}</div>
      )}
    </li>
  );
}

function AlertSection({ alerts }: { alerts: RiskAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="space-y-3" aria-label="Action required">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-start ${
            alert.level === 'danger'
              ? 'border-danger/30 bg-danger-soft'
              : alert.level === 'warning'
                ? 'border-warning/30 bg-warning-soft'
                : 'border-primary/20 bg-primary-soft'
          }`}
        >
          <AlertCircle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              alert.level === 'danger' ? 'text-danger' : alert.level === 'warning' ? 'text-warning' : 'text-primary'
            }`}
            aria-hidden="true"
          />
          <p className="flex-1 text-sm font-semibold leading-6 text-text-primary">{alert.message}</p>
          {alert.href && (
            <Link href={alert.href} className="inline-flex min-h-10 items-center gap-1 text-xs font-bold text-primary hover:underline">
              Review
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}

function SectionHeading({ icon: Icon, title, id }: { icon: ElementType; title: string; id: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 id={id} className="text-lg font-bold text-text-primary">{title}</h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-border bg-surface-muted px-5 py-8 text-center">
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
