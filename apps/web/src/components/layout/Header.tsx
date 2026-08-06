'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bell,
  Command,
  HelpCircle,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';
import { dashboardDefinitionForRole } from '../../lib/dashboard/registry';
import { ProfileMenu } from './ProfileMenu';
import { NotificationDrawer, type Notification } from '../notifications/NotificationDrawer';

function formatPathname(pathname: string) {
  const finalSegment = pathname.split('/').filter(Boolean).at(-1);
  if (!finalSegment || finalSegment === 'dashboard') return 'Dashboard';

  return finalSegment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function Header() {
  const pathname = usePathname();
  const {
    currentSession,
    isDarkMode,
    toggleDarkMode,
    setCmdPaletteOpen,
    toggleSidebar,
    isSidebarCollapsed,
  } = useAuthStore();
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const refreshUnreadCount = React.useCallback(async () => {
    try {
      const response = await fetch('/api/notifications?filter=unread', { cache: 'no-store' });
      if (!response.ok) return;
      const payload: unknown = await response.json();
      if (Array.isArray(payload)) {
        setUnreadCount((payload as Notification[]).filter((item) => !item.isRead).length);
      }
    } catch {
      // The notification control remains usable if the badge count cannot load.
    }
  }, []);

  React.useEffect(() => {
    void refreshUnreadCount();
    const interval = window.setInterval(() => void refreshUnreadCount(), 60_000);
    return () => window.clearInterval(interval);
  }, [refreshUnreadCount]);

  const dashboardDefinition = currentSession?.role
    ? dashboardDefinitionForRole(currentSession.role)
    : null;
  const navigationItems = dashboardDefinition?.navigation.flatMap((group) => group.items) ?? [];
  const activeNavigationItem = navigationItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)),
  );
  const pageTitle = pathname.startsWith('/phase-7')
    ? 'Phase 7 Command Centre'
    : activeNavigationItem?.label ?? formatPathname(pathname);
  const institutionName = currentSession?.institutionName ?? 'CampusOS';

  const handleNavigationToggle = () => {
    if (window.matchMedia('(max-width: 767px)').matches) {
      window.dispatchEvent(new Event('campusos:toggle-mobile-navigation'));
      return;
    }

    toggleSidebar();
  };

  return (
    <>
      <header
        className="app-header fixed right-0 flex items-center border-b border-[#D9E3F0] bg-white/98 px-3 shadow-[0_8px_28px_rgba(16,29,56,0.06)] backdrop-blur-xl transition-[left] duration-300 dark:border-slate-800 dark:bg-slate-950/98 sm:px-4 lg:px-5"
        style={{
          height: 'var(--header-h)',
          top: 'calc(var(--impersonation-bar-h) + var(--demo-banner-h))',
          left: isSidebarCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
          zIndex: 'var(--z-header)',
        } as React.CSSProperties}
      >
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleNavigationToggle}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#536175] transition hover:border-[#D8E2EF] hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
            aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="hidden min-w-[180px] border-l border-[#E5EAF1] pl-4 dark:border-slate-800 md:block xl:min-w-[210px]">
            <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.15em] text-[#8A95A6] dark:text-slate-500">
              {institutionName}
            </p>
            <p className="mt-0.5 truncate text-sm font-extrabold text-[#101D38] dark:text-white">
              {pageTitle}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCmdPaletteOpen(true)}
            className="group ml-0 hidden min-h-11 min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-xl border border-[#D6DFEB] bg-[#F8FAFC] px-3 text-sm text-[#7B8798] transition hover:border-[#AFC3DE] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 sm:flex lg:ml-2"
            aria-label="Open global search and commands"
          >
            <Search className="h-4 w-4 shrink-0 text-[#667085] group-hover:text-[#1754E8] dark:text-slate-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-left">
              Search people, courses, payments and actions
            </span>
            <span className="hidden items-center gap-1 rounded-md border border-[#D6DFEB] bg-white px-2 py-1 text-[10px] font-extrabold text-[#667085] shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 lg:inline-flex">
              <Command className="h-3 w-3" aria-hidden="true" />K
            </span>
          </button>

          <button
            type="button"
            onClick={() => setCmdPaletteOpen(true)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-[#D8E2EF] bg-[#F8FAFC] text-[#536175] sm:hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
            aria-label="Open search"
          >
            <Search className="h-[19px] w-[19px]" aria-hidden="true" />
          </button>
        </div>

        <div className="ml-2 flex shrink-0 items-center gap-1 sm:ml-3 sm:gap-2">
          <div className="hidden min-h-9 items-center gap-2 rounded-xl border border-[#D6DFEB] bg-[#F8FAFC] px-3 text-[11px] font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 xl:flex">
            <ShieldCheck className="h-4 w-4 text-[#078A57]" aria-hidden="true" />
            Secure context
          </div>

          <Link
            href="/phase-7"
            className={`hidden min-h-11 min-w-11 items-center justify-center rounded-xl transition md:inline-flex ${pathname.startsWith('/phase-7') ? 'bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300' : 'text-[#536175] hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:bg-slate-900'}`}
            aria-label="Open Phase 7 command centre"
            title="Phase 7 command centre"
          >
            <Sparkles className="h-[19px] w-[19px]" aria-hidden="true" />
          </Link>

          <button
            type="button"
            className={`relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border shadow-sm transition focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 ${
              isNotifDrawerOpen
                ? 'border-[#1754E8] bg-[#1754E8] text-white shadow-[0_8px_18px_rgba(23,84,232,0.24)]'
                : 'border-[#C9D8EC] bg-[#F3F7FF] text-[#1754E8] hover:border-[#9DB8E0] hover:bg-[#EAF1FF] dark:border-blue-900 dark:bg-blue-950/35 dark:text-blue-300'
            }`}
            onClick={() => setIsNotifDrawerOpen(true)}
            aria-label={unreadCount > 0 ? `Open notifications, ${unreadCount} unread` : 'Open notifications'}
            aria-expanded={isNotifDrawerOpen}
          >
            <Bell className="h-[19px] w-[19px]" aria-hidden="true" />
            {unreadCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-[#E5484D] px-1 text-[9px] font-black leading-none text-white shadow-sm dark:border-slate-950">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <Link
            href="/helpdesk"
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl text-[#536175] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:bg-slate-900 lg:inline-flex"
            aria-label="Open helpdesk"
          >
            <HelpCircle className="h-[19px] w-[19px]" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl text-[#536175] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:bg-slate-900 sm:inline-flex"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="h-[19px] w-[19px]" aria-hidden="true" />
            ) : (
              <Moon className="h-[19px] w-[19px]" aria-hidden="true" />
            )}
          </button>

          <div className="mx-1 hidden h-7 w-px bg-[#E1E7EF] dark:bg-slate-800 sm:block" aria-hidden="true" />
          <ProfileMenu />
        </div>
      </header>

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => {
          setIsNotifDrawerOpen(false);
          void refreshUnreadCount();
        }}
      />
    </>
  );
}
