'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/auth-store';
import { Search, X, Calendar, BookOpen, CheckSquare, DollarSign, GraduationCap, Shield } from 'lucide-react';

export function CommandPalette() {
  const { isCmdPaletteOpen, setCmdPaletteOpen } = useAuthStore();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdPaletteOpen(!isCmdPaletteOpen);
      }
      if (e.key === 'Escape' && isCmdPaletteOpen) {
        setCmdPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCmdPaletteOpen, setCmdPaletteOpen]);

  if (!isCmdPaletteOpen) return null;

  const quickActions = [
    { label: 'Register Courses (Term 2)', icon: BookOpen, category: 'Academics' },
    { label: 'Mark Attendance Session', icon: CheckSquare, category: 'Attendance' },
    { label: 'Pay Fee Invoices via UPI', icon: DollarSign, category: 'Finance' },
    { label: 'View Grade Card & CGPA', icon: GraduationCap, category: 'Results' },
    { label: 'Platform Security Audit Log', icon: Shield, category: 'Admin' },
  ].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl overflow-hidden animate-fade-in">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-800">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search students, courses, notices..."
            className="w-full px-3 py-4 text-sm bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
            autoFocus
          />
          <button
            onClick={() => setCmdPaletteOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results List */}
        <div className="p-2 max-h-80 overflow-y-auto space-y-1">
          {quickActions.length > 0 ? (
            quickActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={() => setCmdPaletteOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-indigo-50 dark:hover:bg-indigo-950/60 transition group"
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className="text-indigo-500 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {action.label}
                    </span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 font-mono">
                    {action.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-xs text-gray-400">
              No matching commands or entities found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <span>
            Use <kbd className="px-1 bg-gray-200 dark:bg-gray-800 rounded">↑</kbd>{' '}
            <kbd className="px-1 bg-gray-200 dark:bg-gray-800 rounded">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="px-1 bg-gray-200 dark:bg-gray-800 rounded">ESC</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
