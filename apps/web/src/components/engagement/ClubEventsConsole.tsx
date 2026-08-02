'use client';

import React, { useState } from 'react';
import { Calendar, QrCode, CheckCircle2, Award } from 'lucide-react';
import { processEventQRCheckIn, EventCheckInRecord } from '../../lib/gamification-service';

export function ClubEventsConsole() {
  const [checkIn, setCheckIn] = useState<EventCheckInRecord | null>(null);

  const handleQRCheckIn = () => {
    const res = processEventQRCheckIn('evt_hackathon_2026', 'CampusOS Hackathon 2026', 'usr_student_01', 'Alex Vance');
    setCheckIn(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Calendar size={20} className="text-indigo-500" />
            <span>Clubs Hub & QR Check-In Event Certificate Engine</span>
          </h2>
          <p className="text-xs text-gray-500">
            Student club events • Instant QR venue check-in • Automated participation certificate issuance
          </p>
        </div>

        <button
          onClick={handleQRCheckIn}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <QrCode size={14} />
          <span>Simulate Event QR Venue Check-In</span>
        </button>
      </div>

      {checkIn && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold space-y-1 animate-fade-in flex items-center justify-between">
          <div>
            <span className="font-extrabold text-sm">{checkIn.eventTitle} Participation Certificate Issued!</span>
            <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Hash: {checkIn.certificateHash}
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
