'use client';

import Link from 'next/link';
import {
  Award,
  Check,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  LockKeyhole,
  Printer,
  ShieldCheck,
} from 'lucide-react';

import type { OfficialResult } from '../../lib/result-publication';
import { createResultQrMatrix } from '../../lib/result-qr';

export function GradeCardMarksheet({ result }: { result: OfficialResult | null }) {
  if (!result) return <NoPublishedResult />;

  const isVerified = result.publication.integrity === 'VERIFIED';
  const facultyApprovals = result.approvals.filter((approval) => approval.stage === 'FACULTY');
  const hodApprovals = result.approvals.filter((approval) => approval.stage === 'HOD');
  const deanApproval = result.approvals.find((approval) => approval.stage === 'DEAN');

  return (
    <div className="space-y-5 pb-10">
      <section className="overflow-hidden rounded-[28px] border border-[#173456] bg-[#0B1F3A] text-white shadow-[0_24px_60px_rgba(11,31,58,0.16)]">
        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 sm:py-8 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#C9DBF7]">
                <GraduationCap className="h-3.5 w-3.5" /> Student academic record
              </span>
              <span className={`rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.1em] ${isVerified ? 'bg-[#DFF4E8] text-[#236B42]' : 'bg-[#FFF1D6] text-[#8A5A13]'}`}>
                {isVerified ? 'Authorized & verified' : integrityLabel(result.publication.integrity)}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] sm:text-4xl">Official result & grade card</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#C5D5E8]">
              {result.examination.name} · {result.examination.term} · {result.examination.academicYear}. This view is generated from the institution&apos;s published academic record.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 text-xs font-black text-white hover:bg-white/10">
              <Printer className="h-4 w-4" /> Print
            </button>
            {isVerified ? (
              <Link
                href={`/api/results/${result.id}/pdf`}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#0B1F3A] hover:bg-[#EEF4FB]"
              >
                <Download className="h-4 w-4" /> Download official PDF
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white/10 px-4 text-xs font-black text-white/45 disabled:cursor-not-allowed"
              >
                <Download className="h-4 w-4" /> Download official PDF
              </button>
            )}
          </div>
        </div>
      </section>

      {!isVerified && (
        <section className="flex items-start gap-3 rounded-2xl border border-[#E8C98D] bg-[#FFF8E8] px-4 py-4 text-[#6E4B16]">
          <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-sm font-black">Official PDF issuance is locked</p>
            <p className="mt-1 text-xs leading-5">
              {result.publication.integrity === 'CHANGED'
                ? 'The current academic data differs from the snapshot recorded at publication. The examination office must review the integrity exception before a verified document can be issued.'
                : result.publication.integrity === 'LEGACY'
                  ? 'This record was published before the current faculty-HOD-Dean publication trail was recorded. It remains visible, but it must be sealed through the official workflow before a verifiable PDF can be issued.'
                  : 'The result has not completed the required academic authorization and publication workflow.'}
            </p>
          </div>
        </section>
      )}

      <article className="result-print-sheet overflow-hidden rounded-[26px] border border-[#CBD6E4] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)] dark:border-slate-700 dark:bg-slate-950">
        <header className="border-b-4 border-[#173A70] px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#173A70] text-lg font-black text-white shadow-[0_10px_24px_rgba(23,58,112,0.22)]">
                {initials(result.institution.name)}
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-[#63758A]">{result.institution.code}</p>
                <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.025em] text-[#101D38] sm:text-2xl dark:text-white">{result.institution.name}</h2>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.11em] text-[#52709A]">Office of the Controller of Examinations</p>
                <p className="mt-3 text-xs font-black uppercase tracking-[0.08em] text-[#26364D] dark:text-slate-200">Official statement of marks & grade card</p>
              </div>
            </div>

            <div className="min-w-0 rounded-2xl border border-[#D7E1ED] bg-[#F7F9FC] px-4 py-3 md:max-w-[19rem] md:text-right dark:border-slate-700 dark:bg-slate-900">
              <p className="text-[9px] font-black uppercase tracking-[0.11em] text-[#7B899A]">Document number</p>
              <p className="mt-1 break-all font-mono text-xs font-black text-[#173A70] dark:text-blue-300">{result.publication.documentNumber}</p>
              <p className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-black uppercase ${isVerified ? 'text-[#237146]' : 'text-[#9A6717]'}`}>
                {isVerified ? <CheckCircle2 className="h-3.5 w-3.5" /> : <LockKeyhole className="h-3.5 w-3.5" />}
                {isVerified ? 'Integrity verified' : integrityLabel(result.publication.integrity)}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-7 px-4 py-6 sm:px-8 sm:py-8">
          <section>
            <SectionTitle>Student & examination particulars</SectionTitle>
            <div className="mt-3 grid gap-px overflow-hidden rounded-2xl border border-[#DDE4ED] bg-[#DDE4ED] sm:grid-cols-2 lg:grid-cols-3 dark:border-slate-700 dark:bg-slate-700">
              <RecordField label="Student name" value={result.student.name} />
              <RecordField label="Roll / Registration no." value={result.student.rollNumber} mono />
              <RecordField label="Programme" value={`${result.student.programme} (${result.student.programmeCode})`} />
              <RecordField label="Department" value={result.student.department} />
              <RecordField label="Batch / Section" value={`${result.student.batch}${result.student.section ? ` / ${result.student.section}` : ''}`} />
              <RecordField label="Academic session" value={result.examination.academicYear} />
              <RecordField label="Examination" value={result.examination.name} />
              <RecordField label="Term / Semester" value={`${result.examination.term} · Semester ${result.examination.termNumber}`} />
              <RecordField label="Result status" value={result.academicIndex.resultStatus} strong />
            </div>
          </section>

          <section>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <SectionTitle>Course-wise performance</SectionTitle>
              <p className="text-[10px] font-semibold text-[#7B8999]">Marks are shown where the examination marks record is available.</p>
            </div>
            <div className="mt-3 overflow-x-auto rounded-2xl border border-[#DCE3EC]">
              <table className="min-w-[850px] w-full border-collapse text-left text-xs">
                <thead className="bg-[#F1F5F9] text-[9px] font-black uppercase tracking-[0.08em] text-[#5D6C80] dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="border-r border-[#DCE3EC] px-3 py-3">Code</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3">Course title</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3 text-center">Credits</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3 text-center">Marks</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3 text-center">Max</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3 text-center">%</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3 text-center">Grade</th>
                    <th className="border-r border-[#DCE3EC] px-3 py-3 text-center">Grade point</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-800">
                  {result.courses.map((course) => (
                    <tr key={course.courseOfferingId} className="bg-white dark:bg-slate-950">
                      <td className="border-r border-[#E2E8F0] px-3 py-3 font-mono font-black text-[#2459A9] dark:border-slate-800">{course.code}</td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 dark:border-slate-800">
                        <p className="font-bold text-[#27384E] dark:text-slate-100">{course.title}</p>
                        <p className="mt-1 text-[9px] text-[#8490A0]">{course.department} · Faculty: {course.facultyName}</p>
                      </td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 text-center font-bold dark:border-slate-800">{course.credits}</td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 text-center font-mono font-bold dark:border-slate-800">{formatNumber(course.marksObtained)}</td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 text-center font-mono dark:border-slate-800">{course.maxMarks === null ? '—' : formatNumber(course.maxMarks)}</td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 text-center font-mono dark:border-slate-800">{course.percentage === null ? '—' : `${course.percentage.toFixed(2)}%`}</td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 text-center text-sm font-black text-[#173A70] dark:border-slate-800 dark:text-blue-300">{course.grade}</td>
                      <td className="border-r border-[#E2E8F0] px-3 py-3 text-center font-mono font-bold dark:border-slate-800">{formatNumber(course.gradePoints)}</td>
                      <td className="px-3 py-3 text-center"><span className={`rounded-lg px-2 py-1 text-[9px] font-black uppercase ${course.isPass ? 'bg-[#E7F6ED] text-[#247146]' : 'bg-[#FDECEA] text-[#A63A32]'}`}>{course.isPass ? 'Pass' : 'Not pass'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <SectionTitle>Cumulative academic index</SectionTitle>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <AcademicMetric label="Semester SGPA" value={result.academicIndex.sgpa.toFixed(2)} />
              <AcademicMetric label="Cumulative CGPA" value={result.academicIndex.cgpa.toFixed(2)} />
              <AcademicMetric label="Credits earned" value={`${result.academicIndex.earnedCredits}/${result.academicIndex.totalCredits}`} />
              <AcademicMetric label="Aggregate" value={result.academicIndex.percentage === null ? 'N/A' : `${result.academicIndex.percentage.toFixed(2)}%`} />
              <AcademicMetric label="Result" value={result.academicIndex.resultStatus} />
            </div>
          </section>

          <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
            <div>
              <SectionTitle>Academic authorization trail</SectionTitle>
              <div className="mt-3 overflow-hidden rounded-2xl border border-[#DCE3EC]">
                <ApprovalRow
                  title="Course faculty certification"
                  status={`${result.approvalSummary.facultyApproved}/${result.approvalSummary.facultyRequired} complete`}
                  approved={result.approvalSummary.facultyApproved === result.approvalSummary.facultyRequired && result.approvalSummary.facultyRequired > 0}
                  details={facultyApprovals.map((item) => item.approved ? `${item.label}: ${item.approverName ?? 'Faculty'} · ${formatDate(item.approvedAt)}` : `${item.label}: pending`)}
                />
                <ApprovalRow
                  title="Head(s) of Department"
                  status={`${result.approvalSummary.hodApproved}/${result.approvalSummary.hodRequired} complete`}
                  approved={result.approvalSummary.hodApproved === result.approvalSummary.hodRequired && result.approvalSummary.hodRequired > 0}
                  details={hodApprovals.map((item) => item.approved ? `${item.label}: ${item.approverName ?? 'HOD'} · ${formatDate(item.approvedAt)}` : `${item.label}: pending`)}
                />
                <ApprovalRow
                  title="Academic Dean authorization"
                  status={deanApproval?.approved ? 'Approved' : 'Pending'}
                  approved={Boolean(deanApproval?.approved)}
                  details={[deanApproval?.approved ? `${deanApproval.approverName ?? 'Dean'} · ${formatDate(deanApproval.approvedAt)}` : 'Final academic authorization is pending.']}
                />
                <ApprovalRow
                  title="Official publication"
                  status={result.publication.published ? 'Published' : 'Not published'}
                  approved={result.publication.published && isVerified}
                  details={[result.publication.publishedAt ? `${result.publication.publisherName ?? 'Authorized examination office'} (${humanRole(result.publication.publisherRole)}) · ${formatDate(result.publication.publishedAt)}` : 'Publication event not recorded.']}
                  last
                />
              </div>
            </div>

            <VerificationPanel result={result} />
          </section>

          <footer className="border-t border-[#DCE3EC] pt-5 text-[10px] leading-5 text-[#778599]">
            <p className="font-bold text-[#4C5C72]">Important:</p>
            <p>This document is generated from the institution-authorised CampusOS academic record. Any alteration to the underlying published result invalidates the integrity verification until the examination office reviews and republishes the record. The online verifier is authoritative for copied or printed documents.</p>
          </footer>
        </div>
      </article>
    </div>
  );
}

function VerificationPanel({ result }: { result: OfficialResult }) {
  const url = result.publication.verificationUrl;
  const matrix = url ? createResultQrMatrix(url) : null;
  return (
    <aside className="h-fit rounded-2xl border border-[#D7E2EF] bg-[#F5F8FC] p-5 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-[#247146]" /><p className="text-sm font-black text-[#26364D] dark:text-white">Online verification</p></div>
      {matrix && url ? (
        <>
          <div className="mx-auto mt-4 w-fit rounded-xl border border-[#D5DEE9] bg-white p-2">
            <QrMatrix matrix={matrix} />
          </div>
          <p className="mt-3 text-center text-[10px] leading-4 text-[#718096]">Scan with a phone camera to open the public CampusOS verification record.</p>
          <Link href={url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#BFD0E5] bg-white px-3 text-xs font-black text-[#173A70] hover:bg-[#EEF4FB] dark:bg-slate-950 dark:text-blue-300">
            Verify online <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </>
      ) : (
        <p className="mt-3 text-xs leading-5 text-[#718096]">A public verification token is not available for this record.</p>
      )}
      <div className="my-4 h-px bg-[#DCE4ED] dark:bg-slate-700" />
      <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#7D8B9D]">Document no.</p>
      <p className="mt-1 break-all font-mono text-[10px] font-black text-[#40536B] dark:text-slate-300">{result.publication.documentNumber}</p>
    </aside>
  );
}

function QrMatrix({ matrix }: { matrix: boolean[][] }) {
  const quiet = 4;
  const size = matrix.length + quiet * 2;
  const rects: JSX.Element[] = [];
  matrix.forEach((row, rowIndex) => row.forEach((filled, columnIndex) => {
    if (filled) rects.push(<rect key={`${rowIndex}-${columnIndex}`} x={columnIndex + quiet} y={rowIndex + quiet} width="1" height="1" />);
  }));
  return <svg viewBox={`0 0 ${size} ${size}`} width="132" height="132" role="img" aria-label="Official result verification QR code" shapeRendering="crispEdges"><rect width={size} height={size} fill="white" /><g fill="#111827">{rects}</g></svg>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2"><span className="h-4 w-1 rounded-full bg-[#2459A9]" /><h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-[#4F6075] dark:text-slate-300">{children}</h3></div>;
}

function RecordField({ label, value, mono = false, strong = false }: { label: string; value: string; mono?: boolean; strong?: boolean }) {
  return <div className="min-w-0 bg-white px-4 py-3 dark:bg-slate-950"><p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#8995A5]">{label}</p><p className={`mt-1 break-words text-xs text-[#27384E] dark:text-slate-100 ${mono ? 'font-mono' : ''} ${strong ? 'font-black text-[#173A70] dark:text-blue-300' : 'font-bold'}`}>{value}</p></div>;
}

function AcademicMetric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-[#DCE3EC] bg-[#F8FAFC] p-4 dark:border-slate-700 dark:bg-slate-900"><p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#7F8C9D]">{label}</p><p className="mt-2 text-xl font-black tracking-[-0.03em] text-[#173A70] dark:text-blue-300">{value}</p></div>;
}

function ApprovalRow({ title, status, approved, details, last = false }: { title: string; status: string; approved: boolean; details: string[]; last?: boolean }) {
  return <div className={`grid gap-3 bg-white px-4 py-4 sm:grid-cols-[12rem_7rem_minmax(0,1fr)] dark:bg-slate-950 ${last ? '' : 'border-b border-[#E2E8F0] dark:border-slate-800'}`}><div className="flex items-center gap-2"><span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${approved ? 'bg-[#E6F5EC] text-[#247146]' : 'bg-[#FFF3DE] text-[#9A6717]'}`}>{approved ? <Check className="h-4 w-4" /> : <LockKeyhole className="h-3.5 w-3.5" />}</span><p className="text-xs font-black text-[#34465D] dark:text-slate-100">{title}</p></div><p className={`text-[10px] font-black uppercase ${approved ? 'text-[#247146]' : 'text-[#9A6717]'}`}>{status}</p><div className="space-y-1 text-[10px] leading-4 text-[#768598]">{details.map((detail, index) => <p key={`${detail}-${index}`}>{detail}</p>)}</div></div>;
}

function NoPublishedResult() {
  return <div className="mx-auto max-w-3xl rounded-[26px] border border-[#D9E3EE] bg-white p-8 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950 sm:p-12"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EEF4FB] text-[#2459A9]"><Award className="h-7 w-7" /></div><h1 className="mt-5 text-2xl font-black tracking-[-0.03em] text-[#17223B] dark:text-white">No published result is available</h1><p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#718096]">Results appear here only after the institution completes its academic authorization and publication process. Draft or pending results are not exposed to the student portal.</p></div>;
}

function integrityLabel(value: OfficialResult['publication']['integrity']) {
  if (value === 'CHANGED') return 'Integrity exception';
  if (value === 'LEGACY') return 'Legacy publication';
  if (value === 'DRAFT') return 'Pending publication';
  return 'Verified';
}

function formatDate(value: string | null) {
  if (!value) return 'Date unavailable';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(new Date(value)) + ' UTC';
}

function humanRole(value: string | null) {
  return value ? value.toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase()) : 'Authorized examination office';
}

function initials(value: string) {
  return value.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'CO';
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}
