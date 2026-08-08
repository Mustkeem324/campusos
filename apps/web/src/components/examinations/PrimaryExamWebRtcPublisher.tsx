'use client';

import React from 'react';
import { Radio, ShieldCheck } from 'lucide-react';

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
  const handleRef = React.useRef<WebRtcTransportHandle | null>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const mediaStateRef = React.useRef<'PUBLISHING' | 'LIVE' | 'DEGRADED' | 'FAILED'>('PUBLISHING');

  React.useEffect(() => {
    let cancelled = false;

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
  }, [attemptId]);

  if (state === 'DISABLED') return null;

  const healthy = state === 'CONNECTED';
  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-xs rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="flex items-start gap-3">
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${healthy ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
          {healthy ? <Radio className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
        </span>
        <div>
          <p className="text-[11px] font-extrabold text-slate-900 dark:text-white">Live proctor media · {state.toLowerCase()}</p>
          <p className="mt-1 text-[10px] leading-4 text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}