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
  UsersRound,
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

type RangeKey = '7d' | '30d' | 'all';

type SearchResult = {
  id: string;
  label: string;
  detail: string;
  href?: string;
  group: 'Actions' | 'Work' | 'Notices' | 'Overview';
};

const toneStyles: Record<NonNullable<EnterpriseHomeMetric['tone']>, { icon: string; accent: string; badge: string }> = {
  neutral: { icon: 'bg-[#EEF3FB] text-[#1754E8]', accent: 'bg-[#1754E8]', badge: 'text-[#526173]' },
  positive: { icon: 'bg-[#EAF7F1] text-[#087A55]', accent: 'bg-[#087A55]', badge: 'text-[#087A55]' },
  warning: { icon: 'bg-[#FFF6E7] text-[#A86008]', accent: 'bg-[#D88915]', badge: 'text-[#A86008]' },
  danger: { icon: 'bg-[#FFF0F0] text-[#B42318]', accent: 'bg-[#D92D20]', badge: 'text-[#B42318]' },
};

function browserLocale() {
  return typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'en-IN';
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(browserLocale(), options ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function relativeTime(value: string) {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return 'Recorded recently';
  const diffMinutes = Math.max(0, Math.round((Date.now() - timestamp) / 60_000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes} min ago`;
  const hours = Math.round(diffMinutes / 60);
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

function statusLabel(status?: string) {
  return status ? status.replaceAll('_', ' ') : 'Current';
}

function alertTone(level: 'info' | 'warning' | 'danger') {
  if (level === 'danger') return { border: 'border-[#F0B9B5]', bg: 'bg-[#FFF7F6]', icon: 'text-[#B42318]', badge: 'bg-[#FDE4E2] text-[#912018]' };
  if (level === 'warning') return { border: 'border-[#EFD7A5]', bg: 'bg-[#FFFBF2]', icon: 'text-[#A86008]', badge: 'bg-[#FDECC8] text-[#875008]' };
  return { border: 'border-[#C7D7F2]', bg: 'bg-[#F7FAFF]', icon: 'text-[#1754E8]', badge: 'bg-[#E8F0FF] text-[#1748A5]' };
}

function workStatusTone(item: EnterpriseHomeWorkItem) {
  const status = `${item.status ?? ''} ${item.priority ?? ''}`.toLowerCase();
  if (/critical|urgent|overdue|late|failed|risk/.test(status)) return 'border-[#F0B9B5] bg-[#FFF7F6] text-[#B42318]';
  if (/pending|warning|grade|review/.test(status)) return 'border-[#EFD7A5] bg-[#FFFBF2] text-[#9A5A08]';
  if (/complete|approved|submitted|current|available|operational/.test(status)) return 'border-[#BFE3D4] bg-[#F1FBF7] text-[#087A55]';
  return 'border-[#D9E2EE] bg-[#F7F9FC] text-[#5C6878]';
}

function activityBuckets(activity: EnterpriseHomeActivity[], range: RangeKey) {
  const days = range === '7d' ? 7 : range === '30d' ? 14 : 14;
  const now = new Date();
  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    const count = activity.filter((item) => {
      const time = new Date(item.createdAt).getTime();
      return Number.isFinite(time) && time >= date.getTime() && time < next.getTime();
    }).length;
    return { date, count };
  });
  return buckets;
}

export function EnterpriseWorkspaceHome({ data }: { data: EnterpriseHomeData }) {
  const router = useRouter();
  const [isPending, startTransition] = React.useTransition();
  const [range, setRange] = React.useState<RangeKey>('7d');
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const [recentSearches, setRecentSearches] = React.useState<string[]>([]);
  const [health, setHealth] = React.useState<HealthSnapshot | null>(null);
  const [healthState, setHealthState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const searchDialogRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  useDialogFocusTrap({ active: searchOpen, containerRef: searchDialogRef, initialFocusRef: searchInputRef });

  React.useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem('campusos-home-recent-searches') ?? '[]');
      if (Array.isArray(parsed)) setRecentSearches(parsed.filter((item): item is string => typeof item === 'string').slice(0, 5));
    } catch {
      setRecentSearches([]);
    }
  }, []);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const loadHealth = React.useCallback(async () => {
    setHealthState('loading');
    try {
      const response = await fetch('/api/health', { cache: 'no-store' });
      const payload = await response.json();
      if (!payload || typeof payload !== 'object' || !('checks' in payload)) throw new Error('Invalid health response');
      setHealth(payload as HealthSnapshot);
      setHealthState('ready');
    } catch (error) {
      console.error('Unable to load homepage system health', error);
      setHealthState('error');
    }
  }, []);

  React.useEffect(() => {
    void loadHealth();
  }, [loadHealth]);

  const searchItems = React.useMemo<SearchResult[]>(() => [
    ...data.actions.map((item, index) => ({ id: `action-${index}`, label: item.label, detail: 'Quick action', href: item.href, group: 'Actions' as const })),
    ...data.work.items.map((item) => ({ id: `work-${item.id}`, label: item.title, detail: item.detail, href: item.href, group: 'Work' as const })),
    ...data.notices.map((item) => ({ id: `notice-${item.id}`, label: item.title, detail: item.content, group: 'Notices' as const })),
    ...data.summaries.map((item) => ({ id: `summary-${item.id}`, label: item.label, detail: `${item.value} · ${item.detail}`, href: item.href, group: 'Overview' as const })),
  ], [data]);

  const searchResults = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return searchItems.slice(0, 10);
    return searchItems.filter((item) => `${item.label} ${item.detail}`.toLowerCase().includes(normalized)).slice(0, 16);
  }, [query, searchItems]);

  const buckets = React.useMemo(() => activityBuckets(data.activity, range), [data.activity, range]);
  const maxBucket = Math.max(1, ...buckets.map((item) => item.count));
  const latestActivity = data.activity[0];
  const insights = React.useMemo(() => {
    const items: string[] = [];
    if (data.alerts.length === 0) items.push('No exception alerts are currently reported by your authorised homepage data.');
    else items.push(`${data.alerts.length} exception${data.alerts.length === 1 ? '' : 's'} currently require attention.`);
    if (data.work.items.length > 0) items.push(`${data.work.items.length} item${data.work.items.length === 1 ? '' : 's'} are present in your current work queue.`);
    if (latestActivity) items.push(`Latest recorded activity: ${latestActivity.action} · ${latestActivity.entity}.`);
    if (data.upcoming.length > 0) items.push(`${data.upcoming.length} scheduled or upcoming item${data.upcoming.length === 1 ? '' : 's'} are visible in your authorised scope.`);
    return items.slice(0, 4);
  }, [data, latestActivity]);

  const submitSearch = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const next = [trimmed, ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
    setRecentSearches(next);
    try { window.localStorage.setItem('campusos-home-recent-searches', JSON.stringify(next)); } catch { /* storage is optional */ }
  };

  const refresh = () => {
    startTransition(() => router.refresh());
    void loadHealth();
  };

  const groupedResults = ['Actions', 'Work', 'Notices', 'Overview'].map((group) => ({
    group,
    items: searchResults.filter((item) => item.group === group),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="bg-[#F3F6FA] text-[#172033]">
      <section className="border-b border-[#DDE4ED] bg-white px-4 py-7 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1580px]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">
                <span>{data.heading.eyebrow}</span><span className="h-1 w-1 rounded-full bg-[#98A2B3]" /><span>{data.dataScopeLabel}</span>
              </div>
              <h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.035em] text-[#101828] sm:text-[36px]">{greeting()}, {data.identity.name}</h1>
              <p className="mt-2 max-w-[780px] text-sm leading-6 text-[#667085] sm:text-[15px]">{data.heading.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-semibold text-[#7A8698]">
                <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />{formatDate(data.generatedAt, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</span>
                <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-[#087A55]" aria-hidden="true" />{data.identity.title}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button type="button" onClick={() => setSearchOpen(true)} className="group flex min-h-11 min-w-0 items-center justify-between gap-4 rounded-[10px] border border-[#CDD7E4] bg-white px-4 text-left shadow-[0_2px_8px_rgba(16,24,40,0.03)] transition hover:border-[#9FB4D0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] sm:w-[330px]" aria-label="Open command search">
                <span className="flex min-w-0 items-center gap-2.5"><Search className="h-4 w-4 shrink-0 text-[#667085]" aria-hidden="true" /><span className="truncate text-sm font-semibold text-[#667085]">Search your workspace…</span></span>
                <kbd className="hidden rounded-md border border-[#D8E0EA] bg-[#F7F9FC] px-2 py-1 text-[10px] font-bold text-[#667085] sm:block">⌘ K</kbd>
              </button>
              <select value={range} onChange={(event) => setRange(event.target.value as RangeKey)} className="min-h-11 rounded-[10px] border border-[#CDD7E4] bg-white px-3 text-sm font-bold text-[#344054] outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#D9E5FF]" aria-label="Activity date range">
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="all">All available</option>
              </select>
              <button type="button" onClick={refresh} disabled={isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-[#B9C7DA] bg-[#101D38] px-4 text-sm font-extrabold text-white transition hover:bg-[#17284A] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]">
                <RefreshCw className={`h-4 w-4 ${isPending ? 'animate-spin' : ''}`} aria-hidden="true" />{isPending ? 'Refreshing' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1580px] space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section aria-labelledby="today-summary-heading" className="overflow-hidden rounded-[12px] border border-[#CBD7E7] bg-[#101D38] text-white shadow-[0_8px_22px_rgba(16,29,56,0.09)]">
          <div className="grid lg:grid-cols-[minmax(0,1.1fr)_repeat(4,minmax(120px,0.55fr))_auto]">
            <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
              <p id="today-summary-heading" className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#AFC4E6]">Today · executive summary</p>
              <p className="mt-2 text-lg font-extrabold tracking-[-0.02em]">{data.alerts.length ? 'Your workspace has items requiring attention.' : 'Your authorised workspace is operating without reported exception alerts.'}</p>
              <p className="mt-1 text-xs leading-5 text-[#C5D1E3]">{data.heading.assurance ?? 'Data is restricted to your active role and institution context.'}</p>
            </div>
            <SummaryStat label="Needs attention" value={data.alerts.length} />
            <SummaryStat label="Work queue" value={data.work.items.length} />
            <SummaryStat label="Notices" value={data.notices.length} />
            <SummaryStat label="Quick actions" value={data.actions.length} />
            <div className="flex items-center p-4 lg:border-l lg:border-white/10">
              <a href="#attention-center" className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-white px-4 text-xs font-extrabold text-[#101D38] transition hover:bg-[#EEF3FB] lg:w-auto">Review priorities <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></a>
            </div>
          </div>
        </section>

        <section aria-labelledby="kpi-heading">
          <SectionHeading eyebrow="Executive metrics" title="Current operating indicators" description="Values are supplied by existing role-scoped loaders and institution records." action={<span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#667085]"><Clock3 className="h-3.5 w-3.5" aria-hidden="true" />Updated {relativeTime(data.generatedAt)}</span>} />
          {data.metrics.length ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {data.metrics.slice(0, 8).map((metric, index) => <MetricCard key={metric.id} metric={metric} featured={index === 0} />)}
            </div>
          ) : <EmptyState title="No KPI metrics available" description="This role does not currently expose aggregate metrics to the homepage." />}
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(340px,0.75fr)]">
          <section aria-labelledby="performance-heading" className="rounded-[12px] border border-[#D9E2ED] bg-white shadow-[0_4px_14px_rgba(16,24,40,0.035)]">
            <div className="flex flex-col gap-3 border-b border-[#E4E9F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Activity analytics</p><h2 id="performance-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">Workspace activity overview</h2></div>
              <div className="flex items-center gap-2 text-xs font-semibold text-[#667085]"><span className="h-2 w-2 rounded-full bg-[#1754E8]" />Recorded activity events</div>
            </div>
            <div className="p-5">
              {data.activity.length ? (
                <>
                  <div className="flex h-[220px] items-end gap-2 border-b border-l border-[#DDE4EC] px-2 pb-0 pt-5" role="img" aria-label={`Activity event volume for ${range === '7d' ? 'the last seven days' : range === '30d' ? 'the last thirty days' : 'available history'}`}>
                    {buckets.map((bucket) => (
                      <div key={bucket.date.toISOString()} className="group flex min-w-0 flex-1 flex-col items-center justify-end gap-2">
                        <span className="text-[10px] font-bold tabular-nums text-[#667085] opacity-0 transition group-hover:opacity-100">{bucket.count}</span>
                        <div className="w-full max-w-[36px] rounded-t-[5px] bg-[#1754E8] transition-[height,background-color] duration-200 group-hover:bg-[#103FC2]" style={{ height: `${Math.max(5, (bucket.count / maxBucket) * 145)}px` }} title={`${bucket.count} activity event${bucket.count === 1 ? '' : 's'} on ${formatDate(bucket.date.toISOString())}`} />
                        <span className="hidden text-[9px] font-bold text-[#8792A2] sm:block">{new Intl.DateTimeFormat(browserLocale(), { day: '2-digit', month: 'short' }).format(bucket.date)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#667085]"><span>Current visible events: <strong className="tabular-nums text-[#101828]">{data.activity.length}</strong></span><Link href="/notifications" className="inline-flex items-center gap-1 font-extrabold text-[#1754E8] hover:text-[#103FC2]">View workspace updates <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
                </>
              ) : <EmptyState title="No recent activity" description="No activity events are currently available in your authorised scope." />}
            </div>
          </section>

          <section id="attention-center" aria-labelledby="attention-heading" className="rounded-[12px] border border-[#D9E2ED] bg-white shadow-[0_4px_14px_rgba(16,24,40,0.035)]">
            <div className="border-b border-[#E4E9F0] px-5 py-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#B54708]">Exception management</p><h2 id="attention-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">Needs your attention</h2></div>
            <div className="space-y-3 p-4">
              {data.alerts.length ? data.alerts.slice(0, 6).map((alert) => {
                const tone = alertTone(alert.level);
                return <div key={alert.id} className={`rounded-[10px] border p-4 ${tone.border} ${tone.bg}`}><div className="flex items-start gap-3"><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${tone.icon}`} aria-hidden="true" /><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${tone.badge}`}>{alert.level}</span>{alert.href && <Link href={alert.href} className="text-[11px] font-extrabold text-[#1754E8]">Review</Link>}</div><p className="mt-2 text-sm font-semibold leading-5 text-[#344054]">{alert.message}</p></div></div></div>;
              }) : <div className="py-7 text-center"><CheckCircle2 className="mx-auto h-8 w-8 text-[#087A55]" aria-hidden="true" /><p className="mt-3 text-sm font-extrabold text-[#101828]">No reported exceptions</p><p className="mx-auto mt-1 max-w-[270px] text-xs leading-5 text-[#667085]">Your current role-scoped data is not reporting an attention alert.</p></div>}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
          <section aria-labelledby="work-heading" className="overflow-hidden rounded-[12px] border border-[#D9E2ED] bg-white shadow-[0_4px_14px_rgba(16,24,40,0.035)]">
            <div className="flex flex-col gap-2 border-b border-[#E4E9F0] px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Priority work</p><h2 id="work-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">{data.work.title}</h2><p className="mt-1 text-xs leading-5 text-[#667085]">{data.work.description}</p></div><Link href="/dashboard" className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1754E8]">Open full workspace <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link></div>
            {data.work.items.length ? <div className="divide-y divide-[#E8EDF3]">{data.work.items.slice(0, 8).map((item) => <WorkRow key={item.id} item={item} />)}</div> : <div className="p-5"><EmptyState title="No current work items" description="There are no queue items exposed by the active role data source." /></div>}
          </section>

          <section aria-labelledby="quick-actions-heading" className="rounded-[12px] border border-[#CBD7E7] bg-[#F8FAFD] p-4 shadow-[0_4px_14px_rgba(16,24,40,0.03)]">
            <div className="flex items-center justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Commands</p><h2 id="quick-actions-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">Quick actions</h2></div><Zap className="h-5 w-5 text-[#1754E8]" aria-hidden="true" /></div>
            <div className="mt-4 grid gap-2">
              {data.actions.length ? data.actions.slice(0, 7).map((action, index) => <Link key={`${action.href}-${action.label}`} href={action.href} className={`group flex min-h-12 items-center justify-between rounded-[9px] border px-3.5 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] ${index === 0 ? 'border-[#101D38] bg-[#101D38] text-white hover:bg-[#17284A]' : 'border-[#D5DEE9] bg-white text-[#344054] hover:border-[#AEBFD5] hover:text-[#1754E8]'}`}><span className="min-w-0 truncate">{action.label}</span><ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></Link>) : <EmptyState title="No quick actions" description="No permission-aware actions are configured for this role." />}
            </div>
          </section>
        </div>

        <section aria-labelledby="overview-heading">
          <SectionHeading eyebrow="Operational context" title="Workspace overview" description="Compact summaries from the same real records used by the role dashboard." />
          {data.summaries.length ? <div className="mt-4 grid gap-px overflow-hidden rounded-[12px] border border-[#D9E2ED] bg-[#D9E2ED] sm:grid-cols-2 xl:grid-cols-4">{data.summaries.slice(0, 8).map((item) => <div key={item.id} className="bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A8698]">{item.label}</p><p className="mt-2 truncate text-xl font-extrabold tabular-nums tracking-[-0.03em] text-[#101828]">{item.value}</p></div>{item.href && <Link href={item.href} aria-label={`Open ${item.label}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#DDE4ED] text-[#667085] transition hover:border-[#AFC0D6] hover:text-[#1754E8]"><ExternalLink className="h-3.5 w-3.5" aria-hidden="true" /></Link>}</div><p className="mt-2 text-xs leading-5 text-[#667085]">{item.detail}</p>{typeof item.progress === 'number' && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EDF1F5]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(item.progress)}><div className="h-full rounded-full bg-[#1754E8]" style={{ width: `${Math.max(0, Math.min(100, item.progress))}%` }} /></div>}</div>)}</div> : <div className="mt-4"><EmptyState title="No overview records" description="The current role has no additional summary values to show here." /></div>}
        </section>

        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <section aria-labelledby="upcoming-heading" className="rounded-[12px] border border-[#D9E2ED] bg-white">
            <PanelHeading icon={CalendarDays} eyebrow="Schedule" title="Upcoming & deadlines" id="upcoming-heading" />
            <div className="p-4">
              {data.upcoming.length ? <div className="space-y-1">{data.upcoming.slice(0, 7).map((item) => <TimelineRow key={item.id} item={item} />)}</div> : <EmptyState title="No upcoming items" description="No scheduled items are currently exposed by this role’s homepage data source." />}
            </div>
          </section>

          <section aria-labelledby="activity-heading" className="rounded-[12px] border border-[#D9E2ED] bg-white">
            <PanelHeading icon={Activity} eyebrow="Audit trail" title="Recent activity" id="activity-heading" />
            <div className="p-4">
              {data.activity.length ? <div className="space-y-1">{data.activity.slice(0, 7).map((item) => <div key={item.id} className="flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[#F7F9FC]"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1754E8]" /><div className="min-w-0"><p className="text-sm font-bold leading-5 text-[#344054]">{item.action}</p><p className="mt-0.5 truncate text-xs text-[#667085]">{item.entity}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.05em] text-[#98A2B3]">{relativeTime(item.createdAt)}</p></div></div>)}</div> : <EmptyState title="No recent activity" description="No activity events are available for this role." />}
            </div>
          </section>

          <section aria-labelledby="notice-heading" className="rounded-[12px] border border-[#D9E2ED] bg-white lg:col-span-2 xl:col-span-1">
            <PanelHeading icon={Bell} eyebrow="Institution updates" title="Notices" id="notice-heading" />
            <div className="p-4">
              {data.notices.length ? <div className="space-y-2">{data.notices.slice(0, 5).map((notice) => <article key={notice.id} className="rounded-[9px] border border-[#E2E8F0] bg-[#FAFBFD] p-3"><div className="flex items-start gap-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#1754E8]" aria-hidden="true" /><div className="min-w-0"><h3 className="text-sm font-extrabold text-[#344054]">{notice.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085]">{notice.content}</p><p className="mt-2 text-[10px] font-bold text-[#98A2B3]">{relativeTime(notice.createdAt)}</p></div></div></article>)}</div> : <EmptyState title="No notices" description="There are no notices available in your authorised scope." />}
            </div>
          </section>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
          <section aria-labelledby="insights-heading" className="rounded-[12px] border border-[#D1DCE9] bg-[#101D38] p-5 text-white">
            <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-[#1754E8]"><Sparkles className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#AFC4E6]">Calculated from current data</p><h2 id="insights-heading" className="mt-1 text-lg font-extrabold">Performance insights</h2></div></div>
            <div className="mt-5 grid gap-px overflow-hidden rounded-[10px] border border-white/10 bg-white/10 sm:grid-cols-2">
              {insights.map((item, index) => <div key={`${index}-${item}`} className="bg-[#101D38] p-4"><div className="flex items-start gap-3"><TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-[#8FB4FF]" aria-hidden="true" /><p className="text-sm font-semibold leading-6 text-[#E3EAF5]">{item}</p></div></div>)}
            </div>
          </section>

          <section aria-labelledby="health-heading" className="rounded-[12px] border border-[#D9E2ED] bg-white">
            <div className="flex items-center justify-between border-b border-[#E4E9F0] px-5 py-4"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">Live service check</p><h2 id="health-heading" className="mt-1 text-lg font-extrabold tracking-[-0.025em] text-[#101828]">System health</h2></div><button type="button" onClick={() => void loadHealth()} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E1EC] text-[#667085] transition hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]" aria-label="Refresh system health"><RefreshCw className={`h-4 w-4 ${healthState === 'loading' ? 'animate-spin' : ''}`} aria-hidden="true" /></button></div>
            <div className="p-4">
              {healthState === 'loading' && <div className="space-y-3" aria-label="Loading system health"><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>}
              {healthState === 'error' && <div className="rounded-[9px] border border-[#F0B9B5] bg-[#FFF7F6] p-4"><p className="text-sm font-extrabold text-[#B42318]">Unable to load service health</p><p className="mt-1 text-xs leading-5 text-[#667085]">The homepage health check could not be completed.</p><button type="button" onClick={() => void loadHealth()} className="mt-3 text-xs font-extrabold text-[#1754E8]">Try again</button></div>}
              {healthState === 'ready' && health && <div className="space-y-2"><HealthRow icon={LayoutDashboard} label="Application" status={health.checks.application.status} detail={health.checks.application.latencyMs === null ? 'Latency unavailable' : `${health.checks.application.latencyMs} ms`} /><HealthRow icon={Database} label="Database" status={health.checks.database.status} detail={health.checks.database.latencyMs === null ? 'Latency unavailable' : `${health.checks.database.latencyMs} ms`} /><HealthRow icon={Gauge} label="Environment" status={health.status === 'operational' ? 'operational' : 'unavailable'} detail={`${health.environment}${health.region ? ` · ${health.region}` : ''}`} /><div className="flex items-center justify-between border-t border-[#E7ECF2] pt-3 text-[10px] font-bold text-[#98A2B3]"><span>Version {health.version}</span><span>{relativeTime(health.timestamp)}</span></div></div>}
            </div>
          </section>
        </div>
      </main>

      {searchOpen && (
        <div className="fixed inset-0 z-[140] flex items-start justify-center bg-[#0B1425]/65 px-4 pt-[8vh] backdrop-blur-[2px]" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSearchOpen(false); }}>
          <div ref={searchDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="workspace-search-title" className="w-full max-w-[720px] overflow-hidden rounded-[14px] border border-[#C9D5E4] bg-white shadow-[0_28px_90px_rgba(10,22,42,0.3)] outline-none">
            <div className="flex items-center gap-3 border-b border-[#DFE6EE] px-4 py-3.5"><Search className="h-5 w-5 shrink-0 text-[#667085]" aria-hidden="true" /><input ref={searchInputRef} value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitSearch(query); }} placeholder="Search actions, work items, notices, overview…" className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-[#101828] outline-none placeholder:text-[#98A2B3]" aria-label="Search workspace" /><span className="hidden items-center gap-1 rounded-md border border-[#D8E1EC] bg-[#F7F9FC] px-2 py-1 text-[10px] font-bold text-[#667085] sm:flex"><Command className="h-3 w-3" />K</span><button type="button" onClick={() => setSearchOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-lg text-[#667085] hover:bg-[#F2F4F7]" aria-label="Close search"><X className="h-4 w-4" /></button></div>
            <div className="max-h-[62vh] overflow-y-auto p-3">
              {!query && recentSearches.length > 0 && <div className="mb-3 rounded-[9px] border border-[#E2E8F0] bg-[#F8FAFC] p-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7A8698]">Recent searches</p><div className="mt-2 flex flex-wrap gap-2">{recentSearches.map((item) => <button key={item} type="button" onClick={() => setQuery(item)} className="rounded-lg border border-[#D6DFEA] bg-white px-3 py-2 text-xs font-bold text-[#475467] hover:border-[#AFC0D6] hover:text-[#1754E8]">{item}</button>)}</div></div>}
              {groupedResults.length ? groupedResults.map((group) => <section key={group.group} className="mb-4 last:mb-0"><h2 id={group.group === 'Actions' ? 'workspace-search-title' : undefined} className="px-2 pb-2 text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7A8698]">{group.group}</h2><div className="space-y-1">{group.items.map((item) => item.href ? <Link key={item.id} href={item.href} onClick={() => { submitSearch(query || item.label); setSearchOpen(false); }} className="group flex items-center justify-between gap-3 rounded-[9px] px-3 py-3 transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"><span className="min-w-0"><span className="block truncate text-sm font-extrabold text-[#344054]">{item.label}</span><span className="mt-0.5 block truncate text-xs text-[#7A8698]">{item.detail}</span></span><ChevronRight className="h-4 w-4 shrink-0 text-[#98A2B3] group-hover:text-[#1754E8]" /></Link> : <div key={item.id} className="flex items-center justify-between gap-3 rounded-[9px] px-3 py-3"><span className="min-w-0"><span className="block truncate text-sm font-extrabold text-[#344054]">{item.label}</span><span className="mt-0.5 block truncate text-xs text-[#7A8698]">{item.detail}</span></span><CircleDot className="h-4 w-4 shrink-0 text-[#98A2B3]" /></div>)}</div></section>) : <EmptyState title="No matching results" description="Try a different person, workflow, notice or action name." />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string | number }) {
  return <div className="flex min-h-[88px] flex-col justify-center border-b border-white/10 px-4 py-3 lg:border-b-0 lg:border-r"><span className="text-2xl font-extrabold tabular-nums tracking-[-0.04em]">{value}</span><span className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#AFC4E6]">{label}</span></div>;
}

function MetricCard({ metric, featured }: { metric: EnterpriseHomeMetric; featured: boolean }) {
  const tone = toneStyles[metric.tone ?? 'neutral'];
  return <article className={`relative overflow-hidden rounded-[12px] border p-4 transition hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(16,24,40,0.07)] ${featured ? 'border-[#101D38] bg-[#101D38] text-white' : 'border-[#D9E2ED] bg-white text-[#101828]'}`}><span className={`absolute inset-y-0 left-0 w-1 ${tone.accent}`} aria-hidden="true" /><div className="flex items-start justify-between gap-3 pl-1"><div className="min-w-0"><p className={`text-[10px] font-extrabold uppercase tracking-[0.1em] ${featured ? 'text-[#AFC4E6]' : 'text-[#667085]'}`}>{metric.label}</p><p className="mt-3 truncate text-[28px] font-extrabold tabular-nums tracking-[-0.045em]">{metric.value ?? '—'}</p></div><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] ${featured ? 'bg-white/10 text-white' : tone.icon}`}><TrendingUp className="h-4 w-4" aria-hidden="true" /></span></div><p className={`mt-2 pl-1 text-xs leading-5 ${featured ? 'text-[#C5D1E3]' : 'text-[#667085]'}`}>{metric.detail}</p>{typeof metric.progress === 'number' && <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${featured ? 'bg-white/15' : 'bg-[#EDF1F5]'}`} role="progressbar" aria-label={`${metric.label} ${metric.progress}%`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(metric.progress)}><div className={`h-full rounded-full ${featured ? 'bg-[#74A2FF]' : tone.accent}`} style={{ width: `${Math.max(0, Math.min(100, metric.progress))}%` }} /></div>}</article>;
}

function WorkRow({ item }: { item: EnterpriseHomeWorkItem }) {
  const content = <><div className="flex min-w-0 flex-1 items-start gap-3"><span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FB] text-[#1754E8]"><CheckCircle2 className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0"><p className="truncate text-sm font-extrabold text-[#344054]">{item.title}</p><p className="mt-1 truncate text-xs text-[#667085]">{item.detail}</p></div></div><div className="flex shrink-0 items-center gap-2">{item.date && <span className="hidden text-[10px] font-bold text-[#98A2B3] sm:inline">{formatDate(item.date)}</span>}<span className={`rounded-md border px-2 py-1 text-[9px] font-black uppercase tracking-[0.06em] ${workStatusTone(item)}`}>{statusLabel(item.status)}</span>{item.href && <ChevronRight className="h-4 w-4 text-[#98A2B3]" aria-hidden="true" />}</div></>;
  const className = 'flex min-h-[66px] items-center gap-3 px-5 py-3 transition hover:bg-[#F8FAFC]';
  return item.href ? <Link href={item.href} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

function TimelineRow({ item }: { item: EnterpriseHomeWorkItem }) {
  return <div className="flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-[#F7F9FC]"><div className="flex w-[72px] shrink-0 flex-col"><span className="text-[10px] font-extrabold uppercase text-[#7A8698]">{item.date ? formatDate(item.date, { day: '2-digit', month: 'short' }) : statusLabel(item.status)}</span></div><div className="min-w-0 border-l border-[#D7E0EB] pl-3"><p className="truncate text-sm font-extrabold text-[#344054]">{item.title}</p><p className="mt-0.5 truncate text-xs text-[#667085]">{item.detail}</p></div></div>;
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#667085]">{eyebrow}</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.03em] text-[#101828]">{title}</h2><p className="mt-1 max-w-[760px] text-xs leading-5 text-[#667085]">{description}</p></div>{action}</div>;
}

function PanelHeading({ icon: Icon, eyebrow, title, id }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>; eyebrow: string; title: string; id: string }) {
  return <div className="flex items-center gap-3 border-b border-[#E4E9F0] px-5 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#EEF3FB] text-[#1754E8]"><Icon className="h-4 w-4" aria-hidden="true" /></span><div><p className="text-[9px] font-extrabold uppercase tracking-[0.11em] text-[#7A8698]">{eyebrow}</p><h2 id={id} className="mt-0.5 text-base font-extrabold tracking-[-0.02em] text-[#101828]">{title}</h2></div></div>;
}

function HealthRow({ icon: Icon, label, status, detail }: { icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>; label: string; status: 'operational' | 'unavailable'; detail: string }) {
  const operational = status === 'operational';
  return <div className="flex items-center gap-3 rounded-[9px] border border-[#E2E8F0] bg-[#FAFBFD] p-3"><span className={`flex h-9 w-9 items-center justify-center rounded-lg ${operational ? 'bg-[#EAF7F1] text-[#087A55]' : 'bg-[#FFF0F0] text-[#B42318]'}`}><Icon className="h-4 w-4" aria-hidden="true" /></span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-2"><p className="text-xs font-extrabold text-[#344054]">{label}</p><span className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[0.06em] ${operational ? 'text-[#087A55]' : 'text-[#B42318]'}`}><span className={`h-1.5 w-1.5 rounded-full ${operational ? 'bg-[#087A55]' : 'bg-[#D92D20]'}`} />{status}</span></div><p className="mt-1 text-[10px] text-[#7A8698]">{detail}</p></div></div>;
}

function SkeletonRow() {
  return <div className="flex animate-pulse items-center gap-3 rounded-[9px] border border-[#E2E8F0] p-3"><div className="h-9 w-9 rounded-lg bg-[#E9EEF5]" /><div className="flex-1"><div className="h-3 w-24 rounded bg-[#E9EEF5]" /><div className="mt-2 h-2.5 w-36 rounded bg-[#F0F3F7]" /></div></div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-[10px] border border-dashed border-[#CDD7E4] bg-[#FAFBFD] px-4 py-7 text-center"><CircleDot className="mx-auto h-6 w-6 text-[#98A2B3]" aria-hidden="true" /><p className="mt-2 text-sm font-extrabold text-[#344054]">{title}</p><p className="mx-auto mt-1 max-w-[420px] text-xs leading-5 text-[#7A8698]">{description}</p></div>;
}
