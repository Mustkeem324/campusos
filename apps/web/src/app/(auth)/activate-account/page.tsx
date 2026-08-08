'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound } from 'lucide-react';
import Link from 'next/link';

function ActivateAccountContent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing activation token.');
    }
  }, [token]);

  const activateAccount = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setError('Invalid or missing activation token.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/activate-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate account. The link might have expired or has already been used.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Unable to activate the account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10 text-center">
        {error && !token ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Activation Failed</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link href="/login" className="w-full py-3 px-4 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold transition-colors">
              Back to Login
            </Link>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center py-4 animate-in fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Activated!</h2>
            <p className="text-gray-600 mb-8">
              Your email has been verified and your workspace is now ready. You can log in to your dashboard to begin the onboarding process.
            </p>
            <Link href="/login" className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={activateAccount} className="text-left">
            <div className="flex flex-col items-center pb-6">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-5">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Activate your account</h2>
              <p className="text-gray-500 mt-2 text-sm">Set a password to finish activating your institution workspace.</p>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left" htmlFor="password">
              New password
            </label>
            <div className="relative mb-4">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                minLength={12}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-11 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                placeholder="At least 12 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            <label className="block text-sm font-medium text-gray-700 mb-1.5 text-left" htmlFor="confirmPassword">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              required
              minLength={12}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm mb-6 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="Repeat your password"
            />

            {error && (
              <p role="alert" className="mb-4 text-sm text-red-600">
                <AlertCircle className="inline w-4 h-4 mr-1 -mt-0.5" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Activating...' : 'Activate Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ActivateAccountPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <ActivateAccountContent />
    </Suspense>
  );
}
