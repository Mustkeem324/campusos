'use client';

import React, { useState } from 'react';
import { 
  Activity, 
  AlertCircle, 
  ArrowRight, 
  BookOpen, 
  CalendarDays, 
  CheckCircle2, 
  Clock3, 
  Database, 
  GraduationCap, 
  ReceiptText, 
  RefreshCw, 
  ShieldCheck, 
  Users, 
  Sparkles,
  Search,
  PlusCircle,
  Video,
  FileCheck,
  BellRing,
  TrendingUp,
  Award,
  Gift
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiQuery, setAiQuery] = useState('');

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

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    const targetRoute = currentSession.role === 'STUDENT' ? '/student/ai-assistant' : '/ai-governance';
    router.push(`${targetRoute}?prompt=${encodeURIComponent(aiQuery)}`);
  };

  return (
    <section className="space-y-6" aria-busy={loading} aria-live="polite">
      
      {/* Persona Header & Context Banner */}
      <header className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="bg-primary-soft text-primary text-[12px] font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
                AY 2026 • Semester IV
              </span>
              <span className="bg-success-soft text-success text-[12px] font-bold px-2.5 py-0.5 rounded-full border border-success/20 flex items-center gap-1">
                <CheckCircle2 size={13} /> Good Standing
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-text-primary">
              Welcome back, {currentSession.name || roleName(currentSession.role)} 👋
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              {currentSession.institutionName} • {roleName(data?.role ?? currentSession.role)} Portal
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => void loadDashboard()} 
              disabled={loading} 
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:opacity-60"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh Data
            </button>
          </div>
        </div>

        {/* Primary Action Toolbar */}
        <div className="mt-5 pt-5 border-t border-border flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider mr-2">Quick Actions:</span>
          {getPrimaryActions(data?.role ?? currentSession.role).map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-primary-soft hover:text-primary text-text-primary text-xs font-semibold border border-border transition-all"
              >
                <Icon size={14} className="text-primary" /> {action.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Embedded Ask CampusOS AI Bar */}
      <div className="bg-[#101B33] text-white rounded-2xl p-4 md:p-5 border border-[#2A3B5C] shadow-lg">
        <form onSubmit={handleAiSubmit} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-primary font-bold text-sm shrink-0">
            <Sparkles size={18} className="text-primary" /> Ask CampusOS AI:
          </div>
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              placeholder="e.g. 'Show my physics lab schedule' or 'Check fee receipt RCT-9902'..."
              className="w-full bg-[#182642] border border-[#2A3B5C] rounded-xl px-4 py-2.5 text-sm text-white placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              type="submit"
              className="absolute right-2 top-2 px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors"
            >
              Ask
            </button>
          </div>
        </form>
      </div>

      {loading && <DashboardSkeleton />}
      {!loading && error && <ErrorState message={error} onRetry={loadDashboard} />}
      {!loading && !error && data && <DashboardContent data={data} role={currentSession.role} />}
    </section>
  );
}

function DashboardContent({ data, role }: { data: DashboardData; role: string }) {
  return (
    <>
      {/* Priority Actions & Schedule Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <LiveScheduleWidget role={role} />
        </div>
        <div className="lg:col-span-5">
          <ActionRequiredFeed role={role} />
        </div>
      </div>

      {/* Operational Overview Metrics */}
      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <Activity size={22} />
            </span>
            <div>
              <h2 className="font-semibold text-text-primary">Operational overview</h2>
              <p className="mt-1 text-sm text-text-secondary">Real-time metrics isolated by tenant security rules.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <Clock3 size={15} /> Real-time DB sync
          </div>
        </div>

        {data.metrics.length > 0 ? (
          <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>
        ) : (
          <EmptyDashboard />
        )}
      </section>

      {/* Activity & Role Summary */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <ActivityPanel activity={data.activity} />
        <RoleSummary role={data.role} />
      </div>

      <QuickAccess role={data.role} />
    </>
  );
}

function LiveScheduleWidget({ role }: { role: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" /> Today&apos;s Class Schedule
          </h3>
          <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-0.5 rounded-full border border-primary/20">
            2 Lectures Today
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border border-primary/30 bg-primary-soft/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0">
                CS301
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary flex items-center gap-2">
                  Data Structures & Algorithms
                  <span className="bg-danger text-white text-[10px] font-bold px-1.5 py-0.5 rounded">LIVE NOW</span>
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  10:00 AM - 11:30 AM • Lecture Hall 302 • Prof. Sharma
                </div>
              </div>
            </div>
            <Link
              href="/learning/courses/cs301"
              className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/90 transition-colors shrink-0"
            >
              Join Stage
            </Link>
          </div>

          <div className="p-3.5 rounded-xl border border-border bg-surface-muted flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-surface border border-border text-text-secondary flex items-center justify-center font-bold text-xs shrink-0">
                PHY201
              </div>
              <div>
                <div className="text-sm font-bold text-text-primary">
                  Applied Physics Lab
                </div>
                <div className="text-xs text-text-secondary mt-0.5">
                  02:00 PM - 04:00 PM • Physics Lab 02 • Dr. Gupta
                </div>
              </div>
            </div>
            <span className="text-xs text-text-muted font-medium">Upcoming</span>
          </div>
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-border flex items-center justify-between text-xs text-text-secondary">
        <span>75% Minimum Attendance Gatekeeper Active</span>
        <Link href="/timetable" className="text-primary font-semibold hover:underline">
          Full Timetable &rarr;
        </Link>
      </div>
    </div>
  );
}

function ActionRequiredFeed({ role }: { role: string }) {
  const alerts = getPriorityAlerts(role);
  return (
    <div className="bg-white rounded-2xl border border-border p-5 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
            <BellRing size={18} className="text-danger" /> Action Required
          </h3>
          <span className="bg-danger/10 text-danger text-xs font-bold px-2 py-0.5 rounded-full">
            {alerts.length} Pending
          </span>
        </div>

        <div className="space-y-2.5">
          {alerts.map((alert, idx) => (
            <div key={idx} className="p-3 rounded-xl border border-border bg-surface hover:bg-surface-muted transition-colors flex items-start justify-between gap-3">
              <div className="flex gap-2.5">
                <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${alert.urgent ? 'bg-danger' : 'bg-warning'}`}></span>
                <div>
                  <div className="text-xs font-bold text-text-primary">{alert.title}</div>
                  <div className="text-[11px] text-text-secondary mt-0.5">{alert.desc}</div>
                </div>
              </div>
              <Link href={alert.href} className="text-[11px] font-bold text-primary hover:underline shrink-0">
                Act &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-3 mt-4 border-t border-border text-right text-xs">
        <Link href="/notifications" className="text-text-secondary hover:text-text-primary font-medium">
          View all notifications &rarr;
        </Link>
      </div>
    </div>
  );
}

type ActionItem = { label: string; href: string; icon: typeof BookOpen };

function getPrimaryActions(role: string): ActionItem[] {
  if (role === 'FACULTY') return [
    { label: 'Mark Attendance', href: '/attendance', icon: CalendarDays },
    { label: 'Grade Submissions (28)', href: '/assignments', icon: FileCheck },
    { label: 'Create Quiz', href: '/learning', icon: PlusCircle },
    { label: 'Faculty AI Assistant', href: '/faculty/ai-assistant', icon: Sparkles }
  ];
  if (role === 'STUDENT') return [
    { label: 'Join Live Class', href: '/learning', icon: Video },
    { label: 'Submit Assignment', href: '/student/learning', icon: FileCheck },
    { label: 'Pay Fee Dues', href: '/fees', icon: ReceiptText },
    { label: 'Student AI Assistant', href: '/student/ai-assistant', icon: Sparkles }
  ];
  return [
    { label: 'Approve Admissions', href: '/platform/admissions', icon: CheckCircle2 },
    { label: 'AI Governance', href: '/ai-governance', icon: ShieldCheck },
    { label: 'System Audit Logs', href: '/audit', icon: Activity },
    { label: 'Data Warehouse', href: '/planning/scenarios', icon: Database }
  ];
}

function getPriorityAlerts(role: string) {
  if (role === 'FACULTY') return [
    { title: '28 Assignments Pending Grade', desc: 'CS301 Data Structures Mid-term lab reports', href: '/assignments', urgent: true },
    { title: '2 Students Flagged for Attendance', desc: 'Attendance dropped below 75% threshold', href: '/attendance', urgent: false }
  ];
  if (role === 'STUDENT') return [
    { title: 'Physics Lab Report Due Tomorrow', desc: 'Submit PDF before 11:59 PM', href: '/student/learning', urgent: true },
    { title: 'Semester 4 Exam Schedule Published', desc: 'Hall tickets ready for download', href: '/student/results', urgent: false }
  ];
  return [
    { title: '12 Admission Applications Pending', desc: 'Requires selection committee approval', href: '/platform/admissions', urgent: true },
    { title: 'RAG Knowledge Vector Sync Complete', desc: 'Updated institutional regulations', href: '/ai-governance', urgent: false }
  ];
}

type QuickLink = { href: string; label: string; description: string; icon: typeof BookOpen };

function QuickAccess({ role }: { role: string }) {
  const links = getQuickLinks(role);
  if (links.length === 0) return null;
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm" aria-labelledby="quick-access-title">
      <h2 id="quick-access-title" className="text-base font-bold text-text-primary">Quick access</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href} className="group flex min-h-24 items-start gap-3 rounded-xl border border-border p-4 transition-all hover:bg-surface-muted hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40">
            <Icon size={20} className="mt-0.5 shrink-0 text-primary" />
            <span>
              <span className="block text-sm font-semibold text-text-primary group-hover:text-primary transition-colors">{label}</span>
              <span className="mt-1 block text-xs leading-5 text-text-secondary">{description}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function getQuickLinks(role: string): QuickLink[] {
  if (role === 'STUDENT') return [
    { href: '/student/learning', label: 'My learning', description: 'Courses, lessons, and deadlines', icon: BookOpen },
    { href: '/student/benefits', label: 'Student Benefits & Perks', description: '$3,500+ free developer tools & cloud credits', icon: Gift },
    { href: '/student/results', label: 'Academic results', description: 'Published grades and credits', icon: GraduationCap },
    { href: '/fees', label: 'Fees & Receipts', description: 'Invoices and payment status', icon: ReceiptText },
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
  return (
    <article className="min-w-0 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-text-secondary">{metric.label}</p>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-primary">
          <Icon size={16} />
        </span>
      </div>
      <p className="mt-4 truncate text-2xl font-bold tracking-tight text-text-primary" title={String(metric.value ?? 'No data available')}>
        {metric.value ?? 'No data available'}
      </p>
      <p className="mt-2 min-h-5 text-xs leading-5 text-text-muted flex items-center gap-1">
        <TrendingUp size={13} className="text-success" />
        {metric.detail}
      </p>
    </article>
  );
}

function ActivityPanel({ activity }: { activity: DashboardData['activity'] }) { 
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="font-bold text-text-primary text-base">Recent activity</h2>
      <p className="mt-1 text-sm text-text-secondary">Latest recorded institution events.</p>
      {activity.length === 0 ? (
        <p className="mt-5 rounded-xl bg-surface-muted p-4 text-sm text-text-secondary">There is no recorded activity to show yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {activity.map((item) => (
            <li key={item.id} className="flex items-start gap-3 py-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-text-primary">{item.action}</p>
                <p className="mt-0.5 truncate text-text-secondary">{item.entity}</p>
              </div>
              <time className="shrink-0 text-xs text-text-muted" dateTime={item.createdAt}>
                {formatActivityTime(item.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </section>
  ); 
}

function RoleSummary({ role }: { role: string }) { 
  const summary = role === 'STUDENT' ? 'Keep learning, attendance, results, and fees in one place.' : role === 'FACULTY' ? 'Monitor teaching activity, attendance, and grading work.' : 'Manage the institutional records assigned to your role.'; 
  return (
    <aside className="rounded-2xl border border-border bg-surface p-5 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-soft text-success">
          <ShieldCheck size={20} />
        </div>
        <h2 className="mt-4 font-bold text-text-primary text-base">Role-aware workspace</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{summary}</p>
      </div>

      <div className="mt-5 rounded-xl border border-border bg-surface-muted p-3.5">
        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
          <CheckCircle2 size={16} className="text-success" /> RLS Isolated
        </div>
        <p className="mt-1 text-xs leading-5 text-text-secondary">Only authorized records appear in this dashboard.</p>
      </div>
    </aside>
  ); 
}

function iconForMetric(label: string) { 
  const lower = label.toLowerCase(); 
  if (lower.includes('attendance') || lower.includes('session')) return CalendarDays; 
  if (lower.includes('fee') || lower.includes('collection') || lower.includes('invoice')) return ReceiptText; 
  if (lower.includes('student') || lower.includes('faculty') || lower.includes('user')) return Users; 
  if (lower.includes('course') || lower.includes('submission')) return BookOpen; 
  return Activity; 
}

function formatActivityTime(value: string) { 
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value)); 
}

function DashboardSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Loading dashboard">
      {[0, 1, 2, 3].map((index) => (
        <div key={index} className="h-36 animate-pulse rounded-2xl border border-border bg-surface-muted" />
      ))}
    </div>
  );
}

function EmptyDashboard() {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
      <Database className="mx-auto text-text-muted" size={28} />
      <h2 className="mt-3 text-base font-semibold text-text-primary">No dashboard data available</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-text-secondary">Your role has no published dashboard metrics yet. Use the navigation to access the modules available to you.</p>
    </section>
  );
}

function ErrorState({ message, onRetry }: { message: string; onRetry: () => Promise<void> }) {
  return (
    <section className="rounded-2xl border border-danger/30 bg-danger-soft p-5" role="alert">
      <div className="flex gap-3">
        <AlertCircle className="shrink-0 text-danger" size={20} />
        <div>
          <h2 className="font-semibold text-text-primary">Unable to load dashboard</h2>
          <p className="mt-1 text-sm text-text-secondary">{message}</p>
          <button type="button" onClick={() => void onRetry()} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Try again <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<DashboardData>;
  return typeof candidate.role === 'string' && Array.isArray(candidate.metrics) && Array.isArray(candidate.activity);
}
