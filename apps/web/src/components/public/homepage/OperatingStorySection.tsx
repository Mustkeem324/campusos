import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Layers3,
  ShieldCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';

const operatingStories = [
  {
    number: '01',
    eyebrow: 'ONE OPERATING CONTEXT',
    title: 'See how work moves across the institution',
    description:
      'Connect responsible teams, records, approvals and communication without flattening the differences between academic and administrative work.',
    icon: Layers3,
    points: [
      'Institution and campus context remains visible',
      'Role boundaries stay explicit',
      'Cross-team handoffs can be reviewed',
    ],
  },
  {
    number: '02',
    eyebrow: 'DECISION-READY WORKSPACES',
    title: 'Bring the next accountable action forward',
    description:
      'Dashboards should prioritise exceptions, approvals and follow-up instead of filling the screen with decorative numbers.',
    icon: FileCheck2,
    points: [
      'Action queues before vanity reporting',
      'Clear ownership and status language',
      'Honest empty and unavailable states',
    ],
  },
  {
    number: '03',
    eyebrow: 'GOVERNED IMPROVEMENT',
    title: 'Improve operations without losing trust',
    description:
      'Use authorised evidence to refine workflows while preserving tenant isolation, auditability and institution-defined responsibilities.',
    icon: ShieldCheck,
    points: [
      'Server-verified role and tenant context',
      'Reviewable operational history',
      'Phased change with accountable owners',
    ],
  },
] as const;

export function OperatingStorySection() {
  return (
    <section className="border-b border-[#DDE5EF] bg-white px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24" aria-labelledby="operating-story-heading">
      <div className="mx-auto max-w-[1360px]">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.24fr)] lg:items-end">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-[#EDF3FF] px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
              <Workflow className="h-4 w-4" aria-hidden="true" />
              Designed around institutional work
            </div>
            <h2 id="operating-story-heading" className="mt-6 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.04em] text-[#101D38] sm:text-4xl lg:text-5xl">
              A premium interface is useful only when it makes responsibility clearer
            </h2>
          </div>

          <div className="max-w-2xl lg:justify-self-end">
            <p className="text-base leading-8 text-[#5F6C7B] sm:text-lg">
              CampusOS combines restrained enterprise design with operational depth: clear hierarchy, real context, accessible controls and a visible path from information to action.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/platform"
                className="group inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#101D38] px-5 text-sm font-bold text-white transition hover:bg-[#172A4D] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40"
              >
                Explore platform design
                <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
              </Link>
              <Link
                href="/roles"
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#C7D3E2] bg-white px-5 text-sm font-bold text-[#101D38] transition hover:border-[#95ACCB] hover:bg-[#F8FAFC] focus-visible:ring-2 focus-visible:ring-[#1754E8]/40"
              >
                <UsersRound className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />
                View role experiences
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {operatingStories.map((story) => {
            const Icon = story.icon;
            return (
              <article key={story.number} className="group flex min-h-[390px] flex-col rounded-[26px] border border-[#D9E3F0] bg-[#F7F9FC] p-6 shadow-[0_16px_40px_rgba(16,29,56,0.05)] transition hover:-translate-y-1 hover:border-[#B7C9E1] hover:shadow-[0_24px_54px_rgba(16,29,56,0.09)] sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <span className="text-5xl font-extrabold tracking-[-0.06em] text-[#D7E2F1]">{story.number}</span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-white text-[#1754E8] shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                </div>

                <p className="mt-8 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#1754E8]">{story.eyebrow}</p>
                <h3 className="mt-3 text-xl font-extrabold leading-7 tracking-[-0.025em] text-[#101D38]">{story.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#5F6C7B]">{story.description}</p>

                <ul className="mt-6 space-y-3 border-t border-[#D9E3F0] pt-5">
                  {story.points.map((point) => (
                    <li key={point} className="flex items-start gap-3 text-sm leading-6 text-[#536175]">
                      <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#078A57]" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
