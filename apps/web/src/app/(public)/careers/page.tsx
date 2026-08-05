import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Layers3,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';

import { CareersExplorer } from '@/components/careers/CareersExplorer';
import { getCareerOpenings } from '@/lib/careers-service';

export const metadata: Metadata = {
  title: 'Careers at CampusOS',
  description: 'Explore approved roles and learn how CampusOS approaches product, engineering, implementation and customer success work.',
};

const principles = [
  {
    title: 'Institution-first decisions',
    description: 'We design around accountable academic and administrative workflows, not novelty for its own sake.',
    icon: GraduationCap,
  },
  {
    title: 'Security is product work',
    description: 'Privacy, tenant isolation and safe defaults are part of design and delivery—not a final checklist.',
    icon: ShieldCheck,
  },
  {
    title: 'Clear, accessible experiences',
    description: 'Complex systems should remain understandable, keyboard usable and resilient across devices.',
    icon: Layers3,
  },
  {
    title: 'Responsible automation',
    description: 'AI and automation should support human decisions, preserve evidence and respect institutional policy.',
    icon: BrainCircuit,
  },
];

const candidateExperience = [
  'Clear role scope and published requirements',
  'Role-relevant evaluation rather than unrelated tasks',
  'Reasonable communication about next steps',
  'Privacy-aware handling of application information',
];

const hiringSteps = [
  { number: '01', title: 'Application review', description: 'The recruitment team reviews the application against the published requirements.' },
  { number: '02', title: 'Role conversation', description: 'A structured discussion covers the role, experience, expectations and questions.' },
  { number: '03', title: 'Relevant assessment', description: 'Selected roles may include a focused work sample or technical discussion.' },
  { number: '04', title: 'Final review', description: 'The team completes references, approvals and written communication as applicable.' },
];

export default function CareersPage() {
  const openings = getCareerOpenings();
  const includesDemoOpenings = openings.some((opening) => opening.isDemo);

  return (
    <div className="bg-white">
      <section className="relative overflow-hidden border-b border-[#DEE5EF] bg-[#101D38] text-white">
        <div className="absolute inset-y-0 right-0 hidden w-[46%] border-l border-white/10 bg-[#152746] lg:block" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1360px] gap-14 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#44689D] bg-[#182C4E] px-4 py-2 text-sm font-semibold text-[#DCE8FB]">
              <UsersRound className="h-4 w-4 text-[#8CB2FF]" aria-hidden="true" />
              Careers at CampusOS
            </div>
            <h1 className="mt-7 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Build technology that helps education work better
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#C6D2E4] sm:text-xl">
              Join product, engineering, design, implementation and customer teams working on secure, accessible systems for universities and colleges.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="#open-roles"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#2A65EB] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101D38]"
              >
                Explore open roles
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact?category=careers"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#4A648A] bg-transparent px-6 py-3 text-sm font-bold text-white transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#101D38]"
              >
                Contact recruitment
              </Link>
            </div>
            <p className="mt-5 text-sm leading-6 text-[#AEBED4]">
              Only approved openings are published. CampusOS does not request payment, passwords or banking credentials during an initial application.
            </p>
          </div>

          <div className="relative rounded-3xl border border-[#334C72] bg-[#132542] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.28)] sm:p-7">
            <div className="flex items-center justify-between border-b border-[#324967] pb-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8CB2FF]">Candidate experience</p>
                <h2 className="mt-2 text-xl font-bold">What you can expect</h2>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#1D3963] text-[#A9C5FF]">
                <HeartHandshake className="h-5 w-5" aria-hidden="true" />
              </div>
            </div>
            <ul className="mt-6 space-y-4">
              {candidateExperience.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-6 text-[#D7E0EC]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#69D5A5]" aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7 rounded-2xl border border-[#35527A] bg-[#0E1B31] p-4">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#8CB2FF]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-bold text-white">Application privacy</p>
                  <p className="mt-1 text-sm leading-6 text-[#AEBED4]">
                    Candidate data should be used only for recruitment, secured by role-based access and retained according to an approved policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {includesDemoOpenings && (
        <div className="border-b border-[#F0D5A8] bg-[#FFF8E8]">
          <div className="mx-auto max-w-[1240px] px-4 py-3 text-sm font-medium text-[#7A4A00] sm:px-6 lg:px-8">
            Demo mode is active. Example openings are labelled and must not be represented as live vacancies.
          </div>
        </div>
      )}

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1754E8]">How we aim to work</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#101D38] sm:text-4xl">
                Thoughtful systems, clear ownership and dependable delivery
              </h2>
              <p className="mt-5 text-base leading-7 text-[#5F6B7A]">
                CampusOS work spans academic operations, institutional finance, student experience and platform reliability. Teams should make careful decisions, document trade-offs and protect the people represented in the data.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              {principles.map((principle) => {
                const Icon = principle.icon;
                return (
                  <article key={principle.title} className="rounded-2xl border border-[#DEE5EF] bg-[#F9FBFD] p-6">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C9D8F0] bg-white text-[#1754E8]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-lg font-bold text-[#101D38]">{principle.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#667085]">{principle.description}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <CareersExplorer openings={openings} />

      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#1754E8]">Hiring process</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-[#101D38] sm:text-4xl">A clear process with role-relevant evaluation</h2>
            <p className="mt-4 text-base leading-7 text-[#5F6B7A]">
              The exact process depends on the role. Published job details should explain material assessment requirements before candidates invest significant time.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {hiringSteps.map((step) => (
              <article key={step.number} className="rounded-2xl border border-[#DEE5EF] bg-white p-6 shadow-[0_10px_28px_rgba(16,29,56,0.05)]">
                <span className="text-sm font-extrabold text-[#1754E8]">{step.number}</span>
                <h3 className="mt-5 text-lg font-bold text-[#101D38]">{step.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#667085]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[#DEE5EF] bg-[#F7F9FC] py-20">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-3xl border border-[#CAD7E8] bg-white lg:grid-cols-[1.25fr_0.75fr]">
            <div className="p-7 sm:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3FF] text-[#1754E8]">
                <MessageSquareText className="h-6 w-6" aria-hidden="true" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-[#101D38] sm:text-3xl">Need recruitment support?</h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[#5F6B7A]">
                Ask about an approved opening, application accessibility or the candidate process. Do not send passwords, payment details or unrelated sensitive records.
              </p>
            </div>
            <div className="flex flex-col justify-center bg-[#101D38] p-7 sm:p-10">
              <Link
                href="/contact?category=careers"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-[#101D38] transition hover:bg-[#EEF3FA]"
              >
                Contact the team
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-4 text-center text-xs leading-5 text-[#AEBED4]">
                Contacting recruitment does not guarantee an interview or employment outcome.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
