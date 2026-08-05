'use client';

import type { CSSProperties, ElementType } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  BedDouble,
  BookOpenCheck,
  BriefcaseBusiness,
  Building2,
  BusFront,
  Calculator,
  CalendarClock,
  CheckCircle2,
  FileStack,
  GraduationCap,
  LibraryBig,
  Network,
  Orbit,
  Presentation,
  ShieldCheck,
  Sparkles,
  UserPlus,
  UsersRound,
  WalletCards,
} from 'lucide-react';

import type {
  Phase6ExperienceData,
  Phase6Layout,
  Phase6Metric,
  Phase6Signal,
} from '@/lib/dashboard/phase6-contracts';

const iconMap: Record<Phase6ExperienceData['blueprint']['icon'], ElementType> = {
  orbit: Orbit,
  building: Building2,
  files: FileStack,
  graduation: GraduationCap,
  network: Network,
  presentation: Presentation,
  student: BookOpenCheck,
  family: UsersRound,
  wallet: WalletCards,
  calculator: Calculator,
  users: UsersRound,
  bed: BedDouble,
  library: LibraryBig,
  bus: BusFront,
  briefcase: BriefcaseBusiness,
  'user-plus': UserPlus,
  calendar: CalendarClock,
};

export function Phase6DashboardExperience({ data }: { data: Phase6ExperienceData | null }) {
  const pathname = usePathname();

  if (!data || !pathname.startsWith('/dashboard')) return null;

  const Icon = iconMap[data.blueprint.icon];
  const style = {
    '--phase6-accent': data.blueprint.accent,
    '--phase6-soft': data.blueprint.softAccent,
  } as CSSProperties;

  return (
    <section
      style={style}
      className="mb-5 overflow-hidden rounded-[24px] border bg-white shadow-[0_18px_55px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-950 sm:mb-6 sm:rounded-[28px]"
      aria-label={`${data.blueprint.eyebrow} Phase 6 command layer`}
    >
      <div className="grid xl:grid-cols-[minmax(0,1.42fr)_minmax(310px,0.58fr)]">
        <div className="p-4 sm:p-6 lg:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-[10px] font-extrabold uppercase tracking-[0.13em] dark:bg-slate-900"
                  style={{ borderColor: data.blueprint.accent, color: data.blueprint.accent, backgroundColor: data.blueprint.softAccent }}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  Dashboard UI Phase 6
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                  {data.blueprint.signature}
                </span>
              </div>

              <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                {data.blueprint.eyebrow}
              </p>
              <h2 className="mt-2 max-w-4xl text-2xl font-extrabold tracking-[-0.04em] text-slate-950 dark:text-white sm:text-3xl lg:text-[34px] lg:leading-[1.1]">
                {data.blueprint.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-400">
                {data.blueprint.mission}
              </p>
            </div>

            <Link
              href={data.blueprint.primaryAction.href}
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold text-white shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950"
              style={{ backgroundColor: data.blueprint.accent }}
            >
              {data.blueprint.primaryAction.label}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-5 grid auto-cols-[minmax(225px,78vw)] grid-flow-col gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid-flow-row sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
            {data.metrics.map((metric) => (
              <MetricCard key={metric.id} metric={metric} />
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.62fr)]">
            <SignalPanel signals={data.signals} accent={data.blueprint.accent} />
            <QueuePanel data={data} />
          </div>
        </div>

        <aside className="border-t border-slate-200 bg-slate-950 p-5 text-white dark:border-slate-800 sm:p-6 xl:border-l xl:border-t-0 xl:p-7">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-400">Unique role canvas</p>
              <p className="mt-2 text-lg font-extrabold">{formatLayout(data.blueprint.layout)}</p>
            </div>
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl"
              style={{ backgroundColor: data.blueprint.accent }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
          </div>

          <RoleVisual layout={data.blueprint.layout} accent={data.blueprint.accent} signals={data.signals} />

          <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" style={{ color: data.blueprint.accent }} aria-hidden="true" />
              <div>
                <p className="text-sm font-extrabold">Server-authorised scope</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">{data.blueprint.assurance}</p>
              </div>
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
            <ContextCell label="Unread" value={data.context.unreadNotifications} />
            <ContextCell label="My cases" value={data.context.openSupportCases} />
            <ContextCell label="Notices" value={data.context.relevantNotices} />
            <ContextCell label="Activity" value={data.context.recentActivity} />
          </dl>

          <div className="mt-5 flex items-start gap-3 border-t border-slate-800 pt-4">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0" style={{ color: data.blueprint.accent }} aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-xs font-bold text-white">{data.identity.name}</p>
              <p className="mt-1 truncate text-[11px] text-slate-500">{data.identity.institution}</p>
              <p className="mt-1 text-[10px] text-slate-600">Refreshed {formatTime(data.context.refreshedAt)}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function MetricCard({ metric }: { metric: Phase6Metric }) {
  const toneClass = {
    neutral: 'border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900',
    positive: 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20',
    warning: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
    danger: 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20',
  }[metric.tone];

  return (
    <article className={`rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{metric.label}</p>
      <p className="mt-3 truncate text-xl font-extrabold tracking-[-0.025em] text-slate-950 dark:text-white sm:text-2xl">{metric.value}</p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-slate-500 dark:text-slate-500">{metric.detail}</p>
    </article>
  );
}

function SignalPanel({ signals, accent }: { signals: Phase6Signal[]; accent: string }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900" aria-labelledby="phase6-signals-heading">
      <div className="flex items-center justify-between gap-3">
        <h3 id="phase6-signals-heading" className="text-sm font-extrabold text-slate-950 dark:text-white">Role intelligence</h3>
        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">Live evidence</span>
      </div>

      {signals.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-500 dark:border-slate-700">No role intelligence is currently available.</p>
      ) : (
        <div className="mt-4 space-y-3.5">
          {signals.slice(0, 4).map((signal) => {
            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-extrabold text-slate-900 dark:text-white">{signal.label}</p>
                    <p className="mt-1 truncate text-[11px] text-slate-500">{signal.detail}</p>
                  </div>
                  <span className="shrink-0 text-xs font-extrabold" style={{ color: accent }}>{signal.value}</span>
                </div>
                <div
                  className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
                  role="progressbar"
                  aria-label={`${signal.label}: ${signal.value}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={signal.percentage}
                >
                  <div className="h-full rounded-full" style={{ width: `${signal.percentage}%`, backgroundColor: accent }} />
                </div>
              </>
            );

            return signal.href ? (
              <Link key={signal.id} href={signal.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2" style={{ '--tw-ring-color': accent } as CSSProperties}>
                {content}
              </Link>
            ) : (
              <div key={signal.id}>{content}</div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function QueuePanel({ data }: { data: Phase6ExperienceData }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950" aria-labelledby="phase6-queue-heading">
      <h3 id="phase6-queue-heading" className="text-sm font-extrabold text-slate-950 dark:text-white">{data.queue.title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-slate-500">{data.queue.description}</p>

      {data.queue.items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-center dark:border-slate-700">
          <CheckCircle2 className="mx-auto h-5 w-5 text-slate-400" aria-hidden="true" />
          <p className="mt-2 text-xs text-slate-500">{data.queue.emptyMessage}</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {data.queue.items.slice(0, 4).map((item) => (
            <li key={item.id}>
              <Link href={item.href} className="group flex min-h-12 items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-slate-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: data.blueprint.accent }} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-extrabold text-slate-900 dark:text-white">{item.title}</span>
                  <span className="mt-0.5 block truncate text-[10px] text-slate-500">{item.detail}</span>
                </span>
                {item.status && <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.06em] text-slate-500 dark:border-slate-700 dark:bg-slate-950">{formatStatus(item.status)}</span>}
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function RoleVisual({ layout, accent, signals }: { layout: Phase6Layout; accent: string; signals: Phase6Signal[] }) {
  const values = signals.slice(0, 5).map((signal) => Math.max(12, signal.percentage));
  while (values.length < 5) values.push(20 + values.length * 12);

  if (layout === 'constellation') {
    return (
      <div className="relative mt-6 h-44 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900" aria-hidden="true">
        <span className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2" style={{ borderColor: accent }} />
        {values.map((value, index) => (
          <span key={index} className="absolute rounded-full" style={{ width: 8 + index * 2, height: 8 + index * 2, backgroundColor: accent, left: `${12 + index * 18}%`, top: `${18 + ((index * 27) % 58)}%`, opacity: 0.55 + value / 250 }} />
        ))}
      </div>
    );
  }

  if (layout === 'control-grid' || layout === 'matrix' || layout === 'people') {
    return (
      <div className="mt-6 grid grid-cols-4 gap-2 rounded-2xl border border-slate-800 bg-slate-900 p-4" aria-hidden="true">
        {Array.from({ length: 16 }, (_, index) => (
          <span key={index} className="aspect-square rounded-lg border border-slate-800" style={{ backgroundColor: index % 3 === 0 ? accent : '#162033', opacity: index % 3 === 0 ? 0.8 : 1 }} />
        ))}
      </div>
    );
  }

  if (layout === 'ledger' || layout === 'treasury' || layout === 'reconciliation') {
    return (
      <div className="mt-6 space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4" aria-hidden="true">
        {values.map((value, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="h-7 w-7 rounded-lg border border-slate-700 bg-slate-950" />
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-800"><span className="block h-full rounded-full" style={{ width: `${value}%`, backgroundColor: accent }} /></span>
            <span className="h-2 w-8 rounded-full bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'portfolio' || layout === 'catalogue') {
    return (
      <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl border border-slate-800 bg-slate-900 p-4" aria-hidden="true">
        {values.slice(0, 3).map((value, index) => (
          <span key={index} className="flex aspect-[0.78] flex-col justify-end rounded-xl border border-slate-700 bg-slate-950 p-2">
            <span className="block h-1.5 rounded-full" style={{ width: `${Math.max(35, value)}%`, backgroundColor: accent }} />
            <span className="mt-2 block h-1 rounded-full bg-slate-800" />
          </span>
        ))}
      </div>
    );
  }

  if (layout === 'timeline' || layout === 'journey' || layout === 'calendar') {
    return (
      <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4" aria-hidden="true">
        <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-slate-700">
          {values.slice(0, 4).map((value, index) => (
            <div key={index} className="relative flex items-center gap-3">
              <span className="relative z-10 h-3.5 w-3.5 rounded-full border-2 border-slate-900" style={{ backgroundColor: accent }} />
              <span className="h-10 flex-1 rounded-xl border border-slate-800 bg-slate-950 p-2"><span className="block h-1.5 rounded-full" style={{ width: `${value}%`, backgroundColor: accent }} /><span className="mt-2 block h-1 w-2/3 rounded-full bg-slate-800" /></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-4" aria-hidden="true">
      <div className="flex items-center justify-between gap-1">
        {values.map((value, index) => (
          <div key={index} className="flex flex-1 flex-col items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: accent, opacity: 0.45 + index * 0.1 }} />
            <span className="h-16 w-px bg-slate-700" />
            <span className="h-2 w-full rounded-full bg-slate-800"><span className="block h-full rounded-full" style={{ width: `${value}%`, backgroundColor: accent }} /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContextCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">
      <dt className="text-[9px] font-bold uppercase tracking-[0.1em] text-slate-500">{label}</dt>
      <dd className="mt-1 text-lg font-extrabold text-white">{value}</dd>
    </div>
  );
}

function formatLayout(layout: Phase6Layout): string {
  return layout.replace(/-/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
