'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Eye,
  Flag,
  HelpCircle,
  Loader2,
  Medal,
  PlayCircle,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  TimerReset,
  Trophy,
  X,
} from 'lucide-react';

type Overview = {
  quiz: { id: string; title: string; description: string | null; timeLimitMins: number | null; startTime: string | null; endTime: string | null };
  competition: { instructions: string; questionCount: number; totalMarks: number; maxAttempts: number; shuffleQuestions: boolean; shuffleOptions: boolean; negativeMarking: boolean; leaderboardEnabled: boolean; leaderboardLive: boolean; resultRelease: 'IMMEDIATE' | 'AFTER_END' };
  state: 'UPCOMING' | 'OPEN' | 'CLOSED';
  accessRole: 'STUDENT' | 'FACULTY' | 'PRIVILEGED';
  serverNow: string;
  student?: { attemptsUsed: number; attemptsRemaining: number; activeAttemptId: string | null; bestAttempt: { id: string; score: number | null; completedAt: string | null } | null; canStart: boolean; resultReleased: boolean };
  faculty?: { attempts: number; completedAttempts: number; resultReleased: boolean };
};

type PublicQuestion = {
  id: string;
  prompt: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  options: Array<{ id: string; text: string }>;
  points: number;
  negativePoints: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
  sequence: number;
};

type AttemptPayload = {
  attempt: { id: string; startedAt: string; completedAt: string | null; deadline: string | null };
  quiz: Overview['quiz'];
  competition: { instructions: string; questionCount: number; totalMarks: number; negativeMarking: boolean; leaderboardEnabled: boolean };
  questions: PublicQuestion[];
  answers: Record<string, string[]>;
  result: ResultPayload | null;
  serverNow: string;
};

type ResultPayload = {
  score: number;
  totalMarks: number;
  percentage: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  submittedAt: string;
  released: boolean;
  review?: Array<{ questionId: string; correctOptionIds: string[]; explanation: string | null }> | null;
};

type LeaderEntry = { rank: number; attemptId: string; name: string; rollNumber: string; score: number; durationSeconds: number | null; completedAt: string | null };
type LeaderboardPayload = { enabled: boolean; visible?: boolean; entries: LeaderEntry[] };

const PALETTE_SIZE = 50;

export function QuizCompetitionWorkspace({ courseId, quizId }: { courseId: string; quizId: string }) {
  const [overview, setOverview] = React.useState<Overview | null>(null);
  const [attempt, setAttempt] = React.useState<AttemptPayload | null>(null);
  const [answers, setAnswers] = React.useState<Record<string, string[]>>({});
  const [questionIndex, setQuestionIndex] = React.useState(0);
  const [flagged, setFlagged] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [savingQuestionId, setSavingQuestionId] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [confirmSubmit, setConfirmSubmit] = React.useState(false);
  const [secondsLeft, setSecondsLeft] = React.useState<number | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardPayload | null>(null);
  const [leaderBusy, setLeaderBusy] = React.useState(false);
  const [focusMode, setFocusMode] = React.useState(false);

  const loadOverview = React.useCallback(async () => {
    setError('');
    const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/quiz-competitions/${encodeURIComponent(quizId)}`, { cache: 'no-store' });
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(readError(payload, 'Unable to load quiz competition.'));
    const data = payload as Overview;
    setOverview(data);
    return data;
  }, [courseId, quizId]);

  const loadAttempt = React.useCallback(async (attemptId: string) => {
    setError('');
    const response = await fetch(attemptUrl(courseId, quizId, attemptId), { cache: 'no-store' });
    const payload: unknown = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(readError(payload, 'Unable to load competition attempt.'));
    const data = payload as AttemptPayload;
    setAttempt(data);
    setAnswers(data.answers ?? {});
    setSecondsLeft(calculateSecondsLeft(data.attempt.deadline, data.serverNow));
    const firstUnanswered = data.questions.findIndex((question) => !(data.answers?.[question.id]?.length));
    setQuestionIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    return data;
  }, [courseId, quizId]);

  React.useEffect(() => {
    let cancelled = false;
    void loadOverview().then((data) => {
      if (!cancelled && data.student?.activeAttemptId) return loadAttempt(data.student.activeAttemptId);
      return undefined;
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to load quiz competition.');
    });
    return () => { cancelled = true; };
  }, [loadAttempt, loadOverview]);

  const active = Boolean(attempt && !attempt.attempt.completedAt);

  React.useEffect(() => {
    if (!active || secondsLeft === null) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => current === null ? null : Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [active, secondsLeft === null]);

  async function loadLeaderboard() {
    setLeaderBusy(true);
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/quiz-competitions/${encodeURIComponent(quizId)}/leaderboard`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readError(payload, 'Unable to load leaderboard.'));
      setLeaderboard(payload as LeaderboardPayload);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to load leaderboard.');
    } finally {
      setLeaderBusy(false);
    }
  }

  const submitAttempt = React.useCallback(async (automatic = false) => {
    if (!attempt || attempt.attempt.completedAt || busy || savingQuestionId) return;
    setBusy(true);
    setError('');
    setConfirmSubmit(false);
    try {
      const response = await fetch(attemptUrl(courseId, quizId, attempt.attempt.id), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'submit' }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readError(payload, 'Unable to submit competition.'));
      await loadAttempt(attempt.attempt.id);
      const freshOverview = await loadOverview();
      if (freshOverview.competition.leaderboardEnabled) void loadLeaderboard();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : automatic ? 'Time expired, but automatic submission could not be confirmed. Refresh the page.' : 'Unable to submit competition.');
    } finally {
      setBusy(false);
    }
  // loadLeaderboard intentionally remains local to keep the callback scoped to this competition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, busy, savingQuestionId, courseId, quizId, loadAttempt, loadOverview]);

  React.useEffect(() => {
    if (active && secondsLeft === 0 && !savingQuestionId) void submitAttempt(true);
  }, [active, secondsLeft, savingQuestionId, submitAttempt]);

  const recordIntegrity = React.useCallback((eventType: 'TAB_HIDDEN' | 'WINDOW_BLUR' | 'FULLSCREEN_EXIT' | 'COPY_ATTEMPT' | 'PASTE_ATTEMPT') => {
    if (!attempt || attempt.attempt.completedAt) return;
    void fetch(attemptUrl(courseId, quizId, attempt.attempt.id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'integrity', eventType }),
      keepalive: true,
    }).catch(() => undefined);
  }, [attempt, courseId, quizId]);

  React.useEffect(() => {
    if (!active) return;
    const visibility = () => { if (document.hidden) recordIntegrity('TAB_HIDDEN'); };
    const blur = () => recordIntegrity('WINDOW_BLUR');
    const copy = () => recordIntegrity('COPY_ATTEMPT');
    const paste = () => recordIntegrity('PASTE_ATTEMPT');
    const beforeUnload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('blur', blur);
    window.addEventListener('copy', copy);
    window.addEventListener('paste', paste);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('blur', blur);
      window.removeEventListener('copy', copy);
      window.removeEventListener('paste', paste);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, [active, recordIntegrity]);

  async function startAttempt() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/quiz-competitions/${encodeURIComponent(quizId)}/attempts`, { method: 'POST' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readError(payload, 'Unable to start competition.'));
      const attemptId = payload && typeof payload === 'object' && 'attemptId' in payload ? String((payload as { attemptId: unknown }).attemptId) : '';
      if (!attemptId) throw new Error('Competition attempt could not be created.');
      await loadAttempt(attemptId);
      await loadOverview();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to start competition.');
    } finally {
      setBusy(false);
    }
  }

  async function saveAnswer(question: PublicQuestion, selectedOptionIds: string[]) {
    if (!attempt || attempt.attempt.completedAt) return;
    const previous = answers[question.id] ?? [];
    setAnswers((current) => ({ ...current, [question.id]: selectedOptionIds }));
    setSavingQuestionId(question.id);
    setError('');
    try {
      const response = await fetch(attemptUrl(courseId, quizId, attempt.attempt.id), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, selectedOptionIds }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (payload && typeof payload === 'object' && 'expired' in payload) await loadAttempt(attempt.attempt.id);
        throw new Error(readError(payload, 'Unable to save answer.'));
      }
      setSavedAt(new Date().toISOString());
    } catch (cause: unknown) {
      setAnswers((current) => ({ ...current, [question.id]: previous }));
      setError(cause instanceof Error ? cause.message : 'Unable to save answer.');
    } finally {
      setSavingQuestionId(null);
    }
  }

  if (!overview) return <CompetitionSkeleton error={error} />;
  if (overview.accessRole !== 'STUDENT') return <FacultyCompetitionView courseId={courseId} overview={overview} leaderboard={leaderboard} onLeaderboard={loadLeaderboard} leaderBusy={leaderBusy} />;
  if (!attempt) return <CompetitionLobby courseId={courseId} overview={overview} error={error} busy={busy} onStart={() => void startAttempt()} onLeaderboard={() => void loadLeaderboard()} leaderboard={leaderboard} leaderBusy={leaderBusy} />;
  if (attempt.result) return <CompetitionResult courseId={courseId} overview={overview} attempt={attempt} leaderboard={leaderboard} leaderBusy={leaderBusy} onLeaderboard={() => void loadLeaderboard()} />;

  const question = attempt.questions[questionIndex] ?? null;
  const answeredCount = attempt.questions.filter((item) => (answers[item.id]?.length ?? 0) > 0).length;
  const unansweredCount = attempt.questions.length - answeredCount;
  const palettePage = Math.floor(questionIndex / PALETTE_SIZE);
  const paletteStart = palettePage * PALETTE_SIZE;
  const palette = attempt.questions.slice(paletteStart, paletteStart + PALETTE_SIZE);

  return (
    <div className={`${focusMode ? 'fixed inset-0 z-[100] overflow-y-auto bg-[#F4F7FB] p-3 sm:p-5' : 'space-y-5 pb-10'}`}>
      <header className="sticky top-0 z-30 rounded-2xl border border-[#173456] bg-[#0B1F3A] px-4 py-3 text-white shadow-[0_16px_35px_rgba(11,31,58,0.18)] sm:px-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#9FC0EE]">Live quiz competition</p><h1 className="truncate text-base font-black sm:text-lg">{attempt.quiz.title}</h1></div>
          <div className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 font-mono text-sm font-black ${secondsLeft !== null && secondsLeft <= 300 ? 'border-[#E57575]/50 bg-[#5A2020] text-[#FFE0E0]' : 'border-white/15 bg-white/5 text-white'}`}><Clock3 className="h-4 w-4" />{secondsLeft === null ? 'No limit' : formatDuration(secondsLeft)}</div>
          <button type="button" onClick={() => setFocusMode((value) => !value)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-bold text-white hover:bg-white/10"><Eye className="h-4 w-4" />{focusMode ? 'Exit focus' : 'Focus mode'}</button>
          <button type="button" disabled={busy || Boolean(savingQuestionId)} onClick={() => setConfirmSubmit(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#0B1F3A] hover:bg-[#EEF4FC] disabled:cursor-not-allowed disabled:opacity-50"><Send className="h-4 w-4" /> Submit</button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] font-semibold text-[#B9CCE3]"><span>{answeredCount}/{attempt.questions.length} answered</span><span>{unansweredCount} unanswered</span><span>{flagged.size} flagged</span><span>{savingQuestionId ? 'Saving answer…' : savedAt ? `Autosaved ${formatClock(savedAt)}` : 'Autosave ready'}</span></div>
      </header>

      {error && <ErrorBox text={error} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0 overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
          {question ? <>
            <div className="border-b border-[#E4E9EF] px-5 py-5 sm:px-7"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap gap-2"><span className="rounded-lg bg-[#EAF2FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#2459A9]">Question {questionIndex + 1} of {attempt.questions.length}</span><DifficultyBadge difficulty={question.difficulty} />{question.topic && <span className="rounded-lg bg-[#F0F3F7] px-2.5 py-1 text-[10px] font-bold text-[#66758A]">{question.topic}</span>}</div><p className="mt-3 text-sm font-semibold text-[#718096]">{question.points} mark{question.points === 1 ? '' : 's'}{question.negativePoints > 0 ? ` · −${question.negativePoints} for wrong answer` : ''}</p></div><button type="button" onClick={() => setFlagged((current) => toggleSet(current, question.id))} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-bold ${flagged.has(question.id) ? 'border-[#F1C27D] bg-[#FFF7E8] text-[#9B5A0B]' : 'border-[#D7E0EB] text-[#536579] hover:bg-[#F6F8FB]'}`}><Flag className="h-4 w-4" />{flagged.has(question.id) ? 'Flagged' : 'Flag for review'}</button></div></div>
            <div className="px-5 py-6 sm:px-7 sm:py-8"><h2 className="text-xl font-black leading-8 tracking-[-0.02em] text-[#17223B] sm:text-2xl">{question.prompt}</h2>{question.type === 'MULTIPLE_CHOICE' && <p className="mt-2 text-xs font-semibold text-[#66758A]">Select all answers that apply.</p>}<div className="mt-6 space-y-3">{question.options.map((option, index) => { const selected = (answers[question.id] ?? []).includes(option.id); return <button key={option.id} type="button" disabled={savingQuestionId === question.id} onClick={() => { const current = answers[question.id] ?? []; const next = question.type === 'MULTIPLE_CHOICE' ? selected ? current.filter((id) => id !== option.id) : [...current, option.id] : [option.id]; void saveAnswer(question, next); }} className={`flex w-full items-start gap-3 rounded-2xl border px-4 py-4 text-left transition ${selected ? 'border-[#5B8FE8] bg-[#F0F6FF] shadow-[0_6px_16px_rgba(47,107,255,0.08)]' : 'border-[#DCE3EC] bg-white hover:border-[#B8C9E1] hover:bg-[#FAFBFD]'}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-black ${selected ? 'border-[#2F6BFF] bg-[#2F6BFF] text-white' : 'border-[#D7E0EB] bg-[#F8FAFC] text-[#536579]'}`}>{selected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + index)}</span><span className="pt-2 text-sm font-semibold leading-6 text-[#26364D]">{option.text}</span></button>; })}</div></div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E4E9EF] px-4 py-4 sm:px-7"><button type="button" disabled={questionIndex <= 0} onClick={() => setQuestionIndex((value) => Math.max(0, value - 1))} className={navButton}><ChevronLeft className="h-4 w-4" /> Previous</button><span className="hidden text-xs font-bold text-[#7A8798] sm:inline">Answers save automatically</span><button type="button" disabled={questionIndex >= attempt.questions.length - 1} onClick={() => setQuestionIndex((value) => Math.min(attempt.questions.length - 1, value + 1))} className={navButton}>Next <ChevronRight className="h-4 w-4" /></button></div>
          </> : <div className="p-10 text-center text-sm text-[#718096]">No questions are available in this competition.</div>}
        </main>

        <aside className="h-fit space-y-4 xl:sticky xl:top-28">
          <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8798]">Question navigator</p><p className="mt-1 text-sm font-black text-[#26364D]">{paletteStart + 1}–{Math.min(paletteStart + PALETTE_SIZE, attempt.questions.length)} of {attempt.questions.length}</p></div><Target className="h-5 w-5 text-[#2459A9]" /></div><div className="mt-4 grid grid-cols-5 gap-2">{palette.map((item, localIndex) => { const absolute = paletteStart + localIndex; const answered = (answers[item.id]?.length ?? 0) > 0; const isFlagged = flagged.has(item.id); const current = absolute === questionIndex; return <button key={item.id} type="button" onClick={() => setQuestionIndex(absolute)} className={`relative flex h-10 items-center justify-center rounded-lg border text-xs font-black ${current ? 'border-[#173A70] bg-[#173A70] text-white' : answered ? 'border-[#A8D8BA] bg-[#EAF8F0] text-[#247A48]' : 'border-[#DCE3EC] bg-[#F8FAFC] text-[#66758A]'}`} aria-label={`Question ${absolute + 1}${answered ? ', answered' : ''}${isFlagged ? ', flagged' : ''}`}>{absolute + 1}{isFlagged && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#E59A2F]" />}</button>; })}</div>{attempt.questions.length > PALETTE_SIZE && <div className="mt-3 flex justify-between gap-2"><button type="button" disabled={palettePage === 0} onClick={() => setQuestionIndex(Math.max(0, paletteStart - PALETTE_SIZE))} className={smallButton}><ChevronLeft className="h-3.5 w-3.5" /> 50</button><span className="self-center text-[10px] font-bold text-[#8A97A8]">Page {palettePage + 1}/{Math.ceil(attempt.questions.length / PALETTE_SIZE)}</span><button type="button" disabled={paletteStart + PALETTE_SIZE >= attempt.questions.length} onClick={() => setQuestionIndex(Math.min(attempt.questions.length - 1, paletteStart + PALETTE_SIZE))} className={smallButton}>50 <ChevronRight className="h-3.5 w-3.5" /></button></div>}</section>
          <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4"><p className="flex items-center gap-2 text-xs font-black text-[#26364D]"><ShieldCheck className="h-4 w-4 text-[#247A48]" /> Competition integrity</p><p className="mt-2 text-[11px] leading-5 text-[#7A8798]">Scoring and deadlines are controlled by the server. Tab/window changes may be recorded for faculty review, but are not automatic proof of misconduct.</p></section>
        </aside>
      </div>

      {confirmSubmit && <SubmitDialog answered={answeredCount} total={attempt.questions.length} flagged={flagged.size} busy={busy} onCancel={() => setConfirmSubmit(false)} onConfirm={() => void submitAttempt(false)} />}
    </div>
  );
}

function CompetitionLobby({ courseId, overview, error, busy, onStart, onLeaderboard, leaderboard, leaderBusy }: { courseId: string; overview: Overview; error: string; busy: boolean; onStart: () => void; onLeaderboard: () => void; leaderboard: LeaderboardPayload | null; leaderBusy: boolean }) {
  const student = overview.student!;
  return <div className="space-y-6 pb-10"><CompetitionHero courseId={courseId} overview={overview} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><main className="space-y-5">{error && <ErrorBox text={error} />}<section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 sm:p-7"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Before you begin</p><h2 className="mt-1 text-xl font-black text-[#17223B]">Competition rules</h2><div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Rule icon={HelpCircle} label="Questions" value={String(overview.competition.questionCount)} /><Rule icon={Clock3} label="Time limit" value={`${overview.quiz.timeLimitMins ?? '—'} min`} /><Rule icon={Trophy} label="Total marks" value={formatNumber(overview.competition.totalMarks)} /><Rule icon={TimerReset} label="Attempts" value={`${student.attemptsRemaining} remaining`} /><Rule icon={Sparkles} label="Question order" value={overview.competition.shuffleQuestions ? 'Randomised' : 'Fixed'} /><Rule icon={Medal} label="Leaderboard" value={overview.competition.leaderboardEnabled ? overview.competition.leaderboardLive ? 'Live' : 'After close' : 'Disabled'} /></div>{overview.competition.instructions && <div className="mt-5 rounded-2xl border border-[#DCE3EC] bg-[#F8FAFC] p-4"><p className="text-xs font-black text-[#455A73]">Faculty instructions</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#66758A]">{overview.competition.instructions}</p></div>}<div className="mt-5 flex flex-wrap items-center gap-3"><button type="button" disabled={!student.canStart || busy} onClick={onStart} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#173A70] px-5 text-sm font-black text-white hover:bg-[#102E5D] disabled:cursor-not-allowed disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}{student.activeAttemptId ? 'Resume attempt' : 'Start competition'}</button>{overview.competition.leaderboardEnabled && <button type="button" onClick={onLeaderboard} disabled={leaderBusy} className={navButton}>{leaderBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Leaderboard</button>}</div>{overview.state !== 'OPEN' && <p className="mt-4 text-sm font-semibold text-[#9B5A0B]">{overview.state === 'UPCOMING' ? `Competition opens ${overview.quiz.startTime ? formatDateTime(overview.quiz.startTime) : 'later'}.` : 'This competition is closed.'}</p>}</section>{leaderboard && <Leaderboard data={leaderboard} />}</main><aside className="space-y-4"><SummaryCard overview={overview} /><section className="rounded-2xl border border-[#DCE3EC] bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Your attempts</p><p className="mt-3 text-3xl font-black text-[#17223B]">{student.attemptsUsed}<span className="text-base text-[#8A97A8]">/{overview.competition.maxAttempts}</span></p>{student.bestAttempt && <p className="mt-2 text-xs text-[#66758A]">Best recorded score: <strong>{formatNumber(student.bestAttempt.score ?? 0)}</strong></p>}</section></aside></div></div>;
}

function FacultyCompetitionView({ courseId, overview, leaderboard, onLeaderboard, leaderBusy }: { courseId: string; overview: Overview; leaderboard: LeaderboardPayload | null; onLeaderboard: () => void; leaderBusy: boolean }) {
  const faculty = overview.faculty!;
  return <div className="space-y-6 pb-10"><CompetitionHero courseId={courseId} overview={overview} /><section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric label="Questions" value={overview.competition.questionCount} /><Metric label="Total marks" value={overview.competition.totalMarks} /><Metric label="Attempts started" value={faculty.attempts} /><Metric label="Submitted" value={faculty.completedAttempts} /><Metric label="Completion rate" value={faculty.attempts ? `${Math.round((faculty.completedAttempts / faculty.attempts) * 100)}%` : '0%'} /></section><div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]"><main className="space-y-5"><section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Competition monitor</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Live competition controls</h2></div><button type="button" disabled={leaderBusy || !overview.competition.leaderboardEnabled} onClick={onLeaderboard} className={navButton}>{leaderBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Refresh leaderboard</button></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><Rule icon={Clock3} label="Window" value={overview.state} /><Rule icon={TimerReset} label="Attempts per student" value={String(overview.competition.maxAttempts)} /><Rule icon={Sparkles} label="Randomisation" value={overview.competition.shuffleQuestions || overview.competition.shuffleOptions ? 'Enabled' : 'Fixed'} /><Rule icon={Medal} label="Results" value={overview.competition.resultRelease === 'IMMEDIATE' ? 'Immediate' : 'After close'} /></div><div className="mt-5 flex flex-wrap gap-3"><Link href={`/learning/courses/${courseId}/quiz-competitions/new`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-black text-white">Create another competition</Link><Link href={`/learning/courses/${courseId}`} className={navButton}>Back to course</Link></div></section>{leaderboard && <Leaderboard data={leaderboard} />}</main><aside><SummaryCard overview={overview} /></aside></div></div>;
}

function CompetitionResult({ courseId, overview, attempt, leaderboard, leaderBusy, onLeaderboard }: { courseId: string; overview: Overview; attempt: AttemptPayload; leaderboard: LeaderboardPayload | null; leaderBusy: boolean; onLeaderboard: () => void }) {
  const result = attempt.result!;
  return <div className="space-y-6 pb-10"><CompetitionHero courseId={courseId} overview={overview} /><section className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.06)]"><div className="bg-[#0B1F3A] px-5 py-7 text-white sm:px-8"><div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#AFC7E7]">Attempt submitted</p><h2 className="mt-2 text-3xl font-black tracking-[-0.04em]">{result.released ? `${formatNumber(result.score)} / ${formatNumber(result.totalMarks)}` : 'Result pending release'}</h2><p className="mt-2 text-sm text-[#C7D7EA]">{result.released ? `${result.percentage}% · ${result.correctCount} correct · ${result.wrongCount} incorrect · ${result.unansweredCount} unanswered` : 'Your submission is recorded. Scores will be released according to the faculty competition policy.'}</p></div><span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/5"><CheckCircle2 className="h-8 w-8 text-[#8BE0AC]" /></span></div></div><div className="p-5 sm:p-7"><div className="grid gap-3 sm:grid-cols-3"><ResultMetric label="Score" value={result.released ? formatNumber(result.score) : 'Hidden'} /><ResultMetric label="Percentage" value={result.released ? `${result.percentage}%` : 'Pending'} /><ResultMetric label="Submitted" value={formatDateTime(result.submittedAt)} /></div><div className="mt-5 flex flex-wrap gap-3"><Link href={`/learning/courses/${courseId}`} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-black text-white"><ArrowLeft className="h-4 w-4" /> Back to course</Link>{overview.competition.leaderboardEnabled && <button type="button" disabled={leaderBusy} onClick={onLeaderboard} className={navButton}>{leaderBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />} Leaderboard</button>}</div></div></section>{result.released && result.review && <ReviewSection attempt={attempt} />}{leaderboard && <Leaderboard data={leaderboard} />}</div>;
}

function ReviewSection({ attempt }: { attempt: AttemptPayload }) {
  const review = new Map((attempt.result?.review ?? []).map((item) => [item.questionId, item]));
  return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 sm:p-6"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Answer review</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Competition review</h2><div className="mt-5 space-y-4">{attempt.questions.map((question, index) => { const item = review.get(question.id); const selected = attempt.answers[question.id] ?? []; const correct = item?.correctOptionIds ?? []; const isCorrect = selected.length === correct.length && selected.every((id) => correct.includes(id)); return <article key={question.id} className="rounded-2xl border border-[#E1E7EE] p-4"><div className="flex items-start gap-3"><span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCorrect ? 'bg-[#EAF8F0] text-[#247A48]' : 'bg-[#FFF0EF] text-[#B42318]'}`}>{isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</span><div className="min-w-0"><p className="text-sm font-black text-[#26364D]">{index + 1}. {question.prompt}</p><div className="mt-3 space-y-1.5">{question.options.map((option) => <p key={option.id} className={`rounded-lg px-3 py-2 text-xs font-semibold ${correct.includes(option.id) ? 'bg-[#EAF8F0] text-[#247A48]' : selected.includes(option.id) ? 'bg-[#FFF0EF] text-[#B42318]' : 'bg-[#F8FAFC] text-[#66758A]'}`}>{option.text}{correct.includes(option.id) ? ' · correct' : selected.includes(option.id) ? ' · your answer' : ''}</p>)}</div>{item?.explanation && <p className="mt-3 text-xs leading-5 text-[#718096]">{item.explanation}</p>}</div></div></article>; })}</div></section>;
}

function Leaderboard({ data }: { data: LeaderboardPayload }) {
  if (!data.enabled) return null;
  return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 sm:p-6"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF7E8] text-[#A15C07]"><Trophy className="h-5 w-5" /></span><div><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Competition ranking</p><h2 className="text-lg font-black text-[#17223B]">Leaderboard</h2></div></div>{data.visible === false ? <p className="mt-5 rounded-xl border border-dashed border-[#D7E0EB] bg-[#FAFBFD] p-5 text-center text-sm text-[#718096]">Leaderboard will be visible after the competition closes.</p> : data.entries.length === 0 ? <p className="mt-5 text-sm text-[#718096]">No completed attempts yet.</p> : <div className="mt-5 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#E4E9EF] text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8798]"><th className="px-3 py-3">Rank</th><th className="px-3 py-3">Student</th><th className="px-3 py-3">Roll</th><th className="px-3 py-3 text-right">Score</th><th className="px-3 py-3 text-right">Time</th></tr></thead><tbody>{data.entries.map((entry) => <tr key={entry.attemptId} className="border-b border-[#EEF2F6] last:border-0"><td className="px-3 py-3 font-black text-[#26364D]">#{entry.rank}</td><td className="px-3 py-3 font-bold text-[#26364D]">{entry.name}</td><td className="px-3 py-3 text-[#718096]">{entry.rollNumber}</td><td className="px-3 py-3 text-right font-black text-[#173A70]">{formatNumber(entry.score)}</td><td className="px-3 py-3 text-right text-[#718096]">{entry.durationSeconds === null ? '—' : formatDuration(entry.durationSeconds)}</td></tr>)}</tbody></table></div>}</section>;
}

function CompetitionHero({ courseId, overview }: { courseId: string; overview: Overview }) {
  return <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] px-6 py-7 text-white shadow-[0_24px_60px_rgba(11,31,58,0.18)] sm:px-8"><Link href={`/learning/courses/${courseId}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#AFC7E7] hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to course</Link><div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#C9DBF7]">Quiz competition</span><span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase ${overview.state === 'OPEN' ? 'bg-[#EAF8F0] text-[#247A48]' : overview.state === 'UPCOMING' ? 'bg-[#FFF7E8] text-[#A15C07]' : 'bg-white/10 text-[#D9E3F0]'}`}>{overview.state}</span></div><h1 className="mt-3 text-3xl font-black tracking-[-0.04em] sm:text-4xl">{overview.quiz.title}</h1>{overview.quiz.description && <p className="mt-3 text-sm leading-6 text-[#C7D7EA]">{overview.quiz.description}</p>}</div><div className="grid grid-cols-3 gap-2 lg:min-w-[22rem]"><HeroStat label="Questions" value={overview.competition.questionCount} /><HeroStat label="Marks" value={formatNumber(overview.competition.totalMarks)} /><HeroStat label="Time" value={`${overview.quiz.timeLimitMins ?? '—'}m`} /></div></div></section>;
}

function SummaryCard({ overview }: { overview: Overview }) {
  return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Competition schedule</p><dl className="mt-4 space-y-3 text-sm"><SummaryRow label="Opens" value={overview.quiz.startTime ? formatDateTime(overview.quiz.startTime) : 'Immediately'} /><SummaryRow label="Closes" value={overview.quiz.endTime ? formatDateTime(overview.quiz.endTime) : 'No fixed close'} /><SummaryRow label="Result" value={overview.competition.resultRelease === 'IMMEDIATE' ? 'After submission' : 'After close'} /><SummaryRow label="Negative marking" value={overview.competition.negativeMarking ? 'Enabled' : 'Off'} /></dl></section>;
}

function SubmitDialog({ answered, total, flagged, busy, onCancel, onConfirm }: { answered: number; total: number; flagged: number; busy: boolean; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusables = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'));
    focusables()[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) { event.preventDefault(); onCancel(); return; }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('keydown', onKey);
    return () => { dialog.removeEventListener('keydown', onKey); previousFocus?.focus(); };
  }, [busy, onCancel]);

  return <div className="fixed inset-0 z-[120] flex items-end justify-center bg-[#081525]/65 p-0 sm:items-center sm:p-5" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}><div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="submit-title" className="w-full max-w-lg rounded-t-3xl border border-[#DCE3EC] bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6"><div className="flex items-start gap-4"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-[#2459A9]"><Send className="h-5 w-5" /></span><div><h2 id="submit-title" className="text-lg font-black text-[#17223B]">Submit competition?</h2><p className="mt-1 text-sm leading-6 text-[#66758A]">{answered} of {total} questions are answered. {total - answered} remain unanswered{flagged ? ` and ${flagged} are flagged for review` : ''}.</p></div></div><div className="mt-5 flex justify-end gap-2"><button type="button" disabled={busy} onClick={onCancel} className={navButton}>Review answers</button><button type="button" disabled={busy} onClick={onConfirm} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-black text-white disabled:opacity-50">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Submit now</button></div></div></div>;
}

function Rule({ icon: Icon, label, value }: { icon: typeof HelpCircle; label: string; value: string }) { return <div className="rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] p-4"><Icon className="h-4 w-4 text-[#2459A9]" /><p className="mt-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8798]">{label}</p><p className="mt-1 text-sm font-black text-[#26364D]">{value}</p></div>; }
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-[#DCE3EC] bg-white p-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8798]">{label}</p><p className="mt-2 text-2xl font-black text-[#17223B]">{value}</p></div>; }
function ResultMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] p-4"><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8798]">{label}</p><p className="mt-2 text-lg font-black text-[#17223B]">{value}</p></div>; }
function HeroStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"><p className="text-xl font-black text-white">{value}</p><p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#AFC7E7]">{label}</p></div>; }
function DifficultyBadge({ difficulty }: { difficulty: PublicQuestion['difficulty'] }) { const classes = difficulty === 'HARD' ? 'bg-[#FFF0EF] text-[#B42318]' : difficulty === 'EASY' ? 'bg-[#EAF8F0] text-[#247A48]' : 'bg-[#FFF7E8] text-[#A15C07]'; return <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${classes}`}>{difficulty}</span>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3"><dt className="text-[#7A8798]">{label}</dt><dd className="text-right font-black text-[#26364D]">{value}</dd></div>; }
function ErrorBox({ text }: { text: string }) { return <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#F0C4C0] bg-[#FFF4F2] px-4 py-3 text-sm font-semibold text-[#9F2D25]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{text}</div>; }
function CompetitionSkeleton({ error }: { error: string }) { return <div className="space-y-5" aria-busy="true"><div className="h-60 animate-pulse rounded-[28px] bg-[#E8EDF4]" />{error && <ErrorBox text={error} />}<div className="h-80 animate-pulse rounded-2xl bg-[#EEF2F6]" /></div>; }
function calculateSecondsLeft(deadline: string | null, serverNow: string) { if (!deadline) return null; return Math.max(0, Math.ceil((new Date(deadline).getTime() - new Date(serverNow).getTime()) / 1000)); }
function attemptUrl(courseId: string, quizId: string, attemptId: string) { return `/api/learning/courses/${encodeURIComponent(courseId)}/quiz-competitions/${encodeURIComponent(quizId)}/attempts/${encodeURIComponent(attemptId)}`; }
function readError(payload: unknown, fallback: string) { return payload && typeof payload === 'object' && 'error' in payload ? String((payload as { error: unknown }).error) : fallback; }
function formatDuration(seconds: number) { const safe = Math.max(0, Math.floor(seconds)); const hours = Math.floor(safe / 3600); const minutes = Math.floor((safe % 3600) / 60); const secs = safe % 60; return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}` : `${minutes}:${String(secs).padStart(2, '0')}`; }
function formatClock(value: string) { return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value); }
function toggleSet(current: Set<string>, value: string) { const next = new Set(current); if (next.has(value)) next.delete(value); else next.add(value); return next; }
const navButton = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#D7E0EB] bg-white px-4 text-sm font-bold text-[#455A73] transition hover:bg-[#F6F8FB] disabled:cursor-not-allowed disabled:opacity-40';
const smallButton = 'inline-flex min-h-9 items-center gap-1 rounded-lg border border-[#D7E0EB] bg-white px-2.5 text-[10px] font-bold text-[#536579] disabled:opacity-30';
