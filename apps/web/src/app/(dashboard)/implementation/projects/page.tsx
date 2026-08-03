import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Rocket, ShieldCheck, CheckCircle2, Calendar } from 'lucide-react';

export default async function ImplementationProjectsPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const projects = await prisma.implementationProject.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Rocket className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Implementation & Adoption Control Tower</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Enterprise rollout milestones, data migration validation, UAT approval gates, and go-live readiness checklists.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#078A57] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Structured 6-Stage Rollout</span>
          </span>
        </div>
      </div>

      {/* Project Cards */}
      <div className="space-y-6">
        {projects.map((proj) => (
          <div key={proj.id} className="bg-white border border-[#DFE6F0] rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-[#1754E8] bg-[#EDF3FF] px-2 py-0.5 rounded">
                  Current Stage: {proj.currentStage}
                </span>
                <h3 className="font-bold text-lg text-[#101828] mt-2">{proj.projectName}</h3>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-[#1754E8]">{proj.overallProgressPct}%</span>
                <div className="text-xs text-[#5F6C7B]">Overall Readiness</div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#F6F8FC] border border-[#DFE6F0] rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#1754E8] h-full rounded-full transition-all duration-500"
                style={{ width: `${proj.overallProgressPct}%` }}
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-[#5F6C7B] pt-2 border-t border-[#DFE6F0]">
              <Calendar className="w-4 h-4 text-[#1754E8]" />
              <span>Target Go-Live Date: {new Date(proj.targetGoLiveDate).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
