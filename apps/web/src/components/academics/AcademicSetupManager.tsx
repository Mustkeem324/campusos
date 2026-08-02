'use client';

import React, { useState } from 'react';
import { Calendar, Award, BookOpen, Layers, CheckCircle2 } from 'lucide-react';
import { DEFAULT_10_POINT_SCALE } from '../../lib/academic-service';

export function AcademicSetupManager() {
  const [scaleType, setScaleType] = useState<'CGPA_10' | 'GPA_4_0' | 'RELATIVE'>('CGPA_10');

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers size={20} className="text-indigo-500" />
            <span>Academic Structure & Grading Policy Configuration</span>
          </h2>
          <p className="text-xs text-gray-500">
            Define credit systems, term calendars, and institutional CGPA/GPA evaluation scales
          </p>
        </div>
        <span className="px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-mono text-xs font-bold">
          Term 2026-2 Active
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar size={18} className="text-indigo-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Academic Calendar</h3>
          </div>
          <p className="text-xs text-gray-500">Year: 2026-2027 (Semester System)</p>
          <p className="text-xs text-emerald-500 font-semibold mt-1">Term 2: Jan 10 - Jun 15</p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen size={18} className="text-emerald-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Credit Thresholds</h3>
          </div>
          <p className="text-xs text-gray-500">Min Term Credits: <span className="font-bold">12</span></p>
          <p className="text-xs text-gray-500">Max Term Credits: <span className="font-bold">26</span></p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Award size={18} className="text-amber-500" />
            <h3 className="text-xs font-bold text-gray-900 dark:text-white">Curriculum Versioning</h3>
          </div>
          <p className="text-xs text-gray-500">Active Scheme: <span className="font-mono text-indigo-400">v2024.2</span></p>
          <p className="text-[10px] text-gray-400">Applies to Batches 2023, 2024, 2025</p>
        </div>
      </div>

      {/* Grading Scale Customizer */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Institutional Grading Scale System
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setScaleType('CGPA_10')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              scaleType === 'CGPA_10'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            10-Point CGPA Scale
          </button>
          <button
            onClick={() => setScaleType('GPA_4_0')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
              scaleType === 'GPA_4_0'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            4.0 US GPA Scale
          </button>
        </div>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="p-3">Letter Grade</th>
                <th className="p-3">Percentage Range</th>
                <th className="p-3">Grade Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {DEFAULT_10_POINT_SCALE.gradePoints.map((gp, idx) => (
                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-bold text-indigo-500">{gp.grade}</td>
                  <td className="p-3">{gp.minPct}% and above</td>
                  <td className="p-3 font-mono font-bold">{gp.points.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
