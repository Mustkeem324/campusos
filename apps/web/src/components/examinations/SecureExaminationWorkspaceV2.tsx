'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Laptop,
  Loader2,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  Video,
  Wifi,
} from 'lucide-react';

import type {
  ExamDeliveryMode,
  ExamSecurityProfile,
  SecureExamWorkspace,
  StudentExamCard,
} from '@/lib/secure-examination-types';

type ApiError = { error?: string };
type Json = Record<string, unknown>;
type Pairing = { attemptId: string; token: string; code: string; expiresAt: string } | null;

const DELIVERY_MODES: Array<{ value: ExamDeliveryMode; label: string }> = [
  { value: 'OFFLINE', label: 'Offline' },
  { value: 'ONLINE_UNPROCTORED', label: 'Online · Unproctored' },
  { value: 'ONLINE_PROCTORED', label: 'Online · Proctored' },
  { value: 'HUMAN_PROCTORED', label: 'Human Proctored' },
  { value: 'AI_ASSISTED_PROCTORED', label: 'AI-Assisted Proctored' },
  { value: 'HYBRID', label: 'Hybrid' },
];

const MANAGER_ROLES = new Set(['EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN']);

async function postAction(payload: Json) {
  const response = await fetch('/api/examinations/proctoring/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Json;
  if (!response.ok) throw new Error(body.error || 'Unable to complete examination action.');
  return body;
}

function formatDate(value: string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function deliveryLabel(mode: ExamDeliveryMode) {
  return DELIVERY_MODES.find((item) => item.value === mode)?.label ?? mode;
}

function Pill({ children, tone = 'default' }: { children: React.ReactNode; tone?: 'default' | 'good' | 'warn' }) {
  const classes = tone === 'good'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300'
    : tone === 'warn'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300'
      : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300';
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] ${classes}`}>{children}</span>;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error('Unable to read selected image.'));
    reader.readAsDataURL(file);
  });
}

function Readiness({ exam }: { exam: StudentExamCard }) {
  const items = exam.readiness.items.filter((item) => item.required);
  if (!items.length) return null;
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
          {item.ready ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" /> : <Clock3 className="h-4 w-4 shrink-0 text-amber-600" />}
          <div className="min-w-0"><p className="truncate text-[11px] font-bold">{item.label}</p><p className="text-[9px] text-slate-500">{item.ready ? 'Ready' : item.detail || 'Required'}</p></div>
        </div>
      ))}
    </div>
  );
}

function IdentityCheck({ exam, reload }: { exam: StudentExamCard; reload: () => Promise<void> }) {
  const [idImage, setIdImage] = React.useState('');
  const [selfie, setSelfie] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  const profile = exam.securityProfile;
  const required = Boolean(profile && (profile.identityRequired || profile.selfieRequired || profile.livenessRequired));
  const verified = exam.identityState === 'MATCH' || exam.identityState === 'APPROVED';
  if (!required || !exam.attempt || verified) return null;

  async function capture(event: React.ChangeEvent<HTMLInputElement>, setter: (value: string) => void) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/webp'].includes(file.type) || file.size > 1_500_000) {
      setMessage('Use a JPEG or WebP image smaller than 1.5 MB.');
      return;
    }
    setter(await fileToDataUrl(file));
  }

  async function verify() {
    if (!idImage || !selfie) {
      setMessage('Capture both the institution ID and a live selfie.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await postAction({ action: 'verify_identity', attemptId: exam.attempt?.id, idCaptureDataUrl: idImage, selfieDataUrl: selfie });
      setMessage(result.state === 'REVIEW_REQUIRED'
        ? 'Automatic verification needs authorized human review.'
        : 'Identity verification was submitted successfully.');
      await reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Identity verification failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 dark:border-blue-900/50 dark:bg-blue-950/20">
      <div className="flex gap-3"><UserCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" /><div className="min-w-0 flex-1"><p className="text-sm font-extrabold">Identity verification</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Capture an approved institution ID and live selfie. Uncertain provider results go to an authorized human reviewer.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <label className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><span className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-blue-700" />{idImage ? 'ID captured ✓' : 'Capture institution ID'}</span><input className="sr-only" type="file" accept="image/jpeg,image/webp" capture="environment" onChange={(event) => void capture(event, setIdImage)} /></label>
          <label className="cursor-pointer rounded-xl border border-slate-200 bg-white p-3 text-xs font-bold dark:border-slate-700 dark:bg-slate-900"><span className="flex items-center gap-2"><Camera className="h-4 w-4 text-blue-700" />{selfie ? 'Selfie captured ✓' : 'Capture live selfie'}</span><input className="sr-only" type="file" accept="image/jpeg,image/webp" capture="user" onChange={(event) => void capture(event, setSelfie)} /></label>
        </div>
        <button onClick={() => void verify()} disabled={busy} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}Verify identity</button>
        {message && <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">{message}</p>}
      </div></div>
    </div>
  );
}

function StudentExamCardView({ exam, pairing, setPairing, reload }: {
  exam: StudentExamCard;
  pairing: Pairing;
  setPairing: (pairing: Pairing) => void;
  reload: () => Promise<void>;
}) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const online = exam.deliveryMode !== 'OFFLINE';
  const currentPairing = pairing?.attemptId === exam.attempt?.id ? pairing : null;

  async function run(key: string, payload: Json) {
    setBusy(key);
    setError(null);
    try {
      const result = await postAction(payload);
      await reload();
      return result;
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Unable to complete action.');
      return null;
    } finally {
      setBusy(null);
    }
  }

  async function precheck() {
    if (!exam.attempt) return;
    setBusy('precheck');
    setError(null);
    try {
      let cameraReady = !exam.securityProfile?.primaryCameraRequired;
      let microphoneReady = !exam.securityProfile?.microphoneRequired;
      if (navigator.mediaDevices?.getUserMedia && (exam.securityProfile?.primaryCameraRequired || exam.securityProfile?.microphoneRequired)) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: Boolean(exam.securityProfile?.primaryCameraRequired), audio: Boolean(exam.securityProfile?.microphoneRequired) });
        cameraReady = !exam.securityProfile?.primaryCameraRequired || stream.getVideoTracks().length > 0;
        microphoneReady = !exam.securityProfile?.microphoneRequired || stream.getAudioTracks().length > 0;
        stream.getTracks().forEach((track) => track.stop());
      }
      await postAction({
        action: 'save_precheck', attemptId: exam.attempt.id,
        browserSupported: window.isSecureContext && Boolean(navigator.mediaDevices),
        cameraReady, microphoneReady,
        screenShareReady: !exam.securityProfile?.screenShareRequired || Boolean(navigator.mediaDevices?.getDisplayMedia),
        fullscreenReady: !exam.securityProfile?.fullscreenRequired || Boolean(document.documentElement.requestFullscreen),
        secondCameraReady: ['PAIRED', 'CONNECTED'].includes(exam.secondCamera?.status ?? ''),
        networkQuality: navigator.onLine ? 'GOOD' : 'POOR',
        clientDetails: { userAgent: navigator.userAgent, language: navigator.language },
      });
      await reload();
    } catch (precheckError) {
      setError(precheckError instanceof Error ? precheckError.message : 'Device check failed.');
    } finally {
      setBusy(null);
    }
  }

  async function createPairing() {
    if (!exam.attempt) return;
    const result = await run('pairing', { action: 'create_3d_pairing', attemptId: exam.attempt.id });
    if (result?.token && result?.code && result?.expiresAt) {
      setPairing({ attemptId: exam.attempt.id, token: String(result.token), code: String(result.code), expiresAt: String(result.expiresAt) });
    }
  }

  async function start() {
    if (!exam.attempt) return;
    const result = await run('start', { action: 'start_attempt', attemptId: exam.attempt.id });
    if (result) router.push(`/examinations/attempt/${exam.attempt.id}`);
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <div className="border-b border-slate-100 p-5 dark:border-slate-800"><div className="flex flex-wrap gap-2"><Pill tone={online ? 'default' : 'good'}>{deliveryLabel(exam.deliveryMode)}</Pill><Pill>{exam.examType.replaceAll('_', ' ')}</Pill>{exam.attempt && <Pill tone={exam.readiness.ready ? 'good' : 'warn'}>{exam.attempt.status.replaceAll('_', ' ')}</Pill>}</div><h3 className="mt-3 text-lg font-extrabold tracking-[-0.02em]">{exam.examName}</h3><p className="mt-1 text-xs text-slate-500">{exam.courseCode ? `${exam.courseCode} · ${exam.courseTitle}` : 'Institution examination'} · {formatDate(exam.startsAt)}</p></div>
      <div className="space-y-4 p-5">
        {!online && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs leading-5 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-200">This exam uses the existing offline venue, admit-card and invigilation workflow. Secure online controls do not override it.</div>}
        {online && !exam.attempt && <button onClick={() => void run('attempt', { action: 'create_attempt', configId: exam.configId })} disabled={Boolean(busy)} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50">{busy === 'attempt' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Begin secure pre-check</button>}
        {online && exam.attempt && <>
          <Readiness exam={exam} />
          {exam.terms && !exam.terms.accepted && <details className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50"><summary className="cursor-pointer text-sm font-extrabold">{exam.terms.title} · {exam.terms.version}</summary><div className="mt-3 max-h-52 overflow-y-auto whitespace-pre-wrap rounded-xl bg-white p-4 text-xs leading-6 text-slate-600 dark:bg-slate-950 dark:text-slate-300">{exam.terms.content}</div><button onClick={() => void run('terms', { action: 'accept_terms', configId: exam.configId, termsVersionId: exam.terms?.id })} className="mt-3 h-10 rounded-xl bg-slate-900 px-4 text-xs font-extrabold text-white dark:bg-white dark:text-slate-900">Acknowledge terms</button></details>}
          <IdentityCheck exam={exam} reload={reload} />
          <div className="grid gap-3 sm:grid-cols-2"><button onClick={() => void precheck()} disabled={Boolean(busy)} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-3 text-left dark:border-slate-800"><Laptop className="h-5 w-5 text-blue-700" /><span><span className="block text-xs font-extrabold">Run device check</span><span className="text-[10px] text-slate-500">Validate required browser and device capabilities.</span></span></button>{exam.securityProfile?.secondCameraRequired && <button onClick={() => void createPairing()} disabled={Boolean(busy)} className="flex min-h-14 items-center gap-3 rounded-xl border border-slate-200 p-3 text-left dark:border-slate-800"><Phone className="h-5 w-5 text-orange-700" /><span><span className="block text-xs font-extrabold">Pair 3D Eyes</span><span className="text-[10px] text-slate-500">Connect the authenticated mobile second camera.</span></span></button>}</div>
          {currentPairing && <div className="rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20"><p className="text-xs font-extrabold">3D Eyes pairing code</p><p className="mt-2 font-mono text-2xl font-black tracking-[0.16em] text-orange-800 dark:text-orange-300">{currentPairing.code}</p><p className="mt-1 text-[10px] text-slate-500">Expires {formatDate(currentPairing.expiresAt)}.</p><Link href={`/examinations/3d-eyes?token=${encodeURIComponent(currentPairing.token)}`} className="mt-3 inline-flex h-9 items-center gap-2 rounded-lg bg-orange-700 px-3 text-[10px] font-extrabold text-white">Open mobile camera <ArrowRight className="h-3.5 w-3.5" /></Link></div>}
          {exam.attempt.status === 'WAITING_ROOM' && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">Waiting for authorized examiner approval. Keep required devices connected.</div>}
          {['IN_PROGRESS', 'RECONNECTING'].includes(exam.attempt.status) ? <Link href={`/examinations/attempt/${exam.attempt.id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white">Resume examination <ArrowRight className="h-4 w-4" /></Link> : ['SUBMITTED', 'AUTO_SUBMITTED', 'COMPLETED'].includes(exam.attempt.status) ? <p className="flex items-center gap-2 text-xs font-bold text-emerald-700"><CheckCircle2 className="h-4 w-4" />Examination submitted</p> : <button onClick={() => void start()} disabled={Boolean(busy) || !exam.readiness.ready} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"><ShieldCheck className="h-4 w-4" />Enter examination</button>}
        </>}
        {error && <p className="flex items-center gap-2 text-xs font-semibold text-red-600"><AlertTriangle className="h-4 w-4" />{error}</p>}
      </div>
    </article>
  );
}

function ManagerTools({ workspace, reload }: { workspace: Extract<SecureExamWorkspace, { kind: 'ADMIN' }>; reload: () => Promise<void> }) {
  const [profileName, setProfileName] = React.useState('High Security Proctored Exam');
  const [examId, setExamId] = React.useState('');
  const [courseOfferingId, setCourseOfferingId] = React.useState('');
  const [profileId, setProfileId] = React.useState('');
  const [mode, setMode] = React.useState<ExamDeliveryMode>('ONLINE_PROCTORED');
  const [duration, setDuration] = React.useState('60');
  const [startsAt, setStartsAt] = React.useState('');
  const [endsAt, setEndsAt] = React.useState('');
  const [termsVersion, setTermsVersion] = React.useState('v1');
  const [message, setMessage] = React.useState<string | null>(null);

  async function run(payload: Json, success: string) {
    setMessage(null);
    try { await postAction(payload); setMessage(success); await reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to save configuration.'); }
  }

  const defaultTerms = 'This examination may require identity verification, camera access, browser integrity events and an optional secondary mobile camera. AI-assisted monitoring creates signals for authorized human review and does not automatically determine misconduct. The institution controls permitted materials, retention, review and appeal processes.';

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">Security profile</p><p className="mt-1 text-xs leading-5 text-slate-500">Reusable exam security policy.</p><input value={profileName} onChange={(event) => setProfileName(event.target.value)} className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /><button onClick={() => void run({ action: 'create_security_profile', name: profileName, description: 'Identity, camera, fullscreen, 3D Eyes and human admission.', identityRequired: true, selfieRequired: true, primaryCameraRequired: true, fullscreenRequired: true, secondCameraRequired: true, humanAdmissionRequired: true, aiEventAnalysisEnabled: true, clipboardRestricted: true }, 'Security profile created.')} className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-extrabold text-white dark:bg-white dark:text-slate-900"><Plus className="h-4 w-4" />Create profile</button></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">Configure exam delivery</p><div className="mt-4 space-y-2"><select value={examId} onChange={(event) => setExamId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option value="">Select existing exam</option>{workspace.availableExams.map((exam) => <option key={exam.id} value={exam.id}>{exam.name} · {exam.type}</option>)}</select><select value={courseOfferingId} onChange={(event) => setCourseOfferingId(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900"><option value="">Institution-wide / no course restriction</option>{workspace.courseOfferings.map((course) => <option key={course.id} value={course.id}>{course.courseCode} · {course.courseTitle} · {course.sectionName}</option>)}</select><select value={mode} onChange={(event) => setMode(event.target.value as ExamDeliveryMode)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900">{DELIVERY_MODES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select><select value={profileId} onChange={(event) => setProfileId(event.target.value)} disabled={mode === 'OFFLINE' || mode === 'ONLINE_UNPROCTORED'} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900"><option value="">No security profile</option>{workspace.securityProfiles.filter((profile) => profile.status === 'ACTIVE').map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}</select><div className="grid grid-cols-2 gap-2"><input type="datetime-local" value={startsAt} onChange={(event) => setStartsAt(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-2 text-[10px] dark:border-slate-700 dark:bg-slate-900" /><input type="datetime-local" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="h-10 rounded-xl border border-slate-200 px-2 text-[10px] dark:border-slate-700 dark:bg-slate-900" /></div><input type="number" min="1" max="1440" value={duration} onChange={(event) => setDuration(event.target.value)} className="h-10 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /></div><button disabled={!examId} onClick={() => void run({ action: 'configure_exam', examId, courseOfferingId: courseOfferingId || null, securityProfileId: profileId || null, deliveryMode: mode, startsAt: startsAt ? new Date(startsAt).toISOString() : null, endsAt: endsAt ? new Date(endsAt).toISOString() : null, durationMinutes: Number(duration), maxAttempts: 1 }, 'Exam configuration saved.')} className="mt-3 h-10 rounded-xl bg-blue-700 px-4 text-xs font-extrabold text-white disabled:opacity-50">Save exam</button></section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950"><p className="text-sm font-extrabold">Versioned terms</p><input value={termsVersion} onChange={(event) => setTermsVersion(event.target.value)} className="mt-4 h-10 w-full rounded-xl border border-slate-200 px-3 text-xs dark:border-slate-700 dark:bg-slate-900" /><button onClick={() => void run({ action: 'create_terms', version: termsVersion, title: 'Secure examination terms & privacy notice', content: defaultTerms }, 'Terms version created.')} className="mt-3 h-10 rounded-xl border border-slate-300 px-4 text-xs font-extrabold dark:border-slate-700">Create terms</button><p className="mt-3 text-[10px] leading-5 text-slate-500">Terms explain identity, cameras, AI-assisted signals, retention, review and appeal responsibilities.</p></section>
      {message && <p className="xl:col-span-3 text-xs font-semibold text-slate-600 dark:text-slate-300">{message}</p>}
    </div>
  );
}

function ProctorConsole({ workspace, reload }: { workspace: Extract<SecureExamWorkspace, { kind: 'ADMIN' }>; reload: () => Promise<void> }) {
  const [message, setMessage] = React.useState<string | null>(null);
  async function run(payload: Json) {
    setMessage(null);
    try { await postAction(payload); await reload(); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to complete proctor action.'); }
  }
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="border-b border-slate-100 p-5 dark:border-slate-800"><div className="flex items-center gap-2"><Video className="h-5 w-5 text-blue-700" /><p className="text-sm font-extrabold">Live proctor console</p></div><p className="mt-1 text-xs text-slate-500">Signals guide attention. Authorized humans determine any integrity outcome.</p></div>{workspace.liveAttempts.length === 0 ? <p className="p-6 text-center text-xs text-slate-500">No assigned secure-exam sessions are active.</p> : workspace.liveAttempts.map((attempt) => <div key={attempt.attemptId} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center"><div><p className="text-xs font-extrabold">{attempt.studentName} · {attempt.rollNumber}</p><p className="mt-1 text-[10px] text-slate-500">{attempt.examName} · {attempt.status.replaceAll('_', ' ')}</p></div><div className="flex flex-wrap gap-2"><Pill tone={['MATCH', 'APPROVED'].includes(attempt.identityState ?? '')}>ID {attempt.identityState || 'pending'}</Pill><Pill tone={['PAIRED', 'CONNECTED'].includes(attempt.secondCameraStatus ?? '')}>3D Eyes {attempt.secondCameraStatus || 'off'}</Pill><Pill tone={attempt.unreviewedHighEvents ? 'warn' : 'default'}>{attempt.unreviewedHighEvents} high alerts</Pill></div><div className="flex flex-wrap gap-2"><button onClick={() => void run({ action: 'review_identity', attemptId: attempt.attemptId, decision: 'APPROVED', note: 'Identity reviewed by authorized proctor.' })} className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-extrabold text-emerald-700">Approve ID</button><button onClick={() => void run({ action: 'admit_attempt', attemptId: attempt.attemptId })} className="rounded-lg bg-blue-700 px-3 py-2 text-[10px] font-extrabold text-white">Admit</button><button onClick={() => void run({ action: 'proctor_report', attemptId: attempt.attemptId, category: 'INTEGRITY_CONCERN', severity: 'MEDIUM', description: 'Proctor requested post-exam human review. No automatic academic action was taken.' })} className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[10px] font-extrabold text-amber-800">Report concern</button></div></div>)}{message && <p className="p-4 text-xs font-semibold text-red-600">{message}</p>}</section>
  );
}

export function SecureExaminationWorkspaceV2() {
  const [workspace, setWorkspace] = React.useState<SecureExamWorkspace | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pairing, setPairing] = React.useState<Pairing>(null);

  const load = React.useCallback(async () => {
    setError(null);
    try {
      const response = await fetch('/api/examinations/proctoring/workspace', { cache: 'no-store' });
      const body = await response.json() as SecureExamWorkspace & ApiError;
      if (!response.ok) throw new Error(body.error || 'Unable to load secure examinations.');
      setWorkspace(body);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load secure examinations.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="flex min-h-[440px] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-blue-700" /></div>;
  if (error) return <div className="m-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-semibold text-red-700">{error}</div>;
  if (!workspace) return null;

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
      <header className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950"><div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between"><div><p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.12em] text-blue-700"><ShieldCheck className="h-4 w-4" />NAVEMORA Secure Examination</p><h1 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Examination, proctoring & 3D Eyes</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">Institution-controlled offline, online and hybrid delivery with server-authorized verification, resilient attempts and human-reviewed proctoring evidence.</p></div><div className="grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900"><Camera className="mx-auto h-4 w-4 text-blue-700" /><p className="mt-1 text-[9px] font-bold text-slate-500">Primary camera</p></div><div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900"><Phone className="mx-auto h-4 w-4 text-orange-700" /><p className="mt-1 text-[9px] font-bold text-slate-500">3D Eyes</p></div><div className="rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900"><UserCheck className="mx-auto h-4 w-4 text-emerald-700" /><p className="mt-1 text-[9px] font-bold text-slate-500">Human review</p></div></div></div></header>
      {!workspace.storeReady && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold text-amber-800">Secure examination storage has not been provisioned for this deployment.</div>}
      {workspace.kind === 'STUDENT' ? <><div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Student</p><p className="mt-1 text-sm font-extrabold">{workspace.student.name}</p><p className="text-[10px] text-slate-500">{workspace.student.rollNumber}</p></div><Link href="/examinations/system-check" className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><Laptop className="h-5 w-5 text-blue-700" /><p className="mt-2 text-xs font-extrabold">Practice system check</p><p className="mt-1 text-[10px] text-slate-500">Test camera and browser capabilities before exam day.</p></Link><div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><Wifi className="h-5 w-5 text-emerald-700" /><p className="mt-2 text-xs font-extrabold">Resilient attempt</p><p className="mt-1 text-[10px] text-slate-500">Versioned autosave and reconnect-safe state.</p></div></div><div className="space-y-4">{workspace.exams.length ? workspace.exams.map((exam) => <StudentExamCardView key={exam.configId} exam={exam} pairing={pairing} setPairing={setPairing} reload={load} />) : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950">No secure examinations are currently published for this enrollment.</div>}</div></> : <>{MANAGER_ROLES.has(workspace.role) && <ManagerTools workspace={workspace} reload={load} />}<ProctorConsole workspace={workspace} reload={load} />{MANAGER_ROLES.has(workspace.role) && <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800"><div><p className="text-sm font-extrabold">Configured examinations</p><p className="mt-1 text-xs text-slate-500">Delivery mode belongs to each exam and is not forced by study mode.</p></div><button onClick={() => void load()} className="rounded-lg border border-slate-200 p-2 dark:border-slate-700"><RefreshCw className="h-4 w-4" /></button></div>{workspace.exams.length ? workspace.exams.map((exam) => <div key={exam.configId} className="grid gap-3 border-b border-slate-100 p-4 last:border-0 dark:border-slate-800 lg:grid-cols-[1.4fr_1fr_auto] lg:items-center"><div><p className="text-xs font-extrabold">{exam.examName}</p><p className="mt-1 text-[10px] text-slate-500">{exam.courseCode ? `${exam.courseCode} · ${exam.courseTitle}` : 'Institution exam'} · {formatDate(exam.startsAt)}</p></div><div className="flex flex-wrap gap-2"><Pill>{deliveryLabel(exam.deliveryMode)}</Pill><Pill tone={exam.status === 'PUBLISHED' ? 'good' : 'default'}>{exam.status}</Pill></div><div className="flex items-center gap-2 text-[10px] text-slate-500"><span>{exam.attemptCount} attempts</span><span>{exam.reviewRequiredCount} review</span>{exam.status === 'DRAFT' && <button onClick={() => void postAction({ action: 'set_exam_status', configId: exam.configId, status: 'PUBLISHED' }).then(load)} className="rounded-lg bg-blue-700 px-3 py-2 font-extrabold text-white">Publish</button>}</div></div>) : <p className="p-8 text-center text-xs text-slate-500">No secure exam configurations yet.</p>}</section>}</>}
      <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><div><p className="text-xs font-extrabold">Integrity rule</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Camera, focus, network and AI-assisted events are review signals only. They do not automatically fail, remove or declare a student guilty.</p></div></div>
    </div>
  );
}
