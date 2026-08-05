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
      <header className="overflow-hidden rounded-[28px] border border-[#D9E3F0] bg-white shadow-[0_24px_60px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
              <RoleIcon className="h-4 w-4" aria-hidden="true" />
              {data.heading.eyebrow}
            </div>
            <h1 className="mt-5 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white sm:text-4xl">
              {data.heading.title}
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#5F6C7B] dark:text-slate-400">
              {data.heading.description}
            </p>

            <div className="mt-7 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                {data.identity.title}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Real tenant-scoped data
              </span>
            </div>
          </div>

          <aside className="border-t border-[#263D61] bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#9EBBEE]">Signed-in operator</p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">{data.identity.name}</h2>
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

      <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6" aria-labelledby="overview-heading">
        <SectionHeading icon={ClipboardList} title="Operational overview" id="overview-heading" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.summary.map((item) => {
            const content = (
              <>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-[#8A95A6] dark:text-slate-500">{item.label}</p>
                <p className="mt-3 text-xl font-extrabold text-[#101D38] dark:text-white">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{item.detail}</p>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 transition hover:border-[#B7C9E1] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-950/30"
              >
                {content}
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1754E8] dark:text-blue-300">
                  Open
                  <ArrowRight className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                </span>
              </Link>
            ) : (
              <article key={item.id} className="rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7" aria-labelledby="records-heading">
          <SectionHeading icon={CalendarClock} title={data.recordsTitle} id="records-heading" />
          <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">{data.recordsDescription}</p>

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

        <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5" aria-labelledby="actions-heading">
          <SectionHeading icon={CheckCircle2} title="Quick actions" id="actions-heading" />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {data.quickActions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="group flex min-h-16 items-center justify-between gap-4 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] px-4 py-3 text-sm font-extrabold text-[#101D38] transition hover:border-[#B7C9E1] hover:bg-[#EDF3FF] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-900 dark:text-white dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
              >
                <span>{action.label}</span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[#1754E8] transition-transform motion-safe:group-hover:translate-x-1 dark:text-blue-300" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-12">
        <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7" aria-labelledby="notices-heading">
          <SectionHeading icon={BellRing} title="Relevant notices" id="notices-heading" />
          {data.notices.length === 0 ? (
            <EmptyState message="No role-relevant institutional notices are available." />
          ) : (
            <ul className="mt-5 space-y-3">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-extrabold text-[#101D38] dark:text-white">{notice.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">{notice.content}</p>
                  <p className="mt-3 text-xs text-[#8A95A6] dark:text-slate-500">{formatDateTime(notice.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[24px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5" aria-labelledby="activity-heading">
          <SectionHeading icon={Clock3} title="Your recent activity" id="activity-heading" />
          <p className="mt-2 text-xs leading-5 text-[#8A95A6] dark:text-slate-500">
            Limited to audit events associated with your authenticated account.
          </p>
          {data.recentActivity.length === 0 ? (
            <EmptyState message="No recent activity is recorded for this account." />
          ) : (
            <ul className="mt-5 divide-y divide-[#E1E7EF] dark:divide-slate-800">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex items-start gap-3 py-3.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1754E8]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#101D38] dark:text-white">{item.action}</p>
                    <p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">{item.entity}</p>
                    <p className="mt-1 text-[11px] text-[#8A95A6] dark:text-slate-500">{formatDateTime(item.createdAt)}</p>
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
    neutral: 'border-[#D9E3F0] bg-white dark:border-slate-800 dark:bg-slate-950',
    positive: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20',
    warning: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
    danger: 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20',
  }[metric.tone ?? 'neutral'];

  return (
    <article className={`min-w-0 rounded-[22px] border p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] ${toneClass}`}>
      <p className="text-sm font-bold text-[#667085] dark:text-slate-400">{metric.label}</p>
      <p className="mt-4 truncate text-2xl font-extrabold tracking-[-0.03em] text-[#101D38] dark:text-white">{metric.value ?? '—'}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-[#8A95A6] dark:text-slate-500">{metric.detail}</p>
    </article>
  );
}

function RecordRow({ record }: { record: OperationalRecord }) {
  const content = (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-[#101D38] dark:text-white">{record.title}</p>
        <p className="mt-1 text-xs leading-5 text-[#667085] dark:text-slate-400">{record.detail}</p>
      </div>
      {record.status && (
        <span className="shrink-0 rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
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
          className="group flex min-h-20 items-center rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 transition hover:border-[#B7C9E1] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-950/30"
        >
          {content}
          <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-[#1754E8] transition-transform motion-safe:group-hover:translate-x-1 dark:text-blue-300" aria-hidden="true" />
        </Link>
      ) : (
        <div className="flex min-h-20 items-center rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">{content}</div>
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
              ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20'
              : alert.level === 'warning'
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
                : 'border-[#C9DAF8] bg-[#EDF3FF] dark:border-blue-900 dark:bg-blue-950/30'
          }`}
        >
          <AlertCircle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              alert.level === 'danger' ? 'text-rose-600' : alert.level === 'warning' ? 'text-amber-600' : 'text-[#1754E8] dark:text-blue-300'
            }`}
            aria-hidden="true"
          />
          <p className="flex-1 text-sm font-bold leading-6 text-[#101D38] dark:text-white">{alert.message}</p>
          {alert.href && (
            <Link href={alert.href} className="inline-flex min-h-10 items-center gap-1 text-xs font-extrabold text-[#1754E8] hover:underline dark:text-blue-300">
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
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/50 dark:text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 id={id} className="text-lg font-extrabold text-[#101D38] dark:text-white">{title}</h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[#C7D3E2] bg-[#F7F9FC] px-5 py-8 text-center dark:border-slate-700 dark:bg-slate-900">
      <p className="text-sm text-[#667085] dark:text-slate-400">{message}</p>
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
