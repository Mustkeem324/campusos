import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { LifeBuoy, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export default async function SupportCasesPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const cases = await prisma.supportCase.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <LifeBuoy className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Enterprise Support & SLA Management</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Institutional support cases, technical SLA tracking, root cause analysis, and customer success management.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#078A57] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>24/7 Enterprise SLA Active</span>
          </span>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-white border border-[#DFE6F0] rounded-xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-[#DFE6F0] bg-[#F6F8FC] flex justify-between items-center">
          <h2 className="text-base font-bold text-[#101A32]">Active Institutional Support Cases ({cases.length})</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-[#DFE6F0] bg-[#F6F8FC] text-xs font-semibold text-[#5F6C7B] uppercase tracking-wider">
                <th className="p-3.5">Case #</th>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Priority</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE6F0]">
              {cases.map((c) => (
                <tr key={c.id} className="hover:bg-[#F6F8FC] transition-colors">
                  <td className="p-3.5 font-mono text-xs font-bold text-[#1754E8]">{c.caseNumber}</td>
                  <td className="p-3.5 font-medium text-[#101828]">{c.title}</td>
                  <td className="p-3.5 text-[#5F6C7B]">{c.category}</td>
                  <td className="p-3.5">
                    <span className="bg-[#FEF3F2] text-[#D92D20] text-xs font-bold px-2 py-0.5 rounded">
                      {c.priority}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="bg-[#EDF3FF] text-[#1754E8] text-xs font-bold px-2 py-0.5 rounded">
                      {c.status}
                    </span>
                  </td>
                  <td className="p-3.5 text-xs text-[#5F6C7B]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
