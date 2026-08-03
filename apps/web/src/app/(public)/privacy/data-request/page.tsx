'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock, FileKey, CheckCircle2, AlertCircle } from 'lucide-react';

export default function DataRightsCentre() {
  const [step, setStep] = useState(1);
  const [requestType, setRequestType] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [refNumber, setRefNumber] = useState('');

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
    } else {
      setRefNumber('DSR-' + Math.random().toString(36).substring(2, 10).toUpperCase());
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F5F7FB] py-16 px-4">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-10 text-center">
          <div className="w-16 h-16 bg-[#ECFDF5] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-8 h-8 text-[#059669]" />
          </div>
          <h1 className="text-3xl font-bold text-[#101B33] mb-4">Request Submitted Successfully</h1>
          <p className="text-[#475467] mb-8 text-lg">
            Your data rights request has been securely logged.
          </p>
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-6 inline-block mb-8">
            <p className="text-sm font-bold text-[#64748B] uppercase tracking-wider mb-2">Reference Number</p>
            <p className="text-2xl font-mono text-[#1854E8] font-bold tracking-widest">{refNumber}</p>
          </div>
          <p className="text-sm text-[#64748B] max-w-lg mx-auto mb-8">
            Our privacy team will review this request. You may be contacted for additional identity verification. Please keep this reference number safe.
          </p>
          <Link href="/privacy" className="inline-block bg-[#1854E8] text-white font-medium px-8 py-3 rounded-lg hover:bg-[#1546C6] transition-colors">
            Return to Privacy Centre
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FB] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <Link href="/privacy" className="text-sm font-medium text-[#1854E8] hover:underline flex items-center gap-2 mb-4">
             ← Back to Privacy Centre
          </Link>
          <h1 className="text-3xl font-bold text-[#101B33] mb-2">Data Rights Centre</h1>
          <p className="text-[#475467] text-lg">Submit a secure request regarding your personal data processing.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          {/* Progress Bar */}
          <div className="bg-[#F8FAFC] border-b border-[#E2E8F0] px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold \${step >= 1 ? 'bg-[#1854E8] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>1</span>
              <span className={`text-sm font-medium \${step >= 1 ? 'text-[#101B33]' : 'text-[#64748B]'}`}>Request Type</span>
            </div>
            <div className={`flex-1 h-px mx-4 \${step >= 2 ? 'bg-[#1854E8]' : 'bg-[#E2E8F0]'}`}></div>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold \${step >= 2 ? 'bg-[#1854E8] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>2</span>
              <span className={`text-sm font-medium \${step >= 2 ? 'text-[#101B33]' : 'text-[#64748B]'}`}>Details</span>
            </div>
            <div className={`flex-1 h-px mx-4 \${step >= 3 ? 'bg-[#1854E8]' : 'bg-[#E2E8F0]'}`}></div>
            <div className="flex items-center gap-3">
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold \${step >= 3 ? 'bg-[#1854E8] text-white' : 'bg-[#E2E8F0] text-[#64748B]'}`}>3</span>
              <span className={`text-sm font-medium \${step >= 3 ? 'text-[#101B33]' : 'text-[#64748B]'}`}>Review</span>
            </div>
          </div>

          <form onSubmit={handleNext} className="p-8">
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-[#101B33] mb-4">Select Request Type</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: 'access', label: 'Access my data', desc: 'Request a copy of your personal data', icon: FileKey },
                    { id: 'delete', label: 'Delete eligible data', desc: 'Request deletion of your data (subject to retention rules)', icon: Shield },
                    { id: 'correct', label: 'Correct my data', desc: 'Request correction of inaccurate information', icon: FileKey },
                    { id: 'restrict', label: 'Restrict processing', desc: 'Limit how your data is processed', icon: Lock },
                    { id: 'biometric', label: 'Delete biometric data', desc: 'Remove face attendance templates', icon: Shield },
                  ].map((type) => (
                    <label 
                      key={type.id} 
                      className={`cursor-pointer border rounded-xl p-5 transition-all \${requestType === type.id ? 'border-[#1854E8] bg-[#EFF4FF] ring-1 ring-[#1854E8]' : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'}`}
                    >
                      <input 
                        type="radio" 
                        name="requestType" 
                        value={type.id} 
                        className="sr-only"
                        onChange={(e) => setRequestType(e.target.value)}
                        required
                      />
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-lg \${requestType === type.id ? 'bg-[#1854E8] text-white' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          <type.icon className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-[#101B33]">{type.label}</p>
                          <p className="text-sm text-[#475467] mt-1">{type.desc}</p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-[#101B33] mb-4">Provide Details</h2>
                
                <div className="bg-[#FEF3F2] border border-[#FEE4E2] rounded-lg p-4 flex gap-3 mb-6">
                  <AlertCircle className="w-5 h-5 text-[#D92D20] flex-shrink-0" />
                  <div>
                    <h3 className="text-sm font-semibold text-[#912018]">Identity Verification Required</h3>
                    <p className="text-sm text-[#B42318] mt-1">To process this request, we may need to verify your identity. If you are submitting this on behalf of a minor, additional guardian verification will be required.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">Institution Context</label>
                  <select className="w-full rounded-lg border border-[#D0D5DD] px-4 py-2.5 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none text-[#101B33]" required>
                    <option value="">Select an institution (if applicable)</option>
                    <option value="upes">UPES Dehradun</option>
                    <option value="general">General CampusOS Account</option>
                  </select>
                  <p className="text-xs text-[#64748B] mt-2">CampusOS acts as a data processor for most institutional data. We may need to route your request to the institution directly.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#344054] mb-2">Request Details</label>
                  <textarea 
                    className="w-full rounded-lg border border-[#D0D5DD] px-4 py-3 focus:border-[#1854E8] focus:ring-1 focus:ring-[#1854E8] outline-none text-[#101B33] h-32 resize-none" 
                    placeholder="Please provide specific details about the data you are inquiring about..."
                    required
                  ></textarea>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <h2 className="text-xl font-bold text-[#101B33] mb-4">Review & Submit</h2>
                <div className="bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] p-6 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-[#64748B]">Request Type</p>
                    <p className="font-semibold text-[#101B33] capitalize">{requestType.replace('-', ' ')}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#64748B]">Legal Scope & Exceptions</p>
                    <p className="text-sm text-[#475467] mt-1">By submitting this request, you acknowledge that certain data may be exempt from deletion or modification due to legal retention requirements (e.g., academic transcripts, financial payment records, legal holds).</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 mt-6">
                  <input type="checkbox" id="confirm" required className="mt-1 border-[#D0D5DD] rounded text-[#1854E8] focus:ring-[#1854E8]" />
                  <label htmlFor="confirm" className="text-sm text-[#475467]">
                    I declare under penalty of perjury that I am the data subject (or authorized guardian) of the account associated with this request.
                  </label>
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex justify-between">
              {step > 1 ? (
                <button type="button" onClick={() => setStep(step - 1)} className="px-6 py-2.5 rounded-lg border border-[#D0D5DD] font-medium text-[#344054] hover:bg-[#F8FAFC] transition-colors">
                  Previous
                </button>
              ) : <div></div>}
              <button type="submit" className="px-6 py-2.5 rounded-lg bg-[#1854E8] font-medium text-white hover:bg-[#1546C6] transition-colors disabled:opacity-50" disabled={!requestType && step === 1}>
                {step === 3 ? 'Submit Secure Request' : 'Next Step'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
