'use client';

import React, { useState } from 'react';
import { AlertTriangle, TrendingDown, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { calculateStudentRiskScore } from '../../lib/retention-engine';

export function RetentionEngineDashboard() {
  const [atRiskStudents] = useState([
    {
      studentId: 's_01',
      studentName: 'Jordan Reed',
      rollNumber: 'CS2026-091',
      attendancePct: 62,
      latestCgpa: 4.8,
      hasFeeDues: true,
      lmsLoginDaysLastMonth: 2,
    },
    {
      studentId: 's_02',
      studentName: 'Taylor Morgan',
      rollNumber: 'ME2026-042',
      attendancePct: 71,
      latestCgpa: 5.4,
      hasFeeDues: false,
      lmsLoginDaysLastMonth: 5,
    },
  ]);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-500" />
            <span>AI Student Retention & Dropout Risk Radar</span>
          </h2>
          <p className="text-xs text-gray-500">
            Multi-factor early warning system (Attendance + CGPA + LMS Activity + Fee Dues)
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {atRiskStudents.map((s) => {
          const risk = calculateStudentRiskScore(s);
          return (
            <div
              key={s.studentId}
              className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-white">{s.studentName}</span>
                  <span className="font-mono text-xs text-gray-400">({s.rollNumber})</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Attendance: {s.attendancePct}% • CGPA: {s.latestCgpa} • Dues: {s.hasFeeDues ? 'Yes' : 'No'}
                </p>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200 border border-amber-300">
                  {risk.riskLevel} RISK ({risk.riskScore}/100)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
