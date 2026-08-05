'use client';

import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  Building2,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  HelpCircle,
  KeyRound,
  Laptop2,
  Loader2,
  LogOut,
  Mail,
  Moon,
  Settings,
  Sun,
  UserRound,
  UsersRound,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';

type LogoutMode = 'current' | 'all' | null;

const accountLinks = [
  { href: '/profile', label: 'Profile and sessions', detail: 'Account details and security activity', icon: UserRound },
  { href: '/notifications', label: 'Notifications', detail: 'Workspace updates and alerts', icon: Bell },
  { href: '/settings', label: 'Preferences and settings', detail: 'Application and institution settings', icon: Settings },
  { href: '/support/cases', label: 'My support cases', detail: 'Track requests and resolutions', icon: Activity },
  { href: '/helpdesk', label: 'Help and support', detail: 'Get product and campus assistance', icon: HelpCircle },
] as const;

export function ProfileMenu() {
  const { currentSession, isDarkMode, toggleDarkMode } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [logoutMode, setLogoutMode] = useState<LogoutMode>(null);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!currentSession) return null;

  const performLogout = async (mode: Exclude<LogoutMode, null>) => {
    if (mode === 'all') {
      const confirmed = window.confirm('Sign out this account from every active device and browser session?');
      if (!confirmed) return;
    }

    setError(null);
    setLogoutMode(mode);

    try {
      const response = await fetch(mode === 'all' ? '/api/auth/logout-all' : '/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload === 'object' && payload && 'error' in payload
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

  const roleLabel = formatRole(currentSession.role);
  const activeSessions = currentSession.activeSessionCount ?? 1;

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setIsOpen((open) => !open);
          setError(null);
        }}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-transparent p-1.5 transition hover:border-[#D8E2EF] hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:hover:border-slate-700 dark:hover:bg-slate-900"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open profile and account menu"
      >
        <AccountAvatar name={currentSession.name} src={currentSession.avatarUrl} size="small" />
        <span className="hidden min-w-0 text-left lg:block">
          <span className="block max-w-36 truncate text-[13px] font-extrabold leading-tight text-[#101D38] dark:text-white">
            {currentSession.name}
          </span>
          <span className="mt-0.5 block max-w-36 truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className={`hidden h-4 w-4 text-[#7B8798] transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[69] bg-slate-950/30 md:hidden"
            aria-label="Close account menu"
            onClick={() => setIsOpen(false)}
          />
          <div
            role="menu"
            aria-label="Profile and account menu"
            className="fixed inset-x-0 bottom-0 z-[70] max-h-[88dvh] overflow-y-auto rounded-t-[24px] border border-[#D8E2EF] bg-white shadow-[0_-24px_70px_rgba(15,23,42,0.2)] dark:border-slate-800 dark:bg-slate-950 md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:max-h-[min(78vh,720px)] md:w-[390px] md:rounded-[22px] md:shadow-[0_24px_70px_rgba(15,23,42,0.18)]"
          >
            <div className="flex justify-center py-2 md:hidden" aria-hidden="true">
              <span className="h-1.5 w-11 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div className="border-b border-[#E1E8F1] bg-[#101D38] p-5 text-white dark:border-slate-800">
              <div className="flex items-start gap-4">
                <AccountAvatar name={currentSession.name} src={currentSession.avatarUrl} size="large" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-extrabold">{currentSession.name}</p>
                  <p className="mt-1 truncate text-xs text-[#B7C4D8]">{currentSession.email}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-[#385477] bg-[#0D1A2E] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#C9D7EB]">
                      {roleLabel}
                    </span>
                    <span className="max-w-full truncate rounded-full border border-[#385477] bg-[#0D1A2E] px-2.5 py-1 text-[9px] font-extrabold text-[#C9D7EB]">
                      {currentSession.institutionName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-4 sm:p-5">
              <section aria-labelledby="profile-menu-account-details">
                <div className="flex items-center justify-between gap-3">
                  <h2 id="profile-menu-account-details" className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#7B8798] dark:text-slate-500">
                    Account details
                  </h2>
                  <Link href="/profile" onClick={() => setIsOpen(false)} className="inline-flex items-center gap-1 text-xs font-extrabold text-[#1754E8] dark:text-blue-300">
                    Full profile <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2">
                  <DetailCell icon={Mail} label="Email" value={currentSession.emailVerified ? 'Verified' : 'Not verified'} positive={currentSession.emailVerified} />
                  <DetailCell icon={KeyRound} label="MFA" value={currentSession.mfaEnabled ? 'Enabled' : 'Not enabled'} positive={currentSession.mfaEnabled} />
                  <DetailCell icon={Laptop2} label="Sessions" value={`${activeSessions} active`} positive={activeSessions === 1} />
                  <DetailCell icon={Building2} label="Account" value="Active" positive />
                </dl>

                <div className="mt-2 rounded-xl border border-[#E0E7F0] bg-[#F7F9FC] p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-bold text-[#101D38] dark:text-white">Last sign-in</p>
                  <p className="mt-1 text-[#667085] dark:text-slate-400">{formatDateTime(currentSession.lastLoginAt)}</p>
                  <p className="mt-2 font-bold text-[#101D38] dark:text-white">Member since</p>
                  <p className="mt-1 text-[#667085] dark:text-slate-400">{formatDate(currentSession.createdAt)}</p>
                </div>
              </section>

              <section aria-labelledby="profile-menu-navigation">
                <h2 id="profile-menu-navigation" className="text-xs font-extrabold uppercase tracking-[0.11em] text-[#7B8798] dark:text-slate-500">
                  Account and workspace
                </h2>
                <nav className="mt-3 space-y-1" aria-label="Account navigation">
                  {accountLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className="group flex min-h-[52px] items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-[#F4F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:hover:bg-slate-900"
                        role="menuitem"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#D8E2EF] bg-white text-[#526175] group-hover:border-[#B7C9E1] group-hover:text-[#1754E8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-extrabold text-[#101D38] dark:text-white">{item.label}</span>
                          <span className="mt-0.5 block truncate text-[11px] text-[#7B8798] dark:text-slate-500">{item.detail}</span>
                        </span>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 text-[#A0A9B7]" aria-hidden="true" />
                      </Link>
                    );
                  })}
                </nav>
              </section>

              <section className="rounded-2xl border border-[#D8E2EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900" aria-labelledby="profile-menu-appearance">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1754E8] dark:bg-slate-950 dark:text-blue-300">
                      {isDarkMode ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
                    </span>
                    <div>
                      <h2 id="profile-menu-appearance" className="text-sm font-extrabold text-[#101D38] dark:text-white">Appearance</h2>
                      <p className="mt-0.5 text-[11px] text-[#7B8798] dark:text-slate-500">{isDarkMode ? 'Dark mode' : 'Light mode'} is active</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleDarkMode}
                    className="inline-flex min-h-10 items-center rounded-xl border border-[#C9D8EE] bg-white px-3 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-300"
                  >
                    Switch
                  </button>
                </div>
              </section>

              {error && (
                <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
                  {error}
                </div>
              )}

              <section className="grid gap-2 sm:grid-cols-2" aria-label="Sign out options">
                <button
                  type="button"
                  onClick={() => void performLogout('current')}
                  disabled={logoutMode !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D8E2EF] bg-white px-4 text-sm font-extrabold text-[#101D38] transition hover:border-[#B7C9E1] hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
                >
                  {logoutMode === 'current' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
                  Sign out
                </button>
                <button
                  type="button"
                  onClick={() => void performLogout('all')}
                  disabled={logoutMode !== null}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
                >
                  {logoutMode === 'all' ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <UsersRound className="h-4 w-4" aria-hidden="true" />}
                  Sign out all
                </button>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DetailCell({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[#E0E7F0] bg-[#F7F9FC] p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[#7B8798] dark:text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        <dt className="text-[9px] font-extrabold uppercase tracking-[0.09em]">{label}</dt>
      </div>
      <dd className={`mt-2 flex items-center gap-1.5 text-xs font-extrabold ${positive ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
        {positive && <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
        {value}
      </dd>
    </div>
  );
}

function AccountAvatar({
  name,
  src,
  size,
}: {
  name: string;
  src?: string | null;
  size: 'small' | 'large';
}) {
  const dimension = size === 'large' ? 52 : 34;
  const localSource = typeof src === 'string' && src.startsWith('/') ? src : null;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  if (localSource) {
    return (
      <Image
        src={localSource}
        alt={`${name}'s profile`}
        width={dimension}
        height={dimension}
        className={`${size === 'large' ? 'h-[52px] w-[52px]' : 'h-[34px] w-[34px]'} shrink-0 rounded-full border-2 border-white/20 object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#1754E8] font-extrabold text-white ${size === 'large' ? 'h-[52px] w-[52px] text-base' : 'h-[34px] w-[34px] text-[11px]'}`}
    >
      {initials || 'U'}
    </span>
  );
}

function formatRole(role: string): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value?: string): string {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
