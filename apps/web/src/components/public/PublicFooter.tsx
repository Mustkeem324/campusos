import type { ElementType } from 'react';
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

type FooterLink = {
  label: string;
  href: string;
};

type FooterGroup = {
  id: string;
  title: string;
  links: readonly FooterLink[];
};

type TrustItem = {
  id: string;
  label: string;
  icon: ElementType;
};

const footerGroups: readonly FooterGroup[] = [
  {
    id: 'platform',
    title: 'Platform',
    links: [
      { label: 'Platform overview', href: '/platform' },
      { label: 'Academics', href: '/platform/academics' },
      { label: 'Admissions', href: '/platform/admissions' },
      { label: 'Finance', href: '/platform/finance' },
      { label: 'Campus Operations', href: '/platform/operations' },
      { label: 'People and HR', href: '/platform/people' },
      { label: 'Communication', href: '/platform/communication' },
      { label: 'Analytics', href: '/platform/analytics' },
      { label: 'AI Assistant', href: '/platform/ai' },
    ],
  },
  {
    id: 'solutions',
    title: 'Solutions',
    links: [
      { label: 'Universities', href: '/solutions/universities' },
      {
        label: 'Autonomous Colleges',
        href: '/solutions/autonomous-colleges',
      },
      { label: 'College Groups', href: '/solutions/college-groups' },
      {
        label: 'Engineering Institutions',
        href: '/solutions/engineering-colleges',
      },
      {
        label: 'Medical Institutions',
        href: '/solutions/medical-colleges',
      },
      {
        label: 'Online and Distance Learning',
        href: '/solutions/online-learning',
      },
    ],
  },
  {
    id: 'roles',
    title: 'Roles',
    links: [
      { label: 'Leadership', href: '/roles/leadership' },
      { label: 'Administrators', href: '/roles/administrators' },
      { label: 'Faculty', href: '/roles/faculty' },
      { label: 'Students', href: '/roles/students' },
      { label: 'Parents and Guardians', href: '/roles/parents' },
      { label: 'Finance Teams', href: '/roles/finance' },
    ],
  },
  {
    id: 'resources',
    title: 'Resources',
    links: [
      { label: 'Guides', href: '/resources/guides' },
      { label: 'Blog', href: '/resources/blog' },
      { label: 'Webinars', href: '/resources/webinars' },
      { label: 'Product Blueprint', href: '/blueprint' },
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
      { label: 'Book a Demo', href: '/demo' },
      { label: 'Pricing', href: '/pricing' },
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

const trustItems: readonly TrustItem[] = [
  {
    id: 'higher-education',
    label: 'Designed for higher education',
    icon: GraduationCap,
  },
  {
    id: 'role-aware',
    label: 'Role-aware workspaces',
    icon: ShieldCheck,
  },
  {
    id: 'regional',
    label: 'Region-aware configuration',
    icon: Globe2,
  },
];

function FooterNavigationGroup({ group }: { group: FooterGroup }) {
  return (
    <nav aria-labelledby={`footer-${group.id}-heading`}>
      <h2
        id={`footer-${group.id}-heading`}
        className="text-xs font-bold uppercase tracking-[0.12em] text-[#344054]"
      >
        {group.title}
      </h2>

      <ul className="mt-5 space-y-3">
        {group.links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="inline-flex min-h-6 items-center rounded-sm text-sm leading-6 text-[#5F6C7B] transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BrandOverview() {
  return (
    <div className="sm:col-span-2 lg:col-span-2">
      <Link
        href="/"
        aria-label="CampusOS homepage"
        className="inline-flex rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
      >
        <Logo className="h-9 w-auto" showText />
      </Link>

      <p className="mt-6 max-w-[350px] text-sm leading-7 text-[#5F6C7B]">
        A connected university operating system for academic, administrative,
        financial and student-service workflows.
      </p>

      <div
        className="mt-7 space-y-3"
        aria-label="CampusOS platform characteristics"
      >
        {trustItems.map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.id}
              className="flex items-center gap-2.5 text-sm text-[#475467]"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EDF3FF] text-[#1754E8]">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>

              <span>{item.label}</span>
            </div>
          );
        })}
      </div>

      <Link
        href="/demo"
        className="group mt-8 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,84,232,0.2)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
      >
        Book a personalised demo

        <ArrowRight
          className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

function ContactPanel() {
  return (
    <div className="mt-14 overflow-hidden rounded-3xl border border-[#D8E2EF] bg-[#F7F9FC]">
      <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
        <div className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#C8D8F5] bg-white text-[#1754E8]">
              <Building2 className="h-5 w-5" aria-hidden="true" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#101828]">
                Evaluating CampusOS for your institution?
              </h2>

              <p className="mt-2 max-w-[680px] text-sm leading-6 text-[#5F6C7B]">
                Discuss your institutional structure, workflows, deployment
                requirements and implementation priorities with our team.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center border-t border-[#D8E2EF] bg-[#101D38] p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Headphones className="h-4 w-4 text-[#8CB2FF]" aria-hidden="true" />
            Institutional consultation
          </div>

          <p className="mt-2 text-sm leading-6 text-[#BBC7D9]">
            Start a conversation about your institution’s requirements.
          </p>

          <Link
            href="/contact"
            className="group mt-5 inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#101D38] transition-colors hover:bg-[#EEF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#101D38]"
          >
            Contact our team

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PublicFooter() {
  const currentYear = new Date().getFullYear();
  const buildVersion = process.env.NEXT_PUBLIC_APP_VERSION;

  return (
    <footer className="border-t border-[#DEE5EF] bg-white">
      <div className="mx-auto max-w-[1360px] px-4 pb-8 pt-16 sm:px-6 sm:pt-20 lg:px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-7">
          <BrandOverview />

          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:col-span-2 sm:grid-cols-3 lg:col-span-5 lg:grid-cols-5">
            {footerGroups.map((group) => (
              <FooterNavigationGroup key={group.id} group={group} />
            ))}
          </div>
        </div>

        <ContactPanel />

        <div className="mt-12 border-t border-[#DEE5EF] pt-8">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm text-[#5F6C7B]">
                © {currentYear} CampusOS Platform. All rights reserved.
              </p>

              <p className="mt-2 max-w-[620px] text-xs leading-5 text-[#8A95A6]">
                Product capabilities, module availability and deployment
                options may vary by institution, region and configuration.
              </p>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
              <div className="flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 text-[#667085]"
                  aria-hidden="true"
                />

                <RegionSelector compact />
              </div>

              <Link
                href="/status"
                className="inline-flex min-h-9 items-center gap-2 rounded-lg text-sm font-medium text-[#5F6C7B] transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
              >
                <span
                  className="h-2 w-2 rounded-full bg-[#078A57]"
                  aria-hidden="true"
                />
                View system status
              </Link>

              <button
                type="button"
                data-cookie-preferences-trigger
                className="inline-flex min-h-9 w-fit items-center rounded-lg text-sm font-medium text-[#5F6C7B] transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
              >
                Cookie preferences
              </button>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-5 border-t border-[#EEF1F5] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <nav aria-label="Legal information">
              <ul className="flex flex-wrap gap-x-5 gap-y-3">
                {legalLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-xs font-medium text-[#667085] transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#8A95A6]">
              {buildVersion && <span>Build {buildVersion}</span>}

              <span className="inline-flex items-center gap-1.5">
                <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
                Secure institutional access
              </span>

              <Link
                href="/resources/guides"
                className="inline-flex items-center gap-1.5 font-medium text-[#667085] transition-colors hover:text-[#1754E8]"
              >
                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                Help resources
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}