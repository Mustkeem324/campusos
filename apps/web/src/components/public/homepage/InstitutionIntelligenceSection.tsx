import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BellRing,
  BookOpenCheck,
  CheckCircle2,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LockKeyhole,
  Smartphone,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react';

const weeklyPulse = [
  { label: 'Mon', value: 42 },
  { label: 'Tue', value: 48 },
  { label: 'Wed', value: 45 },
  { label: 'Thu', value: 57 },
  { label: 'Fri', value: 61 },
  { label: 'Sat', value: 68 },
  { label: 'Sun', value: 74 },
] as const;

const operatingSignals = [
  {
    label: 'Academic participation',
    value: 86,
    detail: 'Attendance, submissions and teaching activity',
    icon: GraduationCap,
  },
  {
    label: 'Student support SLA',
    value: 91,
    detail: 'Cases reviewed inside the expected response window',
    icon: UsersRound,
  },
  {
    label: 'Finance follow-up',
    value: 74,
    detail: 'Invoices and exceptions with accountable next actions',
    icon: WalletCards,
  },
  {
    label: 'Resource engagement',
    value: 68,
    detail: 'Library, learning and verified opportunity activity',
    icon: BookOpenCheck,
  },
] as const;

const decisionQueue = [
  {
    title: 'Attendance exceptions',
    owner: 'Faculty and academic office',
    status: 'Review today',
    icon: FileCheck2,
  },
  {
    title: 'Student support cases',
    owner: 'Advisors and department leads',
    status: '5 need attention',
    icon: UsersRound,
  },
  {
    title: 'Approval requests',
    owner: 'Authorised institutional reviewers',
    status: 'Within SLA',
    icon: CheckCircle2,
  },
] as const;

const featureLaunchpad = [
  {
    number: '01',
    title: 'Personalised dashboards',
    description:
      'Role-authorised widgets, saved layouts and a clear personal workspace for every institutional responsibility.',
    outcome: 'Less navigation, faster daily focus',
    href: '/platform',
    cta: 'Explore dashboards',
    icon: LayoutDashboard,
  },
  {
    number: '02',
    title: 'Governed actions and approvals',
    description:
      'Structured requests, reviewer queues, comments, audit history and safe approval boundaries across campus workflows.',
    outcome: 'Accountable decisions without hidden hand-offs',
    href: '/platform',
    cta: 'See workflow design',
    icon: CheckCircle2,
  },
  {
    number: '03',
    title: 'Reports and export studio',
    description:
      'Role-scoped reporting, clear filters and controlled exports for academic, finance, library and student-success teams.',
    outcome: 'Readable evidence for every review meeting',
    href: '/resources/guides',
    cta: 'Browse reporting guides',
    icon: BarChart3,
  },
  {
    number: '04',
    title: 'Verified student benefits',
    description:
      'A searchable opportunity directory with official sources, transparent eligibility notes and safe application guidance.',
    outcome: 'Useful opportunities without unsupported promises',
    href: '/student-benefits',
    cta: 'Open student benefits',
    icon: Sparkles,
  },
  {
    number: '05',
    title: 'Security and account control',
    description:
      'MFA, password recovery, session visibility, secure logout and privacy-aware access controls for every account.',
    outcome: 'Security that remains understandable to users',
    href: '/security',
    cta: 'Review security',
    icon: LockKeyhole,
  },
  {
    number: '06',
    title: 'Mobile PWA and notifications',
    description:
      'Installable mobile access, responsive workflows and notification controls designed for low-friction campus use.',
    outcome: 'Important work stays visible on any device',
    href: '/demo',
    cta: 'See the experience',
    icon: Smartphone,
  },
] as const;

function WeeklyPulseChart() {
  return (
    <figure className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_16px_44px_rgba(16,29,56,0.07)] sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
            <LineChart className="h-4 w-4" aria-hidden="true" />
            Weekly operating pulse
          </div>
          <h3 className="mt-2 text-xl font-extrabold tracking-[-0.025em] text-[#101D38]">
            One trend, clearly explained
          </h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#667085]">
            A simple seven-day trend helps leaders see whether accountable work is moving forward before opening detailed records.
          </p>
        </div>
        <span className="inline-flex min-h-8 items-center self-start rounded-full border border-[#C7D7EE] bg-[#F4F7FB] px-3 text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#526175]">
          Fictional product preview
        </span>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-[#E1E8F1] bg-[#F7F9FC] p-4 sm:p-5">
        <svg
          viewBox="0 0 560 220"
          role="img"
          aria-labelledby="weekly-pulse-title weekly-pulse-description"
          className="h-auto w-full"
        >
          <title id="weekly-pulse-title">Fictional weekly operating pulse chart</title>
          <desc id="weekly-pulse-description">
            The illustrated score rises from 42 on Monday to 74 on Sunday, with a small decline on Wednesday.
          </desc>

          {[40, 80, 120, 160].map((y) => (
            <line
              key={y}
              x1="36"
              y1={y}
              x2="536"
              y2={y}
              stroke="#DCE5F0"
              strokeWidth="1"
              strokeDasharray="5 7"
            />
          ))}

          <path
            d="M48 166 L126 151 L204 158 L282 126 L360 115 L438 96 L516 78"
            fill="none"
            stroke="#1754E8"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {[
            [48, 166],
            [126, 151],
            [204, 158],
            [282, 126],
            [360, 115],
            [438, 96],
            [516, 78],
          ].map(([x, y], index) => (
            <g key={`${x}-${y}`}>
              <circle cx={x} cy={y} r="8" fill="#FFFFFF" stroke="#1754E8" strokeWidth="4" />
              <text
                x={x}
                y="205"
                textAnchor="middle"
                fill="#667085"
                fontSize="13"
                fontWeight="700"
              >
                {weeklyPulse[index]?.label}
              </text>
            </g>
          ))}
        </svg>

        <div className="mt-2 grid grid-cols-2 gap-3 border-t border-[#DCE5F0] pt-4 sm:grid-cols-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A96A8]">Start</p>
            <p className="mt-1 text-lg font-extrabold text-[#101D38]">42</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A96A8]">Latest</p>
            <p className="mt-1 text-lg font-extrabold text-[#101D38]">74</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A96A8]">Direction</p>
            <p className="mt-1 text-sm font-extrabold text-[#078A57]">Improving</p>
          </div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#8A96A8]">Purpose</p>
            <p className="mt-1 text-sm font-extrabold text-[#101D38]">Find exceptions early</p>
          </div>
        </div>
      </div>
    </figure>
  );
}

export function InstitutionIntelligenceSection() {
  return (
    <section
      className="border-y border-[#DDE5EF] bg-[#F3F6FA] px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
      aria-labelledby="institution-intelligence-heading"
    >
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-end">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              Clear institutional intelligence
            </div>
            <h2
              id="institution-intelligence-heading"
              className="mt-6 max-w-[760px] text-balance text-3xl font-extrabold leading-tight tracking-[-0.045em] text-[#101A32] sm:text-4xl lg:text-5xl"
            >
              Understand what changed, why it matters and who should act next
            </h2>
          </div>
          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-pretty text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
              The homepage now demonstrates a calmer reporting pattern: one primary trend, a small set of explained signals and a short decision queue. Detailed records stay inside their authorised workspaces.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {['One graph at a time', 'Text explanation beside every visual', 'No fabricated production claims'].map((item) => (
                <span
                  key={item}
                  className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#D5DFEC] bg-white px-3 text-[11px] font-bold text-[#526175]"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#078A57]" aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(340px,0.7fr)]">
          <WeeklyPulseChart />

          <aside className="rounded-[24px] border border-[#D8E2EF] bg-[#101D38] p-5 text-white shadow-[0_20px_54px_rgba(16,29,56,0.2)] sm:p-6" aria-label="Fictional decision queue preview">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#9DB8E5]">
                  <BellRing className="h-4 w-4" aria-hidden="true" />
                  Decision queue
                </div>
                <h3 className="mt-2 text-xl font-extrabold">Only the next actions</h3>
              </div>
              <span className="rounded-full border border-[#36517A] bg-[#172A4D] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[#BFD2EF]">
                3 priorities
              </span>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#C5D0E1]">
              Summaries remain useful because each item names its responsible team and expected next step.
            </p>

            <div className="mt-6 space-y-3">
              {decisionQueue.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="rounded-2xl border border-[#31496D] bg-[#172A4D] p-4">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#22406F] text-[#AFCBFF]">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="text-sm font-extrabold text-white">{item.title}</h4>
                          <span className="rounded-full bg-white/10 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.07em] text-[#D8E5F8]">
                            {item.status}
                          </span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-[#AFC0D8]">{item.owner}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 rounded-2xl border border-[#36517A] bg-[#0E1A30] p-4">
              <p className="text-xs font-extrabold text-white">Design rule</p>
              <p className="mt-2 text-xs leading-5 text-[#AFC0D8]">
                A graph should support a decision, not decorate the page. Every visual here includes a plain-language explanation and an explicit fictional-preview label.
              </p>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {operatingSignals.map((signal) => {
            const Icon = signal.icon;
            return (
              <article key={signal.label} className="rounded-2xl border border-[#D8E2EF] bg-white p-5 shadow-[0_10px_30px_rgba(16,29,56,0.05)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798]">{signal.label}</p>
                    <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38]">{signal.value}%</p>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E7EDF5]" role="progressbar" aria-valuenow={signal.value} aria-valuemin={0} aria-valuemax={100} aria-label={signal.label}>
                  <div className="h-full rounded-full bg-[#1754E8]" style={{ width: `${signal.value}%` }} />
                </div>
                <p className="mt-3 text-xs leading-5 text-[#667085]">{signal.detail}</p>
              </article>
            );
          })}
        </div>

        <div className="mt-16 sm:mt-20">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-end">
            <div>
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                Feature launchpad
              </div>
              <h2 className="mt-5 text-balance text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#101A32] sm:text-4xl">
                More capability, organised into six easy choices
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-7 text-[#5F6C7B] lg:justify-self-end">
              These additions make key CampusOS capabilities discoverable from the homepage without turning the page into a crowded feature catalogue.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {featureLaunchpad.map((feature) => {
              const Icon = feature.icon;
              return (
                <article key={feature.number} className="group flex min-h-full flex-col rounded-[22px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] transition hover:-translate-y-1 hover:border-[#B9CBE2] hover:shadow-[0_18px_44px_rgba(16,29,56,0.1)] motion-reduce:transform-none sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#8A96A8]">{feature.number}</span>
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EDF3FF] text-[#1754E8] transition group-hover:bg-[#1754E8] group-hover:text-white">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-extrabold tracking-[-0.025em] text-[#101D38]">{feature.title}</h3>
                  <p className="mt-3 flex-1 text-sm leading-6 text-[#667085]">{feature.description}</p>
                  <div className="mt-5 rounded-xl border border-[#E0E7F0] bg-[#F7F9FC] p-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-[#7B8798]">Practical outcome</p>
                    <p className="mt-1.5 text-xs font-bold leading-5 text-[#334155]">{feature.outcome}</p>
                  </div>
                  <Link
                    href={feature.href}
                    className="mt-5 inline-flex min-h-11 items-center justify-between gap-3 rounded-xl border border-[#C7D6E8] bg-white px-4 text-sm font-extrabold text-[#1754E8] transition hover:border-[#1754E8] hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/30"
                  >
                    {feature.cta}
                    <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
