'use client';

import React, { useState } from 'react';
import { ShieldCheck, CheckCircle2, CloudUpload, CreditCard, Award } from 'lucide-react';
import { pushMarksheetToDigiLocker, pushCreditsToABC, ABCCreditRecord } from '../../lib/govt-compliance-service';

export function GovtIntegrationsConsole() {
  const [digiLockerResult, setDigiLockerResult] = useState<{ digiLockerUri: string; sha256Hash: string } | null>(null);
  const [abcResult, setAbcResult] = useState<{ transactionId: string } | null>(null);

  const handlePushDigiLocker = () => {
    const res = pushMarksheetToDigiLocker({
      studentRollNumber: 'CS2026-01',
      documentType: 'MARKSHEET',
      yearOfPassing: 2026,
      documentData: { sgpa: 9.5, cgpa: 3.84, studentName: 'Alex Vance' },
    });
    setDigiLockerResult(res);
  };

  const handlePushABC = () => {
    const record: ABCCreditRecord = {
      apaarId: 'APAAR-9941-2026-88',
      studentName: 'Alex Vance',
      courseCode: 'CS401',
      creditsEarned: 4.0,
      academicYear: '2025-2026',
      status: 'VERIFIED',
    };
    const res = pushCreditsToABC(record);
    setAbcResult(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            <span>Indian Regulatory Integrations (DigiLocker / NAD & ABC Credit Bank)</span>
          </h2>
          <p className="text-xs text-gray-500">
            DigiLocker SHA-256 tamper-evident certificate push • Academic Bank of Credits (ABC / APAAR) credit deposit
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DigiLocker Push Card */}
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <CloudUpload size={16} className="text-sky-500" />
            <span>DigiLocker / NAD Document Issuance</span>
          </h3>

          <button
            onClick={handlePushDigiLocker}
            className="w-full py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow transition"
          >
            Push Official Marksheet to DigiLocker Mock
          </button>

          {digiLockerResult && (
            <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 text-sky-900 dark:text-sky-200 text-xs font-mono space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={16} /> Marksheet Pushed to DigiLocker Vault!
              </div>
              <p className="text-[10px] break-all">URI: {digiLockerResult.digiLockerUri}</p>
              <p className="text-[10px] break-all text-sky-600 dark:text-sky-400">
                SHA-256 Hash: {digiLockerResult.sha256Hash}
              </p>
            </div>
          )}
        </div>

        {/* ABC Credit Bank Deposit Card */}
        <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-3">
          <h3 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
            <CreditCard size={16} className="text-indigo-500" />
            <span>Academic Bank of Credits (ABC / APAAR ID) Deposit</span>
          </h3>

          <button
            onClick={handlePushABC}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition"
          >
            Deposit 4.0 Credits to Student ABC Account
          </button>

          {abcResult && (
            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 text-indigo-900 dark:text-indigo-200 text-xs font-mono space-y-1 animate-fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 size={16} /> ABC Credit Deposit Verified!
              </div>
              <p className="text-[10px]">Transaction ID: {abcResult.transactionId}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
