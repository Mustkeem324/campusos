'use client';

import React from 'react';
import Link from 'next/link';
import { RefreshCw, FileText, ShieldCheck, ArrowRight, Landmark } from 'lucide-react';

export default function RefundsPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FB] py-12 lg:py-16 px-4 sm:px-6 lg:px-8 font-sans dark:bg-slate-950">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#101B33] rounded-2xl p-8 text-white dark:bg-slate-900">
            <RefreshCw className="w-10 h-10 text-[#1854E8] mb-6" />
            <h1 className="text-2xl font-bold mb-4">Refund Centre</h1>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
              Refund requests are processed against verified payments only. Each request is reviewed by institution finance before any money moves.
            </p>

            <div className="pt-6 border-t border-[#1E293B]">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">How refunds work</h3>
              <ol className="space-y-3 text-sm text-[#CBD5E1]">
                <li className="flex gap-2"><span className="font-bold text-[#1854E8]">1.</span>Sign in to your finance workspace</li>
                <li className="flex gap-2"><span className="font-bold text-[#1854E8]">2.</span>Choose a confirmed payment and request a refund</li>
                <li className="flex gap-2"><span className="font-bold text-[#1854E8]">3.</span>Finance reviews eligibility and amount</li>
                <li className="flex gap-2"><span className="font-bold text-[#1854E8]">4.</span>Approved refunds are processed to the original payment method</li>
              </ol>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-[13px] font-bold text-[#101B33] uppercase tracking-wider dark:text-white">Quick Links</h3>
            <Link href="/legal/refund-and-cancellation" className="flex items-center justify-between text-sm text-[#475467] hover:text-[#1854E8] group dark:text-slate-400">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Refund Policy</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="/payments" className="flex items-center justify-between text-sm text-[#475467] hover:text-[#1854E8] group dark:text-slate-400">
              <span className="flex items-center gap-2"><Landmark className="w-4 h-4" /> Fee centre</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Main information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 md:p-10 dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-[#101B33] mb-4 dark:text-white">Request a refund from your finance workspace</h2>
            <p className="text-[#475467] text-sm leading-7 mb-8 dark:text-slate-400">
              Refunds are never granted from a public form. Sign in to the finance workspace, open the refund section,
              and select the confirmed payment you believe should be refunded. The system validates the refundable
              balance and routes the request through the institution review workflow.
            </p>

            <div className="grid gap-4 sm:grid-cols-2 mb-8">
              <div className="border border-[#E2E8F0] rounded-xl p-5 dark:border-slate-700">
                <ShieldCheck className="w-5 h-5 text-[#059669] mb-3" />
                <h4 className="text-sm font-bold text-[#101B33] dark:text-white">Verified payments only</h4>
                <p className="text-sm text-[#64748B] mt-1 dark:text-slate-400">A refund can only reference a confirmed payment with an available refundable balance. Over-refunds are rejected automatically.</p>
              </div>
              <div className="border border-[#E2E8F0] rounded-xl p-5 dark:border-slate-700">
                <RefreshCw className="w-5 h-5 text-[#1754E8] mb-3" />
                <h4 className="text-sm font-bold text-[#101B33] dark:text-white">Review workflow</h4>
                <p className="text-sm text-[#64748B] mt-1 dark:text-slate-400">Requests move through review, approval and processing with an auditable trail recorded at every step.</p>
              </div>
            </div>

            <div className="bg-[#F0F4FF] border border-[#D6E0EC] rounded-xl p-5 flex items-start gap-3 dark:bg-blue-950/40 dark:border-blue-900">
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-[#173B78] dark:text-blue-200">Institution policy applies</h4>
                <p className="text-sm text-[#4F6690] mt-1 dark:text-blue-300">
                  The institution&apos;s active <Link href="/legal/refund-and-cancellation" className="underline font-bold">Refund Policy</Link> determines eligibility, processing deductions and timelines. Approved refunds typically take 5&ndash;7 business days to reflect in the original payment method.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className="bg-[#1854E8] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1546C6] transition-colors">
                Sign in to finance workspace
              </Link>
              <Link href="/payments" className="border border-[#D0D5DD] text-[#475467] font-medium px-6 py-3 rounded-lg hover:bg-[#F1F5F9] transition-colors dark:border-slate-600 dark:text-slate-300">
                View fee centre
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
