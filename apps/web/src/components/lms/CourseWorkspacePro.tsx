'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  Clock3,
  ExternalLink,
  FileText,
  GraduationCap,
  HelpCircle,
  Loader2,
  Megaphone,
  MonitorPlay,
  Pin,
  PlayCircle,
  Radio,
  Users,
} from 'lucide-react';

type Lesson = {
  id: string;
  title: string;
  contentType: string;
  contentUrl: string | null;
  contentBody: string | null;
  sequence: number;
  createdAt: string;
  updatedAt: string;
  completed: boolean;
};

type Module = { id: string; title: string; description: string | null; sequence: number; lessons: Lesson[] };
type Assignment = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  state: 'GRADED' | 'SUBMITTED_LATE' | 'SUBMITTED' | 'OVERDUE' | 'PENDING';
  submission: { id: string; submittedAt: string; marksObtained: number | null } | null;
};
type Quiz = { id: string; title: string; description: string | null; startTime: string | null; endTime: string | null; timeLimitMins: number | null };
type Announcement = { id: string; title: string; content: string; isPinned: boolean; createdAt: string; author: { user: { name: string } } | null };
type LearningSession = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  startedAt: string | null;
  endedAt: string | null;
  status: string;
  recordingUrl: string | null;
};

type CourseResponse = {
  course: { code: string; title: string };
  offering: { id: string; section: string | null; term: string; termStart: string; termEnd: string; enrolledStudents: number };
  instructor: string;
  accessRole: 'STUDENT' | 'FACULTY' | 'PRIVILEGED';
  modules: Module[];
  progress: { completedLessons: number; totalLessons: number; percent: number; nextLessonId: string | null };
  assignments: Assignment[];
  quizzes: Quiz[];
  announcements: Announcement[];
  learningSessions: LearningSession[];
  canPostAnnouncement: boolean;
  canManageCourse: boolean;
};

type Tab = 'OVERVIEW' | 'CURRICULUM' | 'ASSESSMENTS' | 'ANNOUNCEMENTS' | 'LIVE';

const LESSON_META: Record<string, { label: string; icon: typeof FileText }> = {
  VIDEO: { label: 'Video', icon: PlayCircle },
  ARTICLE: { label: 'Article', icon: FileText },
  PDF: { label: 'PDF', icon: FileText },
  ASSIGNMENT: { label: 'Assignment', icon: ClipboardList },
  QUIZ: { label: 'Quiz', icon: HelpCircle },
};

export function CourseWorkspacePro({ courseId }: { courseId: string }) {
  const [data, setData] = React.useState<CourseResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [tab, setTab] = React.useState<Tab>('OVERVIEW');
  const [selectedLessonId, setSelectedLessonId] = React.useState<string | null>(null);
  const [progressBusy, setProgressBusy] = React.useState<string | null>(null);

  const loadCourse = React.useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}`, { cache: 'no-store' });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !isCourseResponse(payload)) throw new Error(readApiError(payload, 'This course is not available.'));
      setData(payload);
      setSelectedLessonId((current) => current ?? payload.progress.nextLessonId ?? payload.modules.flatMap((module) => module.lessons)[0]?.id ?? null);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'This course is not available.');
    }
  }, [courseId]);

  React.useEffect(() => { void loadCourse(); }, [loadCourse]);

  const lessons = React.useMemo(() => data?.modules.flatMap((module) => module.lessons) ?? [], [data]);
  const selectedIndex = lessons.findIndex((lesson) => lesson.id === selectedLessonId);
  const selectedLesson = selectedIndex >= 0 ? lessons[selectedIndex] : lessons[0] ?? null;
  const nextLesson = data ? lessons.find((lesson) => !lesson.completed) ?? null : null;

  async function markComplete(lesson: Lesson) {
    if (!data || data.accessRole !== 'STUDENT' || lesson.completed) return;
    setProgressBusy(lesson.id);
    setError(null);
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lesson.id)}/complete`, { method: 'POST' });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readApiError(payload, 'Unable to update lesson progress.'));
      setData((current) => {
        if (!current) return current;
        const modules = current.modules.map((module) => ({
          ...module,
          lessons: module.lessons.map((item) => item.id === lesson.id ? { ...item, completed: true } : item),
        }));
        const all = modules.flatMap((module) => module.lessons);
        const completedLessons = all.filter((item) => item.completed).length;
        const next = all.find((item) => !item.completed) ?? null;
        return {
          ...current,
          modules,
          progress: {
            completedLessons,
            totalLessons: all.length,
            percent: all.length ? Math.round((completedLessons / all.length) * 100) : 0,
            nextLessonId: next?.id ?? null,
          },
        };
      });
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Unable to update lesson progress.');
    } finally {
      setProgressBusy(null);
    }
  }

  if (error && !data) return <CourseError message={error} />;
  if (!data) return <CourseSkeleton />;

  const overdue = data.assignments.filter((assignment) => assignment.state === 'OVERDUE').length;
  const pending = data.assignments.filter((assignment) => assignment.state === 'PENDING').length;
  const upcomingSessions = data.learningSessions.filter((session) => new Date(session.scheduledAt).getTime() >= Date.now() || session.status === 'LIVE');

  return (
    <div className="space-y-6 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] text-white shadow-[0_24px_60px_rgba(11,31,58,0.18)]">
        <div className="px-6 py-6 sm:px-8 sm:py-8">
          <Link href="/lms" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-[#AFC7E7] transition hover:text-white">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Learning hub
          </Link>
          <div className="mt-5 grid gap-7 xl:grid-cols-[minmax(0,1fr)_22rem]">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#AFC7E7]">
                <span className="rounded-lg border border-white/12 bg-white/5 px-2.5 py-1">{data.course.code}</span>
                <span>{data.offering.term}</span>
                {data.offering.section && <span>· {data.offering.section}</span>}
              </div>
              <h1 className="mt-3 max-w-4xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">{data.course.title}</h1>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#C8D8EB]">
                <span className="inline-flex items-center gap-2"><GraduationCap className="h-4 w-4" aria-hidden="true" /> {data.instructor}</span>
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" /> {data.offering.enrolledStudents} students</span>
                <span className="inline-flex items-center gap-2"><CalendarClock className="h-4 w-4" aria-hidden="true" /> {formatDate(data.offering.termStart)} – {formatDate(data.offering.termEnd)}</span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                {data.accessRole === 'STUDENT' && nextLesson && (
                  <button type="button" onClick={() => { setSelectedLessonId(nextLesson.id); setTab('CURRICULUM'); }} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-[#0B1F3A] transition hover:bg-[#EEF4FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                    <PlayCircle className="h-4 w-4" aria-hidden="true" /> Continue learning
                  </button>
                )}
                <Link href="/assignments" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
                  <ClipboardList className="h-4 w-4" aria-hidden="true" /> Assignments
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#AFC7E7]">Course progress</p>
                {data.accessRole === 'STUDENT' && <span className="text-xl font-black">{data.progress.percent}%</span>}
              </div>
              {data.accessRole === 'STUDENT' ? (
                <>
                  <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-label="Course progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.progress.percent}>
                    <div className="h-full rounded-full bg-[#4C8DFF]" style={{ width: `${data.progress.percent}%` }} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-[#B9CCE3]">
                    <span>{data.progress.completedLessons} completed</span><span>{data.progress.totalLessons} lessons</span>
                  </div>
                </>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <HeroMini label="Modules" value={data.modules.length} />
                  <HeroMini label="Lessons" value={lessons.length} />
                  <HeroMini label="Assignments" value={data.assignments.length} />
                  <HeroMini label="Quizzes" value={data.quizzes.length} />
                </div>
              )}
              {(pending > 0 || overdue > 0) && data.accessRole === 'STUDENT' && (
                <div className="mt-4 rounded-xl border border-[#D89A4A]/25 bg-[#D89A4A]/10 px-3 py-2.5 text-xs font-semibold text-[#FFE2BA]">{overdue > 0 ? `${overdue} overdue · ` : ''}{pending} pending assignment{pending === 1 ? '' : 's'}</div>
              )}
            </div>
          </div>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-[#F0C4C0] bg-[#FFF4F2] px-4 py-3 text-sm text-[#9F2D25]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />{error}</div>}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label="Course metrics">
        <Metric icon={BookOpen} label="Modules" value={data.modules.length} />
        <Metric icon={PlayCircle} label="Lessons" value={lessons.length} />
        <Metric icon={ClipboardList} label="Assignments" value={data.assignments.length} />
        <Metric icon={HelpCircle} label="Quizzes" value={data.quizzes.length} />
        <Metric icon={Megaphone} label="Announcements" value={data.announcements.length} />
      </section>

      <div className="sticky top-0 z-20 -mx-1 overflow-x-auto px-1 py-1">
        <nav className="inline-flex min-w-full rounded-2xl border border-[#DCE3EC] bg-white p-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.06)] sm:min-w-0" aria-label="Course workspace sections">
          {([
            ['OVERVIEW', 'Overview'], ['CURRICULUM', 'Curriculum'], ['ASSESSMENTS', 'Assessments'], ['ANNOUNCEMENTS', 'Announcements'], ['LIVE', 'Live & recordings'],
          ] as Array<[Tab, string]>).map(([value, label]) => (
            <button key={value} type="button" onClick={() => setTab(value)} className={`min-h-10 whitespace-nowrap rounded-xl px-4 text-sm font-bold transition ${tab === value ? 'bg-[#173A70] text-white shadow-sm' : 'text-[#5F6F83] hover:bg-[#F4F7FB] hover:text-[#17223B]'}`} aria-current={tab === value ? 'page' : undefined}>{label}</button>
          ))}
        </nav>
      </div>

      {tab === 'OVERVIEW' && <Overview data={data} lessons={lessons} nextLesson={nextLesson} onOpenLesson={(id) => { setSelectedLessonId(id); setTab('CURRICULUM'); }} upcomingSessions={upcomingSessions} />}
      {tab === 'CURRICULUM' && <Curriculum data={data} lessons={lessons} selectedLesson={selectedLesson} selectedIndex={selectedIndex} onSelect={setSelectedLessonId} onComplete={markComplete} busyLessonId={progressBusy} />}
      {tab === 'ASSESSMENTS' && <Assessments data={data} />}
      {tab === 'ANNOUNCEMENTS' && <Announcements courseId={courseId} data={data} onChange={(announcements) => setData((current) => current ? { ...current, announcements } : current)} />}
      {tab === 'LIVE' && <LiveSessions sessions={data.learningSessions} />}
    </div>
  );
}

function Overview({ data, lessons, nextLesson, onOpenLesson, upcomingSessions }: { data: CourseResponse; lessons: Lesson[]; nextLesson: Lesson | null; onOpenLesson: (id: string) => void; upcomingSessions: LearningSession[] }) {
  const upcomingAssignments = data.assignments.filter((assignment) => ['PENDING', 'OVERDUE'].includes(assignment.state)).slice(0, 4);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.75fr)]">
      <div className="space-y-5">
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Continue learning</p><h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#17223B]">{nextLesson?.title ?? (lessons.length ? 'Course curriculum complete' : 'Learning content')}</h2></div>
            {nextLesson && <button type="button" onClick={() => onOpenLesson(nextLesson.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-bold text-white hover:bg-[#102E5D]"><PlayCircle className="h-4 w-4" aria-hidden="true" /> Open lesson</button>}
          </div>
          {nextLesson ? <p className="mt-3 text-sm leading-6 text-[#66758A]">Resume from the next incomplete lesson. Completion is recorded against your authenticated student account.</p> : <p className="mt-3 text-sm leading-6 text-[#66758A]">{lessons.length ? 'All published lessons are currently complete.' : 'The instructor has not published lesson content yet.'}</p>}
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <OverviewTile label="Progress" value={data.accessRole === 'STUDENT' ? `${data.progress.percent}%` : `${lessons.length} lessons`} />
            <OverviewTile label="Assignments open" value={String(data.assignments.filter((assignment) => ['PENDING', 'OVERDUE'].includes(assignment.state)).length)} />
            <OverviewTile label="Upcoming sessions" value={String(upcomingSessions.length)} />
          </div>
        </section>

        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Curriculum map</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Published modules</h2></div><span className="text-xs font-bold text-[#718096]">{lessons.length} lessons</span></div>
          <div className="mt-4 space-y-3">
            {data.modules.length === 0 ? <Empty text="No modules have been published." /> : data.modules.map((module, moduleIndex) => {
              const completeCount = module.lessons.filter((lesson) => lesson.completed).length;
              return <button key={module.id} type="button" onClick={() => module.lessons[0] && onOpenLesson(module.lessons.find((lesson) => !lesson.completed)?.id ?? module.lessons[0].id)} className="flex w-full items-center gap-4 rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] px-4 py-4 text-left transition hover:border-[#B8C9E1] hover:bg-white disabled:cursor-default" disabled={module.lessons.length === 0}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EAF2FF] text-xs font-black text-[#2459A9]">{String(moduleIndex + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-black text-[#26364D]">{module.title}</span><span className="mt-0.5 block text-xs text-[#7A8798]">{module.lessons.length} lessons{data.accessRole === 'STUDENT' ? ` · ${completeCount} complete` : ''}</span></span><ChevronRight className="h-4 w-4 text-[#8794A5]" aria-hidden="true" /></button>;
            })}
          </div>
        </section>
      </div>

      <aside className="space-y-5">
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5"><h2 className="text-sm font-black text-[#17223B]">Upcoming work</h2><div className="mt-4 space-y-3">{upcomingAssignments.length === 0 ? <Empty text="No pending assignment work." compact /> : upcomingAssignments.map((assignment) => <Link key={assignment.id} href={`/assignments/${assignment.id}`} className="block rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] p-3 transition hover:border-[#B8C9E1] hover:bg-white"><div className="flex items-start justify-between gap-2"><p className="text-xs font-black text-[#26364D]">{assignment.title}</p><AssignmentBadge state={assignment.state} /></div><p className="mt-1 text-[11px] text-[#7A8798]">Due {formatDateTime(assignment.dueDate)}</p></Link>)}</div></section>
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5"><h2 className="text-sm font-black text-[#17223B]">Latest announcement</h2>{data.announcements[0] ? <div className="mt-4"><p className="text-sm font-bold text-[#26364D]">{data.announcements[0].title}</p><p className="mt-2 line-clamp-4 text-xs leading-5 text-[#718096]">{data.announcements[0].content}</p><p className="mt-3 text-[11px] font-semibold text-[#8A97A8]">{formatRelative(data.announcements[0].createdAt)}</p></div> : <div className="mt-4"><Empty text="No course announcement yet." compact /></div>}</section>
      </aside>
    </div>
  );
}

function Curriculum({ data, lessons, selectedLesson, selectedIndex, onSelect, onComplete, busyLessonId }: { data: CourseResponse; lessons: Lesson[]; selectedLesson: Lesson | null; selectedIndex: number; onSelect: (id: string) => void; onComplete: (lesson: Lesson) => Promise<void>; busyLessonId: string | null }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[21rem_minmax(0,1fr)]">
      <aside className="h-fit overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white xl:sticky xl:top-20">
        <div className="border-b border-[#E4E9EF] px-4 py-4"><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Course outline</p><div className="mt-2 flex items-center justify-between text-xs text-[#718096]"><span>{data.modules.length} modules</span><span>{lessons.length} lessons</span></div></div>
        <div className="max-h-[68dvh] overflow-y-auto p-2">
          {data.modules.length === 0 ? <Empty text="No curriculum published." compact /> : data.modules.map((module, moduleIndex) => <ModuleOutline key={module.id} module={module} moduleIndex={moduleIndex} selectedId={selectedLesson?.id ?? null} onSelect={onSelect} />)}
        </div>
      </aside>

      <main className="min-w-0 overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
        {selectedLesson ? (
          <>
            <div className="border-b border-[#E4E9EF] px-5 py-5 sm:px-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><LessonTypeBadge type={selectedLesson.contentType} />{selectedLesson.completed && <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF8F0] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#247A48]"><CheckCircle2 className="h-3 w-3" aria-hidden="true" /> Complete</span>}</div><h2 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#17223B]">{selectedLesson.title}</h2><p className="mt-1 text-xs text-[#7A8798]">Lesson {Math.max(0, selectedIndex) + 1} of {lessons.length}</p></div>
                {data.accessRole === 'STUDENT' && !selectedLesson.completed && <button type="button" disabled={busyLessonId === selectedLesson.id} onClick={() => void onComplete(selectedLesson)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-bold text-white transition hover:bg-[#102E5D] disabled:cursor-not-allowed disabled:opacity-60">{busyLessonId === selectedLesson.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />} Mark complete</button>}
              </div>
            </div>
            <div className="min-h-[26rem] p-5 sm:p-6"><LessonContent lesson={selectedLesson} /></div>
            <div className="flex items-center justify-between gap-3 border-t border-[#E4E9EF] px-4 py-4 sm:px-6">
              <button type="button" disabled={selectedIndex <= 0} onClick={() => lessons[selectedIndex - 1] && onSelect(lessons[selectedIndex - 1].id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D7E0EB] px-3 text-sm font-bold text-[#36506F] hover:bg-[#F6F8FB] disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /> Previous</button>
              <span className="hidden text-xs font-semibold text-[#7A8798] sm:inline">{data.accessRole === 'STUDENT' ? `${data.progress.completedLessons}/${data.progress.totalLessons} complete` : `${lessons.length} published lessons`}</span>
              <button type="button" disabled={selectedIndex < 0 || selectedIndex >= lessons.length - 1} onClick={() => lessons[selectedIndex + 1] && onSelect(lessons[selectedIndex + 1].id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D7E0EB] px-3 text-sm font-bold text-[#36506F] hover:bg-[#F6F8FB] disabled:cursor-not-allowed disabled:opacity-40">Next <ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
            </div>
          </>
        ) : <div className="p-10"><Empty text="No published lesson is available." /></div>}
      </main>
    </div>
  );
}

function ModuleOutline({ module, moduleIndex, selectedId, onSelect }: { module: Module; moduleIndex: number; selectedId: string | null; onSelect: (id: string) => void }) {
  const [open, setOpen] = React.useState(true);
  return <div className="mb-2 overflow-hidden rounded-xl border border-[#E3E8EE]"><button type="button" onClick={() => setOpen((value) => !value)} className="flex w-full items-center gap-3 bg-[#F8FAFC] px-3 py-3 text-left"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF2FF] text-[11px] font-black text-[#2459A9]">{String(moduleIndex + 1).padStart(2, '0')}</span><span className="min-w-0 flex-1"><span className="block truncate text-xs font-black text-[#26364D]">{module.title}</span><span className="text-[10px] text-[#8491A2]">{module.lessons.length} lessons</span></span><ChevronDown className={`h-4 w-4 text-[#7A8798] transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" /></button>{open && <div className="space-y-1 bg-white p-1.5">{module.lessons.length === 0 ? <p className="px-2 py-3 text-xs text-[#8491A2]">No published lessons.</p> : module.lessons.map((lesson) => { const meta = lessonMeta(lesson.contentType); const Icon = meta.icon; const selected = lesson.id === selectedId; return <button key={lesson.id} type="button" onClick={() => onSelect(lesson.id)} className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition ${selected ? 'bg-[#EDF4FF] text-[#173A70]' : 'text-[#536579] hover:bg-[#F7F9FC]'}`}><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${lesson.completed ? 'bg-[#EAF8F0] text-[#247A48]' : selected ? 'bg-white text-[#2459A9]' : 'bg-[#F0F3F7] text-[#718096]'}`}>{lesson.completed ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}</span><span className="min-w-0 flex-1 truncate text-xs font-bold">{lesson.title}</span></button>; })}</div>}</div>;
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  if (lesson.contentType === 'VIDEO') return lesson.contentUrl ? <div className="space-y-4"><video controls preload="metadata" className="aspect-video w-full rounded-2xl bg-black" src={lesson.contentUrl} aria-label={lesson.title}>Your browser does not support video playback.</video>{lesson.contentBody && <ArticleText text={lesson.contentBody} />}</div> : <Empty text="The instructor has not attached a video yet." />;
  if (lesson.contentType === 'PDF') return lesson.contentUrl ? <div className="space-y-4">{lesson.contentBody && <ArticleText text={lesson.contentBody} />}<div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-[#F5F7FA]"><iframe title={`${lesson.title} PDF preview`} src={lesson.contentUrl} className="h-[68dvh] min-h-[32rem] w-full" /></div><a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D7E0EB] px-4 text-sm font-bold text-[#36506F] hover:bg-[#F6F8FB]"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Open PDF in new tab</a></div> : <Empty text="The PDF has not been published yet." />;
  if (lesson.contentUrl && !lesson.contentBody) return <div className="rounded-2xl border border-[#DCE3EC] bg-[#FAFBFD] p-6"><p className="text-sm text-[#66758A]">This lesson uses an external learning resource.</p><a href={lesson.contentUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-bold text-white"><ExternalLink className="h-4 w-4" aria-hidden="true" /> Open resource</a></div>;
  return lesson.contentBody ? <ArticleText text={lesson.contentBody} /> : <Empty text="This lesson has no published content yet." />;
}

function ArticleText({ text }: { text: string }) { return <div className="rounded-2xl bg-[#F8FAFC] p-5 sm:p-6"><p className="whitespace-pre-wrap text-sm leading-7 text-[#33465D]">{text}</p></div>; }

function Assessments({ data }: { data: CourseResponse }) {
  return <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Coursework</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Assignments</h2></div><span className="rounded-full bg-[#F0F3F7] px-2.5 py-1 text-xs font-bold text-[#536579]">{data.assignments.length}</span></div><div className="mt-4 space-y-3">{data.assignments.length === 0 ? <Empty text="No assignments published." compact /> : data.assignments.map((assignment) => <Link key={assignment.id} href={`/assignments/${assignment.id}`} className="block rounded-xl border border-[#E1E7EE] p-4 transition hover:border-[#B8C9E1] hover:bg-[#FAFBFD]"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-black text-[#26364D]">{assignment.title}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-[#718096]">{assignment.description}</p></div><AssignmentBadge state={assignment.state} /></div><div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#7A8798]"><span>Due {formatDateTime(assignment.dueDate)}</span><span>{assignment.maxMarks} marks</span>{assignment.submission?.marksObtained !== null && assignment.submission?.marksObtained !== undefined && <span className="font-black text-[#247A48]">Score {assignment.submission.marksObtained}/{assignment.maxMarks}</span>}</div></Link>)}</div></section><section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Knowledge checks</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Quizzes</h2></div><span className="rounded-full bg-[#F0F3F7] px-2.5 py-1 text-xs font-bold text-[#536579]">{data.quizzes.length}</span></div><div className="mt-4 space-y-3">{data.quizzes.length === 0 ? <Empty text="No quizzes scheduled." compact /> : data.quizzes.map((quiz) => <div key={quiz.id} className="rounded-xl border border-[#E1E7EE] p-4"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F2EEFF] text-[#6B4BC3]"><HelpCircle className="h-4 w-4" aria-hidden="true" /></span><div><p className="font-black text-[#26364D]">{quiz.title}</p>{quiz.description && <p className="mt-1 text-xs leading-5 text-[#718096]">{quiz.description}</p>}<div className="mt-2 flex flex-wrap gap-3 text-[11px] font-semibold text-[#7A8798]"><span>{quiz.startTime ? `Opens ${formatDateTime(quiz.startTime)}` : 'Open date not set'}</span>{quiz.timeLimitMins && <span>{quiz.timeLimitMins} min</span>}</div></div></div></div>)}</div></section></div>;
}

function Announcements({ courseId, data, onChange }: { courseId: string; data: CourseResponse; onChange: (items: Announcement[]) => void }) {
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/announcements`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title, content }) });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok || !payload || typeof payload !== 'object' || !('announcement' in payload)) throw new Error(readApiError(payload, 'Unable to post announcement.'));
      const announcement = (payload as { announcement: Announcement }).announcement;
      onChange([announcement, ...data.announcements]); setTitle(''); setContent(''); setOpen(false);
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Unable to post announcement.'); } finally { setBusy(false); }
  }

  return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Course communication</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Announcements</h2></div>{data.canPostAnnouncement && <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-bold text-white hover:bg-[#102E5D]"><Megaphone className="h-4 w-4" aria-hidden="true" /> New announcement</button>}</div>{open && <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-[#DFE6EE] bg-[#F8FAFC] p-4"><label className="block text-xs font-bold text-[#536579]">Title<input value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={120} className="mt-1.5 h-11 w-full rounded-xl border border-[#D7E0EB] bg-white px-3 text-sm text-[#17223B] outline-none focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/15" /></label><label className="block text-xs font-bold text-[#536579]">Message<textarea value={content} onChange={(event) => setContent(event.target.value)} required maxLength={2000} rows={4} className="mt-1.5 w-full rounded-xl border border-[#D7E0EB] bg-white px-3 py-2.5 text-sm text-[#17223B] outline-none focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/15" /></label>{error && <p role="alert" className="text-sm font-semibold text-[#B42318]">{error}</p>}<div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="min-h-10 rounded-xl border border-[#D7E0EB] px-4 text-sm font-bold text-[#536579]">Cancel</button><button type="submit" disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-bold text-white disabled:opacity-60">{busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}{busy ? 'Posting…' : 'Post announcement'}</button></div></form>}<div className="mt-5 space-y-3">{data.announcements.length === 0 ? <Empty text="No announcements have been posted." /> : data.announcements.map((announcement) => <article key={announcement.id} className="rounded-xl border border-[#E1E7EE] p-4 sm:p-5"><div className="flex flex-wrap items-center gap-2">{announcement.isPinned && <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#2459A9]"><Pin className="h-3 w-3" aria-hidden="true" /> Pinned</span>}<h3 className="font-black text-[#26364D]">{announcement.title}</h3></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#66758A]">{announcement.content}</p><p className="mt-3 text-[11px] font-semibold text-[#8A97A8]">{announcement.author?.user.name ?? 'Administration'} · {formatRelative(announcement.createdAt)}</p></article>)}</div></section>;
}

function LiveSessions({ sessions }: { sessions: LearningSession[] }) {
  return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-[0_10px_30px_rgba(15,23,42,0.04)] sm:p-6"><div><p className="text-xs font-black uppercase tracking-[0.13em] text-[#66758A]">Synchronous learning</p><h2 className="mt-1 text-lg font-black text-[#17223B]">Live classes & recordings</h2></div><div className="mt-5 grid gap-4 lg:grid-cols-2">{sessions.length === 0 ? <div className="lg:col-span-2"><Empty text="No live learning sessions are scheduled for this course." /></div> : sessions.map((session) => { const live = session.status === 'LIVE'; return <article key={session.id} className="rounded-2xl border border-[#E1E7EE] bg-[#FAFBFD] p-4"><div className="flex items-start gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${live ? 'bg-[#FFF0EF] text-[#B42318]' : 'bg-[#EAF2FF] text-[#2459A9]'}`}>{live ? <Radio className="h-5 w-5" aria-hidden="true" /> : <MonitorPlay className="h-5 w-5" aria-hidden="true" />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-black text-[#26364D]">{session.title}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${live ? 'bg-[#FFF0EF] text-[#B42318]' : 'bg-[#EEF2F6] text-[#66758A]'}`}>{session.status}</span></div>{session.description && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#718096]">{session.description}</p>}<p className="mt-2 text-[11px] font-semibold text-[#7A8798]">{formatDateTime(session.scheduledAt)}</p>{session.recordingUrl && <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg border border-[#D7E0EB] bg-white px-3 text-xs font-bold text-[#36506F]"><PlayCircle className="h-3.5 w-3.5" aria-hidden="true" /> Watch recording</a>}</div></div></article>; })}</div></section>;
}

function Metric({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) { return <div className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)]"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D7E4F6] bg-[#F2F6FC] text-[#2459A9]"><Icon className="h-5 w-5" aria-hidden="true" /></span><div><p className="text-2xl font-black tracking-[-0.03em] text-[#17223B]">{value}</p><p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8798]">{label}</p></div></div></div>; }
function HeroMini({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3"><p className="text-xl font-black text-white">{value}</p><p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#AFC7E7]">{label}</p></div>; }
function OverviewTile({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] px-4 py-4"><p className="text-xl font-black text-[#17223B]">{value}</p><p className="mt-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#7A8798]">{label}</p></div>; }
function LessonTypeBadge({ type }: { type: string }) { const meta = lessonMeta(type); const Icon = meta.icon; return <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF2FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#2459A9]"><Icon className="h-3 w-3" aria-hidden="true" />{meta.label}</span>; }
function AssignmentBadge({ state }: { state: Assignment['state'] }) { const classes = state === 'OVERDUE' ? 'bg-[#FFF0EF] text-[#B42318]' : state === 'PENDING' ? 'bg-[#FFF7E8] text-[#A15C07]' : state === 'GRADED' ? 'bg-[#EAF8F0] text-[#247A48]' : 'bg-[#EDF4FF] text-[#2459A9]'; const label = state.replaceAll('_', ' ').toLowerCase(); return <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] ${classes}`}>{label}</span>; }
function Empty({ text, compact = false }: { text: string; compact?: boolean }) { return <div className={`rounded-xl border border-dashed border-[#D6DEE8] bg-[#FAFBFD] text-center text-[#7A8798] ${compact ? 'px-3 py-4 text-xs' : 'px-6 py-10 text-sm'}`}>{text}</div>; }
function CourseError({ message }: { message: string }) { return <div className="space-y-5"><Link href="/lms" className="inline-flex items-center gap-2 text-sm font-bold text-[#36506F]"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to learning</Link><div role="alert" className="rounded-2xl border border-[#F0C4C0] bg-[#FFF4F2] p-5 text-sm text-[#9F2D25]"><div className="flex items-start gap-3"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><p>{message}</p></div></div></div>; }
function CourseSkeleton() { return <div className="space-y-5" aria-busy="true" aria-label="Loading course workspace"><div className="h-64 animate-pulse rounded-[28px] bg-[#E8EDF4]" /><div className="grid grid-cols-2 gap-3 xl:grid-cols-5">{Array.from({ length: 5 }).map((_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-[#EEF2F6]" />)}</div><div className="h-96 animate-pulse rounded-2xl bg-[#EEF2F6]" /></div>; }
function lessonMeta(type: string) { return LESSON_META[type] ?? { label: type || 'Lesson', icon: BookOpen }; }
function formatDate(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value)); }
function formatDateTime(value: string) { return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function formatRelative(value: string) { const diff = Math.max(0, Date.now() - new Date(value).getTime()); const hours = Math.floor(diff / 3_600_000); if (hours < 1) return 'recently'; if (hours < 24) return `${hours}h ago`; return `${Math.floor(hours / 24)}d ago`; }
function readApiError(value: unknown, fallback: string) { return value && typeof value === 'object' && 'error' in value ? String((value as { error: unknown }).error) : fallback; }
function isCourseResponse(value: unknown): value is CourseResponse { return Boolean(value && typeof value === 'object' && Array.isArray((value as CourseResponse).modules) && Array.isArray((value as CourseResponse).assignments) && Array.isArray((value as CourseResponse).learningSessions)); }
