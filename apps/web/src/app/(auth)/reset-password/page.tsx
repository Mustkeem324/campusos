'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useState } from 'react';
import { CheckCircle2, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';

function ResetPasswordContent() {
  const token = useSearchParams().get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(token ? '' : 'The reset token is missing.');
  const [success, setSuccess] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || 'Unable to reset the password.');
      setSuccess(true);
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : 'Unable to reset the password.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F4F7FB] p-4 dark:bg-[#090D16] sm:p-6">
      <section className="w-full max-w-lg overflow-hidden rounded-[28px] border border-[#D8E2EF] bg-white shadow-[0_28px_80px_rgba(16,29,56,0.12)] dark:border-slate-800 dark:bg-slate-950">
        <header className="bg-[#101D38] p-6 text-white sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1754E8]"><KeyRound className="h-6 w-6" /></span>
          <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em]">Create a new password</h1>
          <p className="mt-3 text-sm leading-6 text-[#B8C6D9]">Use at least 12 characters with uppercase, lowercase, number and symbol.</p>
        </header>
        <div className="p-6 sm:p-8">
          {success ? <div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" /><h2 className="mt-5 text-2xl font-extrabold text-[#101D38] dark:text-white">Password reset completed</h2><p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">All existing sessions were revoked. Sign in again with the new password.</p><Link href="/login" className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white">Sign in</Link></div> : <form onSubmit={submit} className="space-y-4">
            <PasswordField label="New password" value={password} onChange={setPassword} visible={showPassword} />
            <PasswordField label="Confirm password" value={confirmPassword} onChange={setConfirmPassword} visible={showPassword} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-bold text-[#526175] hover:bg-[#F2F5FA] dark:text-slate-300 dark:hover:bg-slate-900">{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{showPassword ? 'Hide passwords' : 'Show passwords'}</button>
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</div>}
            <button type="submit" disabled={loading || !token} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white hover:bg-[#103FC2] disabled:opacity-60">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Reset password</button>
          </form>}
        </div>
      </section>
    </main>
  );
}

function PasswordField({ label, value, onChange, visible }: { label: string; value: string; onChange: (value: string) => void; visible: boolean }) {
  return <label className="block text-xs font-extrabold uppercase tracking-[0.09em] text-[#526175] dark:text-slate-400">{label}<input type={visible ? 'text' : 'password'} required value={value} onChange={(event) => onChange(event.target.value)} className="mt-2 min-h-11 w-full rounded-xl border border-[#CFD9E7] bg-white px-3 text-sm font-semibold text-[#101D38] outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white" /></label>;
}

export default function ResetPasswordPage() {
  return <Suspense fallback={<main className="flex min-h-screen items-center justify-center bg-[#F4F7FB]"><Loader2 className="h-8 w-8 animate-spin text-[#1754E8]" /></main>}><ResetPasswordContent /></Suspense>;
}
