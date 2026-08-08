'use client';

import React from 'react';
import { AlertTriangle, Camera, CheckCircle2, Loader2, Phone, Radio, RefreshCw, ShieldCheck, Wifi } from 'lucide-react';

import { publishWhipStream, type WebRtcSessionState, type WebRtcTransportHandle } from '@/lib/whip-whep-client';

type ApiError = { error?: string };

type PairResponse = {
  sessionId?: string;
  attemptId?: string;
  error?: string;
};

type MediaGrant = {
  endpointUrl: string;
  bearerToken: string;
  expiresAt: string;
};

async function action(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete 3D Eyes action.');
  return body;
}

async function runtimeAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/runtime/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete realtime 3D Eyes action.');
  return body;
}

export function ThreeDEyesCamera({ initialToken }: { initialToken?: string }) {
  const [token, setToken] = React.useState(initialToken ?? '');
  const [code, setCode] = React.useState('');
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string>('Pair this authenticated phone with the examination shown on your laptop.');
  const [cameraActive, setCameraActive] = React.useState(false);
  const [mediaState, setMediaState] = React.useState<WebRtcSessionState | 'IDLE'>('IDLE');
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const streamRef = React.useRef<MediaStream | null>(null);
  const transportRef = React.useRef<WebRtcTransportHandle | null>(null);
  const mediaStateRef = React.useRef<'PUBLISHING' | 'LIVE' | 'DEGRADED' | 'FAILED'>('PUBLISHING');

  React.useEffect(() => {
    if (!sessionId || !cameraActive) return;
    const heartbeat = () => {
      void action({ action: 'heartbeat_3d_eyes', sessionId }).catch(() => setMessage('3D Eyes heartbeat was interrupted. Keep this page open while it reconnects.'));
      if (attemptId && transportRef.current) {
        const state = mediaStateRef.current === 'DEGRADED' ? 'DEGRADED' : mediaStateRef.current === 'FAILED' ? 'FAILED' : 'LIVE';
        void runtimeAction({ action: 'media_state', attemptId, streamKind: 'SECONDARY', state }).catch(() => undefined);
      }
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 10_000);
    return () => window.clearInterval(timer);
  }, [attemptId, cameraActive, sessionId]);

  React.useEffect(() => () => {
    const handle = transportRef.current;
    transportRef.current = null;
    if (handle) void handle.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (attemptId) void runtimeAction({ action: 'media_state', attemptId, streamKind: 'SECONDARY', state: 'ENDED' }).catch(() => undefined);
  }, [attemptId]);

  async function pair() {
    if (!token.trim() && !code.trim()) {
      setMessage('Enter the short-lived pairing code from your laptop or open the secure pairing link.');
      return;
    }
    setBusy(true);
    try {
      const result = await action({
        action: 'pair_3d_eyes',
        token: token.trim() || undefined,
        code: code.trim() || undefined,
        deviceReference: navigator.userAgent.slice(0, 250),
      }) as PairResponse;
      if (!result.sessionId || !result.attemptId) throw new Error('Pairing response was incomplete.');
      setSessionId(result.sessionId);
      setAttemptId(result.attemptId);
      setMessage('Phone paired. Start the camera and place this device where the immediate exam workspace is visible.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to pair 3D Eyes.');
    } finally {
      setBusy(false);
    }
  }

  async function stopMedia() {
    const handle = transportRef.current;
    transportRef.current = null;
    if (handle) await handle.close();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setMediaState('IDLE');
    if (attemptId) await runtimeAction({ action: 'media_state', attemptId, streamKind: 'SECONDARY', state: 'ENDED' }).catch(() => undefined);
  }

  async function startCamera() {
    if (!sessionId || !attemptId) return;
    setBusy(true);
    let media: MediaStream | null = null;
    try {
      if (transportRef.current || streamRef.current) await stopMedia();
      media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } },
        audio: false,
      });
      streamRef.current = media;
      if (videoRef.current) videoRef.current.srcObject = media;
      const grant = await runtimeAction({ action: 'media_grant', attemptId, streamKind: 'SECONDARY', permission: 'PUBLISH' }) as unknown as MediaGrant;
      const handle = await publishWhipStream({
        endpointUrl: grant.endpointUrl,
        bearerToken: grant.bearerToken,
        stream: media,
        onState: (next, detail) => {
          setMediaState(next);
          const mapped = next === 'CONNECTED' ? 'LIVE' : next === 'DEGRADED' ? 'DEGRADED' : next === 'FAILED' ? 'FAILED' : 'PUBLISHING';
          mediaStateRef.current = mapped;
          void runtimeAction({ action: 'media_state', attemptId, streamKind: 'SECONDARY', state: mapped, error: detail || null }).catch(() => undefined);
          if (next === 'CONNECTED') setMessage('3D Eyes live video is securely streaming to authorized proctors. Keep this phone in position until the exam ends.');
          if (next === 'DEGRADED') setMessage('3D Eyes media is degraded. Keep the page open while WebRTC reconnects.');
          if (next === 'FAILED') setMessage(detail || '3D Eyes live stream failed. Restart the secondary camera.');
        },
      });
      transportRef.current = handle;
      setCameraActive(true);
      await action({ action: 'heartbeat_3d_eyes', sessionId });
      await action({
        action: 'send_3d_signal',
        sessionId,
        sender: 'MOBILE',
        signalType: 'CONTROL',
        payload: { type: 'CAMERA_READY', attemptId, videoTracks: media.getVideoTracks().length, transport: 'WHIP_WHEP' },
      });
    } catch (error) {
      media?.getTracks().forEach((track) => track.stop());
      if (streamRef.current === media) streamRef.current = null;
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      setMediaState('FAILED');
      setMessage(error instanceof Error ? error.message : 'Camera permission and realtime media are required for 3D Eyes.');
    } finally {
      setBusy(false);
    }
  }

  async function restartCamera() {
    setBusy(true);
    try {
      await stopMedia();
      await startCamera();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[100dvh] bg-[#071225] px-4 py-6 text-white sm:py-10">
      <div className="mx-auto max-w-lg">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-blue-300">NAVEMORA</p><h1 className="mt-1 text-2xl font-black tracking-[-0.03em]">3D Eyes</h1></div><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10"><Phone className="h-6 w-6" /></span></div>
        <p className="mt-3 text-sm leading-6 text-slate-300">Use this phone as an authenticated secondary camera. It does not mirror your phone screen and should capture only the immediate examination workspace required by your institution.</p>

        {!sessionId ? (
          <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.06] p-5">
            <p className="text-sm font-extrabold">Pair with laptop</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">Open the secure link from the laptop, or enter the 8-digit code shown there.</p>
            <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" placeholder="8-digit code" className="mt-4 h-12 w-full rounded-xl border border-white/15 bg-[#0C1A31] px-4 text-center font-mono text-lg font-black tracking-[0.18em] outline-none focus:border-blue-400" />
            {initialToken ? <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300"><ShieldCheck className="h-4 w-4" />Secure pairing token detected from laptop.</div> : <input value={token} onChange={(event) => setToken(event.target.value)} placeholder="Or paste secure token" className="mt-3 h-11 w-full rounded-xl border border-white/15 bg-[#0C1A31] px-3 text-xs outline-none focus:border-blue-400" />}
            <button onClick={() => void pair()} disabled={busy} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold transition hover:bg-blue-500 disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}Pair 3D Eyes</button>
          </div>
        ) : (
          <div className="mt-7 overflow-hidden rounded-3xl border border-white/10 bg-black shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0B1930] px-4 py-3"><div className="flex items-center gap-2 text-xs font-extrabold"><span className={`h-2.5 w-2.5 rounded-full ${mediaState === 'CONNECTED' ? 'bg-emerald-400' : cameraActive ? 'bg-amber-400' : 'bg-slate-500'}`} />{mediaState === 'CONNECTED' ? 'Live to proctor' : cameraActive ? `Camera ${mediaState.toLowerCase()}` : 'Camera waiting'}</div><span className="flex items-center gap-1.5 text-[10px] text-slate-400">{mediaState === 'CONNECTED' ? <Radio className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}Secure WebRTC</span></div>
            <div className="relative aspect-[3/4] bg-black sm:aspect-video"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />{!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400"><Camera className="h-10 w-10" /><p className="text-xs font-semibold">Camera is not active yet.</p></div>}</div>
            <div className="bg-[#0B1930] p-4">
              {!cameraActive ? <button onClick={() => void startCamera()} disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}Start live secondary camera</button> : <button onClick={() => void restartCamera()} disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-xs font-extrabold"><RefreshCw className="h-4 w-4" />Restart / adjust camera</button>}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">{cameraActive && mediaState === 'CONNECTED' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}<p className="text-xs leading-5 text-slate-300">{message}</p></div>
        <div className="mt-4 rounded-2xl border border-white/10 p-4 text-[11px] leading-5 text-slate-400"><b className="text-slate-200">Positioning:</b> place the phone where the student, laptop/work area, desk and immediate surrounding workspace can be seen. Do not scan unrelated private areas. An examiner may ask you to adjust this position.</div>
      </div>
    </div>
  );
}