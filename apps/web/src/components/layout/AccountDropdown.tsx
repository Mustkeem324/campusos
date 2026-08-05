'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  Moon,
  Settings,
  ShieldCheck,
  Sun,
  User,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';

function formatRole(role: string) {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function initialsFor(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function AccountDropdown() {
  const { currentSession, isDarkMode, toggleDarkMode } = useAuthStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  if (!currentSession) return null;

  const roleLabel = formatRole(currentSession.role);
  const initials = initialsFor(currentSession.name);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      useAuthStore.getState().setSession(null);
      window.location.assign('/login');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="flex min-h-11 items-center gap-2 rounded-xl border border-transparent px-1.5 py-1 text-left transition hover:border-[#D8E2EF] hover:bg-[#F4F7FB] focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 dark:hover:border-slate-700 dark:hover:bg-slate-900"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open account menu"
      >
        {currentSession.avatarUrl ? (
          <img
            src={currentSession.avatarUrl}
            alt=""
            className="h-9 w-9 rounded-xl border border-[#D6DFEB] object-cover dark:border-slate-700"
          />
        ) : (
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DCE7FF] text-xs font-extrabold text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
            {initials}
          </span>
        )}

        <span className="hidden min-w-0 max-w-[150px] lg:block">
          <span className="block truncate text-xs font-bold text-[#101D38] dark:text-white">{currentSession.name}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[#7B8798] dark:text-slate-500">{roleLabel}</span>
        </span>

        <ChevronDown
          className={`hidden h-4 w-4 shrink-0 text-[#7B8798] transition-transform dark:text-slate-500 sm:block ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-[75] bg-[#101D38]/45 md:hidden"
            onClick={() => setIsOpen(false)}
            aria-label="Close account menu"
          />

          <div
            role="menu"
            aria-label="Account menu"
            className="fixed inset-x-0 bottom-0 z-[80] overflow-hidden rounded-t-3xl border border-[#D8E2EF] bg-white shadow-[0_-24px_64px_rgba(16,29,56,0.22)] dark:border-slate-700 dark:bg-slate-950 md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-2 md:w-[340px] md:rounded-2xl md:shadow-[0_24px_64px_rgba(16,29,56,0.18)]"
          >
            <div className="flex justify-center py-2 md:hidden" aria-hidden="true">
              <span className="h-1.5 w-10 rounded-full bg-[#D7DEE8] dark:bg-slate-700" />
            </div>

            <div className="border-b border-[#E1E7EF] bg-[#F8FAFC] p-5 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-3">
                {currentSession.avatarUrl ? (
                  <img
                    src={currentSession.avatarUrl}
                    alt=""
                    className="h-12 w-12 rounded-2xl border border-[#D6DFEB] object-cover dark:border-slate-700"
                  />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#DCE7FF] text-sm font-extrabold text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
                    {initials}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-[#101D38] dark:text-white">{currentSession.name}</p>
                  <p className="mt-0.5 truncate text-xs text-[#667085] dark:text-slate-400">{currentSession.email}</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-[#EAF0FF] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
                  {roleLabel}
                </span>
                <span className="max-w-full truncate rounded-full border border-[#D8E2EF] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#536175] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400">
                  {currentSession.institutionName || 'CampusOS'}
                </span>
              </div>
            </div>

            <div className="space-y-1 p-2">
              <AccountMenuLink href="/student-profile" icon={User} label="My profile" onNavigate={() => setIsOpen(false)} />
              <AccountMenuLink href="/settings" icon={Settings} label="Workspace settings" onNavigate={() => setIsOpen(false)} />
              <AccountMenuLink href="/notifications" icon={Bell} label="Notification centre" onNavigate={() => setIsOpen(false)} />
              <AccountMenuLink href="/helpdesk" icon={HelpCircle} label="Help and support" onNavigate={() => setIsOpen(false)} />

              <button
                type="button"
                onClick={toggleDarkMode}
                className="flex min-h-11 w-full items-center justify-between rounded-xl px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F4F7FB] dark:text-slate-200 dark:hover:bg-slate-900"
                role="menuitem"
              >
                <span className="flex items-center gap-3">
                  {isDarkMode ? <Sun className="h-[18px] w-[18px] text-[#667085]" aria-hidden="true" /> : <Moon className="h-[18px] w-[18px] text-[#667085]" aria-hidden="true" />}
                  Appearance
                </span>
                <span className="text-xs font-medium text-[#7B8798]">{isDarkMode ? 'Dark' : 'Light'}</span>
              </button>
            </div>

            <div className="border-t border-[#E1E7EF] p-2 dark:border-slate-800">
              <div className="mb-1 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-[#667085] dark:text-slate-400">
                <ShieldCheck className="h-4 w-4 text-[#078A57]" aria-hidden="true" />
                Session protected by CampusOS access controls
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold text-[#C52B32] transition hover:bg-[#FFF1F2] dark:text-red-400 dark:hover:bg-red-950/30"
                role="menuitem"
              >
                <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AccountMenuLink({
  href,
  icon: Icon,
  label,
  onNavigate,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-[#344054] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-200 dark:hover:bg-slate-900 dark:hover:text-blue-300"
      role="menuitem"
    >
      <Icon className="h-[18px] w-[18px] text-[#667085]" aria-hidden="true" />
      {label}
    </Link>
  );
}
