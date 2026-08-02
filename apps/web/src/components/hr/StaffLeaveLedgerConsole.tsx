'use client';

import React, { useState } from 'react';
import { Calendar, UserCheck, CheckCircle2 } from 'lucide-react';

export function StaffLeaveLedgerConsole() {
  const [leaves] = useState([
    { type: 'Casual Leave (CL)', allocated: 12, used: 3, remaining: 9 },
    { type: 'Earned Leave (EL)', allocated: 30, used: 5, remaining: 25 },
    { type: 'Sick Leave (SL)', allocated: 10, used: 1, remaining: 9 },
  ]);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <UserCheck size={20} className="text-indigo-500" />
            <span>Staff Attendance, Shift Scheduling & Leave Balance Ledger</span>
          </h2>
          <p className="text-xs text-gray-500">
            Biometric/RFID integration • Encashment calculations • Multi-tier leave approvals
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {leaves.map((l) => (
          <div key={l.type} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-center space-y-1">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{l.type}</span>
            <h4 className="text-2xl font-extrabold text-indigo-500">{l.remaining} Days Left</h4>
            <p className="text-[10px] text-gray-400">Used: {l.used} / Allocated: {l.allocated}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
