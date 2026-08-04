'use client';

import type {
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from 'react';
import {
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowRight,
  BadgeDollarSign,
  BookOpen,
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
import { menuGroups } from './site-data';
import { RegionSelector } from './RegionSelector';

const DESKTOP_BREAKPOINT = 1400;

const navIcons: Record<string, LucideIcon> = {
  Platform: LayoutGrid,
  Solutions: BookOpen,
  Roles: UsersRound,
  Resources: BookOpen,
  Security: ShieldCheck,
  Pricing: BadgeDollarSign,
};

function createId(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function isActivePath(pathname: string, href: string) {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavDestinationProps = {
  href: string;
  label: string;
  pathname: string;
  close: () => void;
};

function NavDestination({
  href,
  label,
  pathname,
  close,
}: NavDestinationProps) {
  const active = isActivePath(pathname, href);

  return (
    <Link
      href={href}
      onClick={close}
      aria-current={active ? 'page' : undefined}
      className={[
        'group flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5',
        'text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[#1754E8] focus-visible:ring-offset-2',
        active
          ? 'bg-[#EDF3FF] text-[#1754E8]'
          : 'text-[#475467] hover:bg-[#F5F7FB] hover:text-[#1754E8]',
      ].join(' ')}
    >
      <span
        className={[
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
          'transition-colors',
          active
            ? 'bg-white text-[#1754E8]'
            : 'bg-[#F2F4F7] text-[#667085] group-hover:bg-white group-hover:text-[#1754E8]',
        ].join(' ')}
        aria-hidden="true"
      >
        <CircleDot className="h-3.5 w-3.5" />
      </span>

      <span className="min-w-0">{label}</span>
    </Link>
  );
}

type DesktopMenuPanelProps = {
  activeLabel: string;
  pathname: string;
  menuId: string;
  close: () => void;
};

function DesktopMenuPanel({
  activeLabel,
  pathname,
  menuId,
  close,
}: DesktopMenuPanelProps) {
  const activeItem = menuGroups.find(
    (item) => item.label === activeLabel,
  );

  if (!activeItem) {
    return null;
  }

  const ActiveIcon = navIcons[activeItem.label] ?? LayoutGrid;
  const groupCount = activeItem.groups.length;

  return (
    <>
      <button
        type="button"
        aria-label="Close expanded navigation"
        onClick={close}
        className="fixed inset-x-0 bottom-0 top-[72px] z-40 hidden cursor-default bg-[#101828]/20 min-[1400px]:block"
      />

      <div
        id={menuId}
        aria-label={`${activeItem.label} navigation`}
        className="absolute inset-x-0 top-full z-50 hidden border-b border-[#DDE4EE] bg-white shadow-[0_24px_60px_rgba(16,24,40,0.14)] min-[1400px]:block"
      >
        <div className="mx-auto max-w-[1640px] px-8 py-7">
          <div className="grid gap-8 grid-cols-[260px_minmax(0,1fr)]">
            <div className="rounded-2xl border border-[#D8E2EF] bg-[#F7F9FC] p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#C8D8F5] bg-white text-[#1754E8]">
                <ActiveIcon
                  className="h-5 w-5"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </div>

              <p className="mt-5 text-xs font-bold uppercase tracking-[0.11em] text-[#1754E8]">
                {activeItem.label}
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-[-0.02em] text-[#101828]">
                Explore CampusOS {activeItem.label.toLowerCase()}
              </h2>

              <p className="mt-3 text-sm leading-6 text-[#5F6C7B]">
                Review connected capabilities, institutional workflows and
                role-specific experiences within this area.
              </p>

              <Link
                href={activeItem.href}
                onClick={close}
                className="group mt-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm font-semibold text-[#1754E8] transition-colors hover:text-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
              >
                View complete overview

                <ArrowRight
                  className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </Link>
            </div>

            <div
              className={[
                'grid gap-x-7 gap-y-7',
                groupCount >= 4
                  ? 'grid-cols-4'
                  : groupCount === 3
                    ? 'grid-cols-3'
                    : groupCount === 2
                      ? 'grid-cols-2'
                      : 'grid-cols-1',
              ].join(' ')}
            >
              {activeItem.groups.map((group) => (
                <section key={group.title}>
                  <h3 className="border-b border-[#E4E9F0] pb-3 text-xs font-bold uppercase tracking-[0.1em] text-[#344054]">
                    {group.title}
                  </h3>

                  <ul className="mt-3 space-y-1">
                    {group.links.map(([label, href]) => (
                      <li key={href}>
                        <NavDestination
                          href={href}
                          label={label}
                          pathname={pathname}
                          close={close}
                        />
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

type MobileNavigationProps = {
  open: boolean;
  pathname: string;
  close: () => void;
  dialogRef: RefObject<HTMLDivElement | null>;
  closeButtonRef: RefObject<HTMLButtonElement | null>;
};

function MobileNavigation({
  open,
  pathname,
  close,
  dialogRef,
  closeButtonRef,
}: MobileNavigationProps) {
  const [expandedSection, setExpandedSection] =
    useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setExpandedSection(null);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Primary navigation"
      className="fixed inset-0 z-[100] flex flex-col bg-white min-[1400px]:hidden"
    >
      <div className="flex min-h-16 shrink-0 items-center justify-between border-b border-[#DDE4EE] px-4 sm:px-6">
        <Link
          href="/"
          onClick={close}
          aria-label="CampusOS homepage"
          className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
        >
          <Logo
            className="h-9 w-9 shrink-0"
            showText={false}
          />

          <span className="whitespace-nowrap text-xl font-bold tracking-[-0.03em] text-[#101828]">
            CampusOS
          </span>
        </Link>

        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          aria-label="Close navigation menu"
          className="inline-flex h-11 w-11 items-center justify-center rounded-xl text-[#344054] transition-colors hover:bg-[#F2F4F7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="border-b border-[#E4E9F0] px-4 py-5 sm:px-6">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C889A]">
            Region
          </p>

          <RegionSelector />
        </div>

        <nav
          aria-label="Mobile primary navigation"
          className="px-4 py-4 sm:px-6"
        >
          <div className="space-y-2">
            {menuGroups.map((item) => {
              const Icon = navIcons[item.label] ?? LayoutGrid;
              const expanded = expandedSection === item.label;
              const sectionId = `mobile-menu-${createId(item.label)}`;
              const active = isActivePath(pathname, item.href);

              return (
                <section
                  key={item.label}
                  className={[
                    'overflow-hidden rounded-2xl border bg-white',
                    active
                      ? 'border-[#B8CCEF]'
                      : 'border-[#DFE6F0]',
                  ].join(' ')}
                >
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={sectionId}
                    onClick={() =>
                      setExpandedSection((current) =>
                        current === item.label
                          ? null
                          : item.label,
                      )
                    }
                    className={[
                      'flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3',
                      'text-left transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2',
                      'focus-visible:ring-inset focus-visible:ring-[#1754E8]',
                      expanded || active
                        ? 'bg-[#F7F9FC]'
                        : 'bg-white hover:bg-[#F7F9FC]',
                    ].join(' ')}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={[
                          'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                          active
                            ? 'bg-[#1754E8] text-white'
                            : 'bg-[#EDF3FF] text-[#1754E8]',
                        ].join(' ')}
                      >
                        <Icon
                          className="h-[18px] w-[18px]"
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </span>

                      <span
                        className={[
                          'text-[15px] font-semibold',
                          active
                            ? 'text-[#1754E8]'
                            : 'text-[#101828]',
                        ].join(' ')}
                      >
                        {item.label}
                      </span>
                    </span>

                    <ChevronDown
                      className={[
                        'h-5 w-5 shrink-0 text-[#667085] transition-transform',
                        expanded ? 'rotate-180' : '',
                      ].join(' ')}
                      aria-hidden="true"
                    />
                  </button>

                  {expanded && (
                    <div
                      id={sectionId}
                      className="border-t border-[#E4E9F0] bg-[#FAFBFC] px-3 py-4"
                    >
                      <div className="space-y-6">
                        {item.groups.map((group) => (
                          <div key={group.title}>
                            <p className="px-3 text-[10px] font-bold uppercase tracking-[0.1em] text-[#7C889A]">
                              {group.title}
                            </p>

                            <ul className="mt-2 space-y-1">
                              {group.links.map(([label, href]) => (
                                <li key={href}>
                                  <NavDestination
                                    href={href}
                                    label={label}
                                    pathname={pathname}
                                    close={close}
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>

                      <Link
                        href={item.href}
                        onClick={close}
                        className="group mt-5 flex min-h-12 items-center justify-between gap-3 rounded-xl bg-[#101D38] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#172A4B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
                      >
                        View all {item.label.toLowerCase()}

                        <ArrowRight
                          className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </Link>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="shrink-0 border-t border-[#DDE4EE] bg-white px-4 py-4 sm:px-6">
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            href="/login"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#C9D3E1] bg-white px-4 py-3 text-sm font-semibold text-[#101828] transition-colors hover:bg-[#F5F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            Sign In
          </Link>

          <Link
            href="/demo"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#1754E8] bg-white px-4 py-3 text-sm font-semibold text-[#1754E8] transition-colors hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
          >
            Book a Demo
          </Link>

          <Link
            href="/signup/institution"
            onClick={close}
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#1754E8] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
          >
            Institution Signup
          </Link>
        </div>
      </div>
    </div>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const menuInstanceId = useId().replace(/:/g, '');

  const [openDesktopMenu, setOpenDesktopMenu] =
    useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const mobileDialogRef = useRef<HTMLDivElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);

  const activeDesktopItem = menuGroups.find(
    (item) => item.label === openDesktopMenu,
  );

  const desktopMenuId = activeDesktopItem
    ? `${menuInstanceId}-desktop-menu-${createId(
        activeDesktopItem.label,
      )}`
    : `${menuInstanceId}-desktop-menu`;

  function closeDesktopMenu() {
    setOpenDesktopMenu(null);
  }

  function openMobileMenu() {
    closeDesktopMenu();
    setMobileOpen(true);
  }

  function closeMobileMenu() {
    setMobileOpen(false);

    requestAnimationFrame(() => {
      mobileTriggerRef.current?.focus();
    });
  }

  function handleDesktopMenuKeyDown(
    event: ReactKeyboardEvent<HTMLButtonElement>,
    label: string,
  ) {
    if (event.key !== 'ArrowDown') {
      return;
    }

    event.preventDefault();
    setOpenDesktopMenu(label);

    requestAnimationFrame(() => {
      const panelId = `${menuInstanceId}-desktop-menu-${createId(
        label,
      )}`;

      document
        .getElementById(panelId)
        ?.querySelector<HTMLElement>('a[href]')
        ?.focus();
    });
  }

  useEffect(() => {
    setOpenDesktopMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (
        openDesktopMenu &&
        headerRef.current &&
        !headerRef.current.contains(event.target as Node)
      ) {
        setOpenDesktopMenu(null);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);

    return () => {
      document.removeEventListener(
        'pointerdown',
        handlePointerDown,
      );
    };
  }, [openDesktopMenu]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (event.key !== 'Escape') {
        return;
      }

      if (mobileOpen) {
        closeMobileMenu();
      } else {
        closeDesktopMenu();
      }
    }

    window.addEventListener('keydown', handleKeyboard);

    return () => {
      window.removeEventListener('keydown', handleKeyboard);
    };
  }, [mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow =
      document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      mobileCloseButtonRef.current?.focus();
    });

    const focusableSelector = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    function trapFocus(event: KeyboardEvent) {
      if (
        event.key !== 'Tab' ||
        !mobileDialogRef.current
      ) {
        return;
      }

      const elements = Array.from(
        mobileDialogRef.current.querySelectorAll<HTMLElement>(
          focusableSelector,
        ),
      ).filter((element) => {
        return (
          !element.hasAttribute('disabled') &&
          element.getAttribute('aria-hidden') !== 'true' &&
          element.getClientRects().length > 0
        );
      });

      if (elements.length === 0) {
        return;
      }

      const firstElement = elements[0];
      const lastElement = elements[elements.length - 1];

      if (
        event.shiftKey &&
        document.activeElement === firstElement
      ) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (
        !event.shiftKey &&
        document.activeElement === lastElement
      ) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    document.addEventListener('keydown', trapFocus);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow =
        previousHtmlOverflow;

      document.removeEventListener('keydown', trapFocus);
    };
  }, [mobileOpen]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= DESKTOP_BREAKPOINT) {
        setMobileOpen(false);
      } else {
        setOpenDesktopMenu(null);
      }
    }

    handleResize();

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-[#DDE4EE] bg-white"
    >
      <a
        href="#main-content"
        className="sr-only z-[110] rounded-lg bg-[#1754E8] px-4 py-2.5 text-sm font-semibold text-white focus:fixed focus:left-4 focus:top-3 focus:not-sr-only"
      >
        Skip to main content
      </a>

      <div className="mx-auto max-w-[1640px] px-4 sm:px-6 lg:px-8">
        <div className="grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 min-[1400px]:h-[72px] min-[1400px]:grid-cols-[auto_minmax(0,1fr)_auto]">
          {/* Brand */}
          <div className="flex min-w-0 shrink-0 items-center">
            <Link
              href="/"
              aria-label="CampusOS homepage"
              className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
            >
              <Logo
                className="h-9 w-9 shrink-0"
                showText={false}
              />

              <span className="whitespace-nowrap text-[21px] font-bold tracking-[-0.03em] text-[#101828] sm:text-[22px]">
                CampusOS
              </span>
            </Link>

            <span className="ml-4 hidden whitespace-nowrap border-l border-[#DDE4EE] pl-4 text-xs font-medium text-[#667085] 2xl:inline-block">
              University Operating System
            </span>
          </div>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary navigation"
            className="hidden min-w-0 items-center justify-center min-[1400px]:flex"
          >
            {menuGroups.map((item) => {
              const Icon = navIcons[item.label] ?? LayoutGrid;
              const expanded =
                openDesktopMenu === item.label;
              const active = isActivePath(
                pathname,
                item.href,
              );

              const itemMenuId = `${menuInstanceId}-desktop-menu-${createId(
                item.label,
              )}`;

              return (
                <button
                  key={item.label}
                  type="button"
                  aria-expanded={expanded}
                  aria-haspopup="true"
                  aria-controls={itemMenuId}
                  onClick={() =>
                    setOpenDesktopMenu((current) =>
                      current === item.label
                        ? null
                        : item.label,
                    )
                  }
                  onKeyDown={(event) =>
                    handleDesktopMenuKeyDown(
                      event,
                      item.label,
                    )
                  }
                  className={[
                    'relative flex h-[72px] shrink-0 items-center gap-1.5',
                    'px-2.5 text-sm font-semibold transition-colors 2xl:px-3',
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-inset focus-visible:ring-[#1754E8]',
                    expanded || active
                      ? 'text-[#1754E8]'
                      : 'text-[#475467] hover:text-[#1754E8]',
                  ].join(' ')}
                >
                  <Icon
                    className="hidden h-4 w-4 shrink-0 2xl:block"
                    strokeWidth={2}
                    aria-hidden="true"
                  />

                  <span className="whitespace-nowrap">
                    {item.label}
                  </span>

                  <ChevronDown
                    className={[
                      'h-4 w-4 shrink-0 transition-transform',
                      expanded ? 'rotate-180' : '',
                    ].join(' ')}
                    aria-hidden="true"
                  />

                  {(expanded || active) && (
                    <span
                      className="absolute inset-x-3 bottom-0 h-0.5 rounded-full bg-[#1754E8]"
                      aria-hidden="true"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center justify-end gap-2 min-[1400px]:flex">
            <RegionSelector compact />

            <Link
              href="/login"
              className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold text-[#344054] transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
            >
              Sign In
            </Link>

            <Link
              href="/demo"
              className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-[#C9D3E1] bg-white px-4 py-2.5 text-sm font-semibold text-[#1754E8] transition-colors hover:border-[#1754E8] hover:bg-[#F5F8FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
            >
              Book a Demo
            </Link>

            <Link
              href="/signup/institution"
              className="inline-flex min-h-11 shrink-0 items-center justify-center whitespace-nowrap rounded-xl bg-[#1754E8] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(23,84,232,0.20)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-2"
            >
              Institution Signup
            </Link>
          </div>

          {/* Mobile and tablet actions */}
          <div className="flex shrink-0 items-center justify-end gap-2 min-[1400px]:hidden">
            <Link
              href="/login"
              className="hidden min-h-11 items-center justify-center whitespace-nowrap px-3 text-sm font-semibold text-[#344054] transition-colors hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] sm:inline-flex"
            >
              Sign In
            </Link>

            <Link
              href="/demo"
              className="hidden min-h-11 items-center justify-center whitespace-nowrap rounded-xl border border-[#C9D3E1] px-4 py-2.5 text-sm font-semibold text-[#1754E8] transition-colors hover:bg-[#F5F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] lg:inline-flex"
            >
              Book a Demo
            </Link>

            <button
              ref={mobileTriggerRef}
              type="button"
              onClick={openMobileMenu}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#D8E0EB] text-[#344054] transition-colors hover:border-[#B8C5D6] hover:bg-[#F5F7FB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
            >
              <Menu
                className="h-5 w-5"
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {openDesktopMenu && (
        <DesktopMenuPanel
          activeLabel={openDesktopMenu}
          pathname={pathname}
          close={closeDesktopMenu}
          menuId={desktopMenuId}
        />
      )}

      <MobileNavigation
        open={mobileOpen}
        pathname={pathname}
        close={closeMobileMenu}
        dialogRef={mobileDialogRef}
        closeButtonRef={mobileCloseButtonRef}
      />
    </header>
  );
}