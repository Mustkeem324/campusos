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
  Users,
  Shield,
  UserCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ElementType;
  tabId: string;
  badge?: string;
}

interface SidebarProps {
  activeTab?: string;
  onSelectTab?: (tabId: string) => void;
}

export function Sidebar({ activeTab = 'dashboard', onSelectTab }: SidebarProps) {
  const { currentSession, isSidebarCollapsed, toggleSidebar } = useAuthStore();

  const getRoleNavItems = (): NavItem[] => {
    const role = currentSession.role;

    const common: NavItem[] = [
      { label: 'Overview', icon: LayoutDashboard, tabId: 'dashboard' },
      { label: 'Public Cert Verification', icon: Shield, tabId: 'verify-cert' },
      { label: 'ROI Calculator', icon: DollarSign, tabId: 'roi-calc' },
    ];

    switch (role) {
      case 'SUPER_ADMIN':
        return [
          ...common,
          { label: 'Group Treasury', icon: Building2, tabId: 'group-treasury' },
          { label: 'Prometheus Metrics', icon: Shield, tabId: 'prometheus-metrics' },
          { label: 'Chaos Testing', icon: FileText, tabId: 'chaos-testing' },
          { label: 'Audit Logs', icon: FileText, tabId: 'audit' },
        ];

      case 'INSTITUTION_ADMIN':
        return [
          ...common,
          { label: 'Academic Setup', icon: Calendar, tabId: 'academic-setup' },
          { label: 'SaaS Provisioning', icon: Building2, tabId: 'saas-provision' },
          { label: 'Fee Structures', icon: DollarSign, tabId: 'fee-structures' },
          { label: 'Audit Logs', icon: FileText, tabId: 'audit' },
        ];

      case 'HOD':
        return [
          ...common,
          { label: 'Course Catalogue', icon: BookOpen, tabId: 'catalogue' },
          { label: 'Marks Lock Approvals', icon: FileText, tabId: 'marks-lock' },
          { label: 'Faculty Publications', icon: BookOpen, tabId: 'publications' },
        ];

      case 'FACULTY':
        return [
          ...common,
          { label: 'Timetable', icon: Calendar, tabId: 'timetable' },
          { label: 'Mark Attendance', icon: CheckSquare, tabId: 'attendance' },
          { label: 'LMS Workspaces', icon: BookOpen, tabId: 'lms' },
          { label: 'Research Grants', icon: DollarSign, tabId: 'grants' },
        ];

      case 'STUDENT':
        return [
          ...common,
          { label: 'Course Registration', icon: BookOpen, tabId: 'registration', badge: 'Open' },
          { label: 'Class Timetable', icon: Calendar, tabId: 'timetable' },
          { label: 'Attendance', icon: CheckSquare, tabId: 'attendance' },
          { label: 'Fee Payments', icon: DollarSign, tabId: 'payments' },
          { label: 'Grade Card Marksheet', icon: GraduationCap, tabId: 'marksheet' },
          { label: 'Hostel Management', icon: Building2, tabId: 'hostel' },
        ];

      case 'PARENT':
        return [
          ...common,
          { label: 'Student Progress', icon: GraduationCap, tabId: 'dashboard' },
          { label: 'Attendance Feed', icon: CheckSquare, tabId: 'attendance' },
          { label: 'Fee Payments', icon: DollarSign, tabId: 'payments' },
          { label: 'Outpass Approvals', icon: Building2, tabId: 'hostel' },
        ];

      case 'WARDEN':
        return [
          ...common,
          { label: 'Hostel Outpasses', icon: Building2, tabId: 'hostel' },
          { label: 'Transport Tracker', icon: Building2, tabId: 'transport' },
        ];

      case 'ACCOUNTANT':
        return [
          ...common,
          { label: 'Fee Structures', icon: DollarSign, tabId: 'fee-structures' },
          { label: 'Payments Console', icon: FileText, tabId: 'payments' },
          { label: 'Treasury Dashboard', icon: DollarSign, tabId: 'treasury' },
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
          const isSelected = activeTab === item.tabId;

          return (
            <button
              key={idx}
              onClick={() => onSelectTab && onSelectTab(item.tabId)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon size={20} className="shrink-0" />
              {!isSidebarCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!isSidebarCollapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
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
