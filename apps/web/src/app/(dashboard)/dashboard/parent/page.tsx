'use client';

import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  BellRing
} from 'lucide-react';
import Link from 'next/link';
import { RoleDashboardGuard } from '@/components/auth/RoleDashboardGuard';

export default function ParentDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/parent')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 font-bold text-center text-gray-500">Loading Parent Portal...</div>;

  return <RoleDashboardGuard role="PARENT">
    <div className="space-y-6 max-w-[1360px] mx-auto py-6 px-4 sm:px-6">
      <header className="bg-white rounded-2xl border border-[#DFE6F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EDF3FF] text-[#1754E8] font-bold text-xs border border-[#1754E8]/20">
            Parent & Guardian Portal
          </span>
          <h1 className="text-2xl font-bold text-[#101828] mt-2">
            Signed in as: {data?.parentUser?.name ?? 'Parent or guardian'} 👋
          </h1>
          <p className="text-xs text-[#5F6C7B] mt-0.5">
            Review authorized academic and financial information for your linked student.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1754E8] text-white font-bold flex items-center justify-center text-sm">
            RV
          </div>
          <div className="text-xs">
            <span className="text-[#5F6C7B] block font-medium">Linked Student</span>
            <h3 className="font-bold text-[#101828] text-sm">{data?.linkedStudent?.name ?? 'No linked student'}</h3>
            <p className="text-[11px] text-[#078A57] font-semibold">{data?.linkedStudent?.relationship}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.metrics?.map((m: any, idx: number) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#5F6C7B]">{m.label}</span>
            <div className="text-2xl font-bold text-[#101828]">{m.value}</div>
            <p className="text-xs text-[#078A57] font-medium">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#101828] flex items-center gap-2">
            <GraduationCap size={18} className="text-[#1754E8]" /> Ward Academic Overview
          </h2>
          <div className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] space-y-3 text-xs">
            <div className="flex justify-between items-center border-b border-[#DFE6F0] pb-2">
              <span className="text-[#5F6C7B] font-medium">Programme</span>
              <strong className="text-[#101828]">{data?.linkedStudent?.programme}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-[#DFE6F0] pb-2">
              <span className="text-[#5F6C7B] font-medium">Current Semester</span>
              <strong className="text-[#101828]">{data?.linkedStudent?.semester}</strong>
            </div>
            <div className="flex justify-between items-center border-b border-[#DFE6F0] pb-2">
              <span className="text-[#5F6C7B] font-medium">Roll Number</span>
              <strong className="font-mono text-[#101828]">{data?.linkedStudent?.rollNumber}</strong>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5F6C7B] font-medium">Examination Eligibility</span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#078A57]/10 text-[#078A57] font-bold text-[10px] border border-[#078A57]/20">
                VERIFIED ELIGIBLE (&gt;75%)
              </span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-3">
          <h2 className="text-base font-bold text-[#101828] flex items-center gap-2">
            <BellRing size={18} className="text-[#1754E8]" /> Official Parent Notices
          </h2>
          {data?.notices?.map((n: any, idx: number) => (
            <div key={idx} className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] text-xs space-y-1">
              <div className="font-bold text-[#101828]">{n.title}</div>
              <p className="text-[#5F6C7B]">{n.details}</p>
              <span className="text-[10px] text-[#7C889A] font-mono block pt-1">{n.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </RoleDashboardGuard>;
}
