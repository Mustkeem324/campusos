'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Upload, Search, ShieldAlert, ArrowRight } from 'lucide-react';

export default function GrievancePortal() {
  const [form, setForm] = useState({
    category: '',
    subject: '',
    description: '',
    institution: '',
  });
  
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newRef = 'GRV-' + Math.random().toString(36).substring(2, 10).toUpperCase();
    setRefId(newRef);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] py-16 px-4 font-sans">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-10 text-center">
          <div className="w-16 h-16 bg-[#EFF4FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-[#1854E8]" />
          </div>
          <h1 className="text-3xl font-bold text-[#101B33] mb-4">Grievance Logged</h1>
          <p className="text-[#475467] mb-8 text-lg">
            Your grievance has been submitted to the designated Grievance Officer.
          </p>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 inline-block mb-8 w-full max-w-sm">
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">Tracking Reference</p>
            <p className="text-2xl font-mono text-[#1854E8] font-bold tracking-widest">{refId}</p>
          </div>
          <p className="text-sm text-[#64748B] mb-8">
            You can check the status of your grievance at any time using this reference number. Our standard resolution time is 15 days.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/grievance/status/\${refId}`} className="bg-[#1854E8] text-white font-medium px-6 py-3 rounded-lg hover:bg-[#1546C6] transition-colors">
              Track Status Now
            </Link>
            <button onClick={() => {setSubmitted(false); setForm({category: '', subject: '', description: '', institution: ''})}} className="bg-white text-[#344054] border border-[#D0D5DD] font-medium px-6 py-3 rounded-lg hover:bg-[#F8FAFC] transition-colors">
              Submit Another
            </button>
          </div>
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
            <ShieldAlert className="w-10 h-10 text-[#1854E8] mb-6" />
            <h1 className="text-2xl font-bold mb-4">Grievance Redressal</h1>
            <p className="text-[#94A3B8] text-sm leading-relaxed mb-6">
              CampusOS is committed to resolving concerns efficiently. If you have a grievance regarding privacy, payments, academics, or platform safety, please log it here.
            </p>
            
            <div className="pt-6 border-t border-[#1E293B]">
              <h3 className="text-sm font-bold uppercase tracking-wider mb-3">Track Existing</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="GRV-..." className="w-full bg-[#1E293B] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#1854E8]" />
                <button className="bg-[#1854E8] hover:bg-[#1546C6] p-2 rounded-lg transition-colors">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
            <h3 className="text-[13px] font-bold text-[#101B33] uppercase tracking-wider mb-4">Escalation Matrix</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EFF4FF] text-[#1854E8] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                <div>
                  <p className="text-sm font-semibold text-[#101B33]">Submit Request</p>
                  <p className="text-xs text-[#64748B]">Expected response: 48 hours</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                <div>
                  <p className="text-sm font-semibold text-[#101B33]">Grievance Officer</p>
                  <p className="text-xs text-[#64748B]">Escalated if unresolved in 7 days</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                <div>
                  <p className="text-sm font-semibold text-[#101B33]">Appellate Authority</p>
                  <p className="text-xs text-[#64748B]">Final resolution (Max 30 days)</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Main Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-8 md:p-10">
            <h2 className="text-2xl font-bold text-[#101B33] mb-6">File a New Grievance</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">Grievance Category *</label>
                  <select 
                    required
                    value={form.category}
                    onChange={(e) => setForm({...form, category: e.target.value})}
                    className="w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none bg-white text-[#101B33]"
                  >
                    <option value="">Select Category...</option>
                    <option value="privacy">Data Privacy & Consent</option>
                    <option value="payment">Payment, Refund & Financial</option>
                    <option value="academic">Academic Records & Examination</option>
                    <option value="biometric">Biometric & Face Attendance</option>
                    <option value="safety">Community Safety & Abuse</option>
                    <option value="ai">AI & Automated Decisions</option>
                    <option value="accessibility">Accessibility & Inclusion</option>
                    <option value="other">Other / General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">Related Institution</label>
                  <select 
                    value={form.institution}
                    onChange={(e) => setForm({...form, institution: e.target.value})}
                    className="w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none bg-white text-[#101B33]"
                  >
                    <option value="">CampusOS Global</option>
                    <option value="upes">UPES Dehradun</option>
                    <option value="nits">NIT Silchar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">Subject / Summary *</label>
                <input 
                  type="text" 
                  required
                  value={form.subject}
                  onChange={(e) => setForm({...form, subject: e.target.value})}
                  className="w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none text-[#101B33]" 
                  placeholder="Brief description of the issue" 
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">Detailed Description *</label>
                <textarea 
                  required
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full rounded-lg border border-[#D0D5DD] px-4 py-3 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none text-[#101B33] h-40 resize-y" 
                  placeholder="Please provide specific details. Do not include passwords, full credit card numbers, or highly sensitive personal medical information."
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#344054] mb-2">Supporting Evidence (Optional)</label>
                <div className="border-2 border-dashed border-[#D0D5DD] rounded-xl p-8 text-center hover:bg-[#F8FAFC] transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-[#64748B] mx-auto mb-3" />
                  <p className="text-sm font-medium text-[#101B33]">Click to upload or drag and drop</p>
                  <p className="text-xs text-[#64748B] mt-1">PDF, JPG, PNG (Max. 5MB)</p>
                </div>
              </div>

              {form.category === 'payment' && (
                <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#D92D20] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-[#912018]">For Failed Transactions</h4>
                    <p className="text-sm text-[#B42318] mt-1">
                      If your money was debited but the payment is showing as failed, please visit the <Link href="/payments/failed-transaction" className="underline font-bold">Failed Transaction Help</Link> page first for automated reconciliation.
                    </p>
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-[#E2E8F0] flex justify-end">
                <button type="submit" className="bg-[#1854E8] text-white font-medium px-8 py-3 rounded-lg hover:bg-[#1546C6] transition-colors flex items-center gap-2">
                  Submit Grievance
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
