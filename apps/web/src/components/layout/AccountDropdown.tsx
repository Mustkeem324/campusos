'use client';

import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';
import {
  Activity,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Globe,
  HelpCircle,
  Info,
  Key,
  Keyboard,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  LogOut,
  MapPin,
  Monitor,
  Moon,
  Settings,
  Shield,
  Smartphone,
  Sun,
  User,
  VolumeX,
  type LucideIcon,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';

type Tab = 'main' | 'account' | 'preferences' | 'communication' | 'security' | 'help';

export function AccountDropdown() {
  const { currentSession, isDarkMode, toggleDarkMode } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('main');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        window.setTimeout(() => setActiveTab('main'), 200);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      useAuthStore.getState().setSession(null);
      window.location.href = '/login';
    } catch (error: unknown) {
      console.error('Logout failed', error);
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      window.setTimeout(() => setActiveTab('main'), 200);
      return;
    }

    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setActiveTab('main');
    }
  };

  if (!currentSession) return null;

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        type="button"
        onClick={handleToggle}
        className="flex cursor-pointer items-center gap-2 rounded-md p-1 pl-1 transition hover:bg-surface-muted focus:outline-none focus:ring-2 focus:ring-primary"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Open account menu"
      >
        <AccountAvatar name={currentSession.name} src={currentSession.avatarUrl} size="small" />
        <div className="hidden text-left lg:block">
          <p className="text-[13px] font-semibold leading-tight text-text-primary">{currentSession.name}</p>
          <p className="text-[11px] capitalize leading-tight text-text-secondary">
            {currentSession.role.toLowerCase().replace(/_/g, ' ')}
          </p>
        </div>
        <ChevronDown size={14} className="ml-1 text-text-secondary" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85dvh,42rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[600px] md:w-80 md:rounded-xl"
          role="menu"
          aria-label="Account menu"
        >
          <div className="flex w-full justify-center py-2 md:hidden" aria-hidden="true">
            <div className="h-1.5 w-10 rounded-full bg-border" />
          </div>

          <div className="flex items-center gap-3 border-b border-border p-4">
            <AccountAvatar name={currentSession.name} src={currentSession.avatarUrl} size="large" />
            <div className="flex-1 overflow-hidden">
              <h3 className="truncate text-sm font-semibold text-text-primary">{currentSession.name}</h3>
              <p className="truncate text-xs text-text-secondary">{currentSession.email}</p>
              <div className="mt-1 flex gap-2">
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-primary">
                  {currentSession.role.replace(/_/g, ' ')}
                </span>
                <span className="truncate rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
                  {currentSession.institutionName || 'Campus'}
                </span>
              </div>
            </div>
          </div>

          <div className="relative overflow-x-hidden overflow-y-auto" style={{ minHeight: '300px' }}>
            {activeTab === 'main' && (
              <div className="animate-in space-y-1 p-2 duration-200 fade-in slide-in-from-left-4">
                <MenuButton icon={User} label="Account" onClick={() => setActiveTab('account')} />
                <MenuButton icon={Settings} label="Preferences" onClick={() => setActiveTab('preferences')} />
                <MenuButton icon={Bell} label="Communication" onClick={() => setActiveTab('communication')} />
                <MenuButton icon={Shield} label="Security" onClick={() => setActiveTab('security')} />
                <MenuButton icon={HelpCircle} label="Help" onClick={() => setActiveTab('help')} />

                <div className="my-2 h-px bg-border" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-danger transition hover:bg-danger/10"
                  role="menuitem"
                >
                  <LogOut size={16} aria-hidden="true" />
                  <span>Sign out</span>
                </button>
              </div>
            )}

            {activeTab === 'account' && (
              <SubMenu title="Account" onBack={() => setActiveTab('main')}>
                <SubMenuItem icon={User} label="Profile" />
                <SubMenuItem icon={Settings} label="Account Settings" />
                <SubMenuItem icon={FileText} label="Documents" />
                <SubMenuItem icon={Activity} label="Activity Log" />
                <SubMenuItem icon={MapPin} label="Switch Role/Campus" />
              </SubMenu>
            )}

            {activeTab === 'preferences' && (
              <SubMenu title="Preferences" onBack={() => setActiveTab('main')}>
                <SubMenuItem icon={Globe} label="Language" value="English (UK)" />
                <SubMenuItem
                  icon={isDarkMode ? Moon : Sun}
                  label="Appearance"
                  value={isDarkMode ? 'Dark' : 'Light'}
                  onClick={toggleDarkMode}
                />
                <SubMenuItem icon={Eye} label="Accessibility" />
                <SubMenuItem icon={Clock} label="Time Zone" value="UTC+05:30" />
                <SubMenuItem icon={LayoutDashboard} label="Start Page" value="Dashboard" />
              </SubMenu>
            )}

            {activeTab === 'communication' && (
              <SubMenu title="Communication" onBack={() => setActiveTab('main')}>
                <SubMenuItem icon={Bell} label="Notification Preferences" />
                <SubMenuItem icon={VolumeX} label="Quiet Hours" />
              </SubMenu>
            )}

            {activeTab === 'security' && (
              <SubMenu title="Security" onBack={() => setActiveTab('main')}>
                <SubMenuItem icon={Key} label="Change Password" />
                <SubMenuItem icon={Smartphone} label="Two-Factor Auth (2FA)" />
                <SubMenuItem icon={Monitor} label="Active Sessions" />
                <SubMenuItem icon={Shield} label="Connected Accounts" />
                <SubMenuItem icon={Lock} label="Privacy Settings" />
              </SubMenu>
            )}

            {activeTab === 'help' && (
              <SubMenu title="Help" onBack={() => setActiveTab('main')}>
                <SubMenuItem icon={LifeBuoy} label="Help Centre" />
                <SubMenuItem icon={HelpCircle} label="Contact Support" />
                <SubMenuItem icon={Keyboard} label="Keyboard Shortcuts" />
                <div className="my-1 h-px bg-border" />
                <SubMenuItem icon={Info} label="About CampusOS" />
              </SubMenu>
            )}
          </div>
        </div>
      )}
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
  const dimension = size === 'large' ? 48 : 28;
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
  const localSource = typeof src === 'string' && src.startsWith('/') ? src : null;

  if (localSource) {
    return (
      <Image
        src={localSource}
        alt={`${name}'s avatar`}
        width={dimension}
        height={dimension}
        className={`${size === 'large' ? 'h-12 w-12 border-2 border-surface-muted' : 'h-7 w-7'} rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary ${
        size === 'large' ? 'h-12 w-12 text-sm' : 'h-7 w-7 text-[10px]'
      }`}
    >
      {initials || 'U'}
    </span>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-primary transition hover:bg-surface-muted"
      role="menuitem"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-text-secondary" aria-hidden="true" />
        <span>{label}</span>
      </div>
      <ChevronRight size={14} className="text-text-muted" aria-hidden="true" />
    </button>
  );
}

function SubMenu({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="animate-in space-y-1 p-2 duration-200 fade-in slide-in-from-right-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-2 flex w-full items-center gap-2 px-2 py-2 text-sm font-medium text-text-secondary transition hover:text-text-primary"
      >
        <ChevronLeft size={16} aria-hidden="true" />
        <span>Back</span>
      </button>
      <div className="mb-2 px-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function SubMenuItem({
  icon: Icon,
  label,
  value,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-text-primary transition hover:bg-surface-muted"
      role="menuitem"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-text-secondary" aria-hidden="true" />
        <span>{label}</span>
      </div>
      {value && <span className="text-xs text-text-secondary">{value}</span>}
    </button>
  );
}
