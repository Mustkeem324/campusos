'use client';

import React from 'react';
import Link from 'next/link';
import { PageHeader } from '../../../../../../../../components/layout/PageHeader';

type RubricCriterion = { id: string; criterion: string; maxPoints: number };
type SubmissionRow = {
  id: string;
  submittedAt: string;
  marksObtained: number | null;
  rubricScores: Record<string, number> | null;
  fileUrl: string | null;
  student: { user: { name: string } };
  grades: { gradeLetter: string; feedback: string | null }[];
};
type AssignmentDetail = {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks: number;
  rubric: RubricCriterion[];
  submissions: SubmissionRow[];
  submissionCount: number;
};

async function readPayload<T>(response: Response): Promise<T> {
  const payload: unknown = await response.json().catch(() => ({}));
  return payload as T;
}

export default function GradingView({ params }: { params: Promise<{ courseId: string; assignmentId: string }> }) {
  // Client components receive `params` as a Promise in Next.js 15+; React 19's
  // `use()` unwraps it synchronously at render time.
  const { courseId, assignmentId } = React.use(params);

  const [data, setData] = React.useState<AssignmentDetail | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [marks, setMarks] = React.useState<string>('');
  const [rubricValues, setRubricValues] = React.useState<Record<string, string>>({});
  const [feedback, setFeedback] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [savedMessage, setSavedMessage] = React.useState('');

  React.useEffect(() => {
    fetch(`/api/learning/courses/${encodeURIComponent(courseId)}/assignments`)
      .then(async (response) => {
        const payload = await readPayload<{ assignments?: AssignmentDetail[] }>(response);
        if (!response.ok || !payload.assignments) throw new Error(payload && 'error' in payload ? String((payload as { error: string }).error) : 'Unable to load assignments.');
        const found = payload.assignments.find((assignment) => assignment.id === assignmentId);
        if (!found) throw new Error('This assignment is not available.');
        return found;
      })
      .then(setData)
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : 'Unable to load this assignment.'));
  }, [courseId, assignmentId]);

  const selected = data?.submissions.find((submission) => submission.id === selectedId) ?? null;

  function selectSubmission(submission: SubmissionRow) {
    setSelectedId(submission.id);
    setMarks(submission.marksObtained !== null ? String(submission.marksObtained) : '');
    setFeedback(submission.grades[0]?.feedback ?? '');
    const next: Record<string, string> = {};
    for (const criterion of data?.rubric ?? []) {
      next[criterion.criterion] = submission.rubricScores?.[criterion.criterion] !== undefined ? String(submission.rubricScores[criterion.criterion]) : '';
    }
    setRubricValues(next);
    setSavedMessage('');
  }

  async function saveGrade() {
    if (!selected || !data) return;
    setSaving(true);
    setSavedMessage('');
    const rubricScores: Record<string, number> = {};
    let rubricTotal = 0;
    for (const criterion of data.rubric) {
      const raw = rubricValues[criterion.criterion];
      const value = raw === '' ? 0 : Number(raw);
      rubricScores[criterion.criterion] = Number.isFinite(value) ? value : 0;
      rubricTotal += Number.isFinite(value) ? value : 0;
    }
    const finalMarks = marks === '' ? rubricTotal : Number(marks);

    try {
      const response = await fetch(
        `/api/learning/courses/${encodeURIComponent(courseId)}/assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(selected.id)}/grade`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ marksObtained: finalMarks, rubricScores, feedback }),
        },
      );
      const payload = await readPayload<{ error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? 'Unable to save the grade.');
      setSavedMessage('Grade saved.');
    } catch (cause: unknown) {
      setSavedMessage(cause instanceof Error ? cause.message : 'Unable to save the grade.');
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignment Grading" description="Faculty workspace" />
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-4 text-sm text-danger">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Assignment Grading" description="Faculty workspace" />
        <div className="h-64 animate-pulse rounded-xl bg-surface-muted" aria-label="Loading assignment" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={data.title} description={`${data.description} · Due ${formatDate(data.dueDate)} · ${data.maxMarks} marks`} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section className="rounded-xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Rubric</h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
              {data.submissionCount} submissions
            </span>
          </div>

          <div className="mt-4 space-y-2">
            {data.rubric.length === 0 ? (
              <p className="text-sm text-text-secondary">No rubric criteria have been defined for this assignment.</p>
            ) : (
              data.rubric.map((criterion) => (
                <div key={criterion.id} className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2 text-sm">
                  <span>{criterion.criterion}</span>
                  <span className="font-semibold text-primary">{criterion.maxPoints} pts</span>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 border-t border-border pt-4">
            <h3 className="text-sm font-semibold">Students</h3>
            <ul className="mt-3 space-y-2">
              {data.submissions.length === 0 ? (
                <li className="rounded-lg border border-dashed border-border p-4 text-sm text-text-secondary">No submissions yet.</li>
              ) : (
                data.submissions.map((submission) => (
                  <li key={submission.id}>
                    <button
                      type="button"
                      onClick={() => selectSubmission(submission)}
                      aria-pressed={selectedId === submission.id}
                      className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                        selectedId === submission.id ? 'border-primary bg-primary-soft' : 'border-border hover:bg-surface-muted'
                      }`}
                    >
                      <span className="font-medium">{submission.student.user.name}</span>
                      <span className="shrink-0 text-xs text-text-secondary">
                        {submission.marksObtained !== null ? `${submission.marksObtained}/${data.maxMarks}` : 'Not graded'}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </section>

        <aside className="h-fit rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold">Grading</h2>
          {!selected ? (
            <p className="mt-4 text-sm text-text-secondary">Select a student to grade their submission.</p>
          ) : (
            <div className="mt-4 space-y-5">
              <div>
                <label htmlFor="rubric-scores" className="block text-sm font-semibold text-text-primary">Rubric scores</label>
                <div id="rubric-scores" className="mt-2 space-y-2">
                  {data.rubric.map((criterion) => (
                    <div key={criterion.id} className="flex items-center justify-between gap-3">
                      <label htmlFor={`rubric-${criterion.id}`} className="text-xs text-text-secondary">{criterion.criterion} (max {criterion.maxPoints})</label>
                      <input
                        id={`rubric-${criterion.id}`}
                        type="number"
                        min={0}
                        max={criterion.maxPoints}
                        step={0.5}
                        value={rubricValues[criterion.criterion] ?? ''}
                        onChange={(event) => setRubricValues((prev) => ({ ...prev, [criterion.criterion]: event.target.value }))}
                        className="w-24 rounded-lg border border-border bg-white px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="marks" className="block text-sm font-semibold text-text-primary">Total marks (0–{data.maxMarks})</label>
                <input
                  id="marks"
                  type="number"
                  min={0}
                  max={data.maxMarks}
                  step={0.5}
                  value={marks}
                  onChange={(event) => setMarks(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label htmlFor="feedback" className="block text-sm font-semibold text-text-primary">Feedback</label>
                <textarea
                  id="feedback"
                  rows={4}
                  value={feedback}
                  onChange={(event) => setFeedback(event.target.value)}
                  placeholder="Write feedback for the student…"
                  className="mt-2 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <button
                type="button"
                onClick={saveGrade}
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                {saving ? 'Saving…' : 'Save grade'}
              </button>
              {savedMessage && <p className="text-sm font-medium text-primary">{savedMessage}</p>}
            </div>
          )}

          <Link
            href={`/learning/courses/${encodeURIComponent(courseId)}`}
            className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            Back to course
          </Link>
        </aside>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));
}
