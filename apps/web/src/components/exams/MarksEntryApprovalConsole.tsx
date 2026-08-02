'use client';

import React, { useState } from 'react';
import { Lock, Unlock, CheckCircle2, ShieldCheck, FileSpreadsheet, ArrowRight } from 'lucide-react';
import { ExamMarkRecord, processExamResult } from '../../lib/exam-engine';

export function MarksEntryApprovalConsole() {
  const [stage, setStage] = useState<'FACULTY_SUBMITTED' | 'HOD_APPROVED' | 'COE_PUBLISHED'>('FACULTY_SUBMITTED');

  const [marks, setMarks] = useState<ExamMarkRecord[]>([
    { studentId: 's1', rollNumber: 'CS2026-01', name: 'Alex Vance', internalScore: 28, endTermScore: 62, totalScore: 90, graceMarks: 0, finalScore: 90, gradeLetter: 'O', gradePoints: 10, status: 'FACULTY_SUBMITTED' },
    { studentId: 's2', rollNumber: 'CS2026-02', name: 'Sarah Jenkins', internalScore: 24, endTermScore: 54, totalScore: 78, graceMarks: 0, finalScore: 78, gradeLetter: 'A', gradePoints: 8, status: 'FACULTY_SUBMITTED' },
    { studentId: 's3', rollNumber: 'CS2026-03', name: 'James Miller', internalScore: 12, endTermScore: 26, totalScore: 38, graceMarks: 2, finalScore: 40, gradeLetter: 'C', gradePoints: 5, status: 'FACULTY_SUBMITTED' }, // Moderated with 2 grace marks!
  ]);

  const handleAdvanceStage = () => {
    if (stage === 'FACULTY_SUBMITTED') setStage('HOD_APPROVED');
    else if (stage === 'HOD_APPROVED') setStage('COE_PUBLISHED');
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-indigo-500" />
            <span>3-Tier Exam Marks Lock & Approval Workflow</span>
          </h2>
          <p className="text-xs text-gray-500">
            Faculty Entry $\rightarrow$ HOD Endorsement $\rightarrow$ COE Publication & Embargo Release
          </p>
        </div>

        {stage !== 'COE_PUBLISHED' && (
          <button
            onClick={handleAdvanceStage}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
          >
            <span>{stage === 'FACULTY_SUBMITTED' ? 'HOD Endorse Marks' : 'COE Lock & Publish Results'}</span>
            <ArrowRight size={14} />
          </button>
        )}
      </div>

      {/* 3-Tier Pipeline Indicator */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className={`p-3 rounded-xl border text-xs font-bold ${stage === 'FACULTY_SUBMITTED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
          1. Faculty Double-Entry
        </div>
        <div className={`p-3 rounded-xl border text-xs font-bold ${stage === 'HOD_APPROVED' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
          2. HOD Verification Lock
        </div>
        <div className={`p-3 rounded-xl border text-xs font-bold ${stage === 'COE_PUBLISHED' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500'}`}>
          3. COE Publication
        </div>
      </div>

      {/* Marks Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">Roll Number</th>
              <th className="p-3">Student Name</th>
              <th className="p-3">Internal (30)</th>
              <th className="p-3">End-Term (70)</th>
              <th className="p-3">Grace Marks</th>
              <th className="p-3 font-bold text-indigo-500">Final Score</th>
              <th className="p-3">Grade Letter</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {marks.map((m) => (
              <tr key={m.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3 font-mono font-bold text-gray-500">{m.rollNumber}</td>
                <td className="p-3 font-bold text-gray-900 dark:text-white">{m.name}</td>
                <td className="p-3 font-mono">{m.internalScore}</td>
                <td className="p-3 font-mono">{m.endTermScore}</td>
                <td className="p-3 font-mono text-amber-500 font-bold">
                  {m.graceMarks > 0 ? `+${m.graceMarks} (Moderated)` : '0'}
                </td>
                <td className="p-3 font-mono font-extrabold text-indigo-500">{m.finalScore} / 100</td>
                <td className="p-3 font-bold text-emerald-500">{m.gradeLetter} ({m.gradePoints}.0)</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
