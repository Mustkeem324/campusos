'use client';

import React from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { UserRole } from '../../lib/types';
import { Bell, Search, Moon, Sun, HelpCircle, ChevronDown, Menu, MapPin } from 'lucide-react';
import { AccountDropdown } from './AccountDropdown';
import { NotificationDrawer } from '../notifications/NotificationDrawer';

export function Header() {
  const { currentSession, setRole, isDarkMode, toggleDarkMode, setCmdPaletteOpen, toggleSidebar, isSidebarCollapsed } = useAuthStore();
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = React.useState(false);

  const roles: { role: UserRole; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin' },
    { role: 'INSTITUTION_ADMIN', label: 'Institution Admin' },
    { role: 'REGISTRAR', label: 'Registrar' },
    { role: 'DEAN', label: 'Dean' },
    { role: 'HOD', label: 'Head of Dept' },
    { role: 'FACULTY', label: 'Faculty' },
    { role: 'STUDENT', label: 'Student' },
    { role: 'PARENT', label: 'Parent' },
    { role: 'FINANCE_OFFICER', label: 'Finance Officer' },
    { role: 'ACCOUNTANT', label: 'Accountant' },
    { role: 'HR_ADMIN', label: 'HR Admin' },
    { role: 'WARDEN', label: 'Warden' },
    { role: 'LIBRARIAN', label: 'Librarian' },
    { role: 'TRANSPORT_MANAGER', label: 'Transport Mgr' },
    { role: 'PLACEMENT_OFFICER', label: 'Placement Officer' },
    { role: 'ADMISSIONS_COUNSELLOR', label: 'Admissions' },
    { role: 'EXAMINATION_CONTROLLER', label: 'Exam Controller' },
  ];

  return (
    <>
      <header
        className="fixed right-0 bg-surface border-b border-border transition-all duration-300 flex items-center justify-between px-4"
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
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition"
            aria-label={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
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
          {/* Role Switcher */}
          <div className="hidden lg:flex items-center">
            <label htmlFor="role-switcher" className="sr-only">Current role</label>
            <select
              id="role-switcher"
              value={currentSession.role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-transparent text-[13px] font-medium text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 rounded cursor-pointer hover:text-text-primary transition"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role} className="bg-surface text-text-primary">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Campus Selector */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-surface-muted cursor-pointer transition text-text-secondary">
            <MapPin size={14} />
            <span className="text-[13px] font-medium">Dehradun</span>
            <ChevronDown size={14} />
          </div>

          <div className="w-px h-4 bg-border mx-1 hidden md:block"></div>

          <button
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition relative"
            onClick={() => setIsNotifDrawerOpen(true)}
            aria-label="Open notifications"
          >
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" aria-hidden="true"></span>
          </button>

          <button
            className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition hidden md:flex"
            aria-label="Help"
          >
            <HelpCircle size={18} />
          </button>

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
