'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Inbox,
  Mail,
  MessageSquareReply,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserCheck,
  XCircle,
} from 'lucide-react';

import type {
  CompanyContactInboxData,
  CompanyContactInquiry,
  ContactInquiryPriority,
  ContactInquiryStatus,
} from '@/lib/company-admin-contact-types';

const statusLabels: Record<ContactInquiryStatus, string> = {
  NEW: 'New',
  OPEN: 'Open',
  WAITING_CUSTOMER: 'Awaiting customer',
  RESOLVED: 'Resolved',
  SPAM: 'Spam',
};

const statusTone: Record<ContactInquiryStatus, string> = {
  NEW: 'border-blue-200 bg-blue-50 text-blue-700',
  OPEN: 'border-amber-200 bg-amber-50 text-amber-700',
  WAITING_CUSTOMER: 'border-violet-200 bg-violet-50 text-violet-700',
  RESOLVED: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  SPAM: 'border-slate-200 bg-slate-100 text-slate-600',
};

const priorityTone: Record<ContactInquiryPriority, string> = {
  LOW: 'border-slate-200 bg-slate-50 text-slate-600',
  NORMAL: 'border-blue-200 bg-blue-50 text-blue-700',
  HIGH: 'border-orange-200 bg-orange-50 text-orange-700',
  URGENT: 'border-rose-200 bg-rose-50 text-rose-700',
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'EN';
}

export function CompanyContactInbox({ data }: { data: CompanyContactInboxData }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(data.inquiries[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [busyAction, setBusyAction] = useState('');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replySubject, setReplySubject] = useState('');

  const inquiryTypes = useMemo(
    () => Array.from(new Set(data.inquiries.map((item) => item.inquiryType))).sort(),
    [data.inquiries],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.inquiries.filter((item) => {
      const matchesSearch = !query || [
        item.reference,
        item.name,
        item.email,
        item.phone,
        item.institution,
        item.role,
        item.country,
        item.inquiryType,
        item.subject,
        item.messages[0]?.bodyText,
      ].some((value) => value?.toLowerCase().includes(query));
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesType = typeFilter === 'ALL' || item.inquiryType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [data.inquiries, search, statusFilter, typeFilter]);

  const selected = data.inquiries.find((item) => item.id === selectedId)
    ?? filtered[0]
    ?? data.inquiries[0]
    ?? null;

  function selectInquiry(inquiry: CompanyContactInquiry) {
    setSelectedId(inquiry.id);
    setReplySubject(`Re: CampusOS ${inquiry.inquiryType.toLowerCase()} enquiry — ${inquiry.institution}`);
    setReplyMessage('');
    setFeedback(null);
    if (inquiry.status === 'NEW') void updateInquiry(inquiry.id, { status: 'OPEN' });
  }

  async function updateInquiry(
    id: string,
    payload: { status?: ContactInquiryStatus; priority?: ContactInquiryPriority; assignedToMe?: boolean },
  ) {
    const actionKey = `${id}:${JSON.stringify(payload)}`;
    setBusyAction(actionKey);
    setFeedback(null);
    try {
      const response = await fetch(`/api/company-admin/inquiries/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to update enquiry.');
      setFeedback({ tone: 'success', text: 'Enquiry updated.' });
      router.refresh();
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to update enquiry.' });
    } finally {
      setBusyAction('');
    }
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusyAction('reply');
    setFeedback(null);
    try {
      const response = await fetch(`/api/company-admin/inquiries/${selected.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: replySubject || `Re: CampusOS enquiry — ${selected.institution}`,
          message: replyMessage,
        }),
      });
      const result = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to send reply.');
      setReplyMessage('');
      setFeedback({ tone: 'success', text: result.message || 'Reply sent successfully.' });
      router.refresh();
    } catch (error) {
      setFeedback({ tone: 'error', text: error instanceof Error ? error.message : 'Unable to send reply.' });
    } finally {
      setBusyAction('');
    }
  }

  async function copyText(value: string) {
    await navigator.clipboard.writeText(value).catch(() => null);
    setFeedback({ tone: 'success', text: 'Copied to clipboard.' });
  }

  return (
    <div className="min-h-screen bg-[#F3F6FA] text-[#172033]">
      <header className="sticky top-0 z-40 border-b border-[#DCE4EE] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex min-h-[74px] max-w-[1720px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/company-admin" className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1EC] text-[#526071] transition hover:bg-[#F7F9FC]" aria-label="Back to company control center">
            <ArrowLeft className="h-4.5 w-4.5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#7C899B]"><ShieldCheck className="h-3.5 w-3.5" />CampusOS company administration</div>
            <h1 className="mt-1 truncate text-xl font-extrabold tracking-[-0.03em] text-[#101D38]">Enquiry inbox</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button type="button" onClick={() => router.refresh()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] hover:bg-[#F7F9FC]"><RefreshCw className="h-4 w-4" />Refresh</button>
            <div className="hidden rounded-xl border border-[#D8E1EC] bg-[#F7F9FC] px-3 py-2 sm:block"><p className="text-[9px] font-extrabold uppercase tracking-wide text-[#8A95A6]">Signed in</p><p className="mt-0.5 max-w-[220px] truncate text-xs font-bold text-[#344054]">{data.actor.email}</p></div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1720px] space-y-5 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        {!data.ready && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">Enquiry storage has not been provisioned yet</p><p className="mt-1 text-xs leading-5">Run the normal production database preparation so the company control-plane contact tables are created.</p></div></div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'All enquiries', value: data.metrics.total, icon: Inbox },
            { label: 'New', value: data.metrics.new, icon: Sparkles },
            { label: 'Open', value: data.metrics.open, icon: Clock3 },
            { label: 'Awaiting customer', value: data.metrics.waitingCustomer, icon: MessageSquareReply },
            { label: 'Resolved', value: data.metrics.resolved, icon: CheckCircle2 },
            { label: 'Urgent', value: data.metrics.urgent, icon: AlertCircle },
          ].map(({ label, value, icon: Icon }) => (
            <article key={label} className="rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_8px_24px_rgba(16,29,56,0.035)]">
              <div className="flex items-center justify-between gap-3"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B]">{label}</p><span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]"><Icon className="h-4 w-4" /></span></div>
              <p className="mt-3 text-2xl font-extrabold tracking-[-0.04em] text-[#101D38]">{value.toLocaleString('en-IN')}</p>
            </article>
          ))}
        </section>

        <section className="overflow-hidden rounded-[26px] border border-[#D8E1EC] bg-white shadow-[0_18px_55px_rgba(16,29,56,0.06)]">
          <div className="grid min-h-[720px] xl:grid-cols-[410px_minmax(0,1fr)]">
            <aside className="border-b border-[#DCE4EE] xl:border-b-0 xl:border-r">
              <div className="space-y-3 border-b border-[#E4EAF1] p-4">
                <div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98A2B3]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, institution…" className="min-h-11 w-full rounded-xl border border-[#D8E1EC] bg-[#FAFBFD] pl-10 pr-3 text-sm outline-none transition focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="min-h-10 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] outline-none focus:border-[#1754E8]"><option value="ALL">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="min-h-10 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] outline-none focus:border-[#1754E8]"><option value="ALL">All enquiry types</option>{inquiryTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select>
                </div>
                <p className="text-[10px] font-bold text-[#8A95A6]">Showing {filtered.length} of {data.inquiries.length} enquiries</p>
              </div>

              <div className="max-h-[760px] overflow-y-auto p-2">
                {filtered.length === 0 ? <div className="px-4 py-16 text-center"><Inbox className="mx-auto h-8 w-8 text-[#A6B1C0]" /><p className="mt-3 text-sm font-extrabold text-[#344054]">No matching enquiries</p><p className="mt-1 text-xs text-[#7C899B]">Adjust the search or filters.</p></div> : filtered.map((inquiry) => (
                  <button key={inquiry.id} type="button" onClick={() => selectInquiry(inquiry)} className={`mb-2 w-full rounded-2xl border p-4 text-left transition ${selected?.id === inquiry.id ? 'border-[#9EB9F2] bg-[#F3F7FF] shadow-[0_8px_20px_rgba(23,84,232,0.07)]' : 'border-transparent hover:border-[#DCE4EE] hover:bg-[#FAFBFD]'}`}>
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black ${inquiry.status === 'NEW' ? 'bg-[#1754E8] text-white' : 'bg-[#EAF0F8] text-[#526071]'}`}>{initials(inquiry.name)}</span>
                      <div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-extrabold text-[#101D38]">{inquiry.name}</p>{inquiry.priority === 'URGENT' && <span className="h-2 w-2 rounded-full bg-rose-500" aria-label="Urgent" />}</div><p className="mt-0.5 truncate text-xs font-semibold text-[#526071]">{inquiry.institution}</p><p className="mt-1 truncate text-[10px] text-[#8A95A6]">{inquiry.email}</p></div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2"><span className={`rounded-full border px-2 py-1 text-[9px] font-extrabold ${statusTone[inquiry.status]}`}>{statusLabels[inquiry.status]}</span><span className="text-[9px] font-bold text-[#8A95A6]">{formatDateTime(inquiry.lastMessageAt)}</span></div>
                  </button>
                ))}
              </div>
            </aside>

            <div className="min-w-0 bg-[#FBFCFE]">
              {!selected ? (
                <div className="flex min-h-[720px] flex-col items-center justify-center p-8 text-center"><Inbox className="h-10 w-10 text-[#A6B1C0]" /><p className="mt-4 text-lg font-extrabold text-[#101D38]">Select an enquiry</p><p className="mt-2 max-w-md text-sm leading-6 text-[#7C899B]">Customer details, conversation history and reply controls will appear here.</p></div>
              ) : (
                <div className="flex min-h-[720px] flex-col">
                  <div className="border-b border-[#DCE4EE] bg-white p-5 sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${statusTone[selected.status]}`}>{statusLabels[selected.status]}</span><span className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold ${priorityTone[selected.priority]}`}>{selected.priority}</span><span className="rounded-full border border-[#DCE4EE] bg-[#F7F9FC] px-2.5 py-1 text-[10px] font-extrabold text-[#526071]">{selected.inquiryType}</span></div><h2 className="mt-3 text-2xl font-extrabold tracking-[-0.035em] text-[#101D38]">{selected.name}</h2><p className="mt-1 text-sm font-bold text-[#526071]">{selected.institution}</p><p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-[#8A95A6]">{selected.reference}</p></div>
                      <div className="flex flex-wrap gap-2"><button type="button" onClick={() => updateInquiry(selected.id, { assignedToMe: selected.assignedTo !== data.actor.id })} disabled={Boolean(busyAction)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] hover:bg-[#F7F9FC] disabled:opacity-50"><UserCheck className="h-4 w-4" />{selected.assignedTo === data.actor.id ? 'Unassign me' : 'Assign to me'}</button><button type="button" onClick={() => copyText(selected.email)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] hover:bg-[#F7F9FC]"><Copy className="h-4 w-4" />Copy email</button></div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {[['Email', selected.email], ['Phone', selected.phone || 'Not provided'], ['Role', selected.role || 'Not provided'], ['Country', selected.country || 'Not provided']].map(([label, value]) => <div key={label} className="rounded-xl border border-[#E1E7EF] bg-[#FAFBFD] p-3"><p className="text-[9px] font-extrabold uppercase tracking-wide text-[#8A95A6]">{label}</p><p className="mt-1 break-words text-xs font-bold text-[#344054]">{value}</p></div>)}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <select value={selected.status} onChange={(event) => updateInquiry(selected.id, { status: event.target.value as ContactInquiryStatus })} disabled={Boolean(busyAction)} className="min-h-10 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] outline-none focus:border-[#1754E8]"><option value="NEW">New</option><option value="OPEN">Open</option><option value="WAITING_CUSTOMER">Awaiting customer</option><option value="RESOLVED">Resolved</option><option value="SPAM">Spam</option></select>
                      <select value={selected.priority} onChange={(event) => updateInquiry(selected.id, { priority: event.target.value as ContactInquiryPriority })} disabled={Boolean(busyAction)} className="min-h-10 rounded-xl border border-[#D8E1EC] bg-white px-3 text-xs font-bold text-[#526071] outline-none focus:border-[#1754E8]"><option value="LOW">Low priority</option><option value="NORMAL">Normal priority</option><option value="HIGH">High priority</option><option value="URGENT">Urgent priority</option></select>
                      <span className="inline-flex min-h-10 items-center rounded-xl border border-[#D8E1EC] bg-[#F7F9FC] px-3 text-[10px] font-bold text-[#7C899B]">Owner: {selected.assignedToName || 'Unassigned'}</span>
                    </div>
                  </div>

                  {feedback && <div className={`mx-5 mt-4 flex items-start gap-2 rounded-xl border p-3 text-xs font-bold sm:mx-6 ${feedback.tone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{feedback.tone === 'success' ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <XCircle className="h-4 w-4 shrink-0" />}<span>{feedback.text}</span></div>}

                  <div className="flex-1 space-y-4 p-5 sm:p-6">
                    <div className="rounded-2xl border border-[#DCE4EE] bg-white p-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7C899B]">Original request</p><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#344054]">{selected.messages.find((message) => message.direction === 'INBOUND')?.bodyText || 'No message body available.'}</p></div>

                    <div>
                      <div className="mb-3 flex items-center justify-between"><div><p className="text-sm font-extrabold text-[#101D38]">Conversation timeline</p><p className="mt-1 text-[10px] text-[#8A95A6]">Every outbound reply records its delivery state.</p></div><span className="text-[10px] font-bold text-[#8A95A6]">{selected.messages.length} message{selected.messages.length === 1 ? '' : 's'}</span></div>
                      <div className="space-y-3">
                        {selected.messages.map((message) => (
                          <article key={message.id} className={`rounded-2xl border p-4 ${message.direction === 'OUTBOUND' ? 'ml-0 border-[#C9D8F6] bg-[#F4F7FF] sm:ml-10' : 'mr-0 border-[#DCE4EE] bg-white sm:mr-10'}`}>
                            <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-[#1754E8]" /><p className="text-xs font-extrabold text-[#344054]">{message.direction === 'OUTBOUND' ? 'CampusOS reply' : 'Customer message'}</p><span className={`rounded-full border px-2 py-0.5 text-[9px] font-extrabold ${message.deliveryStatus === 'FAILED' ? 'border-rose-200 bg-rose-50 text-rose-700' : message.deliveryStatus === 'SENT' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-600'}`}>{message.deliveryStatus}</span></div><p className="text-[9px] font-bold text-[#8A95A6]">{formatDateTime(message.createdAt)}</p></div>
                            <p className="mt-2 text-[11px] font-bold text-[#526071]">{message.subject}</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#344054]">{message.bodyText}</p>
                          </article>
                        ))}
                      </div>
                    </div>
                  </div>

                  <form onSubmit={sendReply} className="border-t border-[#DCE4EE] bg-white p-5 sm:p-6">
                    <div className="flex items-center gap-2"><MessageSquareReply className="h-4.5 w-4.5 text-[#1754E8]" /><p className="text-sm font-extrabold text-[#101D38]">Reply by email</p></div>
                    <input value={replySubject || `Re: CampusOS ${selected.inquiryType.toLowerCase()} enquiry — ${selected.institution}`} onChange={(event) => setReplySubject(event.target.value)} maxLength={250} className="mt-3 min-h-11 w-full rounded-xl border border-[#D8E1EC] bg-white px-3 text-sm font-semibold text-[#344054] outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" aria-label="Reply subject" />
                    <textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required minLength={2} maxLength={10_000} rows={6} placeholder={`Write a clear response to ${selected.name}…`} className="mt-3 w-full resize-y rounded-xl border border-[#D8E1EC] bg-white px-3 py-3 text-sm leading-6 text-[#344054] outline-none focus:border-[#1754E8] focus:ring-4 focus:ring-[#1754E8]/10" />
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] leading-5 text-[#8A95A6]">Reply will be sent to <strong className="text-[#526071]">{selected.email}</strong> and added to this timeline.</p><button type="submit" disabled={busyAction === 'reply' || !replyMessage.trim()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 text-xs font-extrabold text-white shadow-[0_10px_24px_rgba(23,84,232,0.22)] transition hover:bg-[#103FC2] disabled:cursor-not-allowed disabled:opacity-50">{busyAction === 'reply' ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending…</> : <><Send className="h-4 w-4" />Send reply</>}</button></div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
