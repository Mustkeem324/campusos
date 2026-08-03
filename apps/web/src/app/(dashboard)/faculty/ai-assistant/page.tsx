import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bot, BookOpen, FileCheck, ShieldCheck } from 'lucide-react';
import { AiAssistantPanel } from '@/components/ai/AiAssistantPanel';

export default async function FacultyAiAssistantPage() {
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
            <h1 className="text-2xl font-bold text-[#101A32]">Faculty AI Copilot & Course Workspace</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Automated lesson plan drafting, question bank generation, assignment rubric proposals, and student risk summaries.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#EDF3FF] border border-[#CAD4E2] text-[#1754E8] text-xs font-semibold px-3 py-1.5 rounded-lg">
          <ShieldCheck className="w-4 h-4 text-[#078A57]" />
          <span>Tenant Isolated • Role: FACULTY</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#DFE6F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#101A32] flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-[#1754E8]" />
              <span>Teaching & Course Operations Copilot</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Quiz & Question Drafts</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Generate draft question banks and quizzes aligned with Bloom&apos;s Taxonomy and course outcomes.
                </p>
              </div>
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">At-Risk Student Summaries</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Summarize students flagged for attendance shortages or low quiz performance with data-backed indicators.
                </p>
              </div>
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Grading Rubric Proposals</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Create rubric criteria for lab reports and term projects with multi-tier grading points.
                </p>
              </div>
              <div className="bg-[#F6F8FC] border border-[#DFE6F0] rounded-lg p-4">
                <h3 className="text-sm font-semibold text-[#101828] mb-1">Announcement Drafts</h3>
                <p className="text-xs text-[#5F6C7B]">
                  Draft course updates and exam reminders for your assigned sections before posting.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#DFE6F0] rounded-xl p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#101A32] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#1754E8]" />
              <span>Assigned Courses Context</span>
            </h2>
            <div className="space-y-3 text-xs">
              <div className="border border-[#DFE6F0] rounded-lg p-3 bg-[#F6F8FC]">
                <div className="font-semibold text-[#101828]">CS-301 Data Structures</div>
                <div className="text-[#5F6C7B] mt-1">Lab 4 • 45 Enrolled Students</div>
              </div>
              <div className="border border-[#DFE6F0] rounded-lg p-3 bg-[#F6F8FC]">
                <div className="font-semibold text-[#101828]">CS-302 Operating Systems</div>
                <div className="text-[#5F6C7B] mt-1">Room 201 • 38 Enrolled Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AiAssistantPanel userRole="FACULTY" userName={session.role} />
    </div>
  );
}
