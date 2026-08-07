'use client';

import React, { FormEvent, Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2, LockKeyhole } from 'lucide-react';
import Link from 'next/link';

function ActivateAccountContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(token ? '' : 'Invalid or missing activation token.');
  const [success, setSuccess] = useState(false);

  const activateAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) return;
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const response = await fetch('/api/auth/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || 'Unable to activate this account.');
      }
      setSuccess(true);
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to activate this account.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10">
        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Account activated</h1>
            <p className="mt-3 text-gray-600">
              Your email is verified, your password is set, and your account is ready.
            </p>
            <Link
              href="/login"
              className="mt-8 flex w-full items-center justify-center rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
            >
              Go to login
            </Link>
          </div>
        ) : (
          <form onSubmit={activateAccount}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
              <LockKeyhole className="h-8 w-8" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">Activate your account</h1>
              <p className="mt-3 text-sm leading-6 text-gray-600">
                Create a strong password to verify your email and finish account activation.
              </p>
            </div>

            {error && (
              <div className="mt-6 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <label className="mt-7 block text-sm font-semibold text-gray-700" htmlFor="password">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!token || submitting}
              required
              maxLength={256}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100"
            />
            <p className="mt-2 text-xs leading-5 text-gray-500">
              Use at least 12 characters with upper/lowercase letters, a number, and a symbol.
            </p>

            <label className="mt-5 block text-sm font-semibold text-gray-700" htmlFor="confirm-password">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={!token || submitting}
              required
              maxLength={256}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:bg-gray-100"
            />

            <button
              type="submit"
              disabled={!token || submitting || !password || !confirmPassword}
              className="mt-7 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Activating…' : 'Set password and activate'}
            </button>

            <Link href="/login" className="mt-4 block text-center text-sm font-semibold text-gray-600 hover:text-gray-900">
              Back to login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ActivateAccountContent />
    </Suspense>
  );
}
