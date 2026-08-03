'use client';

import React from 'react';
import { ShieldAlert, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';
import { UserRole } from '../../lib/types';

const IMPERSONATION_ROLES: { role: UserRole; label: string; color: string }[] = [
  { role: 'STUDENT', label: 'Student', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { role: 'FACULTY', label: 'Faculty', color: 'bg-purple-600 hover:bg-purple-700' },
  { role: 'ACCOUNTANT', label: 'Accountant', color: 'bg-emerald-600 hover:bg-emerald-700' },
];

export function ImpersonationBanner() {
  const { currentSession, setRole } = useAuthStore();
  const [isImpersonating, setIsImpersonating] = React.useState(false);
  const [originalAdmin, setOriginalAdmin] = React.useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const startImpersonation = (targetRole: UserRole) => {
    setOriginalAdmin(currentSession.name);
    setIsImpersonating(true);
    setRole(targetRole);
    setMobileMenuOpen(false);
  };

  const stopImpersonation = () => {
    setIsImpersonating(false);
    setOriginalAdmin(null);
    setRole('SUPER_ADMIN');
  };

  // Toggle .impersonation-active on <html> to shift layout tokens
  React.useEffect(() => {
    document.documentElement.classList.toggle('impersonation-active', true);
    return () => {
      // Keep active — the banner always renders for super admins
    };
  }, []);

  if (!isImpersonating) {
    return (
      <div
        className="bg-slate-900 text-white text-[11px] px-4 flex items-center justify-between"
        style={{ height: 'var(--impersonation-bar-h)', zIndex: 'var(--z-impersonation)' } as React.CSSProperties}
        role="status"
        aria-label="Super Admin Impersonation Console"
      >
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert size={14} className="text-amber-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold whitespace-nowrap hidden lg:inline">Super Admin Impersonation Console:</span>
          <span className="text-slate-300 hidden xl:inline whitespace-nowrap">Select persona to simulate tenant view</span>
        </div>

        {/* Desktop: individual buttons */}
        <div className="hidden lg:flex gap-2 shrink-0">
          {IMPERSONATION_ROLES.map((r) => (
            <button
              key={r.role}
              onClick={() => startImpersonation(r.role)}
              className={`px-2 py-0.5 rounded text-white font-bold text-[11px] whitespace-nowrap ${r.color}`}
            >
              Impersonate {r.label}
            </button>
          ))}
        </div>

        {/* Tablet/Mobile: dropdown */}
        <div className="relative lg:hidden shrink-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px]"
          >
            Impersonate as…
            <ChevronDown size={12} />
          </button>
          {mobileMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-1" style={{ zIndex: 'var(--z-dropdown)' } as React.CSSProperties}>
              {IMPERSONATION_ROLES.map((r) => (
                <button
                  key={r.role}
                  onClick={() => startImpersonation(r.role)}
                  className="w-full text-left px-3 py-2 text-[11px] text-white hover:bg-slate-700 font-semibold"
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="bg-rose-600 text-white text-xs px-4 flex items-center justify-between font-bold shadow-md"
      style={{ height: 'var(--impersonation-bar-h)', zIndex: 'var(--z-impersonation)' } as React.CSSProperties}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert size={16} className="shrink-0" aria-hidden="true" />
        <span className="truncate">
          <span className="hidden sm:inline">⚠️ ACTIVE IMPERSONATION · </span>
          Viewing as {currentSession.role} ({currentSession.name})
        </span>
        <span className="text-rose-200 text-[10px] border border-rose-400 px-1.5 py-0.5 rounded hidden md:inline whitespace-nowrap">
          Audit Recorded
        </span>
      </div>

      <button
        onClick={stopImpersonation}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-extrabold shadow shrink-0 ml-2"
      >
        <LogOut size={14} aria-hidden="true" />
        <span className="hidden sm:inline">Exit Impersonation</span>
        <span className="sm:hidden">Exit</span>
      </button>
    </div>
  );
}
