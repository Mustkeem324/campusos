'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound, Loader2, LockKeyhole, ShieldCheck } from 'lucide-react';

export default function ProfileSecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = typeof payload === 'object' && payload && 'error' in payload
          ? String(payload.error)
          : 'Password change failed.';
        throw new Error(message);
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Password change failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="mx-auto max-w-3xl space-y-6 pb-8" aria-labelledby="security-title">
      <header className="rounded-[28px] border border-[#D8E2EF] bg-white p-6 shadow-[0_24px_70px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-950 sm:p-8">
        <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Phase 7B security
        </span>
        <h1 id="security-title" className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white sm:text-4xl">
          Change account password
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">
          A successful change revokes every other persisted browser session. Your current session remains active so you can finish safely.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_16px_48px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
        <div className="space-y-4">
          <PasswordField label="Current password" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
          <PasswordField label="New password" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
          <PasswordField label="Confirm new password" value={confirmPassword} onChange={setConfirmPassword} autoComplete="new-password" />
        </div>

        <div className="mt-5 rounded-2xl border border-[#D8E2EF] bg-[#F7F9FC] p-4 text-xs leading-5 text-[#667085] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Use at least 12 characters with uppercase, lowercase, a number and a symbol. Do not reuse the synthetic sample password on a real institution account.
        </div>

        {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-300">{error}</p>}
        {success && <p role="status" className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"><CheckCircle2 className="h-4 w-4" aria-hidden="true" />Password changed and other sessions revoked.</p>}

        <div className="mt-6 flex flex-wrap gap-3">
          <button type="submit" disabled={submitting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white transition hover:bg-[#1247C8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <KeyRound className="h-4 w-4" aria-hidden="true" />}
            Update password
          </button>
          <Link href="/profile" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D8E2EF] px-5 text-sm font-extrabold text-[#526175] transition hover:bg-[#F7F9FC] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
            Back to profile
          </Link>
        </div>
      </form>
    </section>
  );
}

function PasswordField({ label, value, onChange, autoComplete }: { label: string; value: string; onChange: (value: string) => void; autoComplete: string }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#101D38] dark:text-white">
        <LockKeyhole className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
        {label}
      </span>
      <input
        required
        type="password"
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-xl border border-[#C9D6E6] bg-white px-4 text-sm text-[#101D38] outline-none transition focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/15 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      />
    </label>
  );
}
