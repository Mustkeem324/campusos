import type { Metadata } from 'next';
import { CheckCircle2, FileCheck2, ShieldCheck, XCircle } from 'lucide-react';

import { loadVerifiedPublicResult } from '@/lib/result-publication';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Verify Official Result | CampusOS',
  description: 'Verify an institution-authorised CampusOS academic result document.',
  robots: { index: false, follow: false },
};

export default async function VerifyResultPage({ params }: { params: { token: string } }) {
  const result = await loadVerifiedPublicResult(params.token);

  if (!result) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-1 items-center px-5 py-16 sm:px-8">
        <div className="w-full rounded-[28px] border border-[#E6C8C5] bg-white p-7 shadow-[0_22px_70px_rgba(15,23,42,0.08)] sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FFF0EE] text-[#A23A32]">
            <XCircle className="h-7 w-7" aria-hidden="true" />
          </div>
          <p className="mt-6 text-[11px] font-black uppercase tracking-[0.14em] text-[#9A4B43]">Verification failed</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#17223B]">This result document could not be verified</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#65748A]">
            The verification token is invalid, the result is not officially published, or the published academic snapshot no longer matches the institution record. Contact the issuing institution before relying on the document.
          </p>
        </div>
      </div>
    );
  }

  const faculty = result.approvals.filter((approval) => approval.stage === 'FACULTY');
  const hod = result.approvals.filter((approval) => approval.stage === 'HOD');
  const dean = result.approvals.find((approval) => approval.stage === 'DEAN');

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <section className="overflow-hidden rounded-[30px] border border-[#D9E3EF] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="bg-[#0E223E] px-6 py-7 text-white sm:px-9 sm:py-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-[#C9DAEE]">
                <ShieldCheck className="h-4 w-4" /> Official result verification
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Verified institution academic record</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#BFD0E4]">The signed verification token, publication audit event and current academic snapshot agree. Public verification intentionally reveals only the minimum information needed to match the document.</p>
            </div>
            <div className="rounded-2xl border border-[#4B7B64] bg-[#153D2B] px-4 py-3">
              <p className="flex items-center gap-2 text-sm font-black text-[#C9F4DA]"><CheckCircle2 className="h-5 w-5" /> VERIFIED</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-[#90C9A8]">Authorized & published</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="space-y-6">
            <section>
              <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#7C899B]">Issuing institution</p>
              <div className="mt-3 flex items-center gap-4 rounded-2xl border border-[#E0E6ED] bg-[#F8FAFC] p-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#173A70] text-lg font-black text-white">{initials(result.institution.name)}</span>
                <div>
                  <p className="text-base font-black text-[#17223B]">{result.institution.name}</p>
                  <p className="mt-1 text-xs font-bold text-[#6E7C90]">Institution code: {result.institution.code}</p>
                </div>
              </div>
            </section>

            <section className="grid gap-3 sm:grid-cols-2">
              <Info label="Student" value={maskName(result.student.name)} />
              <Info label="Roll / Registration number" value={maskIdentifier(result.student.rollNumber)} mono />
              <Info label="Programme" value={result.student.programme} />
              <Info label="Examination" value={result.examination.name} />
              <Info label="Academic session" value={result.examination.academicYear} />
              <Info label="Term / Semester" value={result.examination.term} />
            </section>

            <section className="rounded-2xl border border-[#DDE5EE] bg-[#FAFBFD] p-5">
              <div className="flex items-center gap-2"><FileCheck2 className="h-5 w-5 text-[#2459A9]" /><h2 className="text-sm font-black text-[#24344A]">Academic authorization chain</h2></div>
              <div className="mt-4 space-y-3 text-xs">
                <Trail label="Course faculty certification" value={`${faculty.filter((item) => item.approved).length} of ${faculty.length} required certification(s) recorded`} />
                <Trail label="Head(s) of Department" value={`${hod.filter((item) => item.approved).length} of ${hod.length} required department approval(s) recorded`} />
                <Trail label="Academic Dean" value={dean?.approved ? `Approval recorded · ${formatDate(dean.approvedAt)}` : 'Not recorded'} />
                <Trail label="Result publication" value={`Authorized publication recorded · ${formatDate(result.publication.publishedAt)}`} />
              </div>
            </section>
          </div>

          <aside className="h-fit rounded-2xl border border-[#D7E2EF] bg-[#F4F8FD] p-5 lg:sticky lg:top-24">
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#73849A]">Official document</p>
            <p className="mt-2 break-words font-mono text-sm font-black text-[#173A70]">{result.publication.documentNumber}</p>
            <div className="my-5 h-px bg-[#D8E1EB]" />
            <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#73849A]">Published</p>
            <p className="mt-2 text-sm font-bold text-[#34465D]">{formatDate(result.publication.publishedAt)}</p>
            <div className="my-5 h-px bg-[#D8E1EB]" />
            <p className="text-xs leading-5 text-[#65748A]">Verification confirms the document number, issuing institution, masked student identifiers and authorization state. Detailed grades remain private to the authenticated student/guardian portal and the issued document.</p>
          </aside>
        </div>
      </section>
    </div>
  );
}

function Info({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return <div className="rounded-xl border border-[#E0E6ED] bg-[#FAFBFD] px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#8290A2]">{label}</p><p className={`mt-1 text-sm font-bold text-[#26364D] ${mono ? 'font-mono' : ''}`}>{value}</p></div>;
}

function Trail({ label, value }: { label: string; value: string }) {
  return <div className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E6F5EC] text-[#247A48]"><CheckCircle2 className="h-3.5 w-3.5" /></span><div><p className="font-black text-[#34465D]">{label}</p><p className="mt-0.5 leading-5 text-[#738197]">{value}</p></div></div>;
}

function maskName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.length <= 1 ? part : `${part[0]}${'•'.repeat(Math.min(5, part.length - 1))}`)
    .join(' ');
}

function maskIdentifier(value: string) {
  const visible = value.slice(-4);
  const hiddenLength = Math.max(4, Math.min(12, value.length - visible.length));
  return `${'•'.repeat(hiddenLength)}${visible}`;
}

function formatDate(value: string | null) {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CO';
}
