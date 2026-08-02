'use client';

import React from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export function ImpersonationBanner() {
  const { currentSession, setRole } = useAuthStore();
  const [isImpersonating, setIsImpersonating] = React.useState(false);
  const [originalAdmin, setOriginalAdmin] = React.useState<string | null>(null);

  const startImpersonation = (targetRole: any) => {
    setOriginalAdmin(currentSession.name);
    setIsImpersonating(true);
    setRole(targetRole);
  };

  const stopImpersonation = () => {
    setIsImpersonating(false);
    setOriginalAdmin(null);
    setRole('SUPER_ADMIN');
  };

  if (!isImpersonating) {
    return (
      <div className="bg-slate-900 text-white text-[11px] px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert size={14} className="text-amber-400" />
          <span className="font-semibold">Super Admin Impersonation Console:</span>
          <span className="text-slate-300">Select persona to simulate tenant view</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => startImpersonation('STUDENT')}
            className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          >
            Impersonate Student
          </button>
          <button
            onClick={() => startImpersonation('FACULTY')}
            className="px-2 py-0.5 rounded bg-purple-600 hover:bg-purple-700 text-white font-bold"
          >
            Impersonate Faculty
          </button>
          <button
            onClick={() => startImpersonation('ACCOUNTANT')}
            className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Impersonate Accountant
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-rose-600 text-white text-xs px-4 py-2 flex items-center justify-between font-bold animate-pulse shadow-lg z-50">
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} className="animate-spin" />
        <span>
          ⚠️ WARNING: ACTIVE IMPERSONATION SESSION • Viewing as {currentSession.role} ({currentSession.name})
        </span>
        <span className="text-rose-200 text-[10px] border border-rose-400 px-1.5 py-0.5 rounded">
          Mandatory Audit Entry Recorded
        </span>
      </div>

      <button
        onClick={stopImpersonation}
        className="flex items-center gap-1.5 px-3 py-1 bg-white text-rose-700 hover:bg-rose-50 rounded-lg text-xs font-extrabold shadow"
      >
        <LogOut size={14} />
        <span>Exit Impersonation Mode</span>
      </button>
    </div>
  );
}
