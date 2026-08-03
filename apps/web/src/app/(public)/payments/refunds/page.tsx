'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, RefreshCw, FileText, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function RefundsPage() {
  const [step, setStep] = useState(1);
  const [transactionRef, setTransactionRef] = useState('');
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] py-16 px-4 font-sans">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-10 text-center">
          <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#059669]" />
          </div>
          <h1 className="text-3xl font-bold text-[#101B33] mb-4">Refund Request Submitted</h1>
          <p className="text-[#475467] mb-8 text-lg">
            Your refund request for transaction <strong className="text-[#101B33]">{transactionRef}</strong> has been received and is under review.
          </p>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 inline-block mb-8 w-full max-w-sm text-left">
            <p className="text-sm font-medium text-[#64748B] mb-1">Status</p>
            <p className="text-[#101B33] font-semibold flex items-center gap-2 mb-4">
               <span className="w-2 h-2 rounded-full bg-[#F59E0B]"></span> ELIGIBILITY_REVIEW
            </p>
            <p className="text-sm font-medium text-[#64748B] mb-1">Expected Decision</p>
            <p className="text-[#101B33] font-semibold">3-5 Business Days</p>
          </div>
          <p className="text-sm text-[#64748B] mb-8">
            You will receive an email once the finance team processes your request. Approved refunds typically take 5-7 days to reflect in the original payment method.
          </p>
          <button onClick={() => {setSubmitted(false); setStep(1); setTransactionRef('');}} className="bg-[#1854E8] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1546C6] transition-colors">
            Return to Refunds
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-12 lg:py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-[#101B33] rounded-2xl p-8 text-white">
            <RefreshCw className="w-10 h-10 text-[#1854E8] mb-6" />
            <h1 className="text-2xl font-bold mb-4">Refund Centre</h1>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
              Request refunds for eligible transactions including tuition, hostel fees, and wallet top-ups.
            </p>
            
            <div className="pt-6 border-t border-[#1E293B]">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Track Existing Request</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Transaction Ref..." className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1854E8]" />
                <button className="bg-[#1854E8] hover:bg-[#1546C6] p-2 rounded-lg transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4">
            <h3 className="text-[13px] font-bold text-[#101B33] uppercase tracking-wider">Quick Links</h3>
            <Link href="/legal/refund-and-cancellation" className="flex items-center justify-between text-sm text-[#475467] hover:text-[#1854E8] group">
              <span className="flex items-center gap-2"><FileText className="w-4 h-4" /> Refund Policy</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
            <Link href="/payments/disputes" className="flex items-center justify-between text-sm text-[#475467] hover:text-[#1854E8] group">
              <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Raise a Dispute</span>
              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-2xl font-bold text-[#101B33] mb-6">Request a Refund</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-5 mb-6">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-[#344054] mb-2">Transaction Reference *</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        required
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="flex-1 rounded-lg border border-[#D0D5DD] px-4 py-2.5 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none text-[#101B33] font-mono" 
                        placeholder="e.g. TXN-987654321" 
                      />
                      <button type="button" onClick={() => setStep(2)} disabled={!transactionRef} className="bg-[#F1F5F9] text-[#475467] border border-[#D0D5DD] font-medium px-4 rounded-lg hover:bg-[#E2E8F0] transition-colors disabled:opacity-50">
                        Verify
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {step >= 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                  <div className="border border-[#E2E8F0] rounded-xl p-5">
                    <h4 className="text-sm font-bold text-[#101B33] uppercase tracking-wider mb-4 border-b border-[#E2E8F0] pb-2">Transaction Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#64748B]">Date</p>
                        <p className="font-semibold text-[#101B33]">Oct 24, 2026</p>
                      </div>
                      <div>
                        <p className="text-[#64748B]">Amount</p>
                        <p className="font-semibold text-[#101B33]">₹15,000</p>
                      </div>
                      <div>
                        <p className="text-[#64748B]">Category</p>
                        <p className="font-semibold text-[#101B33]">Hostel Fee (Q1)</p>
                      </div>
                      <div>
                        <p className="text-[#64748B]">Eligibility</p>
                        <p className="font-semibold text-[#059669]">Eligible for Partial Refund</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">Reason for Refund *</label>
                    <select 
                      required
                      className="w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none bg-white text-[#101B33]"
                    >
                      <option value="">Select Reason...</option>
                      <option value="withdrawal">Admission Withdrawal</option>
                      <option value="overpayment">Overpayment / Duplicate Payment</option>
                      <option value="hostel_leave">Vacating Hostel Early</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#344054] mb-2">Additional Details *</label>
                    <textarea 
                      required
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full rounded-lg border border-[#D0D5DD] px-4 py-3 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none text-[#101B33] h-32 resize-y" 
                      placeholder="Please provide any supporting context for this refund request..."
                    ></textarea>
                  </div>
                  
                  <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-[#912018]">Refund Policy Acknowledgment</h4>
                      <p className="text-sm text-[#B42318] mt-1">
                        By submitting this request, you acknowledge that a processing fee or deduction may apply according to the institution's active <Link href="/legal/refund-and-cancellation" className="underline font-bold">Refund Policy</Link>.
                      </p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
                    <button type="submit" className="bg-[#1854E8] text-white font-medium px-8 py-3 rounded-lg hover:bg-[#1546C6] transition-colors">
                      Submit Request
                    </button>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
