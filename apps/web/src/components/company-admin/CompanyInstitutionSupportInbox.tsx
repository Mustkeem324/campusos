'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, Clock3, Inbox, MessageSquareText, Search, Send, ShieldCheck, UserCheck } from 'lucide-react';

import type { CompanySupportInboxData, CompanySupportTicket, HelpdeskPriority } from '@/lib/helpdesk-types';

export function CompanyInstitutionSupportInbox({ data }: { data: CompanySupportInboxData }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(data.tickets[0]?.id ?? '');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.tickets.filter((ticket) => {
      const statusMatch = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' ? !['RESOLVED','CLOSED'].includes(ticket.status) : ticket.status === statusFilter);
      const textMatch = !q || [ticket.reference, ticket.institutionName, ticket.requesterName, ticket.requesterEmail, ticket.subject, ticket.category]
        .some((value) => value.toLowerCase().includes(q));
      return statusMatch && textMatch;
    });
  }, [data.tickets, query, statusFilter]);
  const selected = data.tickets.find((ticket) => ticket.id === selectedId) ?? filtered[0] ?? null;

  async function mutate(url: string, method: 'POST' | 'PATCH', body?: unknown) {
    setBusy(true); setError(null);
    try {
      const response = await fetch(url, { method, headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
      const payload = await response.json().catch(() => null) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || 'Unable to update this support case.');
      setReply('');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update this support case.');
    } finally { setBusy(false); }
  }

  return (
    <main className="min-h-screen bg-[#F5F7FB] px-4 py-5 text-[#101D38] sm:px-6 lg:px-8 dark:bg-slate-950 dark:text-white">
      <div className="mx-auto max-w-[1580px] space-y-5">
        <header className="rounded-[28px] border border-[#D8E2EF] bg-white p-6 shadow-[0_18px_54px_rgba(16,29,56,0.08)] dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/company-admin" className="inline-flex items-center gap-2 text-xs font-extrabold text-[#1754E8]"><ArrowLeft className="h-4 w-4" /> Company control center</Link>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#C9D8EE] bg-[#EDF3FF] px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"><ShieldCheck className="h-3.5 w-3.5" /> Super Admin company support</div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">Institution support operations</h1>
              <p className="mt-2 max-w-3xl text-sm leading-7 text-[#667085] dark:text-slate-400">Platform and service issues raised by verified Institution Administrators. Internal academic helpdesk conversations never enter this queue.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              <Metric label="New" value={data.metrics.newCount} /><Metric label="Open" value={data.metrics.openCount} /><Metric label="Waiting" value={data.metrics.waitingCount} /><Metric label="Urgent" value={data.metrics.urgentCount} /><Metric label="Resolved" value={data.metrics.resolvedCount} /><Metric label="Total" value={data.metrics.total} />
            </div>
          </div>
        </header>

        <section className="grid min-h-[680px] overflow-hidden rounded-[26px] border border-[#D8E2EF] bg-white shadow-[0_16px_46px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="border-b border-[#E1E7EF] bg-[#FAFBFD] dark:border-slate-800 dark:bg-slate-950/60 lg:border-b-0 lg:border-r">
            <div className="space-y-3 border-b border-[#E1E7EF] p-4 dark:border-slate-800">
              <label className="relative block"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A95A6]" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search institution or case" className="min-h-11 w-full rounded-xl border border-[#CDD8E7] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-900" /></label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-h-11 w-full rounded-xl border border-[#CDD8E7] bg-white px-3 text-sm font-bold dark:border-slate-700 dark:bg-slate-900"><option value="ACTIVE">Active cases</option><option value="ALL">All cases</option><option value="NEW">New</option><option value="OPEN">Open</option><option value="WAITING_INSTITUTION">Waiting institution</option><option value="RESOLVED">Resolved</option></select>
            </div>
            <div className="max-h-[590px] overflow-y-auto p-2">
              {filtered.length === 0 ? <Empty text="No institution support cases match this view." /> : filtered.map((ticket) => (
                <button key={ticket.id} onClick={() => setSelectedId(ticket.id)} className={`mb-2 w-full rounded-2xl border p-4 text-left transition ${selected?.id === ticket.id ? 'border-[#1754E8] bg-[#EDF3FF] dark:bg-blue-950/20' : 'border-transparent bg-white hover:border-[#D8E2EF] dark:bg-slate-900 dark:hover:border-slate-700'}`}>
                  <div className="flex items-center justify-between gap-3"><span className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">{ticket.reference}</span><Status status={ticket.status} /></div>
                  <p className="mt-2 truncate text-sm font-extrabold">{ticket.subject}</p>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-[#667085] dark:text-slate-400"><Building2 className="h-3.5 w-3.5" />{ticket.institutionName}</p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-[#7A8596]"><Priority value={ticket.priority} /><span>{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
                </button>
              ))}
            </div>
          </aside>

          <div className="min-w-0 p-5 sm:p-7">
            {!selected ? <Empty text="Select an institution support case." /> : <CaseDetail ticket={selected} reply={reply} setReply={setReply} busy={busy} error={error} mutate={mutate} />}
          </div>
        </section>
      </div>
    </main>
  );
}

function CaseDetail({ ticket, reply, setReply, busy, error, mutate }: { ticket: CompanySupportTicket; reply: string; setReply: (value: string) => void; busy: boolean; error: string | null; mutate: (url: string, method: 'POST' | 'PATCH', body?: unknown) => Promise<void> }) {
  const closed = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
  return <div className="space-y-6">
    <div className="flex flex-col gap-4 border-b border-[#E1E7EF] pb-5 dark:border-slate-800 xl:flex-row xl:items-start xl:justify-between">
      <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">{ticket.reference}</p><h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">{ticket.subject}</h2><p className="mt-2 text-sm text-[#667085] dark:text-slate-400">{ticket.institutionName} · {ticket.requesterName} · {ticket.requesterEmail}</p></div>
      <div className="flex flex-wrap gap-2"><button disabled={busy} onClick={() => void mutate(`/api/company-admin/support/${ticket.id}`, 'PATCH', { assignToMe: true })} className={secondaryBtn}><UserCheck className="h-4 w-4" /> Assign to me</button><select value={ticket.priority} disabled={busy} onChange={(e) => void mutate(`/api/company-admin/support/${ticket.id}`, 'PATCH', { priority: e.target.value as HelpdeskPriority })} className={selectClass}><option>LOW</option><option>NORMAL</option><option>HIGH</option><option>URGENT</option></select><select value={ticket.status} disabled={busy} onChange={(e) => void mutate(`/api/company-admin/support/${ticket.id}`, 'PATCH', { status: e.target.value })} className={selectClass}><option>NEW</option><option>OPEN</option><option>WAITING_INSTITUTION</option><option>RESOLVED</option><option>CLOSED</option></select></div>
    </div>
    <div className="grid gap-3 sm:grid-cols-3"><Info icon={Building2} label="Institution" value={ticket.institutionName} /><Info icon={Inbox} label="Category" value={ticket.category} /><Info icon={UserCheck} label="Owner" value={ticket.assignedSuperAdminName ?? 'Unassigned'} /></div>
    <article className="rounded-2xl border border-[#DCE4EF] bg-[#F8FAFC] p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#758094]">Institution description</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7">{ticket.description}</p></article>
    <section><div className="flex items-center gap-2"><MessageSquareText className="h-4 w-4 text-[#1754E8]" /><h3 className="text-sm font-extrabold">Conversation</h3></div><div className="mt-3 space-y-3">{ticket.messages.length === 0 ? <Empty text="No replies yet." /> : ticket.messages.map((message) => <div key={message.id} className={`rounded-2xl border p-4 ${message.authorSide === 'CAMPUSOS' ? 'ml-auto border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20' : 'mr-auto border-[#DCE4EF] bg-white dark:border-slate-800 dark:bg-slate-950'} max-w-[88%]`}><div className="flex items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7B8698]"><span>{message.authorName} · {message.authorSide}</span><span>{new Date(message.createdAt).toLocaleString()}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{message.body}</p></div>)}</div></section>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">{error}</div>}
    {!closed && <form onSubmit={(e) => { e.preventDefault(); if (reply.trim()) void mutate(`/api/company-admin/support/${ticket.id}/reply`, 'POST', { body: reply }); }} className="rounded-2xl border border-[#DCE4EF] p-4 dark:border-slate-800"><label className="text-xs font-extrabold">Reply to institution<textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={5} placeholder="Write a clear platform-support response…" className="mt-2 w-full resize-y rounded-xl border border-[#CDD8E7] bg-white p-3 text-sm leading-6 outline-none focus:border-[#1754E8] dark:border-slate-700 dark:bg-slate-950" /></label><button disabled={busy || !reply.trim()} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white disabled:opacity-50"><Send className="h-4 w-4" /> Send reply</button></form>}
  </div>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="min-w-[76px] rounded-xl border border-[#DCE4EF] bg-[#F8FAFC] px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-950"><div className="text-lg font-extrabold">{value}</div><div className="text-[9px] font-bold uppercase tracking-[0.09em] text-[#7A8596]">{label}</div></div>; }
function Info({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) { return <div className="rounded-2xl border border-[#DCE4EF] p-4 dark:border-slate-800"><Icon className="h-4 w-4 text-[#1754E8]" /><p className="mt-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7A8596]">{label}</p><p className="mt-1 truncate text-sm font-extrabold">{value}</p></div>; }
function Status({ status }: { status: CompanySupportTicket['status'] }) { const active = status === 'NEW' || status === 'OPEN'; return <span className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${active ? 'bg-amber-100 text-amber-800' : status === 'WAITING_INSTITUTION' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'}`}>{status.replaceAll('_',' ')}</span>; }
function Priority({ value }: { value: HelpdeskPriority }) { return <span className={`inline-flex items-center gap-1 font-extrabold ${value === 'URGENT' ? 'text-red-600' : value === 'HIGH' ? 'text-amber-700' : 'text-[#667085]'}`}>{value === 'URGENT' ? <AlertTriangle className="h-3.5 w-3.5" /> : value === 'HIGH' ? <Clock3 className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}{value}</span>; }
function Empty({ text }: { text: string }) { return <div className="flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[#CDD8E7] p-5 text-center text-sm text-[#7A8596] dark:border-slate-700">{text}</div>; }
const secondaryBtn = 'inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#CDD8E7] bg-white px-3 text-xs font-extrabold hover:border-[#1754E8] dark:border-slate-700 dark:bg-slate-950';
const selectClass = 'min-h-10 rounded-xl border border-[#CDD8E7] bg-white px-3 text-xs font-extrabold dark:border-slate-700 dark:bg-slate-950';
