'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
import { ArrowRight, MessageCircle, ShieldCheck, UsersRound } from 'lucide-react';

import { useAuthStore } from '@/lib/auth-store';

type CommunitySummary = { id: string; unreadCount: number };

export function AcademicCommunityDashboardBanner() {
  const pathname = usePathname();
  const { currentSession } = useAuthStore();
  const [communities, setCommunities] = React.useState<CommunitySummary[]>([]);
  const [ready, setReady] = React.useState(false);
  const role = currentSession?.role;
  const eligible = role === 'STUDENT' || role === 'FACULTY' || role === 'HOD' || role === 'DEAN' || role === 'INSTITUTION_ADMIN';

  React.useEffect(() => {
    if (!eligible || pathname.startsWith('/community/chat')) return;
    let active = true;
    void fetch('/api/community/chat/communities', { cache: 'no-store' })
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as { communities?: unknown }).communities)) return;
        if (active) setCommunities((payload as { communities: CommunitySummary[] }).communities);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, [eligible, pathname]);

  if (!eligible || pathname.startsWith('/community/chat')) return null;
  const unread = communities.reduce((total, item) => total + Math.max(0, item.unreadCount || 0), 0);

  return (
    <Link href="/community/chat" className="group mb-5 flex min-h-[76px] items-center justify-between gap-4 rounded-[14px] border border-[#C9D8EE] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(16,29,56,0.05)] transition hover:border-[#9EB8E2] hover:shadow-[0_12px_30px_rgba(16,29,56,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] sm:px-5">
      <span className="flex min-w-0 items-center gap-3">
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#EAF0FF] text-[#1754E8]">
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && <span className="absolute -right-1.5 -top-1.5 min-w-5 rounded-full border-2 border-white bg-[#1754E8] px-1 text-center text-[9px] font-black leading-4 text-white">{unread > 99 ? '99+' : unread}</span>}
        </span>
        <span className="min-w-0">
          <span className="flex flex-wrap items-center gap-2"><span className="text-sm font-extrabold text-[#101D38]">Academic Communities</span><span className="inline-flex items-center gap-1 rounded-md bg-[#EDF8F3] px-2 py-1 text-[9px] font-extrabold uppercase tracking-[0.07em] text-[#087A55]"><ShieldCheck className="h-3 w-3" />Verified membership</span></span>
          <span className="mt-1 block truncate text-xs text-[#667085]">Branch, batch, section and course conversations authorised from CampusOS academic records.</span>
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-4 sm:flex">
        <span className="text-right"><span className="block text-sm font-extrabold tabular-nums text-[#26344D]">{ready ? communities.length : '—'}</span><span className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#8A95A6]">Your groups</span></span>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D8E2EF] text-[#667085] transition group-hover:border-[#AFC4E5] group-hover:text-[#1754E8]"><ArrowRight className="h-4 w-4" /></span>
      </span>
      <UsersRound className="h-5 w-5 shrink-0 text-[#1754E8] sm:hidden" aria-hidden="true" />
    </Link>
  );
}
