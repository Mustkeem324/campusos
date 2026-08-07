'use client';

import Link from 'next/link';
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  GraduationCap,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import type { AttendanceAdminData, AttendanceSettings, AttendanceStudyMode, CalendarDayType } from '@/lib/smart-attendance-types';

type ProgramScope = { id: string; name: string; batches: Array<{ id: string; name: string; sections: Array<{ id: string; name: string }> }> };

export function AttendanceAdminConsole({ initialData, programs }: { initialData: AttendanceAdminData; programs: ProgramScope[] }) {
  const [data, setData] = useState(initialData);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [modeFilter, setModeFilter] = useState('ALL');
  const [calendarDate, setCalendarDate] = useState('');
  const [dayType, setDayType] = useState<CalendarDayType>('HOLIDAY');
  const [calendarTitle, setCalendarTitle] = useState('');
  const [scope, setScope] = useState('INSTITUTION');

  const action = async (payload: Record<string, unknown>) => {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch('/api/attendance/actions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Attendance action failed.');
      setMessage('Saved successfully.');
      return body.result;
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Attendance action failed.'}`);
      return null;
    } finally { setBusy(false); }
  };

  const saveSettings = async (patch: Partial<AttendanceSettings>) => {
    const result = await action({ action: 'settings', ...patch });
    if (result) setData((current) => ({ ...current, settings: result }));
  };

  const filtered = useMemo(() => data.students.filter((student) => {
    const matchesMode = modeFilter === 'ALL' || student.studyMode === modeFilter;
    const needle = query.trim().toLowerCase();
    return matchesMode && (!needle || `${student.name} ${student.rollNumber} ${student.programName} ${student.batchName}`.toLowerCase().includes(needle));
  }), [data.students, modeFilter, query]);

  const scopeOptions = useMemo(() => {
    const options = [{ value: 'INSTITUTION', label: 'Institution-wide' }];
    for (const program of programs) {
      options.push({ value: `PROGRAM:${program.id}`, label: `Program · ${program.name}` });
      for (const batch of program.batches) {
        options.push({ value: `BATCH:${batch.id}`, label: `Batch · ${program.name} / ${batch.name}` });
        for (const section of batch.sections) options.push({ value: `SECTION:${section.id}`, label: `Section · ${program.name} / ${batch.name} / ${section.name}` });
      }
    }
    return options;
  }, [programs]);

  return <div className="space-y-5">
    <section className="rounded-2xl border border-[#D9E3F0] bg-[#101D38] p-5 text-white shadow-[0_8px_28px_rgba(16,29,56,0.12)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1754E8]"><CalendarDays className="h-5 w-5" /></span><div><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#9FB5D2]">Institution control</p><h1 className="mt-1 text-xl font-extrabold tracking-tight">Attendance Calendar & Policy</h1><p className="mt-1 max-w-3xl text-xs leading-5 text-[#BAC9DE]">Manage attendance threshold, delivery-mode rules, institute holidays, special working days and student Online/Offline/Hybrid classification. Timetable remains the source of class schedule truth.</p></div></div><div className="flex flex-wrap gap-2"><Link href="/timetable" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 text-xs font-extrabold">Open timetable <ArrowRight className="h-3.5 w-3.5" /></Link><Link href="/attendance" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-extrabold text-[#101D38]">Open attendance <ArrowRight className="h-3.5 w-3.5" /></Link></div></div>
    </section>

    {message && <div className={`rounded-xl border p-3 text-xs font-semibold ${message.startsWith('Error:') ? 'border-rose-200 bg-rose-50 text-rose-800' : 'border-emerald-200 bg-emerald-50 text-emerald-800'}`}>{message}</div>}

    {data.metrics && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6"><Metric label="Students" value={data.metrics.enrolledStudents} icon={UsersRound} /><Metric label="Classified" value={data.metrics.classifiedStudents} icon={Check} /><Metric label="Online" value={data.metrics.onlineStudents} icon={GraduationCap} /><Metric label="Offline" value={data.metrics.offlineStudents} icon={UsersRound} /><Metric label="Hybrid" value={data.metrics.hybridStudents} icon={ShieldCheck} /><Metric label={`Below ${data.settings.requiredPercentage}%`} value={data.metrics.belowThreshold} icon={AlertTriangle} /></div>}

    <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
      <div className="flex items-center gap-2"><Settings2 className="h-5 w-5 text-[#1754E8]" /><div><h2 className="font-extrabold text-[#101D38]">Attendance policy</h2><p className="mt-0.5 text-xs text-[#667085]">The threshold applies to submitted class registers only; holidays and cancelled classes are excluded.</p></div></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Minimum attendance %"><input type="number" min="0" max="100" defaultValue={data.settings.requiredPercentage} onBlur={(event) => { const value = Number(event.target.value); if (Number.isFinite(value) && value !== data.settings.requiredPercentage) void saveSettings({ requiredPercentage: value }); }} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm" /></Field>
        <Field label="Institution timezone"><input defaultValue={data.settings.timezone} onBlur={(event) => { const value = event.target.value.trim(); if (value && value !== data.settings.timezone) void saveSettings({ timezone: value }); }} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm" /></Field>
        <Field label="Early check-in window"><select value={data.settings.checkinEarlyMinutes} onChange={(event) => void saveSettings({ checkinEarlyMinutes: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value={5}>5 minutes</option><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={30}>30 minutes</option></select></Field>
        <Field label="Late check-in window"><select value={data.settings.checkinLateMinutes} onChange={(event) => void saveSettings({ checkinLateMinutes: Number(event.target.value) })} className="min-h-11 w-full rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value={10}>10 minutes</option><option value={15}>15 minutes</option><option value={20}>20 minutes</option><option value={30}>30 minutes</option></select></Field>
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><Toggle label="Offline self attendance" detail="Allow one Face ID daily check-in; faculty manual attendance still remains available." checked={data.settings.allowOfflineSelfCheckIn} onChange={(allowOfflineSelfCheckIn) => void saveSettings({ allowOfflineSelfCheckIn })} /><Toggle label="Hybrid daily check-in" detail="When enabled, Hybrid students use the one-time daily attendance flow." checked={data.settings.allowHybridDailyCheckIn} onChange={(allowHybridDailyCheckIn) => void saveSettings({ allowHybridDailyCheckIn })} /><Toggle label="Checkout tracking" detail="Record when a student completes their class/day attendance." checked={data.settings.checkoutEnabled} onChange={(checkoutEnabled) => void saveSettings({ checkoutEnabled })} /><Toggle label="Online Face ID" detail="Online timetable attendance requires biometric verification for every class." checked={data.settings.requireOnlineFace} onChange={(requireOnlineFace) => void saveSettings({ requireOnlineFace })} /></div>
    </section>

    <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[#1754E8]" /><div><h2 className="font-extrabold text-[#101D38]">Academic attendance calendar</h2><p className="mt-0.5 text-xs text-[#667085]">Add holidays, institute closures, exams, events or special working days for the whole institution or a specific program/batch/section.</p></div></div>
      <div className="mt-4 grid gap-2 lg:grid-cols-[150px_180px_minmax(180px,1fr)_minmax(220px,1.4fr)_110px]"><input type="date" value={calendarDate} onChange={(event) => setCalendarDate(event.target.value)} className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><select value={dayType} onChange={(event) => setDayType(event.target.value as CalendarDayType)} className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value="HOLIDAY">Holiday</option><option value="INSTITUTION_CLOSED">Institution closed</option><option value="SPECIAL_WORKING">Special working</option><option value="EXAM">Exam day</option><option value="EVENT">Event</option><option value="WORKING">Working day</option></select><input value={calendarTitle} onChange={(event) => setCalendarTitle(event.target.value)} placeholder="Calendar title" className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><select value={scope} onChange={(event) => setScope(event.target.value)} className="min-h-11 rounded-xl border border-[#D5DEEA] px-3 text-sm">{scopeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select><button disabled={busy || !calendarDate || calendarTitle.trim().length < 2} onClick={async () => { const [kind, id] = scope.split(':'); const payload: Record<string, unknown> = { action: 'calendar', calendarDate, dayType, title: calendarTitle }; if (id && kind === 'PROGRAM') payload.programId = id; if (id && kind === 'BATCH') payload.batchId = id; if (id && kind === 'SECTION') payload.sectionId = id; const result = await action(payload); if (result) window.location.reload(); }} className="min-h-11 rounded-xl bg-[#1754E8] px-4 text-xs font-extrabold text-white disabled:opacity-45">Add day</button></div>
      <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{data.calendar.map((entry) => <div key={entry.id} className="rounded-xl border border-[#E1E7EF] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-xs font-extrabold text-[#24324A]">{entry.title}</p><p className="mt-1 text-[10px] text-[#7A8799]">{entry.calendarDate} · {entry.scopeLabel}</p></div><span className="rounded-full bg-[#F2F4F7] px-2 py-1 text-[9px] font-extrabold text-[#475467]">{entry.dayType.replace(/_/g, ' ')}</span></div></div>)}</div>
    </section>

    <section className="rounded-2xl border border-[#D9E3F0] bg-white p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"><div><h2 className="font-extrabold text-[#101D38]">Student delivery-mode classification</h2><p className="mt-1 text-xs text-[#667085]">Online = Face ID every class. Offline = faculty manual by default, optional one daily Face ID. Hybrid follows institution policy.</p></div><div className="flex gap-2"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search student/program" className="min-h-10 rounded-xl border border-[#D5DEEA] px-3 text-sm" /><select value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} className="min-h-10 rounded-xl border border-[#D5DEEA] px-3 text-sm"><option value="ALL">All modes</option><option value="UNCLASSIFIED">Unclassified</option><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option><option value="HYBRID">Hybrid</option></select></div></div>
      <div className="mt-4 space-y-2">{filtered.slice(0,120).map((student) => <StudentModeEditor key={student.studentId} student={student} busy={busy} action={action} />)}</div>
    </section>
  </div>;
}

function StudentModeEditor({ student, busy, action }: { student: AttendanceAdminData['students'][number]; busy: boolean; action: (payload: Record<string, unknown>) => Promise<unknown> }) {
  const [mode, setMode] = useState<AttendanceStudyMode>(student.studyMode === 'UNCLASSIFIED' ? 'OFFLINE' : student.studyMode);
  const [saved, setSaved] = useState(false);
  return <div className="grid gap-3 rounded-xl border border-[#E1E7EF] p-3 md:grid-cols-[minmax(220px,1fr)_150px_90px] md:items-center"><div><p className="text-xs font-extrabold text-[#24324A]">{student.name}</p><p className="mt-1 text-[10px] text-[#7A8799]">{student.rollNumber} · {student.programName} · {student.batchName}{student.sectionName ? ` · ${student.sectionName}` : ''}</p></div><select value={mode} onChange={(event) => { setMode(event.target.value as AttendanceStudyMode); setSaved(false); }} className="min-h-10 rounded-lg border border-[#D5DEEA] px-2 text-xs"><option value="ONLINE">Online</option><option value="OFFLINE">Offline</option><option value="HYBRID">Hybrid</option></select><button disabled={busy} onClick={async () => { const result = await action({ action: 'student-mode', studentId: student.studentId, studyMode: mode, selfCheckInEnabled: true }); if (result) setSaved(true); }} className={`min-h-10 rounded-lg px-3 text-xs font-extrabold ${saved ? 'bg-emerald-50 text-emerald-700' : 'bg-[#1754E8] text-white'}`}>{saved ? 'Saved' : 'Save'}</button></div>;
}
function Toggle({ label, detail, checked, onChange }: { label: string; detail: string; checked: boolean; onChange: (checked: boolean) => void }) { return <button type="button" onClick={() => onChange(!checked)} className={`rounded-xl border p-4 text-left ${checked ? 'border-[#BCD0F2] bg-[#F2F6FF]' : 'border-[#E1E7EF]'}`}><div className="flex items-center justify-between gap-3"><p className="text-sm font-extrabold text-[#24324A]">{label}</p><span className={`relative h-6 w-11 rounded-full ${checked ? 'bg-[#1754E8]' : 'bg-[#CBD5E1]'}`}><span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${checked ? 'left-6' : 'left-1'}`} /></span></div><p className="mt-2 text-[11px] leading-5 text-[#667085]">{detail}</p></button>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#7A8799]">{label}</span>{children}</label>; }
function Metric({ label, value, icon: Icon }: { label: string; value: number | string; icon: React.ElementType }) { return <div className="rounded-xl border border-[#D9E3F0] bg-white p-4"><div className="flex items-center justify-between"><p className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#7A8799]">{label}</p><Icon className="h-4 w-4 text-[#1754E8]" /></div><p className="mt-3 text-lg font-extrabold text-[#101D38]">{value}</p></div>; }
