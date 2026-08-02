'use client';

import React from 'react';
import { User, Mail, GraduationCap, Building2, CheckCircle2, ShieldCheck, Award, BookOpen, Clock } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export function StudentProfileConsole() {
  const { currentSession } = useAuthStore();

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg border-2 border-indigo-400">
            MA
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">
                {currentSession.name}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 font-bold text-xs border border-emerald-300">
                ACTIVE STUDENT
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono flex items-center gap-1.5 mt-0.5">
              <Mail size={12} className="text-indigo-500" />
              <span>{currentSession.email}</span>
            </p>
          </div>
        </div>

        <div className="text-right font-mono text-xs">
          <span className="text-gray-400">SAP ID:</span>
          <p className="font-extrabold text-indigo-500">500099412</p>
        </div>
      </div>

      {/* Academic Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-900 dark:text-indigo-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-indigo-500">Enrolled Program</span>
          <p className="font-extrabold text-sm text-gray-900 dark:text-white">B.Tech Computer Science</p>
          <p className="text-[10px] text-gray-500">Specialization in Cloud & AI</p>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Current CGPA</span>
          <p className="font-extrabold text-2xl text-emerald-600 dark:text-emerald-400">3.84 / 4.0</p>
          <p className="text-[10px] text-gray-500">Top 3% Dean&apos;s List</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-amber-900 dark:text-amber-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-amber-600">Attendance Average</span>
          <p className="font-extrabold text-2xl text-amber-600 dark:text-amber-400">92.4%</p>
          <p className="text-[10px] text-gray-500">14-Day Streak Active 🏅</p>
        </div>

        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-900 dark:text-purple-200 space-y-1">
          <span className="text-[10px] uppercase font-bold text-purple-600">Fee Payment Dues</span>
          <p className="font-extrabold text-sm text-emerald-500 flex items-center gap-1 mt-1">
            <CheckCircle2 size={16} /> NO PENDING DUES
          </p>
          <p className="text-[10px] text-gray-500">Hall Ticket Unlocked</p>
        </div>
      </div>
    </div>
  );
}
