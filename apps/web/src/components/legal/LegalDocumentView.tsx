'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Printer, ChevronLeft, FileText, Globe, Info } from 'lucide-react';

interface LegalDocumentViewProps {
  title: string;
  documentType: string;
}

export function LegalDocumentView({ title, documentType }: LegalDocumentViewProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FB] font-sans">
      {/* Top Navigation */}
      <div className="bg-white border-b border-[#E2E8F0] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/legal" className="flex items-center gap-2 text-[#475467] hover:text-[#1854E8] font-medium text-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Back to Legal Centre
          </Link>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#475467] hover:text-[#101B33] hover:bg-[#F1F5F9] rounded-md transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Main Content Area */}
          <div className="flex-1 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
            <div className="p-8 md:p-12 border-b border-[#E2E8F0] bg-white">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] text-[#065F46] text-xs font-semibold uppercase tracking-wide mb-6">
                Published
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#101B33] mb-6 tracking-tight">
                {title}
              </h1>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4 border-t border-[#F1F5F9]">
                <div className="flex items-start gap-2">
                  <FileText className="w-4 h-4 text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Version</p>
                    <p className="text-[13px] text-[#101B33] font-medium">Current published version</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Applicable To</p>
                    <p className="text-[13px] text-[#101B33] font-medium">Global</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#64748B] mt-0.5" />
                  <div>
                    <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Previous Versions</p>
                    <p className="text-[13px] text-[#475467] font-medium">Available from institutional records</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 md:p-12 prose prose-slate max-w-none">
              <div className="p-4 bg-[#F8FAFC] border-l-4 border-[#1854E8] rounded-r-lg text-sm text-[#475467] mb-8">
                <strong>Summary:</strong> This is a legally reviewable draft of the {title}. This placeholder content must be replaced by actual approved legal text from CampusOS counsel before production deployment.
              </div>

              <h2 id="section-1">1. Introduction</h2>
              <p>
                Welcome to CampusOS. These {title} govern your access to and use of our multi-tenant university operating system and services. By accessing or using CampusOS, you agree to be bound by these terms. If you are using CampusOS on behalf of an institution, you represent that you have the authority to bind that institution.
              </p>

              <h2 id="section-2">2. Scope and Applicability</h2>
              <p>
                This document applies to all users of the CampusOS platform, including but not limited to administrators, faculty, students, parents, and prospective applicants.
                CampusOS operates as a data processor for many functions on behalf of the educational institution (the data controller). 
              </p>
              
              <h2 id="section-3">3. User Responsibilities</h2>
              <p>
                Users must maintain the confidentiality of their account credentials and are responsible for all activities that occur under their account. You agree to:
              </p>
              <ul>
                <li>Provide accurate and complete information during registration.</li>
                <li>Not share authentication tokens, passwords, or multi-factor authentication codes.</li>
                <li>Report any unauthorized access immediately to your institution's IT administrator.</li>
                <li>Comply with all applicable laws and institutional policies.</li>
              </ul>

              <h2 id="section-4">4. Compliance and Certifications</h2>
              <p>
                CampusOS is designed to support institutional compliance with relevant educational and privacy frameworks. However, we do not claim guaranteed data security or automatic compliance with DPDP, GDPR, or PCI DSS simply by using the software. Compliance is a shared responsibility. Any certifications achieved by CampusOS (e.g., ISO, SOC) will be explicitly stated in the <Link href="/trust">Trust Centre</Link> with accompanying verified evidence.
              </p>

              <h2 id="section-5">5. Updates to this Policy</h2>
              <p>
                We may update these terms from time to time. We will notify you of material changes by posting the new policy on this page and updating the "Effective Date" at the top of this document. For significant changes, we may also notify you via email or a platform notification.
              </p>

              <h2 id="section-6">6. Contact Information</h2>
              <p>
                If you have questions about these {title}, please contact our legal team at:
                <br /><br />
                <strong>CampusOS Legal Department</strong><br />
                Email: legal@campusos.example.com<br />
                For privacy requests, please visit the <Link href="/privacy/data-request">Data Rights Centre</Link>.
              </p>
            </div>
          </div>

          {/* Sidebar / Table of Contents */}
          <div className="w-full lg:w-72 flex-shrink-0">
            <div className="sticky top-24 bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-6">
              <h3 className="text-[13px] font-bold text-[#101B33] uppercase tracking-wider mb-4">Contents</h3>
              <nav className="space-y-3">
                <a href="#section-1" className="block text-[14px] text-[#475467] hover:text-[#1854E8] font-medium">1. Introduction</a>
                <a href="#section-2" className="block text-[14px] text-[#475467] hover:text-[#1854E8] font-medium">2. Scope and Applicability</a>
                <a href="#section-3" className="block text-[14px] text-[#475467] hover:text-[#1854E8] font-medium">3. User Responsibilities</a>
                <a href="#section-4" className="block text-[14px] text-[#475467] hover:text-[#1854E8] font-medium">4. Compliance and Certifications</a>
                <a href="#section-5" className="block text-[14px] text-[#475467] hover:text-[#1854E8] font-medium">5. Updates to this Policy</a>
                <a href="#section-6" className="block text-[14px] text-[#475467] hover:text-[#1854E8] font-medium">6. Contact Information</a>
              </nav>
              
              <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">
                  Need help understanding this document?
                </p>
                <Link 
                  href="/contact" 
                  className="block w-full py-2 px-4 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-lg text-[13px] font-medium text-[#101B33] text-center transition-colors"
                >
                  Contact Legal Support
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
