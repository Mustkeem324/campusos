'use client';

import Link from 'next/link';
import React from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  Clock3,
  FileCheck2,
  Filter,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UserCheck,
  UsersRound,
  WalletCards,
  XCircle,
  type LucideIcon,
} from 'lucide-react';

type PreviewMode = 'live' | 'loading' | 'empty' | 'error';
type ChartMetric = 'attendance' | 'enrolment' | 'collections';
type DateRange = '7d' | '30d' | 'term';
type Department = 'all' | 'engineering' | 'management' | 'sciences';

type Kpi = {
  label: string;
  value: string;
  change: string;
  detail: string;
  tone: 'positive' | 'neutral' | 'warning';
  icon: LucideIcon;
  sparkline: number[];
};

type ActivityItem = {
  id: string;
  title: string;
  detail: string;
  time: string;
  icon: LucideIcon;
  tone: 'blue' | 'green' | 'amber';
};

type ProjectItem = {
  id: string;
  title: string;
  owner: string;
  due: string;
  progress: number;
  status: 'On track' | 'At risk' | 'Review';
};

const departmentLabels: Record<Department, string> = {
  all: 'All departments',
  engineering: 'Engineering',
  management: 'Management',
  sciences: 'Sciences',
};

const rangeLabels: Record<DateRange, string> = {
  '7d': 'Last 7 days',
  '30d': 'Last 30 days',
  term: 'Current term',
};

const kpiSets: Record<Department, Kpi[]> = {
  all: [
    {
      label: 'Active students',
      value: '12,480',
      change: '+6.8%',
      detail: 'Across 38 programmes',
      tone: 'positive',
      icon: GraduationCap,
      sparkline: [42, 48, 46, 55, 59, 64, 70],
    },
    {
      label: 'Attendance today',
      value: '91.4%',
      change: '+2.1%',
      detail: '1,284 sessions recorded',
      tone: 'positive',
      icon: UserCheck,
      sparkline: [72, 76, 75, 81, 84, 86, 91],
    },
    {
      label: 'Fee collection',
      value: '₹4.82 Cr',
      change: '86% target',
      detail: '₹78.4L pending',
      tone: 'neutral',
      icon: WalletCards,
      sparkline: [35, 41, 49, 54, 61, 72, 86],
    },
    {
      label: 'Open actions',
      value: '34',
      change: '7 urgent',
      detail: 'Approvals and escalations',
      tone: 'warning',
      icon: FileCheck2,
      sparkline: [64, 58, 54, 48, 43, 39, 34],
    },
  ],
  engineering: [
    {
      label: 'Active students',
      value: '5,240',
      change: '+7.4%',
      detail: '14 engineering programmes',
      tone: 'positive',
      icon: GraduationCap,
      sparkline: [38, 42, 46, 51, 57, 62, 68],
    },
    {
      label: 'Attendance today',
      value: '92.8%',
      change: '+2.8%',
      detail: '612 sessions recorded',
      tone: 'positive',
      icon: UserCheck,
      sparkline: [70, 74, 79, 82, 85, 89, 93],
    },
    {
      label: 'Fee collection',
      value: '₹2.14 Cr',
      change: '89% target',
      detail: '₹26.8L pending',
      tone: 'neutral',
      icon: WalletCards,
      sparkline: [41, 47, 52, 59, 67, 78, 89],
    },
    {
      label: 'Open actions',
      value: '12',
      change: '2 urgent',
      detail: 'Labs and academic approvals',
      tone: 'warning',
      icon: FileCheck2,
      sparkline: [39, 33, 29, 24, 20, 15, 12],
    },
  ],
  management: [
    {
      label: 'Active students',
      value: '3,180',
      change: '+5.2%',
      detail: '9 management programmes',
      tone: 'positive',
      icon: GraduationCap,
      sparkline: [44, 46, 49, 53, 57, 61, 65],
    },
    {
      label: 'Attendance today',
      value: '89.6%',
      change: '+1.4%',
      detail: '328 sessions recorded',
      tone: 'positive',
      icon: UserCheck,
      sparkline: [74, 76, 77, 81, 84, 87, 90],
    },
    {
      label: 'Fee collection',
      value: '₹1.46 Cr',
      change: '83% target',
      detail: '₹31.2L pending',
      tone: 'neutral',
      icon: WalletCards,
      sparkline: [31, 38, 44, 52, 60, 72, 83],
    },
    {
      label: 'Open actions',
      value: '9',
      change: '1 urgent',
      detail: 'Reviews and placement tasks',
      tone: 'warning',
      icon: FileCheck2,
      sparkline: [26, 22, 19, 16, 13, 11, 9],
    },
  ],
  sciences: [
    {
      label: 'Active students',
      value: '2,460',
      change: '+4.9%',
      detail: '11 science programmes',
      tone: 'positive',
      icon: GraduationCap,
      sparkline: [40, 43, 46, 49, 53, 57, 61],
    },
    {
      label: 'Attendance today',
      value: '90.7%',
      change: '+1.9%',
      detail: '254 sessions recorded',
      tone: 'positive',
      icon: UserCheck,
      sparkline: [73, 75, 79, 82, 85, 88, 91],
    },
    {
      label: 'Fee collection',
      value: '₹86.2L',
      change: '84% target',
      detail: '₹16.4L pending',
      tone: 'neutral',
      icon: WalletCards,
      sparkline: [36, 41, 47, 55, 63, 74, 84],
    },
    {
      label: 'Open actions',
      value: '8',
      change: '2 urgent',
      detail: 'Research and lab actions',
      tone: 'warning',
      icon: FileCheck2,
      sparkline: [24, 21, 18, 15, 12, 10, 8],
    },
  ],
};

const chartData: Record<ChartMetric, Record<DateRange, number[]>> = {
  attendance: {
    '7d': [84, 88, 86, 91, 89, 93, 91],
    '30d': [76, 79, 82, 80, 84, 86, 85, 88, 90, 89, 92, 91],
    term: [72, 75, 78, 81, 80, 84, 86, 88, 87, 90, 92, 91],
  },
  enrolment: {
    '7d': [46, 52, 58, 62, 68, 74, 82],
    '30d': [35, 39, 43, 48, 52, 58, 64, 69, 73, 78, 83, 88],
    term: [28, 34, 40, 47, 52, 59, 64, 70, 76, 82, 87, 92],
  },
  collections: {
    '7d': [38, 44, 49, 55, 61, 69, 76],
    '30d': [24, 29, 35, 42, 47, 53, 59, 65, 71, 76, 82, 86],
    term: [18, 25, 31, 38, 46, 53, 60, 67, 73, 78, 83, 86],
  },
};

const activities: ActivityItem[] = [
  {
    id: 'attendance',
    title: 'Attendance batch finalised',
    detail: 'Engineering · Semester 4 · 612 records',
    time: '8 min ago',
    icon: UserCheck,
    tone: 'green',
  },
  {
    id: 'invoice',
    title: 'Fee reconciliation completed',
    detail: 'Finance · UPI settlement · ₹18.4L',
    time: '24 min ago',
    icon: WalletCards,
    tone: 'blue',
  },
  {
    id: 'assessment',
    title: 'Assessment results published',
    detail: 'Management · 14 course sections',
    time: '42 min ago',
    icon: BookOpenCheck,
    tone: 'blue',
  },
  {
    id: 'alert',
    title: 'Attendance risk alert created',
    detail: 'Sciences · 18 students below threshold',
    time: '1 hr ago',
    icon: AlertTriangle,
    tone: 'amber',
  },
];

const projects: ProjectItem[] = [
  {
    id: 'admissions',
    title: 'Admissions 2026 readiness',
    owner: 'Admissions Office',
    due: 'Due 12 Aug',
    progress: 78,
    status: 'On track',
  },
  {
    id: 'accreditation',
    title: 'NAAC evidence review',
    owner: 'Quality Cell',
    due: 'Due 18 Aug',
    progress: 62,
    status: 'Review',
  },
  {
    id: 'labs',
    title: 'Engineering lab upgrades',
    owner: 'Facilities Team',
    due: 'Due 22 Aug',
    progress: 44,
    status: 'At risk',
  },
];

const deadlines = [
  { id: 'exam', day: '08', month: 'AUG', title: 'Examination form closes', detail: 'All departments · 5:00 PM' },
  { id: 'payroll', day: '10', month: 'AUG', title: 'Payroll approval window', detail: 'HR and Finance · 2:00 PM' },
  { id: 'council', day: '14', month: 'AUG', title: 'Academic Council meeting', detail: 'Senate Hall · 11:30 AM' },
];

const people = [
  { label: 'Students', value: '12,480', percentage: 74 },
  { label: 'Faculty', value: '824', percentage: 58 },
  { label: 'Staff', value: '436', percentage: 42 },
];

export function CampusCommandCenterSection() {
  const [metric, setMetric] = React.useState<ChartMetric>('attendance');
  const [dateRange, setDateRange] = React.useState<DateRange>('30d');
  const [department, setDepartment] = React.useState<Department>('all');
  const [previewMode, setPreviewMode] = React.useState<PreviewMode>('live');
  const [query, setQuery] = React.useState('');
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredActivities = activities.filter((item) =>
    `${item.title} ${item.detail}`.toLowerCase().includes(normalizedQuery),
  );
  const filteredProjects = projects.filter((item) =>
    `${item.title} ${item.owner} ${item.status}`.toLowerCase().includes(normalizedQuery),
  );
  const filteredDeadlines = deadlines.filter((item) =>
    `${item.title} ${item.detail}`.toLowerCase().includes(normalizedQuery),
  );

  const effectiveMode: PreviewMode =
    previewMode === 'live' && normalizedQuery &&
    filteredActivities.length === 0 &&
    filteredProjects.length === 0 &&
    filteredDeadlines.length === 0
      ? 'empty'
      : isRefreshing
        ? 'loading'
        : previewMode;

  const refresh = () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    window.setTimeout(() => setIsRefreshing(false), 700);
  };

  return (
    <section className="border-y border-[#DCE4EE] bg-[#F3F6FA] py-16 sm:py-20 lg:py-24" aria-labelledby="command-center-heading">
      <div className="mx-auto w-full max-w-[1440px] px-4 sm:px-6 lg:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)]">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C7D6EC] bg-white px-3.5 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] shadow-sm">
              <LayoutDashboard className="h-4 w-4" aria-hidden="true" />
              Unified campus command centre
            </div>
            <h2 id="command-center-heading" className="mt-5 max-w-3xl text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] sm:text-4xl lg:text-[46px] lg:leading-[1.08]">
              A clear home page for every important campus signal.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
              Monitor performance, people, tasks, alerts and deadlines without jumping between disconnected systems. The interface stays structured, readable and responsive at every screen size.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Benefit icon={Sparkles} title="Easy to scan" detail="Strong hierarchy and focused cards" />
            <Benefit icon={ShieldCheck} title="Role aware" detail="Only relevant actions and data" />
            <Benefit icon={Activity} title="Always current" detail="Filters, refresh and clear states" />
          </div>
        </div>

        <div className="mt-10 overflow-hidden rounded-[28px] border border-[#C9D5E4] bg-white shadow-[0_28px_80px_rgba(16,29,56,0.14)] sm:rounded-[32px]">
          <DashboardToolbar
            query={query}
            onQueryChange={setQuery}
            department={department}
            onDepartmentChange={setDepartment}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            onRefresh={refresh}
            refreshing={isRefreshing}
          />

          <div className="bg-[#F4F7FB] p-4 sm:p-6 lg:p-8">
            {effectiveMode === 'loading' && <LoadingState />}
            {effectiveMode === 'error' && <ErrorState onRetry={() => setPreviewMode('live')} />}
            {effectiveMode === 'empty' && <EmptyState query={query} onReset={() => { setQuery(''); setPreviewMode('live'); }} />}
            {effectiveMode === 'live' && (
              <LiveDashboard
                kpis={kpiSets[department]}
                metric={metric}
                onMetricChange={setMetric}
                dateRange={dateRange}
                department={department}
                activities={filteredActivities}
                projects={filteredProjects}
                deadlines={filteredDeadlines}
              />
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-[#D3DEEB] bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-sm font-extrabold text-[#101D38]">Designed for real institutional workflows</p>
            <p className="mt-1 text-sm leading-6 text-[#667085]">The dashboard preview uses reusable patterns that scale across student, faculty, finance, HR and leadership workspaces.</p>
          </div>
          <Link href="/login" className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_8px_22px_rgba(23,84,232,0.25)] transition hover:bg-[#1247C7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 focus-visible:ring-offset-2">
            Explore the live platform
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function DashboardToolbar({
  query,
  onQueryChange,
  department,
  onDepartmentChange,
  dateRange,
  onDateRangeChange,
  previewMode,
  onPreviewModeChange,
  onRefresh,
  refreshing,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  department: Department;
  onDepartmentChange: (value: Department) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  previewMode: PreviewMode;
  onPreviewModeChange: (value: PreviewMode) => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <header className="border-b border-[#DCE4EE] bg-white p-4 sm:p-5 lg:px-7">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#101D38] text-white shadow-[0_8px_18px_rgba(16,29,56,0.2)]">
            <LayoutDashboard className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-extrabold text-[#101D38] sm:text-base">Institution overview</p>
            <p className="mt-0.5 truncate text-xs text-[#667085]">CampusOS Demo University · Updated just now</p>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_auto_auto_auto_auto] xl:min-w-[760px]">
          <label className="relative sm:col-span-2 lg:col-span-1">
            <span className="sr-only">Search dashboard</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C899B]" aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search activity, tasks or deadlines"
              className="h-11 w-full rounded-xl border border-[#CBD7E6] bg-[#F8FAFC] pl-10 pr-3 text-sm font-semibold text-[#101D38] outline-none transition placeholder:font-normal placeholder:text-[#8A95A6] focus:border-[#1754E8] focus:bg-white focus:ring-2 focus:ring-[#1754E8]/15"
            />
          </label>

          <SelectControl icon={Filter} label="Department" value={department} onChange={(value) => onDepartmentChange(value as Department)}>
            {Object.entries(departmentLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectControl>

          <SelectControl icon={CalendarClock} label="Date range" value={dateRange} onChange={(value) => onDateRangeChange(value as DateRange)}>
            {Object.entries(rangeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </SelectControl>

          <SelectControl icon={Activity} label="Preview state" value={previewMode} onChange={(value) => onPreviewModeChange(value as PreviewMode)}>
            <option value="live">Live data</option>
            <option value="loading">Loading</option>
            <option value="empty">Empty</option>
            <option value="error">Error</option>
          </SelectControl>

          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#CBD7E6] bg-white px-3.5 text-sm font-extrabold text-[#344054] transition hover:border-[#1754E8] hover:text-[#1754E8] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span className="lg:hidden 2xl:inline">Refresh</span>
          </button>

          <button type="button" className="relative inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#CBD7E6] bg-white text-[#344054] transition hover:border-[#1754E8] hover:text-[#1754E8] sm:w-11" aria-label="Open notifications">
            <Bell className="h-4.5 w-4.5" aria-hidden="true" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-[#D92D20]" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

function SelectControl({ icon: Icon, label, value, onChange, children }: { icon: LucideIcon; label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="relative">
      <span className="sr-only">{label}</span>
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C899B]" aria-hidden="true" />
      <select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full appearance-none rounded-xl border border-[#CBD7E6] bg-white pl-9 pr-8 text-xs font-extrabold text-[#344054] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15">
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C899B]" aria-hidden="true" />
    </label>
  );
}

function LiveDashboard({ kpis, metric, onMetricChange, dateRange, department, activities: activityItems, projects: projectItems, deadlines: deadlineItems }: {
  kpis: Kpi[];
  metric: ChartMetric;
  onMetricChange: (metric: ChartMetric) => void;
  dateRange: DateRange;
  department: Department;
  activities: ActivityItem[];
  projects: ProjectItem[];
  deadlines: typeof deadlines;
}) {
  return (
    <div className="space-y-5 lg:space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key performance indicators">
        {kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
      </section>

      <div className="grid gap-5 xl:grid-cols-12 xl:gap-6">
        <PerformanceChart metric={metric} onMetricChange={onMetricChange} dateRange={dateRange} department={department} />
        <AlertsPanel />
      </div>

      <div className="grid gap-5 xl:grid-cols-12 xl:gap-6">
        <ProjectProgress items={projectItems} />
        <PeopleOverview />
        <RecentActivity items={activityItems} />
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)] lg:gap-6">
        <UpcomingDeadlines items={deadlineItems} />
        <QuickActions />
      </div>
    </div>
  );
}

function KpiCard({ kpi }: { kpi: Kpi }) {
  const Icon = kpi.icon;
  const toneClass = {
    positive: 'bg-[#ECFDF3] text-[#027A48]',
    neutral: 'bg-[#EDF3FF] text-[#1754E8]',
    warning: 'bg-[#FFF7E8] text-[#B54708]',
  }[kpi.tone];

  return (
    <article className="min-w-0 rounded-[20px] border border-[#D6E0EC] bg-white p-4 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold ${toneClass}`}>{kpi.change}</span>
      </div>
      <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.08em] text-[#7C899B]">{kpi.label}</p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] sm:text-[28px]">{kpi.value}</p>
          <p className="mt-1 truncate text-xs text-[#7C899B]">{kpi.detail}</p>
        </div>
        <Sparkline values={kpi.sparkline} />
      </div>
    </article>
  );
}

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * 72},${28 - ((value - min) / range) * 22}`).join(' ');

  return (
    <svg viewBox="0 0 72 30" className="h-8 w-[72px] shrink-0" role="img" aria-label="Recent trend">
      <polyline points={points} fill="none" stroke="#1754E8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PerformanceChart({ metric, onMetricChange, dateRange, department }: { metric: ChartMetric; onMetricChange: (metric: ChartMetric) => void; dateRange: DateRange; department: Department }) {
  const values = chartData[metric][dateRange];
  const labels: Record<ChartMetric, { title: string; summary: string; suffix: string }> = {
    attendance: { title: 'Attendance performance', summary: '91.4% average', suffix: '%' },
    enrolment: { title: 'Enrolment momentum', summary: '88% capacity', suffix: '%' },
    collections: { title: 'Collection performance', summary: '86% target', suffix: '%' },
  };

  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-6 xl:col-span-8" aria-labelledby="performance-chart-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]">Performance summary</p>
          <h3 id="performance-chart-heading" className="mt-1.5 text-lg font-extrabold text-[#101D38]">{labels[metric].title}</h3>
          <p className="mt-1 text-xs text-[#7C899B]">{departmentLabels[department]} · {rangeLabels[dateRange]}</p>
        </div>
        <div className="inline-flex rounded-xl border border-[#D3DEEB] bg-[#F4F7FB] p-1" role="tablist" aria-label="Performance metric">
          {(['attendance', 'enrolment', 'collections'] as ChartMetric[]).map((item) => (
            <button key={item} type="button" role="tab" aria-selected={metric === item} onClick={() => onMetricChange(item)} className={`min-h-9 rounded-lg px-3 text-[11px] font-extrabold capitalize transition ${metric === item ? 'bg-white text-[#1754E8] shadow-sm' : 'text-[#667085] hover:text-[#101D38]'}`}>
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-3xl font-extrabold tracking-[-0.04em] text-[#101D38]">{labels[metric].summary}</p>
          <p className="mt-1 inline-flex items-center gap-1.5 text-xs font-bold text-[#027A48]">
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
            Improved 4.2% over previous period
          </p>
        </div>
        <div className="hidden items-center gap-4 text-[10px] font-bold text-[#667085] sm:flex" aria-label="Chart legend">
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#1754E8]" />Current</span>
          <span className="inline-flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#B9C7DB]" />Target</span>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E0E7F0] bg-[#F8FAFC] p-3 sm:p-4">
        <svg viewBox="0 0 720 230" className="h-[210px] w-full" role="img" aria-label={`${labels[metric].title} chart`}>
          {[30, 75, 120, 165, 210].map((y) => <line key={y} x1="38" x2="700" y1={y} y2={y} stroke="#DDE5EF" strokeWidth="1" />)}
          <line x1="38" x2="700" y1="65" y2="65" stroke="#A9B8CC" strokeWidth="2" strokeDasharray="6 7" />
          {values.map((value, index) => {
            const slot = 640 / values.length;
            const width = Math.min(34, slot * 0.55);
            const x = 50 + index * slot + (slot - width) / 2;
            const height = (value / 100) * 155;
            const y = 210 - height;
            return (
              <g key={`${index}-${value}`}>
                <rect x={x} y={y} width={width} height={height} rx="8" fill="#1754E8">
                  <title>{`Period ${index + 1}: ${value}${labels[metric].suffix}`}</title>
                </rect>
                {(index === 0 || index === values.length - 1 || index === Math.floor(values.length / 2)) && (
                  <text x={x + width / 2} y="225" textAnchor="middle" fontSize="10" fontWeight="700" fill="#7C899B">{index === 0 ? 'Start' : index === values.length - 1 ? 'Now' : 'Mid'}</text>
                )}
              </g>
            );
          })}
          <text x="8" y="34" fontSize="10" fontWeight="700" fill="#7C899B">100</text>
          <text x="14" y="124" fontSize="10" fontWeight="700" fill="#7C899B">50</text>
          <text x="20" y="214" fontSize="10" fontWeight="700" fill="#7C899B">0</text>
        </svg>
      </div>
    </section>
  );
}

function AlertsPanel() {
  const alerts = [
    { title: '7 approvals need attention', detail: 'Finance and academic workflows', tone: 'danger' as const },
    { title: '18 students below attendance threshold', detail: 'Advisors have been notified', tone: 'warning' as const },
    { title: 'All scheduled backups completed', detail: 'Last verified at 04:30 AM', tone: 'success' as const },
  ];

  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-6 xl:col-span-4" aria-labelledby="alerts-heading">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]">Priority queue</p>
          <h3 id="alerts-heading" className="mt-1.5 text-lg font-extrabold text-[#101D38]">Alerts and notices</h3>
        </div>
        <span className="rounded-full bg-[#FEF3F2] px-2.5 py-1 text-[10px] font-extrabold text-[#B42318]">7 urgent</span>
      </div>
      <div className="mt-5 space-y-3">
        {alerts.map((alert) => <AlertRow key={alert.title} {...alert} />)}
      </div>
      <button type="button" className="mt-5 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD7E6] bg-white px-4 text-xs font-extrabold text-[#344054] transition hover:border-[#1754E8] hover:text-[#1754E8]">
        Review all alerts
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </section>
  );
}

function AlertRow({ title, detail, tone }: { title: string; detail: string; tone: 'danger' | 'warning' | 'success' }) {
  const config = {
    danger: { icon: CircleAlert, iconClass: 'bg-[#FEF3F2] text-[#D92D20]' },
    warning: { icon: AlertTriangle, iconClass: 'bg-[#FFF7E8] text-[#B54708]' },
    success: { icon: CheckCircle2, iconClass: 'bg-[#ECFDF3] text-[#027A48]' },
  }[tone];
  const Icon = config.icon;

  return (
    <article className="flex items-start gap-3 rounded-2xl border border-[#E0E7F0] bg-[#F8FAFC] p-3.5">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.iconClass}`}><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold leading-5 text-[#101D38]">{title}</p>
        <p className="mt-0.5 text-[11px] leading-5 text-[#7C899B]">{detail}</p>
      </div>
    </article>
  );
}

function ProjectProgress({ items }: { items: ProjectItem[] }) {
  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-6 xl:col-span-5" aria-labelledby="projects-heading">
      <SectionTitle eyebrow="Task and project progress" title="Priority initiatives" id="projects-heading" />
      <div className="mt-5 space-y-4">
        {items.map((item) => (
          <article key={item.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-[#101D38]">{item.title}</p>
                <p className="mt-1 truncate text-[11px] text-[#7C899B]">{item.owner} · {item.due}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${item.status === 'On track' ? 'bg-[#ECFDF3] text-[#027A48]' : item.status === 'At risk' ? 'bg-[#FEF3F2] text-[#B42318]' : 'bg-[#FFF7E8] text-[#B54708]'}`}>{item.status}</span>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#E6EBF2]" role="progressbar" aria-label={`${item.title} ${item.progress}% complete`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={item.progress}>
                <div className="h-full rounded-full bg-[#1754E8]" style={{ width: `${item.progress}%` }} />
              </div>
              <span className="w-9 text-right text-xs font-extrabold text-[#344054]">{item.progress}%</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function PeopleOverview() {
  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-6 xl:col-span-3" aria-labelledby="people-heading">
      <SectionTitle eyebrow="Employee and user overview" title="Campus community" id="people-heading" />
      <div className="mt-5 space-y-4">
        {people.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[#667085]">{item.label}</span>
              <span className="text-sm font-extrabold text-[#101D38]">{item.value}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E6EBF2]">
              <div className="h-full rounded-full bg-[#1754E8]" style={{ width: `${item.percentage}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-[#D9E3EF] bg-[#F4F7FB] p-3.5">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1754E8]"><UsersRound className="h-4.5 w-4.5" aria-hidden="true" /></span>
          <div>
            <p className="text-xs font-extrabold text-[#101D38]">98.7% profiles verified</p>
            <p className="mt-0.5 text-[10px] text-[#7C899B]">Identity and role checks complete</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-6 xl:col-span-4" aria-labelledby="activity-heading">
      <SectionTitle eyebrow="Recent activity" title="Latest updates" id="activity-heading" />
      <div className="mt-4 divide-y divide-[#E2E8F0]">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const toneClass = item.tone === 'green' ? 'bg-[#ECFDF3] text-[#027A48]' : item.tone === 'amber' ? 'bg-[#FFF7E8] text-[#B54708]' : 'bg-[#EDF3FF] text-[#1754E8]';
          return (
            <article key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${toneClass}`}><Icon className="h-4 w-4" aria-hidden="true" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-extrabold text-[#101D38]">{item.title}</p>
                <p className="mt-1 truncate text-[10px] text-[#7C899B]">{item.detail}</p>
              </div>
              <span className="shrink-0 text-[9px] font-bold text-[#98A2B3]">{item.time}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function UpcomingDeadlines({ items }: { items: typeof deadlines }) {
  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-6" aria-labelledby="deadlines-heading">
      <div className="flex items-center justify-between gap-4">
        <SectionTitle eyebrow="Upcoming events and deadlines" title="What is next" id="deadlines-heading" />
        <button type="button" className="hidden min-h-9 items-center gap-2 rounded-xl border border-[#CBD7E6] px-3 text-[11px] font-extrabold text-[#344054] transition hover:border-[#1754E8] hover:text-[#1754E8] sm:inline-flex">
          View calendar
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {items.map((item) => (
          <article key={item.id} className="flex items-center gap-3 rounded-2xl border border-[#E0E7F0] bg-[#F8FAFC] p-3.5">
            <span className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-[#101D38] text-white">
              <span className="text-sm font-extrabold leading-none">{item.day}</span>
              <span className="mt-1 text-[8px] font-extrabold tracking-[0.08em] text-[#B7C4D8]">{item.month}</span>
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[#101D38]">{item.title}</p>
              <p className="mt-1 truncate text-[10px] text-[#7C899B]">{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function QuickActions() {
  const actions = [
    { label: 'Create notice', icon: Bell },
    { label: 'Review approvals', icon: FileCheck2 },
    { label: 'Open reports', icon: Activity },
    { label: 'Manage users', icon: UsersRound },
  ];

  return (
    <section className="rounded-[22px] border border-[#D6E0EC] bg-[#101D38] p-5 text-white shadow-[0_10px_28px_rgba(16,29,56,0.12)] sm:p-6" aria-labelledby="quick-actions-heading">
      <p className="text-[11px] font-extrabold uppercase tracking-[0.1em] text-[#9DB8E5]">Quick actions</p>
      <h3 id="quick-actions-heading" className="mt-1.5 text-lg font-extrabold">Start common work faster</h3>
      <div className="mt-5 grid grid-cols-2 gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button key={action.label} type="button" className="flex min-h-20 flex-col items-start justify-between rounded-2xl border border-[#355078] bg-[#172A4D] p-3 text-left transition hover:border-[#6D8EBD] hover:bg-[#1C3159]">
              <Icon className="h-4.5 w-4.5 text-[#AFC6EA]" aria-hidden="true" />
              <span className="text-[11px] font-extrabold leading-4 text-white">{action.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <div className="space-y-5" aria-live="polite" aria-busy="true">
      <div className="flex min-h-44 flex-col items-center justify-center rounded-[22px] border border-[#D6E0EC] bg-white p-8 text-center shadow-sm">
        <Loader2 className="h-7 w-7 animate-spin text-[#1754E8]" aria-hidden="true" />
        <p className="mt-4 text-sm font-extrabold text-[#101D38]">Refreshing dashboard data</p>
        <p className="mt-1 text-xs text-[#7C899B]">Securely loading the latest campus signals.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => <div key={item} className="h-44 animate-pulse rounded-[20px] border border-[#DCE4EE] bg-white"><div className="m-5 h-8 w-8 rounded-xl bg-[#E8EDF4]" /><div className="mx-5 mt-8 h-4 w-24 rounded bg-[#E8EDF4]" /><div className="mx-5 mt-3 h-7 w-32 rounded bg-[#E8EDF4]" /></div>)}
      </div>
    </div>
  );
}

function EmptyState({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <div className="flex min-h-[430px] flex-col items-center justify-center rounded-[22px] border border-dashed border-[#BCCBDE] bg-white p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8]"><Search className="h-6 w-6" aria-hidden="true" /></span>
      <h3 className="mt-5 text-xl font-extrabold text-[#101D38]">No matching dashboard items</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">{query ? `No activity, project or deadline matches “${query}”.` : 'There is no data available for the selected filters yet.'}</p>
      <button type="button" onClick={onReset} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white transition hover:bg-[#1247C7]">
        Clear filters
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex min-h-[430px] flex-col items-center justify-center rounded-[22px] border border-[#F3C7C3] bg-white p-8 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FEF3F2] text-[#D92D20]"><XCircle className="h-6 w-6" aria-hidden="true" /></span>
      <h3 className="mt-5 text-xl font-extrabold text-[#101D38]">Dashboard data could not load</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-[#667085]">Your existing data is safe. Check the connection and retry without losing filters or navigation state.</p>
      <button type="button" onClick={onRetry} className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white transition hover:bg-[#1247C7]">
        Try again
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}

function Benefit({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
  return (
    <article className="rounded-2xl border border-[#D6E0EC] bg-white p-4 shadow-[0_8px_22px_rgba(16,29,56,0.05)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4.5 w-4.5" aria-hidden="true" /></span>
      <p className="mt-4 text-sm font-extrabold text-[#101D38]">{title}</p>
      <p className="mt-1 text-xs leading-5 text-[#7C899B]">{detail}</p>
    </article>
  );
}

function SectionTitle({ eyebrow, title, id }: { eyebrow: string; title: string; id: string }) {
  return (
    <div>
      <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]">{eyebrow}</p>
      <h3 id={id} className="mt-1.5 text-base font-extrabold text-[#101D38] sm:text-lg">{title}</h3>
    </div>
  );
}
