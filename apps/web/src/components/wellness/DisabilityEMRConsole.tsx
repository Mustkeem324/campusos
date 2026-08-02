'use client';

import React, { useState } from 'react';
import { HeartPulse, Award, CheckCircle2, Clock } from 'lucide-react';
import { calculateExamExtraTime, DisabilityAccommodation } from '../../lib/wellness-safety-service';

export function DisabilityEMRConsole() {
  const [accommodation] = useState<DisabilityAccommodation>({
    studentId: 's1',
    udidNumber: 'UDID-MH-2026-9941',
    disabilityType: 'Visual Impairment',
    extraTimeMinutesPerExamHour: 20,
    scribeAssigned: true,
    groundFloorRoomRequired: true,
  });

  const [totalExamTime] = useState(() => calculateExamExtraTime(180, accommodation)); // 3-hour exam (180 mins) -> 240 mins!

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <HeartPulse size={20} className="text-rose-500" />
            <span>Disability Services (UDID) & Student Health Center EMR</span>
          </h2>
          <p className="text-xs text-gray-500">
            UDID disability verification • Exam extra time & scribe allocation • EMR allergy red flags
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">{accommodation.udidNumber}</span>
          <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-600 font-bold text-[10px]">
            UDID VERIFIED
          </span>
        </div>

        <p className="text-gray-500">Disability Type: <span className="font-bold text-gray-800 dark:text-gray-200">{accommodation.disabilityType}</span></p>

        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-900 dark:text-indigo-200 space-y-1">
          <span className="font-bold">Exam Extra Time Allocation (3-Hour Base Exam):</span>
          <p className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
            {totalExamTime} Minutes (+60 Mins Extra Time Allocated)
          </p>
        </div>
      </div>
    </div>
  );
}
