'use client';

import { Loader2, LogOut, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { useAuthStore } from '@/lib/auth-store';

type LogoutMode = 'current' | 'all' | null;

export function ProfileSessionActions() {
  const router = useRouter();
  const [logoutMode, setLogoutMode] = useState<LogoutMode>(null);
  const [error, setError] = useState<string | null>(null);

  const performLogout = async (mode: Exclude<LogoutMode, null>) => {
    if (mode === 'all') {
      const confirmed = window.confirm('Sign out this account from every active browser and device session?');
      if (!confirmed) return;
    }

    setError(null);
    setLogoutMode(mode);

    try {
      const response = await fetch(mode === 'all' ? '/api/auth/logout-all' : '/api/auth/logout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload === 'object' && payload && 'error' in payload
          ? String(payload.error)
          : 'Sign out failed. Please try again.';
        throw new Error(message);
      }

      useAuthStore.getState().setSession(null);
      window.localStorage.removeItem('campusos-auth-storage');
      router.push('/login');
      router.refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Sign out failed. Please try again.');
      setLogoutMode(null);
    }
  };

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => void performLogout('current')}
          disabled={logoutMode !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#D8E2EF] bg-white px-4 text-sm font-extrabold text-[#101D38] transition hover:border-[#B7C9E1] hover:bg-[#F7F9FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:hover:bg-slate-900"
        >
          {logoutMode === 'current' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <LogOut className="h-4 w-4" aria-hidden="true" />
          )}
          Sign out this device
        </button>

        <button
          type="button"
          onClick={() => void performLogout('all')}
          disabled={logoutMode !== null}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm font-extrabold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300"
        >
          {logoutMode === 'all' ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <UsersRound className="h-4 w-4" aria-hidden="true" />
          )}
          Sign out all devices
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
