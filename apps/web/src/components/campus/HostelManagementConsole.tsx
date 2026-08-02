'use client';

import React, { useState } from 'react';
import { Building2, CheckCircle2, Clock, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { OutpassRequest, evaluateOutpassStatus } from '../../lib/campus-life-service';

export function HostelManagementConsole() {
  const [outpasses, setOutpasses] = useState<OutpassRequest[]>([
    {
      id: 'out_101',
      studentId: 'usr_student_01',
      studentName: 'Alex Vance',
      destination: 'Home Visit (Weekend)',
      departureDate: '2026-02-06',
      returnDate: '2026-02-08',
      parentApproved: true,
      wardenApproved: false, // Pending Warden Approval
      status: 'PENDING',
    },
  ]);

  const handleApproveWarden = (id: string) => {
    const target = outpasses.find((o) => o.id === id);
    if (target) {
      target.wardenApproved = true;
      evaluateOutpassStatus(target);
      setOutpasses([...outpasses]);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 size={20} className="text-indigo-500" />
            <span>Hostel Operations & Dual-Approval Outpass Console</span>
          </h2>
          <p className="text-xs text-gray-500">
            Parent + Warden dual-consent required for overnight student leave
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs uppercase font-bold text-gray-400">Active Outpass Approval Queue</h3>

        <div className="space-y-3">
          {outpasses.map((o) => (
            <div
              key={o.id}
              className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">{o.studentName}</h4>
                  <span className="text-[10px] font-mono text-gray-400">({o.destination})</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Leave Dates: {o.departureDate} to {o.returnDate}
                </p>
                <div className="flex gap-2 mt-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${o.parentApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    Parent Consent: {o.parentApproved ? 'VERIFIED' : 'PENDING'}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${o.wardenApproved ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                    Warden Consent: {o.wardenApproved ? 'VERIFIED' : 'PENDING'}
                  </span>
                </div>
              </div>

              <div>
                {o.status === 'APPROVED' ? (
                  <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-1">
                    <CheckCircle2 size={14} /> Outpass Approved
                  </span>
                ) : (
                  <button
                    onClick={() => handleApproveWarden(o.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md"
                  >
                    Warden Endorse Outpass
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
