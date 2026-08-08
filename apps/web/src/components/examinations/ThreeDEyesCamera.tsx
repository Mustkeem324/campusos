'use client';

import React from 'react';
import { AlertTriangle, Camera, CheckCircle2, Loader2, Phone, RefreshCw, ShieldCheck, Wifi } from 'lucide-react';

type ApiError = { error?: string };

type PairResponse = {
  sessionId?: string;
  attemptId?: string;
  error?: string;
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

export function ThreeDEyesCamera({ initialToken }: { initialToken?: string }) {
  const [token, setToken] = React.useState(initialToken ?? '');
  const [code, setCode] = React.useState('');
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [attemptId, setAttemptId] = React.useState<string | null>(null);
  const [stream, setStream] = React.useState<MediaStream | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string>('Pair this authenticated phone with the examination shown on your laptop.');
  const [cameraActive, setCameraActive] = React.useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  React.useEffect(() => {
    if (videoRef.current && stream) videoRef.current.srcObject = stream;
  }, [stream]);

  React.useEffect(() => {
    if (!sessionId || !cameraActive) return;
    const heartbeat = () => {
      void action({ action: 'heartbeat_3d_eyes', sessionId }).catch(() => setMessage('3D Eyes heartbeat was interrupted. Keep this page open while it reconnects.'));
    };
    heartbeat();
    const timer = window.setInterval(heartbeat, 10_000);
    return () => window.clearInterval(timer);
  }, [cameraActive, sessionId]);

  React.useEffect(() => () => {
    stream?.getTracks().forEach((track) => track.stop());
  }, [stream]);

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

  async function startCamera() {
    if (!sessionId) return;
    setBusy(true);
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(media);
      setCameraActive(true);
      setMessage('3D Eyes camera is active and the secure session heartbeat is connected. Keep this device in position until the exam ends.');
      await action({ action: 'heartbeat_3d_eyes', sessionId });
      await action({
        action: 'send_3d_signal',
        sessionId,
        sender: 'MOBILE',
        signalType: 'CONTROL',
        payload: { type: 'CAMERA_READY', attemptId, videoTracks: media.getVideoTracks().length },
      });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Camera permission is required for 3D Eyes.');
    } finally {
      setBusy(false);
    }
  }

  async function flipCamera() {
    if (!cameraActive) return;
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setCameraActive(false);
    await startCamera();
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
            <div className="flex items-center justify-between border-b border-white/10 bg-[#0B1930] px-4 py-3"><div className="flex items-center gap-2 text-xs font-extrabold"><span className={`h-2.5 w-2.5 rounded-full ${cameraActive ? 'bg-emerald-400' : 'bg-amber-400'}`} />{cameraActive ? 'Camera active' : 'Camera waiting'}</div><span className="flex items-center gap-1.5 text-[10px] text-slate-400"><Wifi className="h-3.5 w-3.5" />Secure heartbeat</span></div>
            <div className="relative aspect-[3/4] bg-black sm:aspect-video"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" />{!cameraActive && <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400"><Camera className="h-10 w-10" /><p className="text-xs font-semibold">Camera is not active yet.</p></div>}</div>
            <div className="bg-[#0B1930] p-4">
              {!cameraActive ? <button onClick={() => void startCamera()} disabled={busy} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-extrabold disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}Start secondary camera</button> : <button onClick={() => void flipCamera()} disabled={busy} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/15 text-xs font-extrabold"><RefreshCw className="h-4 w-4" />Restart / adjust camera</button>}
            </div>
          </div>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-4">{cameraActive ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />}<p className="text-xs leading-5 text-slate-300">{message}</p></div>
        <div className="mt-4 rounded-2xl border border-white/10 p-4 text-[11px] leading-5 text-slate-400"><b className="text-slate-200">Positioning:</b> place the phone where the student, laptop/work area, desk and immediate surrounding workspace can be seen. Do not scan unrelated private areas. An examiner may ask you to adjust this position.</div>
      </div>
    </div>
  );
}
