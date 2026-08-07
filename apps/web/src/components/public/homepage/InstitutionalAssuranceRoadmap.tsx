import Link from 'next/link';
import { ArrowRight, DatabaseBackup, ShieldCheck } from 'lucide-react';

const roadmapItems = [
  {
    title: 'Backup and recovery',
    status: 'Expanding & verifying',
    description:
      'Recovery procedures and automated restoration capabilities are being expanded and verified. The roadmap focuses on repeatable recovery procedures, restoration checks and clearer operational evidence rather than presenting unverified recovery guarantees.',
    icon: DatabaseBackup,
    href: '/security/data-protection',
  },
  {
    title: 'Institutional privacy controls',
    status: 'Planned',
    description:
      'Additional institution-level configuration for retention, consent and privacy-request workflows is planned. These controls will be introduced as governed configuration rather than being represented as available before implementation and verification are complete.',
    icon: ShieldCheck,
    href: '/trust/privacy',
  },
] as const;

export function InstitutionalAssuranceRoadmap() {
  return (
    <section
      className="border-y border-[#DEE6F0] bg-[#F6F8FB] px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
      aria-labelledby="institutional-assurance-roadmap-heading"
    >
      <div className="mx-auto max-w-[1360px]">
        <div className="grid gap-8 xl:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] xl:items-end">
          <div>
            <span className="inline-flex rounded-lg border border-[#CAD7E7] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#1754E8]">
              Assurance roadmap
            </span>
            <h2
              id="institutional-assurance-roadmap-heading"
              className="mt-5 text-balance text-3xl font-black tracking-[-0.045em] text-[#101828] sm:text-4xl"
            >
              Security maturity should be visible without overstating readiness.
            </h2>
            <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-[#667085]">
              CampusOS distinguishes implemented controls from capabilities that are still being expanded, verified or planned so institutions can evaluate the platform with clear expectations.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {roadmapItems.map(({ title, status, description, icon: Icon, href }) => (
              <article
                key={title}
                className="flex min-h-[250px] flex-col rounded-[16px] border border-[#D7E1EC] bg-white p-5 shadow-[0_10px_28px_rgba(16,29,56,0.045)] sm:p-6"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-[11px] border border-[#D5E1F2] bg-[#F3F7FD] text-[#1754E8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-md border border-[#D8E2EF] bg-[#F8FAFC] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#667085]">
                    {status}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-black tracking-[-0.025em] text-[#101828]">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#667085]">{description}</p>
                <Link
                  href={href}
                  className="group mt-auto inline-flex items-center gap-2 pt-5 text-xs font-black text-[#1754E8]"
                >
                  Review related controls
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
