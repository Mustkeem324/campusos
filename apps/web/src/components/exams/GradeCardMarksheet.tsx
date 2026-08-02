'use client';

import React from 'react';
import { GraduationCap, QrCode, Award, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export function GradeCardMarksheet() {
  const { currentSession } = useAuthStore();

  return (
    <div className="p-8 rounded-2xl bg-white dark:bg-gray-900 border-2 border-indigo-200 dark:border-indigo-900 shadow-2xl space-y-6 max-w-3xl mx-auto">
      {/* Official Letterhead */}
      <div className="flex items-center justify-between border-b-2 border-indigo-600 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-glow flex items-center justify-center text-white font-extrabold text-xl shadow-lg">
            C
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
              {currentSession.institutionName}
            </h2>
            <p className="text-[10px] text-gray-500 font-semibold">
              OFFICIAL CONSOLIDATED STATEMENT OF MARKS & GRADE CARD
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-mono font-bold text-indigo-500">
            SERIAL: MARKS-2026-9941A
          </span>
          <span className="block text-[10px] text-emerald-500 font-bold">Status: VERIFIED & SIGNED</span>
        </div>
      </div>

      {/* Student Profile Info */}
      <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs">
        <div>
          <span className="text-gray-400 text-[10px]">Student Name:</span>
          <p className="font-bold text-gray-900 dark:text-white">{currentSession.name}</p>
        </div>
        <div>
          <span className="text-gray-400 text-[10px]">Roll Number:</span>
          <p className="font-mono font-bold text-indigo-500">CS2026-01</p>
        </div>
        <div>
          <span className="text-gray-400 text-[10px]">Program:</span>
          <p className="font-bold text-gray-900 dark:text-white">B.Tech Computer Science</p>
        </div>
      </div>

      {/* Grade Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">Course Code</th>
              <th className="p-3">Course Title</th>
              <th className="p-3">Credits</th>
              <th className="p-3">Grade Letter</th>
              <th className="p-3">Grade Points</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-mono font-bold text-indigo-500">CS401</td>
              <td className="p-3 font-semibold">Advanced Data Structures</td>
              <td className="p-3 font-mono">4.0</td>
              <td className="p-3 font-bold text-emerald-500">O</td>
              <td className="p-3 font-mono font-bold">10.0</td>
            </tr>
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="p-3 font-mono font-bold text-indigo-500">CS405</td>
              <td className="p-3 font-semibold">Machine Learning</td>
              <td className="p-3 font-mono">4.0</td>
              <td className="p-3 font-bold text-emerald-500">A+</td>
              <td className="p-3 font-mono font-bold">9.0</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Summary Gauges & Public QR Verification Code */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div>
          <span className="text-[10px] uppercase font-bold text-gray-400">Cumulative Academic Index</span>
          <div className="flex gap-4 mt-1">
            <div>
              <span className="text-xs text-gray-500">Semester SGPA:</span>
              <p className="text-lg font-extrabold text-indigo-500">9.50</p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Cumulative CGPA:</span>
              <p className="text-lg font-extrabold text-emerald-500">3.84 / 4.0</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 text-right">
          <div>
            <span className="text-[10px] font-mono text-gray-400 block">Public Verification QR</span>
            <span className="text-[9px] text-emerald-500 font-bold">Scan to verify on blockchain</span>
          </div>
          <div className="p-2 bg-white rounded-lg border shadow-sm">
            <QrCode size={48} className="text-gray-900" />
          </div>
        </div>
      </div>
    </div>
  );
}
