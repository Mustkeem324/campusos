'use client';

import React from 'react';
import { Activity, AlertCircle, ArrowRight, BookOpen, CalendarDays, CheckCircle2, Clock3, Database, GraduationCap, ReceiptText, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/auth-store';

type Metric = { label: string; value: string | number | null; detail: string };
type DashboardData = {
  role: string;
  metrics: Metric[];
  activity: Array<{ id: string; action: string; entity: string; createdAt: string }>;
};

const roleName = (role: string) => role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());

export function RoleDashboard() {
  const { currentSession } = useAuthStore();
  const [data, setData] = React.useState<DashboardData | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const loadDashboard = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok || !isDashboardData(payload)) throw new Error('Dashboard data is unavailable.');
      setData(payload);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Dashboard data is unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void loadDashboard(); }, [loadDashboard]);

  if (!currentSession) return null;

  return (
    <section className="space-y-6" aria-busy={loading} aria-live="polite">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">{roleName(data?.role ?? currentSession.role)} dashboard</h1>
          <p className="mt-1 text-sm text-text-secondary">{currentSession.institutionName}</p>
        </div>
        <button type="button" onClick={() => void loadDashboard()} disabled={loading} className="inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-secondary hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-60">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </header>

      {loading && <DashboardSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={loadDashboard} />}
      {!loading && !error && data && <DashboardContent data={data} />}
    </section>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  return <>
    <section className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Activity size={22} /></span><div><h2 className="font-semibold text-text-primary">Operational overview</h2><p className="mt-1 text-sm text-text-secondary">Current records available to your role.</p></div></div><div className="flex items-center gap-2 text-xs text-text-secondary"><Clock3 size={15} />Updated when you refresh</div></div>
      {data.metrics.length > 0 ? <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">{data.metrics.map((metric) => <MetricCard key={metric.label} metric={metric} />)}</div> : <EmptyDashboard />}
    </section>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]"><ActivityPanel activity={data.activity} /><RoleSummary role={data.role} /></div>
    <QuickAccess role={data.role} />
  </>;
}

type QuickLink = { href: string; label: string; description: string; icon: typeof BookOpen };

function QuickAccess({ role }: { role: string }) {
  const links = getQuickLinks(role);
  if (links.length === 0) return null;
  return <section className="rounded-xl border border-border bg-surface p-5 shadow-sm" aria-labelledby="quick-access-title">
    <h2 id="quick-access-title" className="text-base font-semibold text-text-primary">Quick access</h2>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {links.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="group flex min-h-24 items-start gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"><Icon size={20} className="mt-0.5 shrink-0 text-primary" /><span><span className="block text-sm font-semibold text-text-primary">{label}</span><span className="mt-1 block text-xs leading-5 text-text-secondary">{description}</span></span></Link>)}
    </div>
  </section>;
}

function getQuickLinks(role: string): QuickLink[] {
  if (role === 'STUDENT') return [
    { href: '/student/learning', label: 'My learning', description: 'Courses, lessons, and deadlines', icon: BookOpen },
    { href: '/student/results', label: 'Academic results', description: 'Published grades and credits', icon: GraduationCap },
    { href: '/attendance', label: 'Attendance', description: 'Review recorded attendance', icon: CalendarDays },
    { href: '/fees', label: 'Fees', description: 'Invoices and payment status', icon: ReceiptText },
  ];
  if (role === 'FACULTY') return [
    { href: '/learning', label: 'Teaching workspace', description: 'Courses and learning sessions', icon: BookOpen },
    { href: '/assignments', label: 'Assignments', description: 'Review and grade submissions', icon: GraduationCap },
    { href: '/attendance', label: 'Attendance', description: 'Run and review attendance', icon: CalendarDays },
    { href: '/community', label: 'Community', description: 'Course discussions and notices', icon: Users },
  ];
  return [
    { href: '/community', label: 'Community', description: 'Institution discussions and notices', icon: Users },
    { href: '/assignments', label: 'Assignments', description: 'Review course assessment work', icon: BookOpen },
    { href: '/attendance', label: 'Attendance', description: 'Review attendance records', icon: CalendarDays },
    { href: '/dashboard', label: 'Dashboard', description: 'Refresh your operational overview', icon: ReceiptText },
  ];
}

function MetricCard({ metric }: { metric: Metric }) {
  const Icon = iconForMetric(metric.label);
  return <article className="min-w-0 p-5"><div className="flex items-start justify-between gap-3"><p className="text-sm font-medium text-text-secondary">{metric.label}</p><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-primary"><Icon size={16} /></span></div><p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary" title={String(metric.value ?? 'No data available')}>{metric.value ?? 'No data available'}</p><p className="mt-2 min-h-5 text-xs leading-5 text-text-muted">{metric.detail}</p></article>;
}

function ActivityPanel({ activity }: { activity: DashboardData['activity'] }) { return <section className="rounded-xl border border-border bg-surface p-5 shadow-sm"><h2 className="font-semibold text-text-primary">Recent activity</h2><p className="mt-1 text-sm text-text-secondary">Latest recorded institution events.</p>{activity.length === 0 ? <p className="mt-5 rounded-lg bg-surface-muted p-4 text-sm text-text-secondary">There is no recorded activity to show yet.</p> : <ul className="mt-4 divide-y divide-border">{activity.map((item) => <li key={item.id} className="flex items-start gap-3 py-3 text-sm"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="font-medium text-text-primary">{item.action}</p><p className="mt-0.5 truncate text-text-secondary">{item.entity}</p></div><time className="shrink-0 text-xs text-text-muted" dateTime={item.createdAt}>{formatActivityTime(item.createdAt)}</time></li>)}</ul>}</section>; }
function RoleSummary({ role }: { role: string }) { const summary = role === 'STUDENT' ? 'Keep learning, attendance, results, and fees in one place.' : role === 'FACULTY' ? 'Monitor teaching activity, attendance, and grading work.' : 'Manage the institutional records assigned to your role.'; return <aside className="rounded-xl border border-border bg-surface p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success"><ShieldCheck size={20} /></div><h2 className="mt-4 font-semibold text-text-primary">Role-aware workspace</h2><p className="mt-2 text-sm leading-6 text-text-secondary">{summary}</p><div className="mt-5 rounded-lg border border-border bg-surface-muted p-3"><div className="flex items-center gap-2 text-sm font-medium text-text-primary"><CheckCircle2 size={16} className="text-success" />Securely scoped</div><p className="mt-1 text-xs leading-5 text-text-secondary">Only authorized records appear in this dashboard.</p></div></aside>; }
function iconForMetric(label: string) { const lower = label.toLowerCase(); if (lower.includes('attendance') || lower.includes('session')) return CalendarDays; if (lower.includes('fee') || lower.includes('collection') || lower.includes('invoice')) return ReceiptText; if (lower.includes('student') || lower.includes('faculty') || lower.includes('user')) return Users; if (lower.includes('course') || lower.includes('submission')) return BookOpen; return Activity; }
function formatActivityTime(value: string) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); }

function DashboardSkeleton() {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
    {[0, 1, 2, 3].map((index) => <div key={index} className="h-36 animate-pulse rounded-xl border border-border bg-surface-muted" />)}
  </div>;
}

function EmptyDashboard() {
  return <section className="rounded-xl border border-dashed border-border bg-surface p-10 text-center">
    <Database className="mx-auto text-text-muted" size={28} />
    <h2 className="mt-3 text-base font-semibold text-text-primary">No dashboard data available</h2>
    <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">Your role has no published dashboard metrics yet. Use the navigation to access the modules available to you.</p>
  </section>;
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return <section className="rounded-xl border border-danger/30 bg-danger-soft p-5" role="alert">
    <div className="flex gap-3"><AlertCircle className="shrink-0 text-danger" size={20} /><div><h2 className="font-semibold text-text-primary">Unable to load dashboard</h2><p className="mt-1 text-sm text-text-secondary">{message}</p><button type="button" onClick={() => void onRetry()} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">Try again <ArrowRight size={15} /></button></div></div>
  </section>;
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DashboardData>;
  return typeof candidate.role === 'string' && Array.isArray(candidate.metrics) && Array.isArray(candidate.activity);
}
