'use client';

import Link from 'next/link';
import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Save,
  ShieldCheck,
  Video,
  Wifi,
  WifiOff,
} from 'lucide-react';

import type { ExamAttemptQuestion, ExamAttemptSession } from '@/lib/secure-examination-types';

type Props = { attemptId: string };
type ApiError = { error?: string };

async function postAction(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete exam action.');
  return body;
}

function localKey(questionId: string) {
  return `navemora:exam:draft:${questionId}`;
}

function remainingLabel(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return hours
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function QuestionControl({ question, value, onChange, onBlur }: {
  question: ExamAttemptQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const options = Array.isArray(question.options) ? question.options : [];

  if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
    const choices = question.questionType === 'TRUE_FALSE' && options.length === 0 ? ['True', 'False'] : options;
    return <div className="space-y-2">{choices.map((option, index) => {
      const text = typeof option === 'string' ? option : JSON.stringify(option);
      return <label key={`${text}-${index}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><input type="radio" name={question.id} checked={value === text} onChange={() => onChange(text)} onBlur={onBlur} className="mt-1" /><span className="text-sm leading-6">{text}</span></label>;
    })}</div>;
  }

  if (question.questionType === 'MULTIPLE_CHOICE') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return <div className="space-y-2">{options.map((option, index) => {
      const text = typeof option === 'string' ? option : JSON.stringify(option);
      const checked = selected.includes(text);
      return <label key={`${text}-${index}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700"><input type="checkbox" checked={checked} onChange={() => onChange(checked ? selected.filter((item) => item !== text) : [...selected, text])} onBlur={onBlur} className="mt-1" /><span className="text-sm leading-6">{text}</span></label>;
    })}</div>;
  }

  if (question.questionType === 'NUMERIC') {
    return <input type="number" value={value === null || value === undefined ? '' : String(value)} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" />;
  }

  return <textarea value={value === null || value === undefined ? '' : String(value)} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} rows={['LONG_TEXT', 'CASE_STUDY', 'CODE'].includes(question.questionType) ? 12 : 5} spellCheck={question.questionType !== 'CODE'} className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" placeholder="Type your answer…" />;
}

export function SecureExamAttemptV2({ attemptId }: Props) {
  const [session, setSession] = React.useState<ExamAttemptSession | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [dirty, setDirty] = React.useState<Set<string>>(new Set());
  const [index, setIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [online, setOnline] = React.useState(true);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const autosubmitStarted = React.useRef(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = React.useCallback(async () => {
    const response = await fetch(`/api/examinations/proctoring/attempt/${encodeURIComponent(attemptId)}`, { cache: 'no-store' });
    const body = await response.json() as ExamAttemptSession & ApiError;
    if (!response.ok) throw new Error(body.error || 'Unable to load examination.');
    setSession(body);
    const restored: Record<string, unknown> = {};
    body.questions.forEach((question) => {
      if (question.answer !== null && question.answer !== undefined) restored[question.id] = question.answer;
      else {
        try {
          const draft = window.localStorage.getItem(localKey(question.id));
          if (draft) restored[question.id] = JSON.parse(draft);
        } catch {
          // Local recovery is best effort only.
        }
      }
    });
    setAnswers(restored);
    setRemaining(body.deadlineAt ? new Date(body.deadlineAt).getTime() - Date.now() : null);
  }, [attemptId]);

  React.useEffect(() => {
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load examination.')).finally(() => setLoading(false));
  }, [load]);

  React.useEffect(() => {
    const onOnline = () => { setOnline(true); void postAction({ action: 'record_event', attemptId, source: 'NETWORK', eventType: 'NETWORK_RECONNECTED', severity: 'INFO' }).catch(() => undefined); };
    const onOffline = () => { setOnline(false); void postAction({ action: 'record_event', attemptId, source: 'NETWORK', eventType: 'NETWORK_DISCONNECTED', severity: 'LOW' }).catch(() => undefined); };
    setOnline(navigator.onLine);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [attemptId]);

  React.useEffect(() => {
    if (!session || ['OFFLINE', 'ONLINE_UNPROCTORED'].includes(session.deliveryMode)) return;
    let active = true;
    let created: MediaStream | null = null;
    void navigator.mediaDevices?.getUserMedia({ video: true, audio: false }).then((stream) => {
      if (!active) { stream.getTracks().forEach((track) => track.stop()); return; }
      created = stream;
      setCameraStream(stream);
      stream.getVideoTracks().forEach((track) => track.addEventListener('ended', () => {
        void postAction({ action: 'record_event', attemptId, source: 'PRIMARY_CAMERA', eventType: 'CAMERA_DISCONNECTED', severity: 'MEDIUM' }).catch(() => undefined);
      }));
    }).catch(() => {
      void postAction({ action: 'record_event', attemptId, source: 'PRIMARY_CAMERA', eventType: 'CAMERA_PERMISSION_UNAVAILABLE', severity: 'MEDIUM' }).catch(() => undefined);
    });
    return () => { active = false; created?.getTracks().forEach((track) => track.stop()); };
  }, [attemptId, session]);

  React.useEffect(() => {
    if (videoRef.current && cameraStream) videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  React.useEffect(() => {
    if (!session || !['IN_PROGRESS', 'RECONNECTING'].includes(session.status)) return;
    const visibility = () => {
      if (document.visibilityState === 'hidden') void postAction({ action: 'record_event', attemptId, source: 'SCREEN', eventType: 'TAB_HIDDEN', severity: 'LOW' }).catch(() => undefined);
    };
    const fullscreen = () => {
      if (!document.fullscreenElement) void postAction({ action: 'record_event', attemptId, source: 'SCREEN', eventType: 'FULLSCREEN_EXIT', severity: 'LOW' }).catch(() => undefined);
    };
    document.addEventListener('visibilitychange', visibility);
    document.addEventListener('fullscreenchange', fullscreen);
    return () => { document.removeEventListener('visibilitychange', visibility); document.removeEventListener('fullscreenchange', fullscreen); };
  }, [attemptId, session]);

  const saveOne = React.useCallback(async (questionId: string) => {
    if (!session || !dirty.has(questionId)) return;
    setSaving(true);
    try {
      await postAction({ action: 'save_answer', attemptId, attemptQuestionId: questionId, answer: answers[questionId] ?? null, idempotencyKey: `${attemptId}:${questionId}:${crypto.randomUUID()}` });
      setDirty((current) => { const next = new Set(current); next.delete(questionId); return next; });
      try { window.localStorage.removeItem(localKey(questionId)); } catch { /* best effort */ }
    } finally {
      setSaving(false);
    }
  }, [answers, attemptId, dirty, session]);

  React.useEffect(() => {
    if (!dirty.size) return;
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      dirty.forEach((questionId) => { void saveOne(questionId).catch(() => undefined); });
    }, 1200);
    return () => { if (saveTimer.current) window.clearTimeout(saveTimer.current); };
  }, [dirty, saveOne]);

  React.useEffect(() => {
    if (!session?.deadlineAt || !['IN_PROGRESS', 'RECONNECTING'].includes(session.status)) return;
    const tick = () => setRemaining(new Date(session.deadlineAt as string).getTime() - Date.now());
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const submit = React.useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const questionId of [...dirty]) await saveOne(questionId);
      await postAction({ action: 'submit_attempt', attemptId, auto });
      cameraStream?.getTracks().forEach((track) => track.stop());
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit examination.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, cameraStream, dirty, load, saveOne, submitting]);

  React.useEffect(() => {
    if (remaining === null || remaining > 0 || autosubmitStarted.current || !session || !['IN_PROGRESS', 'RECONNECTING'].includes(session.status)) return;
    autosubmitStarted.current = true;
    void submit(true);
  }, [remaining, session, submit]);

  function changeAnswer(questionId: string, value: unknown) {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    setDirty((current) => new Set(current).add(questionId));
    try { window.localStorage.setItem(localKey(questionId), JSON.stringify(value)); } catch { /* storage can be unavailable */ }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>;
  if (error && !session) return <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error}</div>;
  if (!session) return null;

  const submitted = ['SUBMITTED', 'AUTO_SUBMITTED', 'COMPLETED'].includes(session.status);
  if (submitted) return <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950"><div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" /><h1 className="mt-5 text-2xl font-black">Examination submitted</h1><p className="mt-2 text-sm leading-6 text-slate-500">Answers were finalized. Any proctoring signals remain subject to authorized human review.</p><div className="mt-5 rounded-xl bg-slate-50 p-4 text-left dark:bg-slate-950"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Submission reference</p><p className="mt-1 break-all font-mono text-xs font-bold">{session.submissionReference || 'Recorded by NAVEMORA'}</p></div><Link href="/examinations" className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white">Return to examinations</Link></div></div>;

  const question = session.questions[index];
  const answered = session.questions.filter((item) => answers[item.id] !== undefined && answers[item.id] !== null && answers[item.id] !== '').length;

  return <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6"><div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.12em] text-blue-700">Secure attempt</p><h1 className="mt-1 truncate text-sm font-extrabold sm:text-base">{session.examName}</h1></div><div className="flex items-center gap-2"><span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold sm:inline-flex ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{online ? 'Connected' : 'Reconnecting'}</span><span className="inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 font-mono text-sm font-black text-white dark:bg-white dark:text-slate-900"><Clock3 className="h-4 w-4" />{remaining === null ? '--:--' : remainingLabel(remaining)}</span></div></div></header>
    <div className="mx-auto grid max-w-[1600px] gap-5 p-4 sm:p-6 xl:grid-cols-[240px_minmax(0,1fr)_220px]">
      <aside className="order-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 xl:order-1 xl:self-start"><div className="flex items-center justify-between"><p className="text-xs font-extrabold">Questions</p><span className="text-[10px] font-bold text-slate-400">{answered}/{session.questions.length}</span></div><div className="mt-3 grid grid-cols-5 gap-2 xl:grid-cols-4">{session.questions.map((item, itemIndex) => { const hasAnswer = answers[item.id] !== undefined && answers[item.id] !== null && answers[item.id] !== ''; return <button key={item.id} onClick={() => setIndex(itemIndex)} className={`flex aspect-square items-center justify-center rounded-lg text-[10px] font-extrabold ${itemIndex === index ? 'bg-blue-700 text-white' : hasAnswer ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{itemIndex + 1}</button>; })}</div><p className="mt-4 flex items-center gap-2 text-[10px] text-slate-500"><Save className="h-3.5 w-3.5" />{saving ? 'Saving…' : dirty.size ? `${dirty.size} pending` : 'Answers synced'}</p></aside>
      <main className="order-1 min-w-0 xl:order-2">{question ? <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.09em] text-blue-700">{question.sectionTitle}</p><p className="mt-1 text-xs font-bold text-slate-400">Question {index + 1} of {session.questions.length}</p></div><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold dark:bg-slate-800">{question.marks} mark{question.marks === 1 ? '' : 's'}</span></div><div className="mt-6 whitespace-pre-wrap text-base font-semibold leading-7">{question.prompt}</div><div className="mt-6"><QuestionControl question={question} value={answers[question.id] ?? null} onChange={(value) => changeAnswer(question.id, value)} onBlur={() => void saveOne(question.id).catch((saveError) => setError(saveError instanceof Error ? saveError.message : 'Save failed.'))} /></div><div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-between dark:border-slate-800"><button disabled={index === 0} onClick={() => setIndex((current) => Math.max(0, current - 1))} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold disabled:opacity-40 dark:border-slate-700"><ChevronLeft className="h-4 w-4" />Previous</button><div className="flex gap-2"><button onClick={() => void saveOne(question.id).catch((saveError) => setError(saveError instanceof Error ? saveError.message : 'Save failed.'))} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-extrabold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"><Save className="h-4 w-4" />Save</button>{index < session.questions.length - 1 ? <button onClick={() => setIndex((current) => Math.min(session.questions.length - 1, current + 1))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white">Next<ChevronRight className="h-4 w-4" /></button> : <button disabled={submitting} onClick={() => { if (window.confirm('Submit this examination? You cannot continue this attempt after submission.')) void submit(false); }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-extrabold text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Submit</button>}</div></div></div> : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">No questions are assigned to this attempt.</div>}{error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4" />{error}</div>}</main>
      <aside className="order-3 space-y-3 xl:self-start">{!['OFFLINE', 'ONLINE_UNPROCTORED'].includes(session.deliveryMode) && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800"><span className="flex items-center gap-1.5 text-[10px] font-extrabold"><Video className="h-3.5 w-3.5 text-blue-700" />Primary camera</span><span className={`h-2 w-2 rounded-full ${cameraStream ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div><div className="aspect-video bg-black"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" /></div></div>}<button onClick={() => void document.documentElement.requestFullscreen().catch(() => undefined)} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left dark:border-slate-800 dark:bg-slate-900"><ShieldCheck className="h-4 w-4 text-blue-700" /><span><span className="block text-[10px] font-extrabold">Secure fullscreen</span><span className="text-[9px] text-slate-500">Return to fullscreen if the browser exits.</span></span></button><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[9px] leading-4 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">Browser, camera and network events are review signals and are not automatic misconduct findings.</div></aside>
    </div>
  </div>;
}
