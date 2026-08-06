import Link from 'next/link';
import React from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  CircleAlert,
  ExternalLink,
  LayoutDashboard,
  LifeBuoy,
  MonitorSmartphone,
  Settings2,
  ShieldCheck,
} from 'lucide-react';

import type { AccountSidebarOverview } from '../../lib/account-sidebar';
import type {
  EditableWidgetDefinition,
  EditableWidgetPlacement,
} from '../../lib/dashboard-layout-editor';
import styles from './DashboardLayoutBuilder.module.css';

type ActiveLayout = {
  id: string;
  name: string;
  source: 'default' | 'custom';
  version: number;
  widgets: EditableWidgetPlacement[];
  updatedAt: string;
};

type PersonalDashboardViewProps = {
  roleLabel: string;
  activeLayout: ActiveLayout | null;
  catalog: EditableWidgetDefinition[];
  account: AccountSidebarOverview;
};

const widgetDestinations: Record<string, { href: string; label: string }> = {
  'account-summary': { href: '/profile', label: 'Open profile' },
  'notification-inbox': { href: '/notifications', label: 'Open notifications' },
  'recent-activity': { href: '/profile', label: 'Review account activity' },
  'quick-actions': { href: '/phase-7', label: 'Open command centre' },
  'today-timetable': { href: '/timetable', label: 'Open timetable' },
  'attendance-overview': { href: '/attendance', label: 'Open attendance' },
  'assignment-deadlines': { href: '/assignments', label: 'Open assignments' },
  'result-summary': { href: '/results', label: 'Open results' },
  'fee-status': { href: '/payments', label: 'Open payments' },
  'approvals-queue': { href: '/phase-7#actions', label: 'Open approvals' },
  'institution-kpis': { href: '/dashboard', label: 'Open role dashboard' },
  'staff-workload': { href: '/departments', label: 'Open departments' },
  'finance-aging': { href: '/phase-7#finance', label: 'Open finance centre' },
  'admissions-pipeline': { href: '/platform/admissions', label: 'Open admissions' },
  'placement-pipeline': { href: '/recruitment', label: 'Open placement workspace' },
  'hostel-occupancy': { href: '/hostel', label: 'Open hostel operations' },
  'transport-status': { href: '/transport', label: 'Open transport operations' },
  'library-circulation': { href: '/opac', label: 'Open library' },
  'student-success': { href: '/phase-7#student-success', label: 'Open student success' },
  'reports-shortcuts': { href: '/phase-7#reports', label: 'Open reports' },
  'audit-events': { href: '/audit', label: 'Open audit log' },
  'system-health': { href: '/settings', label: 'Open system settings' },
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function PersonalDashboardView({
  roleLabel,
  activeLayout,
  catalog,
  account,
}: PersonalDashboardViewProps) {
  const catalogByKey = new Map(catalog.map((widget) => [widget.key, widget]));

  return (
    <main className="min-h-full bg-[#F4F7FB] px-4 py-5 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1600px]">
        <header className="rounded-[28px] border border-[#D7E1EF] bg-white p-5 shadow-[0_18px_55px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8EFFF] text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
                <LayoutDashboard className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#738095] dark:text-slate-400">
                  Phase 8B · {roleLabel}
                </p>
                <h1 className="mt-2 text-2xl font-black tracking-tight text-[#101D38] dark:text-white sm:text-3xl">
                  {activeLayout?.name ?? 'Personal dashboard'}
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-[#667085] dark:text-slate-400">
                  Your active saved layout controls widget order and size. Every destination continues to enforce its existing server-side role, tenant and record-level access policy.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#CBD8EA] bg-white px-4 text-sm font-extrabold text-[#334155] hover:bg-[#F7F9FC] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
              >
                Role dashboard
              </Link>
              <Link
                href="/dashboard/customize"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white shadow-[0_8px_24px_rgba(23,84,232,0.25)]"
              >
                <Settings2 className="h-4 w-4" aria-hidden="true" />
                Customize
              </Link>
            </div>
          </div>

          {activeLayout && (
            <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#667085] dark:text-slate-400">
              <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
                {activeLayout.widgets.length} widgets
              </span>
              <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
                {activeLayout.source === 'default' ? 'Recommended layout' : 'Custom layout'}
              </span>
              <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
                Version {activeLayout.version}
              </span>
              <span className="rounded-full bg-[#F3F6FA] px-3 py-1.5 font-bold dark:bg-slate-950">
                Updated {formatDate(activeLayout.updatedAt)}
              </span>
            </div>
          )}
        </header>

        {activeLayout && activeLayout.widgets.length > 0 ? (
          <section className="mt-5 rounded-[24px] border border-[#D7E1EF] bg-[#F6F8FC] p-3 dark:border-slate-800 dark:bg-slate-950 sm:p-4" aria-label="Active personal dashboard layout">
            <div className={styles.canvas}>
              {activeLayout.widgets.map((placement) => {
                const definition = catalogByKey.get(placement.widgetKey);
                if (!definition) return null;
                const cardStyle = {
                  '--widget-x': placement.x,
                  '--widget-y': placement.y,
                  '--widget-width': placement.width,
                  '--widget-height': placement.height,
                } as React.CSSProperties;

                return (
                  <article
                    key={placement.instanceId}
                    style={cardStyle}
                    className={`${styles.widget} flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#D8E2EF] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900`}
                  >
                    <header className="border-b border-[#E4EAF2] p-4 dark:border-slate-800">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h2 className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">
                            {definition.title}
                          </h2>
                          <p className="mt-1 truncate text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">
                            {definition.category.replace(/-/g, ' ')}
                          </p>
                        </div>
                        <span className="rounded-lg bg-[#F3F6FA] px-2 py-1 text-[10px] font-extrabold text-[#667085] dark:bg-slate-950 dark:text-slate-400">
                          {placement.width}×{placement.height}
                        </span>
                      </div>
                    </header>

                    <div className="min-h-0 flex-1 overflow-y-auto p-4">
                      <WidgetContent widgetKey={placement.widgetKey} account={account} />
                    </div>

                    <footer className="border-t border-[#E4EAF2] bg-[#FAFBFD] p-3 dark:border-slate-800 dark:bg-slate-950/60">
                      <Link
                        href={widgetDestinations[placement.widgetKey]?.href ?? '/dashboard'}
                        className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-xl border border-[#CBD8EA] bg-white px-3 text-xs font-extrabold text-[#1754E8] hover:bg-[#EDF3FF] dark:border-slate-700 dark:bg-slate-900 dark:text-blue-300"
                      >
                        {widgetDestinations[placement.widgetKey]?.label ?? 'Open authorised workspace'}
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </footer>
                  </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section className="mt-5 flex min-h-[420px] flex-col items-center justify-center rounded-[24px] border border-dashed border-[#CBD5E1] bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            <CircleAlert className="h-8 w-8 text-amber-600 dark:text-amber-300" aria-hidden="true" />
            <h2 className="mt-4 text-xl font-black text-[#101D38] dark:text-white">No active widgets</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-[#667085] dark:text-slate-400">
              Create or reset a layout in the dashboard designer to restore the role-recommended widgets.
            </p>
            <Link
              href="/dashboard/customize"
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white"
            >
              <Settings2 className="h-4 w-4" aria-hidden="true" />
              Open designer
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}

function WidgetContent({
  widgetKey,
  account,
}: {
  widgetKey: string;
  account: AccountSidebarOverview;
}) {
  if (widgetKey === 'account-summary') {
    return (
      <div className="space-y-3">
        <div>
          <p className="text-base font-black text-[#101D38] dark:text-white">{account.account.name}</p>
          <p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">{account.account.email}</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <StatusCard label="Email" value={account.account.emailVerified ? 'Verified' : 'Pending'} complete={account.account.emailVerified} />
          <StatusCard label="MFA" value={account.account.mfaEnabled ? 'Enabled' : 'Disabled'} complete={account.account.mfaEnabled} />
        </div>
      </div>
    );
  }

  if (widgetKey === 'notification-inbox') {
    return <MetricSummary icon={Bell} label="Unread notifications" value={account.counters.unreadNotifications} />;
  }

  if (widgetKey === 'approvals-queue') {
    return <MetricSummary icon={CheckCircle2} label="Pending authorised approvals" value={account.counters.pendingApprovals} />;
  }

  if (widgetKey === 'recent-activity') {
    return account.recentActivity.length > 0 ? (
      <ul className="space-y-2">
        {account.recentActivity.slice(0, 4).map((activity) => (
          <li key={activity.id} className="flex items-start gap-2 rounded-xl bg-[#F4F7FB] p-2.5 dark:bg-slate-950">
            <Activity className="mt-0.5 h-4 w-4 shrink-0 text-[#1754E8] dark:text-blue-300" aria-hidden="true" />
            <span className="min-w-0">
              <span className="block truncate text-xs font-extrabold text-[#101D38] dark:text-white">{activity.label}</span>
              <span className="mt-0.5 block truncate text-[10px] text-[#7B8798] dark:text-slate-500">{activity.entity}</span>
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <SafeModuleNotice />
    );
  }

  if (widgetKey === 'quick-actions') {
    return (
      <div className="grid grid-cols-2 gap-2">
        <MiniMetric icon={Bell} label="Unread" value={account.counters.unreadNotifications} />
        <MiniMetric icon={LifeBuoy} label="Support" value={account.counters.openSupportCases} />
        <MiniMetric icon={MonitorSmartphone} label="Sessions" value={account.counters.activeSessions} />
        <MiniMetric icon={CheckCircle2} label="Approvals" value={account.counters.pendingApprovals} />
      </div>
    );
  }

  return <SafeModuleNotice />;
}

function StatusCard({ label, value, complete }: { label: string; value: string; complete: boolean }) {
  return (
    <div className="rounded-xl bg-[#F4F7FB] p-3 dark:bg-slate-950">
      <ShieldCheck className={`h-4 w-4 ${complete ? 'text-emerald-600 dark:text-emerald-300' : 'text-amber-600 dark:text-amber-300'}`} aria-hidden="true" />
      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-extrabold text-[#101D38] dark:text-white">{value}</p>
    </div>
  );
}

function MetricSummary({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="flex h-full min-h-24 items-center gap-4 rounded-xl bg-[#F4F7FB] p-4 dark:bg-slate-950">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#1754E8] dark:bg-slate-900 dark:text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <p className="text-2xl font-black text-[#101D38] dark:text-white">{value}</p>
        <p className="mt-1 text-xs font-bold text-[#667085] dark:text-slate-400">{label}</p>
      </div>
    </div>
  );
}

function MiniMetric({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#F4F7FB] p-3 dark:bg-slate-950">
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-[#667085] dark:text-slate-400" aria-hidden="true" />
        <span className="text-lg font-black text-[#101D38] dark:text-white">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">{label}</p>
    </div>
  );
}

function SafeModuleNotice() {
  return (
    <div className="flex h-full min-h-24 items-center rounded-xl border border-dashed border-[#CBD5E1] bg-[#FAFBFD] p-3 text-xs leading-5 text-[#667085] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
      Live records are displayed inside the linked authorised module. This card does not duplicate or fabricate protected operational data.
    </div>
  );
}
