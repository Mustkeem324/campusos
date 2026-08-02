'use client';

import React from 'react';
import { BookOpen, Users, FileText, Calendar, CheckSquare, MessageSquare } from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

export function CourseWorkspace() {
  const { currentSession } = useAuthStore();

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <span className="font-mono text-xs font-bold text-indigo-500">CS401 • Sec A</span>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
            Advanced Data Structures & Algorithms
          </h2>
          <p className="text-xs text-gray-500">Instructor: Prof. Alan Turing • Lab 3B</p>
        </div>

        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 font-bold text-xs">
            48 Students Enrolled
          </span>
        </div>
      </div>

      {/* Workspace Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold flex items-center gap-2">
          <BookOpen size={16} />
          <span>Syllabus & Modules</span>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
          <FileText size={16} />
          <span>Assignments (2 Active)</span>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
          <CheckSquare size={16} />
          <span>Attendance Log</span>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold flex items-center gap-2">
          <MessageSquare size={16} />
          <span>Course Doubt Forum</span>
        </div>
      </div>
    </div>
  );
}
