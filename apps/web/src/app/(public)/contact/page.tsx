import Link from 'next/link';
import { ArrowRight, Building2, LockKeyhole, ShieldCheck } from 'lucide-react';

import { ContactForm } from '@/components/public/ContactForm';

export const metadata = {
  title: 'Contact CampusOS | Institutional Enquiries',
  description: 'Contact CampusOS about platform evaluation, implementation, security, partnerships or support.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage({ searchParams }: { searchParams?: { intent?: string } }) {
  return (
    <main className="bg-white text-[#101828]">
      <section className="border-b border-[#DDE5F0] bg-[#F4F7FB] px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1320px]">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.6fr)] lg:items-end">
            <div className="max-w-[850px]">
              <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#C9DAF8] bg-white px-4 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]"><Building2 className="h-4 w-4" aria-hidden="true" />Contact CampusOS</div>
              <h1 className="mt-7 text-balance text-4xl font-extrabold leading-[1.04] tracking-[-0.05em] text-[#101D38] sm:text-5xl lg:text-[62px]">Start with your institution’s real requirements</h1>
              <p className="mt-6 max-w-[790px] text-base leading-8 text-[#5F6C7B] sm:text-lg">Tell us what you are evaluating, implementing or trying to resolve. We route the request using the institution, role and enquiry context you provide.</p>
            </div>

            <div className="rounded-[24px] border border-[#D5E0EE] bg-white p-6 shadow-[0_16px_42px_rgba(16,29,56,0.06)]">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]" aria-hidden="true" /><div><p className="text-sm font-extrabold text-[#101D38]">Public enquiry channel</p><p className="mt-2 text-xs leading-5 text-[#667085]">Do not submit student records, passwords, payment credentials or other sensitive institutional data through this form.</p></div></div>
              <div className="mt-4 flex items-start gap-3 border-t border-[#E5EAF1] pt-4"><LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]" aria-hidden="true" /><p className="text-xs leading-5 text-[#667085]">Existing users who need account access should use the secure <Link href="/login" className="font-bold text-[#1754E8]">sign-in page</Link>.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:px-6 sm:py-18 lg:px-8 lg:py-20"><div className="mx-auto max-w-[1320px]"><ContactForm initialIntent={searchParams?.intent} /></div></section>

      <section className="border-t border-[#DDE5F0] bg-[#101D38] px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1320px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-extrabold">Need to evaluate product scope before contacting us?</p><p className="mt-1 text-sm text-[#B9C6D9]">Review the platform and security information first, then return with specific questions.</p></div><div className="flex flex-wrap gap-3"><Link href="/platform" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-[#101D38]">Explore platform <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/security" className="inline-flex min-h-11 items-center rounded-xl border border-white/25 px-5 text-sm font-bold text-white">Security centre</Link></div></div>
      </section>
    </main>
  );
}
