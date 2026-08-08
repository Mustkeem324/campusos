'use client';

import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  FileText,
  Gauge,
  Loader2,
  Mail,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

type Channel = { channel: string; enabled: boolean; provider_key: string | null; provider_mode: string; regulatory_config: unknown };
type Count = { channel: string; status: string; count: number };
type Usage = { channel: string; billingUnits: number; estimatedCostMinor: number; actualCostMinor: number | null; currency: string };
type Wallet = { channel: string; availableUnits: number; reservedUnits: number; usedUnits: number };
type Subscription = { channel: string; lifecycle: string; billingMode: string; monthlySpendLimitMinor: number | null };
type Template = { template_id: string; template_key: string; channel: string; category: string; security_classification: string; version_id: string | null; version: number | null; locale: string | null; status: string | null; subject_template: string | null; text_template: string | null; provider_template_name: string | null };
type Audit = { id: string; actor_role: string | null; action: string; target_type: string; target_id: string | null; reason: string | null; createdAt: string };
type Failure = { id: string; channel: string; failure_code: string | null; createdAt: string };
type Dashboard = { role: string; counts: Count[]; channels: Channel[]; usage: Usage[]; wallets: Wallet[]; subscriptions: Subscription[]; templateCatalog: Template[]; audit: Audit[]; failures: Failure[] };
type Tab = 'overview' | 'channels' | 'templates' | 'campaigns' | 'delivery' | 'billing' | 'audit';

async function api(path: string, init?: RequestInit) {
  const response = await fetch(path, { cache: 'no-store', ...init });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Communication request failed.');
  return body;
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-blue-700 dark:bg-slate-900">{icon}</span></div><p className="mt-4 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">{value}</p></div>;
}

function Status({ value }: { value: string }) {
  const positive = ['ACTIVE','AVAILABLE','DELIVERED','READ','SUBMITTED','APPROVED'].includes(value);
  const negative = ['FAILED','DEAD_LETTER','UNAVAILABLE','MISCONFIGURED','REJECTED','SUSPENDED'].includes(value);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${positive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300' : negative ? 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300' : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>{value.replaceAll('_',' ')}</span>;
}

export function CommunicationsAdminConsole() {
  const [data, setData] = React.useState<Dashboard | null>(null);
  const [tab, setTab] = React.useState<Tab>('overview');
  const [loading, setLoading] = React.useState(true);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [templateForm, setTemplateForm] = React.useState({ templateKey: 'institution_notice', channel: 'EMAIL', category: 'ACADEMIC', classification: 'INTERNAL', locale: 'en-IN', subject: 'Important update from {{institution.name}}', text: 'An institutional update is available in NAVEMORA.' });
  const [campaign, setCampaign] = React.useState({ name: '', category: 'ACADEMIC', classification: 'INTERNAL', channels: ['EMAIL','IN_APP'] as string[], audienceType: 'ALL_STUDENTS', subject: '', body: '' });
  const [campaignResult, setCampaignResult] = React.useState<Record<string, unknown> | null>(null);

  const load = React.useCallback(async () => {
    const result = await api('/api/communications/admin/dashboard') as unknown as Dashboard;
    setData(result);
    setMessage(null);
  }, []);

  React.useEffect(() => { void load().catch((error) => setMessage(error instanceof Error ? error.message : 'Unable to load communications.')).finally(() => setLoading(false)); }, [load]);

  async function action(payload: Record<string, unknown>) {
    setBusy(true); setMessage(null);
    try {
      const result = await api('/api/communications/admin/actions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      await load();
      return result;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Communication action failed.');
      throw error;
    } finally { setBusy(false); }
  }

  async function toggleChannel(channel: Channel) {
    await action({ action:'configure_channel', channel:channel.channel, enabled:!channel.enabled, providerKey:channel.provider_key, providerMode:channel.provider_mode, regulatoryConfig:channel.regulatory_config });
  }

  async function createTemplate() {
    await action({ action:'create_template', ...templateForm });
    setMessage('Template draft created. Activate it after review.');
  }

  async function createCampaign() {
    const result = await action({ action:'create_campaign', name:campaign.name, category:campaign.category, classification:campaign.classification, channels:campaign.channels, audience:{ type:campaign.audienceType }, subject:campaign.subject, body:campaign.body });
    setCampaignResult(result);
    setMessage(`Campaign created with status ${String(result.status || '')}.`);
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>;
  if (!data) return <div className="mx-auto max-w-5xl p-8"><div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{message || 'Communications are unavailable.'}</div></div>;

  const sent = data.counts.filter((item) => ['SUBMITTED','SENT','DELIVERED','READ'].includes(item.status)).reduce((sum,item)=>sum+item.count,0);
  const delivered = data.counts.filter((item) => ['DELIVERED','READ'].includes(item.status)).reduce((sum,item)=>sum+item.count,0);
  const failures = data.counts.filter((item) => ['FAILED','DEAD_LETTER'].includes(item.status)).reduce((sum,item)=>sum+item.count,0);
  const pending = data.counts.filter((item) => ['PENDING','RETRYING','PROCESSING','SCHEDULED'].includes(item.status)).reduce((sum,item)=>sum+item.count,0);
  const tabs: Array<{id:Tab; label:string}> = [
    {id:'overview',label:'Overview'},{id:'channels',label:'Channels'},{id:'templates',label:'Templates'},
    {id:'campaigns',label:'Campaigns'},{id:'delivery',label:'Delivery logs'},{id:'billing',label:'Usage & billing'},{id:'audit',label:'Audit'},
  ];

  return <div className="mx-auto max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-blue-700"><MessageSquareText className="h-4 w-4"/><p className="text-[10px] font-black uppercase tracking-[0.14em]">NAVEMORA Communications</p></div><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-slate-950 dark:text-white">Omnichannel communication control</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Email, SMS, WhatsApp and in-app delivery from one tenant-safe policy engine. Paid channels remain disabled until a platform subscription is active.</p></div><button onClick={()=>void load()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 px-4 text-xs font-extrabold dark:border-slate-700"><RefreshCw className="h-4 w-4"/>Refresh</button></header>
    {message && <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">{message}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Stat label="Submitted / sent" value={sent} icon={<Send className="h-4 w-4"/>}/><Stat label="Delivered" value={delivered} icon={<CheckCircle2 className="h-4 w-4"/>}/><Stat label="Queue" value={pending} icon={<Gauge className="h-4 w-4"/>}/><Stat label="Failed" value={failures} icon={<AlertTriangle className="h-4 w-4"/>}/></div>
    <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 dark:border-slate-800 dark:bg-slate-950">{tabs.map((item)=><button key={item.id} onClick={()=>setTab(item.id)} className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-[11px] font-extrabold ${tab===item.id?'bg-[#081B3A] text-white dark:bg-white dark:text-slate-950':'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}`}>{item.label}</button>)}</nav>

    {tab==='overview' && <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]"><section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-extrabold">Channel health</p></div><div className="divide-y divide-slate-100 dark:divide-slate-800">{data.channels.map((ch)=><div key={ch.channel} className="flex items-center justify-between gap-4 p-4"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-blue-700 dark:bg-slate-900">{ch.channel==='EMAIL'?<Mail className="h-4 w-4"/>:ch.channel==='SMS'?<Smartphone className="h-4 w-4"/>:ch.channel==='WHATSAPP'?<MessageCircle className="h-4 w-4"/>:<Bell className="h-4 w-4"/>}</span><div><p className="text-xs font-extrabold">{ch.channel}</p><p className="mt-1 text-[10px] text-slate-500">{ch.provider_key || 'Provider not selected'} · {ch.provider_mode}</p></div></div><Status value={ch.enabled?'ACTIVE':'DISABLED'}/></div>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-blue-700"/><div><p className="text-sm font-extrabold">Operational guardrails</p><p className="mt-1 text-xs leading-5 text-slate-500">Recipient relationships, preferences, consent, paid-channel entitlement and tenant isolation are evaluated before queueing. Delivery/read states come from workers/providers, never the browser.</p></div></div><div className="mt-5 space-y-2 text-xs text-slate-600 dark:text-slate-300"><p>• HTML + plain-text email rendering</p><p>• SMS/WhatsApp credit reservation</p><p>• Retry/dead-letter processing</p><p>• Signed provider webhooks</p><p>• High-risk campaign maker-checker</p></div></section></div>}

    {tab==='channels' && <section className="grid gap-4 lg:grid-cols-2">{data.channels.map((ch)=><article key={ch.channel} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start justify-between"><div><p className="text-base font-extrabold">{ch.channel}</p><p className="mt-1 text-xs text-slate-500">{ch.provider_key || 'No provider selected'} · {ch.provider_mode.replaceAll('_',' ')}</p></div><Status value={ch.enabled?'ACTIVE':'DISABLED'}/></div><button onClick={()=>void toggleChannel(ch)} disabled={busy} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold disabled:opacity-50 dark:border-slate-700"><Settings2 className="h-4 w-4"/>{ch.enabled?'Disable channel':'Enable channel'}</button>{['SMS','WHATSAPP'].includes(ch.channel)&&<p className="mt-3 text-[10px] leading-4 text-slate-500">Paid channel activation and credits are controlled by NAVEMORA platform billing. Regulatory sender/template identifiers must be configured before live sending.</p>}</article>)}</section>}

    {tab==='templates' && <div className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">Create template version</p><div className="mt-4 grid gap-3"><input value={templateForm.templateKey} onChange={(e)=>setTemplateForm({...templateForm,templateKey:e.target.value})} placeholder="template_key" className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"/><div className="grid grid-cols-2 gap-2"><select value={templateForm.channel} onChange={(e)=>setTemplateForm({...templateForm,channel:e.target.value})} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option>EMAIL</option><option>SMS</option><option>WHATSAPP</option><option>IN_APP</option></select><select value={templateForm.category} onChange={(e)=>setTemplateForm({...templateForm,category:e.target.value})} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900">{['ACADEMIC','ATTENDANCE','EXAMINATION','FINANCE','ADMISSIONS','HOSTEL','TRANSPORT','LIBRARY','RESEARCH','HR','EVENTS','HELPDESK','PLATFORM','SECURITY','EMERGENCY','MARKETING'].map(x=><option key={x}>{x}</option>)}</select></div><input value={templateForm.subject} onChange={(e)=>setTemplateForm({...templateForm,subject:e.target.value})} placeholder="Email subject" className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"/><textarea value={templateForm.text} onChange={(e)=>setTemplateForm({...templateForm,text:e.target.value})} rows={7} className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-900"/><button disabled={busy} onClick={()=>void createTemplate()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50"><FileText className="h-4 w-4"/>Save draft version</button></div></section><section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-extrabold">Institution templates</p></div><div className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">{data.templateCatalog.map((t)=><div key={`${t.template_id}:${t.version_id}`} className="grid gap-2 p-4 md:grid-cols-[1fr_auto_auto]"><div><p className="text-xs font-extrabold">{t.template_key}</p><p className="mt-1 text-[10px] text-slate-500">{t.channel} · {t.category} · {t.locale||'—'} · v{t.version||'—'}</p></div><Status value={t.status||'NO_VERSION'}/>{t.version_id&&t.status!=='ACTIVE'?<button disabled={busy} onClick={()=>void action({action:'activate_template',versionId:t.version_id})} className="h-8 rounded-lg border border-slate-200 px-3 text-[10px] font-extrabold dark:border-slate-700">Activate</button>:<span/>}</div>)}{data.templateCatalog.length===0&&<p className="p-6 text-xs text-slate-500">No institution overrides yet. NAVEMORA base templates remain available.</p>}</div></section></div>}

    {tab==='campaigns' && <div className="grid gap-5 xl:grid-cols-[.8fr_1.2fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">Create institutional campaign</p><p className="mt-1 text-[10px] leading-4 text-slate-500">Large or paid-channel sends are created as review-pending and require maker-checker approval.</p><div className="mt-4 grid gap-3"><input value={campaign.name} onChange={(e)=>setCampaign({...campaign,name:e.target.value})} placeholder="Campaign name" className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"/><div className="grid grid-cols-2 gap-2"><select value={campaign.category} onChange={(e)=>setCampaign({...campaign,category:e.target.value})} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900">{['ACADEMIC','ATTENDANCE','EXAMINATION','FINANCE','HOSTEL','TRANSPORT','LIBRARY','EVENTS','EMERGENCY'].map(x=><option key={x}>{x}</option>)}</select><select value={campaign.audienceType} onChange={(e)=>setCampaign({...campaign,audienceType:e.target.value})} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option>ALL_STUDENTS</option><option>ALL_PARENTS</option><option>ALL_FACULTY</option><option>ALL_STAFF</option></select></div><div className="flex flex-wrap gap-2">{['EMAIL','IN_APP','SMS','WHATSAPP'].map((channel)=><label key={channel} className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-[10px] font-bold dark:border-slate-700"><input type="checkbox" checked={campaign.channels.includes(channel)} onChange={(e)=>setCampaign({...campaign,channels:e.target.checked?[...campaign.channels,channel]:campaign.channels.filter(x=>x!==channel)})}/>{channel}</label>)}</div><input value={campaign.subject} onChange={(e)=>setCampaign({...campaign,subject:e.target.value})} placeholder="Subject" className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"/><textarea value={campaign.body} onChange={(e)=>setCampaign({...campaign,body:e.target.value})} rows={7} placeholder="Message" className="rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-700 dark:bg-slate-900"/><button disabled={busy||!campaign.name||!campaign.body} onClick={()=>void createCampaign()} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50"><Send className="h-4 w-4"/>Create campaign</button></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">Latest creation</p>{campaignResult?<div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900"><pre className="whitespace-pre-wrap break-words text-[10px] text-slate-600 dark:text-slate-300">{JSON.stringify(campaignResult,null,2)}</pre>{campaignResult.campaignId&&<div className="mt-4 flex flex-wrap gap-2"><button disabled={busy} onClick={()=>void action({action:'estimate_campaign',campaignId:campaignResult.campaignId}).then(setCampaignResult)} className="h-9 rounded-lg border border-slate-200 px-3 text-[10px] font-extrabold dark:border-slate-700">Recalculate cost</button>{campaignResult.status==='APPROVED'&&<button disabled={busy} onClick={()=>void action({action:'dispatch_campaign',campaignId:campaignResult.campaignId}).then(setCampaignResult)} className="h-9 rounded-lg bg-blue-700 px-3 text-[10px] font-extrabold text-white">Queue approved campaign</button>}</div>}</div>:<p className="mt-4 text-xs text-slate-500">No campaign created in this session.</p>}</section></div>}

    {tab==='delivery' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-extrabold">Recent delivery failures</p></div>{data.failures.length?<div className="divide-y divide-slate-100 dark:divide-slate-800">{data.failures.map((f)=><div key={f.id} className="grid gap-2 p-4 sm:grid-cols-[120px_1fr_auto]"><p className="text-xs font-extrabold">{f.channel}</p><p className="text-xs text-slate-500">{f.failure_code||'UNKNOWN'}</p><time className="text-[10px] text-slate-400">{new Date(f.createdAt).toLocaleString()}</time></div>)}</div>:<p className="p-6 text-xs text-slate-500">No failed/dead-letter messages in the current view.</p>}</section>}

    {tab==='billing' && <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-blue-700"/><p className="text-sm font-extrabold">Paid channel wallets</p></div><div className="mt-4 space-y-3">{['SMS','WHATSAPP'].map((channel)=>{const wallet=data.wallets.find(x=>x.channel===channel);const sub=data.subscriptions.find(x=>x.channel===channel);return <div key={channel} className="rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div className="flex justify-between"><p className="text-xs font-extrabold">{channel}</p><Status value={sub?.lifecycle||'NOT_ACTIVE'}/></div><div className="mt-4 grid grid-cols-3 gap-3 text-center"><div><p className="text-lg font-black">{wallet?.availableUnits??0}</p><p className="text-[9px] text-slate-500">Available</p></div><div><p className="text-lg font-black">{wallet?.reservedUnits??0}</p><p className="text-[9px] text-slate-500">Reserved</p></div><div><p className="text-lg font-black">{wallet?.usedUnits??0}</p><p className="text-[9px] text-slate-500">Used</p></div></div></div>})}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">This month usage</p><div className="mt-4 space-y-3">{data.usage.map((u)=><div key={u.channel} className="flex items-center justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800"><div><p className="text-xs font-extrabold">{u.channel}</p><p className="mt-1 text-[10px] text-slate-500">{u.billingUnits} billing units</p></div><div className="text-right"><p className="text-xs font-black">{u.currency} {(u.estimatedCostMinor/100).toFixed(2)}</p><p className="text-[9px] text-slate-500">Estimated</p></div></div>)}{data.usage.length===0&&<p className="text-xs text-slate-500">No paid-channel usage yet.</p>}</div></section></div>}

    {tab==='audit' && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-extrabold">Communication audit</p></div><div className="max-h-[650px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">{data.audit.map((a)=><div key={a.id} className="grid gap-2 p-4 md:grid-cols-[160px_1fr_160px]"><div><p className="text-[10px] font-black text-blue-700">{a.actor_role||'SYSTEM'}</p><p className="mt-1 text-[9px] text-slate-400">{a.target_type}</p></div><div><p className="text-xs font-extrabold">{a.action.replaceAll('_',' ')}</p>{a.reason&&<p className="mt-1 text-[10px] text-slate-500">{a.reason}</p>}</div><time className="text-[10px] text-slate-400 md:text-right">{new Date(a.createdAt).toLocaleString()}</time></div>)}{data.audit.length===0&&<p className="p-6 text-xs text-slate-500">No communication audit events yet.</p>}</div></section>}
  </div>;
}
