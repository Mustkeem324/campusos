'use client';

import Link from 'next/link';
import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  FileStack,
  GraduationCap,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';

import type { AssignmentDashboardData, AssignmentDashboardItem } from '@/lib/assignment-data';

type Filter = 'ALL' | AssignmentDashboardItem['status'];

export function AssignmentsDashboard({ data }: { data: AssignmentDashboardData }) {
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('ALL');
  const isStudent = data.role === 'STUDENT';
  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return data.items.filter((item) => {
      const matchesFilter = filter === 'ALL' || item.status === filter;
      const matchesQuery = !normalized || `${item.title} ${item.description} ${item.course.code} ${item.course.title}`.toLowerCase().includes(normalized);
      return matchesFilter && matchesQuery;
    });
  }, [data.items, filter, query]);

  const stats = React.useMemo(() => {
    const dueSoon = data.items.filter((item) => item.status === 'DUE_SOON').length;
    const submitted = data.items.filter((item) => ['SUBMITTED', 'GRADED', 'LATE'].includes(item.status)).length;
    const attention = data.items.filter((item) => ['OVERDUE', 'LATE'].includes(item.status)).length;
    const received = data.items.reduce((sum, item) => sum + item.submissionCount, 0);
    return { total: data.items.length, dueSoon, submitted, attention, received };
  }, [data.items]);

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-[#0B1739] text-white shadow-[0_16px_42px_rgba(15,30,55,0.14)]">
        <div className="relative p-5 sm:p-7">
          <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full border-[36px] border-white/5" />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-[#9EB4DF]"><Sparkles className="h-3.5 w-3.5" />Academic work centre</div>
              <h1 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Assignments</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#BDCAE5]">
                {isStudent ? 'Your assignments across enrolled courses — instructions, faculty resources, deadlines, submissions and grades in one place.' : 'Publish coursework, attach reference material, monitor deadlines and review submissions across your authorised courses.'}
              </p>
            </div>
            {data.canCreate && <Link href="/assignments/new" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#0B1739] shadow-sm transition hover:bg-[#EEF3FF]"><Plus className="h-4 w-4" />Create assignment</Link>}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={BookOpen} label="Total assignments" value={stats.total} note={isStudent ? 'Across your enrolled courses' : 'In your authorised courses'} />
        <StatCard icon={Clock3} label="Due within 48h" value={stats.dueSoon} note="Needs attention soon" tone="warning" />
        <StatCard icon={CheckCircle2} label={isStudent ? 'Submitted' : 'Submissions received'} value={isStudent ? stats.submitted : stats.received} note={isStudent ? 'Includes graded and late work' : 'Across all listed assignments'} tone="success" />
        <StatCard icon={AlertTriangle} label="Late / overdue" value={stats.attention} note={isStudent ? 'May affect performance' : 'Needs follow-up'} tone="danger" />
      </section>

      <section className="rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_8px_24px_rgba(15,30,55,0.05)]">
        <div className="flex flex-col gap-3 border-b border-[#E7ECF2] p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-[#CCD7E5] bg-[#FBFCFE] px-3 focus-within:border-[#1754E8] lg:max-w-md"><Search className="h-4 w-4 text-[#7A8698]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search assignment, course or topic" className="min-w-0 flex-1 bg-transparent text-sm text-[#17223B] outline-none placeholder:text-[#98A2B3]" /></label>
          <div className="flex items-center gap-2 overflow-x-auto"><SlidersHorizontal className="hidden h-4 w-4 shrink-0 text-[#667085] sm:block" />{(['ALL', 'DUE_SOON', 'UPCOMING', 'SUBMITTED', 'GRADED', 'LATE', 'OVERDUE'] as Filter[]).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-[0.04em] ${filter === value ? 'bg-[#EAF0FF] text-[#1754E8]' : 'bg-[#F6F8FB] text-[#667085] hover:bg-[#EEF2F7]'}`}>{value === 'ALL' ? 'All' : prettyStatus(value)}</button>)}</div>
        </div>

        {filtered.length ? <div className="grid gap-3 p-4 lg:grid-cols-2 2xl:grid-cols-3">{filtered.map((item) => <AssignmentCard key={item.id} item={item} isStudent={isStudent} />)}</div> : <div className="p-12 text-center"><FileStack className="mx-auto h-10 w-10 text-[#9AA6B6]" /><h2 className="mt-3 text-sm font-black text-[#344054]">No assignments match this view</h2><p className="mt-1 text-xs text-[#7A8698]">Try another status filter or search phrase.</p></div>}
      </section>
    </div>
  );
}

function AssignmentCard({ item, isStudent }: { item: AssignmentDashboardItem; isStudent: boolean }) {
  const status = statusStyle(item.status);
  const due = deadlineText(item.dueDate);
  const urgencyPct = deadlineProgress(item.dueDate, item.status);
  return <Link href={`/assignments/${item.id}`} className="group flex min-h-[250px] flex-col rounded-2xl border border-[#E0E6EE] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#AFC3E8] hover:shadow-[0_12px_28px_rgba(15,30,55,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30">
    <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-2"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EAF0FF] text-[#1754E8]"><GraduationCap className="h-5 w-5" /></span><div className="min-w-0"><p className="truncate text-[11px] font-black uppercase tracking-[0.05em] text-[#1754E8]">{item.course.code}</p><p className="truncate text-[10px] text-[#7A8698]">{item.sectionName} · {item.termName}</p></div></div><span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.04em] ${status.className}`}>{status.label}</span></div>
    <h2 className="mt-4 line-clamp-2 text-base font-black leading-6 text-[#17223B] group-hover:text-[#1754E8]">{item.title}</h2>
    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-[#667085]">{item.description}</p>
    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px]"><div className="rounded-xl bg-[#F7F9FC] p-2.5"><p className="font-black uppercase tracking-[0.05em] text-[#98A2B3]">Deadline</p><p className="mt-1 font-black text-[#344054]">{due}</p></div><div className="rounded-xl bg-[#F7F9FC] p-2.5"><p className="font-black uppercase tracking-[0.05em] text-[#98A2B3]">Resources</p><p className="mt-1 font-black text-[#344054]">{item.resourceCount} attached</p></div></div>
    <div className="mt-3"><div className="h-1.5 overflow-hidden rounded-full bg-[#E9EEF5]"><div className={`h-full rounded-full ${item.status === 'OVERDUE' || item.status === 'LATE' ? 'bg-[#D75C4A]' : item.status === 'DUE_SOON' ? 'bg-[#D99A25]' : 'bg-[#3A73E8]'}`} style={{ width: `${urgencyPct}%` }} /></div></div>
    <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#EEF1F5] pt-3 text-[10px] text-[#667085]"><span>{item.maxMarks} marks · {isStudent ? item.submission ? item.submission.marksObtained !== null ? `${item.submission.marksObtained}/${item.maxMarks} graded` : 'Submission received' : 'No submission yet' : `${item.submissionCount} submissions`}</span><span className="inline-flex items-center gap-1 font-black text-[#1754E8]">Open <ArrowRight className="h-3.5 w-3.5" /></span></div>
  </Link>;
}

function StatCard({ icon: Icon, label, value, note, tone = 'default' }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; note: string; tone?: 'default' | 'warning' | 'success' | 'danger' }) {
  const tones = { default: 'bg-[#EAF0FF] text-[#1754E8]', warning: 'bg-[#FFF5DD] text-[#9A6500]', success: 'bg-[#E7F6F0] text-[#087A55]', danger: 'bg-[#FFF0ED] text-[#A63D31]' };
  return <div className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_5px_18px_rgba(15,30,55,0.04)]"><div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}><Icon className="h-4 w-4" /></div><p className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#17223B]">{value}</p><p className="mt-0.5 text-xs font-black text-[#344054]">{label}</p><p className="mt-1 text-[10px] text-[#8792A5]">{note}</p></div>;
}

function statusStyle(status: AssignmentDashboardItem['status']) {
  if (status === 'GRADED') return { label: 'Graded', className: 'bg-[#E7F6F0] text-[#087A55]' };
  if (status === 'SUBMITTED') return { label: 'Submitted', className: 'bg-[#EAF0FF] text-[#1754E8]' };
  if (status === 'LATE') return { label: 'Late', className: 'bg-[#FFF0ED] text-[#A63D31]' };
  if (status === 'OVERDUE') return { label: 'Overdue', className: 'bg-[#FBE9E6] text-[#A63D31]' };
  if (status === 'DUE_SOON') return { label: 'Due soon', className: 'bg-[#FFF5DD] text-[#946000]' };
  return { label: 'Upcoming', className: 'bg-[#EEF2F7] text-[#667085]' };
}

function prettyStatus(value: string) { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function deadlineText(value: string) { const due = new Date(value); const ms = due.getTime() - Date.now(); if (ms <= 0) return `Passed ${relativeDuration(-ms)} ago`; if (ms < 24 * 60 * 60 * 1000) return `${relativeDuration(ms)} left`; return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }).format(due); }
function relativeDuration(ms: number) { const minutes = Math.max(1, Math.round(ms / 60000)); if (minutes < 60) return `${minutes}m`; const hours = Math.round(minutes / 60); if (hours < 48) return `${hours}h`; return `${Math.round(hours / 24)}d`; }
function deadlineProgress(value: string, status: AssignmentDashboardItem['status']) { if (status === 'GRADED' || status === 'SUBMITTED') return 100; if (status === 'OVERDUE' || status === 'LATE') return 100; const remaining = new Date(value).getTime() - Date.now(); const horizon = 7 * 24 * 60 * 60 * 1000; return Math.max(8, Math.min(100, Math.round((1 - remaining / horizon) * 100))); }
