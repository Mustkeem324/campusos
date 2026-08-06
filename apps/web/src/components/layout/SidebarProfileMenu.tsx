'use client';

import Link from 'next/link';
import React from 'react';
import {
  Activity,
  Bell,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Command,
  HelpCircle,
  KeyRound,
  LifeBuoy,
  Loader2,
  LogOut,
  MonitorSmartphone,
  Moon,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';

import type { AccountSidebarOverview } from '../../lib/account-sidebar';
import { useAuthStore } from '../../lib/auth-store';

type LogoutMode = 'current' | 'all' | null;

type SidebarProfileMenuProps = {
  expanded: boolean;
  onNavigate?: () => void;
};

const quickLinks: Array<{
  href: string;
  label: string;
  detail: string;
  icon: LucideIcon;
}> = [
  {
    href: '/profile',
    label: 'Profile and security',
    detail: 'Identity, sessions and account controls',
    icon: UserRound,
  },
  {
    href: '/phase-7',
    label: 'Command centre',
    detail: 'Approvals, reports and safe intelligence',
    icon: Command,
  },
  {
    href: '/notifications',
    label: 'Notifications',
    detail: 'Unread updates and delivery preferences',
    icon: Bell,
  },
  {
    href: '/settings',
    label: 'Settings',
    detail: 'Workspace and institution preferences',
    icon: Settings,
  },
  {
    href: '/helpdesk',
    label: 'Helpdesk',
    detail: 'Support requests and product assistance',
    icon: HelpCircle,
  },
];

export function SidebarProfileMenu({ expanded, onNavigate }: SidebarProfileMenuProps) {
  const { currentSession, isDarkMode, toggleDarkMode } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const [overview, setOverview] = React.useState<AccountSidebarOverview | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [logoutMode, setLogoutMode] = React.useState<LogoutMode>(null);

  const loadOverview = React.useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/account/sidebar-overview', {
        method: 'GET',
        cache: 'no-store',
        signal,
      });
      const payload: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload === 'object' && payload && 'error' in payload
            ? String(payload.error)
            : 'Account overview is temporarily unavailable.';
        throw new Error(message);
      }

      setOverview(payload as AccountSidebarOverview);
    } catch (cause: unknown) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      setError(cause instanceof Error ? cause.message : 'Account overview is temporarily unavailable.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!isOpen || overview) return;

    const controller = new AbortController();
    void loadOverview(controller.signal);
    return () => controller.abort();
  }, [isOpen, loadOverview, overview]);

  React.useEffect(() => {
    if (!isOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  if (!currentSession) return null;

  const accountName = overview?.account.name ?? currentSession.name;
  const accountRole = formatRole(overview?.account.role ?? currentSession.role);
  const institutionName = overview?.account.institution ?? currentSession.institutionName;

  const performLogout = async (mode: Exclude<LogoutMode, null>) => {
    if (mode === 'all') {
      const confirmed = window.confirm('Sign out this account from every active device and browser session?');
      if (!confirmed) return;
    }

    setLogoutMode(mode);
    setError(null);

    try {
      const response = await fetch(mode === 'all' ? '/api/auth/logout-all' : '/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const payload: unknown = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload === 'object' && payload && 'error' in payload
            ? String(payload.error)
            : 'Sign out failed. Please try again.';
        throw new Error(message);
      }

      useAuthStore.getState().setSession(null);
      window.localStorage.removeItem('campusos-auth-storage');
      window.location.assign('/login');
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Sign out failed. Please try again.');
      setLogoutMode(null);
    }
  };

  const handleLink = () => {
    setIsOpen(false);
    onNavigate?.();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setError(null);
        }}
        className={`flex min-h-12 w-full items-center rounded-2xl border border-transparent bg-[#F7F9FC] p-2.5 text-left transition hover:border-[#C9D8EE] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:bg-slate-900 dark:hover:border-slate-700 dark:hover:bg-slate-900/80 ${
          expanded ? 'gap-3' : 'justify-center'
        }`}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label="Open sidebar profile menu"
        title={expanded ? undefined : accountName}
      >
        <Avatar name={accountName} />
        {expanded && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-extrabold text-[#101D38] dark:text-white">
                {accountName}
              </span>
              <span className="mt-0.5 block truncate text-[11px] text-[#667085] dark:text-slate-400">
                {accountRole}
              </span>
            </span>
            <ChevronRight
              className={`h-4 w-4 shrink-0 text-[#98A2B3] transition-transform ${isOpen ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </>
        )}
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[74] bg-slate-950/35 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
            aria-label="Close sidebar profile menu"
            onClick={() => setIsOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Profile and personal workspace"
            className={`fixed bottom-3 left-3 right-3 z-[75] max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-[24px] border border-[#D8E2EF] bg-white shadow-[0_28px_90px_rgba(15,23,42,0.24)] dark:border-slate-800 dark:bg-slate-950 md:right-auto md:w-[410px] ${
              expanded
                ? 'md:left-[calc(var(--sidebar-w)+12px)]'
                : 'md:left-[calc(var(--sidebar-collapsed-w)+12px)]'
            }`}
          >
            <header className="border-b border-[#2B456B] bg-[#101D38] p-5 text-white">
              <div className="flex items-start gap-4">
                <Avatar name={accountName} large />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold">{accountName}</p>
                  <p className="mt-1 truncate text-xs text-[#B7C4D8]">{currentSession.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill label={accountRole} />
                    <StatusPill label={institutionName} />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl text-[#C9D7EB] transition hover:bg-white/10 hover:text-white"
                  aria-label="Close profile menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </header>

            <div className="space-y-5 p-4 sm:p-5">
              {isLoading && !overview && (
                <div className="flex min-h-28 items-center justify-center rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] dark:border-slate-800 dark:bg-slate-900">
                  <Loader2 className="h-5 w-5 animate-spin text-[#1754E8]" aria-hidden="true" />
                  <span className="ml-3 text-sm font-semibold text-[#667085] dark:text-slate-400">
                    Loading personal workspace…
                  </span>
                </div>
              )}

              {overview && (
                <>
                  <section aria-labelledby="sidebar-account-status">
                    <div className="flex items-center justify-between gap-3">
                      <h2
                        id="sidebar-account-status"
                        className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#7B8798] dark:text-slate-500"
                      >
                        Account status
                      </h2>
                      <button
                        type="button"
                        onClick={() => void loadOverview()}
                        disabled={isLoading}
                        className="inline-flex min-h-9 items-center gap-2 rounded-xl px-2.5 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] disabled:opacity-60 dark:text-blue-300 dark:hover:bg-blue-950/40"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
                        Refresh
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <CounterCard
                        icon={Bell}
                        label="Unread"
                        value={overview.counters.unreadNotifications}
                        href="/notifications"
                        onNavigate={handleLink}
                      />
                      <CounterCard
                        icon={CheckCircle2}
                        label="Approvals"
                        value={overview.counters.pendingApprovals}
                        href="/phase-7"
                        onNavigate={handleLink}
                      />
                      <CounterCard
                        icon={LifeBuoy}
                        label="Support"
                        value={overview.counters.openSupportCases}
                        href="/support/cases"
                        onNavigate={handleLink}
                      />
                      <CounterCard
                        icon={MonitorSmartphone}
                        label="Sessions"
                        value={overview.counters.activeSessions}
                        href="/profile"
                        onNavigate={handleLink}
                      />
                    </div>

                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      <SecurityStatus
                        icon={ShieldCheck}
                        label="Email verification"
                        complete={overview.account.emailVerified}
                      />
                      <SecurityStatus
                        icon={KeyRound}
                        label="Authenticator MFA"
                        complete={overview.account.mfaEnabled}
                      />
                    </div>

                    <div className="mt-3 rounded-xl border border-[#E0E7F0] bg-[#F7F9FC] p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                      <p className="font-extrabold text-[#101D38] dark:text-white">Last successful sign-in</p>
                      <p className="mt-1 text-[#667085] dark:text-slate-400">
                        {formatDateTime(overview.account.lastLoginAt)}
                      </p>
                    </div>
                  </section>

                  <section aria-labelledby="sidebar-recent-activity">
                    <h2
                      id="sidebar-recent-activity"
                      className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#7B8798] dark:text-slate-500"
                    >
                      Recent account activity
                    </h2>
                    {overview.recentActivity.length > 0 ? (
                      <ul className="mt-3 space-y-2">
                        {overview.recentActivity.map((activity) => (
                          <li
                            key={activity.id}
                            className="flex items-start gap-3 rounded-xl border border-[#E0E7F0] bg-[#F7F9FC] p-3 dark:border-slate-800 dark:bg-slate-900"
                          >
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-[#1754E8] dark:bg-slate-950 dark:text-blue-300">
                              <Activity className="h-4 w-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-xs font-extrabold text-[#101D38] dark:text-white">
                                {activity.label}
                              </span>
                              <span className="mt-1 block truncate text-[11px] text-[#667085] dark:text-slate-400">
                                {activity.entity} · {formatDateTime(activity.createdAt)}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="mt-3 rounded-xl border border-dashed border-[#CBD5E1] p-4 text-center text-xs text-[#667085] dark:border-slate-700 dark:text-slate-400">
                        No account activity has been recorded yet.
                      </div>
                    )}
                  </section>
                </>
              )}

              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{error}</span>
                </div>
              )}

              <section aria-labelledby="sidebar-personal-workspace-links">
                <h2
                  id="sidebar-personal-workspace-links"
                  className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#7B8798] dark:text-slate-500"
                >
                  Personal workspace
                </h2>
                <nav className="mt-3 space-y-1" aria-label="Profile and workspace links">
                  {quickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={handleLink}
                        className="group flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:hover:bg-slate-900"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8E2EF] bg-white text-[#526175] group-hover:border-[#B7C9E1] group-hover:text-[#1754E8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-[#101D38] dark:text-white">
                            {item.label}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-[#7B8798] dark:text-slate-500">
                            {item.detail}
                          </span>
                        </span>
                        <ChevronRight className="h-4 w-4 shrink-0 text-[#A0A9B7]" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </nav>
              </section>

              <section
                className="rounded-2xl border border-[#D8E2EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900"
                aria-labelledby="sidebar-appearance"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#1754E8] dark:bg-slate-950 dark:text-blue-300">
                      {isDarkMode ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <div className="min-w-0">
                      <h2 id="sidebar-appearance" className="text-sm font-extrabold text-[#101D38] dark:text-white">
                        Appearance
                      </h2>
                      <p className="mt-0.5 truncate text-[11px] text-[#7B8798] dark:text-slate-500">
                        {isDarkMode ? 'Dark mode is active' : 'Light mode is active'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="inline-flex min-h-10 shrink-0 items-center rounded-xl border border-[#C9D8EE] bg-white px-3 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] dark:border-slate-700 dark:bg-slate-950 dark:text-blue-300"
                  >
                    Switch
                  </button>
                </div>
              </section>

              <section className="grid gap-2 sm:grid-cols-2" aria-label="Sign out options">
                <button
                  type="button"
                  onClick={() => void performLogout('current')}
                  disabled={logoutMode !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8E2EF] bg-white px-4 text-sm font-extrabold text-[#101D38] transition hover:border-[#B7C9E1] hover:bg-[#F7F9FC] disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                >
                  {logoutMode === 'current' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                  )}
                  Sign out
                </button>
                <button
                  type="button"
                  onClick={() => void performLogout('all')}
                  disabled={logoutMode !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  {logoutMode === 'all' ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <UsersRound className="h-4 w-4" aria-hidden="true" />
                  )}
                  Sign out all
                </button>
              </section>
            </div>
          </aside>
        </>
      )}
    </>
  );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center bg-[#DCE7FF] font-extrabold text-[#1754E8] dark:bg-blue-950 dark:text-blue-300 ${
        large ? 'h-12 w-12 rounded-2xl text-sm' : 'h-10 w-10 rounded-xl text-xs'
      }`}
    >
      {initials || 'U'}
    </span>
  );
}

function StatusPill({ label }: { label: string }) {
  return (
    <span className="max-w-full truncate rounded-full border border-[#385477] bg-[#0D1A2E] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#C9D7EB]">
      {label}
    </span>
  );
}

function CounterCard({
  icon: Icon,
  label,
  value,
  href,
  onNavigate,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="rounded-xl border border-[#E0E7F0] bg-[#F7F9FC] p-3 transition hover:border-[#BFD0E7] hover:bg-[#EDF3FF] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
    >
      <div className="flex items-center justify-between gap-2">
        <Icon className="h-4 w-4 text-[#667085] dark:text-slate-400" aria-hidden="true" />
        <span className="text-lg font-extrabold text-[#101D38] dark:text-white">{value}</span>
      </div>
      <p className="mt-2 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#7B8798] dark:text-slate-500">
        {label}
      </p>
    </Link>
  );
}

function SecurityStatus({
  icon: Icon,
  label,
  complete,
}: {
  icon: LucideIcon;
  label: string;
  complete: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[#E0E7F0] bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          complete
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
        }`}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-extrabold text-[#101D38] dark:text-white">{label}</p>
        <p className="mt-0.5 text-[10px] text-[#667085] dark:text-slate-400">
          {complete ? 'Complete' : 'Action recommended'}
        </p>
      </div>
    </div>
  );
}

function formatRole(role: string) {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Not recorded';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';

  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
