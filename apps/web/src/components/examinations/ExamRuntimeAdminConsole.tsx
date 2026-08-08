'use client';

import React from 'react';
import { Copy, Cpu, KeyRound, Loader2, MonitorUp, Phone, Radio, RefreshCw, Save, ShieldCheck, Video } from 'lucide-react';

type RuntimeConfig = {
  configId: string;
  examName: string;
  deliveryMode: string;
  primaryStreamRequired: boolean;
  secondaryStreamRequired: boolean;
  screenStreamRequired: boolean;
  aiVisionEnabled: boolean;
  secureClientRequired: boolean;
  secureClientPolicyVersion: string;
  sampleIntervalSeconds: number;
};

type RuntimeDevice = {
  id: string;
  label: string;
  platform: string;
  fingerprint: string;
  status: string;
  lastSeenAt: string | null;
  createdAt: string;
};

type RuntimeAdmin = { configs: RuntimeConfig[]; devices: RuntimeDevice[] };
type Enrollment = { code: string; expiresAt: string; maxUses: number } | null;
type ApiError = { error?: string };

async function request(payload?: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/runtime/action', payload ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  } : { cache: 'no-store' });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to load secure examination runtime.');
  return body;
}

function Toggle({ checked, onChange, label, icon }: { checked: boolean; onChange: (value: boolean) => void; label: string; icon: React.ReactNode }) {
  return <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"><span className="flex items-center gap-2 text-xs font-extrabold">{icon}{label}</span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="h-4 w-4" /></label>;
}

function RuntimeCard({ initial, onSaved }: { initial: RuntimeConfig; onSaved: () => Promise<void> }) {
  const [config, setConfig] = React.useState(initial);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => setConfig(initial), [initial]);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await request({
        action: 'runtime_policy',
        configId: config.configId,
        primaryStreamRequired: config.primaryStreamRequired,
        secondaryStreamRequired: config.secondaryStreamRequired,
        screenStreamRequired: config.screenStreamRequired,
        aiVisionEnabled: config.aiVisionEnabled,
        secureClientRequired: config.secureClientRequired,
        secureClientPolicyVersion: config.secureClientPolicyVersion,
        sampleIntervalSeconds: config.sampleIntervalSeconds,
        maxProctorReaders: 20,
      });
      setMessage('Runtime policy saved.');
      await onSaved();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save runtime policy.');
    } finally {
      setBusy(false);
    }
  }

  return <article className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-base font-extrabold text-slate-950 dark:text-white">{config.examName}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{config.deliveryMode.replaceAll('_', ' ')}</p></div><span className="rounded-full border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500 dark:border-slate-700">WHIP / WHEP</span></div>
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      <Toggle checked={config.primaryStreamRequired} onChange={(value) => setConfig((current) => ({ ...current, primaryStreamRequired: value }))} label="Primary camera" icon={<Video className="h-4 w-4 text-blue-700" />} />
      <Toggle checked={config.secondaryStreamRequired} onChange={(value) => setConfig((current) => ({ ...current, secondaryStreamRequired: value }))} label="3D Eyes" icon={<Phone className="h-4 w-4 text-orange-700" />} />
      <Toggle checked={config.screenStreamRequired} onChange={(value) => setConfig((current) => ({ ...current, screenStreamRequired: value }))} label="Screen stream" icon={<MonitorUp className="h-4 w-4 text-indigo-700" />} />
      <Toggle checked={config.aiVisionEnabled} onChange={(value) => setConfig((current) => ({ ...current, aiVisionEnabled: value }))} label="AI vision worker" icon={<Cpu className="h-4 w-4 text-violet-700" />} />
      <Toggle checked={config.secureClientRequired} onChange={(value) => setConfig((current) => ({ ...current, secureClientRequired: value }))} label="Managed secure client" icon={<ShieldCheck className="h-4 w-4 text-emerald-700" />} />
    </div>
    <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Client policy version<input value={config.secureClientPolicyVersion} onChange={(event) => setConfig((current) => ({ ...current, secureClientPolicyVersion: event.target.value.slice(0, 50) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900" /></label><label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">AI sample interval (seconds)<input type="number" min="5" max="300" value={config.sampleIntervalSeconds} onChange={(event) => setConfig((current) => ({ ...current, sampleIntervalSeconds: Number(event.target.value) }))} className="mt-1 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs normal-case tracking-normal dark:border-slate-700 dark:bg-slate-900" /></label></div>
    <div className="mt-4 flex flex-wrap items-center gap-3"><button onClick={() => void save()} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Save runtime policy</button>{message && <p className="text-xs font-semibold text-slate-500">{message}</p>}</div>
  </article>;
}

export function ExamRuntimeAdminConsole() {
  const [data, setData] = React.useState<RuntimeAdmin | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [enrollment, setEnrollment] = React.useState<Enrollment>(null);
  const [enrollmentLabel, setEnrollmentLabel] = React.useState('Managed examination device');
  const [enrollmentUses, setEnrollmentUses] = React.useState(1);
  const [enrollmentBusy, setEnrollmentBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    const body = await request() as unknown as RuntimeAdmin;
    setData(body);
    setError(null);
  }, []);

  React.useEffect(() => {
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load runtime administration.')).finally(() => setLoading(false));
  }, [load]);

  async function createEnrollment() {
    setEnrollmentBusy(true);
    try {
      const result = await request({ action: 'create_client_enrollment', label: enrollmentLabel, expiresMinutes: 60, maxUses: enrollmentUses }) as unknown as NonNullable<Enrollment>;
      setEnrollment(result);
      await load();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Unable to create enrollment code.');
    } finally {
      setEnrollmentBusy(false);
    }
  }

  async function copyEnrollment() {
    if (!enrollment) return;
    await navigator.clipboard.writeText(enrollment.code);
  }

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>;

  return <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
    <header className="flex flex-col gap-4 border-b border-slate-200 pb-6 dark:border-slate-800 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Radio className="h-4 w-4 text-blue-700" /><p className="text-[10px] font-black uppercase tracking-[0.13em] text-blue-700">Secure exam runtime</p></div><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Media, AI & managed client</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Configure live WebRTC streams, provider-backed AI vision sampling, and institution-enrolled secure-client attestation per examination. No AI signal is an automatic misconduct verdict.</p></div><button onClick={() => void load()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 px-4 text-xs font-extrabold dark:border-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button></header>

    {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{error}</div>}

    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-start gap-3"><KeyRound className="mt-0.5 h-5 w-5 text-blue-700" /><div><p className="text-sm font-extrabold">Enroll managed secure-client devices</p><p className="mt-1 text-xs leading-5 text-slate-500">Create a short-lived institution code. The client generates its private Ed25519 key locally and uploads only the public key.</p></div></div><div className="mt-4 grid gap-2 sm:grid-cols-[1fr_140px_auto]"><input value={enrollmentLabel} onChange={(event) => setEnrollmentLabel(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /><input type="number" min="1" max="1000" value={enrollmentUses} onChange={(event) => setEnrollmentUses(Number(event.target.value))} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /><button onClick={() => void createEnrollment()} disabled={enrollmentBusy} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50">{enrollmentBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Create code</button></div>{enrollment && <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[9px] font-bold uppercase tracking-wider text-emerald-700">Enrollment code</p><p className="mt-1 break-all font-mono text-sm font-black text-emerald-900 dark:text-emerald-200">{enrollment.code}</p><p className="mt-1 text-[10px] text-slate-500">Expires {new Date(enrollment.expiresAt).toLocaleString()} · max uses {enrollment.maxUses}</p></div><button onClick={() => void copyEnrollment()} className="inline-flex h-9 items-center gap-2 self-start rounded-lg border border-emerald-300 px-3 text-[10px] font-extrabold text-emerald-800"><Copy className="h-3.5 w-3.5" />Copy</button></div>}</section>

    <section><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-extrabold">Examination runtime policies</h2><span className="text-[10px] text-slate-500">{data?.configs.length ?? 0} configs</span></div><div className="grid gap-4 xl:grid-cols-2">{data?.configs.map((config) => <RuntimeCard key={config.configId} initial={config} onSaved={load} />)}</div>{data?.configs.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500 dark:border-slate-700">Create a secure examination configuration first.</div>}</section>

    <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-100 p-4 dark:border-slate-800"><p className="text-sm font-extrabold">Enrolled secure-client devices</p></div>{data?.devices.length ? <div className="divide-y divide-slate-100 dark:divide-slate-800">{data.devices.map((device) => <div key={device.id} className="grid gap-2 p-4 sm:grid-cols-[1fr_1fr_auto]"><div><p className="text-xs font-extrabold">{device.label}</p><p className="mt-1 text-[10px] text-slate-500">{device.platform}</p></div><div><p className="break-all font-mono text-[9px] text-slate-500">{device.fingerprint}</p><p className="mt-1 text-[10px] text-slate-400">Last seen {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'never'}</p></div><span className="self-start rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-black uppercase text-slate-600 dark:border-slate-700 dark:text-slate-300">{device.status}</span></div>)}</div> : <p className="p-5 text-xs text-slate-500">No managed secure-client devices enrolled.</p>}</section>
  </div>;
}
