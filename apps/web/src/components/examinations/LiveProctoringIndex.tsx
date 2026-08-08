'use client';

import Link from 'next/link';
import React from 'react';
import { AlertTriangle, ArrowRight, Loader2, Radio, RefreshCw, ShieldCheck, Video } from 'lucide-react';

import type { SecureExamWorkspace } from '@/lib/secure-examination-types';

type ApiError = { error?: string };

export function LiveProctoringIndex() {
  const [workspace, setWorkspace] = React.useState<Extract<SecureExamWorkspace, { kind: 'ADMIN' }> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setError(null);
    const response = await fetch('/api/examinations/proctoring/workspace', { cache: 'no-store' });
    const body = await response.json().catch(() => ({})) as SecureExamWorkspace & ApiError;
    if (!response.ok) throw new Error(body.error || 'Unable to load assigned proctoring sessions.');
    if (body.kind !== 'ADMIN') throw new Error('This workspace is available only to authorized examination staff.');
    setWorkspace(body);
  }, []);

  React.useEffect(() => {
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load live proctoring.')).finally(() => setLoading(false));
    const timer = window.setInterval(() => { void load().catch(() => undefined); }, 10_000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-700">NAVEMORA Secure Examination</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Live proctoring</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">Open assigned live sessions, view authorized WebRTC feeds, and review technical or AI-assisted signals. Signals support human review; they do not determine misconduct automatically.</p></div>
        <button onClick={() => void load()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 px-4 text-xs font-extrabold dark:border-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
      </header>

      {error && <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}

      {!workspace || workspace.liveAttempts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950"><ShieldCheck className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-4 text-base font-extrabold">No live assigned sessions</h2><p className="mt-2 text-xs leading-5 text-slate-500">Active secure examination attempts assigned to your role will appear here.</p></div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {workspace.liveAttempts.map((attempt) => {
            const alerts = attempt.unreviewedHighEvents + attempt.unreviewedMediumEvents;
            return <article key={attempt.attemptId} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-red-600" /><span className="text-[10px] font-black uppercase tracking-wider text-red-600">Live / review queue</span></div><h2 className="mt-2 text-base font-extrabold text-slate-950 dark:text-white">{attempt.studentName}</h2><p className="mt-1 text-xs text-slate-500">{attempt.rollNumber} · {attempt.examName}</p></div><span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">{attempt.status.replaceAll('_', ' ')}</span></div>
              <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[9px] font-bold uppercase text-slate-400">Identity</p><p className="mt-1 text-xs font-extrabold">{attempt.identityState || 'Pending'}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[9px] font-bold uppercase text-slate-400">3D Eyes</p><p className="mt-1 text-xs font-extrabold">{attempt.secondCameraStatus || 'Off'}</p></div><div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-900"><p className="text-[9px] font-bold uppercase text-slate-400">Signals</p><p className={`mt-1 text-xs font-extrabold ${alerts ? 'text-amber-700 dark:text-amber-300' : ''}`}>{alerts}</p></div></div>
              <Link href={`/examinations/proctor/${attempt.attemptId}`} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white">Open live view <Video className="h-4 w-4" /><ArrowRight className="h-4 w-4" /></Link>
            </article>;
          })}
        </div>
      )}
    </div>
  );
}
