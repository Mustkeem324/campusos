'use client';

import React from 'react';
import { Clock } from 'lucide-react';
import Link from 'next/link';

export default function SessionExpiredPage() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 w-full max-w-sm mx-auto text-center">
      <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <Clock size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Session Expired</h1>
      <p className="text-sm text-gray-500 mb-8">
        For your security, your session has timed out. Please sign in again to continue working.
      </p>

      <Link href="/login" className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition flex items-center justify-center">
        Sign In
      </Link>
    </div>
  );
}
