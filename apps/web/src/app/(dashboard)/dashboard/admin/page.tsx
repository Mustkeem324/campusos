'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  GraduationCap, 
  DollarSign, 
  Activity, 
  BellRing, 
  ShieldCheck, 
  Brain,
  Scale
} from 'lucide-react';
import Link from 'next/link';
import { RoleDashboardGuard } from '@/components/auth/RoleDashboardGuard';

export default function AdminDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/admin')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 font-bold text-center text-gray-500">Loading Admin Dashboard...</div>;

  return <RoleDashboardGuard role={['INSTITUTION_ADMIN', 'SUPER_ADMIN']}>
    <div className="space-y-6 max-w-[1360px] mx-auto py-6 px-4 sm:px-6">
      <header className="bg-white rounded-2xl border border-[#DFE6F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EDF3FF] text-[#1754E8] font-bold text-xs border border-[#1754E8]/20">
            Institution Administration Portal
          </span>
          <h1 className="text-2xl font-bold text-[#101828] mt-2">
            Welcome back, {data?.adminUser?.name ?? 'Administrator'} 👋
          </h1>
          <p className="text-xs text-[#5F6C7B] mt-0.5">
            Review institution operations, pending approvals and performance across CampusOS Demo University.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/platform/admissions"
            className="px-4 py-2 rounded-xl bg-[#1754E8] text-white font-bold text-xs hover:bg-[#1140B8] transition"
          >
            Review Admissions ({data?.pendingAdmissionsCount || 12})
          </Link>
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
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#101828]">Institutional Operations</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <Link href="/platform/admissions" className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] hover:bg-[#EDF3FF] font-bold text-[#101828] flex items-center gap-2">
              <GraduationCap size={16} className="text-[#1754E8]" /> Admissions Hub
            </Link>
            <Link href="/departments" className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] hover:bg-[#EDF3FF] font-bold text-[#101828] flex items-center gap-2">
              <Building2 size={16} className="text-[#1754E8]" /> Departments
            </Link>
            <Link href="/ai-governance" className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] hover:bg-[#EDF3FF] font-bold text-[#101828] flex items-center gap-2">
              <Brain size={16} className="text-[#1754E8]" /> AI Governance
            </Link>
            <Link href="/legal-risk" className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] hover:bg-[#EDF3FF] font-bold text-[#101828] flex items-center gap-2">
              <Scale size={16} className="text-[#1754E8]" /> Legal & Risk
            </Link>
            <Link href="/audit" className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] hover:bg-[#EDF3FF] font-bold text-[#101828] flex items-center gap-2">
              <Activity size={16} className="text-[#1754E8]" /> Audit Logs
            </Link>
            <Link href="/settings" className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] hover:bg-[#EDF3FF] font-bold text-[#101828] flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1754E8]" /> Security Settings
            </Link>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-3">
          <h2 className="text-base font-bold text-[#101828]">Pending Actions</h2>
          {data?.alerts?.map((a: any) => (
            <div key={a.id} className="p-3 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] text-xs space-y-1">
              <div className="font-bold text-[#101828]">{a.title}</div>
              <p className="text-[#5F6C7B]">{a.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  </RoleDashboardGuard>;
}
