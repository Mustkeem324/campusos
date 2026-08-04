'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { 
  User, Settings, FileText, Activity, MapPin, 
  Globe, Moon, Sun, Eye, Clock, LayoutDashboard,
  Bell, VolumeX, Lock, Shield, Smartphone, Key,
  HelpCircle, Keyboard, Info, LogOut, ChevronRight, ChevronLeft,
  ChevronDown, Monitor, LifeBuoy
} from 'lucide-react';

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
        setTimeout(() => setActiveTab('main'), 200);
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
    } catch (e) {
      console.error('Logout failed');
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      setTimeout(() => setActiveTab('main'), 200);
    } else {
      setIsOpen(true);
    }
  };

  // Keyboard navigation support for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setActiveTab('main');
    }
  };

  if (!currentSession) return null;

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button 
        onClick={handleToggle}
        className="flex items-center gap-2 pl-1 cursor-pointer hover:bg-surface-muted p-1 rounded-md transition focus:outline-none focus:ring-2 focus:ring-primary"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <img
          src={currentSession.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt={`${currentSession.name}'s avatar`}
          className="w-7 h-7 rounded-full object-cover"
        />
        <div className="hidden lg:block text-left">
          <p className="text-[13px] font-semibold text-text-primary leading-tight">{currentSession.name}</p>
          <p className="text-[11px] text-text-secondary leading-tight capitalize">{currentSession.role.toLowerCase().replace('_', ' ')}</p>
        </div>
        <ChevronDown size={14} className="text-text-secondary ml-1" />
      </button>

      {isOpen && (
        <div 
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[min(85dvh,42rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl md:absolute md:inset-x-auto md:right-0 md:top-full md:mt-2 md:max-h-[600px] md:w-80 md:rounded-xl"
          role="menu"
        >
          {/* Mobile Drag Handle */}
          <div className="w-full flex justify-center py-2 md:hidden">
            <div className="w-10 h-1.5 bg-border rounded-full"></div>
          </div>

          <div className="p-4 border-b border-border flex items-center gap-3">
            <img
              src={currentSession.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt=""
              className="w-12 h-12 rounded-full object-cover border-2 border-surface-muted"
            />
            <div className="flex-1 overflow-hidden">
              <h3 className="text-sm font-semibold text-text-primary truncate">{currentSession.name}</h3>
              <p className="text-xs text-text-secondary truncate">{currentSession.email}</p>
              <div className="flex gap-2 mt-1">
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-medium">
                  {currentSession.role.replace('_', ' ')}
                </span>
                <span className="text-[10px] bg-surface-muted text-text-secondary px-1.5 py-0.5 rounded font-medium truncate">
                  {currentSession.institutionName || 'Campus'}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto overflow-x-hidden relative" style={{ minHeight: '300px' }}>
            {activeTab === 'main' && (
              <div className="p-2 space-y-1 animate-in fade-in slide-in-from-left-4 duration-200">
                <MenuButton icon={User} label="Account" onClick={() => setActiveTab('account')} />
                <MenuButton icon={Settings} label="Preferences" onClick={() => setActiveTab('preferences')} />
                <MenuButton icon={Bell} label="Communication" onClick={() => setActiveTab('communication')} />
                <MenuButton icon={Shield} label="Security" onClick={() => setActiveTab('security')} />
                <MenuButton icon={HelpCircle} label="Help" onClick={() => setActiveTab('help')} />
                
                <div className="h-px bg-border my-2"></div>
                
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-danger hover:bg-danger/10 rounded-lg transition"
                  role="menuitem"
                >
                  <LogOut size={16} />
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
                <div className="h-px bg-border my-1"></div>
                <SubMenuItem icon={Info} label="About CampusOS" />
              </SubMenu>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-muted rounded-lg transition"
      role="menuitem"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-text-secondary" />
        <span>{label}</span>
      </div>
      <ChevronRight size={14} className="text-text-muted" />
    </button>
  );
}

function SubMenu({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="p-2 space-y-1 animate-in fade-in slide-in-from-right-4 duration-200">
      <button
        onClick={onBack}
        className="w-full flex items-center gap-2 px-2 py-2 mb-2 text-sm font-medium text-text-secondary hover:text-text-primary transition"
      >
        <ChevronLeft size={16} />
        <span>Back</span>
      </button>
      <div className="px-2 mb-2">
        <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wider">{title}</h4>
      </div>
      {children}
    </div>
  );
}

function SubMenuItem({ icon: Icon, label, value, onClick }: { icon: any; label: string; value?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between px-3 py-2 text-sm text-text-primary hover:bg-surface-muted rounded-lg transition"
      role="menuitem"
    >
      <div className="flex items-center gap-3">
        <Icon size={16} className="text-text-secondary" />
        <span>{label}</span>
      </div>
      {value && <span className="text-xs text-text-secondary">{value}</span>}
    </button>
  );
}
