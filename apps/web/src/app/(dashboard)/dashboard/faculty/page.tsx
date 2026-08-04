'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  BellRing
} from 'lucide-react';
import Link from 'next/link';
import { RoleDashboardGuard } from '@/components/auth/RoleDashboardGuard';

export default function FacultyDashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/faculty')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 font-bold text-center text-gray-500">Loading Faculty Workspace...</div>;

  return <RoleDashboardGuard role="FACULTY">
    <div className="space-y-6 max-w-[1360px] mx-auto py-6 px-4 sm:px-6">
      <header className="bg-white rounded-2xl border border-[#DFE6F0] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 rounded-full bg-[#EDF3FF] text-[#1754E8] font-bold text-xs border border-[#1754E8]/20">
            Faculty Teaching Workspace
          </span>
          <h1 className="text-2xl font-bold text-[#101828] mt-2">
            Welcome back, {data?.facultyUser?.name ?? 'Faculty member'} 👋
          </h1>
          <p className="text-xs text-[#5F6C7B] mt-0.5">
            Review today’s classes, attendance tasks, grading work and assigned students.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/assignments"
            className="px-4 py-2 rounded-xl bg-[#1754E8] text-white font-bold text-xs hover:bg-[#1140B8] transition"
          >
            Grade Submissions ({data?.pendingGradingCount || 28})
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {data?.metrics?.map((m: any, idx: number) => (
          <div key={idx} className="bg-white p-5 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-1">
            <span className="text-xs font-semibold text-[#5F6C7B]">{m.label}</span>
            <div className="text-2xl font-bold text-[#101828]">{m.value}</div>
            <p className="text-xs text-[#1754E8] font-medium">{m.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#101828] flex items-center gap-2">
            <Calendar size={18} className="text-[#1754E8]" /> Today&apos;s Teaching Schedule
          </h2>
          <div className="space-y-3 text-xs">
            {data?.todayClasses?.map((c: any, idx: number) => (
              <div key={idx} className="p-4 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] flex items-center justify-between">
                <div>
                  <span className="font-bold text-[#101828] text-sm">{c.course}</span>
                  <p className="text-[#5F6C7B]">{c.time} • {c.room}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                  c.status === 'LIVE NOW' ? 'bg-[#D92D20] text-white' : 'bg-[#EDF3FF] text-[#1754E8]'
                }`}>
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-[#DFE6F0] shadow-sm space-y-3">
          <h2 className="text-base font-bold text-[#101828] flex items-center gap-2">
            <BellRing size={18} className="text-[#D92D20]" /> Grading & Action Items
          </h2>
          {data?.alerts?.map((a: any) => (
            <div key={a.id} className="p-3.5 rounded-xl bg-[#F6F8FC] border border-[#DFE6F0] text-xs space-y-1">
              <div className="font-bold text-[#101828]">{a.title}</div>
              <p className="text-[#5F6C7B]">{a.desc}</p>
              <Link href={a.href} className="text-[#1754E8] font-bold block pt-1">
                Open Workspace &rarr;
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  </RoleDashboardGuard>;
}
