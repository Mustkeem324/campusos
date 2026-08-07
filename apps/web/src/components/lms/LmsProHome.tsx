'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  Megaphone,
  PlayCircle,
  Search,
  Users,
} from 'lucide-react';

export type LmsCourseCard = {
  id: string;
  courseId: string;
  code: string;
  title: string;
  instructor: string;
  term: string;
  section: string | null;
  students: number;
  modules: number;
  lessons: number;
  completedLessons: number;
  progressPercent: number | null;
  pendingAssignments: number;
  overdueAssignments: number;
  totalAssignments: number;
  upcomingQuizzes: number;
  nextDue: { id: string; title: string; dueDate: string } | null;
  nextQuiz: { id: string; title: string; startTime: string | null } | null;
  latestAnnouncement: { title: string; createdAt: string } | null;
  nextLesson: { id: string; title: string } | null;
};

type Props = {
  role: string;
  heading: string;
  courses: LmsCourseCard[];
  totals: {
    courses: number;
    lessons: number;
    assignments: number;
    attention: number;
    upcomingQuizzes: number;
    students: number;
  };
};

type Filter = 'ALL' | 'ATTENTION' | 'IN_PROGRESS' | 'COMPLETE';

export function LmsProHome({ role, heading, courses, totals }: Props) {
  const isStudent = role === 'STUDENT';
  const isFaculty = role === 'FACULTY';
  const [query, setQuery] = React.useState('');
  const [filter, setFilter] = React.useState<Filter>('ALL');

  const filtered = React.useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesQuery =
        !normalized ||
        course.title.toLowerCase().includes(normalized) ||
        course.code.toLowerCase().includes(normalized) ||
        course.instructor.toLowerCase().includes(normalized) ||
        course.term.toLowerCase().includes(normalized);
      if (!matchesQuery) return false;
      if (filter === 'ATTENTION') return course.overdueAssignments > 0 || course.pendingAssignments > 0;
      if (filter === 'IN_PROGRESS') return course.progressPercent !== null && course.progressPercent > 0 && course.progressPercent < 100;
      if (filter === 'COMPLETE') return course.progressPercent === 100;
      return true;
    });
  }, [courses, filter, query]);

  const continueCourse = isStudent
    ? courses.find((course) => course.nextLesson) ?? courses.find((course) => course.progressPercent !== 100) ?? null
    : null;

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] text-white shadow-[0_24px_60px_rgba(11,31,58,0.18)]">
        <div className="grid gap-8 px-6 py-7 lg:grid-cols-[minmax(0,1fr)_22rem] lg:px-8 lg:py-9">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9DBF7]">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              CampusOS Learning Cloud
            </div>
            <h1 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Learning workspace</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#C6D5E8] sm:text-base">{heading}. Open course content, track academic work, review announcements and move directly to the next required activity.</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold text-[#DCE8F8]">
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">{totals.courses} authorised courses</span>
              <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">{totals.lessons} published lessons</span>
              {isFaculty && <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">{totals.students} enrolled seats across offerings</span>}
            </div>
          </div>

          <div className="rounded-2xl border border-white/12 bg-white/[0.06] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#AFC7E7]">Today&apos;s focus</p>
            {continueCourse ? (
              <div className="mt-4">
                <p className="text-sm font-bold text-white">Continue {continueCourse.code}</p>
                <p className="mt-1 text-sm leading-6 text-[#C7D7EA]">{continueCourse.nextLesson?.title ?? continueCourse.title}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10" aria-label={`${continueCourse.progressPercent ?? 0}% course progress`}>
                  <div className="h-full rounded-full bg-[#4C8DFF]" style={{ width: `${continueCourse.progressPercent ?? 0}%` }} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-[#AFC7E7]">
                  <span>{continueCourse.completedLessons}/{continueCourse.lessons} lessons complete</span>
                  <span>{continueCourse.progressPercent ?? 0}%</span>
                </div>
                <Link href={`/learning/courses/${continueCourse.courseId}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-[#0B1F3A] transition hover:bg-[#EEF4FC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                  Resume course <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-[#C7D7EA]">
                {isStudent ? 'No incomplete published lesson is available right now.' : 'Open a course below to manage teaching content and academic work.'}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Learning summary">
        <Metric icon={BookOpen} label="Courses" value={totals.courses} detail={isFaculty ? 'Teaching / authorised' : 'Current enrolments'} />
        <Metric icon={PlayCircle} label="Published lessons" value={totals.lessons} detail="Across visible modules" />
        <Metric icon={ClipboardList} label={isStudent ? 'Needs attention' : 'Assignments'} value={isStudent ? totals.attention : totals.assignments} detail={isStudent ? 'Pending or overdue' : 'Across your courses'} danger={isStudent && totals.attention > 0} />
        <Metric icon={HelpCircle} label="Upcoming quizzes" value={totals.upcomingQuizzes} detail="Scheduled ahead" />
      </section>

      <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.05)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#66758A]">Course portfolio</p>
            <h2 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#17223B]">Your learning environment</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <span className="sr-only">Search courses</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B8798]" aria-hidden="true" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search course, code or instructor" className="h-11 w-full rounded-xl border border-[#D7E0EB] bg-[#F8FAFC] pl-9 pr-3 text-sm text-[#17223B] outline-none transition focus:border-[#2F6BFF] focus:ring-2 focus:ring-[#2F6BFF]/15" />
            </label>
            {isStudent && (
              <div className="flex rounded-xl border border-[#D7E0EB] bg-[#F8FAFC] p-1" aria-label="Course filter">
                {(['ALL', 'ATTENTION', 'IN_PROGRESS', 'COMPLETE'] as Filter[]).map((item) => (
                  <button key={item} type="button" onClick={() => setFilter(item)} className={`min-h-9 rounded-lg px-3 text-[11px] font-bold transition ${filter === item ? 'bg-white text-[#173A70] shadow-sm' : 'text-[#64748B] hover:text-[#17223B]'}`}>
                    {item === 'IN_PROGRESS' ? 'In progress' : item === 'ATTENTION' ? 'Attention' : item === 'COMPLETE' ? 'Complete' : 'All'}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-5 rounded-xl border border-dashed border-[#CCD6E3] bg-[#F8FAFC] px-6 py-12 text-center">
            <BookOpen className="mx-auto h-8 w-8 text-[#8A97A8]" aria-hidden="true" />
            <p className="mt-3 text-sm font-bold text-[#26364D]">No courses match this view.</p>
            <p className="mt-1 text-xs text-[#718096]">Change the search or filter to see your authorised courses.</p>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {filtered.map((course) => <CourseCard key={course.id} course={course} isStudent={isStudent} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value, detail, danger = false }: { icon: typeof BookOpen; label: string; value: number; detail: string; danger?: boolean }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_8px_26px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#6B778C]">{label}</p>
          <p className={`mt-2 text-3xl font-black tracking-[-0.04em] ${danger ? 'text-[#B42318]' : 'text-[#17223B]'}`}>{value}</p>
          <p className="mt-1 text-xs text-[#7A8798]">{detail}</p>
        </div>
        <span className={`flex h-10 w-10 items-center justify-center rounded-xl border ${danger ? 'border-[#F4C7C3] bg-[#FFF3F2] text-[#B42318]' : 'border-[#D7E4F6] bg-[#F2F6FC] text-[#2459A9]'}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
}

function CourseCard({ course, isStudent }: { course: LmsCourseCard; isStudent: boolean }) {
  const attention = course.overdueAssignments > 0 || course.pendingAssignments > 0;
  return (
    <article className="group overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white transition duration-200 hover:-translate-y-0.5 hover:border-[#B8C9E1] hover:shadow-[0_18px_38px_rgba(15,23,42,0.08)]">
      <div className="border-b border-[#E5EAF0] bg-[#F8FAFC] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg bg-[#EAF2FF] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#2459A9]">{course.code}</span>
              <span className="text-[11px] font-semibold text-[#718096]">{course.term}</span>
              {course.section && <span className="text-[11px] font-semibold text-[#718096]">· {course.section}</span>}
            </div>
            <h3 className="mt-3 line-clamp-2 text-lg font-black leading-6 tracking-[-0.02em] text-[#17223B]">{course.title}</h3>
            <p className="mt-1 text-xs text-[#66758A]">{course.instructor}</p>
          </div>
          <Link href={`/learning/courses/${course.courseId}`} aria-label={`Open ${course.title}`} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D7E0EB] bg-white text-[#36506F] transition group-hover:border-[#AFC5E3] group-hover:text-[#2459A9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF]/30">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="p-5">
        {isStudent && course.progressPercent !== null && (
          <div>
            <div className="flex items-center justify-between gap-3 text-xs font-semibold text-[#66758A]">
              <span>{course.completedLessons} of {course.lessons} lessons complete</span>
              <span className="font-black text-[#173A70]">{course.progressPercent}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#E9EEF5]" role="progressbar" aria-label={`${course.title} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={course.progressPercent}>
              <div className="h-full rounded-full bg-[#2F6BFF]" style={{ width: `${course.progressPercent}%` }} />
            </div>
          </div>
        )}

        <div className={`grid grid-cols-3 gap-2 ${isStudent ? 'mt-5' : ''}`}>
          <MiniStat icon={BookOpen} value={course.modules} label="Modules" />
          <MiniStat icon={PlayCircle} value={course.lessons} label="Lessons" />
          <MiniStat icon={Users} value={course.students} label="Students" />
        </div>

        <div className="mt-5 space-y-2">
          {course.nextDue && (
            <InfoRow icon={CalendarClock} label={course.nextDue.title} meta={`Due ${formatDateTime(course.nextDue.dueDate)}`} tone={attention ? 'attention' : 'normal'} />
          )}
          {course.nextQuiz && (
            <InfoRow icon={HelpCircle} label={course.nextQuiz.title} meta={course.nextQuiz.startTime ? `Quiz · ${formatDateTime(course.nextQuiz.startTime)}` : 'Quiz schedule pending'} />
          )}
          {course.latestAnnouncement && (
            <InfoRow icon={Megaphone} label={course.latestAnnouncement.title} meta={`Announcement · ${formatRelative(course.latestAnnouncement.createdAt)}`} />
          )}
          {!course.nextDue && !course.nextQuiz && !course.latestAnnouncement && (
            <div className="rounded-xl border border-dashed border-[#D7E0EB] px-3 py-3 text-xs text-[#718096]">No upcoming work or announcements are available.</div>
          )}
        </div>

        <Link href={`/learning/courses/${course.courseId}`} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173A70] px-4 text-sm font-bold text-white transition hover:bg-[#102E5D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F6BFF]/40">
          {isStudent && course.nextLesson ? 'Continue learning' : 'Open course workspace'} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}

function MiniStat({ icon: Icon, value, label }: { icon: typeof BookOpen; value: number; label: string }) {
  return <div className="rounded-xl border border-[#E1E7EE] bg-[#FAFBFD] px-3 py-3 text-center"><Icon className="mx-auto h-4 w-4 text-[#55708F]" aria-hidden="true" /><p className="mt-1 text-sm font-black text-[#26364D]">{value}</p><p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8491A2]">{label}</p></div>;
}

function InfoRow({ icon: Icon, label, meta, tone = 'normal' }: { icon: typeof CalendarClock; label: string; meta: string; tone?: 'normal' | 'attention' }) {
  return <div className={`flex items-start gap-3 rounded-xl border px-3 py-3 ${tone === 'attention' ? 'border-[#F1D4B8] bg-[#FFF8F0]' : 'border-[#E1E7EE] bg-[#FAFBFD]'}`}><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${tone === 'attention' ? 'text-[#B54708]' : 'text-[#55708F]'}`} aria-hidden="true" /><div className="min-w-0"><p className="truncate text-xs font-bold text-[#26364D]">{label}</p><p className="mt-0.5 text-[11px] text-[#7A8798]">{meta}</p></div></div>;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function formatRelative(value: string) {
  const diff = Date.now() - new Date(value).getTime();
  const hours = Math.max(0, Math.floor(diff / 3_600_000));
  if (hours < 1) return 'recently';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
