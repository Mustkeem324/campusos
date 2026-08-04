import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';

const trustPoints = [
  'Secure multi-tenant architecture',
  'Role-based workspaces',
  'English and Hindi support',
  'Mobile-ready experience',
] as const;

const facultyMetrics = [
  {
    label: "Today's classes",
    value: '4',
    detail: 'Next at 11:00 AM',
    icon: CalendarDays,
  },
  {
    label: 'Assigned students',
    value: '128',
    detail: 'Across 4 sections',
    icon: UsersRound,
  },
  {
    label: 'Attendance pending',
    value: '2',
    detail: 'Sessions to finalise',
    icon: FileCheck2,
  },
  {
    label: 'Submissions to grade',
    value: '18',
    detail: '6 due today',
    icon: BookOpen,
  },
] as const;

const schedule = [
  {
    time: '09:00',
    course: 'CS-301 · Data Structures',
    location: 'Computer Lab 4',
    section: 'B.Tech CSE · Year 2',
    status: 'Completed',
  },
  {
    time: '11:00',
    course: 'CS-305 · Design of Algorithms',
    location: 'Lecture Hall A',
    section: 'B.Tech CSE · Year 2',
    status: 'Live now',
  },
  {
    time: '14:00',
    course: 'CS-312 · Database Systems',
    location: 'Room B-204',
    section: 'B.Tech CSE · Year 3',
    status: 'Upcoming',
  },
] as const;

const pendingWork = [
  {
    label: 'Attendance sessions',
    value: '2',
  },
  {
    label: 'Assignments to grade',
    value: '18',
  },
  {
    label: 'Student questions',
    value: '5',
  },
] as const;

function FacultyMetricCard({
  metric,
}: {
  metric: (typeof facultyMetrics)[number];
}) {
  const Icon = metric.icon;

  return (
    <div className="rounded-xl border border-[#DEE5EF] bg-white p-3.5 shadow-[0_5px_18px_rgba(16,24,40,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
            {metric.label}
          </p>

          <p className="mt-1.5 text-lg font-bold tracking-[-0.02em] text-[#101828]">
            {metric.value}
          </p>
        </div>

        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1754E8]">
          <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </div>
      </div>

      <p className="mt-2 truncate text-[10px] text-[#7C889A]">
        {metric.detail}
      </p>
    </div>
  );
}

function FacultyDashboardPreview() {
  return (
    <div
      className="relative mx-auto w-full max-w-[860px]"
      aria-label="Fictional CampusOS faculty dashboard preview"
    >
      <div className="absolute -inset-5 rounded-[32px] bg-[#E8EFFD] opacity-60 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-[#CFD9E7] bg-white shadow-[0_28px_70px_rgba(16,42,91,0.16)]">
        <div className="flex h-14 items-center justify-between border-b border-[#DEE5EF] bg-white px-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Logo className="h-7 w-7 shrink-0" showText={false} />

            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-[#101828] sm:text-sm">
                Good morning, Dr. Priya
              </p>

              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#8A95A6]">
                Fictional faculty workspace
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-2 text-[#667085]"
            aria-hidden="true"
          >
            <div className="hidden items-center gap-1.5 rounded-lg border border-[#DEE5EF] bg-[#F7F9FC] px-2.5 py-1.5 text-[10px] font-medium sm:flex">
              <Clock3 className="h-3.5 w-3.5" />
              Today
            </div>

            <Search className="hidden h-4 w-4 sm:block" />
            <Bell className="h-4 w-4" />

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1754E8] text-xs font-bold text-white">
              PS
            </div>
          </div>
        </div>

        <div className="flex min-h-[440px] bg-[#F5F7FB] sm:min-h-[500px]">
          <aside
            className="hidden w-[176px] shrink-0 border-r border-[#DEE5EF] bg-white p-3.5 md:block"
            aria-hidden="true"
          >
            <nav className="space-y-1">
              {[
                'Overview',
                'My Courses',
                'Timetable',
                'Attendance',
                'Assignments',
                'Grading',
                'Students',
                'Resources',
              ].map((item, index) => (
                <div
                  key={item}
                  className={[
                    'rounded-lg px-3 py-2 text-[11px] font-medium',
                    index === 0
                      ? 'bg-[#EDF3FF] text-[#1754E8]'
                      : 'text-[#667085]',
                  ].join(' ')}
                >
                  {item}
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 flex-1 p-3.5 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-[#101828] sm:text-base">
                  Faculty overview
                </h3>

                <p className="mt-1 text-[10px] text-[#667085] sm:text-xs">
                  Teaching schedule, academic tasks and student support
                </p>
              </div>

              <span className="hidden rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1754E8] sm:inline-flex">
                Sample interface
              </span>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              {facultyMetrics.map((metric) => (
                <FacultyMetricCard key={metric.label} metric={metric} />
              ))}
            </div>

            <div className="mt-4 grid gap-3.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(190px,0.75fr)]">
              <div className="rounded-xl border border-[#DEE5EF] bg-white p-4 shadow-[0_5px_18px_rgba(16,24,40,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-semibold text-[#101828] sm:text-sm">
                      Today&apos;s schedule
                    </h4>

                    <p className="mt-0.5 text-[9px] text-[#8A95A6] sm:text-[10px]">
                      Tuesday · 4 August
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold text-[#1754E8]">
                    View timetable
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {schedule.map((item) => (
                    <div
                      key={`${item.time}-${item.course}`}
                      className="flex gap-2.5"
                    >
                      <div className="w-10 shrink-0 pt-2 text-right text-[9px] font-semibold text-[#667085]">
                        {item.time}
                      </div>

                      <div
                        className={[
                          'min-w-0 flex-1 rounded-lg border-l-2 px-3 py-2',
                          item.status === 'Live now'
                            ? 'border-[#1754E8] bg-[#EDF3FF]'
                            : 'border-[#AFC4E8] bg-[#F7F9FC]',
                        ].join(' ')}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-[10px] font-semibold text-[#101828] sm:text-[11px]">
                            {item.course}
                          </p>

                          {item.status === 'Live now' && (
                            <span className="shrink-0 rounded-full bg-[#1754E8] px-2 py-0.5 text-[8px] font-bold uppercase text-white">
                              Live
                            </span>
                          )}
                        </div>

                        <p className="mt-1 truncate text-[9px] text-[#667085]">
                          {item.location} · {item.section}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="rounded-xl bg-[#101D38] p-4 text-white shadow-[0_8px_24px_rgba(16,29,56,0.15)]">
                  <div className="flex items-center gap-2">
                    <AlertTriangle
                      className="h-4 w-4 text-[#FFCB69]"
                      aria-hidden="true"
                    />

                    <h4 className="text-xs font-semibold">
                      Action required
                    </h4>
                  </div>

                  <p className="mt-2 text-[10px] leading-4 text-[#C4CDDD]">
                    Three students in CS-301 have attendance below the required
                    threshold.
                  </p>

                  <div className="mt-3 flex items-center gap-1 text-[10px] font-semibold text-white">
                    Review students
                    <ArrowRight className="h-3 w-3" aria-hidden="true" />
                  </div>
                </div>

                <div className="rounded-xl border border-[#DEE5EF] bg-white p-4 shadow-[0_5px_18px_rgba(16,24,40,0.04)]">
                  <h4 className="text-xs font-semibold text-[#101828]">
                    Pending work
                  </h4>

                  <div className="mt-3 space-y-2.5">
                    {pendingWork.map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between gap-3"
                      >
                        <span className="text-[10px] text-[#667085]">
                          {item.label}
                        </span>

                        <span className="rounded-md bg-[#F2F4F7] px-2 py-0.5 text-[10px] font-bold text-[#101828]">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="hidden rounded-xl border border-[#D6E2F5] bg-[#F7FAFF] p-4 sm:block">
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-4 w-4 text-[#1754E8]"
                      aria-hidden="true"
                    />

                    <h4 className="text-[11px] font-semibold text-[#101828]">
                      CampusOS AI
                    </h4>
                  </div>

                  <p className="mt-2 text-[9px] leading-4 text-[#667085]">
                    Summarise student questions or prepare a course announcement
                    draft.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#DEE5EF] bg-white px-4 py-2.5 text-center text-[9px] text-[#7C889A]">
          Fictional CampusOS product preview
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="overflow-hidden bg-[#F7F9FD] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="homepage-hero-heading"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.25fr)] lg:gap-12 xl:gap-20">
          <div className="max-w-[620px]">
            <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-4 text-[11px] font-bold uppercase tracking-[0.12em] text-[#1754E8] sm:text-xs">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Connected technology for higher education
            </div>

            <h1
              id="homepage-hero-heading"
              className="mt-6 text-balance text-4xl font-bold leading-[1.06] tracking-[-0.045em] text-[#101A32] sm:text-5xl lg:text-[58px] xl:text-[64px]"
            >
              Run your institution from one connected platform
            </h1>

            <p className="mt-6 max-w-[590px] text-pretty text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
              CampusOS connects academics, admissions, finance, people, campus
              operations and student services through secure, role-aware
              institutional workspaces.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-7 py-3 text-[15px] font-semibold text-white shadow-[0_12px_28px_rgba(23,84,232,0.25)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F9FD]"
              >
                Book a personalised demo

                <ArrowRight
                  className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>

              <Link
                href="/platform"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#C9D3E1] bg-white px-7 py-3 text-[15px] font-semibold text-[#101828] transition-colors hover:border-[#1754E8] hover:bg-[#F2F6FF] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F9FD]"
              >
                Explore the platform
              </Link>
            </div>

            <Link
              href="/login"
              className="group mt-6 inline-flex min-h-10 items-center gap-2 rounded-lg text-sm font-semibold text-[#1754E8] transition-colors hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
            >
              Student or staff sign in

              <ArrowRight
                className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>

            <div
              className="mt-9 grid gap-x-6 gap-y-3 border-t border-[#DDE4EE] pt-6 text-sm text-[#475467] sm:grid-cols-2"
              aria-label="CampusOS platform characteristics"
            >
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#078A57]"
                    strokeWidth={2.3}
                    aria-hidden="true"
                  />

                  <span>{point}</span>
                </div>
              ))}
            </div>

            <p className="mt-5 max-w-[560px] text-xs leading-5 text-[#7C889A]">
              Platform capabilities may vary by institution, deployment and
              configured modules.
            </p>
          </div>

          <FacultyDashboardPreview />
        </div>
      </div>
    </section>
  );
}