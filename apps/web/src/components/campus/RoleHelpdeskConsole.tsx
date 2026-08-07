'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Clock3,
  Headphones,
  Inbox,
  MessageSquareText,
  Search,
  Send,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from 'lucide-react';

import { helpdeskRoleLabel } from '@/lib/helpdesk-policy';
import type {
  CompanySupportTicket,
  HelpdeskCategory,
  HelpdeskPriority,
  HelpdeskTicket,
  HelpdeskWorkspaceData,
} from '@/lib/helpdesk-types';

export function RoleHelpdeskConsole({ data }: { data: HelpdeskWorkspaceData }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(data.tickets[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'ACTIVE' | 'MY_QUEUE' | 'RESOLVED' | 'ALL'>('ACTIVE');
  const [createOpen, setCreateOpen] = useState(data.tickets.length === 0);
  const [form, setForm] = useState({ category: 'ACADEMIC' as HelpdeskCategory, subject: '', description: '', priority: 'NORMAL' as HelpdeskPriority, relatedStudentId: data.relatedStudents[0]?.id ?? '' });
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState(false);
  const [escalateRole, setEscalateRole] = useState('');
  const [escalateReason, setEscalateReason] = useState('');
  const [platformOpen, setPlatformOpen] = useState(false);
  const [platformForm, setPlatformForm] = useState({ category: 'Platform / technical', subject: '', description: '', priority: 'NORMAL' as HelpdeskPriority });
  const [platformSelectedId, setPlatformSelectedId] = useState(data.platformTickets[0]?.id ?? '');
  const [platformReply, setPlatformReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tickets.filter((ticket) => {
      const stateMatch = view === 'ALL'
        || (view === 'ACTIVE' && !['RESOLVED','CLOSED'].includes(ticket.status))
        || (view === 'RESOLVED' && ['RESOLVED','CLOSED'].includes(ticket.status))
        || (view === 'MY_QUEUE' && ticket.canHandle && !['RESOLVED','CLOSED'].includes(ticket.status));
      const searchMatch = !q || [ticket.caseNumber, ticket.subject, ticket.requesterName, ticket.departmentName, ticket.relatedStudentName, ticket.category]
        .some((value) => value?.toLowerCase().includes(q));
      return stateMatch && searchMatch;
    });
  }, [data.tickets, query, view]);

  const selected = data.tickets.find((ticket) => ticket.id === selectedId) ?? filtered[0] ?? null;
  const selectedPlatform = data.platformTickets.find((ticket) => ticket.id === platformSelectedId) ?? data.platformTickets[0] ?? null;

  async function request(url: string, method: 'POST' | 'PATCH', body?: unknown) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const payload = await response.json().catch(() => null) as { error?: string; ticket?: { id?: string } } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to complete this helpdesk action.');
      if (payload?.ticket?.id) setSelectedId(payload.ticket.id);
      setReply(''); setEscalateReason(''); setInternalNote(false); setPlatformReply('');
      router.refresh();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to complete this helpdesk action.');
      return false;
    } finally { setBusy(false); }
  }

  async function createCase(event: React.FormEvent) {
    event.preventDefault();
    const ok = await request('/api/helpdesk/tickets', 'POST', {
      ...form,
      relatedStudentId: form.relatedStudentId || null,
    });
    if (ok) {
      setForm((value) => ({ ...value, subject: '', description: '' }));
      setCreateOpen(false);
    }
  }

  async function createPlatformCase(event: React.FormEvent) {
    event.preventDefault();
    const ok = await request('/api/helpdesk/platform', 'POST', platformForm);
    if (ok) {
      setPlatformForm((value) => ({ ...value, subject: '', description: '' }));
      setPlatformOpen(false);
    }
  }

  if (!data.storeReady) {
    return <section className="rounded-[28px] border border-amber-200 bg-amber-50 p-8 text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100"><AlertTriangle className="h-8 w-8" /><h1 className="mt-5 text-2xl font-extrabold">Helpdesk storage is not provisioned</h1><p className="mt-3 max-w-3xl text-sm leading-7">Run the standard CampusOS database preparation step. The helpdesk uses the verified institution and role from the active server session and does not operate from browser-selected identities.</p></section>;
  }

  return (
    <section className="min-w-0 space-y-5 sm:space-y-6" aria-label="CampusOS role-aware helpdesk">
      <header className="overflow-hidden rounded-[28px] border border-[#D8E2EF] bg-white shadow-[0_18px_54px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid xl:grid-cols-[minmax(0,1.45fr)_minmax(360px,0.55fr)]">
          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#C9D8EE] bg-[#EDF3FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"><ShieldCheck className="h-3.5 w-3.5" /> Verified {data.roleLabel} workspace</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-[#D8E2EF] bg-white px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#516078] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><Building2 className="h-3.5 w-3.5" /> {data.institutionName}</span>
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] dark:text-white sm:text-4xl">Helpdesk & escalation center</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[#667085] dark:text-slate-400">Raise the problem, not the authority. CampusOS routes each case to the correct operational queue and only authorised handlers can move serious issues upward.</p>
            <div className="mt-5 flex flex-wrap gap-2"><button onClick={() => setCreateOpen((value) => !value)} className={primaryBtn}><MessageSquareText className="h-4 w-4" /> Raise a case</button>{data.canCreatePlatformSupport && <button onClick={() => setPlatformOpen((value) => !value)} className={secondaryBtn}><Headphones className="h-4 w-4" /> Contact CampusOS support</button>}</div>
          </div>
          <aside className="border-t border-[#284467] bg-[#101D38] p-5 text-white sm:p-7 xl:border-l xl:border-t-0 xl:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9EBBEE]">Live service desk</p>
            <div className="mt-4 grid grid-cols-2 gap-3"><DarkMetric label="My queue" value={data.metrics.myQueue} /><DarkMetric label="Open" value={data.metrics.openTickets} /><DarkMetric label="SLA breached" value={data.metrics.slaBreached} alert={data.metrics.slaBreached > 0} /><DarkMetric label="Resolved" value={data.metrics.resolvedTickets} /></div>
            <div className="mt-5 rounded-2xl border border-[#365474] bg-[#152A48] p-4"><p className="text-xs font-extrabold">Escalation protection</p><p className="mt-2 text-[11px] leading-5 text-[#B9CAE1]">Students and parents cannot message Dean/HOD accounts directly. Senior queues receive only policy-authorised escalations.</p></div>
          </aside>
        </div>
      </header>

      {createOpen && <form onSubmit={createCase} className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] dark:border-slate-800 dark:bg-slate-950 sm:p-6"><SectionTitle eyebrow="New campus case" title="Tell CampusOS what is wrong" description="Your category determines the first responsible queue. You cannot manually choose Dean/HOD or another senior authority." /><div className="mt-5 grid gap-4 lg:grid-cols-4"><Field label="Problem category"><select value={form.category} onChange={(e) => setForm((value) => ({ ...value, category: e.target.value as HelpdeskCategory }))} className={inputClass}>{data.categories.map((category) => <option key={category.value} value={category.value}>{category.label}</option>)}</select></Field><Field label="Priority"><select value={form.priority} onChange={(e) => setForm((value) => ({ ...value, priority: e.target.value as HelpdeskPriority }))} className={inputClass}><option value="LOW">Low</option><option value="NORMAL">Normal</option><option value="HIGH">High</option><option value="URGENT">Urgent</option></select></Field>{data.relatedStudents.length > 0 && <Field label={data.role === 'PARENT' ? 'Related student' : 'Student record'}><select value={form.relatedStudentId} onChange={(e) => setForm((value) => ({ ...value, relatedStudentId: e.target.value }))} className={inputClass}><option value="">No student selected</option>{data.relatedStudents.map((student) => <option key={student.id} value={student.id}>{student.name} · {student.rollNumber}</option>)}</select></Field>}<Field label="Subject"><input required value={form.subject} onChange={(e) => setForm((value) => ({ ...value, subject: e.target.value }))} placeholder="Short summary" className={inputClass} /></Field></div><Field label="What happened?"><textarea required rows={5} value={form.description} onChange={(e) => setForm((value) => ({ ...value, description: e.target.value }))} placeholder="Include the relevant facts, dates, course/exam/service context and the outcome you need." className={`${inputClass} mt-2 resize-y py-3`} /></Field><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-[#667085] dark:text-slate-400">Initial queue: <strong>{helpdeskRoleLabel(routePreview(data.role, form.category))}</strong></p><button disabled={busy} className={primaryBtn}><Send className="h-4 w-4" /> {busy ? 'Submitting…' : 'Submit case'}</button></div></form>}

      {data.canCreatePlatformSupport && platformOpen && <form onSubmit={createPlatformCase} className="rounded-[24px] border border-[#BFD0EC] bg-[#F4F8FF] p-5 dark:border-blue-900 dark:bg-blue-950/15 sm:p-6"><SectionTitle eyebrow="Institution → CampusOS" title="Company platform support" description="For institution-level CampusOS product, integration, data migration, security or service issues. Student/faculty case content is not copied into this channel." /><div className="mt-5 grid gap-4 md:grid-cols-3"><Field label="Category"><input value={platformForm.category} onChange={(e) => setPlatformForm((value) => ({ ...value, category: e.target.value }))} className={inputClass} /></Field><Field label="Priority"><select value={platformForm.priority} onChange={(e) => setPlatformForm((value) => ({ ...value, priority: e.target.value as HelpdeskPriority }))} className={inputClass}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select></Field><Field label="Subject"><input required value={platformForm.subject} onChange={(e) => setPlatformForm((value) => ({ ...value, subject: e.target.value }))} className={inputClass} placeholder="Platform issue" /></Field></div><Field label="Institution issue"><textarea required rows={5} value={platformForm.description} onChange={(e) => setPlatformForm((value) => ({ ...value, description: e.target.value }))} className={`${inputClass} mt-2 resize-y py-3`} placeholder="Describe the CampusOS platform/service issue. Do not paste unnecessary student records." /></Field><div className="mt-4 flex justify-end"><button disabled={busy} className={primaryBtn}><ArrowUpRight className="h-4 w-4" /> Send to CampusOS Super Admin</button></div></form>}

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</div>}

      <section className="grid min-h-[680px] overflow-hidden rounded-[26px] border border-[#D8E2EF] bg-white shadow-[0_16px_46px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950 lg:grid-cols-[410px_minmax(0,1fr)]">
        <aside className="border-b border-[#E1E7EF] bg-[#FAFBFD] dark:border-slate-800 dark:bg-slate-900/50 lg:border-b-0 lg:border-r">
          <div className="space-y-3 border-b border-[#E1E7EF] p-4 dark:border-slate-800"><label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A95A6]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search cases, student, department" className={`${inputClass} pl-10`} /></label><div className="grid grid-cols-4 gap-1 rounded-xl bg-[#EEF2F7] p-1 dark:bg-slate-800">{(['ACTIVE','MY_QUEUE','RESOLVED','ALL'] as const).map((item) => <button key={item} onClick={() => setView(item)} className={`min-h-9 rounded-lg px-2 text-[9px] font-extrabold ${view === item ? 'bg-white text-[#1754E8] shadow-sm dark:bg-slate-950' : 'text-[#6A7585]'}`}>{item.replace('_',' ')}</button>)}</div></div>
          <div className="max-h-[590px] overflow-y-auto p-2">{filtered.length === 0 ? <Empty text="No helpdesk cases match this view." /> : filtered.map((ticket) => <TicketListItem key={ticket.id} ticket={ticket} selected={selected?.id === ticket.id} onClick={() => setSelectedId(ticket.id)} />)}</div>
        </aside>
        <div className="min-w-0 p-5 sm:p-7">{selected ? <TicketDetail ticket={selected} reply={reply} setReply={setReply} internalNote={internalNote} setInternalNote={setInternalNote} escalateRole={escalateRole} setEscalateRole={setEscalateRole} escalateReason={escalateReason} setEscalateReason={setEscalateReason} busy={busy} request={request} /> : <Empty text="Select a case or raise a new one." />}</div>
      </section>

      {data.canCreatePlatformSupport && <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 dark:border-slate-800 dark:bg-slate-950 sm:p-6"><SectionTitle eyebrow="Company support history" title="CampusOS platform cases" description="Visible only to this institution's verified Institution Admin workspace." />{data.platformTickets.length === 0 ? <div className="mt-4"><Empty text="No company-support cases have been raised by this institution." /></div> : <div className="mt-5 grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]"><div className="space-y-2">{data.platformTickets.map((ticket) => <button key={ticket.id} onClick={() => setPlatformSelectedId(ticket.id)} className={`w-full rounded-xl border p-3 text-left ${selectedPlatform?.id === ticket.id ? 'border-[#1754E8] bg-[#EDF3FF] dark:bg-blue-950/20' : 'border-[#E1E7EF] dark:border-slate-800'}`}><p className="text-[10px] font-extrabold text-[#1754E8]">{ticket.reference}</p><p className="mt-1 truncate text-sm font-extrabold">{ticket.subject}</p><p className="mt-1 text-[10px] text-[#758094]">{ticket.status.replaceAll('_',' ')} · {ticket.priority}</p></button>)}</div>{selectedPlatform && <PlatformDetail ticket={selectedPlatform} reply={platformReply} setReply={setPlatformReply} busy={busy} request={request} />}</div>}</section>}
    </section>
  );
}

function TicketDetail({ ticket, reply, setReply, internalNote, setInternalNote, escalateRole, setEscalateRole, escalateReason, setEscalateReason, busy, request }: { ticket: HelpdeskTicket; reply: string; setReply: (value: string) => void; internalNote: boolean; setInternalNote: (value: boolean) => void; escalateRole: string; setEscalateRole: (value: string) => void; escalateReason: string; setEscalateReason: (value: string) => void; busy: boolean; request: (url: string, method: 'POST' | 'PATCH', body?: unknown) => Promise<boolean> }) {
  const closed = ['RESOLVED','CLOSED'].includes(ticket.status);
  return <div className="space-y-6"><div className="flex flex-col gap-4 border-b border-[#E1E7EF] pb-5 dark:border-slate-800 xl:flex-row xl:items-start xl:justify-between"><div><div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8]">{ticket.caseNumber}</span><TicketStatus status={ticket.status} /><Priority value={ticket.priority} /></div><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">{ticket.subject}</h2><p className="mt-2 text-sm text-[#667085] dark:text-slate-400">Raised by {ticket.requesterName} · {helpdeskRoleLabel(ticket.requesterRole)}{ticket.departmentName ? ` · ${ticket.departmentName}` : ''}</p></div>{ticket.canHandle && !closed && <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void request(`/api/helpdesk/tickets/${ticket.id}/assign`, 'POST')} className={secondaryBtn}><UserCheck className="h-4 w-4" /> {ticket.assignedUserName ?? 'Assign to me'}</button><button disabled={busy} onClick={() => void request(`/api/helpdesk/tickets/${ticket.id}/resolve`, 'POST')} className={secondaryBtn}><CheckCircle2 className="h-4 w-4" /> Resolve</button></div>}</div>
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Info icon={Inbox} label="Category" value={ticket.category.replaceAll('_',' ')} /><Info icon={UsersRound} label="Current queue" value={helpdeskRoleLabel(ticket.currentQueueRole)} /><Info icon={Clock3} label="SLA due" value={new Date(ticket.slaDueAt).toLocaleString()} alert={ticket.slaBreached} /><Info icon={BadgeCheck} label="Related student" value={ticket.relatedStudentName ?? 'Not linked'} /></div>
    <article className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFC] p-5 dark:border-slate-800 dark:bg-slate-900"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#758094]">Original request</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{ticket.description}</p></article>
    <section><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#1754E8]" /><h3 className="text-sm font-extrabold">Case conversation</h3></div><div className="mt-3 space-y-3">{ticket.messages.length === 0 ? <Empty text="No replies yet." /> : ticket.messages.map((message) => <div key={message.id} className={`rounded-2xl border p-4 ${message.type === 'INTERNAL_NOTE' ? 'border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20' : message.authorUserId === ticket.requesterUserId ? 'border-[#DCE4EF] bg-white dark:border-slate-800 dark:bg-slate-900' : 'ml-auto border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20'} max-w-[90%]`}><div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-[0.09em] text-[#7B8698]"><span>{message.authorName} · {helpdeskRoleLabel(message.authorRole)}{message.type !== 'REPLY' ? ` · ${message.type.replace('_',' ')}` : ''}</span><span>{new Date(message.createdAt).toLocaleString()}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p></div>)}</div></section>
    {ticket.canEscalate && <div className="rounded-2xl border border-[#D9E3F0] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900"><p className="text-xs font-extrabold">Escalate only when this queue cannot resolve the case</p><div className="mt-3 grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto]"><select value={escalateRole} onChange={(e) => setEscalateRole(e.target.value)} className={inputClass}><option value="">Select next authority</option>{ticket.escalationTargets.map((role) => <option key={role} value={role}>{helpdeskRoleLabel(role)}</option>)}</select><input value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Reason for escalation" className={inputClass} /><button disabled={busy || !escalateRole || escalateReason.trim().length < 5} onClick={() => void request(`/api/helpdesk/tickets/${ticket.id}/escalate`, 'POST', { toRole: escalateRole, reason: escalateReason })} className={secondaryBtn}><ArrowUpRight className="h-4 w-4" /> Escalate</button></div></div>}
    {ticket.canReply && <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) void request(`/api/helpdesk/tickets/${ticket.id}/reply`, 'POST', { body: reply, internalNote }); }} className="rounded-2xl border border-[#DCE4EF] p-4 dark:border-slate-800"><div className="flex flex-wrap items-center justify-between gap-3"><label className="text-xs font-extrabold">{internalNote ? 'Internal handler note' : 'Reply to case'}</label>{ticket.canHandle && <label className="flex items-center gap-2 text-[11px] font-bold text-[#667085]"><input type="checkbox" checked={internalNote} onChange={(e) => setInternalNote(e.target.checked)} /> Internal note (requester cannot see)</label>}</div><textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder={internalNote ? 'Record internal context for authorised handlers…' : 'Write a clear response…'} className="mt-2 w-full resize-y rounded-xl border border-[#CDD8E7] bg-white p-3 text-sm leading-6 outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-900" /><button disabled={busy || !reply.trim()} className={`${primaryBtn} mt-3`}><Send className="h-4 w-4" /> Send {internalNote ? 'note' : 'reply'}</button></form>}
  </div>;
}

function PlatformDetail({ ticket, reply, setReply, busy, request }: { ticket: CompanySupportTicket; reply: string; setReply: (value: string) => void; busy: boolean; request: (url: string, method: 'POST' | 'PATCH', body?: unknown) => Promise<boolean> }) {
  const closed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  return <div className="rounded-2xl border border-[#DCE4EF] p-4 dark:border-slate-800"><p className="text-[10px] font-extrabold text-[#1754E8]">{ticket.reference}</p><h3 className="mt-1 text-lg font-extrabold">{ticket.subject}</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#667085] dark:text-slate-400">{ticket.description}</p><div className="mt-4 space-y-2">{ticket.messages.map((message) => <div key={message.id} className={`rounded-xl p-3 text-sm ${message.authorSide === 'CAMPUSOS' ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-[#F7F9FC] dark:bg-slate-900'}`}><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#7A8596]">{message.authorName} · {message.authorSide}</p><p className="mt-1 whitespace-pre-wrap leading-6">{message.body}</p></div>)}</div>{!closed && <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) void request(`/api/helpdesk/platform/${ticket.id}/reply`, 'POST', { body: reply }); }} className="mt-4"><textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply to CampusOS company support" className={`${inputClass} resize-y py-3`} /><button disabled={busy || !reply.trim()} className={`${secondaryBtn} mt-2`}><Send className="h-4 w-4" /> Reply</button></form>}</div>;
}

function TicketListItem({ ticket, selected, onClick }: { ticket: HelpdeskTicket; selected: boolean; onClick: () => void }) { return <button onClick={onClick} className={`mb-2 w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-[#1754E8] bg-[#EDF3FF] dark:bg-blue-950/20' : 'border-transparent bg-white hover:border-[#D8E2EF] dark:bg-slate-950 dark:hover:border-slate-700'}`}><div className="flex items-center justify-between gap-2"><span className="text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#1754E8]">{ticket.caseNumber}</span><TicketStatus status={ticket.status} /></div><p className="mt-2 truncate text-sm font-extrabold">{ticket.subject}</p><p className="mt-1 truncate text-xs text-[#667085] dark:text-slate-400">{ticket.requesterName} · {ticket.departmentName ?? helpdeskRoleLabel(ticket.requesterRole)}</p><div className="mt-3 flex items-center justify-between"><Priority value={ticket.priority} /><span className={`text-[10px] font-bold ${ticket.slaBreached ? 'text-red-600' : 'text-[#7A8596]'}`}>{ticket.slaBreached ? 'SLA breached' : helpdeskRoleLabel(ticket.currentQueueRole)}</span></div></button>; }
function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) { return <div><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8]">{eyebrow}</p><h2 className="mt-1 text-xl font-extrabold tracking-[-0.02em]">{title}</h2><p className="mt-1 max-w-3xl text-xs leading-6 text-[#667085] dark:text-slate-400">{description}</p></div>; }
function DarkMetric({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) { return <div className="rounded-2xl border border-[#365474] bg-[#152A48] p-4"><p className={`text-2xl font-extrabold ${alert ? 'text-[#FFB4A9]' : 'text-white'}`}>{value}</p><p className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#A9BDD8]">{label}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block text-xs font-extrabold text-[#344054] dark:text-slate-200">{label}<div className="mt-2">{children}</div></label>; }
function Info({ icon: Icon, label, value, alert = false }: { icon: typeof Inbox; label: string; value: string; alert?: boolean }) { return <div className={`rounded-2xl border p-4 ${alert ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20' : 'border-[#DCE4EF] dark:border-slate-800'}`}><Icon className={`h-4 w-4 ${alert ? 'text-red-600' : 'text-[#1754E8]'}`} /><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A8596]">{label}</p><p className="mt-1 truncate text-sm font-extrabold">{value}</p></div>; }
function TicketStatus({ status }: { status: HelpdeskTicket['status'] }) { const done = status === 'RESOLVED' || status === 'CLOSED'; return <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${done ? 'bg-emerald-100 text-emerald-800' : status === 'ESCALATED' ? 'bg-purple-100 text-purple-800' : status === 'WAITING_REQUESTER' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>{status.replaceAll('_',' ')}</span>; }
function Priority({ value }: { value: HelpdeskPriority }) { return <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold ${value === 'URGENT' ? 'text-red-600' : value === 'HIGH' ? 'text-amber-700' : 'text-[#667085]'}`}>{value === 'URGENT' ? <AlertTriangle className="h-3.5 w-3.5" /> : value === 'HIGH' ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{value}</span>; }
function Empty({ text }: { text: string }) { return <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[#CDD8E7] p-5 text-center text-sm text-[#7A8596] dark:border-slate-700">{text}</div>; }
function routePreview(role: HelpdeskWorkspaceData['role'], category: HelpdeskCategory) { if (role === 'STUDENT' || role === 'PARENT') { const map: Partial<Record<HelpdeskCategory, HelpdeskWorkspaceData['role']>> = { ACADEMIC: 'FACULTY', EXAMINATION: 'EXAMINATION_CONTROLLER', FACULTY_CONCERN: 'HOD', ATTENDANCE: 'FACULTY', FEES: 'FINANCE_OFFICER', ADMISSIONS: 'REGISTRAR', LIBRARY: 'LIBRARIAN', HOSTEL: 'WARDEN', TRANSPORT: 'TRANSPORT_MANAGER', PLACEMENT: 'PLACEMENT_OFFICER', TECHNICAL: 'INSTITUTION_ADMIN', REGISTRAR: 'REGISTRAR' }; return map[category] ?? 'REGISTRAR'; } if (role === 'FACULTY') return category === 'EXAMINATION' ? 'EXAMINATION_CONTROLLER' : category === 'HR' ? 'HR_ADMIN' : category === 'TECHNICAL' ? 'INSTITUTION_ADMIN' : 'HOD'; if (role === 'HOD') return category === 'EXAMINATION' ? 'EXAMINATION_CONTROLLER' : category === 'HR' ? 'HR_ADMIN' : category === 'TECHNICAL' ? 'INSTITUTION_ADMIN' : 'DEAN'; if (role === 'DEAN') return category === 'EXAMINATION' ? 'EXAMINATION_CONTROLLER' : 'INSTITUTION_ADMIN'; if (role === 'ACCOUNTANT') return 'FINANCE_OFFICER'; if (role === 'ADMISSIONS_COUNSELLOR') return 'REGISTRAR'; if (role === 'EXAMINATION_CONTROLLER' || role === 'REGISTRAR') return category === 'ACADEMIC' ? 'DEAN' : 'INSTITUTION_ADMIN'; return 'INSTITUTION_ADMIN'; }
const primaryBtn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white transition hover:bg-[#1245C4] disabled:opacity-50';
const secondaryBtn = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#CDD8E7] bg-white px-3 text-xs font-extrabold text-[#25344F] transition hover:border-[#1754E8] dark:border-slate-700 dark:bg-slate-900 dark:text-white disabled:opacity-50';
const inputClass = 'min-h-11 w-full rounded-xl border border-[#CBD7E6] bg-white px-3 text-sm font-semibold text-[#101D38] outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-900 dark:text-white';
