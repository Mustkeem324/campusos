'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  Database,
  ExternalLink,
  FileText,
  Gauge,
  LayoutDashboard,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';

import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';
import type {
  EnterpriseHomeActivity,
  EnterpriseHomeData,
  EnterpriseHomeMetric,
  EnterpriseHomeWorkItem,
} from '@/lib/homepage/workspace';

type RangeKey = '7d' | '30d' | 'all';
type HealthState = 'loading' | 'ready' | 'error';
type ComponentStatus = 'operational' | 'degraded' | 'unavailable';

type HealthSnapshot = {
  status: 'operational' | 'degraded';
  timestamp: string;
  environment: string;
  region: string | null;
  version: string;
  checks: {
    application: { status: 'operational' | 'unavailable'; latencyMs: number | null };
    database: { status: 'operational' | 'unavailable'; latencyMs: number | null };
  };
};

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  href?: string;
  group: 'Actions' | 'Work' | 'Notices' | 'Overview';
};

const toneStyles: Record<NonNullable<EnterpriseHomeMetric['tone']>, { accent: string; icon: string }> = {
  neutral: { accent: 'bg-[#1754E8]', icon: 'bg-[#EEF3FB] text-[#1754E8]' },
  positive: { accent: 'bg-[#087A55]', icon: 'bg-[#EAF7F1] text-[#087A55]' },
  warning: { accent: 'bg-[#D88915]', icon: 'bg-[#FFF6E7] text-[#A86008]' },
  danger: { accent: 'bg-[#D92D20]', icon: 'bg-[#FFF0F0] text-[#B42318]' },
};

function locale() {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-IN';
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale(), options ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function relativeTime(value: string) {
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return 'Recently';
  const minutes = Math.max(0, Math.round((Date.now() - time) / 60_000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function statusLabel(value?: string) {
  return value ? value.replaceAll('_', ' ') : 'Current';
}

function activityBuckets(activity: EnterpriseHomeActivity[], range: RangeKey) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let days = range === '7d' ? 7 : 30;
  if (range === 'all') {
    const validTimes = activity.map((item) => new Date(item.createdAt).getTime()).filter(Number.isFinite);
    if (validTimes.length) {
      const oldest = Math.min(...validTimes);
      days = Math.max(1, Math.ceil((now.getTime() - oldest) / 86_400_000) + 1);
    } else {
      days = 1;
    }
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (days - 1 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const count = activity.filter((item) => {
      const time = new Date(item.createdAt).getTime();
      return Number.isFinite(time) && time >= date.getTime() && time < next.getTime();
    }).length;
    return { date, count };
  });
}

function workTone(item: EnterpriseHomeWorkItem) {
  const status = `${item.status ?? ''} ${item.priority ?? ''}`.toLowerCase();
  if (/critical|urgent|overdue|late|failed|risk/.test(status)) return 'border-[#F0B9B5] bg-[#FFF7F6] text-[#B42318]';
  if (/pending|warning|grade|review/.test(status)) return 'border-[#EFD7A5] bg-[#FFFBF2] text-[#9A5A08]';
  if (/complete|approved|submitted|current|available|operational/.test(status)) return 'border-[#BFE3D4] bg-[#F1FBF7] text-[#087A55]';
  return 'border-[#D9E2EE] bg-[#F7F9FC] text-[#5C6878]';
}

export function EnterpriseWorkspaceHomePremium({ data }: { data: EnterpriseHomeData }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [range, setRange] = React.useState<RangeKey>('7d');
  const [query, setQuery] = React.useState('');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [health, setHealth] = React.useState<HealthSnapshot | null>(null);
  const [healthState, setHealthState] = React.useState<HealthState>('loading');
  const healthAbortRef = React.useRef<AbortController | null>(null);
  const searchDialogRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useDialogFocusTrap({ active: searchOpen, containerRef: searchDialogRef, initialFocusRef: searchInputRef });

  React.useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem('campusos-home-recent-searches') ?? '[]');
      if (Array.isArray(saved)) setRecentSearches(saved.filter((item): item is string => typeof item === 'string').slice(0, 5));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  React.useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, []);

  const loadHealth = React.useCallback(async () => {
    healthAbortRef.current?.abort();
    const controller = new AbortController();
    healthAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 8_000);
    setHealthState('loading');

    try {
      const response = await fetch('/api/health', { cache: 'no-store', signal: controller.signal });
      if (!response.ok) throw new Error(`Health check failed with status ${response.status}`);
      const payload = await response.json();
      if (!payload || typeof payload !== 'object' || !('checks' in payload)) throw new Error('Invalid health response');
      setHealth(payload as HealthSnapshot);
      setHealthState('ready');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      console.error('Unable to load homepage system health', error);
      setHealthState('error');
    } finally {
      window.clearTimeout(timeout);
      if (healthAbortRef.current === controller) healthAbortRef.current = null;
    }
  }, []);

  React.useEffect(() => {
    void loadHealth();
    return () => healthAbortRef.current?.abort();
  }, [loadHealth]);

  const searchItems = React.useMemo<SearchResult[]>(() => [
    ...data.actions.map((item, index) => ({ id: `action-${index}`, label: item.label, detail: 'Quick action', href: item.href, group: 'Actions' as const })),
    ...data.work.items.map((item) => ({ id: `work-${item.id}`, label: item.title, detail: item.detail, href: item.href, group: 'Work' as const })),
    ...data.notices.map((item) => ({ id: `notice-${item.id}`, label: item.title, detail: item.content, group: 'Notices' as const })),
    ...data.summaries.map((item) => ({ id: `summary-${item.id}`, label: item.label, detail: `${item.value} · ${item.detail}`, href: item.href, group: 'Overview' as const })),
  ], [data]);

  const results = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems.slice(0, 12);
    return searchItems.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(normalized)).slice(0, 18);
  }, [query, searchItems]);

  const groupedResults = (['Actions', 'Work', 'Notices', 'Overview'] as const)
    .map((group) => ({ group, items: results.filter((item) => item.group === group) }))
    .filter((group) => group.items.length > 0);

  const buckets = React.useMemo(() => activityBuckets(data.activity, range), [data.activity, range]);
  const maxBucket = Math.max(1, ...buckets.map((item) => item.count));
  const latest = data.activity[0];
  const insights = [
    data.alerts.length ? `${data.alerts.length} exception${data.alerts.length === 1 ? '' : 's'} currently require attention.` : 'No exception alerts are currently reported by your authorised homepage data.',
    data.work.items.length ? `${data.work.items.length} item${data.work.items.length === 1 ? '' : 's'} are present in your current work queue.` : 'Your current work queue has no reported items.',
    latest ? `Latest recorded activity: ${latest.action} · ${latest.entity}.` : 'No recent activity events are available in your current scope.',
    data.upcoming.length ? `${data.upcoming.length} scheduled or upcoming item${data.upcoming.length === 1 ? '' : 's'} are visible.` : 'No upcoming schedule items are currently exposed for this role.',
  ];

  const rememberSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    try { window.localStorage.setItem('campusos-home-recent-searches', JSON.stringify(next)); } catch { /* optional */ }
  };

  const refresh = () => {
    startTransition(() => router.refresh());
    void loadHealth();
  };

  return (
    <div className="bg-[#F2F5F8] text-[#172033]">
      <section className="border-b border-[#DCE4ED] bg-white px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1580px]">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">
                <span>{data.heading.eyebrow}</span><span className="h-1 w-1 rounded-full bg-[#98A2B3]" /><span>{data.dataScopeLabel}</span><span className="inline-flex items-center gap-1.5 rounded-md border border-[#C7E2D7] bg-[#F4FBF8] px-2 py-1 text-[#087A55]"><span className="h-1.5 w-1.5 rounded-full bg-[#087A55]" />Live workspace</span>
              </div>
              <h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.04em] text-[#101828] sm:text-[37px]">{greeting()}, {data.identity.name}</h1>
              <p className="mt-2 max-w-[820px] text-sm leading-6 text-[#667085] sm:text-[15px]">{data.heading.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] font-semibold text-[#7A8698]"><span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(data.generatedAt, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span><span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#087A55]" aria-hidden="true" />{data.identity.title}</span><span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Updated {relativeTime(data.generatedAt)}</span></div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[minmax(240px,330px)_auto_auto]">
              <button type="button" onClick={() => setSearchOpen(true)} className="group flex min-h-11 items-center justify-between gap-4 rounded-[9px] border border-[#C7D3E1] bg-white px-3.5 text-left shadow-[0_2px_8px_rgba(16,24,40,0.035)] transition hover:border-[#97AAC3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]" aria-label="Open command search"><span className="flex min-w-0 items-center gap-2.5"><Search className="h-4 w-4 shrink-0 text-[#667085]" aria-hidden="true" /><span className="truncate text-sm font-semibold text-[#667085]">Search workspace…</span></span><kbd className="hidden rounded-md border border-[#D7DFE9] bg-[#F7F9FC] px-2 py-1 text-[10px] font-bold text-[#667085] sm:block">⌘ K</kbd></button>
              <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)} className="min-h-11 rounded-[9px] border border-[#C7D3E1] bg-white px-3 text-xs font-extrabold text-[#344054] outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#D9E5FF]" aria-label="Activity date range"><option value="7d">7 days</option><option value="30d">30 days</option><option value="all">All available</option></select>
              <button type="button" onClick={refresh} disabled={isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#101D38] bg-[#101D38] px-4 text-xs font-extrabold text-white transition hover:bg-[#17284A] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] motion-reduce:transition-none"><RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />{isPending ? 'Refreshing' : 'Refresh'}</button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1580px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section aria-labelledby="today-summary-heading" className="overflow-hidden rounded-[11px] border border-[#C7D4E4] bg-[#101D38] text-white shadow-[0_8px_20px_rgba(16,29,56,0.08)]">
          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(112px,0.52fr))_auto]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r"><p id="today-summary-heading" className="text-[9px] font-extrabold uppercase tracking-[0.14em] text-[#AFC4E6]">Today · executive summary</p><p className="mt-2 text-base font-extrabold tracking-[-0.02em] sm:text-lg">{data.alerts.length ? 'Your workspace has items requiring attention.' : 'No exception alerts are currently reported.'}</p><p className="mt-1 max-w-[620px] text-[11px] leading-5 text-[#C5D1E3]">{data.heading.assurance ?? 'Data is restricted to your active role and institution context.'}</p></div>
            <SummaryStat label="Attention" value={data.alerts.length} />
            <SummaryStat label="Work queue" value={data.work.items.length} />
            <SummaryStat label="Notices" value={data.notices.length} />
            <SummaryStat label="Actions" value={data.actions.length} />
            <div className="flex items-center p-4 lg:border-l lg:border-white/10"><a href="#attention-center" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-white px-4 text-[11px] font-extrabold text-[#101D38] transition hover:bg-[#EEF3FB] lg:w-auto">Review priorities <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a></div>
          </div>
        </section>

        <section aria-labelledby="executive-metrics-heading">
          <SectionHeading id="executive-metrics-heading" eyebrow="Executive metrics" title="Current operating indicators" description="Only metrics exposed by the existing role-scoped data loaders are shown here." />
          {data.metrics.length ? <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.metrics.slice(0, 8).map((metric, index) => <MetricCard key={metric.id} metric={metric} featured={index === 0} />)}</div> : <EmptyState title="No KPI metrics available" description="This role does not currently expose aggregate metrics to the homepage." />}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(330px,0.75fr)]">
          <section className="overflow-hidden rounded-[11px] border border-[#D7E0EA] bg-white shadow-[0_3px_12px_rgba(16,24,40,0.035)]" aria-labelledby="activity-chart-heading">
            <PanelHeader eyebrow="Activity analytics" title="Workspace activity" id="activity-chart-heading" right={<span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-[#667085]"><span className="h-2 w-2 rounded-full bg-[#1754E8]" />Recorded events</span>} />
            <div className="p-5">
              {data.activity.length ? <><div className="overflow-x-auto pb-1"><div className="flex h-[220px] min-w-[620px] items-end gap-1.5 border-b border-l border-[#DDE4EC] px-2 pt-5" role="img" aria-label={`Activity event volume for ${range === '7d' ? 'the last seven days' : range === '30d' ? 'the last thirty days' : 'all available activity history'}`}>{buckets.map((bucket, index) => { const showLabel = buckets.length <= 10 || index % Math.max(1, Math.ceil(buckets.length / 7)) === 0 || index === buckets.length - 1; return <div key={bucket.date.toISOString()} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="text-[9px] font-extrabold tabular-nums text-[#667085] opacity-0 transition group-hover:opacity-100">{bucket.count}</span><div className="w-full max-w-[30px] rounded-t-[4px] bg-[#1754E8] transition-[height,background-color] duration-150 group-hover:bg-[#103FC2] motion-reduce:transition-none" style={{ height: `${Math.max(4, (bucket.count / maxBucket) * 142)}px` }} title={`${bucket.count} event${bucket.count === 1 ? '' : 's'} on ${formatDate(bucket.date.toISOString())}`} /><span className="h-3 text-[8px] font-bold text-[#8792A2]">{showLabel ? new Intl.DateTimeFormat(locale(), { day: '2-digit', month: 'short' }).format(bucket.date) : ''}</span></div>; })}</div></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[11px] text-[#667085]"><span>Visible events <strong className="tabular-nums text-[#101828]">{data.activity.length}</strong></span><Link href="/notifications" className="inline-flex items-center gap-1 font-extrabold text-[#1754E8]">View updates <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div></> : <EmptyState title="No recent activity" description="No activity events are currently available in your authorised scope." />}
            </div>
          </section>

          <section id="attention-center" className="overflow-hidden rounded-[11px] border border-[#D7E0EA] bg-white shadow-[0_3px_12px_rgba(16,24,40,0.035)]" aria-labelledby="attention-heading">
            <PanelHeader eyebrow="Exception management" title="Needs your attention" id="attention-heading" />
            <div className="space-y-2 p-4">{data.alerts.length ? data.alerts.slice(0, 6).map((alert) => <AlertItem key={alert.id} alert={alert} />) : <div className="py-7 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-[#087A55]" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-[#101828]">No reported exceptions</p><p className="mx-auto mt-1 max-w-[260px] text-xs leading-5 text-[#667085]">Your current role-scoped data is not reporting an attention alert.</p></div>}</div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <section className="overflow-hidden rounded-[11px] border border-[#D7E0EA] bg-white shadow-[0_3px_12px_rgba(16,24,40,0.035)]" aria-labelledby="work-heading">
            <PanelHeader eyebrow="Priority work" title={data.work.title} id="work-heading" description={data.work.description} right={<Link href="/dashboard" className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1754E8]">Open workspace <ArrowRight className="h-3.5 w-3.5" /></Link>} />
            {data.work.items.length ? <div className="divide-y divide-[#E8EDF3]">{data.work.items.slice(0, 8).map((item) => <WorkRow key={item.id} item={item} />)}</div> : <div className="p-5"><EmptyState title="No current work items" description="There are no queue items exposed by the active role data source." /></div>}
          </section>

          <section className="rounded-[11px] border border-[#CBD7E7] bg-[#F8FAFD] p-4 shadow-[0_3px_12px_rgba(16,24,40,0.03)]" aria-labelledby="quick-actions-heading"><div className="flex items-center justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Commands</p><h2 id="quick-actions-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">Quick actions</h2></div><span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#CDD9EA] bg-white text-[#1754E8]"><Zap className="h-4 w-4" aria-hidden="true" /></span></div><div className="mt-4 grid gap-2">{data.actions.length ? data.actions.slice(0, 7).map((action, index) => <Link key={`${action.href}-${action.label}`} href={action.href} className={`group flex min-h-11 items-center justify-between rounded-[8px] border px-3.5 text-xs font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] ${index === 0 ? 'border-[#101D38] bg-[#101D38] text-white hover:bg-[#17284A]' : 'border-[#D5DEE9] bg-white text-[#344054] hover:border-[#AEBFD5] hover:text-[#1754E8]'}`}><span className="min-w-0 truncate">{action.label}</span><ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>) : <EmptyState title="No quick actions" description="No permission-aware actions are configured for this role." />}</div></section>
        </div>

        <section aria-labelledby="workspace-overview-heading">
          <SectionHeading id="workspace-overview-heading" eyebrow="Operational context" title="Workspace overview" description="Compact summaries from the same real records used by the role dashboard." />
          {data.summaries.length ? <div className="mt-4 grid gap-px overflow-hidden rounded-[11px] border border-[#D7E0EA] bg-[#D7E0EA] sm:grid-cols-2 xl:grid-cols-4">{data.summaries.slice(0, 8).map((item) => <article key={item.id} className="bg-white p-4 transition hover:bg-[#FBFCFE]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[9px] font-extrabold uppercase tracking-[0.09em] text-[#7A8698]">{item.label}</p><p className="mt-2 truncate text-xl font-extrabold tabular-nums tracking-[-0.03em] text-[#101828]">{item.value}</p></div>{item.href && <Link href={item.href} aria-label={`Open ${item.label}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] border border-[#DDE4ED] text-[#667085] transition hover:border-[#AFC0D6] hover:text-[#1754E8]"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link>}</div><p className="mt-2 text-[11px] leading-5 text-[#667085]">{item.detail}</p>{typeof item.progress === 'number' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF1F5]" role="progressbar" aria-label={`${item.label} ${Math.round(item.progress)}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress)}><div className="h-full rounded-full bg-[#1754E8]" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} /></div>}</article>)}</div> : <div className="mt-4"><EmptyState title="No overview records" description="The current role has no additional summary values to show here." /></div>}
        </section>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <CompactPanel id="upcoming-heading" icon={CalendarDays} eyebrow="Schedule" title="Upcoming & deadlines">{data.upcoming.length ? data.upcoming.slice(0, 7).map((item) => <TimelineRow key={item.id} item={item} />) : <EmptyState title="No upcoming items" description="No scheduled items are currently exposed by this role." />}</CompactPanel>
          <CompactPanel id="activity-heading" icon={Activity} eyebrow="Audit trail" title="Recent activity">{data.activity.length ? data.activity.slice(0, 7).map((item) => <div key={item.id} className="flex gap-3 rounded-[8px] px-2 py-2.5 transition hover:bg-[#F7F9FC]"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1754E8]" /><div className="min-w-0"><p className="text-xs font-extrabold leading-5 text-[#344054]">{item.action}</p><p className="truncate text-[11px] text-[#667085]">{item.entity}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.05em] text-[#98A2B3]">{relativeTime(item.createdAt)}</p></div></div>) : <EmptyState title="No recent activity" description="No activity events are available for this role." />}</CompactPanel>
          <CompactPanel id="notice-heading" icon={Bell} eyebrow="Institution updates" title="Notices" className="lg:col-span-2 xl:col-span-1">{data.notices.length ? data.notices.slice(0, 5).map((notice) => <article key={notice.id} className="rounded-[8px] border border-[#E2E8F0] bg-[#FAFBFD] p-3"><div className="flex items-start gap-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#1754E8]" aria-hidden="true" /><div className="min-w-0"><h3 className="text-xs font-extrabold text-[#344054]">{notice.title}</h3><p className="mt-1 line-clamp-2 text-[11px] leading-5 text-[#667085]">{notice.content}</p><p className="mt-2 text-[9px] font-bold text-[#98A2B3]">{relativeTime(notice.createdAt)}</p></div></div></article>) : <EmptyState title="No notices" description="There are no notices available in your authorised scope." />}</CompactPanel>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(350px,0.75fr)]">
          <section className="rounded-[11px] border border-[#C8D5E5] bg-[#101D38] p-5 text-white" aria-labelledby="insights-heading"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#1754E8]"><Sparkles className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#AFC4E6]">Calculated from current data</p><h2 id="insights-heading" className="mt-1 text-lg font-extrabold">Performance insights</h2></div></div><div className="mt-4 grid gap-px overflow-hidden rounded-[9px] border border-white/10 bg-white/10 sm:grid-cols-2">{insights.map((item, index) => <div key={`${index}-${item}`} className="bg-[#101D38] p-4"><div className="flex items-start gap-3"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#8FB4FF]" aria-hidden="true" /><p className="text-xs font-semibold leading-5 text-[#E3EAF5]">{item}</p></div></div>)}</div></section>
          <section className="overflow-hidden rounded-[11px] border border-[#D7E0EA] bg-white" aria-labelledby="health-heading"><PanelHeader eyebrow="Live service check" title="System health" id="health-heading" right={<button type="button" onClick={() => void loadHealth()} className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#D8E1EC] text-[#667085] transition hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]" aria-label="Refresh system health"><RefreshCw className={`h-4 w-4 ${healthState === 'loading' ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" /></button>} /><div className="space-y-2 p-4">{healthState === 'loading' && <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>}{healthState === 'error' && <div className="rounded-[8px] border border-[#F0B9B5] bg-[#FFF7F6] p-4"><p className="text-xs font-extrabold text-[#B42318]">Unable to load service health</p><p className="mt-1 text-[11px] leading-5 text-[#667085]">The live health endpoint did not return a successful response.</p><button type="button" onClick={() => void loadHealth()} className="mt-3 text-[11px] font-extrabold text-[#1754E8]">Try again</button></div>}{healthState === 'ready' && health && <><HealthRow icon={LayoutDashboard} label="Application" status={health.checks.application.status} detail={health.checks.application.latencyMs === null ? 'Latency unavailable' : `${health.checks.application.latencyMs} ms`} /><HealthRow icon={Database} label="Database" status={health.checks.database.status} detail={health.checks.database.latencyMs === null ? 'Latency unavailable' : `${health.checks.database.latencyMs} ms`} /><HealthRow icon={Gauge} label="Environment" status={health.status} detail={`${health.environment}${health.region ? ` · ${health.region}` : ''}`} /><div className="flex items-center justify-between border-t border-[#E7ECF2] pt-3 text-[9px] font-bold text-[#98A2B3]"><span>Version {health.version}</span><span>{relativeTime(health.timestamp)}</span></div></>}</div></section>
        </div>

        <div className="flex flex-col gap-3 rounded-[11px] border border-[#D7E0EA] bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] bg-[#EEF3FB] text-[#1754E8]"><LayoutDashboard className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-xs font-extrabold text-[#344054]">Platform overview remains available below</p><p className="mt-1 text-[11px] leading-5 text-[#667085]">Your role workspace sits above the existing public homepage. No existing homepage section has been removed.</p></div></div><a href="#platform-overview" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[8px] border border-[#C7D3E1] bg-[#F8FAFC] px-4 text-[11px] font-extrabold text-[#1754E8]">Explore platform <ArrowRight className="h-3.5 w-3.5" /></a></div>
      </main>

      {searchOpen && <div className="fixed inset-0 z-[140] flex items-start justify-center bg-[#0B1425]/65 px-4 pt-[8vh]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}><div ref={searchDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="workspace-search-title" className="w-full max-w-[720px] overflow-hidden rounded-[12px] border border-[#C9D5E4] bg-white shadow-[0_26px_80px_rgba(10,22,42,0.28)] outline-none"><h2 id="workspace-search-title" className="sr-only">Search your workspace</h2><div className="flex items-center gap-3 border-b border-[#DFE6EE] px-4 py-3.5"><Search className="h-5 w-5 shrink-0 text-[#667085]" aria-hidden="true" /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') rememberSearch(query); }} placeholder="Search actions, work items, notices, overview…" className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[#101828] outline-none placeholder:text-[#98A2B3]" aria-label="Search workspace" /><span className="hidden items-center gap-1 rounded-md border border-[#D8E1EC] bg-[#F7F9FC] px-2 py-1 text-[10px] font-bold text-[#667085] sm:flex"><Command className="h-3 w-3" />K</span><button type="button" onClick={() => setSearchOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-[8px] text-[#667085] hover:bg-[#F2F4F7]" aria-label="Close search"><X className="h-4 w-4" /></button></div><div className="max-h-[62vh] overflow-y-auto p-3">{!query && recentSearches.length > 0 && <div className="mb-3 rounded-[8px] border border-[#E2E8F0] bg-[#F8FAFC] p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7A8698]">Recent searches</p><div className="mt-2 flex flex-wrap gap-2">{recentSearches.map((item) => <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-[7px] border border-[#D6DFEA] bg-white px-3 py-2 text-[11px] font-bold text-[#475467] hover:border-[#AFC0D6] hover:text-[#1754E8]">{item}</button>)}</div></div>}{groupedResults.length ? groupedResults.map((group) => <section key={group.group} className="mb-4 last:mb-0"><h3 className="px-2 pb-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7A8698]">{group.group}</h3><div className="space-y-1">{group.items.map((item) => item.href ? <Link key={item.id} href={item.href} onClick={() => { rememberSearch(query || item.label); setSearchOpen(false); }} className="group flex items-center justify-between gap-3 rounded-[8px] px-3 py-3 transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"><span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#344054]">{item.label}</span><span className="mt-0.5 block truncate text-[11px] text-[#7A8698]">{item.detail}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-[#98A2B3] group-hover:text-[#1754E8]" /></Link> : <div key={item.id} className="flex items-center justify-between gap-3 rounded-[8px] px-3 py-3"><span className="min-w-0"><span className="block truncate text-xs font-extrabold text-[#344054]">{item.label}</span><span className="mt-0.5 block truncate text-[11px] text-[#7A8698]">{item.detail}</span></span><CircleDot className="h-4 w-4 shrink-0 text-[#98A2B3]" /></div>)}</div></section>) : <EmptyState title="No matching results" description="Try a different workflow, notice or action name." />}</div></div></div>}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return <div className="flex min-h-[82px] flex-col justify-center border-b border-white/10 px-4 py-3 lg:border-b-0 lg:border-r"><span className="text-2xl font-extrabold tabular-nums tracking-[-0.04em]">{value}</span><span className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#AFC4E6]">{label}</span></div>;
}

function MetricCard({ metric, featured }: { metric: EnterpriseHomeMetric; featured: boolean }) {
  const tone = toneStyles[metric.tone ?? 'neutral'];
  return <article className={`relative overflow-hidden rounded-[11px] border p-4 transition duration-150 hover:-translate-y-px hover:shadow-[0_7px_18px_rgba(16,24,40,0.065)] motion-reduce:transform-none motion-reduce:transition-none ${featured ? 'border-[#101D38] bg-[#101D38] text-white' : 'border-[#D7E0EA] bg-white text-[#101828]'}`}><span className={`absolute inset-y-0 left-0 w-1 ${tone.accent}`} aria-hidden="true" /><div className="flex items-start justify-between gap-3 pl-1"><div className="min-w-0"><p className={`text-[9px] font-extrabold uppercase tracking-[0.1em] ${featured ? 'text-[#AFC4E6]' : 'text-[#667085]'}`}>{metric.label}</p><p className="mt-3 truncate text-[27px] font-extrabold tabular-nums tracking-[-0.045em]">{metric.value ?? '—'}</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] ${featured ? 'bg-white/10 text-white' : tone.icon}`}><TrendingUp className="h-4 w-4" aria-hidden="true" /></span></div><p className={`mt-2 pl-1 text-[11px] leading-5 ${featured ? 'text-[#C5D1E3]' : 'text-[#667085]'}`}>{metric.detail}</p>{typeof metric.progress === 'number' && <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${featured ? 'bg-white/15' : 'bg-[#EDF1F5]'}`} role="progressbar" aria-label={`${metric.label} ${Math.round(metric.progress)}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(metric.progress)}><div className={`h-full rounded-full ${featured ? 'bg-[#74A2FF]' : tone.accent}`} style={{ width: `${Math.max(0, Math.min(100, metric.progress))}%` }} /></div>}</article>;
}

function AlertItem({ alert }: { alert: EnterpriseHomeData['alerts'][number] }) {
  const style = alert.level === 'danger' ? 'border-[#F0B9B5] bg-[#FFF7F6]' : alert.level === 'warning' ? 'border-[#EFD7A5] bg-[#FFFBF2]' : 'border-[#C7D7F2] bg-[#F7FAFF]';
  const badge = alert.level === 'danger' ? 'bg-[#FDE4E2] text-[#912018]' : alert.level === 'warning' ? 'bg-[#FDECC8] text-[#875008]' : 'bg-[#E8F0FF] text-[#1748A5]';
  return <article className={`rounded-[8px] border p-3.5 ${style}`}><div className="flex items-start gap-3"><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${alert.level === 'danger' ? 'text-[#B42318]' : alert.level === 'warning' ? 'text-[#A86008]' : 'text-[#1754E8]'}`} aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`rounded-md px-2 py-1 text-[8px] font-black uppercase tracking-[0.08em] ${badge}`}>{alert.level}</span>{alert.href && <Link href={alert.href} className="text-[10px] font-extrabold text-[#1754E8]">Review</Link>}</div><p className="mt-2 text-xs font-semibold leading-5 text-[#344054]">{alert.message}</p></div></div></article>;
}

function WorkRow({ item }: { item: EnterpriseHomeWorkItem }) {
  const body = <><div className="flex min-w-0 flex-1 items-start gap-3"><span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-[#EEF3FB] text-[#1754E8]"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-xs font-extrabold text-[#344054]">{item.title}</p><p className="mt-1 truncate text-[11px] text-[#667085]">{item.detail}</p></div></div><div className="flex shrink-0 items-center gap-2">{item.date && <span className="hidden text-[9px] font-bold text-[#98A2B3] sm:inline">{formatDate(item.date)}</span>}<span className={`rounded-md border px-2 py-1 text-[8px] font-black uppercase tracking-[0.06em] ${workTone(item)}`}>{statusLabel(item.status)}</span>{item.href && <ChevronRight className="h-4 w-4 text-[#98A2B3]" aria-hidden="true" />}</div></>;
  const className = 'flex min-h-[62px] items-center gap-3 px-5 py-3 transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1754E8]';
  return item.href ? <Link href={item.href} className={className}>{body}</Link> : <div className={className}>{body}</div>;
}

function TimelineRow({ item }: { item: EnterpriseHomeWorkItem }) {
  return <div className="flex gap-3 rounded-[8px] px-2 py-2.5 transition hover:bg-[#F7F9FC]"><div className="w-[72px] shrink-0"><span className="text-[9px] font-extrabold uppercase text-[#7A8698]">{item.date ? formatDate(item.date, { day: '2-digit', month: 'short' }) : statusLabel(item.status)}</span></div><div className="min-w-0 border-l border-[#D7E0EB] pl-3"><p className="truncate text-xs font-extrabold text-[#344054]">{item.title}</p><p className="mt-0.5 truncate text-[11px] text-[#667085]">{item.detail}</p></div></div>;
}

function SectionHeading({ id, eyebrow, title, description }: { id: string; eyebrow: string; title: string; description: string }) {
  return <div><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">{eyebrow}</p><h2 id={id} className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#101828]">{title}</h2><p className="mt-1 max-w-[760px] text-[11px] leading-5 text-[#667085]">{description}</p></div>;
}

function PanelHeader({ eyebrow, title, id, description, right }: { eyebrow: string; title: string; id: string; description?: string; right?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 border-b border-[#E4E9F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">{eyebrow}</p><h2 id={id} className="mt-1 text-base font-extrabold tracking-[-0.025em] text-[#101828]">{title}</h2>{description && <p className="mt-1 text-[11px] leading-5 text-[#667085]">{description}</p>}</div>{right}</div>;
}

function CompactPanel({ id, icon: Icon, eyebrow, title, children, className = '' }: { id: string; icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>; eyebrow: string; title: string; children: React.ReactNode; className?: string }) {
  return <section className={`overflow-hidden rounded-[11px] border border-[#D7E0EA] bg-white ${className}`} aria-labelledby={id}><div className="flex items-center gap-3 border-b border-[#E4E9F0] px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-[#EEF3FB] text-[#1754E8]"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7A8698]">{eyebrow}</p><h2 id={id} className="mt-0.5 text-sm font-extrabold text-[#101828]">{title}</h2></div></div><div className="space-y-1 p-4">{children}</div></section>;
}

function HealthRow({ icon: Icon, label, status, detail }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>; label: string; status: ComponentStatus; detail: string }) {
  const palette = status === 'operational' ? 'bg-[#EAF7F1] text-[#087A55]' : status === 'degraded' ? 'bg-[#FFF6E7] text-[#A86008]' : 'bg-[#FFF0F0] text-[#B42318]';
  const dot = status === 'operational' ? 'bg-[#087A55]' : status === 'degraded' ? 'bg-[#D88915]' : 'bg-[#D92D20]';
  return <div className="flex items-center gap-3 rounded-[8px] border border-[#E2E8F0] bg-[#FAFBFD] p-3"><span className={`flex h-9 w-9 items-center justify-center rounded-[8px] ${palette}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-[11px] font-extrabold text-[#344054]">{label}</p><span className={`inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.06em] ${palette.split(' ')[1]}`}><span className={`h-1.5 w-1.5 rounded-full ${dot}`} />{status}</span></div><p className="mt-1 text-[9px] text-[#7A8698]">{detail}</p></div></div>;
}

function SkeletonRow() {
  return <div className="flex animate-pulse items-center gap-3 rounded-[8px] border border-[#E2E8F0] p-3 motion-reduce:animate-none"><div className="h-9 w-9 rounded-[8px] bg-[#E9EEF5]" /><div className="flex-1"><div className="h-3 w-24 rounded bg-[#E9EEF5]" /><div className="mt-2 h-2.5 w-36 rounded bg-[#F0F3F7]" /></div></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[9px] border border-dashed border-[#CDD7E4] bg-[#FAFBFD] px-4 py-6 text-center"><CircleDot className="mx-auto h-5 w-5 text-[#98A2B3]" aria-hidden="true" /><p className="mt-2 text-xs font-extrabold text-[#344054]">{title}</p><p className="mx-auto mt-1 max-w-[400px] text-[11px] leading-5 text-[#7A8698]">{description}</p></div>;
}
