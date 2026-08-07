/* eslint-disable @next/next/no-img-element */
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
  Film,
  GraduationCap,
  Loader2,
  Paperclip,
  Presentation,
  RefreshCw,
  Send,
  ShieldCheck,
  UploadCloud,
  UserRound,
  X,
} from 'lucide-react';

import type { loadAssignmentDetail } from '@/lib/assignment-data';
import type { AssignmentFileMeta } from '@/lib/assignment-workspace';

type Detail = Awaited<ReturnType<typeof loadAssignmentDetail>>;

const ACCEPT = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,text/plain,text/csv';

export function AssignmentWorkspace({ detail }: { detail: Detail }) {
  const assignment = detail.assignment;
  const submission = detail.ownSubmission;
  const router = useRouter();
  const [preview, setPreview] = React.useState<AssignmentFileMeta | null>(assignment.workspace.resources.find((item) => item.kind === 'PDF') ?? null);
  const [textResponse, setTextResponse] = React.useState(submission?.meta.textResponse ?? '');
  const [files, setFiles] = React.useState<File[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const due = new Date(assignment.dueDate);
  const now = Date.now();
  const isPastDue = now > due.getTime();
  const graded = submission?.marksObtained !== null && submission?.marksObtained !== undefined;
  const canSubmit = detail.viewer.isStudent && !graded && (!isPastDue || assignment.workspace.lateSubmissionAllowed) && (!submission || assignment.workspace.allowResubmission);
  const currentStatus = graded ? 'GRADED' : submission ? (new Date(submission.submittedAt).getTime() > due.getTime() ? 'LATE' : 'SUBMITTED') : isPastDue ? 'OVERDUE' : due.getTime() - now <= 48 * 60 * 60 * 1000 ? 'DUE_SOON' : 'UPCOMING';

  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files];
    for (const file of Array.from(incoming)) {
      if (next.length >= assignment.workspace.maxSubmissionFiles) break;
      next.push(file);
    }
    setFiles(next);
  };

  const submit = async () => {
    if (!canSubmit || submitting) return;
    if (!textResponse.trim() && files.length === 0) { setError('Add a written response or at least one file before submitting.'); return; }
    setSubmitting(true); setError(null); setSuccess(null);
    try {
      const form = new FormData();
      form.set('textResponse', textResponse.trim());
      files.forEach((file) => form.append('files', file));
      const response = await fetch(`/api/assignments/${assignment.id}/submit`, { method: 'POST', body: form });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readError(payload, 'Your assignment could not be submitted.'));
      const result = payload as { isLate?: boolean; attemptNumber?: number };
      setFiles([]);
      setSuccess(result.isLate ? 'Late submission received and recorded.' : `Assignment submitted successfully${result.attemptNumber && result.attemptNumber > 1 ? ` · attempt ${result.attemptNumber}` : ''}.`);
      router.refresh();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Your assignment could not be submitted.'); }
    finally { setSubmitting(false); }
  };

  return <div className="space-y-5">
    <Link href="/assignments" className="inline-flex items-center gap-1.5 text-xs font-black text-[#53627A] hover:text-[#1754E8]"><ArrowLeft className="h-3.5 w-3.5" />Back to assignments</Link>

    <section className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_14px_36px_rgba(15,30,55,0.07)]">
      <div className="border-b border-[#E8EDF3] bg-[#0B1739] p-5 text-white sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#C6D5F1]">{assignment.course.code}</span><StatusPill status={currentStatus} /></div><h1 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">{assignment.title}</h1><p className="mt-2 text-sm leading-6 text-[#BAC8E4]">{assignment.description}</p></div>
          <div className="grid min-w-[280px] grid-cols-2 gap-2"><HeroFact icon={CalendarClock} label="Deadline" value={formatDateTime(assignment.dueDate)} /><HeroFact icon={Clock3} label="Time remaining" value={deadlineLabel(assignment.dueDate)} /><HeroFact icon={GraduationCap} label="Marks" value={String(assignment.maxMarks)} /><HeroFact icon={UserRound} label="Faculty" value={assignment.facultyName} /></div>
        </div>
      </div>
      <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5"><InfoStrip label="Course" value={`${assignment.course.code} · ${assignment.course.title}`} /><InfoStrip label="Class" value={`${assignment.sectionName} · ${assignment.termName}`} /><InfoStrip label="Resources" value={`${assignment.workspace.resources.length} attached file${assignment.workspace.resources.length === 1 ? '' : 's'}`} /></div>
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-5">
        <Panel title="Assignment instructions" icon={BookOpen}>
          <div className="prose prose-sm max-w-none text-[#53627A]"><p className="whitespace-pre-wrap leading-7">{assignment.workspace.instructions || assignment.description}</p></div>
          {assignment.workspace.submissionInstructions && <div className="mt-4 rounded-xl border border-[#D8E3F5] bg-[#F6F9FF] p-3"><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#1754E8]">Submission instructions</p><p className="mt-1 whitespace-pre-wrap text-xs leading-5 text-[#53627A]">{assignment.workspace.submissionInstructions}</p></div>}
        </Panel>

        <Panel title="Faculty resource pack" icon={Paperclip} actions={<span className="text-[10px] font-bold text-[#7A8698]">PDF · DOC/DOCX · PPT/PPTX · XLS/XLSX · images · short video</span>}>
          {assignment.workspace.resources.length ? <div className="grid gap-2 md:grid-cols-2">{assignment.workspace.resources.map((resource) => <ResourceCard key={resource.fileId} resource={resource} active={preview?.fileId === resource.fileId} onPreview={() => setPreview(resource)} />)}</div> : <EmptyFiles label="No reference files were attached to this assignment." />}
          {preview && canInlinePreview(preview) && <div className="mt-4 overflow-hidden rounded-2xl border border-[#CFD9E6] bg-[#F7F9FC]"><div className="flex items-center justify-between gap-3 border-b border-[#DCE3EC] bg-white px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-black text-[#344054]">Preview · {preview.fileName}</p><p className="text-[9px] text-[#98A2B3]">Protected viewer · {formatBytes(preview.fileSizeBytes)}</p></div><div className="flex gap-1"><a href={fileUrl(preview.fileId, true)} className="flex h-8 items-center gap-1 rounded-lg border border-[#D7E0EB] px-2.5 text-[9px] font-black text-[#53627A]"><Download className="h-3 w-3" />Download</a><button type="button" onClick={() => setPreview(null)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D7E0EB]" aria-label="Close preview"><X className="h-3.5 w-3.5" /></button></div></div><Preview resource={preview} /></div>}
        </Panel>

        {assignment.rubrics.length > 0 && <Panel title="Assessment rubric" icon={CheckCircle2}><div className="overflow-hidden rounded-xl border border-[#E1E7EF]"><table className="w-full text-left text-xs"><thead className="bg-[#F7F9FC] text-[10px] uppercase tracking-[0.06em] text-[#7A8698]"><tr><th className="px-3 py-2.5">Criterion</th><th className="px-3 py-2.5 text-right">Max points</th></tr></thead><tbody>{assignment.rubrics.map((rubric) => <tr key={rubric.id} className="border-t border-[#EEF1F5]"><td className="px-3 py-3 font-semibold text-[#344054]">{rubric.criterion}</td><td className="px-3 py-3 text-right font-black text-[#17223B]">{rubric.maxPoints}</td></tr>)}</tbody></table></div></Panel>}

        {detail.viewer.canManage && <FacultySubmissions assignmentId={assignment.id} submissions={detail.submissions} dueDate={assignment.dueDate} />}
      </main>

      <aside className="space-y-4">
        <DeadlinePolicy assignment={assignment} currentStatus={currentStatus} />
        {detail.viewer.isStudent && <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_8px_24px_rgba(15,30,55,0.05)]"><div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#7A8698]">Your work</p><h2 className="mt-1 text-base font-black text-[#17223B]">{submission ? assignment.workspace.allowResubmission && !graded ? 'Update submission' : 'Submission' : 'Submit assignment'}</h2></div>{submission && <span className="rounded-full bg-[#EAF0FF] px-2.5 py-1 text-[9px] font-black text-[#1754E8]">Attempt {submission.meta.attemptNumber}</span>}</div>
          {submission && <ExistingSubmission submission={submission} maxMarks={assignment.maxMarks} />}
          {canSubmit ? <div className="mt-4 space-y-3">{assignment.workspace.allowTextResponse && <label className="block text-xs font-black text-[#344054]">Written response<textarea value={textResponse} onChange={(event) => setTextResponse(event.target.value)} rows={6} maxLength={12000} placeholder="Add notes, an answer, explanation or submission message…" className="mt-1.5 w-full resize-y rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal leading-6 outline-none focus:border-[#1754E8] focus:ring-2 focus:ring-[#1754E8]/10" /></label>}
            <label className="block cursor-pointer rounded-2xl border border-dashed border-[#B9C8DA] bg-[#F9FBFD] p-5 text-center hover:border-[#7FA1D4] hover:bg-[#F5F8FD]"><UploadCloud className="mx-auto h-7 w-7 text-[#1754E8]" /><p className="mt-2 text-xs font-black text-[#344054]">Attach your work</p><p className="mt-1 text-[10px] leading-4 text-[#7A8698]">PDF, Word, PowerPoint, spreadsheet, image or short video. Up to {assignment.workspace.maxSubmissionFiles} files.</p><input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(event) => { if (event.target.files) addFiles(event.target.files); event.target.value = ''; }} /></label>
            {files.length > 0 && <div className="space-y-1.5">{files.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-lg border border-[#E0E6EE] px-2.5 py-2"><FileType2 className="h-4 w-4 shrink-0 text-[#667085]" /><span className="min-w-0 flex-1 truncate text-[10px] font-bold text-[#53627A]">{file.name}</span><span className="text-[9px] text-[#98A2B3]">{formatBytes(file.size)}</span><button type="button" onClick={() => setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}><X className="h-3.5 w-3.5 text-[#667085]" /></button></div>)}</div>}
            {isPastDue && assignment.workspace.lateSubmissionAllowed && <div className="flex gap-2 rounded-xl border border-[#F1D5A1] bg-[#FFF9EB] p-3 text-[10px] leading-4 text-[#78520B]"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>This will be recorded as a <strong>late submission</strong>{assignment.workspace.latePenaltyPercent > 0 ? ` and the configured late penalty is ${assignment.workspace.latePenaltyPercent}%.` : '.'}</span></div>}
            {error && <div role="alert" className="rounded-xl border border-[#F1CBC7] bg-[#FFF7F6] p-3 text-xs font-semibold text-[#9F2D24]">{error}</div>}{success && <div className="rounded-xl border border-[#BFE3D4] bg-[#F2FBF7] p-3 text-xs font-semibold text-[#087A55]">{success}</div>}
            <button type="button" onClick={() => void submit()} disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-black text-white shadow-sm hover:bg-[#1046C4] disabled:opacity-50">{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : submission ? <RefreshCw className="h-4 w-4" /> : <Send className="h-4 w-4" />}{submission ? 'Submit updated attempt' : 'Submit assignment'}</button>
            <p className="flex items-start gap-1.5 text-[9px] leading-4 text-[#8792A5]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087A55]" />CampusOS validates the deadline, enrolment and file signatures again on the server before accepting your work.</p>
          </div> : <SubmissionClosed graded={graded} submission={submission} pastDue={isPastDue} lateAllowed={assignment.workspace.lateSubmissionAllowed} resubmissionAllowed={assignment.workspace.allowResubmission} />}
        </section>}
      </aside>
    </div>
  </div>;
}

function Panel({ title, icon: Icon, actions, children }: { title: string; icon: React.ComponentType<{ className?: string }>; actions?: React.ReactNode; children: React.ReactNode }) { return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_8px_24px_rgba(15,30,55,0.04)] sm:p-5"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="flex items-center gap-2 text-sm font-black text-[#17223B]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#1754E8]"><Icon className="h-4 w-4" /></span>{title}</h2>{actions}</div>{children}</section>; }
function HeroFact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) { return <div className="rounded-xl border border-white/12 bg-white/5 p-3"><Icon className="h-4 w-4 text-[#9EB4DF]" /><p className="mt-2 text-[9px] font-black uppercase tracking-[0.06em] text-[#8FA5D0]">{label}</p><p className="mt-0.5 line-clamp-2 text-[11px] font-black text-white">{value}</p></div>; }
function InfoStrip({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#F7F9FC] p-3"><p className="text-[9px] font-black uppercase tracking-[0.07em] text-[#98A2B3]">{label}</p><p className="mt-1 text-xs font-black text-[#344054]">{value}</p></div>; }
function StatusPill({ status }: { status: string }) { const styles: Record<string, string> = { GRADED: 'bg-[#DFF4EA] text-[#087A55]', SUBMITTED: 'bg-[#DDE8FF] text-[#174DB7]', LATE: 'bg-[#FFE7E2] text-[#A63D31]', OVERDUE: 'bg-[#FFE7E2] text-[#A63D31]', DUE_SOON: 'bg-[#FFF1C9] text-[#885B00]', UPCOMING: 'bg-white/10 text-[#D8E3FA]' }; return <span className={`rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.05em] ${styles[status] ?? styles.UPCOMING}`}>{status.replaceAll('_', ' ')}</span>; }
function ResourceCard({ resource, active, onPreview }: { resource: AssignmentFileMeta; active: boolean; onPreview: () => void }) { const Icon = resource.kind === 'PDF' ? FileText : resource.kind === 'IMAGE' ? FileImage : resource.kind === 'VIDEO' ? Film : resource.kind === 'PRESENTATION' ? Presentation : resource.kind === 'SPREADSHEET' ? FileSpreadsheet : FileType2; const previewable = canInlinePreview(resource); return <div className={`rounded-xl border p-3 ${active ? 'border-[#8EAADE] bg-[#F6F9FF]' : 'border-[#E0E6EE] bg-white'}`}><div className="flex items-start gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FA] text-[#1754E8]"><Icon className="h-5 w-5" /></span><div className="min-w-0 flex-1"><p className="truncate text-xs font-black text-[#344054]">{resource.fileName}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.04em] text-[#98A2B3]">{resource.kind} · {formatBytes(resource.fileSizeBytes)}</p><div className="mt-2 flex gap-1.5">{previewable && <button type="button" onClick={onPreview} className="inline-flex h-7 items-center gap-1 rounded-md bg-[#EAF0FF] px-2 text-[9px] font-black text-[#1754E8]"><Eye className="h-3 w-3" />Preview</button>}<a href={fileUrl(resource.fileId, true)} className="inline-flex h-7 items-center gap-1 rounded-md border border-[#D7E0EB] px-2 text-[9px] font-black text-[#53627A]"><Download className="h-3 w-3" />Download</a></div></div></div></div>; }
function Preview({ resource }: { resource: AssignmentFileMeta }) { if (resource.kind === 'PDF') return <iframe title={`PDF preview ${resource.fileName}`} src={fileUrl(resource.fileId)} className="h-[580px] w-full bg-white" />; if (resource.kind === 'IMAGE') return <div className="flex min-h-[320px] items-center justify-center p-3"><img src={fileUrl(resource.fileId)} alt={resource.fileName} className="max-h-[580px] max-w-full rounded-lg object-contain" /></div>; if (resource.kind === 'VIDEO') return <div className="bg-black p-2"><video controls preload="metadata" src={fileUrl(resource.fileId)} className="mx-auto max-h-[580px] w-full" /></div>; return null; }
function EmptyFiles({ label }: { label: string }) { return <div className="rounded-xl border border-dashed border-[#D5DEE9] p-7 text-center"><Paperclip className="mx-auto h-7 w-7 text-[#9AA6B6]" /><p className="mt-2 text-xs text-[#7A8698]">{label}</p></div>; }

function DeadlinePolicy({ assignment, currentStatus }: { assignment: Detail['assignment']; currentStatus: string }) { return <section className="rounded-2xl border border-[#DCE3EC] bg-white p-4 shadow-[0_8px_24px_rgba(15,30,55,0.04)]"><div className="flex items-center gap-2"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF5DD] text-[#9A6500]"><CalendarClock className="h-4 w-4" /></span><div><p className="text-[10px] font-black uppercase tracking-[0.07em] text-[#7A8698]">Deadline policy</p><p className="mt-0.5 text-sm font-black text-[#17223B]">{deadlineLabel(assignment.dueDate)}</p></div></div><div className="mt-4 space-y-2 text-[10px] text-[#667085]"><PolicyRow label="Due" value={formatDateTime(assignment.dueDate)} /><PolicyRow label="Late submission" value={assignment.workspace.lateSubmissionAllowed ? 'Allowed' : 'Not accepted'} /><PolicyRow label="Late penalty" value={assignment.workspace.lateSubmissionAllowed ? `${assignment.workspace.latePenaltyPercent}% configured` : '—'} /><PolicyRow label="Resubmission" value={assignment.workspace.allowResubmission ? 'Allowed until grading / policy closes' : 'One attempt'} /><PolicyRow label="Max files" value={String(assignment.workspace.maxSubmissionFiles)} /></div>{['OVERDUE', 'LATE'].includes(currentStatus) && <p className="mt-3 flex gap-1.5 rounded-lg bg-[#FFF5F2] p-2.5 text-[9px] leading-4 text-[#9F2D24]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />Late or missed work is visibly recorded and may affect academic performance according to the configured policy.</p>}</section>; }
function PolicyRow({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-3 border-b border-[#EEF1F5] pb-2 last:border-0 last:pb-0"><span>{label}</span><span className="text-right font-black text-[#344054]">{value}</span></div>; }
function ExistingSubmission({ submission, maxMarks }: { submission: NonNullable<Detail['ownSubmission']>; maxMarks: number }) { const graded = submission.marksObtained !== null; return <div className="mt-4 rounded-xl border border-[#DDE5EF] bg-[#F8FAFD] p-3"><div className="flex items-center justify-between gap-2"><span className="inline-flex items-center gap-1 text-[10px] font-black text-[#087A55]"><CheckCircle2 className="h-3.5 w-3.5" />Received {formatDateTime(submission.submittedAt)}</span>{submission.meta.isLate && <span className="rounded-full bg-[#FFF0ED] px-2 py-0.5 text-[8px] font-black uppercase text-[#A63D31]">Late</span>}</div>{graded && <div className="mt-3 rounded-lg bg-white p-3"><p className="text-[9px] font-black uppercase text-[#7A8698]">Grade</p><p className="mt-1 text-xl font-black text-[#17223B]">{submission.marksObtained}/{maxMarks}{submission.gradeLetter ? <span className="ml-2 text-sm text-[#087A55]">{submission.gradeLetter}</span> : null}</p>{submission.feedback && <p className="mt-2 text-xs leading-5 text-[#667085]">{submission.feedback}</p>}</div>}{submission.meta.files.length > 0 && <div className="mt-3 space-y-1">{submission.meta.files.map((file) => <a key={file.fileId} href={fileUrl(file.fileId, true)} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2 text-[9px] font-bold text-[#53627A]"><Paperclip className="h-3.5 w-3.5" /><span className="min-w-0 flex-1 truncate">{file.fileName}</span><Download className="h-3 w-3" /></a>)}</div>}</div>; }
function SubmissionClosed({ graded, submission, pastDue, lateAllowed, resubmissionAllowed }: { graded: boolean; submission: Detail['ownSubmission']; pastDue: boolean; lateAllowed: boolean; resubmissionAllowed: boolean }) { let title = 'Submission unavailable'; let body = 'This assignment cannot accept another attempt right now.'; if (graded) { title = 'Graded and locked'; body = 'Your faculty has graded this work, so the submission is now locked.'; } else if (pastDue && !lateAllowed) { title = 'Deadline closed'; body = 'The deadline has passed and late submissions are not accepted.'; } else if (submission && !resubmissionAllowed) { title = 'Attempt already submitted'; body = 'This assignment is configured for one submission attempt only.'; } return <div className="mt-4 rounded-xl border border-[#E0E6EE] bg-[#F8FAFD] p-4 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-[#7B8BA3]" /><p className="mt-2 text-xs font-black text-[#344054]">{title}</p><p className="mt-1 text-[10px] leading-4 text-[#7A8698]">{body}</p></div>; }

function FacultySubmissions({ submissions, dueDate }: { assignmentId: string; submissions: Detail['submissions']; dueDate: string }) { return <Panel title={`Student submissions · ${submissions.length}`} icon={GraduationCap}>{submissions.length ? <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="bg-[#F7F9FC] text-[9px] uppercase tracking-[0.06em] text-[#7A8698]"><tr><th className="px-3 py-2.5">Student</th><th className="px-3 py-2.5">Submitted</th><th className="px-3 py-2.5">Attempt</th><th className="px-3 py-2.5">Files</th><th className="px-3 py-2.5">Marks</th></tr></thead><tbody>{submissions.map((submission) => <tr key={submission.id} className="border-t border-[#EEF1F5] align-top"><td className="px-3 py-3"><p className="font-black text-[#344054]">{submission.studentName}</p><p className="mt-0.5 text-[9px] text-[#98A2B3]">{submission.rollNumber}</p>{submission.textResponse && <details className="mt-2"><summary className="cursor-pointer text-[9px] font-black text-[#1754E8]">Written response</summary><p className="mt-1 max-w-md whitespace-pre-wrap rounded-lg bg-[#F7F9FC] p-2 text-[10px] leading-4 text-[#667085]">{submission.textResponse}</p></details>}</td><td className="px-3 py-3"><p className="font-semibold text-[#53627A]">{formatDateTime(submission.submittedAt)}</p><span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase ${new Date(submission.submittedAt).getTime() > new Date(dueDate).getTime() ? 'bg-[#FFF0ED] text-[#A63D31]' : 'bg-[#E7F6F0] text-[#087A55]'}`}>{new Date(submission.submittedAt).getTime() > new Date(dueDate).getTime() ? 'Late' : 'On time'}</span></td><td className="px-3 py-3 font-black text-[#344054]">#{submission.attemptNumber}</td><td className="px-3 py-3"><div className="space-y-1">{submission.files.length ? submission.files.map((file) => <a key={file.fileId} href={fileUrl(file.fileId, true)} className="flex max-w-[190px] items-center gap-1.5 rounded-md border border-[#E0E6EE] px-2 py-1.5 text-[9px] font-bold text-[#53627A]"><Paperclip className="h-3 w-3" /><span className="truncate">{file.fileName}</span></a>) : <span className="text-[9px] text-[#98A2B3]">Text only</span>}</div></td><td className="px-3 py-3 font-black text-[#344054]">{submission.marksObtained ?? 'Not graded'}</td></tr>)}</tbody></table></div> : <EmptyFiles label="No students have submitted this assignment yet." />}</Panel>; }

function canInlinePreview(file: AssignmentFileMeta) { return file.kind === 'PDF' || file.kind === 'IMAGE' || file.kind === 'VIDEO'; }
function fileUrl(fileId: string, download = false) { return `/api/assignments/files/${fileId}${download ? '?download=1' : ''}`; }
function formatDateTime(value: string) { return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
function deadlineLabel(value: string) { const ms = new Date(value).getTime() - Date.now(); if (ms <= 0) return `Deadline passed ${duration(-ms)} ago`; return `${duration(ms)} remaining`; }
function duration(ms: number) { const minutes = Math.max(1, Math.round(ms / 60000)); if (minutes < 60) return `${minutes} min`; const hours = Math.round(minutes / 60); if (hours < 48) return `${hours} hr`; return `${Math.round(hours / 24)} days`; }
function formatBytes(bytes: number) { if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`; return `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function readError(value: unknown, fallback: string) { return value && typeof value === 'object' && 'error' in value && typeof (value as { error?: unknown }).error === 'string' ? (value as { error: string }).error : fallback; }
