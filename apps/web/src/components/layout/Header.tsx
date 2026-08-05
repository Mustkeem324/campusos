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
  Sun,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';
import { dashboardDefinitionForRole } from '../../lib/dashboard/registry';
import { ProfileMenu } from './ProfileMenu';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

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

  const dashboardDefinition = currentSession?.role
    ? dashboardDefinitionForRole(currentSession.role)
    : null;
  const navigationItems = dashboardDefinition?.navigation.flatMap((group) => group.items) ?? [];
  const activeNavigationItem = navigationItems.find(
    (item) =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`)),
  );
  const pageTitle = activeNavigationItem?.label ?? formatPathname(pathname);
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
        className="app-header fixed right-0 flex items-center border-b border-[#D9E3F0] bg-white/95 px-3 shadow-[0_8px_28px_rgba(16,29,56,0.04)] backdrop-blur-xl transition-[left] duration-300 dark:border-slate-800 dark:bg-slate-950/95 sm:px-4 lg:px-5"
        style={{
          height: 'var(--header-h)',
          top: 'calc(var(--impersonation-bar-h) + var(--demo-banner-h))',
          left: isSidebarCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
          zIndex: 'var(--z-header)',
        } as React.CSSProperties}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            onClick={handleNavigationToggle}
            className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-transparent text-[#536175] transition hover:border-[#D8E2EF] hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:border-slate-700 dark:hover:bg-slate-900"
            aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>

          <div className="hidden min-w-[190px] border-l border-[#E5EAF1] pl-4 dark:border-slate-800 md:block">
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
            className="group ml-0 flex min-h-11 min-w-0 max-w-2xl flex-1 items-center gap-3 rounded-xl border border-[#D6DFEB] bg-[#F8FAFC] px-3 text-sm text-[#7B8798] transition hover:border-[#AFC3DE] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:border-slate-600 lg:ml-2"
            aria-label="Open global search and commands"
          >
            <Search className="h-4 w-4 shrink-0 text-[#667085] group-hover:text-[#1754E8] dark:text-slate-400" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-left">
              Search people, courses, payments and actions
            </span>
            <span className="hidden items-center gap-1 rounded-md border border-[#D6DFEB] bg-white px-2 py-1 text-[10px] font-extrabold text-[#667085] shadow-sm dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 sm:inline-flex">
              <Command className="h-3 w-3" aria-hidden="true" />K
            </span>
          </button>
        </div>

        <div className="ml-3 flex shrink-0 items-center gap-1 sm:gap-2">
          <div className="hidden min-h-9 items-center gap-2 rounded-xl border border-[#D6DFEB] bg-[#F8FAFC] px-3 text-[11px] font-bold text-[#536175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 xl:flex">
            <ShieldCheck className="h-4 w-4 text-[#078A57]" aria-hidden="true" />
            Secure context
          </div>

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#536175] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:bg-slate-900"
            onClick={() => setIsNotifDrawerOpen(true)}
            aria-label="Open notifications"
          >
            <Bell className="h-[19px] w-[19px]" aria-hidden="true" />
          </button>

          <Link
            href="/helpdesk"
            className="hidden min-h-11 min-w-11 items-center justify-center rounded-xl text-[#536175] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:bg-slate-900 md:inline-flex"
            aria-label="Open helpdesk"
          >
            <HelpCircle className="h-[19px] w-[19px]" aria-hidden="true" />
          </Link>

          <button
            type="button"
            onClick={toggleDarkMode}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#536175] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] dark:text-slate-300 dark:hover:bg-slate-900"
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
        onClose={() => setIsNotifDrawerOpen(false)}
      />
    </>
  );
}
