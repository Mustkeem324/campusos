'use client';

import Link from 'next/link';
import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, Mail, ShieldCheck } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [developmentResetUrl, setDevelopmentResetUrl] = useState('');

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setLoading(true);
    setMessage('');
    setError('');
    setDevelopmentResetUrl('');
    try {
      const response = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: String(form.get('email') || '') }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to request a reset link.');
      setMessage(payload.message);
      setDevelopmentResetUrl(payload.developmentResetUrl || '');
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to request a reset link.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-4 dark:bg-[#090D16] sm:p-6">
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#D8E2EF] bg-white shadow-[0_28px_80px_rgba(16,29,56,0.12)] dark:border-slate-800 dark:bg-slate-950">
        <header className="bg-[#101D38] p-6 text-white sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1754E8]"><KeyRound className="h-6 w-6" /></span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">Reset your password</h1>
          <p className="mt-3 text-sm leading-6 text-[#B8C6D9]">CampusOS queues a time-limited reset link without revealing whether an account exists.</p>
        </header>
        <div className="p-6 sm:p-8">
          <form onSubmit={submit}>
            <label className="block text-xs font-extrabold uppercase tracking-[0.09em] text-[#526175] dark:text-slate-400">Email address
              <div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#8A95A6]" /><input name="email" type="email" required className="min-h-11 w-full rounded-xl border border-[#CFD9E7] bg-white pl-10 pr-3 text-sm font-semibold text-[#101D38] outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white" placeholder="name@institution.edu" /></div>
            </label>
            <button type="submit" disabled={loading} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white hover:bg-[#103FC2] disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Send reset instructions</button>
          </form>
          {message && <div role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</div>}
          {error && <div role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
          {developmentResetUrl && <a className="mt-4 block break-all rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold text-amber-800" href={developmentResetUrl}>Development-only reset link: {developmentResetUrl}</a>}
          <Link href="/login" className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-bold text-[#526175] hover:bg-[#F2F5FA] dark:text-slate-300 dark:hover:bg-slate-900"><ArrowLeft className="h-4 w-4" />Back to sign in</Link>
        </div>
      </section>
    </main>
  );
}
