'use client';

import Link from 'next/link';
import React from 'react';
import { AlertTriangle, ArrowLeft, Bot, Camera, Loader2, MonitorUp, Phone, Radio, RefreshCw, ShieldAlert, Video } from 'lucide-react';

import { subscribeWhepStream, type WebRtcSessionState, type WebRtcTransportHandle } from '@/lib/whip-whep-client';

type StreamKind = 'PRIMARY' | 'SECONDARY' | 'SCREEN';

type RuntimeView = {
  attemptId: string;
  policy: {
    aiVisionEnabled: boolean;
    secureClientRequired: boolean;
    primaryStreamRequired: boolean;
    secondaryStreamRequired: boolean;
    screenStreamRequired: boolean;
  };
  media: Array<{ kind: string; status: string; lastHeartbeatAt: string | null; lastError: string | null }>;
  events: Array<{ id: string; source: string; eventType: string; severity: string; metadata: unknown; occurredAt: string; reviewedAt: string | null }>;
  findings: Array<{ id: string; eventType: string; severity: string; confidence: number | null; model: string | null; rationale: string | null; createdAt: string }>;
};

type Grant = { endpointUrl: string; bearerToken: string; expiresAt: string };
type ApiError = { error?: string };

async function runtimeAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/runtime/action', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete realtime proctoring action.');
  return body;
}

function MediaTile({ attemptId, kind, label, required }: { attemptId: string; kind: StreamKind; label: string; required: boolean }) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const handleRef = React.useRef<WebRtcTransportHandle | null>(null);
  const [state, setState] = React.useState<WebRtcSessionState | 'WAITING'>('WAITING');
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!required) return;
    let cancelled = false;
    let retryTimer: number | null = null;

    async function connect() {
      if (cancelled || !videoRef.current) return;
      setError(null);
      try {
        const grant = await runtimeAction({ action: 'media_grant', attemptId, streamKind: kind, permission: 'READ' }) as unknown as Grant;
        if (cancelled || !videoRef.current) return;
        const handle = await subscribeWhepStream({
          endpointUrl: grant.endpointUrl,
          bearerToken: grant.bearerToken,
          videoElement: videoRef.current,
          includeAudio: false,
          onState: (next, detail) => {
            setState(next);
            if (detail) setError(detail);
          },
        });
        if (cancelled) {
          await handle.close();
          return;
        }
        handleRef.current = handle;
      } catch (connectError) {
        const message = connectError instanceof Error ? connectError.message : 'Unable to open live media.';
        setState('WAITING');
        setError(message);
        retryTimer = window.setTimeout(() => { void connect(); }, 5000);
      }
    }

    void connect();
    return () => {
      cancelled = true;
      if (retryTimer !== null) window.clearTimeout(retryTimer);
      const handle = handleRef.current;
      handleRef.current = null;
      if (handle) void handle.close();
    };
  }, [attemptId, kind, required]);

  if (!required) return null;
  const Icon = kind === 'PRIMARY' ? Camera : kind === 'SECONDARY' ? Phone : MonitorUp;
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-black dark:border-slate-800">
      <div className="flex items-center justify-between border-b border-white/10 bg-slate-950 px-4 py-3 text-white"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-blue-300" /><p className="text-xs font-extrabold">{label}</p></div><span className={`flex items-center gap-1.5 text-[10px] font-bold ${state === 'CONNECTED' ? 'text-emerald-300' : state === 'FAILED' ? 'text-red-300' : 'text-amber-300'}`}><Radio className="h-3 w-3" />{state.toLowerCase()}</span></div>
      <div className="relative aspect-video bg-black"><video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-contain" />{state !== 'CONNECTED' && <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70 px-6 text-center"><Loader2 className={`h-7 w-7 text-slate-400 ${state === 'CONNECTING' ? 'animate-spin' : ''}`} /><p className="text-xs font-semibold text-slate-300">{error || 'Waiting for student media publisher…'}</p></div>}</div>
    </section>
  );
}

function Severity({ value }: { value: string }) {
  const style = value === 'HIGH' ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300' : value === 'MEDIUM' ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`rounded-full px-2 py-1 text-[9px] font-black uppercase ${style}`}>{value}</span>;
}

export function LiveProctorAttempt({ attemptId }: { attemptId: string }) {
  const [view, setView] = React.useState<RuntimeView | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const response = await fetch(`/api/examinations/proctoring/runtime/proctor/${encodeURIComponent(attemptId)}`, { cache: 'no-store' });
    const body = await response.json().catch(() => ({})) as RuntimeView & ApiError;
    if (!response.ok) throw new Error(body.error || 'Unable to load live proctoring runtime.');
    setView(body);
    setError(null);
  }, [attemptId]);

  React.useEffect(() => {
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load live proctoring.')).finally(() => setLoading(false));
    const timer = window.setInterval(() => { void load().catch(() => undefined); }, 5000);
    return () => window.clearInterval(timer);
  }, [load]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>;
  if (!view) return <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error || 'Live proctoring view is unavailable.'}</div>;

  const requiredStreams = [view.policy.primaryStreamRequired, view.policy.secondaryStreamRequired, view.policy.screenStreamRequired].filter(Boolean).length;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-slate-800 lg:flex-row lg:items-end lg:justify-between"><div><Link href="/examinations/proctor" className="inline-flex items-center gap-2 text-xs font-extrabold text-blue-700"><ArrowLeft className="h-4 w-4" />Live sessions</Link><p className="mt-4 text-[10px] font-black uppercase tracking-[0.13em] text-blue-700">Authorized proctor view</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">Live examination workspace</h1><p className="mt-2 text-sm text-slate-500">{requiredStreams} required media stream{requiredStreams === 1 ? '' : 's'} · human review remains authoritative.</p></div><button onClick={() => void load()} className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-slate-200 px-4 text-xs font-extrabold dark:border-slate-700"><RefreshCw className="h-4 w-4" />Refresh signals</button></header>

      {error && <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>}

      <div className="grid gap-4 xl:grid-cols-2">
        <MediaTile attemptId={attemptId} kind="PRIMARY" label="Primary camera" required={view.policy.primaryStreamRequired} />
        <MediaTile attemptId={attemptId} kind="SECONDARY" label="3D Eyes secondary camera" required={view.policy.secondaryStreamRequired} />
        <MediaTile attemptId={attemptId} kind="SCREEN" label="Approved screen stream" required={view.policy.screenStreamRequired} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800"><div className="flex items-center gap-2"><Bot className="h-4 w-4 text-blue-700" /><p className="text-sm font-extrabold">AI-assisted vision signals</p></div><span className="text-[10px] font-bold text-slate-500">{view.policy.aiVisionEnabled ? 'Enabled' : 'Disabled'}</span></div>{!view.policy.aiVisionEnabled ? <p className="p-5 text-xs leading-5 text-slate-500">AI vision is not enabled for this examination.</p> : view.findings.length === 0 ? <p className="p-5 text-xs leading-5 text-slate-500">No AI-assisted findings have been reported. NAVEMORA does not fabricate detections when no inference worker/provider is configured.</p> : <div className="max-h-[430px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">{view.findings.map((finding) => <div key={finding.id} className="p-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-extrabold">{finding.eventType.replaceAll('_', ' ')}</p><Severity value={finding.severity} /></div><p className="mt-2 text-xs leading-5 text-slate-500">{finding.rationale || 'Provider signal queued for authorized human interpretation.'}</p><p className="mt-2 text-[10px] text-slate-400">{finding.model || 'Configured inference provider'}{finding.confidence !== null ? ` · confidence ${(finding.confidence * 100).toFixed(1)}%` : ''} · {new Date(finding.createdAt).toLocaleTimeString()}</p></div>)}</div>}<div className="border-t border-slate-100 bg-blue-50 p-4 text-[10px] leading-5 text-blue-800 dark:border-slate-800 dark:bg-blue-950/20 dark:text-blue-200"><b>Human review required:</b> AI findings are attention signals only and cannot automatically fail, remove, suspend, or accuse a student.</div></section>

        <section className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center gap-2 border-b border-slate-100 p-4 dark:border-slate-800"><ShieldAlert className="h-4 w-4 text-amber-700" /><p className="text-sm font-extrabold">Event timeline</p></div>{view.events.length === 0 ? <p className="p-5 text-xs text-slate-500">No proctoring events recorded.</p> : <div className="max-h-[500px] divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">{view.events.map((event) => <div key={event.id} className="p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-extrabold">{event.eventType.replaceAll('_', ' ')}</p><p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400">{event.source} · {new Date(event.occurredAt).toLocaleTimeString()}</p></div><Severity value={event.severity} /></div></div>)}</div>}</section>
      </div>

      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs leading-5 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><Video className="mt-0.5 h-4 w-4 shrink-0 text-blue-700" /><p>Live feeds are scoped to this assigned examination attempt. Media access grants are short lived; leaving this view closes the browser-side WHEP sessions.</p></div>
    </div>
  );
}
