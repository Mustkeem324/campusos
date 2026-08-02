'use client';

import React, { useState } from 'react';
import { Award, FileSpreadsheet, CheckCircle2, Sparkles } from 'lucide-react';
import { autoPullNAACMetrics, NAACMetricSummary } from '../../lib/govt-compliance-service';

export function NAACAccreditationWorkspace() {
  const [metrics, setMetrics] = useState<NAACMetricSummary | null>(null);

  const handlePullMetrics = () => {
    const res = autoPullNAACMetrics('inst_apex_univ');
    setMetrics(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Award size={20} className="text-amber-500" />
            <span>NAAC / NIRF / AICTE Accreditation Workspace & Auto-Metric Engine</span>
          </h2>
          <p className="text-xs text-gray-500">
            Criteria 1-7 automated evidence pulling • Self-Study Report (SSR) draft generator
          </p>
        </div>

        <button
          onClick={handlePullMetrics}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <Sparkles size={14} />
          <span>Auto-Pull NAAC Criteria Metrics</span>
        </button>
      </div>

      {metrics && (
        <div className="space-y-4 animate-fade-in">
          {/* Overall NAAC CGPA & Projected Grade */}
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-600">Projected NAAC Accreditation CGPA</span>
              <h3 className="text-3xl font-extrabold text-amber-900 dark:text-amber-200 mt-0.5">
                {metrics.overallCGPA} / 4.0
              </h3>
            </div>
            <span className="px-4 py-2 rounded-xl bg-amber-600 text-white font-extrabold text-sm shadow">
              GRADE A++ PROJECTED
            </span>
          </div>

          {/* Criteria Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex justify-between">
              <span>Criterion 1: Curricular Aspects</span>
              <span className="font-mono font-bold text-amber-500">{metrics.criterion1_Curriculum} / 100</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex justify-between">
              <span>Criterion 2: Teaching-Learning & Evaluation</span>
              <span className="font-mono font-bold text-amber-500">{metrics.criterion2_TeachingLearning} / 100</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex justify-between">
              <span>Criterion 3: Research, Innovations & Extension</span>
              <span className="font-mono font-bold text-amber-500">{metrics.criterion3_ResearchOutput} / 100</span>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex justify-between">
              <span>Criterion 4: Infrastructure & Learning Resources</span>
              <span className="font-mono font-bold text-amber-500">{metrics.criterion4_Infrastructure} / 100</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
