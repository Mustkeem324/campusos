import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { HeartPulse, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';

export default async function StudentSuccessPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const cases = await prisma.studentSuccessCase.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Student Success & Intervention Command Centre</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Permission-scoped intervention management for attendance shortages, academic review cases, and advisor outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#EDF3FF] text-[#1754E8] text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#078A57]" />
            <span>FERPA & DPDP Confidential Scoping</span>
          </span>
        </div>
      </div>

      {/* Case Table */}
      <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DFE6F0] bg-[#F6F8FC] flex justify-between items-center">
          <h2 className="text-base font-bold text-[#101A32]">Active Intervention Cases ({cases.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DFE6F0] bg-[#F6F8FC] text-xs font-semibold text-[#5F6C7B] uppercase tracking-wider">
                <th className="p-3.5">Student</th>
                <th className="p-3.5">Roll Number</th>
                <th className="p-3.5">Risk Category</th>
                <th className="p-3.5">Risk Level</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6F0]">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-[#F6F8FC] transition-colors">
                  <td className="p-3.5 font-bold text-[#101828]">{c.studentName}</td>
                  <td className="p-3.5 font-mono text-xs text-[#5F6C7B]">{c.studentRollNumber}</td>
                  <td className="p-3.5 text-[#5F6C7B]">{c.riskCategory}</td>
                  <td className="p-3.5">
                    <span className="bg-[#FEF3F2] text-[#D92D20] text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1 w-fit">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {c.riskLevel}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-[#EDF3FF] text-[#1754E8] text-xs font-bold px-2 py-0.5 rounded">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-[#5F6C7B] max-w-xs truncate">{c.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
