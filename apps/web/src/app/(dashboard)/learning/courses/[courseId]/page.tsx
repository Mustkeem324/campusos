'use client';

import React from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  HelpCircle,
  Loader2,
  Megaphone,
  Pin,
  PlayCircle,
  X,
} from 'lucide-react';
import { PageHeader } from '../../../../../components/layout/PageHeader';

type Lesson = { id: string; title: string; contentType: string; contentUrl: string | null; contentBody: string | null; sequence: number };
type Module = { id: string; title: string; description: string | null; sequence: number; lessons: Lesson[] };
type Assignment = { id: string; title: string; description: string; dueDate: string; maxMarks: number };
type Quiz = { id: string; title: string; description: string | null; startTime: string | null; endTime: string | null; timeLimitMins: number | null };
type Announcement = { id: string; title: string; content: string; isPinned: boolean; createdAt: string; author: { user: { name: string } } | null };
type CourseResponse = {
  course: { code: string; title: string };
  instructor: string;
  modules: Module[];
  assignments: Assignment[];
  quizzes: Quiz[];
  announcements: Announcement[];
  canPostAnnouncement: boolean;
};

const LESSON_TYPE_META: Record<string, { icon: typeof FileText; label: string }> = {
  VIDEO: { icon: PlayCircle, label: 'Video' },
  ARTICLE: { icon: FileText, label: 'Article' },
  PDF: { icon: FileText, label: 'Document' },
  ASSIGNMENT: { icon: ClipboardList, label: 'Assignment' },
  QUIZ: { icon: HelpCircle, label: 'Quiz' },
};

function lessonMeta(contentType: string) {
  return LESSON_TYPE_META[contentType] ?? { icon: BookOpen, label: contentType || 'Lesson' };
}

export default function CourseWorkspace({ params }: { params: { courseId: string } }) {
  const [data, setData] = React.useState<CourseResponse | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [viewerIndex, setViewerIndex] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    fetch(`/api/learning/courses/${encodeURIComponent(params.courseId)}`)
      .then(async (response) => {
        const payload: unknown = await response.json();
        if (!response.ok || !isCourseResponse(payload)) throw new Error('This course is not available.');
        return payload;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((cause: unknown) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'This course is not available.');
      });
    return () => {
      cancelled = true;
    };
  }, [params.courseId]);

  const allLessons = React.useMemo(() => (data ? data.modules.flatMap((module) => module.lessons) : []), [data]);
  const activeLesson = viewerIndex !== null && viewerIndex >= 0 ? allLessons[viewerIndex] : null;

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Course" description="Learning workspace" />
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" aria-hidden="true" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading course">
        <div className="h-16 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-40 animate-pulse rounded-xl bg-surface-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={data.course.title} description={`${data.course.code} · Instructor: ${data.instructor}`} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <main className="min-w-0 space-y-5">
          <AnnouncementsSection
            courseId={params.courseId}
            announcements={data.announcements}
            canPost={data.canPostAnnouncement}
          />
          <Modules modules={data.modules} onOpenLesson={(lesson, index) => setViewerIndex(index)} />
          <Assessments assignments={data.assignments} quizzes={data.quizzes} />
        </main>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Course at a glance</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <Stat label="Modules" value={String(data.modules.length)} />
            <Stat label="Lessons" value={String(allLessons.length)} />
            <Stat label="Assignments" value={String(data.assignments.length)} />
            <Stat label="Quizzes" value={String(data.quizzes.length)} />
            <Stat label="Announcements" value={String(data.announcements.length)} />
          </dl>
          <Link href="/lms" className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted">
            All courses
          </Link>
        </aside>
      </div>

      {activeLesson && (
        <LessonViewer
          lesson={activeLesson}
          position={viewerIndex ?? 0}
          total={allLessons.length}
          onClose={() => setViewerIndex(null)}
          onNavigate={(next) => setViewerIndex(next)}
        />
      )}
    </div>
  );
}

function Modules({ modules, onOpenLesson }: { modules: Module[]; onOpenLesson: (lesson: Lesson, index: number) => void }) {
  if (modules.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5" aria-label="Learning modules">
        <h2 className="font-semibold">Learning modules</h2>
        <p className="mt-3 text-sm text-text-secondary">Published lessons will appear here.</p>
      </section>
    );
  }

  let lessonOffset = 0;
  return (
    <section className="space-y-4" aria-label="Learning modules">
      {modules.map((module) => {
        const startIndex = lessonOffset;
        lessonOffset += module.lessons.length;
        return (
          <article key={module.id} className="rounded-xl border border-border bg-surface p-5">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{module.title}</h2>
              <span className="text-xs font-medium text-text-secondary">
                {module.lessons.length} lesson{module.lessons.length === 1 ? '' : 's'}
              </span>
            </header>
            {module.description && <p className="mt-2 text-sm leading-6 text-text-secondary">{module.description}</p>}
            <ol className="mt-4 space-y-2">
              {module.lessons.map((lesson, index) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  onOpen={() => onOpenLesson(lesson, startIndex + index)}
                />
              ))}
            </ol>
          </article>
        );
      })}
    </section>
  );
}

function LessonRow({ lesson, onOpen }: { lesson: Lesson; onOpen: () => void }) {
  const meta = lessonMeta(lesson.contentType);
  const Icon = meta.icon;
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group flex min-h-11 w-full items-center gap-3 rounded-lg bg-surface-muted px-3 py-2.5 text-left transition-colors hover:bg-primary/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={`Open lesson: ${lesson.title}`}
      >
        <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">{lesson.title}</span>
        <span className="shrink-0 text-xs font-medium text-text-secondary">{meta.label}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-text-secondary transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </li>
  );
}

function LessonViewer({
  lesson,
  position,
  total,
  onClose,
  onNavigate,
}: {
  lesson: Lesson;
  position: number;
  total: number;
  onClose: () => void;
  onNavigate: (nextIndex: number) => void;
}) {
  const dialogRef = React.useRef<HTMLDivElement>(null);
  const meta = lessonMeta(lesson.contentType);
  const Icon = meta.icon;
  const hasPrevious = position > 0;
  const hasNext = position < total - 1;

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  React.useEffect(() => {
    const container = dialogRef.current;
    if (!container) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')).filter(
        (element) => !element.hasAttribute('disabled') && element.offsetParent !== null,
      );
    const first = focusables()[0];
    first?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      if (event.shiftKey && document.activeElement === firstEl) {
        event.preventDefault();
        lastEl.focus();
      } else if (!event.shiftKey && document.activeElement === lastEl) {
        event.preventDefault();
        firstEl.focus();
      }
    }

    container.addEventListener('keydown', onKeyDown);
    return () => {
      container.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-viewer-title"
        className="flex max-h-[92dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-surface shadow-2xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-border p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-primary">
              <Icon className="h-4 w-4" aria-hidden="true" />
              {meta.label} lesson
            </p>
            <h2 id="lesson-viewer-title" className="mt-1 truncate text-lg font-semibold">
              {lesson.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close lesson"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <LessonContent lesson={lesson} />
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-border p-4">
          <button
            type="button"
            disabled={!hasPrevious}
            onClick={() => onNavigate(position - 1)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <span className="text-xs font-medium text-text-secondary" aria-live="polite">
            Lesson {position + 1} of {total}
          </span>
          <button
            type="button"
            disabled={!hasNext}
            onClick={() => onNavigate(position + 1)}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </footer>
      </div>
    </div>
  );
}

function LessonContent({ lesson }: { lesson: Lesson }) {
  if (lesson.contentType === 'VIDEO') {
    return lesson.contentUrl ? (
      <video controls preload="metadata" className="w-full rounded-xl bg-black" src={lesson.contentUrl} aria-label={lesson.title}>
        Your browser does not support video playback. <a href={lesson.contentUrl}>Open the video directly</a>.
      </video>
    ) : (
      <EmptyLesson text="This video lesson has not been published yet." />
    );
  }

  if (lesson.contentType === 'PDF' && lesson.contentUrl) {
    return (
      <div className="space-y-4">
        {lesson.contentBody && <p className="whitespace-pre-wrap text-sm leading-7 text-text-secondary">{lesson.contentBody}</p>}
        <a
          href={lesson.contentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <ExternalLink className="h-4 w-4" aria-hidden="true" />
          Open document
        </a>
      </div>
    );
  }

  return lesson.contentBody ? (
    <div className="rounded-xl bg-surface-muted p-5">
      <p className="whitespace-pre-wrap text-sm leading-7 text-text-primary">{lesson.contentBody}</p>
    </div>
  ) : (
    <EmptyLesson text="This lesson has no published content yet." />
  );
}

function EmptyLesson({ text }: { text: string }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-secondary">{text}</p>;
}

function AnnouncementsSection({
  courseId,
  announcements,
  canPost,
}: {
  courseId: string;
  announcements: Announcement[];
  canPost: boolean;
}) {
  const [items, setItems] = React.useState<Announcement[]>(announcements);
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [content, setContent] = React.useState('');
  const [posting, setPosting] = React.useState(false);
  const [postError, setPostError] = React.useState('');
  const [posted, setPosted] = React.useState(false);

  React.useEffect(() => setItems(announcements), [announcements]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPostError('');
    setPosted(false);
    setPosting(true);
    try {
      const response = await fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/announcements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'error' in payload ? String((payload as { error: unknown }).error) : 'Unable to post announcement.';
        throw new Error(message);
      }
      const announcement = (payload as { announcement?: Announcement }).announcement;
      if (!announcement) throw new Error('Unable to post announcement.');
      setItems((current) => [announcement, ...current]);
      setTitle('');
      setContent('');
      setOpen(false);
      setPosted(true);
    } catch (cause: unknown) {
      setPostError(cause instanceof Error ? cause.message : 'Unable to post announcement.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5" aria-label="Course announcements">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold">
          <Megaphone className="h-4 w-4 text-primary" aria-hidden="true" />
          Announcements
          <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-text-secondary">{items.length}</span>
        </h2>
        {canPost && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-expanded={open}
          >
            Post announcement
          </button>
        )}
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {posted ? 'Announcement posted.' : ''}
      </p>

      {open && (
        <form onSubmit={submit} className="mt-4 space-y-3 rounded-xl bg-surface-muted p-4" aria-label="Post a course announcement">
          <div>
            <label htmlFor="announcement-title" className="block text-sm font-semibold text-text-primary">
              Title
            </label>
            <input
              id="announcement-title"
              type="text"
              value={title}
              maxLength={120}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="mt-1.5 min-h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Update for the class"
            />
          </div>
          <div>
            <label htmlFor="announcement-content" className="block text-sm font-semibold text-text-primary">
              Message
            </label>
            <textarea
              id="announcement-content"
              value={content}
              maxLength={2000}
              onChange={(event) => setContent(event.target.value)}
              required
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Share an update with your class"
            />
          </div>
          {postError && (
            <p role="alert" className="flex items-center gap-2 text-sm font-medium text-danger">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              {postError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-surface"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={posting}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {posting && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {posting ? 'Posting…' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <p className="mt-4 text-sm text-text-secondary">No announcements have been posted yet.</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {items.map((announcement) => (
            <li key={announcement.id} className="rounded-lg border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                {announcement.isPinned && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                    <Pin className="h-3 w-3" aria-hidden="true" />
                    Pinned
                  </span>
                )}
                <h3 className="font-medium">{announcement.title}</h3>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-text-secondary">{announcement.content}</p>
              <p className="mt-2 text-xs text-text-secondary">
                {announcement.author?.user.name ?? 'Administration'} · {formatRelative(announcement.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Assessments({ assignments, quizzes }: { assignments: Assignment[]; quizzes: Quiz[] }) {
  if (assignments.length === 0 && quizzes.length === 0) {
    return (
      <section className="rounded-xl border border-border bg-surface p-5" aria-label="Assessments">
        <h2 className="font-semibold">Assessments</h2>
        <p className="mt-3 text-sm text-text-secondary">No assessments have been published.</p>
      </section>
    );
  }
  return (
    <section className="rounded-xl border border-border bg-surface p-5" aria-label="Assessments">
      <h2 className="font-semibold">Assessments</h2>
      <div className="mt-4 space-y-3">
        {assignments.map((assignment) => (
          <div key={assignment.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-4">
            <div className="min-w-0">
              <p className="font-medium">{assignment.title}</p>
              <p className="mt-1 text-sm text-text-secondary">
                Due {formatDate(assignment.dueDate)} · {assignment.maxMarks} marks
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              <ClipboardList className="h-3.5 w-3.5" aria-hidden="true" />
              Assignment
            </span>
          </div>
        ))}
        {quizzes.map((quiz) => (
          <div key={quiz.id} className="flex flex-wrap items-start justify-between gap-2 rounded-lg border border-border p-4">
            <div className="min-w-0">
              <p className="font-medium">{quiz.title}</p>
              <p className="mt-1 text-sm text-text-secondary">
                {quiz.startTime ? `Opens ${formatDate(quiz.startTime)}` : 'Schedule to be announced'}
                {quiz.timeLimitMins ? ` · ${quiz.timeLimitMins} min` : ''}
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-semibold text-text-secondary">
              <HelpCircle className="h-3.5 w-3.5" aria-hidden="true" />
              Quiz
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}

function formatRelative(value: string) {
  const then = new Date(value).getTime();
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60_000));
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return formatDate(value);
}

function isCourseResponse(value: unknown): value is CourseResponse {
  return Boolean(
    value &&
      typeof value === 'object' &&
      Array.isArray((value as CourseResponse).modules) &&
      Array.isArray((value as CourseResponse).announcements),
  );
}
