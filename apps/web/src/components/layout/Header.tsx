'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../lib/auth-store';
import { Bell, Search, Moon, Sun, HelpCircle, Menu } from 'lucide-react';
import { AccountDropdown } from './AccountDropdown';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

export function Header() {
  const { currentSession, isDarkMode, toggleDarkMode, setCmdPaletteOpen, toggleSidebar, isSidebarCollapsed } = useAuthStore();
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = React.useState(false);
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
        className="app-header fixed right-0 bg-surface border-b border-border transition-all duration-300 flex items-center justify-between px-3 sm:px-4"
        style={{
          height: 'var(--header-h)',
          top: 'var(--impersonation-bar-h)',
          left: isSidebarCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
          zIndex: 'var(--z-header)',
        } as React.CSSProperties}
      >
        {/* Left: hamburger + search */}
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={handleNavigationToggle}
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition"
            aria-label={isSidebarCollapsed ? 'Expand navigation' : 'Collapse navigation'}
          >
            <Menu size={18} />
          </button>
          <button
            onClick={() => setCmdPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface-muted border border-border text-text-muted text-[13px] hover:border-border-strong transition min-w-0 max-w-xs w-full"
            aria-label="Open search (Ctrl+K)"
          >
            <Search size={14} className="shrink-0" />
            <span className="flex-1 text-left truncate">Search courses, payments, notices...</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-surface border border-border rounded text-text-secondary font-mono shrink-0">
              ⌘ K
            </kbd>
          </button>
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 shrink-0 ml-3">
          <span className="hidden lg:block max-w-52 truncate text-[13px] font-medium text-text-secondary">
            {currentSession.role.replace(/_/g, ' ').toLowerCase()}
          </span>

          <div className="w-px h-4 bg-border mx-1 hidden md:block"></div>

          <button
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition relative"
            onClick={() => setIsNotifDrawerOpen(true)}
            aria-label="Open notifications"
          >
            <Bell size={18} />
          </button>

          <Link href="/helpdesk" className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition hidden md:flex" aria-label="Open helpdesk">
            <HelpCircle size={18} />
          </Link>

          <button
            onClick={toggleDarkMode}
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition"
            aria-label={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="w-px h-4 bg-border mx-1"></div>

          <AccountDropdown />
        </div>
      </header>

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
      />
    </>
  );
}
