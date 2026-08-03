'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 w-full max-w-sm mx-auto text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <AlertTriangle size={32} />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
      <p className="text-sm text-gray-500 mb-8">
        You do not have the required permissions to view the requested page. If you believe this is an error, contact your administrator.
      </p>

      <Link href="/dashboard" className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition flex items-center justify-center">
        Return to Dashboard
      </Link>
    </div>
  );
}
