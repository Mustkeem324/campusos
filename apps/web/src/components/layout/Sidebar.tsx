'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '../../lib/auth-store';
import {
  LayoutDashboard,
  GraduationCap,
  Calendar,
  BookOpen,
  CheckSquare,
  FileText,
  DollarSign,
  Building2,
  Users,
  Shield,
  UserCheck,
  User,
  MessageSquare,
  HelpCircle,
  MessageCircle,
  Library,
  Video,
  CreditCard,
  Globe,
  Award,
  Database,
  Scale,
  Leaf,
  Brain,
  Bus,
  Settings,
  ChevronDown,
  ChevronRight,
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
  const { currentSession, isSidebarCollapsed, toggleSidebar } = useAuthStore();
  const pathname = usePathname();

  const getRoleNavGroups = (): NavGroup[] => {
    const role = currentSession.role;

    if (role === 'STUDENT') {
      return [
        {
          label: 'ACADEMICS',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard, tabId: 'dashboard' },
            { label: 'Learning (LMS)', icon: BookOpen, tabId: 'lms' },
            { label: 'Assignments', icon: FileText, tabId: 'assignments' },
            { label: 'Timetable', icon: Calendar, tabId: 'timetable' },
            { label: 'Attendance', icon: CheckSquare, tabId: 'attendance' },
            { label: 'Registration', icon: CheckSquare, tabId: 'registration' },
            { label: 'Examinations', icon: FileText, tabId: 'examinations' },
            { label: 'Results', icon: GraduationCap, tabId: 'results' },
            { label: 'Microcredentials', icon: Award, tabId: 'microcredentials' },
          ]
        },
        {
          label: 'CAMPUS',
          items: [
            { label: 'Helpdesk', icon: HelpCircle, tabId: 'helpdesk' },
            { label: 'Hostel', icon: Building2, tabId: 'hostel' },
            { label: 'Library (OPAC)', icon: Library, tabId: 'opac' },
            { label: 'Transport', icon: Bus, tabId: 'transport' },
            { label: 'Digital ID', icon: UserCheck, tabId: 'digital-id' },
            { label: 'Forum', icon: MessageCircle, tabId: 'forum' },
            { label: 'Webinars', icon: Video, tabId: 'webinars' },
          ]
        },
        {
          label: 'FINANCE & ADMIN',
          items: [
            { label: 'Fees & Payments', icon: DollarSign, tabId: 'payments' },
            { label: 'Scholarships', icon: Award, tabId: 'scholarships' },
            { label: 'Receipts', icon: FileText, tabId: 'receipts' },
            { label: 'Documents', icon: FileText, tabId: 'documents' },
            { label: 'Profile', icon: User, tabId: 'student-profile' },
          ]
        }
      ];
    }

    if (role === 'INSTITUTION_ADMIN' || role === 'SUPER_ADMIN') {
      return [
        {
          label: 'ADMINISTRATION',
          items: [
            { label: 'Dashboard', icon: LayoutDashboard, tabId: 'dashboard' },
            { label: 'Departments', icon: Building2, tabId: 'departments' },
            { label: 'Governance', icon: Scale, tabId: 'governance' },
            { label: 'Legal & Risk', icon: Shield, tabId: 'legal-risk' },
            { label: 'AI Governance', icon: Brain, tabId: 'ai-governance' },
            { label: 'Data Migration', icon: Database, tabId: 'data-migration' },
            { label: 'Sustainability', icon: Leaf, tabId: 'sustainability' },
            { label: 'Audit Logs', icon: FileText, tabId: 'audit' },
          ]
        },
        {
          label: 'ACADEMICS & CAMPUS',
          items: [
            { label: 'International', icon: Globe, tabId: 'international' },
            { label: 'Library', icon: Library, tabId: 'opac' },
            { label: 'Transport', icon: Bus, tabId: 'transport' },
            { label: 'Hostel', icon: Building2, tabId: 'hostel' },
          ]
        },
        {
          label: 'SETTINGS',
          items: [
            { label: 'Settings', icon: Settings, tabId: 'settings' },
          ]
        }
      ];
    }

    // Default structure for FACULTY and others
    return [
      {
        label: 'OVERVIEW',
        items: [
          { label: 'Dashboard', icon: LayoutDashboard, tabId: 'dashboard' },
          { label: 'LMS', icon: BookOpen, tabId: 'lms' },
          { label: 'Timetable', icon: Calendar, tabId: 'timetable' },
          { label: 'Attendance', icon: CheckSquare, tabId: 'attendance' },
          { label: 'Assignments', icon: FileText, tabId: 'assignments' },
          { label: 'Examinations', icon: FileText, tabId: 'examinations' },
          { label: 'Results', icon: GraduationCap, tabId: 'results' },
        ]
      },
      {
        label: 'SERVICES',
        items: [
          { label: 'Helpdesk', icon: HelpCircle, tabId: 'helpdesk' },
          { label: 'Community Hub', icon: MessageSquare, tabId: 'community' },
          { label: 'Settings', icon: Settings, tabId: 'settings' },
        ]
      }
    ];
  };

  const navGroups = getRoleNavGroups();

  // Human-readable role label for the footer
  const roleLabel = currentSession.role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <aside
      className="fixed left-0 flex flex-col border-r bg-surface border-border transition-all duration-300"
      style={{
        width: isSidebarCollapsed ? 'var(--sidebar-collapsed-w)' : 'var(--sidebar-w)',
        top: 'var(--impersonation-bar-h)',
        height: 'calc(100dvh - var(--impersonation-bar-h))',
        zIndex: 'var(--z-sidebar)',
      } as React.CSSProperties}
      aria-label="Main navigation"
    >
      {/* Brand Logo Header — same height as the app header */}
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

      {/* Institution Switcher */}
      {!isSidebarCollapsed && (
        <div className="px-4 py-4 shrink-0">
          <div className="p-3 rounded-lg bg-primary-soft border border-primary/20 flex items-start gap-3 cursor-pointer hover:bg-primary/10 transition">
            <div className="w-8 h-8 rounded bg-white flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-sm">
              UP
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-text-primary truncate">
                {currentSession.institutionName || 'UPES University'}
              </p>
              <p className="text-[11px] text-text-secondary truncate">
                Dehradun Campus
              </p>
            </div>
            <ChevronDown size={14} className="text-text-secondary mt-1 shrink-0" />
          </div>
        </div>
      )}

      {/* Navigation List — this is the only scrollable section */}
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
              const href = item.tabId === 'dashboard' ? '/dashboard' : `/${item.tabId}`;
              const isSelected = pathname === href;

              return (
                <a
                  key={idx}
                  href={href}
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
        {/* Bottom padding so last nav item is not obscured by footer */}
        <div className="h-2" aria-hidden="true" />
      </nav>

      {/* User Footer — fixed at bottom, never scrolls */}
      <div className="p-4 border-t border-border flex items-center gap-3 hover:bg-surface-muted cursor-pointer transition shrink-0">
        <img
          src={currentSession.avatarUrl}
          alt=""
          className="w-9 h-9 rounded-full object-cover shrink-0"
        />
        {!isSidebarCollapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[13px] font-semibold text-text-primary truncate">
              {currentSession.name}
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
  );
}
