'use client';

import React, { useState } from 'react';
import { ShieldCheck, Search, CheckCircle2, XCircle, Award } from 'lucide-react';
import { verifyPublicCertificateByHash, CertificateVerificationResult } from '../../lib/public-portal-service';

export function PublicCertificateVerifierConsole() {
  const [certHash, setCertHash] = useState('CERT-2026-9941');
  const [verification, setVerification] = useState<CertificateVerificationResult | null>(null);

  const handleVerify = () => {
    const res = verifyPublicCertificateByHash(certHash);
    setVerification(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-500" />
            <span>Public Certificate & Degree Verification Portal</span>
          </h2>
          <p className="text-xs text-gray-500">
            Instant tamper-evident SHA-256 certificate verification for employers & credential agencies
          </p>
        </div>
      </div>

      <div className="flex gap-2 max-w-md">
        <input
          type="text"
          value={certHash}
          onChange={(e) => setCertHash(e.target.value)}
          placeholder="Enter Certificate Hash (e.g. CERT-2026-9941)"
          className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border text-xs font-mono font-bold"
        />
        <button
          onClick={handleVerify}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow transition flex items-center gap-1.5"
        >
          <Search size={14} />
          <span>Verify Credential</span>
        </button>
      </div>

      {verification && (
        <div className="animate-fade-in">
          {verification.isVerified ? (
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-900 dark:text-emerald-200 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-500" />
                <span className="font-extrabold text-sm">AUTHENTIC & VERIFIED CREDENTIAL</span>
              </div>
              <div className="space-y-1 font-mono text-[11px]">
                <p>Student: <span className="font-bold text-gray-900 dark:text-white">{verification.studentName}</span></p>
                <p>Degree: <span className="font-bold text-gray-900 dark:text-white">{verification.degreeOrCourse}</span></p>
                <p>Institution: <span className="font-bold text-gray-900 dark:text-white">{verification.institutionName}</span></p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400">Stamp Hash: {verification.tamperEvidentHash}</p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 text-rose-900 dark:text-rose-200 text-xs font-bold flex items-center gap-2">
              <XCircle size={18} />
              <span>INVALID / UNVERIFIED CERTIFICATE HASH!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
