import React from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-md w-full text-center space-y-4 p-8 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg">
          C
        </div>
        <h1 className="text-xl font-extrabold text-gray-900 dark:text-white">CampusOS ERP Portal</h1>
        <p className="text-xs text-gray-500">
          Redirecting to main CampusOS dashboard...
        </p>
        <Link
          href="/"
          className="inline-block px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
