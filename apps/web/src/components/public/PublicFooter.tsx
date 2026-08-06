import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Building2,
  Globe2,
  GraduationCap,
  Headphones,
  LockKeyhole,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

import { Logo } from '@/components/ui/Logo';
import { RegionSelector } from './RegionSelector';

type FooterLink = { label: string; href: string };
type FooterGroup = { id: string; title: string; links: readonly FooterLink[] };

const footerGroups: readonly FooterGroup[] = [
  {
    id: 'platform',
    title: 'Platform',
    links: [
      { label: 'Platform overview', href: '/platform' },
      { label: 'Student Information System', href: '/platform/student-information-system' },
      { label: 'Academic Management', href: '/platform/academics' },
      { label: 'Admissions', href: '/platform/admissions' },
      { label: 'Finance', href: '/platform/finance' },
      { label: 'Campus Operations', href: '/platform/campus-operations' },
      { label: 'Analytics', href: '/platform/analytics' },
    ],
  },
  {
    id: 'solutions',
    title: 'Solutions',
    links: [
      { label: 'Public Universities', href: '/solutions/public-universities' },
      { label: 'Private Universities', href: '/solutions/private-universities' },
      { label: 'Autonomous Colleges', href: '/solutions/autonomous-colleges' },
      { label: 'Engineering Colleges', href: '/solutions/engineering-colleges' },
      { label: 'Medical Institutions', href: '/solutions/medical-institutions' },
      { label: 'Multi-Campus Operations', href: '/solutions/multi-campus' },
    ],
  },
  {
    id: 'roles',
    title: 'Roles',
    links: [
      { label: 'President / Vice Chancellor', href: '/roles/president' },
      { label: 'Registrar', href: '/roles/registrar' },
      { label: 'Faculty', href: '/roles/faculty' },
      { label: 'Student', href: '/roles/student' },
      { label: 'Parent or Guardian', href: '/roles/parent' },
      { label: 'Finance', href: '/roles/finance' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      { label: 'Guides', href: '/resources/guides' },
      { label: 'Blog', href: '/resources/blog' },
      { label: 'Implementation Guide', href: '/resources/implementation-guide' },
      { label: 'Documentation', href: '/developers' },
      { label: 'Security Centre', href: '/security' },
      { label: 'System Status', href: '/status' },
    ],
  },
  {
    id: 'company',
    title: 'Company',
    links: [
      { label: 'About CampusOS', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Contact Sales', href: '/contact?intent=sales' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'Institution Signup', href: '/signup/institution' },
      { label: 'Sign In', href: '/login' },
    ],
  },
];

const legalLinks: readonly FooterLink[] = [
  { label: 'Privacy', href: '/legal/privacy' },
  { label: 'Terms', href: '/legal/terms' },
  { label: 'Cookies', href: '/legal/cookies' },
  { label: 'Data Processing Agreement', href: '/legal/dpa' },
];

function Group({ group }: { group: FooterGroup }) {
  return (
    <nav aria-labelledby={`footer-${group.id}-heading`}>
      <h2 id={`footer-${group.id}-heading`} className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#344054]">{group.title}</h2>
      <ul className="mt-5 space-y-3">
        {group.links.map((link) => <li key={`${link.label}-${link.href}`}><Link href={link.href} className="text-sm leading-6 text-[#5F6C7B] transition hover:text-[#1754E8]">{link.label}</Link></li>)}
      </ul>
    </nav>
  );
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const buildVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <footer className="border-t border-[#DEE5EF] bg-white">
      <div className="mx-auto max-w-[1360px] px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[minmax(260px,1.2fr)_minmax(0,3.8fr)]">
          <div>
            <Link href="/" aria-label="CampusOS homepage" className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"><Logo className="h-9 w-auto" showText /></Link>
            <p className="mt-6 max-w-[350px] text-sm leading-7 text-[#5F6C7B]">A connected higher-education operating platform for academic, administrative, financial and student-service workflows.</p>
            <div className="mt-7 space-y-3 text-sm text-[#475467]">
              <div className="flex items-center gap-2.5"><GraduationCap className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Designed for higher education</div>
              <div className="flex items-center gap-2.5"><ShieldCheck className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Role-aware institutional access</div>
              <div className="flex items-center gap-2.5"><Globe2 className="h-4 w-4 text-[#1754E8]" aria-hidden="true" />Region-aware configuration</div>
            </div>
            <Link href="/contact?intent=sales" className="group mt-8 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(23,84,232,0.2)] transition hover:bg-[#103FC2]">
              Request a consultation <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
            {footerGroups.map((group) => <Group key={group.id} group={group} />)}
          </div>
        </div>

        <div className="mt-14 overflow-hidden rounded-3xl border border-[#D8E2EF] bg-[#F7F9FC]">
          <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C8D8F5] bg-white text-[#1754E8]"><Building2 className="h-5 w-5" aria-hidden="true" /></span>
                <div><h2 className="text-lg font-extrabold text-[#101828]">Evaluating CampusOS for your institution?</h2><p className="mt-2 max-w-[680px] text-sm leading-6 text-[#5F6C7B]">Share your current systems, priority workflows, deployment requirements and implementation constraints through the production contact channel.</p></div>
              </div>
            </div>
            <div className="flex flex-col justify-center border-t border-[#D8E2EF] bg-[#101D38] p-6 sm:p-8 lg:border-l lg:border-t-0">
              <div className="flex items-center gap-2 text-sm font-bold text-white"><Headphones className="h-4 w-4 text-[#8CB2FF]" aria-hidden="true" />Institutional consultation</div>
              <Link href="/contact" className="group mt-5 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl bg-white px-5 text-sm font-extrabold text-[#101D38] transition hover:bg-[#EEF3FA]">Contact our team <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></Link>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[#DEE5EF] pt-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div><p className="text-sm text-[#5F6C7B]">© {currentYear} CampusOS Platform. All rights reserved.</p><p className="mt-2 max-w-[620px] text-xs leading-5 text-[#8A95A6]">Product capabilities, module availability and deployment options may vary by institution, region and configuration.</p></div>
            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#667085]" aria-hidden="true" /><RegionSelector compact /></div>
              <Link href="/status" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-[#5F6C7B] hover:text-[#1754E8]"><span className="h-2 w-2 rounded-full bg-[#078A57]" aria-hidden="true" />View system status</Link>
              <button type="button" data-cookie-preferences-trigger className="text-left text-sm font-semibold text-[#5F6C7B] hover:text-[#1754E8]">Cookie preferences</button>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-5 border-t border-[#EEF1F5] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Legal information"><ul className="flex flex-wrap gap-x-5 gap-y-3">{legalLinks.map((link) => <li key={link.href}><Link href={link.href} className="text-xs font-semibold text-[#667085] hover:text-[#1754E8]">{link.label}</Link></li>)}</ul></nav>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A95A6]">
              {buildVersion && <span>Build {buildVersion}</span>}
              <span className="inline-flex items-center gap-1.5"><LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />Secure institutional access</span>
              <Link href="/resources/help" className="inline-flex items-center gap-1.5 font-semibold text-[#667085] hover:text-[#1754E8]"><BookOpen className="h-3.5 w-3.5" aria-hidden="true" />Help resources</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
