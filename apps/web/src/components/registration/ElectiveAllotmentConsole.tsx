'use client';

import React, { useState } from 'react';
import { Cpu, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { PreferenceChoice, runElectiveAutoAllotment } from '../../lib/registration-engine';

export function ElectiveAllotmentConsole() {
  const [sampleChoices] = useState<PreferenceChoice[]>([
    { studentId: 's1', studentName: 'Alex Vance', cgpa: 3.92, preferenceRank: 1, requestedOfferingId: 'offering_cs405_secB' },
    { studentId: 's2', studentName: 'David Kim', cgpa: 3.84, preferenceRank: 1, requestedOfferingId: 'offering_cs405_secB' },
    { studentId: 's3', studentName: 'Sarah Jenkins', cgpa: 3.75, preferenceRank: 1, requestedOfferingId: 'offering_cs405_secB' },
    { studentId: 's4', studentName: 'Michael Chang', cgpa: 3.60, preferenceRank: 2, requestedOfferingId: 'offering_cs405_secB' },
  ]);

  const [allotmentResult, setAllotmentResult] = useState<{
    allotted: PreferenceChoice[];
    waitlisted: PreferenceChoice[];
  } | null>(null);

  const handleRunAllotment = () => {
    const result = runElectiveAutoAllotment(sampleChoices);
    setAllotmentResult(result);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Cpu size={20} className="text-purple-500" />
            <span>Elective Preference Ranking & CGPA Auto-Allotment Algorithm</span>
          </h2>
          <p className="text-xs text-gray-500">
            Merit-weighted seat allocation algorithm with tie-breakers and manual override controls
          </p>
        </div>

        <button
          onClick={handleRunAllotment}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <RefreshCw size={14} />
          <span>Execute Auto-Allotment Algorithm</span>
        </button>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">Student Name</th>
              <th className="p-3">CGPA</th>
              <th className="p-3">Choice Rank</th>
              <th className="p-3">Requested Elective</th>
              <th className="p-3 text-right">Allotment Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {sampleChoices.map((choice) => {
              const isAllotted = allotmentResult?.allotted.some((a) => a.studentId === choice.studentId);
              const isWaitlisted = allotmentResult?.waitlisted.some((w) => w.studentId === choice.studentId);

              return (
                <tr key={choice.studentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-bold text-gray-900 dark:text-white">{choice.studentName}</td>
                  <td className="p-3 font-mono font-bold text-indigo-500">{choice.cgpa.toFixed(2)}</td>
                  <td className="p-3">Choice #{choice.preferenceRank}</td>
                  <td className="p-3 font-mono text-gray-500">{choice.requestedOfferingId}</td>
                  <td className="p-3 text-right">
                    {allotmentResult === null ? (
                      <span className="text-gray-400 font-medium">Pending Algorithm Run</span>
                    ) : isAllotted ? (
                      <span className="text-emerald-500 font-bold flex items-center justify-end gap-1">
                        <CheckCircle2 size={14} /> Allotted
                      </span>
                    ) : (
                      <span className="text-amber-500 font-bold flex items-center justify-end gap-1">
                        <AlertCircle size={14} /> Waitlisted
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
