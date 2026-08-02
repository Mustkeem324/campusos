'use client';

import React, { useState } from 'react';
import { ShieldCheck, Lock, CheckCircle2, FileText } from 'lucide-react';
import { fileConfidentialPOSHComplaint, POSHComplaintCase } from '../../lib/wellness-safety-service';

export function POSHConfidentialConsole() {
  const [complaint, setComplaint] = useState<POSHComplaintCase | null>(null);

  const handleFileComplaint = () => {
    const res = fileConfidentialPOSHComplaint(
      'POSH_HARASSMENT',
      'Confidential report submitted to Internal Complaints Committee (ICC).',
      true
    );
    setComplaint(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Lock size={20} className="text-purple-500" />
            <span>POSH / Internal Complaints Committee (ICC) Confidential Portal</span>
          </h2>
          <p className="text-xs text-gray-500">
            Guaranteed anonymous reporting • Role-masked confidential investigation workflow
          </p>
        </div>

        <button
          onClick={handleFileComplaint}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <Lock size={14} />
          <span>File Confidential Anonymous Report</span>
        </button>
      </div>

      {complaint && (
        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 text-purple-900 dark:text-purple-200 text-xs font-bold space-y-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-extrabold flex items-center gap-1.5">
              <CheckCircle2 size={16} /> Confidential ICC Case Registered: {complaint.caseId}
            </span>
            <span className="font-mono text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded">
              {complaint.iccCommitteeStatus}
            </span>
          </div>
          <p className="text-[10px] font-mono text-purple-600 dark:text-purple-300">
            Complainant Masked Identity Hash: {complaint.complainantHash}
          </p>
        </div>
      )}
    </div>
  );
}
