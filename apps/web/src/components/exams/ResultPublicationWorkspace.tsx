'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Send,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

import type { OfficialResult, ResultPublicationWorkspace as WorkspaceData } from '../../lib/result-publication';

export function ResultPublicationWorkspace({ workspace }: { workspace: WorkspaceData }) {
  const router = useRouter();
  const [pendingId, setPendingId] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const verified = workspace.results.filter((result) => result.publication.integrity === 'VERIFIED').length;
  const ready = workspace.results.filter((result) => result.approvalSummary.readyToPublish && result.publication.integrity !== 'VERIFIED').length;
  const pending = workspace.results.length - verified;

  async function runAction(result: WorkspaceData['results'][number]) {
    if (!result.workflowAction.enabled || result.workflowAction.kind === 'NONE' || pendingId) return;
    setPendingId(result.id);
    setNotice(null);
    const suffix = result.workflowAction.kind === 'PUBLISH' ? 'publish' : 'approve';
    try {
      const response = await fetch(`/api/result-publication/${result.id}/${suffix}`, { method: 'POST' });
      const payload = await response.json().catch(() => ({})) as { error?: string; message?: string };
      if (!response.ok) throw new Error(payload.error || 'The workflow action could not be completed.');
      setNotice({ kind: 'success', text: payload.message || (suffix === 'publish' ? 'Official result published.' : 'Academic approval recorded.') });
      router.refresh();
    } catch (error: unknown) {
      setNotice({ kind: 'error', text: error instanceof Error ? error.message : 'The workflow action could not be completed.' });
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] text-white shadow-[0_24px_60px_rgba(11,31,58,0.16)]">
        <div className="grid gap-7 px-6 py-7 sm:px-8 sm:py-9 xl:grid-cols-[minmax(0,1fr)_25rem] xl:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#C9DBF7]">
              <ShieldCheck className="h-3.5 w-3.5" /> Controlled academic publication
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Result authorization & publication</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#C6D6E8]">
              Official results move through course faculty certification, Head of Department approval and Academic Dean authorization before the examination office can publish a student-visible, verifiable result.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <HeaderMetric label="In scope" value={String(workspace.results.length)} />
            <HeaderMetric label="Pending" value={String(pending)} />
            <HeaderMetric label="Verified" value={String(verified)} />
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <StageCard index="01" title="Course faculty" description="Certifies marks for the course offerings they are assigned to teach." icon={UserCheck} />
        <StageCard index="02" title="Head of Department" description="Approves department results only after required faculty certification." icon={FileCheck2} />
        <StageCard index="03" title="Academic Dean" description="Provides final academic authorization after all department approvals." icon={GraduationCap} />
        <StageCard index="04" title="Examination office" description="Publishes only when the full authorization chain is complete." icon={Send} />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-[#DCE3EC] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-950">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7C899B]">Active authorization role</p>
          <p className="mt-1 text-sm font-black text-[#26364D] dark:text-white">{workspace.actorName} · {humanRole(workspace.role)}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-[#F2F6FB] px-3 py-2 text-xs font-bold text-[#536579] dark:bg-slate-900 dark:text-slate-300">
          <LockKeyhole className="h-4 w-4" /> Server-verified institution & role scope
        </div>
      </section>

      {notice && (
        <div className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold ${notice.kind === 'success' ? 'border-[#B9DEC8] bg-[#EFFAF3] text-[#286846]' : 'border-[#E5C1BD] bg-[#FFF2F0] text-[#963C34]'}`} role="status">
          {notice.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />}
          <span>{notice.text}</span>
        </div>
      )}

      {workspace.results.length === 0 ? (
        <div className="rounded-[26px] border border-dashed border-[#CAD5E2] bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-950">
          <GraduationCap className="mx-auto h-8 w-8 text-[#6E84A0]" />
          <h2 className="mt-4 text-lg font-black text-[#26364D] dark:text-white">No result records are in your authorization scope</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#718096]">When calculated semester results are available for your assigned courses, department or publication role, they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workspace.results.map((result) => (
            <ResultWorkflowCard
              key={result.id}
              result={result}
              busy={pendingId === result.id}
              onAction={() => void runAction(result)}
            />
          ))}
        </div>
      )}

      {ready > 0 && !['EXAMINATION_CONTROLLER', 'REGISTRAR', 'INSTITUTION_ADMIN', 'SUPER_ADMIN'].includes(workspace.role) && (
        <p className="text-xs text-[#718096]">{ready} result{ready === 1 ? '' : 's'} have completed the academic authorization chain and are waiting for an authorized publication role.</p>
      )}
    </div>
  );
}

function ResultWorkflowCard({
  result,
  busy,
  onAction,
}: {
  result: WorkspaceData['results'][number];
  busy: boolean;
  onAction: () => void;
}) {
  const faculty = result.approvals.filter((approval) => approval.stage === 'FACULTY');
  const hod = result.approvals.filter((approval) => approval.stage === 'HOD');
  const dean = result.approvals.find((approval) => approval.stage === 'DEAN');
  const verified = result.publication.integrity === 'VERIFIED';
  const exception = result.publication.integrity === 'CHANGED';

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#D7E1EC] bg-white shadow-[0_10px_30px_rgba(15,23,42,0.035)] dark:border-slate-800 dark:bg-slate-950">
      <div className="grid gap-5 px-5 py-5 lg:grid-cols-[minmax(0,1fr)_20rem] lg:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg bg-[#EDF3FC] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#2459A9]">{result.examination.term}</span>
            <span className={`rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${verified ? 'bg-[#E6F5EC] text-[#247146]' : exception ? 'bg-[#FDECEA] text-[#A23A32]' : 'bg-[#FFF3DE] text-[#936217]'}`}>
              {verified ? 'Published & verified' : exception ? 'Integrity exception' : result.publication.published ? 'Legacy published' : 'Awaiting publication'}
            </span>
          </div>
          <h2 className="mt-3 text-lg font-black tracking-[-0.025em] text-[#17223B] dark:text-white">{result.student.name}</h2>
          <p className="mt-1 text-xs font-bold text-[#68788D]">{result.student.rollNumber} · {result.student.programme} · {result.examination.name}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            <MiniMetric label="SGPA" value={result.academicIndex.sgpa.toFixed(2)} />
            <MiniMetric label="CGPA" value={result.academicIndex.cgpa.toFixed(2)} />
            <MiniMetric label="Courses" value={String(result.courses.length)} />
            <MiniMetric label="Result" value={result.academicIndex.resultStatus} />
          </div>

          <div className="mt-5 grid gap-2 md:grid-cols-3">
            <ApprovalStage
              title="Faculty"
              value={`${faculty.filter((item) => item.approved).length}/${faculty.length}`}
              complete={faculty.length > 0 && faculty.every((item) => item.approved)}
              detail={faculty.filter((item) => !item.approved).length ? `${faculty.filter((item) => !item.approved).length} course certification(s) pending` : 'Course certifications complete'}
            />
            <ApprovalStage
              title="HOD"
              value={`${hod.filter((item) => item.approved).length}/${hod.length}`}
              complete={hod.length > 0 && hod.every((item) => item.approved)}
              detail={hod.filter((item) => !item.approved).length ? `${hod.filter((item) => !item.approved).length} department approval(s) pending` : 'Department approvals complete'}
            />
            <ApprovalStage
              title="Dean"
              value={dean?.approved ? 'Approved' : 'Pending'}
              complete={Boolean(dean?.approved)}
              detail={dean?.approved ? `${dean.approverName ?? 'Dean'} · ${formatDate(dean.approvedAt)}` : 'Final academic authorization required'}
            />
          </div>
        </div>

        <aside className="flex h-fit flex-col rounded-2xl border border-[#DCE4ED] bg-[#F7F9FC] p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#7B899A]">Workflow action</p>
          <p className="mt-2 text-sm font-black text-[#26364D] dark:text-white">{result.workflowAction.label}</p>
          {result.workflowAction.reason && <p className="mt-2 text-[11px] leading-5 text-[#718096] dark:text-slate-400">{result.workflowAction.reason}</p>}

          {verified && (
            <div className="mt-4 rounded-xl border border-[#C8DFD1] bg-[#EFF9F3] p-3">
              <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#4C8062]">Official document</p>
              <p className="mt-1 break-all font-mono text-[10px] font-bold text-[#286846]">{result.publication.documentNumber}</p>
            </div>
          )}

          {result.workflowAction.kind !== 'NONE' && (
            <button
              type="button"
              disabled={!result.workflowAction.enabled || busy}
              onClick={onAction}
              className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#173A70] px-4 text-xs font-black text-white transition hover:bg-[#102E5D] disabled:cursor-not-allowed disabled:bg-[#A8B4C4]"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : result.workflowAction.kind === 'PUBLISH' ? <Send className="h-4 w-4" /> : <Check className="h-4 w-4" />}
              {busy ? 'Processing…' : result.workflowAction.label}
            </button>
          )}
        </aside>
      </div>

      <div className="border-t border-[#E2E8F0] bg-[#FAFBFD] px-5 py-3 dark:border-slate-800 dark:bg-slate-900/60">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-semibold text-[#738197]">
          <span>{result.student.department}</span><ChevronRight className="h-3 w-3" /><span>{result.examination.academicYear}</span><ChevronRight className="h-3 w-3" /><span>{result.courses.length} course record{result.courses.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </article>
  );
}

function HeaderMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center"><p className="text-xl font-black text-white">{value}</p><p className="mt-1 text-[9px] font-black uppercase tracking-[0.1em] text-[#AFC7E7]">{label}</p></div>;
}

function StageCard({ index, title, description, icon: Icon }: { index: string; title: string; description: string; icon: typeof ShieldCheck }) {
  return <div className="rounded-2xl border border-[#DCE3EC] bg-white p-4 dark:border-slate-800 dark:bg-slate-950"><div className="flex items-center justify-between"><span className="text-[10px] font-black tracking-[0.12em] text-[#8A97A8]">{index}</span><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EEF4FB] text-[#2459A9] dark:bg-slate-900"><Icon className="h-4.5 w-4.5" /></span></div><p className="mt-3 text-sm font-black text-[#26364D] dark:text-white">{title}</p><p className="mt-1 text-[11px] leading-5 text-[#718096] dark:text-slate-400">{description}</p></div>;
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-[#E0E6ED] bg-[#FAFBFD] px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900"><p className="text-[8px] font-black uppercase tracking-[0.1em] text-[#8693A3]">{label}</p><p className="mt-1 text-sm font-black text-[#34465D] dark:text-slate-100">{value}</p></div>;
}

function ApprovalStage({ title, value, complete, detail }: { title: string; value: string; complete: boolean; detail: string }) {
  return <div className={`rounded-xl border px-3 py-3 ${complete ? 'border-[#C7E1D1] bg-[#F2FAF5]' : 'border-[#E8D4AC] bg-[#FFF9EC]'} dark:bg-slate-900`}><div className="flex items-center justify-between gap-2"><p className={`text-[9px] font-black uppercase tracking-[0.1em] ${complete ? 'text-[#3D7B58]' : 'text-[#8C641F]'}`}>{title}</p>{complete ? <CheckCircle2 className="h-4 w-4 text-[#3D7B58]" /> : <LockKeyhole className="h-4 w-4 text-[#8C641F]" />}</div><p className="mt-2 text-sm font-black text-[#34465D] dark:text-white">{value}</p><p className="mt-1 text-[9px] leading-4 text-[#718096] dark:text-slate-400">{detail}</p></div>;
}

function humanRole(value: string) {
  return value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value));
}
