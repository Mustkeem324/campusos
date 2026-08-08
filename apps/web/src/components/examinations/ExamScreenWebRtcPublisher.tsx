'use client';

import React from 'react';
import { AlertTriangle, Loader2, MonitorUp, Radio } from 'lucide-react';

import { publishWhipStream, type WebRtcSessionState, type WebRtcTransportHandle } from '@/lib/whip-whep-client';

type Grant = { endpointUrl: string; bearerToken: string; expiresAt: string };
type ApiError = { error?: string };

async function runtimeAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/runtime/action', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete screen-stream action.');
  return body;
}

export function ExamScreenWebRtcPublisher({ attemptId }: { attemptId: string }) {
  const [state, setState] = React.useState<WebRtcSessionState | 'IDLE'>('IDLE');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('This examination requires an approved screen stream. Start sharing the exam screen before continuing.');
  const handleRef = React.useRef<WebRtcTransportHandle | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);

  const stop = React.useCallback(async (finalState: 'ENDED' | 'FAILED' = 'ENDED') => {
    const handle = handleRef.current;
    handleRef.current = null;
    if (handle) await handle.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setState(finalState === 'FAILED' ? 'FAILED' : 'IDLE');
    await runtimeAction({ action: 'media_state', attemptId, streamKind: 'SCREEN', state: finalState }).catch(() => undefined);
  }, [attemptId]);

  React.useEffect(() => () => { void stop(); }, [stop]);

  async function start() {
    setBusy(true);
    try {
      if (handleRef.current) await stop();
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      streamRef.current = display;
      const track = display.getVideoTracks()[0];
      track?.addEventListener('ended', () => {
        setMessage('Screen sharing stopped. Restart the approved screen stream to keep the proctor view complete.');
        void stop();
      }, { once: true });
      const grant = await runtimeAction({ action: 'media_grant', attemptId, streamKind: 'SCREEN', permission: 'PUBLISH' }) as unknown as Grant;
      const handle = await publishWhipStream({
        endpointUrl: grant.endpointUrl,
        bearerToken: grant.bearerToken,
        stream: display,
        onState: (next, detail) => {
          setState(next);
          const mapped = next === 'CONNECTED' ? 'LIVE' : next === 'DEGRADED' ? 'DEGRADED' : next === 'FAILED' ? 'FAILED' : 'PUBLISHING';
          void runtimeAction({ action: 'media_state', attemptId, streamKind: 'SCREEN', state: mapped, error: detail || null }).catch(() => undefined);
          if (next === 'CONNECTED') setMessage('Approved screen stream is live to authorized proctors.');
          else if (detail) setMessage(detail);
        },
      });
      handleRef.current = handle;
    } catch (error) {
      await stop('FAILED');
      setMessage(error instanceof Error ? error.message : 'Unable to start screen sharing.');
    } finally {
      setBusy(false);
    }
  }

  const connected = state === 'CONNECTED';
  if (!connected) {
    return (
      <div className="fixed inset-0 z-[65] flex items-center justify-center bg-slate-950/88 p-4 backdrop-blur-sm">
        <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 text-white shadow-2xl sm:p-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300"><MonitorUp className="h-6 w-6" /></span>
          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.13em] text-amber-300">Required proctor stream</p>
          <h2 className="mt-2 text-2xl font-black">Share the approved exam screen</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
          <p className="mt-4 text-xs leading-5 text-slate-400">NAVEMORA uses the browser&apos;s explicit screen-sharing permission. The question workspace remains covered if the required stream stops. A screen-stream failure is handled as a technical/review condition, not an automatic cheating verdict.</p>
          <button onClick={() => void start()} disabled={busy} className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-extrabold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MonitorUp className="h-4 w-4" />}{state === 'FAILED' ? 'Retry screen stream' : 'Share exam screen'}</button>
          {state === 'FAILED' && <AlertTriangle className="mt-3 h-4 w-4 text-red-400" />}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-start gap-3"><span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><Radio className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="text-[11px] font-extrabold">Screen proctor stream · live</p><p className="mt-1 text-[10px] leading-4 text-slate-500">{message}</p></div></div>
    </div>
  );
}