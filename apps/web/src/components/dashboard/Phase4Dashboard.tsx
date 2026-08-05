'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import {
  AlertCircle,
  ArrowRight,
  BadgeIndianRupee,
  BarChart3,
  BellRing,
  BookOpenText,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LibraryBig,
  ReceiptIndianRupee,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from 'lucide-react';

import type {
  Phase4BreakdownItem,
  Phase4DashboardData,
  Phase4DashboardRole,
  Phase4Metric,
  Phase4QueueItem,
} from '@/lib/dashboard/phase4-contracts';

const roleIcons: Record<Phase4DashboardRole, ElementType> = {
  FINANCE_OFFICER: ReceiptIndianRupee,
  ACCOUNTANT: WalletCards,
  LIBRARIAN: LibraryBig,
};

export function Phase4Dashboard({ data }: { data: Phase4DashboardData }) {
  const RoleIcon = roleIcons[data.role];

  return (
    <section className="space-y-5 sm:space-y-6" aria-label={`${data.identity.title} dashboard`}>
      <header className="overflow-hidden rounded-[26px] border border-[#D8E2EF] bg-white shadow-[0_24px_70px_rgba(16,29,56,0.09)] dark:border-slate-800 dark:bg-slate-950 sm:rounded-[30px]">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300 sm:text-xs">
              <RoleIcon className="h-4 w-4" aria-hidden="true" />
              {data.heading.eyebrow}
            </div>

            <h1 className="mt-5 max-w-4xl text-3xl font-extrabold tracking-[-0.045em] text-[#101D38] dark:text-white sm:text-4xl lg:text-[44px] lg:leading-[1.08]">
              {data.heading.title}
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-[#5F6C7B] dark:text-slate-400 sm:text-base sm:leading-7">
              {data.heading.description}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Server-verified role
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D8E2EF] bg-[#F7F9FC] px-3 py-2 text-xs font-bold text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Live institutional data
              </span>
            </div>
          </div>

          <aside className="border-t border-[#2B456B] bg-[#101D38] p-5 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#9DB8E5] sm:text-xs">
              Active workspace
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">{data.identity.name}</h2>
            <p className="mt-2 break-all text-sm leading-6 text-[#C5D1E1]">{data.identity.email}</p>
            <div className="mt-6 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-4">
              <p className="text-sm font-bold text-white">{data.identity.title}</p>
              <p className="mt-2 text-xs leading-5 text-[#B8C6D9]">{data.heading.assurance}</p>
            </div>
          </aside>
        </div>
      </header>

      <MobileActionRail actions={data.quickActions} />
      <AlertPanel alerts={data.riskAlerts} />

      <section
        className="grid auto-cols-[minmax(245px,82vw)] grid-flow-col gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4"
        aria-label="Key operational metrics"
      >
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6" aria-labelledby="phase4-summary-heading">
        <SectionHeading id="phase4-summary-heading" icon={BadgeIndianRupee} title="Operational summary" />
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {data.summaries.map((item) => {
            const content = (
              <>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#8995A6] dark:text-slate-500">{item.label}</p>
                <p className="mt-3 text-xl font-extrabold tracking-[-0.02em] text-[#101D38] dark:text-white">{item.value}</p>
                <p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{item.detail}</p>
              </>
            );

            return item.href ? (
              <Link
                key={item.id}
                href={item.href}
                className="group rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-4 transition hover:border-[#B7C9E1] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-950/30"
              >
                {content}
                <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1754E8] dark:text-blue-300">
                  Open workflow
                  <ArrowRight className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ) : (
              <article key={item.id} className="rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                {content}
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-12 xl:gap-6">
        <BreakdownPanel data={data.breakdown} />
        <QueuePanel data={data.queue} />
      </div>

      <div className="grid gap-5 xl:grid-cols-12 xl:gap-6">
        <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7" aria-labelledby="phase4-notices-heading">
          <SectionHeading id="phase4-notices-heading" icon={BellRing} title="Relevant notices" />
          {data.notices.length === 0 ? (
            <EmptyState message="No role-relevant institutional notices are available." />
          ) : (
            <ul className="mt-5 space-y-3">
              {data.notices.map((notice) => (
                <li key={notice.id} className="rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="text-sm font-extrabold text-[#101D38] dark:text-white">{notice.title}</p>
                  <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">{notice.content}</p>
                  <p className="mt-3 text-xs text-[#8A95A6] dark:text-slate-500">{formatDateTime(notice.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5" aria-labelledby="phase4-activity-heading">
          <SectionHeading id="phase4-activity-heading" icon={Clock3} title="Your recent activity" />
          <p className="mt-2 text-xs leading-5 text-[#8995A6] dark:text-slate-500">
            Only audit events linked to your authenticated account are shown.
          </p>
          {data.recentActivity.length === 0 ? (
            <EmptyState message="No recent activity is recorded for this account." />
          ) : (
            <ul className="mt-5 divide-y divide-[#E0E7F0] dark:divide-slate-800">
              {data.recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start gap-3 py-3.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1754E8]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#101D38] dark:text-white">{activity.action}</p>
                    <p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">{activity.entity}</p>
                    <p className="mt-1 text-[11px] text-[#8A95A6] dark:text-slate-500">{formatDateTime(activity.createdAt)}</p>
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

function MobileActionRail({ actions }: { actions: Phase4DashboardData['quickActions'] }) {
  if (actions.length === 0) return null;

  return (
    <nav className="-mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden" aria-label="Dashboard quick actions">
      <div className="flex min-w-max gap-2">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C9D8EE] bg-white px-4 text-sm font-extrabold text-[#101D38] shadow-sm transition hover:border-[#1754E8] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            {action.label}
            <ChevronRight className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </nav>
  );
}

function MetricCard({ metric }: { metric: Phase4Metric }) {
  const toneClass = {
    neutral: 'border-[#D8E2EF] bg-white dark:border-slate-800 dark:bg-slate-950',
    positive: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20',
    warning: 'border-amber-200 bg-amber-50/80 dark:border-amber-900 dark:bg-amber-950/20',
    danger: 'border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/20',
  }[metric.tone];

  return (
    <article className={`min-w-0 rounded-[22px] border p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] ${toneClass}`}>
      <p className="text-sm font-bold text-[#667085] dark:text-slate-400">{metric.label}</p>
      <p className="mt-4 truncate text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] dark:text-white sm:text-[28px]">{metric.value}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-[#8995A6] dark:text-slate-500">{metric.detail}</p>
    </article>
  );
}

function BreakdownPanel({ data }: { data: Phase4DashboardData['breakdown'] }) {
  return (
    <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5" aria-labelledby="phase4-breakdown-heading">
      <SectionHeading id="phase4-breakdown-heading" icon={BarChart3} title={data.title} />
      <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">{data.description}</p>

      {data.items.length === 0 ? (
        <EmptyState message={data.emptyMessage} />
      ) : (
        <div className="mt-6 space-y-5">
          {data.items.map((item) => (
            <BreakdownRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function BreakdownRow({ item }: { item: Phase4BreakdownItem }) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">{item.label}</p>
          {item.detail && <p className="mt-1 truncate text-xs text-[#8995A6] dark:text-slate-500">{item.detail}</p>}
        </div>
        <span className="shrink-0 text-xs font-extrabold text-[#1754E8] dark:text-blue-300">{item.formattedValue}</span>
      </div>
      <div
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-[#E9EEF5] dark:bg-slate-800"
        role="progressbar"
        aria-label={`${item.label}: ${item.formattedValue}`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={item.percentage}
      >
        <div className="h-full rounded-full bg-[#1754E8]" style={{ width: `${item.percentage}%` }} />
      </div>
    </div>
  );
}

function QueuePanel({ data }: { data: Phase4DashboardData['queue'] }) {
  return (
    <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7" aria-labelledby="phase4-queue-heading">
      <SectionHeading id="phase4-queue-heading" icon={BookOpenText} title={data.title} />
      <p className="mt-2 text-sm leading-6 text-[#667085] dark:text-slate-400">{data.description}</p>

      {data.items.length === 0 ? (
        <EmptyState message={data.emptyMessage} />
      ) : (
        <ul className="mt-5 space-y-3">
          {data.items.map((item) => (
            <QueueRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function QueueRow({ item }: { item: Phase4QueueItem }) {
  return (
    <li>
      <Link
        href={item.href}
        className="group flex min-h-20 flex-col gap-3 rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-4 transition hover:border-[#B7C9E1] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-950/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-extrabold text-[#101D38] dark:text-white">{item.title}</p>
            <StatusPill status={item.status} />
          </div>
          <p className="mt-1 text-xs font-bold text-[#1754E8] dark:text-blue-300">{item.reference}</p>
          <p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{item.detail}</p>
        </div>
        <ArrowRight className="h-4 w-4 shrink-0 self-end text-[#1754E8] transition-transform motion-safe:group-hover:translate-x-1 sm:self-auto" aria-hidden="true" />
      </Link>
    </li>
  );
}

function StatusPill({ status }: { status: string }) {
  const normalized = status.toUpperCase();
  const className = normalized === 'FAILED' || normalized === 'OVERDUE'
    ? 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300'
    : normalized === 'PENDING' || normalized === 'PARTIAL'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
      : 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300';

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] ${className}`}>
      {formatStatus(status)}
    </span>
  );
}

function AlertPanel({ alerts }: { alerts: Phase4DashboardData['riskAlerts'] }) {
  if (alerts.length === 0) return null;

  return (
    <section className="grid gap-3 lg:grid-cols-2" aria-label="Operational alerts">
      {alerts.map((alert) => {
        const className = alert.level === 'danger'
          ? 'border-rose-200 bg-rose-50/80 text-rose-900 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200'
          : alert.level === 'warning'
            ? 'border-amber-200 bg-amber-50/80 text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200'
            : 'border-blue-200 bg-blue-50/80 text-blue-900 dark:border-blue-900 dark:bg-blue-950/20 dark:text-blue-200';

        return (
          <Link
            key={alert.id}
            href={alert.href ?? '/dashboard'}
            className={`group flex min-h-16 items-start gap-3 rounded-2xl border p-4 transition hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 ${className}`}
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-sm font-bold leading-6">{alert.message}</span>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        );
      })}
    </section>
  );
}

function SectionHeading({ id, icon: Icon, title }: { id: string; icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 id={id} className="text-lg font-extrabold tracking-[-0.02em] text-[#101D38] dark:text-white sm:text-xl">{title}</h2>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[#C9D6E6] bg-[#F8FAFD] p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <CheckCircle2 className="mx-auto h-6 w-6 text-[#718096] dark:text-slate-500" aria-hidden="true" />
      <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">{message}</p>
    </div>
  );
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatStatus(value: string): string {
  return value
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
