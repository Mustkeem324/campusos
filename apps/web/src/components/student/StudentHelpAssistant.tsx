'use client';

import Link from 'next/link';
import React from 'react';
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Clock3,
  GraduationCap,
  HelpCircle,
  Lightbulb,
  Link2,
  Loader2,
  MessageCircle,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

type RequestedMode = 'AUTO' | 'CAMPUS' | 'STUDY' | 'PRACTICE';
type ResponseMode = 'CAMPUS' | 'STUDY' | 'PRACTICE' | 'LIVE_ASSESSMENT';

type Source = { label: string; href: string; detail?: string };
type ActiveAssessment = { title: string; courseCode: string; deadline: string | null };

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  mode?: ResponseMode;
  sources?: Source[];
  providerAvailable?: boolean;
  activeAssessment?: ActiveAssessment | null;
};

type ApiPayload = {
  success?: boolean;
  answer?: string;
  mode?: ResponseMode;
  sources?: Source[];
  providerAvailable?: boolean;
  providerUsed?: boolean;
  activeAssessment?: ActiveAssessment | null;
  error?: string;
};

const MODES: Array<{ value: RequestedMode; label: string; description: string }> = [
  { value: 'AUTO', label: 'Smart', description: 'Campus + study automatically' },
  { value: 'CAMPUS', label: 'Campus help', description: 'Attendance, fees, schedule, assignments' },
  { value: 'STUDY', label: 'Study tutor', description: 'Explain concepts from your courses' },
  { value: 'PRACTICE', label: 'Practice', description: 'Solve and explain practice questions' },
];

const STARTERS = [
  { label: 'What assignments are due?', prompt: 'What assignments do I still need to submit?' },
  { label: 'Check my attendance', prompt: 'What is my current attendance?' },
  { label: 'Explain a topic', prompt: 'Explain the topic I am studying in a simple step-by-step way.' },
  { label: 'Practice a question', prompt: 'Help me solve a practice question and explain every step.' },
  { label: 'Upcoming exams', prompt: 'What upcoming examination dates are listed for me?' },
  { label: 'Fee status', prompt: 'Do I have any outstanding fees or upcoming payment due date?' },
];

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: 'Ask me about your courses, concepts, assignments, attendance, timetable, exam schedule, results, fees, or a practice question. I use your authorised CampusOS context when the question is about your university account.',
  sources: [],
};

export function StudentHelpAssistant() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([WELCOME]);
  const [draft, setDraft] = React.useState('');
  const [mode, setMode] = React.useState<RequestedMode>('AUTO');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const [activeAssessment, setActiveAssessment] = React.useState<ActiveAssessment | null>(null);
  const endRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  async function submit(question = draft) {
    const clean = question.trim();
    if (!clean || busy) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: clean };
    const history = messages
      .filter((item) => item.id !== 'welcome')
      .slice(-10)
      .map((item) => ({ role: item.role, content: item.content }));

    setMessages((current) => [...current, userMessage]);
    setDraft('');
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/student-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, mode, history }),
      });
      const payload = await response.json().catch(() => ({})) as ApiPayload;
      if (!response.ok || !payload.answer) {
        throw new Error(payload.error || 'Student Help could not answer that question.');
      }

      setActiveAssessment(payload.activeAssessment ?? null);
      setMessages((current) => [...current, {
        id: makeId(),
        role: 'assistant',
        content: payload.answer!,
        mode: payload.mode,
        sources: payload.sources ?? [],
        providerAvailable: payload.providerAvailable,
        activeAssessment: payload.activeAssessment ?? null,
      }]);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Student Help is temporarily unavailable.');
    } finally {
      setBusy(false);
      window.setTimeout(() => textareaRef.current?.focus(), 0);
    }
  }

  function resetConversation() {
    setMessages([WELCOME]);
    setDraft('');
    setError('');
    setActiveAssessment(null);
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] text-white shadow-[0_24px_60px_rgba(11,31,58,0.18)]">
        <div className="grid gap-7 px-6 py-7 sm:px-8 sm:py-9 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#C9DBF7]">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> AI Student Help
              </span>
              <span className="rounded-lg bg-[#EAF8F0] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#247A48]">Student scoped</span>
            </div>
            <h1 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.04em] sm:text-4xl">One assistant for studying and campus questions</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#C7D7EA] sm:text-base">
              Ask academic questions, practise problems, understand course material, or check your own CampusOS information without searching through multiple modules.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <HeroStat icon={BookOpen} label="Course aware" value="LMS" />
            <HeroStat icon={ShieldCheck} label="Access" value="Private" />
            <HeroStat icon={GraduationCap} label="Learning" value="Tutor" />
          </div>
        </div>
      </section>

      {activeAssessment && (
        <section className="flex items-start gap-3 rounded-2xl border border-[#F0C780] bg-[#FFF8E8] px-4 py-4 text-[#6F490D]" role="status">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm font-black">Live assessment guidance mode is active</p>
            <p className="mt-1 text-xs leading-5">
              {activeAssessment.courseCode} · {activeAssessment.title}. Student Help can explain concepts and give hints, but will not provide the final answer while this attempt is active{activeAssessment.deadline ? ` (deadline ${formatDateTime(activeAssessment.deadline)})` : ''}.
            </p>
          </div>
        </section>
      )}

      <div className="grid min-h-[680px] gap-5 xl:grid-cols-[17rem_minmax(0,1fr)_19rem]">
        <aside className="h-fit space-y-4 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.04)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8798]">Help mode</p>
                <p className="mt-1 text-sm font-black text-[#17223B] dark:text-white">Choose how I should help</p>
              </div>
              <Lightbulb className="h-5 w-5 text-[#2459A9]" aria-hidden="true" />
            </div>
            <div className="mt-4 space-y-2">
              {MODES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  disabled={Boolean(activeAssessment) && item.value !== 'AUTO'}
                  onClick={() => setMode(item.value)}
                  className={`w-full rounded-xl border px-3 py-3 text-left transition ${mode === item.value ? 'border-[#5B8FE8] bg-[#F0F6FF]' : 'border-[#E1E7EE] bg-[#FAFBFD] hover:border-[#B8C9E1] hover:bg-white'} disabled:cursor-not-allowed disabled:opacity-45 dark:border-slate-800 dark:bg-slate-900`}
                  aria-pressed={mode === item.value}
                >
                  <p className="text-xs font-black text-[#26364D] dark:text-slate-100">{item.label}</p>
                  <p className="mt-1 text-[10px] leading-4 text-[#7A8798] dark:text-slate-400">{item.description}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A8798]">Quick access</p>
            <div className="mt-3 space-y-1">
              <QuickLink href="/lms" label="Learning hub" />
              <QuickLink href="/assignments" label="Assignments" />
              <QuickLink href="/examinations" label="Examinations" />
              <QuickLink href="/attendance" label="Attendance" />
              <QuickLink href="/results" label="Results" />
            </div>
          </section>
        </aside>

        <section className="flex min-h-[680px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_14px_36px_rgba(15,23,42,0.05)] dark:border-slate-800 dark:bg-slate-950" aria-label="Student Help conversation">
          <div className="flex items-center justify-between gap-3 border-b border-[#E4E9EF] px-4 py-3 sm:px-5 dark:border-slate-800">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#173A70] text-white">
                <MessageCircle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-[#17223B] dark:text-white">CampusOS Student Help</p>
                <p className="text-[10px] font-semibold text-[#7A8798]">Grounded campus help + academic tutoring</p>
              </div>
            </div>
            <button type="button" onClick={resetConversation} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D7E0EB] px-3 text-xs font-bold text-[#536579] hover:bg-[#F6F8FB] dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900">
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> <span className="hidden sm:inline">New chat</span>
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite">
            {messages.map((message) => <MessageBubble key={message.id} message={message} />)}
            {busy && (
              <div className="flex items-start gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#2459A9]"><Sparkles className="h-4 w-4" /></span>
                <div className="rounded-2xl rounded-tl-md border border-[#E1E7EE] bg-[#FAFBFD] px-4 py-3 text-sm text-[#66758A] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Checking your authorised context…</span>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-[#E4E9EF] bg-[#FAFBFD] p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900/70">
            {error && <div role="alert" className="mb-3 flex items-start gap-2 rounded-xl border border-[#F0C4C0] bg-[#FFF4F2] px-3 py-2.5 text-xs font-semibold text-[#9F2D25]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
            <div className="rounded-2xl border border-[#CCD7E5] bg-white p-2 shadow-sm focus-within:border-[#6D9DEB] focus-within:ring-2 focus-within:ring-[#DCEAFF] dark:border-slate-700 dark:bg-slate-950">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 4000))}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    void submit();
                  }
                }}
                rows={3}
                placeholder="Ask a course question, paste a practice problem, or ask about your CampusOS account…"
                className="w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 text-[#26364D] outline-none placeholder:text-[#97A3B2] dark:text-slate-100"
                aria-label="Ask Student Help"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-1">
                <p className="text-[10px] font-semibold text-[#8A97A8]">Enter to send · Shift+Enter for new line · {draft.length}/4000</p>
                <button type="button" disabled={busy || draft.trim().length < 2} onClick={() => void submit()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-xs font-black text-white transition hover:bg-[#102E5D] disabled:cursor-not-allowed disabled:opacity-45">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
                </button>
              </div>
            </div>
          </div>
        </section>

        <aside className="h-fit space-y-4 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-center gap-2"><HelpCircle className="h-4 w-4 text-[#2459A9]" /><p className="text-xs font-black text-[#26364D] dark:text-white">Try asking</p></div>
            <div className="mt-3 space-y-2">
              {STARTERS.map((starter) => (
                <button key={starter.label} type="button" disabled={busy} onClick={() => void submit(starter.prompt)} className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] px-3 py-3 text-left text-xs font-bold text-[#536579] transition hover:border-[#B8C9E1] hover:bg-white disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                  <span>{starter.label}</span><ChevronRight className="h-3.5 w-3.5 shrink-0" />
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
            <p className="flex items-center gap-2 text-xs font-black text-[#26364D] dark:text-white"><ShieldCheck className="h-4 w-4 text-[#247A48]" /> Academic integrity</p>
            <p className="mt-2 text-[11px] leading-5 text-[#718096] dark:text-slate-400">
              Practice and study questions can be explained fully. When CampusOS detects an active quiz attempt—or you say the question is from a live graded assessment—the assistant switches to hints and concept guidance instead of giving the final answer.
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EAF2FF] text-[#2459A9]"><Sparkles className="h-4 w-4" /></span>}
      <div className={`max-w-[88%] sm:max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div className={`rounded-2xl px-4 py-3 text-sm leading-6 ${isUser ? 'rounded-tr-md bg-[#173A70] text-white' : 'rounded-tl-md border border-[#E1E7EE] bg-[#FAFBFD] text-[#34465D] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200'}`}>
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        {!isUser && message.mode && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] font-bold text-[#7A8798]">
            <ModeBadge mode={message.mode} />
            {message.providerAvailable === false && <span className="rounded-lg bg-[#FFF7E8] px-2 py-1 text-[#9B5A0B]">AI provider not configured</span>}
          </div>
        )}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.sources.map((source) => (
              <Link key={`${source.href}:${source.label}`} href={source.href} className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-[#D7E0EB] bg-white px-3 text-[10px] font-bold text-[#4F647C] hover:border-[#AFC5E3] hover:bg-[#F8FAFC] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
                <Link2 className="h-3.5 w-3.5" />
                <span>{source.label}{source.detail ? ` · ${source.detail}` : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeBadge({ mode }: { mode: ResponseMode }) {
  const label = mode === 'LIVE_ASSESSMENT' ? 'Guided assessment help' : mode === 'CAMPUS' ? 'Campus data' : mode === 'PRACTICE' ? 'Practice tutor' : 'Study tutor';
  const classes = mode === 'LIVE_ASSESSMENT' ? 'bg-[#FFF7E8] text-[#9B5A0B]' : mode === 'CAMPUS' ? 'bg-[#EAF8F0] text-[#247A48]' : 'bg-[#EAF2FF] text-[#2459A9]';
  return <span className={`rounded-lg px-2 py-1 ${classes}`}>{label}</span>;
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return <Link href={href} className="flex min-h-9 items-center justify-between gap-2 rounded-lg px-2.5 text-xs font-bold text-[#536579] hover:bg-[#F4F7FB] hover:text-[#173A70] dark:text-slate-300 dark:hover:bg-slate-900"><span>{label}</span><ChevronRight className="h-3.5 w-3.5" /></Link>;
}

function HeroStat({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"><Icon className="mx-auto h-4 w-4 text-[#9FC0EE]" /><p className="mt-2 text-sm font-black text-white">{value}</p><p className="mt-0.5 text-[9px] font-black uppercase tracking-[0.1em] text-[#AFC7E7]">{label}</p></div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
