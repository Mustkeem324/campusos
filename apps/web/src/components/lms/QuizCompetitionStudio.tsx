'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardPaste,
  FileJson,
  HelpCircle,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type Option = { id: string; text: string };
type Question = {
  id: string;
  prompt: string;
  type: QuestionType;
  options: Option[];
  correctOptionIds: string[];
  points: number;
  negativePoints: number;
  explanation: string;
  difficulty: Difficulty;
  topic: string;
};

type CourseInfo = { course?: { code?: string; title?: string }; instructor?: string };

const PAGE_SIZE = 20;

export function QuizCompetitionStudio({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = React.useState<CourseInfo | null>(null);
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [instructions, setInstructions] = React.useState('Answer every question carefully. Your answers are autosaved.');
  const [timeLimitMins, setTimeLimitMins] = React.useState(30);
  const [startTime, setStartTime] = React.useState('');
  const [endTime, setEndTime] = React.useState('');
  const [maxAttempts, setMaxAttempts] = React.useState(1);
  const [shuffleQuestions, setShuffleQuestions] = React.useState(true);
  const [shuffleOptions, setShuffleOptions] = React.useState(true);
  const [negativeMarking, setNegativeMarking] = React.useState(false);
  const [leaderboardEnabled, setLeaderboardEnabled] = React.useState(true);
  const [leaderboardLive, setLeaderboardLive] = React.useState(false);
  const [resultRelease, setResultRelease] = React.useState<'IMMEDIATE' | 'AFTER_END'>('AFTER_END');
  const [questions, setQuestions] = React.useState<Question[]>([newQuestion(0)]);
  const [page, setPage] = React.useState(0);
  const [bulk, setBulk] = React.useState('');
  const [bulkOpen, setBulkOpen] = React.useState(false);
  const [error, setError] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    fetch(`/api/learning/courses/${encodeURIComponent(courseId)}`, { cache: 'no-store' })
      .then((response) => response.json().then((payload) => ({ response, payload })))
      .then(({ response, payload }) => {
        if (!cancelled && response.ok) setCourse(payload as CourseInfo);
      })
      .catch(() => undefined);
    return () => { cancelled = true; };
  }, [courseId]);

  const totalMarks = questions.reduce((sum, question) => sum + (Number(question.points) || 0), 0);
  const pageCount = Math.max(1, Math.ceil(questions.length / PAGE_SIZE));
  const visible = questions.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function updateQuestion(id: string, patch: Partial<Question>) {
    setQuestions((items) => items.map((question) => question.id === id ? { ...question, ...patch } : question));
  }

  function updateOption(questionId: string, optionId: string, text: string) {
    setQuestions((items) => items.map((question) => question.id === questionId ? {
      ...question,
      options: question.options.map((option) => option.id === optionId ? { ...option, text } : option),
    } : question));
  }

  function toggleCorrect(question: Question, optionId: string) {
    const correctOptionIds = question.type === 'MULTIPLE_CHOICE'
      ? question.correctOptionIds.includes(optionId)
        ? question.correctOptionIds.filter((id) => id !== optionId)
        : [...question.correctOptionIds, optionId]
      : [optionId];
    updateQuestion(question.id, { correctOptionIds });
  }

  function addQuestion() {
    const next = newQuestion(questions.length);
    setQuestions((items) => [...items, next]);
    const targetPage = Math.floor(questions.length / PAGE_SIZE);
    setPage(targetPage);
  }

  function removeQuestion(id: string) {
    if (questions.length <= 1) return;
    setQuestions((items) => items.filter((question) => question.id !== id));
  }

  function addOption(question: Question) {
    if (question.options.length >= 8) return;
    updateQuestion(question.id, { options: [...question.options, { id: uid(), text: '' }] });
  }

  function removeOption(question: Question, optionId: string) {
    if (question.options.length <= 2) return;
    updateQuestion(question.id, {
      options: question.options.filter((option) => option.id !== optionId),
      correctOptionIds: question.correctOptionIds.filter((id) => id !== optionId),
    });
  }

  function importBulk(text = bulk) {
    setError(''); setNotice('');
    try {
      const imported = parseBulkQuestions(text, questions.length);
      if (!imported.length) throw new Error('No valid questions were found. Use JSON or tab-separated rows.');
      if (questions.length + imported.length > 1000) throw new Error('A competition can contain up to 1,000 questions.');
      const currentIsBlank = questions.length === 1 && !questions[0].prompt.trim();
      setQuestions((items) => currentIsBlank ? imported : [...items, ...imported]);
      setBulk(''); setBulkOpen(false); setNotice(`${imported.length} questions imported successfully.`);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to import questions.');
    }
  }

  async function readBulkFile(file: File | null) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Question-bank file must be 5 MB or smaller.'); return; }
    const text = await file.text();
    setBulk(text);
    try { importBulk(text); } catch { /* importBulk handles errors */ }
  }

  async function publish(event: React.FormEvent) {
    event.preventDefault(); setError(''); setNotice('');
    if (questions.length > 1000) { setError('A competition can contain up to 1,000 questions.'); return; }
    if (!title.trim()) { setError('Competition title is required.'); return; }
    if (resultRelease === 'AFTER_END' && !endTime) { setError('Set an end time when results are released after the competition closes.'); return; }
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) { setError('End time must be later than start time.'); return; }

    setBusy(true);
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/quiz-competitions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(), description: description.trim() || undefined, instructions: instructions.trim(),
          timeLimitMins, startTime: startTime ? new Date(startTime).toISOString() : undefined,
          endTime: endTime ? new Date(endTime).toISOString() : undefined, maxAttempts,
          shuffleQuestions, shuffleOptions, negativeMarking, leaderboardEnabled, leaderboardLive,
          resultRelease,
          questions: questions.map((question) => ({ ...question, negativePoints: negativeMarking ? Number(question.negativePoints) || 0 : 0, points: Number(question.points) || 1 })),
        }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readError(payload, 'Unable to publish quiz competition.'));
      const url = payload && typeof payload === 'object' && 'url' in payload ? String((payload as { url: unknown }).url) : null;
      if (!url) throw new Error('Competition was created but no destination was returned.');
      router.push(url);
      router.refresh();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to publish quiz competition.');
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={publish} className="space-y-6 pb-12">
      <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] text-white shadow-[0_24px_60px_rgba(11,31,58,0.18)]">
        <div className="px-6 py-7 sm:px-8 sm:py-9">
          <Link href={`/learning/courses/${courseId}`} className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#AFC7E7] hover:text-white"><ArrowLeft className="h-4 w-4" /> Back to course</Link>
          <div className="mt-5 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#9FC0EE]">Faculty authoring studio</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Quiz Competition Studio</h1><p className="mt-3 text-sm leading-6 text-[#C7D7EA]">Build timed competitive assessments from a few questions to a 1,000-question bank, with secure scoring, autosave and leaderboard controls.</p></div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-[22rem]"><HeroStat label="Questions" value={questions.length} /><HeroStat label="Total marks" value={formatNumber(totalMarks)} /><HeroStat label="Time" value={`${timeLimitMins}m`} /></div>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-2xl border border-[#F0C4C0] bg-[#FFF4F2] px-4 py-3 text-sm font-semibold text-[#9F2D25]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
      {notice && <div role="status" className="flex items-start gap-3 rounded-2xl border border-[#BDE5CC] bg-[#F0FBF4] px-4 py-3 text-sm font-semibold text-[#247A48]"><Check className="mt-0.5 h-4 w-4 shrink-0" />{notice}</div>}

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_23rem]">
        <main className="space-y-6">
          <Panel eyebrow="Competition brief" title="Core settings" icon={Trophy}>
            <div className="grid gap-4 lg:grid-cols-2">
              <Field label="Competition title" className="lg:col-span-2"><input required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Data Structures Championship — Round 1" /></Field>
              <Field label="Description" className="lg:col-span-2"><textarea maxLength={3000} rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className={textareaClass} placeholder="What this competition covers and how students should prepare." /></Field>
              <Field label="Student instructions" className="lg:col-span-2"><textarea maxLength={5000} rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} className={textareaClass} /></Field>
              <Field label="Time limit (minutes)"><input type="number" min={1} max={720} value={timeLimitMins} onChange={(e) => setTimeLimitMins(clamp(Number(e.target.value), 1, 720))} className={inputClass} /></Field>
              <Field label="Maximum attempts"><input type="number" min={1} max={10} value={maxAttempts} onChange={(e) => setMaxAttempts(clamp(Number(e.target.value), 1, 10))} className={inputClass} /></Field>
              <Field label="Opens at"><input type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={inputClass} /></Field>
              <Field label="Closes at"><input type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} className={inputClass} /></Field>
            </div>
          </Panel>

          <Panel eyebrow="Question bank" title="Questions" icon={HelpCircle} actions={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => setBulkOpen((value) => !value)} className={secondaryButton}><ClipboardPaste className="h-4 w-4" /> Bulk import</button><button type="button" onClick={addQuestion} className={primaryButton}><Plus className="h-4 w-4" /> Add question</button></div>}>
            {bulkOpen && <BulkImporter bulk={bulk} setBulk={setBulk} onImport={() => importBulk()} onFile={readBulkFile} />}
            <div className="mt-5 space-y-4">
              {visible.map((question, localIndex) => <QuestionEditor key={question.id} question={question} number={page * PAGE_SIZE + localIndex + 1} negativeMarking={negativeMarking} updateQuestion={updateQuestion} updateOption={updateOption} toggleCorrect={toggleCorrect} addOption={addOption} removeOption={removeOption} removeQuestion={removeQuestion} canRemove={questions.length > 1} />)}
            </div>
            {pageCount > 1 && <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#E4E9EF] pt-4"><button type="button" disabled={page === 0} onClick={() => setPage((value) => Math.max(0, value - 1))} className={secondaryButton}><ChevronLeft className="h-4 w-4" /> Previous</button><span className="text-xs font-bold text-[#718096]">Page {page + 1} of {pageCount} · {questions.length} questions</span><button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((value) => Math.min(pageCount - 1, value + 1))} className={secondaryButton}>Next <ChevronRight className="h-4 w-4" /></button></div>}
          </Panel>
        </main>

        <aside className="space-y-5 2xl:sticky 2xl:top-6 2xl:h-fit">
          <Panel eyebrow="Competition rules" title="Delivery & scoring" icon={Sparkles} compact>
            <Toggle label="Shuffle question order" checked={shuffleQuestions} onChange={setShuffleQuestions} />
            <Toggle label="Shuffle answer options" checked={shuffleOptions} onChange={setShuffleOptions} />
            <Toggle label="Negative marking" checked={negativeMarking} onChange={setNegativeMarking} />
            <Toggle label="Leaderboard" checked={leaderboardEnabled} onChange={setLeaderboardEnabled} />
            {leaderboardEnabled && <Toggle label="Show leaderboard while live" checked={leaderboardLive} onChange={setLeaderboardLive} />}
            <Field label="Result release"><select value={resultRelease} onChange={(e) => setResultRelease(e.target.value as 'IMMEDIATE' | 'AFTER_END')} className={inputClass}><option value="AFTER_END">After competition closes</option><option value="IMMEDIATE">Immediately after submission</option></select></Field>
          </Panel>
          <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#66758A]">Publish summary</p>
            <dl className="mt-4 space-y-3 text-sm"><SummaryRow label="Course" value={course?.course?.code ?? 'Current course'} /><SummaryRow label="Questions" value={String(questions.length)} /><SummaryRow label="Total marks" value={formatNumber(totalMarks)} /><SummaryRow label="Attempts" value={String(maxAttempts)} /><SummaryRow label="Time limit" value={`${timeLimitMins} min`} /></dl>
            <button type="submit" disabled={busy} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-black text-white transition hover:bg-[#102E5D] disabled:cursor-not-allowed disabled:opacity-60">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{busy ? 'Publishing…' : 'Publish competition'}</button>
            <p className="mt-3 text-[11px] leading-5 text-[#7A8798]">Students enrolled in this course will receive an in-app notification after publishing.</p>
          </div>
        </aside>
      </div>
    </form>
  );
}

function QuestionEditor({ question, number, negativeMarking, updateQuestion, updateOption, toggleCorrect, addOption, removeOption, removeQuestion, canRemove }: { question: Question; number: number; negativeMarking: boolean; updateQuestion: (id: string, patch: Partial<Question>) => void; updateOption: (questionId: string, optionId: string, text: string) => void; toggleCorrect: (question: Question, optionId: string) => void; addOption: (question: Question) => void; removeOption: (question: Question, optionId: string) => void; removeQuestion: (id: string) => void; canRemove: boolean }) {
  return <article className="rounded-2xl border border-[#DCE3EC] bg-[#FAFBFD] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#173A70] text-xs font-black text-white">{number}</span><div><p className="text-sm font-black text-[#26364D]">Question {number}</p><p className="text-[11px] text-[#7A8798]">{question.type.replaceAll('_', ' ').toLowerCase()}</p></div></div><button type="button" disabled={!canRemove} onClick={() => removeQuestion(question.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E4D6D4] bg-white text-[#B42318] hover:bg-[#FFF4F2] disabled:opacity-30" aria-label={`Delete question ${number}`}><Trash2 className="h-4 w-4" /></button></div><div className="mt-4 grid gap-4 lg:grid-cols-3"><Field label="Question prompt" className="lg:col-span-3"><textarea required rows={3} maxLength={4000} value={question.prompt} onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })} className={textareaClass} placeholder="Write the question clearly…" /></Field><Field label="Question type"><select value={question.type} onChange={(e) => { const type = e.target.value as QuestionType; const options = type === 'TRUE_FALSE' ? [{ id: uid(), text: 'True' }, { id: uid(), text: 'False' }] : question.options; updateQuestion(question.id, { type, options, correctOptionIds: [] }); }} className={inputClass}><option value="SINGLE_CHOICE">Single choice</option><option value="MULTIPLE_CHOICE">Multiple choice</option><option value="TRUE_FALSE">True / False</option></select></Field><Field label="Difficulty"><select value={question.difficulty} onChange={(e) => updateQuestion(question.id, { difficulty: e.target.value as Difficulty })} className={inputClass}><option value="EASY">Easy</option><option value="MEDIUM">Medium</option><option value="HARD">Hard</option></select></Field><Field label="Topic"><input maxLength={120} value={question.topic} onChange={(e) => updateQuestion(question.id, { topic: e.target.value })} className={inputClass} placeholder="Arrays, SQL, OS…" /></Field></div><div className="mt-4"><div className="flex items-center justify-between gap-3"><p className="text-xs font-black uppercase tracking-[0.1em] text-[#66758A]">Answer options</p>{question.type !== 'TRUE_FALSE' && question.options.length < 8 && <button type="button" onClick={() => addOption(question)} className="text-xs font-bold text-[#2459A9]">+ Add option</button>}</div><div className="mt-2 grid gap-2 sm:grid-cols-2">{question.options.map((option, index) => { const selected = question.correctOptionIds.includes(option.id); return <div key={option.id} className={`flex items-center gap-2 rounded-xl border bg-white p-2 ${selected ? 'border-[#87C8A1]' : 'border-[#DCE3EC]'}`}><button type="button" onClick={() => toggleCorrect(question, option.id)} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[11px] font-black ${selected ? 'border-[#2E8B57] bg-[#EAF8F0] text-[#247A48]' : 'border-[#D7E0EB] text-[#66758A]'}`} aria-label={`${selected ? 'Unmark' : 'Mark'} option ${index + 1} correct`}>{selected ? <Check className="h-4 w-4" /> : String.fromCharCode(65 + index)}</button><input required value={option.text} onChange={(e) => updateOption(question.id, option.id, e.target.value)} className="h-9 min-w-0 flex-1 border-0 bg-transparent px-1 text-sm text-[#26364D] outline-none" placeholder={`Option ${String.fromCharCode(65 + index)}`} />{question.type !== 'TRUE_FALSE' && question.options.length > 2 && <button type="button" onClick={() => removeOption(question, option.id)} className="flex h-8 w-8 items-center justify-center rounded-lg text-[#9F2D25] hover:bg-[#FFF4F2]"><Trash2 className="h-3.5 w-3.5" /></button>}</div>; })}</div><p className="mt-2 text-[11px] text-[#7A8798]">Click the letter/check button to mark the correct answer{question.type === 'MULTIPLE_CHOICE' ? 's' : ''}.</p></div><div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Field label="Marks"><input type="number" min={0.1} max={100} step="0.25" value={question.points} onChange={(e) => updateQuestion(question.id, { points: Number(e.target.value) })} className={inputClass} /></Field><Field label="Negative marks"><input type="number" min={0} max={question.points} step="0.25" disabled={!negativeMarking} value={question.negativePoints} onChange={(e) => updateQuestion(question.id, { negativePoints: Number(e.target.value) })} className={`${inputClass} disabled:bg-[#EEF2F6] disabled:text-[#98A2B3]`} /></Field><Field label="Explanation" className="sm:col-span-2"><input maxLength={3000} value={question.explanation} onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })} className={inputClass} placeholder="Shown when answers are released" /></Field></div></article>;
}

function BulkImporter({ bulk, setBulk, onImport, onFile }: { bulk: string; setBulk: (value: string) => void; onImport: () => void; onFile: (file: File | null) => void }) { return <div className="mt-5 rounded-2xl border border-[#C7D7EA] bg-[#F5F8FC] p-4 sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="flex items-center gap-2 text-sm font-black text-[#26364D]"><FileJson className="h-4 w-4 text-[#2459A9]" /> Bulk question import</p><p className="mt-1 text-xs leading-5 text-[#718096]">Paste JSON or spreadsheet rows separated by tabs. Columns: Question, A, B, C, D, Correct, Points, Negative, Difficulty, Topic.</p></div><label className={`${secondaryButton} cursor-pointer`}><Upload className="h-4 w-4" /> Upload JSON / TSV<input type="file" accept=".json,.txt,.tsv,text/plain,application/json" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0] ?? null)} /></label></div><textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={8} className={`${textareaClass} mt-4 font-mono text-xs`} placeholder={'Question\tOption A\tOption B\tOption C\tOption D\tCorrect\tPoints\tNegative\tDifficulty\tTopic\nWhat is 2+2?\t3\t4\t5\t6\tB\t1\t0\tEASY\tBasics'} /><div className="mt-3 flex justify-end"><button type="button" onClick={onImport} className={primaryButton}><ClipboardPaste className="h-4 w-4" /> Import questions</button></div></div>; }
function Panel({ eyebrow, title, icon: Icon, children, actions, compact = false }: { eyebrow: string; title: string; icon: typeof Trophy; children: React.ReactNode; actions?: React.ReactNode; compact?: boolean }) { return <section className={`rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.05)] ${compact ? 'p-5' : 'p-5 sm:p-6'}`}><div className="flex flex-wrap items-start justify-between gap-3"><div className="flex items-start gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7E4F6] bg-[#F2F6FC] text-[#2459A9]"><Icon className="h-5 w-5" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#7A8798]">{eyebrow}</p><h2 className="mt-0.5 text-lg font-black text-[#17223B]">{title}</h2></div></div>{actions}</div><div className="mt-5 space-y-4">{children}</div></section>; }
function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) { return <label className={`block text-xs font-bold text-[#536579] ${className}`}>{label}<div className="mt-1.5">{children}</div></label>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] px-3 py-3"><span className="text-xs font-bold text-[#455A73]">{label}</span><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#173A70]" /></label>; }
function SummaryRow({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-3"><dt className="text-[#7A8798]">{label}</dt><dd className="text-right font-black text-[#26364D]">{value}</dd></div>; }
function HeroStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"><p className="text-xl font-black text-white">{value}</p><p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#AFC7E7]">{label}</p></div>; }

function newQuestion(index: number): Question { const a = uid(); const b = uid(); const c = uid(); const d = uid(); return { id: uid(), prompt: '', type: 'SINGLE_CHOICE', options: [{ id: a, text: '' }, { id: b, text: '' }, { id: c, text: '' }, { id: d, text: '' }], correctOptionIds: [], points: 1, negativePoints: 0, explanation: '', difficulty: 'MEDIUM', topic: '' }; }
function uid() { return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `q-${Date.now()}-${Math.random().toString(36).slice(2)}`; }
function clamp(value: number, min: number, max: number) { return Math.max(min, Math.min(max, Number.isFinite(value) ? value : min)); }
function formatNumber(value: number) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value); }
function readError(payload: unknown, fallback: string) { return payload && typeof payload === 'object' && 'error' in payload ? String((payload as { error: unknown }).error) : fallback; }

function parseBulkQuestions(text: string, offset: number): Question[] {
  const source = text.trim(); if (!source) return [];
  if (source.startsWith('[')) {
    const parsed = JSON.parse(source) as unknown;
    if (!Array.isArray(parsed)) throw new Error('JSON question bank must be an array.');
    return parsed.map((item, index) => questionFromJson(item, offset + index));
  }
  const lines = source.split(/\r?\n/).filter((line) => line.trim());
  const rows = lines.map((line) => line.split('\t'));
  const start = rows[0]?.[0]?.trim().toLowerCase().includes('question') ? 1 : 0;
  return rows.slice(start).map((cells, index) => questionFromTsv(cells, offset + index));
}
function questionFromTsv(cells: string[], index: number): Question {
  if (cells.length < 6) throw new Error(`Bulk row ${index + 1} needs at least Question, A, B, C, D and Correct columns.`);
  const optionTexts = cells.slice(1, 5).map((value) => value.trim()).filter(Boolean);
  if (optionTexts.length < 2) throw new Error(`Bulk row ${index + 1} needs at least two options.`);
  const options = optionTexts.map((text) => ({ id: uid(), text }));
  const letters = (cells[5] ?? '').toUpperCase().split(/[,+ ]+/).filter(Boolean);
  const correctOptionIds = letters.map((letter) => options[letter.charCodeAt(0) - 65]?.id).filter((value): value is string => Boolean(value));
  return { id: uid(), prompt: cells[0].trim(), type: correctOptionIds.length > 1 ? 'MULTIPLE_CHOICE' : 'SINGLE_CHOICE', options, correctOptionIds, points: Number(cells[6]) || 1, negativePoints: Math.max(0, Number(cells[7]) || 0), explanation: '', difficulty: normalizeDifficulty(cells[8]), topic: cells[9]?.trim() ?? '' };
}
function questionFromJson(value: unknown, index: number): Question {
  if (!value || typeof value !== 'object') throw new Error(`JSON item ${index + 1} is not a question object.`);
  const item = value as Record<string, unknown>;
  const rawOptions = Array.isArray(item.options) ? item.options : [];
  const options = rawOptions.map((option) => typeof option === 'string' ? { id: uid(), text: option } : option && typeof option === 'object' ? { id: String((option as Record<string, unknown>).id || uid()), text: String((option as Record<string, unknown>).text || '') } : null).filter((option): option is Option => Boolean(option?.text));
  const rawCorrect = Array.isArray(item.correctOptionIds) ? item.correctOptionIds.map(String) : Array.isArray(item.correct) ? item.correct : typeof item.correct === 'string' ? item.correct.split(/[,+ ]+/) : [];
  const correctOptionIds = rawCorrect.map((answer) => { const asString = String(answer); if (options.some((option) => option.id === asString)) return asString; const letterIndex = asString.toUpperCase().charCodeAt(0) - 65; const numericIndex = Number(asString); return options[Number.isInteger(numericIndex) ? numericIndex : letterIndex]?.id; }).filter((value): value is string => Boolean(value));
  const type = item.type === 'MULTIPLE_CHOICE' || correctOptionIds.length > 1 ? 'MULTIPLE_CHOICE' : item.type === 'TRUE_FALSE' ? 'TRUE_FALSE' : 'SINGLE_CHOICE';
  return { id: String(item.id || uid()), prompt: String(item.prompt || item.question || '').trim(), type, options, correctOptionIds, points: Number(item.points) || 1, negativePoints: Math.max(0, Number(item.negativePoints) || 0), explanation: String(item.explanation || ''), difficulty: normalizeDifficulty(item.difficulty), topic: String(item.topic || '') };
}
function normalizeDifficulty(value: unknown): Difficulty { const upper = String(value || 'MEDIUM').toUpperCase(); return upper === 'EASY' || upper === 'HARD' ? upper : 'MEDIUM'; }

const inputClass = 'h-11 w-full rounded-xl border border-[#D7E0EB] bg-white px-3 text-sm text-[#17223B] outline-none transition focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/15';
const textareaClass = 'w-full rounded-xl border border-[#D7E0EB] bg-white px-3 py-2.5 text-sm text-[#17223B] outline-none transition focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/15';
const primaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#173A70] px-4 text-xs font-black text-white transition hover:bg-[#102E5D] disabled:opacity-50';
const secondaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D7E0EB] bg-white px-3 text-xs font-bold text-[#455A73] transition hover:bg-[#F6F8FB] disabled:opacity-40';
