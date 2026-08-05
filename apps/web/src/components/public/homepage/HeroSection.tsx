import Link from 'next/link';
import {
  ArrowRight,
  Bell,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  Search,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';

const trustPoints = [
  'Secure multi-tenant architecture',
  'Role-aware institutional workspaces',
  'Responsive web experience',
  'English and Hindi support',
] as const;

const metrics = [
  {
    label: 'Teaching schedule',
    value: '4 classes',
    detail: 'Next at 11:00 AM',
    icon: CalendarDays,
  },
  {
    label: 'Academic actions',
    value: '18 items',
    detail: 'Assignments and attendance',
    icon: FileCheck2,
  },
  {
    label: 'Student support',
    value: '5 cases',
    detail: 'Awaiting faculty review',
    icon: UsersRound,
  },
] as const;

const schedule = [
  {
    time: '09:00',
    title: 'CS-301 · Data Structures',
    detail: 'Computer Lab 4 · Year 2',
    status: 'Completed',
  },
  {
    time: '11:00',
    title: 'CS-305 · Design of Algorithms',
    detail: 'Lecture Hall A · Year 2',
    status: 'Live now',
  },
  {
    time: '14:00',
    title: 'CS-312 · Database Systems',
    detail: 'Room B-204 · Year 3',
    status: 'Upcoming',
  },
] as const;

function ProductCanvas() {
  return (
    <div
      className="relative mx-auto w-full max-w-[860px]"
      aria-label="Fictional CampusOS product interface preview"
    >
      <div className="relative overflow-hidden rounded-[28px] border border-[#C7D4E5] bg-white shadow-[0_36px_90px_rgba(16,29,56,0.18)]">
        <div className="flex min-h-16 items-center justify-between border-b border-[#DDE5EF] bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#1754E8] text-sm font-extrabold text-white shadow-[0_8px_20px_rgba(23,84,232,0.25)]">
              C
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-extrabold text-[#101D38] sm:text-sm">
                Faculty command centre
              </p>
              <p className="mt-0.5 truncate text-[9px] font-bold uppercase tracking-[0.11em] text-[#8A95A6]">
                Fictional product preview
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#667085]" aria-hidden="true">
            <div className="hidden min-h-9 items-center gap-2 rounded-xl border border-[#DDE5EF] bg-[#F7F9FC] px-3 text-[10px] font-semibold sm:flex">
              <Search className="h-3.5 w-3.5" />
              Search institution
            </div>
            <Bell className="h-4 w-4" />
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#101D38] text-[10px] font-extrabold text-white">
              PS
            </div>
          </div>
        </div>

        <div className="grid min-h-[500px] md:grid-cols-[176px_minmax(0,1fr)]">
          <aside className="hidden border-r border-[#DDE5EF] bg-[#101D38] p-4 text-white md:block" aria-hidden="true">
            <div className="rounded-2xl border border-[#32496E] bg-[#172A4D] p-3.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9EB6D8]">Institution</p>
              <p className="mt-2 text-xs font-bold">CampusOS Demo University</p>
              <p className="mt-1 text-[10px] text-[#AFC0D8]">Faculty workspace</p>
            </div>

            <nav className="mt-5 space-y-1">
              {['Overview', 'My courses', 'Timetable', 'Attendance', 'Assignments', 'Students', 'Resources'].map((item, index) => (
                <div
                  key={item}
                  className={`rounded-xl px-3 py-2.5 text-[11px] font-semibold ${
                    index === 0 ? 'bg-[#1754E8] text-white' : 'text-[#C3CEE0]'
                  }`}
                >
                  {item}
                </div>
              ))}
            </nav>
          </aside>

          <div className="min-w-0 bg-[#F3F6FA] p-4 sm:p-5 lg:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">Tuesday · 4 August</p>
                <h2 className="mt-1.5 text-lg font-extrabold tracking-[-0.02em] text-[#101D38] sm:text-xl">
                  Good morning, Dr. Priya
                </h2>
                <p className="mt-1 text-xs text-[#667085]">Teaching, academic actions and student support in one view.</p>
              </div>
              <span className="inline-flex min-h-8 items-center gap-2 self-start rounded-full border border-[#BDD0EC] bg-white px-3 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#1754E8]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Role verified
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {metrics.map((metric) => {
                const Icon = metric.icon;
                return (
                  <article key={metric.label} className="rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#7C899B]">{metric.label}</p>
                        <p className="mt-2 text-lg font-extrabold text-[#101D38]">{metric.value}</p>
                      </div>
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    </div>
                    <p className="mt-2 text-[10px] text-[#7C899B]">{metric.detail}</p>
                  </article>
                );
              })}
            </div>

            <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(200px,0.75fr)]">
              <section className="rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_8px_24px_rgba(16,29,56,0.04)]" aria-label="Fictional schedule preview">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-[#101D38]">Today&apos;s teaching sequence</p>
                    <p className="mt-1 text-[10px] text-[#7C899B]">Priority order, context and status</p>
                  </div>
                  <CalendarDays className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                </div>

                <div className="mt-4 space-y-2.5">
                  {schedule.map((item) => (
                    <div key={`${item.time}-${item.title}`} className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
                      <p className="pt-3 text-right text-[9px] font-bold text-[#7C899B]">{item.time}</p>
                      <div className={`rounded-xl border-l-[3px] px-3 py-2.5 ${
                        item.status === 'Live now'
                          ? 'border-[#1754E8] bg-[#EDF3FF]'
                          : 'border-[#AFC4E8] bg-[#F7F9FC]'
                      }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-[11px] font-extrabold text-[#101D38]">{item.title}</p>
                            <p className="mt-1 truncate text-[9px] text-[#667085]">{item.detail}</p>
                          </div>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wide ${
                            item.status === 'Live now'
                              ? 'bg-[#1754E8] text-white'
                              : 'bg-white text-[#667085]'
                          }`}>
                            {item.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="space-y-4">
                <section className="rounded-2xl bg-[#101D38] p-4 text-white shadow-[0_16px_36px_rgba(16,29,56,0.18)]" aria-label="Fictional action priority preview">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[#8FB4FF]" aria-hidden="true" />
                    <p className="text-xs font-extrabold">Decision focus</p>
                  </div>
                  <p className="mt-3 text-[10px] leading-5 text-[#C5D0E1]">
                    Review attendance exceptions before the next class begins.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-extrabold text-white">
                    Open exception list
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </section>

                <section className="rounded-2xl border border-[#DCE4EE] bg-white p-4 shadow-[0_8px_24px_rgba(16,29,56,0.04)]">
                  <p className="text-xs font-extrabold text-[#101D38]">Operating principle</p>
                  <div className="mt-3 space-y-2.5">
                    {['Show accountable work', 'Surface exceptions early', 'Keep role context visible'].map((item) => (
                      <div key={item} className="flex items-start gap-2 text-[10px] leading-4 text-[#667085]">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#078A57]" aria-hidden="true" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#DDE5EF] bg-white px-5 py-3 text-center text-[9px] font-semibold uppercase tracking-[0.11em] text-[#8A95A6]">
          Fictional interface shown for product illustration only
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      className="overflow-hidden border-b border-[#DDE5EF] bg-[#F4F7FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="homepage-hero-heading"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:gap-12 xl:gap-20">
          <div className="max-w-[640px]">
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] sm:text-xs">
              <GraduationCap className="h-4 w-4" aria-hidden="true" />
              Institutional operating system
            </div>

            <h1
              id="homepage-hero-heading"
              className="mt-7 text-balance text-4xl font-extrabold leading-[1.02] tracking-[-0.052em] text-[#101A32] sm:text-5xl lg:text-[60px] xl:text-[70px]"
            >
              Make the whole institution feel intelligently connected
            </h1>

            <p className="mt-7 max-w-[610px] text-pretty text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
              CampusOS brings academics, admissions, finance, people, campus operations and student services into secure, role-aware workspaces designed around real institutional responsibility.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="group inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-7 py-3.5 text-[15px] font-bold text-white shadow-[0_16px_34px_rgba(23,84,232,0.24)] transition hover:bg-[#103FC2] focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F4F7FB]"
              >
                Book a personalised demo
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>

              <Link
                href="/platform"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-[#C7D3E2] bg-white px-7 py-3.5 text-[15px] font-bold text-[#101D38] shadow-[0_8px_22px_rgba(16,29,56,0.05)] transition hover:border-[#95ACCB] hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40"
              >
                Explore the platform
                <LayoutDashboard className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-9 grid gap-3 sm:grid-cols-2">
              {trustPoints.map((point) => (
                <div key={point} className="flex items-start gap-2.5 text-sm leading-6 text-[#536175]">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078A57]" aria-hidden="true" />
                  <span>{point}</span>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-[#D7E0EB] pt-6 text-xs font-semibold text-[#667085]">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                Governance-aware design
              </span>
              <span className="inline-flex items-center gap-2">
                <BookOpenCheck className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                Built for higher education
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                Phased implementation
              </span>
            </div>
          </div>

          <ProductCanvas />
        </div>
      </div>
    </section>
  );
}
