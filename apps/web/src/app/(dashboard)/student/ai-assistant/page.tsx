import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bot, BookOpen, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel';

export default async function StudentAiAssistantPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Student AI Copilot & Knowledge Assistant</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Permission-aware assistant for academic regulations, attendance math, schedule lookups, and service request drafting.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#EDF3FF] border border-[#CAD4E2] text-[#1754E8] text-xs font-semibold px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-[#078A57]" />
          <span>Tenant Isolated • Role: STUDENT</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Capabilities & Quick Prompts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#DFE6F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#101A32] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1754E8]" />
              <span>What Your AI Assistant Can Help You With</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Academic Policy RAG</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Ask about attendance minimums, examination revaluation policies, credit requirements, and grade calculation.
                </p>
              </div>
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Schedule & Attendance Math</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Check today&apos;s lectures, lab sessions, attendance shortage flags, and required classes to reach 75%.
                </p>
              </div>
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Fee Statements & Dues</h3>
                <p className="text-xs text-[#5F6C7B]">
                  View outstanding installment dates, paid receipts summary, and fee structure rules.
                </p>
              </div>
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Draft Service Requests</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Draft requests for transcripts, outpasses, and certificates with human-in-the-loop confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#101A32] text-white rounded-xl p-6 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#8A95A6] uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-[#078A57]" />
              <span>AI Safety & Human Governance</span>
            </div>
            <h3 className="text-lg font-bold">Explicit Approval Required for High-Impact Actions</h3>
            <p className="text-sm text-[#DFE6F0] leading-relaxed">
              CampusOS AI never alters your attendance, marks, fees, or official records autonomously. All AI actions produce a review proposal requiring your explicit human confirmation.
            </p>
          </div>
        </div>

        {/* Right Col: Institutional Policy Citations */}
        <div className="space-y-6">
          <div className="bg-white border border-[#DFE6F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#101A32] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#1754E8]" />
              <span>Active Knowledge Base Sources</span>
            </h2>
            <div className="space-y-3">
              <div className="border border-[#DFE6F0] rounded-lg p-3 text-xs bg-[#F6F8FC]">
                <div className="font-semibold text-[#101828]">Attendance Policy 2026</div>
                <div className="text-[#5F6C7B] mt-1">75% minimum threshold for exam eligibility.</div>
                <span className="inline-block mt-2 text-[10px] bg-[#EDF3FF] text-[#1754E8] font-bold px-2 py-0.5 rounded">VERIFIED CITATION</span>
              </div>
              <div className="border border-[#DFE6F0] rounded-lg p-3 text-xs bg-[#F6F8FC]">
                <div className="font-semibold text-[#101828]">Examination Re-evaluation Rules</div>
                <div className="text-[#5F6C7B] mt-1">14-day window for scrutiny requests.</div>
                <span className="inline-block mt-2 text-[10px] bg-[#EDF3FF] text-[#1754E8] font-bold px-2 py-0.5 rounded">VERIFIED CITATION</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Persistent AI Drawer Panel */}
      <AiAssistantPanel userRole="STUDENT" userName={session.role} />
    </div>
  );
}
