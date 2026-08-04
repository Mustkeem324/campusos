'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CheckSquare,
  HelpCircle,
  LogOut,
  RefreshCw,
  RotateCcw,
  Settings2,
  ShieldAlert,
  UserRoundCog,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../lib/auth-store';

interface DemoEnvironmentBannerProps {
  onRestartTutorial?: () => void;
}

const roleName = (role: string) => role
  ? role.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
  : 'Student';

export function DemoEnvironmentBanner({ onRestartTutorial }: DemoEnvironmentBannerProps) {
  const { currentSession, setSession } = useAuthStore();
  const router = useRouter();
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState<React.CSSProperties>();

  const isDemoUser = currentSession?.email?.includes('.demo@')
    || currentSession?.tenantId === '00000000-0000-0000-0000-000000000000';

  const closeOptions = () => {
    setIsOptionsOpen(false);
    requestAnimationFrame(() => triggerRef.current?.focus());
  };

  useEffect(() => {
    if (!isOptionsOpen) return;
    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      setMenuPosition({ position: 'fixed', top: Math.max(8, Math.min(rect.bottom + 8, window.innerHeight - 236)), right: Math.max(12, window.innerWidth - rect.right), zIndex: 'var(--z-dropdown)' });
    };
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) closeOptions();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { closeOptions(); return; }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
      const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
      if (!items.length) return;
      event.preventDefault();
      const activeIndex = items.indexOf(document.activeElement as HTMLElement);
      const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : event.key === 'ArrowDown' ? (activeIndex + 1 + items.length) % items.length : (activeIndex - 1 + items.length) % items.length;
      items[nextIndex].focus();
    };
    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus());
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOptionsOpen]);

  useEffect(() => {
    if (!isMobileSheetOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileSheetOpen(false);
      if (event.key !== 'Tab') return;
      const focusable = sheetRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    requestAnimationFrame(() => sheetRef.current?.querySelector<HTMLElement>('button, a[href]')?.focus());
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previousFocus?.focus();
    };
  }, [isMobileSheetOpen]);

  if (!isDemoUser) return null;

  const personaName = currentSession?.name || 'Demo User';
  const personaRole = roleName(currentSession?.role || '');

  const handleExitDemo = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST' }); } catch { /* local cleanup still applies */ }
    setSession(null);
    router.push('/login');
  };

  const menuItems = (mobile = false) => <>
    {mobile && <Link href="/login" className="demo-sheet-action demo-sheet-primary" onClick={() => setIsMobileSheetOpen(false)}><UserRoundCog size={16} /> Switch Persona</Link>}
    {onRestartTutorial && <button type="button" className={mobile ? 'demo-sheet-action' : 'demo-menu-item'} role={mobile ? undefined : 'menuitem'} onClick={() => { mobile ? setIsMobileSheetOpen(false) : setIsOptionsOpen(false); onRestartTutorial(); }}><RotateCcw size={16} /> Restart Tour</button>}
    <Link href="/demo/how-it-works" className={mobile ? 'demo-sheet-action' : 'demo-menu-item'} role={mobile ? undefined : 'menuitem'} onClick={() => mobile ? setIsMobileSheetOpen(false) : setIsOptionsOpen(false)}><HelpCircle size={16} /> How CampusOS Works</Link>
    <Link href="/demo/scenarios" className={mobile ? 'demo-sheet-action' : 'demo-menu-item'} role={mobile ? undefined : 'menuitem'} onClick={() => mobile ? setIsMobileSheetOpen(false) : setIsOptionsOpen(false)}><CheckSquare size={16} /> Demo Checklist</Link>
    <Link href="/demo/progress" className={mobile ? 'demo-sheet-action' : 'demo-menu-item'} role={mobile ? undefined : 'menuitem'} onClick={() => mobile ? setIsMobileSheetOpen(false) : setIsOptionsOpen(false)}><RefreshCw size={16} /> Reset Demo Progress</Link>
    {!mobile && <button type="button" className="demo-menu-item demo-menu-exit" role="menuitem" onClick={handleExitDemo}><LogOut size={16} /> Exit Demo</button>}
    {mobile && <button type="button" className="demo-sheet-action demo-sheet-exit" onClick={handleExitDemo}><LogOut size={16} /> Exit Demo</button>}
  </>;

  return <>
    <section className="demo-environment-banner" role="region" aria-label="Demo environment controls">
      <div className="demo-banner-notice">
        <ShieldAlert aria-hidden="true" size={18} />
        <div><strong>Demo Environment</strong><span>All records shown here are fictional.</span></div>
      </div>
      <div className="demo-banner-persona" aria-label={`Current demo persona: ${personaName}, ${personaRole}`}>
        <span>{personaName}</span><span aria-hidden="true">·</span><span>{personaRole}</span>
      </div>
      <div className="demo-banner-actions">
        <Link href="/login" className="demo-banner-button demo-switch-persona"><UserRoundCog size={16} /> Switch Persona</Link>
        <button ref={triggerRef} type="button" className="demo-banner-button demo-options-trigger" aria-haspopup="menu" aria-expanded={isOptionsOpen} onClick={() => setIsOptionsOpen((open) => !open)}><Settings2 size={16} /> Demo Options</button>
        <button type="button" className="demo-banner-button demo-exit" onClick={handleExitDemo}><LogOut size={16} /> Exit Demo</button>
        <button type="button" className="demo-banner-button demo-mobile-options" aria-haspopup="dialog" onClick={() => setIsMobileSheetOpen(true)}><Settings2 size={16} /> Demo Options</button>
      </div>
    </section>

    {isOptionsOpen && typeof document !== 'undefined' && createPortal(
      <div ref={menuRef} className="demo-options-menu" style={menuPosition} role="menu" aria-label="Demo Options">{menuItems()}</div>, document.body,
    )}
    {isMobileSheetOpen && typeof document !== 'undefined' && createPortal(
      <div className="demo-options-sheet-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMobileSheetOpen(false); }}>
        <div ref={sheetRef} className="demo-options-sheet" role="dialog" aria-modal="true" aria-label="Demo Options Sheet">
          <div className="demo-sheet-heading"><div><strong>Demo Environment</strong><span>{personaName} · {personaRole}</span></div><button type="button" aria-label="Close Demo Options" onClick={() => setIsMobileSheetOpen(false)}><X size={20} /></button></div>
          <div className="demo-sheet-items">{menuItems(true)}</div>
        </div>
      </div>, document.body,
    )}
  </>;
}
