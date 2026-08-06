'use client';

import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  Clock3,
  GraduationCap,
  Landmark,
  LifeBuoy,
  ReceiptText,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  WalletCards,
} from 'lucide-react';

import type { AdminDashboardData } from '@/lib/dashboard/contracts';

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function safePercentage(value: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const totalUsers = Math.max(0, data.userSummary.total);
  const accountedUsers =
    data.userSummary.students +
    data.userSummary.faculty +
    data.userSummary.parents;
  const otherUsers = Math.max(0, totalUsers - accountedUsers);

  const distribution = [
    {
      label: 'Students',
      value: data.userSummary.students,
      percentage: safePercentage(data.userSummary.students, totalUsers),
      tone: 'bg-[#1754E8]',
    },
    {
      label: 'Faculty',
      value: data.userSummary.faculty,
      percentage: safePercentage(data.userSummary.faculty, totalUsers),
      tone: 'bg-[#078A57]',
    },
    {
      label: 'Parents / guardians',
      value: data.userSummary.parents,
      percentage: safePercentage(data.userSummary.parents, totalUsers),
      tone: 'bg-[#E56A00]',
    },
    {
      label: 'Administrators and staff',
      value: otherUsers,
      percentage: safePercentage(otherUsers, totalUsers),
      tone: 'bg-[#7C3AED]',
    },
  ];

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6" aria-label="Administrator dashboard">
      <header className="min-w-0 overflow-hidden rounded-[24px] border border-[#D9E3F0] bg-white shadow-[0_18px_48px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950 sm:rounded-[28px]">
        <div className="grid min-w-0 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
          <div className="min-w-0 p-5 sm:p-7 lg:p-8">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#1754E8] text-base font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.28)]">
                  {initials(data.identity.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] sm:text-xs">
                    Institution administration
                  </p>
                  <h1 className="mt-2 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] dark:text-white sm:text-3xl lg:text-[34px]">
                    Welcome back, {data.identity.name}
                  </h1>
                  <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085] dark:text-slate-400">
                    Review institutional users, academics, finance, support and priority actions from one accountable workspace.
                  </p>
                </div>
              </div>

              <span className="inline-flex min-h-9 shrink-0 items-center gap-2 self-start rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-xs font-extrabold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                System operational
              </span>
            </div>

            <div className="mt-6 flex min-w-0 flex-wrap items-center gap-2">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                {data.identity.title}
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <UserRoundCheck className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                {data.academicsSummary.enrollments} active enrolments
              </span>
              <span className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D9E3F0] bg-[#F7F9FC] px-3 text-xs font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                <Sparkles className="h-4 w-4 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
                Tenant-scoped data
              </span>
            </div>
          </div>

          <aside className="border-t border-[#263D61] bg-[#101D38] p-5 text-white sm:p-7 xl:border-l xl:border-t-0 xl:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9EBBEE]">
              Quick actions
            </p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {data.quickActions.slice(0, 4).map((action) => (
                <Link
                  key={`${action.href}-${action.label}`}
                  href={action.href}
                  className="group flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl border border-[#385477] bg-[#0D1A2E] px-3.5 py-2.5 text-sm font-bold text-white transition hover:border-[#5E7CA6] hover:bg-[#172A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8FB3FF]"
                >
                  <span className="truncate">{action.label}</span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#9EBBEE] transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </header>

      <AlertSection alerts={data.riskAlerts} />

      <section
        className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-4"
        aria-label="Institution summary"
      >
        {data.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] xl:gap-6">
        <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            icon={Landmark}
            eyebrow="Institution overview"
            title="Users and academic structure"
          />

          <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label="Students" value={data.userSummary.students} icon={GraduationCap} />
            <StatTile label="Faculty" value={data.userSummary.faculty} icon={Users} />
            <StatTile label="Parents / guardians" value={data.userSummary.parents} icon={UserRoundCheck} />
            <StatTile label="Departments" value={data.academicsSummary.departments} icon={Building2} />
            <StatTile label="Courses" value={data.academicsSummary.courses} icon={BookOpenCheck} />
            <StatTile label="Course offerings" value={data.academicsSummary.courseOfferings} icon={ClipboardList} />
          </div>
        </section>

        <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
          <SectionHeading
            icon={Users}
            eyebrow="Account composition"
            title="User distribution"
          />

          <div className="mt-5 space-y-4">
            {distribution.map((item) => (
              <div key={item.label} className="min-w-0">
                <div className="flex min-w-0 items-center justify-between gap-3 text-xs">
                  <span className="truncate font-bold text-[#536175] dark:text-slate-300">{item.label}</span>
                  <span className="shrink-0 font-extrabold text-[#101D38] dark:text-white">
                    {item.value} · {item.percentage}%
                  </span>
                </div>
                <div
                  className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9EEF5] dark:bg-slate-800"
                  role="progressbar"
                  aria-label={`${item.label}: ${item.percentage}%`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.percentage}
                >
                  <div className={`h-full rounded-full ${item.tone}`} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-12 xl:gap-6">
        <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5">
          <SectionHeading
            icon={ReceiptText}
            eyebrow="Finance"
            title="Financial overview"
            href="/receipts"
          />
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <FinanceRow label="Recorded collections" value={formatCurrency(data.financeSummary.collectedAmount)} />
            <FinanceRow label="Outstanding fees" value={formatCurrency(data.financeSummary.outstandingAmount)} />
            <FinanceRow label="Paid transactions" value={String(data.financeSummary.paymentCount)} />
            <FinanceRow label="Invoices issued" value={String(data.financeSummary.invoiceCount)} />
          </div>
        </section>

        <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7">
          <SectionHeading
            icon={WalletCards}
            eyebrow="Navigation"
            title="Quick access"
          />
          <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {adminModules.map((module) => (
              <Link
                key={module.href}
                href={module.href}
                className="group flex min-h-24 min-w-0 items-start gap-3 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 transition hover:-translate-y-0.5 hover:border-[#B7C9E1] hover:bg-[#EDF3FF] hover:shadow-[0_12px_28px_rgba(16,29,56,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-blue-950/30"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#1754E8] shadow-sm dark:bg-slate-950 dark:text-blue-300">
                  <module.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-[#101D38] group-hover:text-[#1754E8] dark:text-white dark:group-hover:text-blue-300">
                    {module.label}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#667085] dark:text-slate-400">
                    {module.description}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <div className="grid min-w-0 gap-5 xl:grid-cols-12 xl:gap-6">
        <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7">
          <SectionHeading
            icon={ClipboardList}
            eyebrow="Communication"
            title="Institutional notices"
            href="/notifications"
          />
          {data.notices.length === 0 ? (
            <EmptyState message="No notices have been published yet." />
          ) : (
            <ul className="mt-5 space-y-3">
              {data.notices.map((notice) => (
                <li key={notice.id} className="min-w-0 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">{notice.title}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{notice.content}</p>
                  <p className="mt-3 text-[11px] text-[#8A95A6] dark:text-slate-500">{formatDate(notice.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5">
          <SectionHeading
            icon={Clock3}
            eyebrow="Audit trail"
            title="Recent activity"
            href="/audit"
          />
          {data.recentActivity.length === 0 ? (
            <EmptyState message="There is no recorded activity to show yet." />
          ) : (
            <ul className="mt-5 divide-y divide-[#E1E7EF] dark:divide-slate-800">
              {data.recentActivity.map((item) => (
                <li key={item.id} className="flex min-w-0 items-start gap-3 py-3.5">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1754E8]" aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#101D38] dark:text-white">{item.action}</p>
                    <p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">{item.entity}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="min-w-0 rounded-[22px] border border-[#D9E3F0] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <SectionHeading
          icon={LifeBuoy}
          eyebrow="Support"
          title="Support cases"
          href="/support/cases"
        />
        {data.supportCases.length === 0 ? (
          <EmptyState message="No support cases are open for this institution." />
        ) : (
          <ul className="mt-5 grid min-w-0 gap-3 lg:grid-cols-2">
            {data.supportCases.map((supportCase) => (
              <li key={supportCase.id} className="min-w-0 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">{supportCase.title}</p>
                    <p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">
                      {supportCase.caseNumber} · {supportCase.category} · {supportCase.priority}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                    {supportCase.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

const adminModules = [
  {
    label: 'Admissions Hub',
    href: '/platform/admissions',
    icon: GraduationCap,
    description: 'Applications, enrolment and applicant workflows.',
  },
  {
    label: 'Departments',
    href: '/departments',
    icon: Building2,
    description: 'Academic units, programmes and ownership.',
  },
  {
    label: 'Audit Logs',
    href: '/audit',
    icon: Clock3,
    description: 'Review important institutional activity.',
  },
  {
    label: 'Security Settings',
    href: '/settings',
    icon: ShieldCheck,
    description: 'Identity, roles and platform configuration.',
  },
  {
    label: 'Finance',
    href: '/receipts',
    icon: ReceiptText,
    description: 'Collections, invoices and outstanding balances.',
  },
  {
    label: 'Support',
    href: '/support/cases',
    icon: LifeBuoy,
    description: 'Institutional cases and service follow-up.',
  },
] as const;

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
    <section aria-label="Action required" className="min-w-0 space-y-3">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          role="alert"
          className={`flex min-w-0 items-start gap-3 rounded-2xl border p-4 ${
            alert.level === 'danger'
              ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/20'
              : alert.level === 'warning'
                ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20'
                : 'border-[#D9E3F0] bg-white dark:border-slate-800 dark:bg-slate-950'
          }`}
        >
          <AlertCircle
            className={`mt-0.5 h-5 w-5 shrink-0 ${
              alert.level === 'danger'
                ? 'text-rose-600'
                : alert.level === 'warning'
                  ? 'text-amber-600'
                  : 'text-[#1754E8]'
            }`}
            aria-hidden="true"
          />
          <p className="min-w-0 flex-1 text-sm font-bold text-[#101D38] dark:text-white">{alert.message}</p>
          {alert.href && (
            <Link href={alert.href} className="shrink-0 text-xs font-extrabold text-[#1754E8] hover:underline dark:text-blue-300">
              Review
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}

function MetricCard({ metric }: { metric: AdminDashboardData['metrics'][number] }) {
  const toneClass = {
    neutral: 'border-[#D9E3F0] bg-white dark:border-slate-800 dark:bg-slate-950',
    positive: 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/20',
    warning: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
    danger: 'border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20',
  }[metric.tone ?? 'neutral'];

  return (
    <article className={`min-w-0 rounded-[20px] border p-4 shadow-[0_10px_28px_rgba(16,29,56,0.05)] sm:p-5 ${toneClass}`}>
      <p className="truncate text-xs font-extrabold uppercase tracking-[0.08em] text-[#667085] dark:text-slate-400">{metric.label}</p>
      <p className="mt-3 truncate text-2xl font-extrabold tracking-[-0.035em] text-[#101D38] dark:text-white sm:text-[28px]">{metric.value}</p>
      <p className="mt-2 min-h-5 line-clamp-2 text-xs leading-5 text-[#8A95A6] dark:text-slate-500">{metric.detail}</p>
    </article>
  );
}

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Users;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1754E8] shadow-sm dark:bg-slate-950 dark:text-blue-300">
          <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
        </span>
        <span className="text-xl font-extrabold tracking-[-0.03em] text-[#101D38] dark:text-white">{value}</span>
      </div>
      <p className="mt-3 truncate text-xs font-bold text-[#667085] dark:text-slate-400">{label}</p>
    </div>
  );
}

function FinanceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-4 rounded-2xl border border-[#E1E7EF] bg-[#F7F9FC] px-4 py-3.5 dark:border-slate-800 dark:bg-slate-900">
      <p className="min-w-0 truncate text-xs font-bold text-[#667085] dark:text-slate-400">{label}</p>
      <p className="shrink-0 text-sm font-extrabold text-[#101D38] dark:text-white">{value}</p>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  eyebrow,
  title,
  href,
}: {
  icon: typeof Users;
  eyebrow: string;
  title: string;
  href?: string;
}) {
  return (
    <div className="flex min-w-0 items-start justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/50 dark:text-blue-300">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#8A95A6] dark:text-slate-500">{eyebrow}</p>
          <h2 className="mt-1 truncate text-base font-extrabold text-[#101D38] dark:text-white sm:text-lg">{title}</h2>
        </div>
      </div>
      {href && (
        <Link href={href} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] dark:text-blue-300 dark:hover:bg-blue-950/40">
          View all
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-[#CBD5E1] bg-[#F8FAFC] p-6 text-center dark:border-slate-700 dark:bg-slate-900">
      <CheckCircle2 className="mx-auto h-6 w-6 text-[#8A95A6]" aria-hidden="true" />
      <p className="mt-3 text-sm font-semibold text-[#667085] dark:text-slate-400">{message}</p>
    </div>
  );
}
