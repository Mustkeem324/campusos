'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Check,
  FileText,
  GraduationCap,
  Loader2,
  Paperclip,
  Plus,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  UploadCloud,
  X,
} from 'lucide-react';

import type { loadAssignmentCreationCourses } from '@/lib/assignment-data';

type CourseOption = Awaited<ReturnType<typeof loadAssignmentCreationCourses>>[number];
const ACCEPT = 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,text/plain,text/csv';

export function AssignmentCreateForm({ courses }: { courses: CourseOption[] }) {
  const router = useRouter();
  const [courseOfferingId, setCourseOfferingId] = React.useState(courses[0]?.id ?? '');
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [instructions, setInstructions] = React.useState('');
  const [submissionInstructions, setSubmissionInstructions] = React.useState('Submit the required files before the deadline. Open each file once after attaching it to confirm you selected the correct version.');
  const [dueDate, setDueDate] = React.useState(() => defaultDeadline());
  const [maxMarks, setMaxMarks] = React.useState('100');
  const [lateSubmissionAllowed, setLateSubmissionAllowed] = React.useState(true);
  const [latePenaltyPercent, setLatePenaltyPercent] = React.useState('10');
  const [allowTextResponse, setAllowTextResponse] = React.useState(true);
  const [allowResubmission, setAllowResubmission] = React.useState(true);
  const [maxSubmissionFiles, setMaxSubmissionFiles] = React.useState('6');
  const [resources, setResources] = React.useState<File[]>([]);
  const [publishing, setPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const selectedCourse = courses.find((course) => course.id === courseOfferingId) ?? null;

  const addResources = (incoming: FileList | File[]) => {
    const next = [...resources];
    for (const file of Array.from(incoming)) {
      if (next.length >= 8) break;
      next.push(file);
    }
    setResources(next);
  };

  const publish = async () => {
    if (publishing) return;
    if (!courseOfferingId || title.trim().length < 3 || description.trim().length < 3) { setError('Choose a course and complete the title and assignment brief.'); return; }
    const parsedDeadline = new Date(dueDate);
    if (Number.isNaN(parsedDeadline.getTime())) { setError('Choose a valid assignment deadline.'); return; }
    setPublishing(true); setError(null);
    try {
      const form = new FormData();
      form.set('courseOfferingId', courseOfferingId);
      form.set('title', title.trim());
      form.set('description', description.trim());
      form.set('instructions', instructions.trim());
      form.set('submissionInstructions', submissionInstructions.trim());
      form.set('dueDate', parsedDeadline.toISOString());
      form.set('maxMarks', maxMarks);
      form.set('lateSubmissionAllowed', String(lateSubmissionAllowed));
      form.set('latePenaltyPercent', latePenaltyPercent);
      form.set('allowTextResponse', String(allowTextResponse));
      form.set('allowResubmission', String(allowResubmission));
      form.set('maxSubmissionFiles', maxSubmissionFiles);
      resources.forEach((file) => form.append('resources', file));

      const response = await fetch('/api/assignments', { method: 'POST', body: form });
      const payload: unknown = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(readError(payload, 'Assignment could not be published.'));
      const result = payload as { assignmentId?: string };
      if (!result.assignmentId) throw new Error('Assignment was created but its ID was not returned.');
      router.push(`/assignments/${result.assignmentId}`);
      router.refresh();
    } catch (cause: unknown) { setError(cause instanceof Error ? cause.message : 'Assignment could not be published.'); }
    finally { setPublishing(false); }
  };

  if (!courses.length) return <div className="rounded-2xl border border-dashed border-[#CCD7E5] bg-white p-10 text-center"><GraduationCap className="mx-auto h-10 w-10 text-[#8C99AB]" /><h1 className="mt-3 text-lg font-black text-[#344054]">No authorised teaching courses</h1><p className="mt-1 text-sm text-[#7A8698]">Assignments can only be created for a course offering you are authorised to manage.</p><Link href="/assignments" className="mt-5 inline-flex rounded-lg bg-[#1754E8] px-4 py-2.5 text-xs font-black text-white">Back to assignments</Link></div>;

  return <div className="space-y-5">
    <Link href="/assignments" className="inline-flex items-center gap-1.5 text-xs font-black text-[#53627A] hover:text-[#1754E8]"><ArrowLeft className="h-3.5 w-3.5" />Back to assignments</Link>
    <section className="rounded-2xl border border-[#DCE3EC] bg-[#0B1739] p-5 text-white shadow-[0_16px_42px_rgba(15,30,55,0.14)] sm:p-7"><p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#9EB4DF]">Faculty authoring studio</p><h1 className="mt-2 text-2xl font-black tracking-[-0.035em] sm:text-3xl">Create Assignment</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#BDCAE5]">Publish the brief, detailed instructions, resource files, deadline and submission policy as one structured assignment package.</p></section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <main className="space-y-5">
        <FormPanel title="Course & assignment brief" icon={BookOpen}>
          <label className="block text-xs font-black text-[#344054]">Course offering<select value={courseOfferingId} onChange={(event) => setCourseOfferingId(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#CCD7E5] bg-white px-3 text-sm font-semibold outline-none focus:border-[#1754E8]">{courses.map((course) => <option key={course.id} value={course.id}>{course.course.code} · {course.course.title} · {course.section.name} · {course.term.name} ({course._count.enrollments} students)</option>)}</select></label>
          {selectedCourse && <div className="mt-3 grid gap-2 sm:grid-cols-3"><MiniFact label="Course" value={selectedCourse.course.code} /><MiniFact label="Section" value={selectedCourse.section.name} /><MiniFact label="Enrolled" value={`${selectedCourse._count.enrollments} students`} /></div>}
          <label className="mt-4 block text-xs font-black text-[#344054]">Assignment title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} placeholder="e.g. Operations Strategy Case Analysis" className="mt-1.5 h-11 w-full rounded-xl border border-[#CCD7E5] px-3 text-sm font-normal outline-none focus:border-[#1754E8]" /></label>
          <label className="mt-4 block text-xs font-black text-[#344054]">Short brief<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={3000} rows={3} placeholder="A short summary students will see on the assignment card." className="mt-1.5 w-full rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal leading-6 outline-none focus:border-[#1754E8]" /></label>
        </FormPanel>

        <FormPanel title="Detailed instructions" icon={FileText}>
          <label className="block text-xs font-black text-[#344054]">What students need to do<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={12000} rows={9} placeholder={'Describe the task, expected structure, research requirements, video/PPT/document requirements, naming convention, etc.'} className="mt-1.5 w-full rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal leading-6 outline-none focus:border-[#1754E8]" /></label>
          <label className="mt-4 block text-xs font-black text-[#344054]">Submission instructions<textarea value={submissionInstructions} onChange={(event) => setSubmissionInstructions(event.target.value)} maxLength={4000} rows={4} className="mt-1.5 w-full rounded-xl border border-[#CCD7E5] p-3 text-sm font-normal leading-6 outline-none focus:border-[#1754E8]" /></label>
        </FormPanel>

        <FormPanel title="Resource pack" icon={Paperclip}>
          <label className="block cursor-pointer rounded-2xl border border-dashed border-[#B9C8DA] bg-[#F9FBFD] p-7 text-center hover:border-[#7FA1D4] hover:bg-[#F5F8FD]"><UploadCloud className="mx-auto h-8 w-8 text-[#1754E8]" /><p className="mt-2 text-sm font-black text-[#344054]">Attach faculty resources</p><p className="mx-auto mt-1 max-w-lg text-[10px] leading-4 text-[#7A8698]">Students can securely preview PDFs and open images/videos inside the assignment. Word, PowerPoint and spreadsheet files remain protected downloads. Up to 8 files.</p><input type="file" multiple accept={ACCEPT} className="sr-only" onChange={(event) => { if (event.target.files) addResources(event.target.files); event.target.value = ''; }} /></label>
          {resources.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{resources.map((file, index) => <div key={`${file.name}-${index}`} className="flex items-center gap-2 rounded-xl border border-[#E0E6EE] p-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF3FA] text-[#1754E8]"><FileText className="h-4 w-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-[#344054]">{file.name}</p><p className="mt-0.5 text-[9px] text-[#98A2B3]">{formatBytes(file.size)} · {file.type || 'file'}</p></div><button type="button" onClick={() => setResources((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Remove ${file.name}`}><X className="h-4 w-4 text-[#667085]" /></button></div>)}</div>}
        </FormPanel>
      </main>

      <aside className="space-y-4">
        <FormPanel title="Deadline & marks" icon={CalendarClock} compact>
          <label className="block text-xs font-black text-[#344054]">Due date and time<input type="datetime-local" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#CCD7E5] px-3 text-sm font-normal outline-none focus:border-[#1754E8]" /></label>
          <label className="mt-3 block text-xs font-black text-[#344054]">Maximum marks<input type="number" min="1" max="10000" step="0.5" value={maxMarks} onChange={(event) => setMaxMarks(event.target.value)} className="mt-1.5 h-11 w-full rounded-xl border border-[#CCD7E5] px-3 text-sm font-normal outline-none focus:border-[#1754E8]" /></label>
        </FormPanel>

        <FormPanel title="Submission policy" icon={SlidersHorizontal} compact>
          <Toggle label="Allow a written response" description="Students may add text along with or instead of files." checked={allowTextResponse} onChange={setAllowTextResponse} />
          <Toggle label="Allow resubmission" description="Students can replace their attempt until grading/policy closes it." checked={allowResubmission} onChange={setAllowResubmission} />
          <Toggle label="Accept late submissions" description="Late work is accepted but visibly marked as late." checked={lateSubmissionAllowed} onChange={setLateSubmissionAllowed} />
          {lateSubmissionAllowed && <label className="mt-3 block text-xs font-black text-[#344054]">Late penalty (%)<input type="number" min="0" max="100" value={latePenaltyPercent} onChange={(event) => setLatePenaltyPercent(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#CCD7E5] px-3 text-sm font-normal outline-none focus:border-[#1754E8]" /></label>}
          <label className="mt-3 block text-xs font-black text-[#344054]">Maximum submission files<select value={maxSubmissionFiles} onChange={(event) => setMaxSubmissionFiles(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[#CCD7E5] px-3 text-sm font-normal outline-none focus:border-[#1754E8]">{[1,2,3,4,5,6,7,8].map((value) => <option key={value} value={value}>{value} file{value === 1 ? '' : 's'}</option>)}</select></label>
          <div className="mt-4 flex gap-2 rounded-xl border border-[#F1D5A1] bg-[#FFF9EB] p-3 text-[9px] leading-4 text-[#78520B]"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span>Students who miss the deadline are shown as overdue. If late submission is enabled, their eventual submission is permanently marked late for faculty review.</span></div>
        </FormPanel>

        {error && <div role="alert" className="rounded-xl border border-[#F1CBC7] bg-[#FFF7F6] p-3 text-xs font-semibold text-[#9F2D24]">{error}</div>}
        <button type="button" onClick={() => void publish()} disabled={publishing} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-xs font-black text-white shadow-[0_7px_18px_rgba(23,84,232,0.22)] hover:bg-[#1046C4] disabled:opacity-50">{publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}Publish assignment</button>
        <p className="flex items-start gap-1.5 px-1 text-[9px] leading-4 text-[#8792A5]"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#087A55]" />Publishing is tenant-scoped and restricted to authorised course faculty/admin roles. Students in the course receive an in-app assignment notification.</p>
      </aside>
    </div>
  </div>;
}

function FormPanel({ title, icon: Icon, children, compact = false }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode; compact?: boolean }) { return <section className={`rounded-2xl border border-[#DCE3EC] bg-white shadow-[0_8px_24px_rgba(15,30,55,0.04)] ${compact ? 'p-4' : 'p-4 sm:p-5'}`}><h2 className="mb-4 flex items-center gap-2 text-sm font-black text-[#17223B]"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF0FF] text-[#1754E8]"><Icon className="h-4 w-4" /></span>{title}</h2>{children}</section>; }
function MiniFact({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-[#F7F9FC] p-3"><p className="text-[9px] font-black uppercase tracking-[0.06em] text-[#98A2B3]">{label}</p><p className="mt-1 truncate text-xs font-black text-[#344054]">{value}</p></div>; }
function Toggle({ label, description, checked, onChange }: { label: string; description: string; checked: boolean; onChange: (value: boolean) => void }) { return <button type="button" onClick={() => onChange(!checked)} className="mb-2 flex w-full items-start gap-3 rounded-xl border border-[#E1E7EF] p-3 text-left hover:border-[#B7C8E3]"><span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${checked ? 'border-[#1754E8] bg-[#1754E8] text-white' : 'border-[#BCC7D6] bg-white text-transparent'}`}><Check className="h-3 w-3" /></span><span><span className="block text-[11px] font-black text-[#344054]">{label}</span><span className="mt-0.5 block text-[9px] leading-4 text-[#7A8698]">{description}</span></span></button>; }
function defaultDeadline() { const date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); date.setHours(23, 59, 0, 0); const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000); return local.toISOString().slice(0, 16); }
function formatBytes(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`; }
function readError(value: unknown, fallback: string) { return value && typeof value === 'object' && 'error' in value && typeof (value as { error?: unknown }).error === 'string' ? (value as { error: string }).error : fallback; }
