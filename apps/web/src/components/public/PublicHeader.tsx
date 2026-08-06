'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
  Building2,
  ChevronDown,
  CircleDot,
  LayoutGrid,
  LogIn,
  Menu,
  ShieldCheck,
  UsersRound,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Logo } from '@/components/ui/Logo';
import { useDialogFocusTrap } from '@/components/ui/useDialogFocusTrap';
import { menuDescriptionForHref } from './public-page-data';
import { RegionSelector } from './RegionSelector';
import { menuGroups } from './site-data';

const navIcons: Record<string, LucideIcon> = {
  Platform: LayoutGrid,
  Solutions: Building2,
  Roles: UsersRound,
  Resources: BookOpen,
  Security: ShieldCheck,
  Pricing: BadgeDollarSign,
};

function isActivePath(pathname: string, href: string) {
  return pathname === href || (href !== '/' && pathname.startsWith(`${href}/`));
}

function menuId(label: string) {
  return `public-menu-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
}

export function PublicHeader() {
  const pathname = usePathname();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState<string | null>(null);
  const activeItem = menuGroups.find((item) => item.label === activeMenu) ?? null;

  useEffect(() => {
    setActiveMenu(null);
    setMobileOpen(false);
    setMobileSection(null);
  }, [pathname]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setActiveMenu(null);
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [mobileOpen]);

  const close = () => {
    setActiveMenu(null);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-[80] border-b border-[#DDE5F0] bg-white/95 shadow-[0_8px_28px_rgba(16,29,56,0.04)] backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1640px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" onClick={close} aria-label="CampusOS homepage" className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]">
          <Logo className="h-9 w-9 shrink-0" showText={false} />
          <span className="hidden text-xl font-extrabold tracking-[-0.035em] text-[#101D38] sm:block">CampusOS</span>
        </Link>

        <nav aria-label="Primary navigation" className="ml-4 hidden min-w-0 flex-1 items-stretch xl:flex">
          {menuGroups.map((item) => {
            const expanded = activeMenu === item.label;
            const active = isActivePath(pathname, item.href);
            const Icon = navIcons[item.label] ?? LayoutGrid;
            return (
              <button
                key={item.label}
                type="button"
                aria-expanded={expanded}
                aria-controls={menuId(item.label)}
                onClick={() => setActiveMenu((current) => current === item.label ? null : item.label)}
                className={`group relative inline-flex min-w-0 items-center gap-2 px-4 text-sm font-extrabold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1754E8] ${expanded || active ? 'text-[#1754E8]' : 'text-[#475467] hover:text-[#1754E8]'}`}
              >
                <Icon className="h-4 w-4 shrink-0 opacity-75" aria-hidden="true" />
                <span>{item.label}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                {(expanded || active) && <span className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#1754E8]" aria-hidden="true" />}
              </button>
            );
          })}
        </nav>

        <div className="ml-auto hidden shrink-0 items-center gap-2 xl:flex">
          <RegionSelector />
          <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-extrabold text-[#344054] transition hover:bg-[#F4F7FB] hover:text-[#1754E8]">Sign In</Link>
          <Link href="/contact?intent=sales" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#B9C9DE] bg-white px-4 text-sm font-extrabold text-[#1754E8] transition hover:border-[#8EACD1] hover:bg-[#F7F9FD]">Contact Sales</Link>
          <Link href="/signup/institution" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#1754E8] px-5 text-sm font-extrabold text-white shadow-[0_12px_26px_rgba(23,84,232,0.22)] transition hover:bg-[#103FC2]">Institution Signup</Link>
        </div>

        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open navigation menu" className="ml-auto inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D6DFEB] text-[#344054] transition hover:bg-[#F4F7FB] hover:text-[#1754E8] xl:hidden">
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      {activeItem && <DesktopMegaMenu item={activeItem} pathname={pathname} close={() => setActiveMenu(null)} />}
      {mobileOpen && <MobileMenu pathname={pathname} expandedSection={mobileSection} setExpandedSection={setMobileSection} close={close} />}
    </header>
  );
}

function DesktopMegaMenu({ item, pathname, close }: { item: (typeof menuGroups)[number]; pathname: string; close: () => void }) {
  const Icon = navIcons[item.label] ?? LayoutGrid;
  const linkCount = item.groups.reduce((count, group) => count + group.links.length, 0);
  const columns = item.groups.length >= 4 ? 'grid-cols-4' : item.groups.length === 3 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <>
      <button type="button" aria-label="Close expanded navigation" onClick={close} className="fixed inset-x-0 bottom-0 top-[72px] z-40 hidden cursor-default bg-[#101828]/25 backdrop-blur-[1px] xl:block" />
      <section id={menuId(item.label)} aria-label={`${item.label} navigation`} className="absolute inset-x-0 top-full z-50 hidden max-h-[calc(100dvh-72px)] overflow-y-auto border-b border-[#D8E2EF] bg-white shadow-[0_28px_70px_rgba(16,29,56,0.16)] xl:block">
        <div className="mx-auto grid max-w-[1640px] grid-cols-[290px_minmax(0,1fr)] gap-8 px-8 py-8">
          <aside className="flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-[#D5E0EE] bg-[#F7F9FD]">
            <div className="bg-[#101D38] p-6 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#1754E8]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9EBBEE]">{item.label} overview</p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.03em]">Explore {item.label.toLowerCase()}</h2>
              <p className="mt-3 text-sm leading-6 text-[#C7D3E4]">{menuDescriptionForHref(item.href)}</p>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Sections" value={item.groups.length} />
                <Stat label="Pages" value={linkCount} />
              </div>
              <p className="mt-5 rounded-2xl border border-[#D9E3F0] bg-white p-4 text-xs leading-5 text-[#667085]">Each destination explains scope, workflow, outcomes, governance and implementation context without fabricated customer data.</p>
              <Link href={item.href} onClick={close} className="group mt-auto inline-flex min-h-12 items-center justify-between rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white transition hover:bg-[#103FC2]">
                View complete overview <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </aside>

          <div className={`grid min-w-0 gap-x-6 gap-y-7 ${columns}`}>
            {item.groups.map((group) => (
              <section key={group.title} className="min-w-0">
                <h3 className="border-b border-[#E1E7EF] pb-3 text-[11px] font-extrabold uppercase tracking-[0.11em] text-[#344054]">{group.title}</h3>
                <ul className="mt-3 space-y-1.5">
                  {group.links.map(([label, href]) => <li key={href}><DetailedMenuLink label={label} href={href} active={isActivePath(pathname, href)} close={close} /></li>)}
                </ul>
              </section>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

function DetailedMenuLink({ label, href, active, close }: { label: string; href: string; active: boolean; close: () => void }) {
  return (
    <Link href={href} onClick={close} aria-current={active ? 'page' : undefined} className={`group flex min-w-0 items-start gap-3 rounded-xl border px-3 py-3 transition ${active ? 'border-[#B8CCEF] bg-[#EDF3FF]' : 'border-transparent hover:border-[#D9E3F0] hover:bg-[#F7F9FC]'}`}>
      <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-[#1754E8] text-white' : 'bg-[#EEF2F7] text-[#667085] group-hover:text-[#1754E8]'}`}><CircleDot className="h-3.5 w-3.5" aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className={`block text-[13px] font-extrabold leading-5 ${active ? 'text-[#1754E8]' : 'text-[#344054]'}`}>{label}</span><span className="mt-1 block line-clamp-2 text-[11px] leading-[1.55] text-[#7C8798]">{menuDescriptionForHref(href)}</span></span>
    </Link>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-[#D9E3F0] bg-white p-3"><p className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#8A95A6]">{label}</p><p className="mt-1 text-xl font-extrabold text-[#101D38]">{value}</p></div>;
}

function MobileMenu({ pathname, expandedSection, setExpandedSection, close }: { pathname: string; expandedSection: string | null; setExpandedSection: (label: string | null) => void; close: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  useDialogFocusTrap({ active: true, containerRef: dialogRef, initialFocusRef: closeButtonRef });

  return (
    <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Primary navigation" className="fixed inset-0 z-[120] flex flex-col bg-white outline-none xl:hidden">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[#DDE5F0] px-4 sm:px-6">
        <Link href="/" onClick={close} className="flex items-center gap-2.5"><Logo className="h-9 w-9" showText={false} /><span className="text-xl font-extrabold text-[#101D38]">CampusOS</span></Link>
        <button ref={closeButtonRef} type="button" onClick={close} aria-label="Close navigation menu" className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#344054] hover:bg-[#F2F4F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"><X className="h-5 w-5" aria-hidden="true" /></button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="border-b border-[#E4E9F0] bg-[#F7F9FC] px-4 py-4 sm:px-6"><RegionSelector /></div>
        <nav className="space-y-3 px-4 py-5 sm:px-6" aria-label="Mobile primary navigation">
          {menuGroups.map((item) => {
            const Icon = navIcons[item.label] ?? LayoutGrid;
            const expanded = expandedSection === item.label;
            const active = isActivePath(pathname, item.href);
            return (
              <section key={item.label} className={`overflow-hidden rounded-2xl border ${expanded || active ? 'border-[#B8CCEF]' : 'border-[#DDE5F0]'}`}>
                <button type="button" aria-expanded={expanded} onClick={() => setExpandedSection(expanded ? null : item.label)} className={`flex min-h-16 w-full items-center justify-between gap-4 px-4 py-3 text-left ${expanded || active ? 'bg-[#F4F7FC]' : 'bg-white'}`}>
                  <span className="flex min-w-0 items-center gap-3"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-[#1754E8] text-white' : 'bg-[#EDF3FF] text-[#1754E8]'}`}><Icon className="h-5 w-5" aria-hidden="true" /></span><span className="min-w-0"><span className="block text-[15px] font-extrabold text-[#101D38]">{item.label}</span><span className="mt-0.5 block truncate text-[11px] text-[#7C8798]">{menuDescriptionForHref(item.href)}</span></span></span>
                  <ChevronDown className={`h-5 w-5 shrink-0 text-[#667085] transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>

                {expanded && (
                  <div className="border-t border-[#E1E7EF] bg-[#FAFBFD] px-3 py-4">
                    <Link href={item.href} onClick={close} className="mb-5 flex min-h-12 items-center justify-between rounded-xl bg-[#101D38] px-4 text-sm font-extrabold text-white">View {item.label.toLowerCase()} overview <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                    <div className="space-y-6">
                      {item.groups.map((group) => (
                        <section key={group.title}>
                          <h3 className="px-2 text-[10px] font-extrabold uppercase tracking-[0.11em] text-[#7C889A]">{group.title}</h3>
                          <ul className="mt-2 space-y-1.5">{group.links.map(([label, href]) => <li key={href}><DetailedMenuLink label={label} href={href} active={isActivePath(pathname, href)} close={close} /></li>)}</ul>
                        </section>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </div>

      <div className="shrink-0 border-t border-[#DDE5F0] bg-white px-4 py-4 sm:px-6">
        <div className="grid gap-2 sm:grid-cols-3">
          <Link href="/login" onClick={close} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C9D3E1] text-sm font-extrabold text-[#101828]"><LogIn className="h-4 w-4" aria-hidden="true" />Sign In</Link>
          <Link href="/contact?intent=sales" onClick={close} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1754E8] text-sm font-extrabold text-[#1754E8]">Contact Sales</Link>
          <Link href="/signup/institution" onClick={close} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white">Institution Signup</Link>
        </div>
      </div>
    </div>
  );
}
