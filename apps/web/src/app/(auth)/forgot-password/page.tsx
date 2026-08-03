'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error('Failed to process request. Please try again.');
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
              <Mail className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-600 mb-8">
              We&apos;ve sent password reset instructions to <strong>{email}</strong>
            </p>
            <Link 
              href="/login" 
              className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors inline-block"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password</h1>
              <p className="text-sm text-gray-600">Enter your email address and we&apos;ll send you a link to reset your password.</p>
            </div>

            <form onSubmit={handleReset} className="space-y-6">
              {error && (
                <div className="p-4 rounded bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>{error}</div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-900 mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
                  placeholder="name@university.edu"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link href="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900 flex items-center justify-center gap-2">
                <ArrowLeft className="w-4 h-4" /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
