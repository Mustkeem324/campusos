'use client';

import React, { useState } from 'react';
import { MessageSquare, Award, CheckCircle2, Star } from 'lucide-react';

export function FeedbackAppraisalConsole() {
  const [facultyScore] = useState(4.82); // Out of 5.0

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-purple-500" />
            <span>Anonymous Feedback & Faculty Appraisal Score Computation</span>
          </h2>
          <p className="text-xs text-gray-500">
            Dynamic Likert survey builder • Guaranteed anonymity • Automated faculty appraisal matrix
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900">
          <span className="text-[10px] uppercase font-bold text-purple-600">Faculty Appraisal Metric</span>
          <h3 className="text-2xl font-extrabold text-purple-900 dark:text-purple-200 mt-1 flex items-center gap-2">
            <span>{facultyScore} / 5.0</span>
            <Star size={20} className="fill-amber-400 text-amber-400" />
          </h3>
          <p className="text-[10px] text-purple-600 font-bold mt-0.5">Based on 142 Anonymous Student Submissions</p>
        </div>

        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-2 text-xs">
          <h4 className="font-bold text-gray-900 dark:text-white">Active Feedback Surveys</h4>
          <div className="p-2 rounded bg-white dark:bg-gray-900 border flex justify-between">
            <span>Term 2 Faculty Teaching Evaluation</span>
            <span className="text-emerald-500 font-bold">Mandatory Gated</span>
          </div>
        </div>
      </div>
    </div>
  );
}
