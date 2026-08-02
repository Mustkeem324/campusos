'use client';

import React, { useState } from 'react';
import { Building, QrCode, CheckCircle2, UserCheck } from 'lucide-react';

export function FacilityVisitorConsole() {
  const [visitorPass, setVisitorPass] = useState<{ passId: string; name: string; hostName: string } | null>(null);

  const handleIssueVisitorPass = () => {
    setVisitorPass({
      passId: `VIS-2026-${Math.floor(Math.random() * 10000)}`,
      name: 'Robert Vance (Guest Speaker)',
      hostName: 'Prof. Alan Turing',
    });
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Building size={20} className="text-indigo-500" />
            <span>Facility Space Booking & QR Visitor Pass Console</span>
          </h2>
          <p className="text-xs text-gray-500">
            Auditorium & lab room booking with conflict prevention • Photo capture & instant QR visitor pass
          </p>
        </div>

        <button
          onClick={handleIssueVisitorPass}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition"
        >
          <UserCheck size={14} />
          <span>Issue QR Visitor Pass</span>
        </button>
      </div>

      {visitorPass && (
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 text-indigo-900 dark:text-indigo-200 text-xs font-bold animate-fade-in flex items-center justify-between">
          <div>
            <span className="font-extrabold text-sm">{visitorPass.name}</span>
            <p className="font-mono text-[10px] text-indigo-500 mt-0.5">
              Host: {visitorPass.hostName} • Pass ID: {visitorPass.passId}
            </p>
          </div>
          <div className="p-2 bg-white rounded-lg border">
            <QrCode size={36} className="text-gray-900" />
          </div>
        </div>
      )}
    </div>
  );
}
