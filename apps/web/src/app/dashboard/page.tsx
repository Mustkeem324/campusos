'use client';

import React from 'react';
import Link from 'next/link';
import { RoleDashboard } from '../../components/dashboard/RoleDashboard';
import { useAuthStore } from '../../lib/auth-store';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { currentSession } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!currentSession) {
      router.replace('/login');
    }
  }, [currentSession, router]);

  if (!currentSession) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Welcome Banner */}
      {currentSession.role === 'STUDENT' && (
        <div className="p-5 rounded-2xl bg-primary text-white shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-200">
              {currentSession.institutionName} • Student Portal
            </span>
            <h1 className="text-xl font-extrabold tracking-tight mt-0.5">
              Welcome back, {currentSession.name}!
            </h1>
            <p className="text-xs text-indigo-100 font-mono mt-1">
              ID: {currentSession.email} • Program: B.Tech Computer Science • CGPA: 3.84
            </p>
          </div>
          <button className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-extrabold text-xs shadow-lg hover:bg-indigo-50 transition shrink-0">
            View Profile
          </button>
        </div>
      )}

      <RoleDashboard />
    </div>
  );
}
