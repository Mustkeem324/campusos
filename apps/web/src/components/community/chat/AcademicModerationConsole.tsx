'use client';

import React from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, EyeOff, Loader2, RefreshCw, RotateCcw, ShieldCheck, Trash2, X } from 'lucide-react';

type ModerationCase = {
  id: string;
  communityId: string;
  severity: string;
  status: string;
  internalNotes: string | null;
  userNotice: string | null;
  createdAt: string;
  updatedAt: string;
  community: { name: string; type: string };
  message: { id: string; body: string; moderationStatus: string; author: { id: string; name: string; role: string } };
  report: { reason: string; description: string | null; status: string } | null;
  actions: Array<{ id: string; actionType: string; reason: string; createdAt: string }>;
};

type QueueResponse = { cases: ModerationCase[]; communities: Array<{ id: string; name: string; type: string }> };
type ActionType = 'HIDE' | 'REMOVE' | 'RESTORE' | 'CLOSE_REPORT';

function pretty(value: string) { return value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function relativeTime(value: string) {
  const ms = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(ms / 60000));
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function apiError(value: unknown, fallback: string) { return value && typeof value === 'object' && 'error' in value && typeof (value as { error?: unknown }).error === 'string' ? (value as { error: string }).error : fallback; }

export function AcademicModerationConsole() {
  const [data, setData] = React.useState<QueueResponse>({ cases: [], communities: [] });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [selectedCommunity, setSelectedCommunity] = React.useState('ALL');
  const [workingId, setWorkingId] = React.useState<string | null>(null);
  const [confirm, setConfirm] = React.useState<{ item: ModerationCase; action: ActionType } | null>(null);
  const [reason, setReason] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const query = status === 'RESOLVED' ? '?status=RESOLVED' : '';
      const response = await fetch(`/api/community/chat/moderation/academic${query}`, { cache: 'no-store' });
      const payload: unknown = await response.json();
      if (!response.ok || !payload || typeof payload !== 'object' || !Array.isArray((payload as QueueResponse).cases)) throw new Error(apiError(payload, 'Unable to load moderation cases.'));
      setData(payload as QueueResponse);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Unable to load moderation cases.'); }
    finally { setLoading(false); }
  }, [status]);

  React.useEffect(() => { void load(); }, [load]);

  const filtered = React.useMemo(() => selectedCommunity === 'ALL' ? data.cases : data.cases.filter((item) => item.communityId === selectedCommunity), [data.cases, selectedCommunity]);
  const severeCount = data.cases.filter((item) => ['HIGH', 'CRITICAL'].includes(item.severity)).length;

  const performAction = async () => {
    if (!confirm || reason.trim().length < 3) return;
    setWorkingId(confirm.item.id); setError(null);
    try {
      const response = await fetch(`/api/community/chat/moderation/cases/${confirm.item.id}/action`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: confirm.action, reason: reason.trim(), userMessage: userMessage(confirm.action) }),
      });
      const payload: unknown = await response.json();
      if (!response.ok) throw new Error(apiError(payload, 'Moderation action could not be completed.'));
      setConfirm(null); setReason(''); await load();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Moderation action could not be completed.'); }
    finally { setWorkingId(null); }
  };

  return <section className="space-y-5">
    <header className="rounded-2xl border border-[#DCE3EC] bg-[#0B1739] p-5 text-white shadow-[0_14px_36px_rgba(15,30,55,0.12)] sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><Link href="/community/chat" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ABC0EE] hover:text-white"><ArrowLeft className="h-3.5 w-3.5" />Back to Academic Chat</Link><p className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#91A7D6]">CampusOS trust & safety</p><h1 className="mt-1 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Academic Community Moderation</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#B7C6E4]">Review reported or automatically flagged messages only in communities you are authorised to moderate. Actions are recorded in the CampusOS moderation audit trail.</p></div>
        <div className="grid grid-cols-2 gap-2 sm:flex"><Summary label="Open cases" value={String(data.cases.length)} /><Summary label="High priority" value={String(severeCount)} /><button type="button" onClick={() => void load()} className="col-span-2 flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-black hover:bg-white/10"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />Refresh</button></div>
      </div>
    </header>

    <div className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-1 rounded-lg bg-[#F4F6F9] p-1"><button type="button" onClick={() => setStatus('ACTIVE')} className={`rounded-md px-3 py-2 text-xs font-black ${status === 'ACTIVE' ? 'bg-white text-[#1754E8] shadow-sm' : 'text-[#667085]'}`}>Open & reviewing</button><button type="button" onClick={() => setStatus('RESOLVED')} className={`rounded-md px-3 py-2 text-xs font-black ${status === 'RESOLVED' ? 'bg-white text-[#1754E8] shadow-sm' : 'text-[#667085]'}`}>Resolved</button></div>
      <select value={selectedCommunity} onChange={(event) => setSelectedCommunity(event.target.value)} className="h-10 rounded-lg border border-[#CCD7E5] bg-white px-3 text-xs font-bold text-[#344054] outline-none focus:border-[#1754E8]"><option value="ALL">All authorised communities</option>{data.communities.map((community) => <option key={community.id} value={community.id}>{community.name}</option>)}</select>
    </div>

    {error && <div role="alert" className="flex items-start justify-between rounded-xl border border-[#F1CBC7] bg-[#FFF7F6] p-3 text-sm font-semibold text-[#9F2D24]"><span>{error}</span><button type="button" onClick={() => setError(null)} aria-label="Dismiss"><X className="h-4 w-4" /></button></div>}

    {loading ? <div className="space-y-3">{[1,2,3].map((item) => <div key={item} className="h-52 animate-pulse rounded-2xl border border-[#E1E7EF] bg-white" />)}</div> : filtered.length ? <div className="space-y-3">{filtered.map((item) => <article key={item.id} className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_6px_20px_rgba(15,30,55,0.05)] sm:p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase ${item.severity === 'CRITICAL' ? 'bg-[#FBE5E2] text-[#A5281D]' : item.severity === 'HIGH' ? 'bg-[#FFF0DD] text-[#9A5E00]' : 'bg-[#EEF2F7] text-[#667085]'}`}>{item.severity}</span><span className="rounded-full bg-[#EAF0FF] px-2.5 py-1 text-[9px] font-black uppercase text-[#1754E8]">{pretty(item.status)}</span><span className="text-[10px] font-bold text-[#98A2B3]">{relativeTime(item.createdAt)}</span></div><h2 className="mt-3 text-sm font-black text-[#17223B]">{item.report?.reason ? pretty(item.report.reason) : 'Automated safety review'}</h2><p className="mt-1 text-xs font-semibold text-[#667085]">{item.community.name} · {pretty(item.community.type)}</p><div className="mt-3 rounded-xl border border-[#E7ECF2] bg-[#F9FBFD] p-3"><div className="flex items-center gap-2"><span className="text-xs font-black text-[#344054]">{item.message.author.name}</span><span className="text-[9px] font-black uppercase text-[#7A8698]">{pretty(item.message.author.role)}</span></div><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#53627A]">{item.message.body || '[No visible message text]'}</p></div>{item.report?.description && <p className="mt-3 text-xs leading-5 text-[#667085]"><strong className="text-[#344054]">Reporter context:</strong> {item.report.description}</p>}{item.actions.length > 0 && <div className="mt-3 border-t border-[#EEF1F5] pt-3"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#98A2B3]">Recent moderation history</p><div className="mt-2 flex flex-wrap gap-2">{item.actions.map((action) => <span key={action.id} className="rounded-lg bg-[#F5F7FA] px-2 py-1 text-[9px] font-semibold text-[#667085]">{pretty(action.actionType)} · {relativeTime(action.createdAt)}</span>)}</div></div>}</div>
        {status === 'ACTIVE' && <div className="grid shrink-0 grid-cols-2 gap-2 lg:w-[260px]"><ModerationButton icon={EyeOff} label="Hide" onClick={() => { setConfirm({ item, action: 'HIDE' }); setReason('Content requires temporary removal while under review.'); }} /><ModerationButton icon={Trash2} label="Remove" danger onClick={() => { setConfirm({ item, action: 'REMOVE' }); setReason('Content violates institutional community guidelines.'); }} /><ModerationButton icon={RotateCcw} label="Restore" onClick={() => { setConfirm({ item, action: 'RESTORE' }); setReason('Review found the content can be restored.'); }} /><ModerationButton icon={CheckCircle2} label="Close case" onClick={() => { setConfirm({ item, action: 'CLOSE_REPORT' }); setReason('Moderation review completed.'); }} /></div>}
      </div>
    </article>)}</div> : <div className="rounded-2xl border border-dashed border-[#CBD6E3] bg-white p-12 text-center"><ShieldCheck className="mx-auto h-10 w-10 text-[#7B91B1]" /><h2 className="mt-3 text-base font-black text-[#344054]">No cases in this view</h2><p className="mt-1 text-sm text-[#7A8698]">Only cases from academic communities you are authorised to moderate appear here.</p></div>}

    {confirm && <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#07132C]/60 p-4" onMouseDown={(event) => { if (event.currentTarget === event.target) setConfirm(null); }}><section role="dialog" aria-modal="true" aria-label={`${pretty(confirm.action)} moderation action`} className="w-full max-w-md rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8698]">Moderation action</p><h2 className="mt-1 text-lg font-black text-[#17223B]">{pretty(confirm.action)} message</h2></div><button type="button" onClick={() => setConfirm(null)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#D7E0EB]" aria-label="Close"><X className="h-4 w-4" /></button></div><p className="mt-4 rounded-xl bg-[#F7F9FC] p-3 text-xs leading-5 text-[#667085]">{confirm.item.message.body.slice(0, 220)}</p><label className="mt-4 block text-xs font-black text-[#344054]">Decision reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} maxLength={1000} className="mt-1.5 w-full rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal outline-none focus:border-[#1754E8]" /></label><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setConfirm(null)} className="h-10 rounded-lg border border-[#D7E0EB] px-4 text-xs font-black text-[#53627A]">Cancel</button><button type="button" disabled={workingId === confirm.item.id || reason.trim().length < 3} onClick={() => void performAction()} className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#1754E8] px-4 text-xs font-black text-white disabled:opacity-50">{workingId === confirm.item.id && <Loader2 className="h-4 w-4 animate-spin" />}Confirm</button></div></section></div>}
  </section>;
}

function Summary({ label, value }: { label: string; value: string }) { return <div className="min-w-[112px] rounded-xl border border-white/15 bg-white/5 px-3 py-2.5"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#91A7D6]">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>; }
function ModerationButton({ icon: Icon, label, onClick, danger = false }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; danger?: boolean }) { return <button type="button" onClick={onClick} className={`inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-[10px] font-black ${danger ? 'border-[#F0C7C2] bg-[#FFF7F6] text-[#A63D31] hover:bg-[#FDECEA]' : 'border-[#D7E0EB] bg-white text-[#53627A] hover:border-[#ABC1E8] hover:text-[#1754E8]'}`}><Icon className="h-3.5 w-3.5" />{label}</button>; }
function userMessage(action: ActionType) { if (action === 'HIDE') return 'This message is hidden while an authorised moderator reviews it.'; if (action === 'REMOVE') return 'This message was removed under the institution community guidelines.'; if (action === 'RESTORE') return 'This message was restored after moderation review.'; return 'The moderation review for this report has been completed.'; }
