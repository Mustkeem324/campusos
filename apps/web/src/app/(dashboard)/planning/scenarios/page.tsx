import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Sliders, TrendingUp, Users, DollarSign, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default async function PlanningScenariosPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const scenarios = await prisma.planningScenario.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">University Digital Twin & Scenario Planning</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Simulate student enrollment growth, faculty workload ratios, hostel bed demand, and financial projections without modifying operational database records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#EDF3FF] border border-[#CAD4E2] text-[#1754E8] text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#078A57]" />
            <span>Simulation Sandbox • Operational Records Protected</span>
          </span>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scenarios.map((sc) => (
          <div key={sc.id} className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#1754E8] bg-[#EDF3FF] px-2 py-0.5 rounded">
                  Baseline: {sc.baselineYear}
                </span>
                <span className="text-xs font-bold text-[#078A57] bg-[#E6F4ED] px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {sc.status}
                </span>
              </div>
              <h3 className="font-bold text-base text-[#101828]">{sc.title}</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#DFE6F0] text-xs">
              <div className="bg-[#F6F8FC] p-2.5 rounded-lg border border-[#DFE6F0]">
                <div className="text-[#5F6C7B] flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-[#1754E8]" />
                  Target Students
                </div>
                <div className="font-bold text-sm text-[#101828] mt-1">{sc.targetEnrollment.toLocaleString()}</div>
              </div>
              <div className="bg-[#F6F8FC] p-2.5 rounded-lg border border-[#DFE6F0]">
                <div className="text-[#5F6C7B] flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-[#078A57]" />
                  Est. Revenue
                </div>
                <div className="font-bold text-sm text-[#101828] mt-1">₹{(sc.projectedRevenueInr / 10000000).toFixed(1)} Cr</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
