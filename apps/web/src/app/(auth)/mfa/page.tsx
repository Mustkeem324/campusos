'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';

export default function MFAPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // If they bypass login page, redirect back
    const mfaUserId = sessionStorage.getItem('mfaUserId');
    if (!mfaUserId) {
      router.push('/login');
    }
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 6) {
      setError('Please enter the full 6-digit code');
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const mfaUserId = sessionStorage.getItem('mfaUserId');
      const res = await fetch('/api/auth/mfa-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: mfaUserId, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      sessionStorage.removeItem('mfaUserId');
      router.push('/dashboard');
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
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
            <ShieldCheck className="w-8 h-8" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Two-Factor Authentication</h1>
          <p className="text-sm text-gray-600">Enter the 6-digit code from your authenticator app to continue.</p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          {error && (
            <div className="p-4 rounded bg-red-50 border border-red-200 flex items-start gap-3 text-red-700 text-sm font-medium">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div>
            <label htmlFor="code" className="block text-sm font-semibold text-gray-900 mb-2 sr-only">
              Authentication Code
            </label>
            <input
              id="code"
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\\D/g, ''))}
              className="w-full px-4 py-4 text-center text-3xl tracking-[0.5em] rounded border border-gray-300 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 outline-none transition-colors"
              placeholder="000000"
            />
          </div>

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            type="button"
            className="text-sm font-semibold text-gray-600 hover:text-gray-900"
          >
            Use a backup recovery code
          </button>
        </div>
      </div>
    </div>
  );
}
