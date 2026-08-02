'use client';

import React, { useState } from 'react';
import { Globe, DollarSign, CheckCircle2, ArrowRight } from 'lucide-react';
import { enrollCrossCampusElective } from '../../lib/multicampus-service';

export function CrossCampusElectiveConsole() {
  const [enrollment, setEnrollment] = useState<{ billedAmount: number; currency: string; enrollmentId: string } | null>(null);

  const handleEnroll = () => {
    const res = enrollCrossCampusElective({
      studentId: 's1',
      homeCampusId: 'camp_main',
      hostCampusId: 'camp_ny',
      courseCode: 'CS509_AI_ETHICS',
      feeAmountLocal: 8300, // 8300 INR
      localCurrency: 'INR',
      studentBillingCurrency: 'USD',
    });
    setEnrollment(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe size={20} className="text-indigo-500" />
            <span>Cross-Campus Elective Enrollment & Currency Converter</span>
          </h2>
          <p className="text-xs text-gray-500">
            Enroll in electives across global campuses with real-time multi-currency conversion
          </p>
        </div>

        <button
          onClick={handleEnroll}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <span>Enroll Cross-Campus Elective</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {enrollment && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold font-mono space-y-1 animate-fade-in">
          <div className="flex items-center gap-1.5 font-extrabold">
            <CheckCircle2 size={16} /> Cross-Campus Enrollment Verified!
          </div>
          <p className="text-[10px]">
            Enrollment ID: {enrollment.enrollmentId} • Billed Amount: ${enrollment.billedAmount} {enrollment.currency} (Converted from INR)
          </p>
        </div>
      )}
    </div>
  );
}
