'use client';

import React, { useState } from 'react';
import { BookOpen, Video, FileText, CheckCircle2, Award, Calculator, ShieldAlert } from 'lucide-react';
import { DEMO_LMS_MODULES, calculateWeightedFinalGrade, GradeComponent } from '../../lib/lms-service';

export function LMSWorkspace() {
  const [activeTab, setActiveTab] = useState<'CONTENT' | 'GRADEBOOK' | 'QUIZ'>('CONTENT');

  const [components, setComponents] = useState<GradeComponent[]>([
    { name: 'Internal Assessment', weightPct: 20, scoreObtained: 85 },
    { name: 'Mid Term Exam', weightPct: 30, scoreObtained: 78 },
    { name: 'Assignments & LMS', weightPct: 10, scoreObtained: 92 },
    { name: 'End Term Exam (What-If Target)', weightPct: 40, scoreObtained: 88 },
  ]);

  const gradeAnalysis = calculateWeightedFinalGrade(components);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <BookOpen size={20} className="text-indigo-500" />
            <span>Learning Management System (LMS) & Gradebook</span>
          </h2>
          <p className="text-xs text-gray-500">
            Content modules, proctored quizzes, rubric grading, and CGPA What-If calculator
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('CONTENT')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'CONTENT' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Course Tree
          </button>
          <button
            onClick={() => setActiveTab('GRADEBOOK')}
            className={`px-3 py-1 rounded-lg ${activeTab === 'GRADEBOOK' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            What-If Gradebook
          </button>
        </div>
      </div>

      {activeTab === 'CONTENT' && (
        <div className="space-y-4">
          {DEMO_LMS_MODULES.map((mod) => (
            <div key={mod.id} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
              <h3 className="text-xs font-bold text-gray-900 dark:text-white">{mod.title}</h3>
              <div className="space-y-2 pl-4">
                {mod.lessons.map((les) => (
                  <div key={les.id} className="flex items-center justify-between p-2.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs">
                    <div className="flex items-center gap-2">
                      {les.resourceType === 'VIDEO' && <Video size={16} className="text-indigo-500" />}
                      {les.resourceType === 'PDF' && <FileText size={16} className="text-emerald-500" />}
                      {les.resourceType === 'QUIZ' && <Award size={16} className="text-amber-500" />}
                      {les.resourceType === 'ASSIGNMENT' && <FileText size={16} className="text-purple-500" />}
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{les.title}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {les.durationMinutes ? `${les.durationMinutes} mins` : les.resourceType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'GRADEBOOK' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white flex items-center justify-between shadow-lg">
            <div>
              <span className="text-[10px] uppercase font-bold text-indigo-200">Interactive Grade Calculator</span>
              <h3 className="text-lg font-extrabold">Estimated Final Score: {gradeAnalysis.finalPercentage}%</h3>
            </div>
            <span className="px-4 py-2 rounded-xl bg-white text-indigo-700 font-extrabold text-sm shadow">
              Grade: {gradeAnalysis.estimatedGrade}
            </span>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-3">Evaluation Component</th>
                  <th className="p-3">Weightage</th>
                  <th className="p-3">Score Obtained</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {components.map((c, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 font-bold text-gray-900 dark:text-white">{c.name}</td>
                    <td className="p-3 font-mono">{c.weightPct}%</td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={c.scoreObtained}
                        onChange={(e) => {
                          components[idx].scoreObtained = Number(e.target.value);
                          setComponents([...components]);
                        }}
                        className="w-20 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 font-mono font-bold text-indigo-500"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
