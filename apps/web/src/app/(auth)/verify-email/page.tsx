'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowRight, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email')?.trim() ?? '';
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function resend() {
    if (!email) {
      setError('The registration email is missing. Submit the institution registration again.');
      return;
    }

    setResending(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to resend the activation email.');
      setMessage(payload.message || 'If the account is pending, a new activation link has been queued.');
    } catch (caughtError: unknown) {
      setError(caughtError instanceof Error ? caughtError.message : 'Unable to resend the activation email.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <Mail className="w-10 h-10" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-4">Verify your email</h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          We&apos;ve queued an activation link{email ? <> for <strong>{email}</strong></> : null}.
          {' '}Open the link, set your password, and activate your institution&apos;s workspace.
        </p>

        {message && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm font-medium text-green-700">{message}</p>}
        {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p>}

        <div className="space-y-4">
          <button
            type="button"
            onClick={resend}
            disabled={resending || !email}
            className="w-full py-3 px-4 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {resending && <Loader2 className="h-4 w-4 animate-spin" />}
            {resending ? 'Resending…' : 'Resend activation email'}
          </button>

          <Link
            href="/login"
            className="w-full py-3 px-4 rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Didn&apos;t receive it? Check your spam folder before requesting another link.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
