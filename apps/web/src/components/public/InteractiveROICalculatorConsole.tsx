'use client';

import React, { useState } from 'react';
import { DollarSign, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { calculateInstitutionalROI } from '../../lib/public-portal-service';

export function InteractiveROICalculatorConsole() {
  const [studentCount, setStudentCount] = useState(3000);
  const [roi] = useState(() => calculateInstitutionalROI(studentCount));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp size={20} className="text-emerald-500" />
            <span>CampusOS vs Legacy ERP Institutional ROI Calculator</span>
          </h2>
          <p className="text-xs text-gray-500">
            Interactive financial savings & labor hour efficiency modeler
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Annual Cost Savings</span>
          <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">
            ${roi.annualCostSavingsUSD.toLocaleString()} / yr
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Labor Hours Saved</span>
          <h3 className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200 mt-1">
            {roi.annualLaborHoursSaved.toLocaleString()} Hours / yr
          </h3>
        </div>

        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200">
          <span className="text-[10px] uppercase font-bold text-purple-600">Paperless Sheets Saved</span>
          <h3 className="text-2xl font-extrabold text-purple-900 dark:text-purple-200 mt-1">
            {roi.paperlessPaperSheetsSaved.toLocaleString()} Sheets / yr
          </h3>
        </div>
      </div>
    </div>
  );
}
