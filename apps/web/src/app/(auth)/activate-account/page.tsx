'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

function ActivateAccountContent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing activation token.');
      setLoading(false);
      return;
    }

    const activateAccount = async () => {
      try {
        const res = await fetch('/api/auth/activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || 'Failed to activate account. The link might have expired or has already been used.');
        }

        setSuccess(true);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-gray-200 p-8 sm:p-10 text-center">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Activating your account...</h2>
            <p className="text-gray-500 mt-2 text-sm">Please wait while we verify your credentials.</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center py-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Activation Failed</h2>
            <p className="text-gray-600 mb-8">{error}</p>
            <Link 
              href="/login" 
              className="w-full py-3 px-4 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold transition-colors"
            >
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
              Your email has been verified and your workspace is now ready. 
              You can log in to your dashboard to begin the onboarding process.
            </p>
            <Link 
              href="/login" 
              className="w-full py-3 px-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold transition-colors"
            >
              Go to Login
            </Link>
          </div>
        ) : null}

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
