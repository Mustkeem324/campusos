import Link from 'next/link';
import { ArrowRight, BriefcaseBusiness } from 'lucide-react';

export function CareersFooterBanner() {
  return (
    <section className="border-t border-[#DCE4EF] bg-[#0B1731] text-white" aria-label="CampusOS careers">
      <div className="mx-auto flex max-w-[1360px] flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#9FC0FF]">
            <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#9FC0FF]">Careers at CampusOS</p>
            <h2 className="mt-1 text-xl font-bold">Build dependable technology for higher education</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#C6D2E4]">
              Explore approved openings across product, engineering, implementation and customer success.
            </p>
          </div>
        </div>

        <Link
          href="/careers"
          className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#0B1731] transition hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#0B1731]"
        >
          View careers
          <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
