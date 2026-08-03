'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, UserPlus, ArrowRight } from 'lucide-react';

export default function SignupDispatcher() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 w-full">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Join CampusOS</h1>
        <p className="text-sm text-gray-500 mt-2">Choose your account type to proceed</p>
      </div>

      <div className="space-y-4">
        <Link 
          href="/signup/institution"
          className="flex items-center p-5 rounded-xl border-2 border-transparent hover:border-indigo-600 bg-gray-50 dark:bg-gray-950 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition group"
        >
          <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 shrink-0">
            <Building2 size={24} />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 transition">Deploy Institution</h3>
            <p className="text-sm text-gray-500 mt-1">For university admins setting up CampusOS</p>
          </div>
          <ArrowRight className="text-gray-400 group-hover:text-indigo-600 transition" />
        </Link>

        <div className="flex items-center p-5 rounded-xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 opacity-60 cursor-not-allowed">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shrink-0">
            <UserPlus size={24} />
          </div>
          <div className="ml-4 flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Student or Staff</h3>
            <p className="text-sm text-gray-500 mt-1">Requires an email invitation from your university</p>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <a href="/login" className="font-semibold text-indigo-600 hover:text-indigo-700">
          Sign in
        </a>
      </div>
    </div>
  );
}
