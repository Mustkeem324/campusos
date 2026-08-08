'use client';

import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  LockKeyhole,
  Save,
  ShieldCheck,
  Video,
  Wifi,
  WifiOff,
} from 'lucide-react';

import type { ExamAttemptQuestion, ExamAttemptSession } from '@/lib/secure-examination-types';

type Props = { attemptId: string };
type ApiError = { error?: string };

async function action(payload: Record<string, unknown>) {
  const response = await fetch('/api/examinations/proctoring/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => ({})) as ApiError & Record<string, unknown>;
  if (!response.ok) throw new Error(body.error || 'Unable to complete exam action.');
  return body;
}

function answerKey(attemptQuestionId: string) {
  return `navemora:exam:draft:${attemptQuestionId}`;
}

function formatRemaining(milliseconds: number) {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function QuestionInput({ question, value, onChange, onBlur }: {
  question: ExamAttemptQuestion;
  value: unknown;
  onChange: (value: unknown) => void;
  onBlur: () => void;
}) {
  const options = Array.isArray(question.options) ? question.options : [];

  if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
    const choices = question.questionType === 'TRUE_FALSE' && !options.length ? ['True', 'False'] : options;
    return (
      <div className="space-y-2">
        {choices.map((option, index) => {
          const optionValue = typeof option === 'string' ? option : JSON.stringify(option);
          return (
            <label key={`${optionValue}-${index}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950">
              <input type="radio" name={question.id} checked={value === optionValue} onChange={() => onChange(optionValue)} onBlur={onBlur} className="mt-0.5" />
              <span className="text-sm leading-6 text-slate-700 dark:text-slate-200">{optionValue}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.questionType === 'MULTIPLE_CHOICE') {
    const selected = Array.isArray(value) ? value.map(String) : [];
    return (
      <div className="space-y-2">
        {options.map((option, index) => {
          const optionValue = typeof option === 'string' ? option : JSON.stringify(option);
          const checked = selected.includes(optionValue);
          return (
            <label key={`${optionValue}-${index}`} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-blue-300 dark:border-slate-700 dark:bg-slate-950">
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onChange(checked ? selected.filter((item) => item !== optionValue) : [...selected, optionValue])}
                onBlur={onBlur}
                className="mt-0.5"
              />
              <span className="text-sm leading-6 text-slate-700 dark:text-slate-200">{optionValue}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.questionType === 'NUMERIC') {
    return <input type="number" value={value === null || value === undefined ? '' : String(value)} onChange={(event) => onChange(event.target.value)} onBlur={onBlur} className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950" />;
  }

  const rows = ['LONG_TEXT', 'CASE_STUDY', 'CODE'].includes(question.questionType) ? 12 : 5;
  return (
    <textarea
      value={value === null || value === undefined ? '' : String(value)}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      rows={rows}
      spellCheck={question.questionType !== 'CODE'}
      className="w-full resize-y rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
      placeholder="Type your answer…"
    />
  );
}

export function SecureExamAttempt({ attemptId }: Props) {
  const [session, setSession] = React.useState<ExamAttemptSession | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const [dirty, setDirty] = React.useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [online, setOnline] = React.useState(true);
  const [remaining, setRemaining] = React.useState<number | null>(null);
  const [cameraStream, setCameraStream] = React.useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const autoSubmitStarted = React.useRef(false);
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = React.useCallback(async () => {
    const response = await fetch(`/api/examinations/proctoring/attempt/${encodeURIComponent(attemptId)}`, { cache: 'no-store' });
    const body = await response.json() as ExamAttemptSession & ApiError;
    if (!response.ok) throw new Error(body.error || 'Unable to load examination.');
    setSession(body);
    const initial: Record<string, unknown> = {};
    body.questions.forEach((question) => {
      if (question.answer !== null && question.answer !== undefined) initial[question.id] = question.answer;
      else {
        try {
          const local = window.localStorage.getItem(answerKey(question.id));
          if (local) initial[question.id] = JSON.parse(local);
        } catch {
          // Local draft recovery is best-effort only.
        }
      }
    });
    setAnswers(initial);
    if (body.deadlineAt) setRemaining(new Date(body.deadlineAt).getTime() - Date.now());
  }, [attemptId]);

  React.useEffect(() => {
    void load().catch((loadError) => setError(loadError instanceof Error ? loadError.message : 'Unable to load exam.')).finally(() => setLoading(false));
  }, [load]);

  React.useEffect(() => {
    const onOnline = () => { setOnline(true); void action({ action: 'record_event', attemptId, source: 'NETWORK', eventType: 'NETWORK_RECONNECTED', severity: 'INFO' }).catch(() => undefined); };
    const onOffline = () => { setOnline(false); void action({ action: 'record_event', attemptId, source: 'NETWORK', eventType: 'NETWORK_DISCONNECTED', severity: 'LOW' }).catch(() => undefined); };
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    setOnline(navigator.onLine);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [attemptId]);

  React.useEffect(() => {
    if (!session || session.deliveryMode === 'ONLINE_UNPROCTORED' || session.deliveryMode === 'OFFLINE') return;
    let cancelled = false;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: false }).then((stream) => {
      if (cancelled) { stream.getTracks().forEach((track) => track.stop()); return; }
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      stream.getVideoTracks().forEach((track) => {
        track.addEventListener('ended', () => {
          void action({ action: 'record_event', attemptId, source: 'PRIMARY_CAMERA', eventType: 'CAMERA_DISCONNECTED', severity: 'MEDIUM' }).catch(() => undefined);
        });
      });
    }).catch(() => {
      void action({ action: 'record_event', attemptId, source: 'PRIMARY_CAMERA', eventType: 'CAMERA_PERMISSION_UNAVAILABLE', severity: 'MEDIUM' }).catch(() => undefined);
    });
    return () => { cancelled = true; cameraStream?.getTracks().forEach((track) => track.stop()); };
    // cameraStream is intentionally not a dependency; cleanup captures the stream managed by this effect lifecycle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, session?.deliveryMode]);

  React.useEffect(() => {
    if (!cameraStream || !videoRef.current) return;
    videoRef.current.srcObject = cameraStream;
  }, [cameraStream]);

  React.useEffect(() => {
    if (!session || !['IN_PROGRESS', 'RECONNECTING'].includes(session.status)) return;
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        void action({ action: 'record_event', attemptId, source: 'SCREEN', eventType: 'TAB_HIDDEN', severity: 'LOW' }).catch(() => undefined);
      }
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement) {
        void action({ action: 'record_event', attemptId, source: 'SCREEN', eventType: 'FULLSCREEN_EXIT', severity: 'LOW' }).catch(() => undefined);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => { document.removeEventListener('visibilitychange', onVisibility); document.removeEventListener('fullscreenchange', onFullscreen); };
  }, [attemptId, session]);

  const saveQuestion = React.useCallback(async (questionId: string) => {
    if (!session || !dirty.has(questionId)) return;
    const value = answers[questionId] ?? null;
    setSaving(true);
    try {
      await action({
        action: 'save_answer',
        attemptId,
        attemptQuestionId: questionId,
        answer: value,
        idempotencyKey: `${attemptId}:${questionId}:${crypto.randomUUID()}`,
      });
      setDirty((previous) => {
        const next = new Set(previous);
        next.delete(questionId);
        return next;
      });
      try { window.localStorage.removeItem(answerKey(questionId)); } catch { /* best effort */ }
    } finally {
      setSaving(false);
    }
  }, [answers, attemptId, dirty, session]);

  React.useEffect(() => {
    if (!dirty.size) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      dirty.forEach((questionId) => { void saveQuestion(questionId).catch(() => undefined); });
    }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [dirty, saveQuestion]);

  React.useEffect(() => {
    if (!session?.deadlineAt || !['IN_PROGRESS', 'RECONNECTING'].includes(session.status)) return;
    const update = () => setRemaining(new Date(session.deadlineAt as string).getTime() - Date.now());
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [session]);

  const submit = React.useCallback(async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const pending = [...dirty];
      for (const questionId of pending) await saveQuestion(questionId);
      await action({ action: 'submit_attempt', attemptId, auto });
      cameraStream?.getTracks().forEach((track) => track.stop());
      await load();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to submit examination.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, cameraStream, dirty, load, saveQuestion, submitting]);

  React.useEffect(() => {
    if (remaining === null || remaining > 0 || autoSubmitStarted.current || !session || !['IN_PROGRESS', 'RECONNECTING'].includes(session.status)) return;
    autoSubmitStarted.current = true;
    void submit(true);
  }, [remaining, session, submit]);

  function updateAnswer(questionId: string, value: unknown) {
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
    setDirty((previous) => new Set(previous).add(questionId));
    try { window.localStorage.setItem(answerKey(questionId), JSON.stringify(value)); } catch { /* storage can be unavailable */ }
  }

  async function requestFullscreen() {
    try { await document.documentElement.requestFullscreen(); } catch { /* browser or policy may decline */ }
  }

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="h-7 w-7 animate-spin text-blue-700" /></div>;
  if (error && !session) return <div className="mx-auto mt-20 max-w-xl rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700">{error}</div>;
  if (!session) return null;

  const submitted = ['SUBMITTED', 'AUTO_SUBMITTED', 'COMPLETED'].includes(session.status);
  const current = session.questions[currentIndex];
  const answeredCount = session.questions.filter((question) => answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== '').length;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"><CheckCircle2 className="h-7 w-7" /></span>
          <h1 className="mt-5 text-2xl font-black text-slate-950 dark:text-white">Examination submitted</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">Your answers were finalized. Proctoring events, if any, remain subject to human review and do not automatically determine misconduct.</p>
          <div className="mt-5 rounded-xl bg-slate-50 p-4 text-left dark:bg-slate-950"><p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Submission reference</p><p className="mt-1 break-all font-mono text-xs font-bold text-slate-800 dark:text-slate-100">{session.submissionReference || 'Recorded by NAVEMORA'}</p></div>
          <a href="/examinations" className="mt-6 inline-flex h-11 items-center rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white">Return to examinations</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="min-w-0"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.12em] text-blue-700"><LockKeyhole className="h-3.5 w-3.5" />Secure attempt</div><h1 className="mt-1 truncate text-sm font-extrabold sm:text-base">{session.examName}</h1></div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold sm:inline-flex ${online ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>{online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}{online ? 'Connected' : 'Reconnecting'}</span>
            <span className="inline-flex min-w-[92px] items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 font-mono text-sm font-black text-white dark:bg-white dark:text-slate-900"><Clock3 className="h-4 w-4" />{remaining === null ? '--:--' : formatRemaining(remaining)}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1600px] gap-5 p-4 sm:p-6 xl:grid-cols-[250px_minmax(0,1fr)_230px]">
        <aside className="order-2 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 xl:order-1 xl:self-start">
          <div className="flex items-center justify-between"><p className="text-xs font-extrabold">Questions</p><span className="text-[10px] font-bold text-slate-400">{answeredCount}/{session.questions.length}</span></div>
          <div className="mt-3 grid grid-cols-5 gap-2 xl:grid-cols-4">
            {session.questions.map((question, index) => {
              const answered = answers[question.id] !== undefined && answers[question.id] !== null && answers[question.id] !== '';
              return <button key={question.id} onClick={() => setCurrentIndex(index)} className={`flex aspect-square items-center justify-center rounded-lg text-[10px] font-extrabold ${index === currentIndex ? 'bg-blue-700 text-white' : answered ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}`}>{index + 1}</button>;
            })}
          </div>
          <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500"><Save className="h-3.5 w-3.5" />{saving ? 'Saving answer…' : dirty.size ? `${dirty.size} change(s) pending sync` : 'Answers synced'}</div>
        </aside>

        <main className="order-1 min-w-0 xl:order-2">
          {current ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.09em] text-blue-700">{current.sectionTitle}</p><p className="mt-1 text-xs font-bold text-slate-400">Question {currentIndex + 1} of {session.questions.length}</p></div><span className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-extrabold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{current.marks} mark{current.marks === 1 ? '' : 's'}</span></div>
              <div className="mt-6 whitespace-pre-wrap text-base font-semibold leading-7 text-slate-900 dark:text-white">{current.prompt}</div>
              <div className="mt-6"><QuestionInput question={current} value={answers[current.id] ?? null} onChange={(value) => updateAnswer(current.id, value)} onBlur={() => void saveQuestion(current.id).catch((saveError) => setError(saveError instanceof Error ? saveError.message : 'Save failed.'))} /></div>
              <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                <button disabled={currentIndex === 0} onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-xs font-extrabold disabled:opacity-40 dark:border-slate-700"><ChevronLeft className="h-4 w-4" />Previous</button>
                <div className="flex gap-2"><button onClick={() => void saveQuestion(current.id).catch((saveError) => setError(saveError instanceof Error ? saveError.message : 'Save failed.'))} className="inline-flex h-11 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 text-xs font-extrabold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"><Save className="h-4 w-4" />Save</button>{currentIndex < session.questions.length - 1 ? <button onClick={() => setCurrentIndex((index) => Math.min(session.questions.length - 1, index + 1))} className="inline-flex h-11 items-center gap-2 rounded-xl bg-blue-700 px-5 text-xs font-extrabold text-white">Next<ChevronRight className="h-4 w-4" /></button> : <button disabled={submitting} onClick={() => { if (window.confirm('Submit this examination? You will not be able to continue this attempt.')) void submit(false); }} className="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-700 px-5 text-xs font-extrabold text-white disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}Submit</button>}</div>
              </div>
            </div>
          ) : <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900">No questions are assigned to this attempt.</div>}
          {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        </main>

        <aside className="order-3 space-y-3 xl:self-start">
          {session.deliveryMode !== 'ONLINE_UNPROCTORED' && session.deliveryMode !== 'OFFLINE' && <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800"><span className="flex items-center gap-1.5 text-[10px] font-extrabold"><Video className="h-3.5 w-3.5 text-blue-700" />Primary camera</span><span className={`h-2 w-2 rounded-full ${cameraStream ? 'bg-emerald-500' : 'bg-amber-500'}`} /></div><div className="aspect-video bg-slate-950"><video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover" /></div></div>}
          <button onClick={() => void requestFullscreen()} className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left dark:border-slate-800 dark:bg-slate-900"><ShieldCheck className="h-4 w-4 text-blue-700" /><span><span className="block text-[10px] font-extrabold">Secure fullscreen</span><span className="text-[9px] text-slate-500">Re-enter if your browser exits fullscreen.</span></span></button>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 dark:border-amber-900/50 dark:bg-amber-950/20"><p className="text-[10px] font-extrabold text-amber-800 dark:text-amber-300">Monitoring notice</p><p className="mt-1 text-[9px] leading-4 text-amber-700 dark:text-amber-200">Browser, camera and network events are logged as review signals. They are not automatic misconduct findings.</p></div>
        </aside>
      </div>
    </div>
  );
}
