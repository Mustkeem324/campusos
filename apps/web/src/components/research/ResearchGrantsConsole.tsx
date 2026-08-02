'use client';

import React, { useState } from 'react';
import { DollarSign, FileSpreadsheet, CheckCircle2, Award, Sparkles } from 'lucide-react';
import { ResearchGrant, UtilizationCertificate, generateUtilizationCertificate } from '../../lib/research-service';

export function ResearchGrantsConsole() {
  const [grants, setGrants] = useState<ResearchGrant[]>([
    {
      id: 'grant_dst_101',
      title: 'AI for Healthcare Diagnostics in Rural Clinics',
      piFacultyId: 'fac_turing',
      piFacultyName: 'Dr. Alan Turing',
      agency: 'DST',
      sanctionedAmount: 50000,
      releasedAmount: 35000,
      spentAmount: 32000,
      status: 'SANCTIONED',
    },
  ]);

  const [issuedUC, setIssuedUC] = useState<UtilizationCertificate | null>(null);

  const handleGenerateUC = (grant: ResearchGrant) => {
    const uc = generateUtilizationCertificate(grant);
    setIssuedUC(uc);
    setGrants([...grants]);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign size={20} className="text-indigo-500" />
            <span>Research Grants & Fund Utilization Certificate (UC) Console</span>
          </h2>
          <p className="text-xs text-gray-500">
            DST / SERB / ICSSR proposal tracking • Budget utilization auditing • 1-Click UC issuance
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {grants.map((g) => (
          <div key={g.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-500 font-bold">{g.agency} GRANT</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{g.title}</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">PI: <span className="font-bold text-gray-800 dark:text-gray-200">{g.piFacultyName}</span></p>
              </div>

              <div className="text-right">
                <span className="text-lg font-extrabold text-emerald-500">${g.sanctionedAmount.toLocaleString()}</span>
                <span className="block text-[10px] text-gray-400 font-mono">Sanctioned</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs text-center">
              <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border">
                <span className="text-gray-400 text-[10px]">Released</span>
                <p className="font-bold font-mono text-indigo-500">${g.releasedAmount.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border">
                <span className="text-gray-400 text-[10px]">Spent</span>
                <p className="font-bold font-mono text-emerald-500">${g.spentAmount.toLocaleString()}</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-gray-900 border">
                <span className="text-gray-400 text-[10px]">Unspent Balance</span>
                <p className="font-bold font-mono text-amber-500">${(g.releasedAmount - g.spentAmount).toLocaleString()}</p>
              </div>
            </div>

            <div>
              {g.status === 'UTILIZATION_CERT_ISSUED' ? (
                <span className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 size={14} /> Utilization Certificate (UC) Issued
                </span>
              ) : (
                <button
                  onClick={() => handleGenerateUC(g)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition"
                >
                  Generate Official Utilization Certificate (UC)
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {issuedUC && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold font-mono space-y-1 animate-fade-in">
          <div className="flex items-center gap-1.5 font-extrabold">
            <CheckCircle2 size={16} /> Official Utilization Certificate (UC) Generated!
          </div>
          <p className="text-[10px]">UC ID: {issuedUC.ucId} • Spent: ${issuedUC.spentAmount} • Unspent: ${issuedUC.unspentBalance}</p>
        </div>
      )}
    </div>
  );
}
