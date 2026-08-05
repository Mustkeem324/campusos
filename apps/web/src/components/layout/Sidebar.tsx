'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Award,
  BookOpen,
  Brain,
  BriefcaseBusiness,
  Building2,
  Bus,
  Calendar,
  CheckSquare,
  ChevronRight,
  Database,
  DollarSign,
  FileText,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Leaf,
  Library,
  MessageCircle,
  MessageSquare,
  Scale,
  Settings,
  Shield,
  User,
  UserCheck,
  X,
} from 'lucide-react';

import { useAuthStore } from '../../lib/auth-store';
import { dashboardDefinitionForRole } from '../../lib/dashboard/registry';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

function formatRole(role?: string) {
  if (!role) return 'Workspace member';

  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function initialsFor(value: string) {
  const initials = value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'CO';
}

function iconForHref(href: string): React.ElementType {
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
  if (href.startsWith('/recruitment')) return BriefcaseBusiness;
  return LayoutDashboard;
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

  React.useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const navGroups: NavGroup[] = currentSession?.role
    ? dashboardDefinitionForRole(currentSession.role).navigation.map((group) => ({
        label: group.label,
        items: group.items.map((item) => ({
          label: item.label,
          icon: iconForHref(item.href),
          href: item.href,
        })),
      }))
    : [];

  const roleLabel = formatRole(currentSession?.role);
  const institutionName = currentSession?.institutionName ?? 'CampusOS Institution';
  const userName = currentSession?.name ?? 'CampusOS user';
  const showExpandedContent = !isSidebarCollapsed || isMobileOpen;

  return (
    <>
      {isMobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-[65] bg-[#101D38]/60 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
          aria-label="Close navigation"
        />
      )}

      <aside
        className={`app-sidebar fixed left-0 flex flex-col border-r border-[#D9E3F0] bg-white shadow-[10px_0_34px_rgba(16,29,56,0.04)] transition-[width,transform] duration-300 dark:border-slate-800 dark:bg-slate-950 max-md:-translate-x-full ${
          isMobileOpen ? 'max-md:translate-x-0' : ''
        }`}
        style={{
          width: isSidebarCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
          top: 'calc(var(--impersonation-bar-h) + var(--demo-banner-h))',
          height: 'calc(100dvh - var(--impersonation-bar-h) - var(--demo-banner-h))',
          zIndex: isMobileOpen ? 'var(--z-drawer)' : 'var(--z-sidebar)',
        } as React.CSSProperties}
        aria-label="Main navigation"
      >
        <div
          className="flex shrink-0 items-center justify-between border-b border-[#263D61] bg-[#101D38] px-4 text-white"
          style={{ height: 'var(--header-h)' }}
        >
          <Link
            href="/dashboard"
            className={`flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-white ${
              showExpandedContent ? '' : 'mx-auto'
            }`}
            aria-label="CampusOS dashboard"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1754E8] text-base font-extrabold text-white shadow-[0_8px_20px_rgba(23,84,232,0.32)]">
              C
            </span>
            {showExpandedContent && (
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-extrabold tracking-tight">CampusOS</span>
                <span className="mt-0.5 block truncate text-[10px] font-semibold uppercase tracking-[0.13em] text-[#AFC0D8]">
                  Institutional workspace
                </span>
              </span>
            )}
          </Link>

          {isMobileOpen && (
            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-[#D9E4F3] hover:bg-white/10 md:hidden"
              aria-label="Close navigation menu"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          )}
        </div>

        <div className={`shrink-0 ${showExpandedContent ? 'px-4 py-4' : 'px-3 py-4'}`}>
          <div
            className={`rounded-2xl border border-[#CBD9EC] bg-[#F2F6FC] dark:border-slate-700 dark:bg-slate-900 ${
              showExpandedContent ? 'p-3.5' : 'p-2'
            }`}
            title={!showExpandedContent ? institutionName : undefined}
          >
            <div className={`flex items-center ${showExpandedContent ? 'gap-3' : 'justify-center'}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#C4D4EC] bg-white text-xs font-extrabold text-[#1754E8] shadow-sm dark:border-slate-700 dark:bg-slate-950">
                {initialsFor(institutionName)}
              </div>
              {showExpandedContent && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-bold text-[#101D38] dark:text-white">{institutionName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-[#667085] dark:text-slate-400">{roleLabel} portal</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav
          className="sidebar-nav-scroll min-h-0 flex-1 space-y-6 overflow-y-auto px-3 pb-4"
          aria-label="Sidebar navigation"
        >
          {navGroups.map((group) => (
            <section key={group.label} aria-labelledby={`nav-group-${group.label.replace(/\s+/g, '-').toLowerCase()}`}>
              {showExpandedContent && (
                <h2
                  id={`nav-group-${group.label.replace(/\s+/g, '-').toLowerCase()}`}
                  className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8A95A6] dark:text-slate-500"
                >
                  {group.label}
                </h2>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isSelected = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(`${item.href}/`));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={`group flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-[13px] font-semibold transition ${
                        isSelected
                          ? 'border border-[#C6D7F4] bg-[#EAF0FF] text-[#1754E8] shadow-[0_5px_14px_rgba(23,84,232,0.08)] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300'
                          : 'border border-transparent text-[#536175] hover:border-[#E1E7EF] hover:bg-[#F6F8FB] hover:text-[#101D38] dark:text-slate-400 dark:hover:border-slate-800 dark:hover:bg-slate-900 dark:hover:text-white'
                      } ${showExpandedContent ? '' : 'justify-center px-2'}`}
                      title={!showExpandedContent ? item.label : undefined}
                      aria-current={isSelected ? 'page' : undefined}
                    >
                      <Icon className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
                      {showExpandedContent && <span className="min-w-0 flex-1 truncate text-left">{item.label}</span>}
                      {showExpandedContent && item.badge && (
                        <span className="rounded-full bg-[#1754E8] px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          ))}

          {navGroups.length === 0 && showExpandedContent && (
            <div className="rounded-2xl border border-dashed border-[#CBD5E1] p-4 text-center dark:border-slate-700">
              <p className="text-xs font-semibold text-[#667085] dark:text-slate-400">Loading authorised navigation…</p>
            </div>
          )}
        </nav>

        <div className="shrink-0 border-t border-[#E1E7EF] p-3 dark:border-slate-800">
          <div
            className={`flex items-center rounded-2xl bg-[#F7F9FC] p-2.5 dark:bg-slate-900 ${
              showExpandedContent ? 'gap-3' : 'justify-center'
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#DCE7FF] text-xs font-extrabold text-[#1754E8] dark:bg-blue-950 dark:text-blue-300">
              {initialsFor(userName)}
            </div>
            {showExpandedContent && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-[#101D38] dark:text-white">{userName}</p>
                <p className="mt-0.5 truncate text-[11px] text-[#667085] dark:text-slate-400">{roleLabel}</p>
              </div>
            )}
            {showExpandedContent && <ChevronRight className="h-4 w-4 shrink-0 text-[#98A2B3]" aria-hidden="true" />}
          </div>
        </div>
      </aside>
    </>
  );
}
