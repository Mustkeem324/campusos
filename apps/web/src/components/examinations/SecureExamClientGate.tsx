'use client';

import React from 'react';
import { CheckCircle2, Copy, Laptop, Loader2, RefreshCw, ShieldCheck } from 'lucide-react';

async function createChallenge(attemptId: string) {
  const response = await fetch('/api/examinations/proctoring/runtime/action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'secure_client_challenge', attemptId }),
  });
  const body = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : 'Unable to create secure-client challenge.');
  return body as unknown as {
    challengeId: string;
    challengeToken: string;
    nonce: string;
    policyVersion: string;
    expiresAt: string;
  };
}

export function SecureExamClientGate({ attemptId }: { attemptId: string }) {
  const [challenge, setChallenge] = React.useState<Awaited<ReturnType<typeof createChallenge>> | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState('This exam requires an institution-enrolled NAVEMORA Secure Client before the question interface can open.');

  async function generate() {
    setBusy(true);
    try {
      const next = await createChallenge(attemptId);
      setChallenge(next);
      setMessage('Challenge created. Open the enrolled NAVEMORA Secure Client on this managed device and attest this session.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create secure-client challenge.');
    } finally {
      setBusy(false);
    }
  }

  async function copyToken() {
    if (!challenge) return;
    await navigator.clipboard.writeText(JSON.stringify({
      challengeId: challenge.challengeId,
      challengeToken: challenge.challengeToken,
      nonce: challenge.nonce,
      policyVersion: challenge.policyVersion,
      attemptId,
    }));
    setMessage('Secure-client challenge copied. Paste it into the enrolled NAVEMORA Secure Client.');
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"><ShieldCheck className="h-6 w-6" /></span>
          <div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-blue-700">NAVEMORA Secure Examination</p><h1 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950 dark:text-white">Managed secure client required</h1><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p></div>
        </div>

        <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-start gap-3"><Laptop className="mt-0.5 h-5 w-5 shrink-0 text-slate-700 dark:text-slate-200" /><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">What the client proves</p><p className="mt-1 text-xs leading-5 text-slate-500">The client signs a short-lived challenge with an institution-enrolled device key and reports the enforced kiosk posture. A normal browser cannot self-declare this gate complete.</p></div></div>
        </div>

        {!challenge ? (
          <button onClick={() => void generate()} disabled={busy} className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Create secure-client challenge</button>
        ) : (
          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/50 dark:bg-blue-950/20"><p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Challenge</p><p className="mt-2 break-all font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{challenge.challengeToken}</p><p className="mt-2 text-[10px] text-slate-500">Policy {challenge.policyVersion} · expires {new Date(challenge.expiresAt).toLocaleTimeString()}</p></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => void copyToken()} className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold dark:border-slate-700"><Copy className="h-4 w-4" />Copy challenge</button><button onClick={() => window.location.reload()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white"><RefreshCw className="h-4 w-4" />Check attestation</button></div>
          </div>
        )}

        <div className="mt-7 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><p className="text-xs leading-5">The secure client gate is separate from AI proctoring. Passing the client attestation does not make any academic-integrity judgment; it only confirms the approved exam client/device posture.</p></div>
      </div>
    </div>
  );
}