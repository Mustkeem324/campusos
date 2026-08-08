'use client';

import React from 'react';
import { Camera, Loader2, Radio, RefreshCw, ShieldCheck } from 'lucide-react';

import { publishWhipStream, type WebRtcSessionState, type WebRtcTransportHandle } from '@/lib/whip-whep-client';

type Grant = {
  endpointUrl: string;
  bearerToken: string;
  expiresAt: string;
};

async function runtimeAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/runtime/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Realtime examination media is unavailable.');
  return body;
}

export function PrimaryExamWebRtcPublisher({ attemptId }: { attemptId: string }) {
  const [state, setState] = React.useState<WebRtcSessionState | 'DISABLED'>('CONNECTING');
  const [detail, setDetail] = React.useState('Starting secure live camera…');
  const [retryNonce, setRetryNonce] = React.useState(0);
  const handleRef = React.useRef<WebRtcTransportHandle | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const mediaStateRef = React.useRef<'PUBLISHING' | 'LIVE' | 'DEGRADED' | 'FAILED'>('PUBLISHING');

  React.useEffect(() => {
    let cancelled = false;
    setState('CONNECTING');
    setDetail('Starting secure live camera…');
    mediaStateRef.current = 'PUBLISHING';

    async function start() {
      try {
        const grant = await runtimeAction({ action: 'media_grant', attemptId, streamKind: 'PRIMARY', permission: 'PUBLISH' }) as unknown as Grant;
        if (cancelled) return;
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        const handle = await publishWhipStream({
          endpointUrl: grant.endpointUrl,
          bearerToken: grant.bearerToken,
          stream,
          onState: (next, message) => {
            setState(next);
            setDetail(message || (next === 'CONNECTED' ? 'Primary camera is streaming to the authorized proctor media server.' : `Primary camera ${next.toLowerCase()}.`));
            const mapped = next === 'CONNECTED' ? 'LIVE' : next === 'DEGRADED' ? 'DEGRADED' : next === 'FAILED' ? 'FAILED' : 'PUBLISHING';
            mediaStateRef.current = mapped;
            void runtimeAction({ action: 'media_state', attemptId, streamKind: 'PRIMARY', state: mapped, error: message || null }).catch(() => undefined);
          },
        });
        if (cancelled) {
          await handle.close();
          return;
        }
        handleRef.current = handle;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to start secure live camera.';
        if (message.includes('not required')) {
          setState('DISABLED');
          setDetail('This examination does not require live primary-camera streaming.');
          return;
        }
        mediaStateRef.current = 'FAILED';
        setState('FAILED');
        setDetail(message);
        void runtimeAction({ action: 'media_state', attemptId, streamKind: 'PRIMARY', state: 'FAILED', error: message }).catch(() => undefined);
      }
    }

    void start();
    const heartbeat = window.setInterval(() => {
      if (handleRef.current && mediaStateRef.current !== 'FAILED') {
        const heartbeatState = mediaStateRef.current === 'DEGRADED' ? 'DEGRADED' : 'LIVE';
        void runtimeAction({ action: 'media_state', attemptId, streamKind: 'PRIMARY', state: heartbeatState }).catch(() => undefined);
      }
    }, 10_000);

    return () => {
      cancelled = true;
      window.clearInterval(heartbeat);
      const handle = handleRef.current;
      handleRef.current = null;
      if (handle) void handle.close();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      void runtimeAction({ action: 'media_state', attemptId, streamKind: 'PRIMARY', state: 'ENDED' }).catch(() => undefined);
    };
  }, [attemptId, retryNonce]);

  if (state === 'DISABLED') return null;

  if (state !== 'CONNECTED') {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">{state === 'CONNECTING' ? <Loader2 className="h-6 w-6 animate-spin" /> : <Camera className="h-6 w-6" />}</span>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.13em] text-blue-300">Required live proctor stream</p>
          <h2 className="mt-2 text-2xl font-black">Primary camera must be live</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{detail}</p>
          <p className="mt-4 text-xs leading-5 text-slate-400">The question workspace remains covered until the required camera establishes its authorized WebRTC connection. A media failure is a technical condition, not an automatic integrity verdict.</p>
          {state === 'FAILED' && <button onClick={() => setRetryNonce((value) => value + 1)} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white"><RefreshCw className="h-4 w-4" />Retry live camera</button>}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Radio className="h-4 w-4" /></span>
        <div><p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Primary proctor media · live</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p></div>
      </div>
    </div>
  );
}