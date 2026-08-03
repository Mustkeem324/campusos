'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ResetPasswordContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token.');
    }
  }, [token]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        throw new Error('Failed to reset password. The link might have expired.');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center font-bold text-white text-2xl">
            C
          </div>
        </div>

        {success ? (
          <div className="text-center animate-in fade-in">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset Complete</h2>
            <p className="text-gray-600 mb-8">
              Your password has been successfully updated. You can now use your new password to log in.
            </p>
            <Link 
              href="/login" 
              className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors inline-block"
            >
              Sign In
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Password</h1>
              <p className="text-sm text-gray-600">Enter a strong password for your account.</p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="p-4 rounded bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors pr-12"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !password || !confirmPassword || !!error.includes('token')}
                className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
