import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CheckCircle2,
  CirclePause,
  FileSearch,
  MapPin,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { getSessionFromCookies } from '@/lib/auth';
import { getCareerOpenings } from '@/lib/careers-service';

const statusStyles: Record<string, string> = {
  PUBLISHED: 'border-[#B6E3D1] bg-[#ECF9F3] text-[#067A4D]',
  DRAFT: 'border-[#D9E1EB] bg-[#F5F7FA] text-[#536175]',
  SCHEDULED: 'border-[#C9D8F0] bg-[#EEF3FF] text-[#1754E8]',
  PAUSED: 'border-[#F0D5A8] bg-[#FFF8E8] text-[#8A5200]',
  CLOSED: 'border-[#E8C2C5] bg-[#FFF1F2] text-[#B4232B]',
  FILLED: 'border-[#B6E3D1] bg-[#ECF9F3] text-[#067A4D]',
  ARCHIVED: 'border-[#D9E1EB] bg-[#F5F7FA] text-[#536175]',
};

export default async function RecruitmentDashboardPage() {
  const session = await getSessionFromCookies();
  if (!session) redirect('/login');

  const role = String(session.role);
  if (!['ADMIN', 'SUPER_ADMIN'].includes(role)) redirect('/dashboard');

  const openings = getCareerOpenings({ includeUnpublished: true });
  const published = openings.filter((opening) => opening.status === 'PUBLISHED').length;
  const internships = openings.filter((opening) => opening.employmentType === 'INTERNSHIP').length;
  const demoCount = openings.filter((opening) => opening.isDemo).length;

  const metrics = [
    { label: 'Configured roles', value: openings.length, icon: BriefcaseBusiness, hint: 'All visible and internal statuses' },
    { label: 'Published roles', value: published, icon: CheckCircle2, hint: 'Currently exposed by the public API' },
    { label: 'Internships', value: internships, icon: UsersRound, hint: 'Approved internship records' },
    { label: 'Demo records', value: demoCount, icon: Sparkles, hint: 'Never treated as real vacancies' },
  ];

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-8 px-4 pb-12 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-[#D8E2EF] bg-white shadow-[0_18px_50px_rgba(16,29,56,0.07)]">
        <div className="grid lg:grid-cols-[1.3fr_0.7fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#EEF3FF] px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Restricted recruitment workspace
            </div>
            <h1 className="mt-5 text-3xl font-bold tracking-tight text-[#101D38] sm:text-4xl">Recruitment control centre</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#5F6B7A]">
              Review configured roles, verify publication status and monitor the public careers experience. This foundation is intentionally read-only until database-backed job editing and applicant permissions are approved.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/careers"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-bold text-white hover:bg-[#103FC2]"
              >
                View public careers page
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/api/public/careers/jobs"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#B9C8DE] px-5 py-3 text-sm font-bold text-[#1754E8] hover:bg-[#F7F9FC]"
              >
                Inspect jobs API
              </Link>
            </div>
          </div>

          <div className="border-t border-[#D8E2EF] bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#8CB2FF]">Release discipline</p>
            <h2 className="mt-3 text-xl font-bold">Publish only approved openings</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[#D1DBE9]">
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#69D5A5]" aria-hidden="true" />Verify title, scope, location and employment type.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#69D5A5]" aria-hidden="true" />Keep demo records clearly labelled and disabled in production.</li>
              <li className="flex gap-3"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#69D5A5]" aria-hidden="true" />Do not collect candidate documents before the ATS workflow is ready.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Recruitment metrics">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article key={metric.label} className="rounded-2xl border border-[#DEE5EF] bg-white p-5 shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#667085]">{metric.label}</p>
                  <p className="mt-3 text-3xl font-bold text-[#101D38]">{metric.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>
              <p className="mt-4 text-xs leading-5 text-[#7B8798]">{metric.hint}</p>
            </article>
          );
        })}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#D8E2EF] bg-white shadow-[0_12px_34px_rgba(16,29,56,0.05)]">
        <div className="flex flex-col gap-3 border-b border-[#E8EDF3] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div>
            <h2 className="text-xl font-bold text-[#101D38]">Role inventory</h2>
            <p className="mt-1 text-sm text-[#667085]">Server-configured openings and demo-safe records.</p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[#F5F7FA] px-3 py-2 text-xs font-semibold text-[#536175]">
            <CalendarClock className="h-4 w-4" aria-hidden="true" />
            Database editor planned for the next cycle
          </div>
        </div>

        {openings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border-collapse">
              <thead className="bg-[#F8FAFC] text-left text-xs font-bold uppercase tracking-[0.08em] text-[#667085]">
                <tr>
                  <th className="px-7 py-4">Role</th>
                  <th className="px-5 py-4">Team</th>
                  <th className="px-5 py-4">Location</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-7 py-4 text-right">Public view</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EEF1F5]">
                {openings.map((opening) => (
                  <tr key={opening.id} className="hover:bg-[#FBFCFE]">
                    <td className="px-7 py-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]">
                          <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-bold text-[#101D38]">{opening.title}</p>
                            {opening.isDemo && <span className="rounded-full bg-[#FFF8E8] px-2 py-0.5 text-[11px] font-bold text-[#8A5200]">Demo</span>}
                          </div>
                          <p className="mt-1 font-mono text-xs text-[#7B8798]">{opening.referenceCode}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 text-sm text-[#475467]"><span className="inline-flex items-center gap-2"><Building2 className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />{opening.team}</span></td>
                    <td className="px-5 py-5 text-sm text-[#475467]"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />{opening.location}</span></td>
                    <td className="px-5 py-5 text-sm text-[#475467]">{opening.employmentType.replaceAll('_', ' ')}</td>
                    <td className="px-5 py-5"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[opening.status] ?? statusStyles.DRAFT}`}>{opening.status.replaceAll('_', ' ')}</span></td>
                    <td className="px-7 py-5 text-right">
                      {opening.status === 'PUBLISHED' ? (
                        <Link href={`/careers/jobs/${opening.slug}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-bold text-[#1754E8] hover:bg-[#EEF3FF]">
                          Open
                          <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#7B8798]"><CirclePause className="h-4 w-4" aria-hidden="true" />Not public</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]"><FileSearch className="h-6 w-6" aria-hidden="true" /></div>
            <h3 className="mt-5 text-lg font-bold text-[#101D38]">No approved role data configured</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#667085]">Add reviewed job data through the server configuration. The public careers page will remain honest and show an empty state until approved roles exist.</p>
          </div>
        )}
      </section>
    </div>
  );
}
