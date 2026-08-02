'use client';

import React from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { UserRole } from '../../lib/types';
import { Bell, Search, Moon, Sun, Shield, Command } from 'lucide-react';

export function Header() {
  const { currentSession, setRole, isDarkMode, toggleDarkMode, setCmdPaletteOpen } = useAuthStore();

  const roles: { role: UserRole; label: string }[] = [
    { role: 'SUPER_ADMIN', label: 'Super Admin' },
    { role: 'INSTITUTION_ADMIN', label: 'Institution Admin' },
    { role: 'HOD', label: 'Head of Dept (HOD)' },
    { role: 'FACULTY', label: 'Faculty' },
    { role: 'STUDENT', label: 'Student' },
    { role: 'PARENT', label: 'Parent' },
    { role: 'WARDEN', label: 'Warden' },
    { role: 'ACCOUNTANT', label: 'Accountant' },
  ];

  return (
    <header className="h-16 fixed top-0 right-0 left-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setCmdPaletteOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          <Search size={14} />
          <span>Quick Search...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] bg-white dark:bg-gray-900 border rounded shadow-xs font-mono">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-3">
        {/* Role Switcher for Pair Programming / Testing */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800">
          <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
          <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-200">Role:</span>
          <select
            value={currentSession.role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className="bg-transparent text-xs font-extrabold text-indigo-600 dark:text-indigo-300 focus:outline-none cursor-pointer"
          >
            {roles.map((r) => (
              <option key={r.role} value={r.role} className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
        >
          {isDarkMode ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-800">
          <img
            src={currentSession.avatarUrl}
            alt={currentSession.name}
            className="w-8 h-8 rounded-full object-cover border border-indigo-500"
          />
          <div className="hidden md:block text-left text-xs">
            <p className="font-bold text-gray-900 dark:text-gray-100 leading-tight">{currentSession.name}</p>
            <p className="text-[10px] text-gray-500 leading-tight">{currentSession.institutionName}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
