'use client';

import Link from 'next/link';
import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  Laptop,
  Loader2,
  LockKeyhole,
  MonitorCheck,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Video,
  Wifi,
  XCircle,
} from 'lucide-react';

import type {
  ExamConfigSummary,
  ExamDeliveryMode,
  ExamSecurityProfile,
  SecureExamWorkspace,
  StudentExamCard,
} from '@/lib/secure-examination-types';

type ApiError = { error?: string };
type ActionPayload = Record<string, unknown>;

type PairingState = {
  attemptId: string;
  token: string;
  code: string;
  expiresAt: string;
} | null;

const DELIVERY_MODES: Array<{ value: ExamDeliveryMode; label: string }> = [
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ONLINE_UNPROCTORED', label: 'Online · Unproctored' },
  { value: 'ONLINE_PROCTORED', label: 'Online · Proctored' },
  { value: 'HUMAN_PROCTORED', label: 'Human Proctored' },
  { value: 'AI_ASSISTED_PROCTORED', label: 'AI-Assisted Proctored' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const MANAGE_ROLES = new Set(['EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN']);

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function deliveryLabel(mode: ExamDeliveryMode) {
  return DELIVERY_MODES.find((item) => item.value === mode)?.label ?? mode;
}

async function apiAction(payload: ActionPayload) {
  const response = await fetch('/api/examinations/proctoring/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete examination action.');
  return body;
}

function StatusPill({ children, good = false, warning = false }: { children: React.ReactNode; good?: boolean; warning?: boolean }) {
  const tone = good
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
    : warning
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.06em] ${tone}`}>{children}</span>;
}

function ReadinessList({ exam }: { exam: StudentExamCard }) {
  const required = exam.readiness.items.filter((item) => item.required);
  if (!required.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {required.map((item) => (
        <div key={item.key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
          {item.ready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />}
          <div className="min-w-0">
            <p className="truncate text-[11px] font-bold text-slate-800 dark:text-slate-100">{item.label}</p>
            <p className="text-[9px] text-slate-500">{item.ready ? 'Ready' : item.detail || 'Required'}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read image.'));
    reader.readAsDataURL(file);
  });
}

function IdentityVerificationCard({ exam, onChanged }: { exam: StudentExamCard; onChanged: () => Promise<void> }) {
  const [idCapture, setIdCapture] = React.useState<string>('');
  const [selfie, setSelfie] = React.useState<string>('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  if (!exam.attempt || !exam.securityProfile || !(exam.securityProfile.identityRequired || exam.securityProfile.selfieRequired || exam.securityProfile.livenessRequired)) return null;
  if (exam.identityState === 'MATCH' || exam.identityState === 'APPROVED') return null;

  async function pick(event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Use a JPEG or WebP image.');
      return;
    }
    if (file.size > 1_500_000) {
      setMessage('Image must be under 1.5 MB.');
      return;
    }
    setter(await fileToDataUrl(file));
  }

  async function verify() {
    if (!idCapture || !selfie) {
      setMessage('Capture both your institution ID and a live selfie.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await apiAction({
        action: 'verify_identity',
        attemptId: exam.attempt?.id,
        idCaptureDataUrl: idCapture,
        selfieDataUrl: selfie,
      });
      setMessage(result.state === 'REVIEW_REQUIRED'
        ? 'Automatic verification is unavailable or inconclusive. An authorized examiner will review your identity.'
        : 'Identity verification submitted successfully.');
      await onChanged();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Identity verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm dark:bg-slate-900 dark:text-blue-300"><UserCheck className="h-5 w-5" /></span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900 dark:text-white">Verify your identity</p>
          <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Capture your approved institution ID and a live selfie. Raw captures are sent only to the configured verification service for this check.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <label className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-blue-600" />{idCapture ? 'ID captured ✓' : 'Capture institution ID'}</span>
              <input className="sr-only" type="file" accept="image/jpeg,image/webp" capture="environment" onChange={(event) => void pick(event, setIdCapture)} />
            </label>
            <label className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <span className="flex items-center gap-2"><Camera className="h-4 w-4 text-blue-600" />{selfie ? 'Selfie captured ✓' : 'Capture live selfie'}</span>
              <input className="sr-only" type="file" accept="image/jpeg,image/webp" capture="user" onChange={(event) => void pick(event, setSelfie)} />
            </label>
          </div>
          <button onClick={() => void verify()} disabled={busy} className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />} Verify identity
          </button>
          {message && <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">{message}</p>}
        </div>
      </div>
    </div>
  );
}

function StudentExam({ exam, pairing, onPairing, refresh }: {
  exam: StudentExamCard;
  pairing: PairingState;
  onPairing: (state: PairingState) => void;
  refresh: () => Promise<void>;
}) {
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  async function run(key: string, payload: ActionPayload) {
    setBusy(key);
    setError(null);
    try {
      const result = await apiAction(payload);
      await refresh();
      return result;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to complete action.');
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function createAttempt() {
    await run('attempt', { action: 'create_attempt', configId: exam.configId });
  }

  async function acceptTerms() {
    if (!exam.terms) return;
    await run('terms', { action: 'accept_terms', configId: exam.configId, termsVersionId: exam.terms.id });
  }

  async function runPrecheck() {
    if (!exam.attempt) return;
    setBusy('precheck');
    setError(null);
    let cameraReady = false;
    let microphoneReady = false;
    try {
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: exam.securityProfile?.primaryCameraRequired ? true : false,
          audio: exam.securityProfile?.microphoneRequired ? true : false,
        });
        cameraReady = !exam.securityProfile?.primaryCameraRequired || stream.getVideoTracks().length > 0;
        microphoneReady = !exam.securityProfile?.microphoneRequired || stream.getAudioTracks().length > 0;
        stream.getTracks().forEach((track) => track.stop());
      }
      const connection = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
      const networkQuality = connection?.effectiveType === '4g' ? 'GOOD' : connection?.effectiveType === '3g' ? 'FAIR' : 'UNKNOWN';
      await apiAction({
        action: 'save_precheck',
        attemptId: exam.attempt.id,
        browserSupported: typeof window !== 'undefined' && Boolean(navigator.mediaDevices),
        cameraReady: !exam.securityProfile?.primaryCameraRequired || cameraReady,
        microphoneReady: !exam.securityProfile?.microphoneRequired || microphoneReady,
        screenShareReady: !exam.securityProfile?.screenShareRequired || Boolean(navigator.mediaDevices?.getDisplayMedia),
        fullscreenReady: !exam.securityProfile?.fullscreenRequired || Boolean(document.documentElement.requestFullscreen),
        secondCameraReady: exam.secondCamera?.status === 'PAIRED' || exam.secondCamera?.status === 'CONNECTED',
        networkQuality,
        clientDetails: { userAgent: navigator.userAgent, language: navigator.language },
      });
      await refresh();
    } catch (checkError) {
      setError(checkError instanceof Error ? checkError.message : 'Device check failed. Allow the requested permissions and retry.');
    } finally {
      setBusy(null);
    }
  }

  async function createPairing() {
    if (!exam.attempt) return;
    const result = await run('pairing', { action: 'create_3d_pairing', attemptId: exam.attempt.id });
    if (result?.token && result?.code && result?.expiresAt) {
      onPairing({ attemptId: exam.attempt.id, token: String(result.token), code: String(result.code), expiresAt: String(result.expiresAt) });
    }
  }

  async function startExam() {
    if (!exam.attempt) return;
    const result = await run('start', { action: 'start_attempt', attemptId: exam.attempt.id });
    if (result) window.location.href = `/examinations/attempt/${exam.attempt.id}`;
  }

  const online = exam.deliveryMode !== 'OFFLINE';
  const currentPairing = pairing?.attemptId === exam.attempt?.id ? pairing : null;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2"><StatusPill good={!online}>{deliveryLabel(exam.deliveryMode)}</StatusPill><StatusPill>{exam.examType.replaceAll('_', ' ')}</StatusPill>{exam.attempt && <StatusPill warning={!exam.readiness.ready}>{exam.attempt.status.replaceAll('_', ' ')}</StatusPill>}</div>
            <h3 className="mt-3 text-lg font-extrabold tracking-[-0.02em] text-slate-950 dark:text-white">{exam.examName}</h3>
            <p className="mt-1 text-xs text-slate-500">{exam.courseCode ? `${exam.courseCode} · ${exam.courseTitle}` : 'Institution examination'} · {formatDate(exam.startsAt)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-right dark:bg-slate-900">
            <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-400">Duration</p>
            <p className="mt-0.5 text-sm font-extrabold text-slate-800 dark:text-slate-100">{exam.durationMinutes ? `${exam.durationMinutes} min` : 'Institution policy'}</p>
          </div>
        </div>
        {exam.instructions && <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">{exam.instructions}</p>}
      </div>

      <div className="space-y-4 p-5">
        {!online && (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            <div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Offline examination</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">This exam remains in the institution's existing venue, admit-card and invigilation workflow. Online proctoring does not override it.</p></div>
          </div>
        )}

        {online && !exam.attempt && (
          <button onClick={() => void createAttempt()} disabled={Boolean(busy)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white hover:bg-blue-800 disabled:opacity-50">
            {busy === 'attempt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />} Begin secure pre-check
          </button>
        )}

        {online && exam.attempt && (
          <>
            <ReadinessList exam={exam} />

            {exam.terms && !exam.terms.accepted && (
              <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                <summary className="cursor-pointer text-sm font-extrabold text-slate-900 dark:text-white">{exam.terms.title} · version {exam.terms.version}</summary>
                <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-xs leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">{exam.terms.content}</div>
                <button onClick={() => void acceptTerms()} disabled={Boolean(busy)} className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-extrabold text-white dark:bg-white dark:text-slate-900"><CheckCircle2 className="h-4 w-4" />I acknowledge these examination terms</button>
              </details>
            )}

            <IdentityVerificationCard exam={exam} onChanged={refresh} />

            <div className="grid gap-3 md:grid-cols-2">
              <button onClick={() => void runPrecheck()} disabled={Boolean(busy)} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-800">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{busy === 'precheck' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Laptop className="h-4 w-4" />}</span>
                <span><span className="block text-xs font-extrabold text-slate-900 dark:text-white">Run device compatibility check</span><span className="mt-0.5 block text-[10px] text-slate-500">Camera, microphone, screen capability and fullscreen support.</span></span>
              </button>

              {exam.securityProfile?.secondCameraRequired && (
                <button onClick={() => void createPairing()} disabled={Boolean(busy)} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-left transition hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-950 dark:hover:border-blue-800">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300">{busy === 'pairing' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}</span>
                  <span><span className="block text-xs font-extrabold text-slate-900 dark:text-white">Pair NAVEMORA 3D Eyes</span><span className="mt-0.5 block text-[10px] text-slate-500">Use an authenticated phone as the second camera.</span></span>
                </button>
              )}
            </div>

            {currentPairing && (
              <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20">
                <div className="flex items-start gap-3"><Phone className="mt-0.5 h-5 w-5 text-orange-700" /><div className="min-w-0"><p className="text-sm font-extrabold text-slate-900 dark:text-white">3D Eyes pairing code</p><p className="mt-2 font-mono text-2xl font-black tracking-[0.16em] text-orange-800 dark:text-orange-300">{currentPairing.code}</p><p className="mt-1 text-[10px] text-slate-500">Expires {formatDate(currentPairing.expiresAt)}. Open the mobile link while signed in as the same student.</p><Link href={`/examinations/3d-eyes?token=${encodeURIComponent(currentPairing.token)}`} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-700 px-3 py-2 text-xs font-extrabold text-white">Open 3D Eyes on this device <ArrowRight className="h-3.5 w-3.5" /></Link></div></div>
              </div>
            )}

            {exam.attempt.status === 'WAITING_ROOM' && (
              <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20"><Clock3 className="mt-0.5 h-5 w-5 text-amber-600" /><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Waiting for examiner approval</p><p className="mt-1 text-xs text-slate-600 dark:text-slate-300">Keep required devices connected. The examiner may ask you to adjust the workspace or retry identity verification.</p></div></div>
            )}

            {exam.attempt.status === 'IN_PROGRESS' || exam.attempt.status === 'RECONNECTING' ? (
              <Link href={`/examinations/attempt/${exam.attempt.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white hover:bg-blue-800">Resume examination <ArrowRight className="h-4 w-4" /></Link>
            ) : exam.attempt.status === 'SUBMITTED' || exam.attempt.status === 'AUTO_SUBMITTED' || exam.attempt.status === 'COMPLETED' ? (
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Submitted {exam.attempt.submissionReference ? `· ${exam.attempt.submissionReference}` : ''}</div>
            ) : (
              <button onClick={() => void startExam()} disabled={Boolean(busy) || !exam.readiness.ready} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700">
                {busy === 'start' ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockKeyhole className="h-4 w-4" />} Enter examination
              </button>
            )}
          </>
        )}
        {error && <p className="flex items-center gap-2 text-xs font-semibold text-red-600"><AlertTriangle className="h-4 w-4" />{error}</p>}
      </div>
    </article>
  );
}

function SecurityProfileForm({ refresh }: { refresh: () => Promise<void> }) {
  const [name, setName] = React.useState('High Security Proctored Exam');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  async function create() {
    setBusy(true);
    setMessage(null);
    try {
      await apiAction({
        action: 'create_security_profile',
        name,
        description: 'Identity + primary camera + fullscreen + 3D Eyes + human admission. AI events remain review signals only.',
        identityRequired: true,
        selfieRequired: true,
        livenessRequired: false,
        primaryCameraRequired: true,
        microphoneRequired: false,
        screenShareRequired: false,
        fullscreenRequired: true,
        secondCameraRequired: true,
        humanAdmissionRequired: true,
        aiEventAnalysisEnabled: true,
        clipboardRestricted: true,
        permittedMaterials: { policy: 'INSTITUTION_DEFINED' },
      });
      setMessage('Security profile created.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create profile.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Security profile</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Create a reusable high-security policy. Institutions can still choose lower-security or offline delivery per exam.</p>
      <input value={name} onChange={(event) => setName(event.target.value)} className="mt-4 h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900" />
      <button onClick={() => void create()} disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-extrabold text-white dark:bg-white dark:text-slate-900">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Create high-security profile</button>
      {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}
    </div>
  );
}

function ExamConfigForm({ workspace, refresh }: { workspace: Extract<SecureExamWorkspace, { kind: 'ADMIN' }>; refresh: () => Promise<void> }) {
  const [examId, setExamId] = React.useState('');
  const [courseOfferingId, setCourseOfferingId] = React.useState('');
  const [profileId, setProfileId] = React.useState('');
  const [mode, setMode] = React.useState<ExamDeliveryMode>('ONLINE_PROCTORED');
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMessage(null);
    try {
      await apiAction({
        action: 'configure_exam', examId, courseOfferingId: courseOfferingId || null,
        securityProfileId: profileId || null, deliveryMode: mode,
        startsAt: startsAt ? new Date(startsAt).toISOString() : null,
        endsAt: endsAt ? new Date(endsAt).toISOString() : null,
        durationMinutes: Number(duration), maxAttempts: 1, reconnectGraceSeconds: 120,
        instructions: 'Read the institution examination terms and complete all required checks before entering.',
      });
      setMessage('Exam security configuration saved. Publish it from the list below when ready.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to configure exam.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Configure examination delivery</p>
      <p className="mt-1 text-xs leading-5 text-slate-500">Exam mode is independent from institution study mode. An offline college may run an online quiz; an online college may require an offline semester exam.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <select value={examId} onChange={(event) => setExamId(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"><option value="">Select existing exam</option>{workspace.availableExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} · {exam.type}</option>)}</select>
        <select value={courseOfferingId} onChange={(event) => setCourseOfferingId(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900"><option value="">Institution-wide / no course restriction</option>{workspace.courseOfferings.map((course) => <option key={course.id} value={course.id}>{course.courseCode} · {course.courseTitle} · Section {course.sectionName}</option>)}</select>
        <select value={mode} onChange={(event) => setMode(event.target.value as ExamDeliveryMode)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold dark:border-slate-700 dark:bg-slate-900">{DELIVERY_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
        <select value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={mode === 'OFFLINE' || mode === 'ONLINE_UNPROCTORED'} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"><option value="">No security profile</option>{workspace.securityProfiles.filter((profile) => profile.status === 'ACTIVE').map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select>
        <input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900" />
        <input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900" />
        <input type="number" min="1" max="1440" value={duration} onChange={(event) => setDuration(event.target.value)} className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-slate-700 dark:bg-slate-900" placeholder="Duration minutes" />
      </div>
      <button onClick={() => void save()} disabled={busy || !examId} className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Save configuration</button>
      {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}
    </div>
  );
}

function TermsForm({ refresh }: { refresh: () => Promise<void> }) {
  const [version, setVersion] = React.useState('v1');
  const [title, setTitle] = React.useState('Secure examination terms & privacy notice');
  const [content, setContent] = React.useState('This examination may require identity verification, camera access, browser integrity events and an optional secondary mobile camera. AI-assisted monitoring creates signals for human review and does not automatically determine misconduct. Your institution controls permitted materials, retention, review and appeal processes.');
  const [message, setMessage] = React.useState<string | null>(null);
  async function create() {
    try {
      await apiAction({ action: 'create_terms', version, title, content });
      setMessage('Terms version created.');
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create terms.');
    }
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
      <p className="text-sm font-extrabold text-slate-900 dark:text-white">Versioned exam terms</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-[120px_1fr]"><input value={version} onChange={(event) => setVersion(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /></div>
      <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={5} className="mt-3 w-full rounded-xl border border-slate-200 p-3 text-xs leading-5 dark:border-slate-700 dark:bg-slate-900" />
      <button onClick={() => void create()} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-slate-300 px-4 text-xs font-extrabold text-slate-800 dark:border-slate-700 dark:text-slate-100"><FileCheck2 className="h-4 w-4" />Create terms version</button>
      {message && <p className="mt-2 text-xs text-slate-500">{message}</p>}
    </div>
  );
}

function ConfigRow({ config, refresh }: { config: ExamConfigSummary; refresh: () => Promise<void> }) {
  const [busy, setBusy] = React.useState(false);
  async function setStatus(status: 'PUBLISHED' | 'CANCELLED' | 'ARCHIVED') {
    setBusy(true);
    try { await apiAction({ action: 'set_exam_status', configId: config.configId, status }); await refresh(); } finally { setBusy(false); }
  }
  return (
    <div className="grid gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0 dark:border-slate-800 lg:grid-cols-[1.4fr_.9fr_.7fr_auto] lg:items-center">
      <div><p className="text-xs font-extrabold text-slate-900 dark:text-white">{config.examName}</p><p className="mt-1 text-[10px] text-slate-500">{config.courseCode ? `${config.courseCode} · ${config.courseTitle}` : 'Institution exam'} · {formatDate(config.startsAt)}</p></div>
      <div><StatusPill>{deliveryLabel(config.deliveryMode)}</StatusPill><p className="mt-1 text-[10px] text-slate-500">{config.securityProfileName || 'No proctoring profile'}</p></div>
      <div className="text-[10px] text-slate-500"><b className="text-slate-800 dark:text-slate-200">{config.attemptCount}</b> attempts · <b className="text-slate-800 dark:text-slate-200">{config.reviewRequiredCount}</b> review</div>
      <div className="flex gap-2">{config.status === 'DRAFT' && <button disabled={busy} onClick={() => void setStatus('PUBLISHED')} className="rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-extrabold text-white">Publish</button>}<StatusPill good={config.status === 'PUBLISHED'}>{config.status}</StatusPill></div>
    </div>
  );
}

function ProctorConsole({ workspace, refresh }: { workspace: Extract<SecureExamWorkspace, { kind: 'ADMIN' }>; refresh: () => Promise<void> }) {
  const [message, setMessage] = React.useState<string | null>(null);
  async function act(payload: ActionPayload) {
    setMessage(null);
    try { await apiAction(payload); await refresh(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to complete proctor action.'); }
  }
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Live proctor console</p><p className="mt-1 text-xs text-slate-500">AI and browser events are attention signals. Academic misconduct decisions remain a human process.</p></div><Eye className="h-5 w-5 text-blue-700" /></div>
      {workspace.liveAttempts.length === 0 ? <div className="p-6 text-center text-xs text-slate-500">No assigned students are waiting or taking a secure exam right now.</div> : workspace.liveAttempts.map((attempt) => (
        <div key={attempt.attemptId} className="grid gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 dark:border-slate-800 xl:grid-cols-[1.2fr_.8fr_.8fr_auto] xl:items-center">
          <div><p className="text-xs font-extrabold text-slate-900 dark:text-white">{attempt.studentName} · {attempt.rollNumber}</p><p className="mt-1 text-[10px] text-slate-500">{attempt.examName} · {attempt.status.replaceAll('_', ' ')}</p></div>
          <div className="flex flex-wrap gap-1.5"><StatusPill good={attempt.identityState === 'MATCH' || attempt.identityState === 'APPROVED'}>ID {attempt.identityState || 'pending'}</StatusPill><StatusPill good={attempt.secondCameraStatus === 'CONNECTED' || attempt.secondCameraStatus === 'PAIRED'}>3D Eyes {attempt.secondCameraStatus || 'off'}</StatusPill></div>
          <div className="text-[10px] text-slate-500"><span className="font-bold text-red-600">{attempt.unreviewedHighEvents} high</span> · <span className="font-bold text-amber-600">{attempt.unreviewedMediumEvents} medium</span> events</div>
          <div className="flex flex-wrap gap-2"><button onClick={() => void act({ action: 'review_identity', attemptId: attempt.attemptId, decision: 'APPROVED', note: 'Identity reviewed by authorized proctor.' })} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700">Approve ID</button><button onClick={() => void act({ action: 'admit_attempt', attemptId: attempt.attemptId })} className="rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-extrabold text-white">Admit</button><button onClick={() => void act({ action: 'proctor_report', attemptId: attempt.attemptId, category: 'INTEGRITY_CONCERN', severity: 'MEDIUM', description: 'Proctor requested post-exam human review. No automatic academic action was taken.' })} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-extrabold text-amber-800">Report concern</button></div>
        </div>
      ))}
      {message && <p className="p-4 text-xs font-semibold text-red-600">{message}</p>}
    </div>
  );
}

export function SecureExaminationWorkspace() {
  const [workspace, setWorkspace] = React.useState<SecureExamWorkspace | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pairing, setPairing] = React.useState<PairingState>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/examinations/proctoring/workspace', { cache: 'no-store' });
      const body = await response.json() as SecureExamWorkspace & ApiError;
      if (!response.ok) throw new Error(body.error || 'Unable to load examinations.');
      setWorkspace(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load examinations.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-700" /></div>;
  if (error) return <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>;
  if (!workspace) return null;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[1fr_auto] lg:items-center">
          <div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700"><ShieldCheck className="h-4 w-4" />NAVEMORA Secure Examination</div><h1 className="mt-3 text-2xl font-black tracking-[-0.035em] text-slate-950 sm:text-3xl dark:text-white">Examination, proctoring & 3D Eyes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Institution-controlled offline, online and hybrid examination delivery with server-authorized verification, resilient attempts and human-reviewed proctoring evidence.</p></div>
          <div className="grid grid-cols-3 gap-2 text-center"><div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900"><Video className="mx-auto h-4 w-4 text-blue-700" /><p className="mt-1 text-[9px] font-bold text-slate-500">Primary camera</p></div><div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900"><Phone className="mx-auto h-4 w-4 text-orange-700" /><p className="mt-1 text-[9px] font-bold text-slate-500">3D Eyes</p></div><div className="rounded-2xl bg-slate-50 px-4 py-3 dark:bg-slate-900"><UserCheck className="mx-auto h-4 w-4 text-emerald-700" /><p className="mt-1 text-[9px] font-bold text-slate-500">Human review</p></div></div>
        </div>
      </section>

      {!workspace.storeReady && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">Secure examination storage has not been provisioned for this deployment yet. Run the database preparation process before using this module.</div>}

      {workspace.kind === 'STUDENT' ? (
        <>
          <div className="grid gap-3 sm:grid-cols-4"><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Student</p><p className="mt-1 text-sm font-extrabold text-slate-900 dark:text-white">{workspace.student.name}</p><p className="text-[10px] text-slate-500">{workspace.student.rollNumber}</p></div><Link href="/examinations/system-check" className="rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950"><MonitorCheck className="h-5 w-5 text-blue-700" /><p className="mt-2 text-xs font-extrabold text-slate-900 dark:text-white">Practice system check</p><p className="mt-1 text-[10px] text-slate-500">Test devices before exam day.</p></Link><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><Wifi className="h-5 w-5 text-emerald-700" /><p className="mt-2 text-xs font-extrabold text-slate-900 dark:text-white">Resilient attempts</p><p className="mt-1 text-[10px] text-slate-500">Autosave and reconnect state.</p></div><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><ShieldCheck className="h-5 w-5 text-orange-700" /><p className="mt-2 text-xs font-extrabold text-slate-900 dark:text-white">Evidence, not verdict</p><p className="mt-1 text-[10px] text-slate-500">AI flags require human review.</p></div></div>
          <div className="space-y-4">{workspace.exams.length ? workspace.exams.map((exam) => <StudentExam key={exam.configId} exam={exam} pairing={pairing} onPairing={setPairing} refresh={load} />) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950">No secure examinations are currently published for your enrollment.</div>}</div>
        </>
      ) : (
        <>
          {MANAGE_ROLES.has(workspace.role) && <div className="grid gap-4 xl:grid-cols-3"><SecurityProfileForm refresh={load} /><ExamConfigForm workspace={workspace} refresh={load} /><TermsForm refresh={load} /></div>}
          <ProctorConsole workspace={workspace} refresh={load} />
          {MANAGE_ROLES.has(workspace.role) && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-slate-800"><div><p className="text-sm font-extrabold text-slate-900 dark:text-white">Configured examinations</p><p className="mt-1 text-xs text-slate-500">Delivery mode belongs to the exam, not automatically to the student's study mode.</p></div><button onClick={() => void load()} className="rounded-lg border border-slate-200 p-2 text-slate-500 dark:border-slate-700"><RefreshCw className="h-4 w-4" /></button></div>{workspace.exams.length ? workspace.exams.map((config) => <ConfigRow key={config.configId} config={config} refresh={load} />) : <div className="p-8 text-center text-xs text-slate-500">No secure exam configurations yet.</div>}</div>}
        </>
      )}

      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="text-xs font-extrabold text-slate-900 dark:text-white">Proctoring integrity rule</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Camera, focus, network or AI-assisted events are potential irregularity signals only. They do not automatically fail, remove, or declare a student guilty. Authorized human review remains required for academic integrity decisions.</p></div></div></div>
    </div>
  );
}
