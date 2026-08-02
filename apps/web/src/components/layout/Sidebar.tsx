'use client';

import React from 'react';
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
  Bell,
  MessageSquare,
  Users,
  Shield,
  HelpCircle,
  Bus,
  Library,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  UserCheck
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  href: string;
  badge?: string;
}

export function Sidebar() {
  const { currentSession, isSidebarCollapsed, toggleSidebar } = useAuthStore();

  const getRoleNavItems = (): NavItem[] => {
    const role = currentSession.role;

    const common: NavItem[] = [
      { label: 'Overview', icon: LayoutDashboard, href: '/' },
      { label: 'Notices & Broadcasts', icon: Bell, href: '/notices', badge: '3' },
    ];

    switch (role) {
      case 'SUPER_ADMIN':
        return [
          ...common,
          { label: 'Tenants & Institutions', icon: Building2, href: '/admin/tenants' },
          { label: 'Platform Metrics', icon: Shield, href: '/admin/metrics' },
          { label: 'Global Audit Logs', icon: FileText, href: '/admin/audit' },
        ];

      case 'INSTITUTION_ADMIN':
        return [
          ...common,
          { label: 'Academic Calendar', icon: Calendar, href: '/academics' },
          { label: 'User Directory', icon: Users, href: '/users' },
          { label: 'Department Setup', icon: Building2, href: '/departments' },
          { label: 'Fee Rules & Ledgers', icon: DollarSign, href: '/finance' },
          { label: 'Audit Trail', icon: FileText, href: '/audit' },
        ];

      case 'HOD':
        return [
          ...common,
          { label: 'Department Courses', icon: BookOpen, href: '/courses' },
          { label: 'Faculty Workload', icon: UserCheck, href: '/workload' },
          { label: 'Exam Lock Approvals', icon: FileText, href: '/approvals' },
          { label: 'Attendance Shortages', icon: CheckSquare, href: '/attendance-shortage' },
        ];

      case 'FACULTY':
        return [
          ...common,
          { label: 'My Timetable', icon: Calendar, href: '/timetable' },
          { label: 'Mark Attendance', icon: CheckSquare, href: '/attendance' },
          { label: 'LMS Workspaces', icon: BookOpen, href: '/lms' },
          { label: 'Assignments & Rubrics', icon: FileText, href: '/assignments' },
          { label: 'Marks Entry', icon: GraduationCap, href: '/marks' },
        ];

      case 'STUDENT':
        return [
          ...common,
          { label: 'Course Registration', icon: BookOpen, href: '/registration', badge: 'Open' },
          { label: 'Class Timetable', icon: Calendar, href: '/timetable' },
          { label: 'Attendance Health', icon: CheckSquare, href: '/attendance' },
          { label: 'My Submissions', icon: FileText, href: '/submissions' },
          { label: 'Fee Payments', icon: DollarSign, href: '/fees' },
          { label: 'Exam Results', icon: GraduationCap, href: '/results' },
          { label: 'Hostel Outpass', icon: Building2, href: '/hostel' },
        ];

      case 'PARENT':
        return [
          ...common,
          { label: 'Child Progress', icon: GraduationCap, href: '/child-progress' },
          { label: 'Attendance Feed', icon: CheckSquare, href: '/child-attendance' },
          { label: 'Fee Statements', icon: DollarSign, href: '/child-fees' },
          { label: 'Outpass Approvals', icon: Building2, href: '/outpass-approval' },
        ];

      case 'WARDEN':
        return [
          ...common,
          { label: 'Hostel Occupancy', icon: Building2, href: '/hostel-rooms' },
          { label: 'Gate In/Out Logs', icon: Users, href: '/gate-logs' },
          { label: 'Outpass Requests', icon: FileText, href: '/outpasses', badge: '12' },
          { label: 'Mess & Menu', icon: BookOpen, href: '/mess' },
        ];

      case 'ACCOUNTANT':
        return [
          ...common,
          { label: 'Fee Structures', icon: DollarSign, href: '/fee-structures' },
          { label: 'Invoices & Receipts', icon: FileText, href: '/invoices' },
          { label: 'Reconciliation', icon: CheckSquare, href: '/reconcile' },
          { label: 'Defaulters List', icon: Users, href: '/defaulters' },
        ];

      default:
        return common;
    }
  };

  const navItems = getRoleNavItems();

  return (
    <aside
      className={`fixed top-0 left-0 bottom-0 z-30 transition-all duration-300 flex flex-col border-r bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl gradient-glow flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
            C
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-gray-900 dark:text-white">
                Campus<span className="text-indigo-500">OS</span>
              </span>
              <span className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">
                Enterprise ERP
              </span>
            </div>
          )}
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          title="Toggle Navigation"
        >
          {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Institution Name Pill */}
      {!isSidebarCollapsed && (
        <div className="mx-3 my-3 p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/50">
          <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate">
            {currentSession.institutionName}
          </p>
          <p className="text-[10px] text-indigo-500/80 dark:text-indigo-400/80 font-mono">
            {currentSession.tenantId}
          </p>
        </div>
      )}

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <a
              key={idx}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                idx === 0
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate flex-1">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    idx === 0
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </a>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3">
        <img
          src={currentSession.avatarUrl}
          alt={currentSession.name}
          className="w-9 h-9 rounded-full object-cover border-2 border-indigo-500 shrink-0"
        />
        {!isSidebarCollapsed && (
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-gray-900 dark:text-white truncate">
              {currentSession.name}
            </span>
            <span className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 uppercase font-bold truncate">
              {currentSession.role.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
