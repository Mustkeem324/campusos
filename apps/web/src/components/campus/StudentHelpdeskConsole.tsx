'use client';

import React, { useState } from 'react';
import { HelpCircle, FileText, QrCode, CheckCircle2, Clock } from 'lucide-react';
import { generateBonafideCertificate, CertificateRequest } from '../../lib/campus-life-service';

export function StudentHelpdeskConsole() {
  const [issuedCert, setIssuedCert] = useState<CertificateRequest | null>(null);

  const handleGenerateCertificate = (type: 'BONAFIDE' | 'TRANSFER_CERTIFICATE' | 'NOC') => {
    const cert = generateBonafideCertificate('usr_student_01', 'Alex Vance', 'CS2026-01', type);
    setIssuedCert(cert);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-500" />
            <span>Student Services Helpdesk & Instant QR Certificate Issuance</span>
          </h2>
          <p className="text-xs text-gray-500">
            SLA-tracked helpdesk ticketing • Automated Bonafide / TC / NOC certificate PDF issuance with public QR verification
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => handleGenerateCertificate('BONAFIDE')}
          className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-left hover:border-indigo-500 transition space-y-1"
        >
          <FileText size={20} className="text-indigo-500" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Issue Bonafide Certificate</h3>
          <p className="text-[10px] text-gray-400">Instant PDF download with QR verification hash</p>
        </button>

        <button
          onClick={() => handleGenerateCertificate('TRANSFER_CERTIFICATE')}
          className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-left hover:border-indigo-500 transition space-y-1"
        >
          <FileText size={20} className="text-emerald-500" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Issue Transfer Certificate (TC)</h3>
          <p className="text-[10px] text-gray-400">Requires clearance check</p>
        </button>

        <button
          onClick={() => handleGenerateCertificate('NOC')}
          className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 text-left hover:border-indigo-500 transition space-y-1"
        >
          <FileText size={20} className="text-purple-500" />
          <h3 className="text-xs font-bold text-gray-900 dark:text-white">Issue No Objection Certificate (NOC)</h3>
          <p className="text-[10px] text-gray-400">For passport/visa/internships</p>
        </button>
      </div>

      {issuedCert && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold animate-fade-in flex items-center justify-between">
          <div>
            <span className="font-extrabold">{issuedCert.certificateType} Certificate Issued!</span>
            <p className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
              Hash: {issuedCert.verificationHash}
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
