'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Mail, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || 'your email';

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
          We&apos;ve sent a verification link to <strong>{email}</strong>. 
          Please check your inbox and click the link to activate your institution&apos;s workspace.
        </p>

        <div className="space-y-4">
          <button
            className="w-full py-3 px-4 rounded bg-gray-100 hover:bg-gray-200 text-gray-900 font-semibold transition-colors flex items-center justify-center"
          >
            Resend Verification Email
          </button>
          
          <Link 
            href="/login" 
            className="w-full py-3 px-4 rounded bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          Didn&apos;t receive it? Check your spam folder or contact support if the issue persists.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
