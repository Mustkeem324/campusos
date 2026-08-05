'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../lib/auth-store';
import { dashboardDefinitionForRole } from '../../lib/dashboard/registry';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  BookOpen,
  CheckSquare,
  FileText,
  DollarSign,
  Building2,
  Shield,
  UserCheck,
  User,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Library,
  Award,
  Database,
  Scale,
  Leaf,
  Brain,
  Bus,
  Settings,
  ChevronRight
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  tabId: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

export function Sidebar() {
  const { currentSession, isSidebarCollapsed } = useAuthStore();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const toggleMobileNavigation = () => setIsMobileOpen((open) => !open);
    const closeMobileNavigation = () => setIsMobileOpen(false);
    window.addEventListener('campusos:toggle-mobile-navigation', toggleMobileNavigation);
    window.addEventListener('resize', closeMobileNavigation);
    return () => {
      window.removeEventListener('campusos:toggle-mobile-navigation', toggleMobileNavigation);
      window.removeEventListener('resize', closeMobileNavigation);
    };
  }, []);

  React.useEffect(() => { setIsMobileOpen(false); }, [pathname]);

  const iconForHref = (href: string): React.ElementType => {
    if (href.startsWith('/dashboard')) return LayoutDashboard;
    if (href.startsWith('/lms') || href.startsWith('/learning')) return BookOpen;
    if (href.startsWith('/assignments')) return FileText;
    if (href.startsWith('/timetable')) return Calendar;
    if (href.startsWith('/attendance')) return CheckSquare;
    if (href.startsWith('/registration')) return CheckSquare;
    if (href.startsWith('/examinations')) return FileText;
    if (href.startsWith('/results')) return GraduationCap;
    if (href.startsWith('/microcredentials')) return Award;
    if (href.startsWith('/helpdesk')) return HelpCircle;
    if (href.startsWith('/hostel')) return Building2;
    if (href.startsWith('/opac')) return Library;
    if (href.startsWith('/transport')) return Bus;
    if (href.startsWith('/digital-id')) return UserCheck;
    if (href.startsWith('/student-benefits')) return Award;
    if (href.startsWith('/forum')) return MessageCircle;
    if (href.startsWith('/payments') || href.startsWith('/receipts')) return DollarSign;
    if (href.startsWith('/scholarships')) return Award;
    if (href.startsWith('/documents')) return FileText;
    if (href.startsWith('/student-profile')) return User;
    if (href.startsWith('/platform/admissions')) return GraduationCap;
    if (href.startsWith('/departments')) return Building2;
    if (href.startsWith('/governance')) return Scale;
    if (href.startsWith('/legal-risk')) return Shield;
    if (href.startsWith('/ai-governance')) return Brain;
    if (href.startsWith('/data-migration')) return Database;
    if (href.startsWith('/sustainability')) return Leaf;
    if (href.startsWith('/audit')) return FileText;
    if (href.startsWith('/settings')) return Settings;
    if (href.startsWith('/community')) return MessageSquare;
    if (href.startsWith('/support')) return HelpCircle;
    if (href.startsWith('/notifications')) return MessageSquare;
    return LayoutDashboard;
  };

  const getRoleNavGroups = (): NavGroup[] => {
    const role = currentSession?.role || 'STUDENT';
    const definition = dashboardDefinitionForRole(role);

    return definition.navigation.map((group) => ({
      label: group.label,
      items: group.items.map((item) => ({
        label: item.label,
        icon: iconForHref(item.href),
        tabId: item.href.replace(/^\//, ''),
      })),
    }));
  };

  const navGroups = getRoleNavGroups();

  const roleLabel = (currentSession?.role || 'STUDENT')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (<>
    {isMobileOpen && <button type="button" className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setIsMobileOpen(false)} aria-label="Close navigation" />}
    <aside
      className={`app-sidebar fixed left-0 flex flex-col border-r bg-surface border-border transition-transform duration-300 max-md:-translate-x-full ${isMobileOpen ? 'max-md:translate-x-0' : ''}`}
      style={{
        width: isSidebarCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
        top: 'calc(var(--impersonation-bar-h) + var(--demo-banner-h))',
        height: 'calc(100dvh - var(--impersonation-bar-h) - var(--demo-banner-h))',
        zIndex: 'var(--z-sidebar)',
      } as React.CSSProperties}
      aria-label="Main navigation"
    >
      <div
        className="flex items-center justify-between px-4 border-b border-border shrink-0"
        style={{ height: 'var(--header-h)' }}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-white font-bold text-lg shrink-0">
            C
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-[15px] tracking-tight text-text-primary leading-tight">
                CampusOS
              </span>
            </div>
          )}
        </div>
      </div>

      {!isSidebarCollapsed && (
        <div className="px-4 py-4 shrink-0">
          <div className="p-3 rounded-lg bg-primary-soft border border-primary/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-sm">
              CDU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate">
                {currentSession?.institutionName || 'CampusOS Demo University'}
              </p>
              <p className="text-[11px] text-text-secondary truncate">{roleLabel} Portal</p>
            </div>
          </div>
        </div>
      )}

      <nav className="flex-1 min-h-0 px-3 py-2 overflow-y-auto sidebar-nav-scroll space-y-6" aria-label="Sidebar navigation">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[11px] font-semibold text-text-muted tracking-wider uppercase mb-2">
                {group.label}
              </p>
            )}
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              const href = `/${item.tabId}`;
              const isSelected = pathname === href;

              return (
                <a
                  key={idx}
                  href={href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-all group ${
                    isSelected
                      ? 'bg-primary-soft text-primary font-medium'
                      : 'text-text-secondary hover:bg-surface-muted hover:text-text-primary'
                  } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                  title={isSidebarCollapsed ? item.label : undefined}
                  aria-current={isSelected ? 'page' : undefined}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isSidebarCollapsed && (
                    <span className="truncate flex-1 text-left">{item.label}</span>
                  )}
                </a>
              );
            })}
          </div>
        ))}
        <div className="h-2" aria-hidden="true" />
      </nav>

      <div className="p-4 border-t border-border flex items-center gap-3 hover:bg-surface-muted cursor-pointer transition shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
          {(currentSession?.name || 'U').split(' ').map((n) => n[0]).join('').substring(0, 2)}
        </div>
        {!isSidebarCollapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {currentSession?.name || 'User'}
            </span>
            <span className="text-[11px] text-text-secondary truncate">
              {roleLabel}
            </span>
          </div>
        )}
        {!isSidebarCollapsed && (
          <ChevronRight size={16} className="text-text-muted shrink-0" />
        )}
      </div>
    </aside>
  </>);
}
