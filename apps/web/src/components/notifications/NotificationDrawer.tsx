'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Check, Clock, ExternalLink, MoreVertical, RefreshCcw, Search, Settings, Trash2, X } from 'lucide-react';

import { useDialogFocusTrap } from '../ui/useDialogFocusTrap';

export type Notification = {
  id: string;
  title: string;
  body: string;
  type: string;
  actionUrl: string | null;
  isRead: boolean;
  snoozedUntil: string | null;
  createdAt: string;
};

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useDialogFocusTrap({ active: isOpen, containerRef: panelRef, initialFocusRef: closeRef });

  const fetchNotifications = useCallback(async (silently = false) => {
    if (!silently) setIsLoading(true);
    setError('');

    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (filter === 'unread') url.searchParams.set('filter', 'unread');
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) throw new Error('Notifications could not be loaded.');

      const data: unknown = await response.json();
      setNotifications(Array.isArray(data) ? (data as Notification[]) : []);
    } catch (caughtError) {
      console.error('Unable to load notifications', caughtError);
      if (!silently) setError(caughtError instanceof Error ? caughtError.message : 'Notifications could not be loaded.');
    } finally {
      if (!silently) setIsLoading(false);
    }
  }, [filter, searchQuery]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchNotifications();
  }, [fetchNotifications, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const interval = window.setInterval(() => void fetchNotifications(true), 30_000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  const markRead = async (id: string) => {
    setNotifications((previous) => previous.map((notification) => (
      notification.id === id ? { ...notification, isRead: true } : notification
    )));
    await fetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, action: 'markRead' }),
      headers: { 'Content-Type': 'application/json' },
    });
    setOpenMenuId(null);
  };

  const markAllRead = async () => {
    setNotifications((previous) => previous.map((notification) => ({ ...notification, isRead: true })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'markAllRead' }),
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const snooze = async (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
    await fetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, action: 'snooze', snoozeUntil: tomorrow.toISOString() }),
      headers: { 'Content-Type': 'application/json' },
    });
    setOpenMenuId(null);
  };

  const deleteNotification = async (id: string) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
    await fetch(`/api/notifications?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    setOpenMenuId(null);
  };

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 cursor-default bg-[#071225]/55 backdrop-blur-[2px]"
          style={{ zIndex: 69 }}
          onClick={onClose}
          aria-label="Close notifications"
        />
      )}

      <aside
        ref={panelRef}
        tabIndex={-1}
        className={`fixed inset-y-0 right-0 flex w-full transform flex-col border-l border-[#D7E1EC] bg-white text-[#172033] shadow-[-28px_0_80px_rgba(7,18,37,0.22)] outline-none transition-transform duration-300 ease-out dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 sm:w-[430px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ zIndex: 'var(--z-drawer)' } as React.CSSProperties}
        aria-hidden={!isOpen}
        aria-label="Notifications"
        role="dialog"
        aria-modal="true"
      >
        <div className="shrink-0 border-b border-[#E1E7EF] bg-white px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top))] dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8] dark:bg-blue-950/40 dark:text-blue-300">
                <Bell className="h-5 w-5" aria-hidden="true" />
                {unreadCount > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-[#E5484D] dark:border-slate-950" />}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg font-extrabold tracking-[-0.025em] text-[#101D38] dark:text-white">Notifications</h2>
                <p className="mt-0.5 text-[11px] text-[#7D899B] dark:text-slate-400">{unreadCount} unread · live institutional updates</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/account/notifications" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1EC] bg-[#F8FAFC] text-[#607086] transition hover:border-[#AFC3DE] hover:text-[#1754E8] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" aria-label="Notification settings"><Settings className="h-[18px] w-[18px]" aria-hidden="true" /></Link>
              <button ref={closeRef} type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#D8E1EC] bg-white text-[#607086] transition hover:bg-[#F7F9FC] hover:text-[#101D38] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300" aria-label="Close notifications"><X className="h-[18px] w-[18px]" aria-hidden="true" /></button>
            </div>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-b border-[#E6EBF2] bg-[#FAFBFD] p-4 dark:border-slate-800 dark:bg-slate-900/55">
          <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[#D5DEEA] bg-white px-3 focus-within:border-[#1754E8] focus-within:ring-4 focus-within:ring-[#1754E8]/10 dark:border-slate-700 dark:bg-slate-950">
            <Search className="h-4 w-4 text-[#8995A7]" aria-hidden="true" />
            <span className="sr-only">Search notifications</span>
            <input type="search" placeholder="Search notifications…" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[#344054] outline-none dark:text-slate-200" />
          </label>
          <div className="flex items-center justify-between gap-3">
            <div className="flex rounded-xl border border-[#DCE4EE] bg-white p-1 dark:border-slate-700 dark:bg-slate-950" role="group" aria-label="Notification filter">
              {(['all', 'unread'] as const).map((value) => <button key={value} type="button" onClick={() => setFilter(value)} className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold capitalize transition ${filter === value ? 'bg-[#1754E8] text-white shadow-sm' : 'text-[#667085] hover:bg-[#F4F7FB] dark:text-slate-400 dark:hover:bg-slate-900'}`} aria-pressed={filter === value}>{value}</button>)}
            </div>
            <button type="button" onClick={() => void markAllRead()} disabled={unreadCount === 0} className="text-[11px] font-extrabold text-[#1754E8] disabled:cursor-default disabled:text-[#A3ADBC]">Mark all read</button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-white dark:bg-slate-950" aria-live="polite">
          {error ? (
            <div className="m-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><p className="font-extrabold">Unable to load notifications</p><p className="mt-1 text-xs leading-5">{error}</p><button type="button" onClick={() => void fetchNotifications()} className="mt-3 inline-flex min-h-9 items-center gap-2 rounded-lg bg-white px-3 text-xs font-extrabold text-rose-700 shadow-sm"><RefreshCcw className="h-3.5 w-3.5" />Try again</button></div>
          ) : isLoading && notifications.length === 0 ? (
            <div className="space-y-3 p-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl bg-[#F1F4F8] dark:bg-slate-900" />)}</div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full min-h-[360px] flex-col items-center justify-center p-8 text-center"><span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F1F5FA] text-[#9AA7B8] dark:bg-slate-900"><Bell className="h-7 w-7" aria-hidden="true" /></span><p className="mt-4 text-sm font-extrabold text-[#344054] dark:text-slate-200">No notifications found</p><p className="mt-1 max-w-xs text-xs leading-5 text-[#8793A4]">New academic, finance and account updates will appear here when they are available.</p></div>
          ) : (
            <div className="divide-y divide-[#EEF2F6] dark:divide-slate-800">
              {notifications.map((notification) => {
                const snoozed = notification.snoozedUntil ? new Date(notification.snoozedUntil).getTime() > Date.now() : false;
                if (snoozed) return null;
                return (
                  <article key={notification.id} className={`relative p-5 transition hover:bg-[#FAFBFD] dark:hover:bg-slate-900/70 ${notification.isRead ? 'bg-white dark:bg-slate-950' : 'bg-[#F5F8FF] dark:bg-blue-950/15'}`}>
                    <div className="flex gap-3.5">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${notification.isRead ? 'bg-[#D6DEE8] dark:bg-slate-700' : 'bg-[#1754E8] shadow-[0_0_0_4px_rgba(23,84,232,0.1)]'}`} aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3"><h3 className="pr-7 text-[13px] font-extrabold leading-5 text-[#26364D] dark:text-slate-100">{notification.title}</h3><button type="button" className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#8A96A7] transition hover:bg-[#EDF1F6] hover:text-[#344054] dark:hover:bg-slate-800" onClick={() => setOpenMenuId(openMenuId === notification.id ? null : notification.id)} aria-label={`Actions for ${notification.title}`} aria-expanded={openMenuId === notification.id}><MoreVertical className="h-4 w-4" aria-hidden="true" /></button></div>
                        <p className="mt-1.5 text-xs leading-5 text-[#667085] dark:text-slate-400">{notification.body}</p>
                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><time dateTime={notification.createdAt} className="text-[10px] font-semibold text-[#98A2B3]">{new Date(notification.createdAt).toLocaleDateString()} · {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time>{notification.actionUrl && <Link href={notification.actionUrl} onClick={() => { if (!notification.isRead) void markRead(notification.id); onClose(); }} className="inline-flex items-center gap-1 text-[11px] font-extrabold text-[#1754E8] hover:underline">Open <ExternalLink className="h-3 w-3" aria-hidden="true" /></Link>}</div>
                      </div>
                    </div>
                    {openMenuId === notification.id && <div className="absolute right-10 top-11 z-10 w-40 overflow-hidden rounded-xl border border-[#D8E1EC] bg-white py-1.5 text-[12px] shadow-[0_14px_35px_rgba(16,29,56,0.18)] dark:border-slate-700 dark:bg-slate-900" role="menu">{!notification.isRead && <button type="button" className="flex min-h-9 w-full items-center gap-2 px-3 text-left font-semibold text-[#344054] hover:bg-[#F5F7FA] dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => void markRead(notification.id)} role="menuitem"><Check className="h-3.5 w-3.5" />Mark as read</button>}<button type="button" className="flex min-h-9 w-full items-center gap-2 px-3 text-left font-semibold text-[#344054] hover:bg-[#F5F7FA] dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => void snooze(notification.id)} role="menuitem"><Clock className="h-3.5 w-3.5" />Snooze 1 day</button><button type="button" className="flex min-h-9 w-full items-center gap-2 px-3 text-left font-semibold text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => void deleteNotification(notification.id)} role="menuitem"><Trash2 className="h-3.5 w-3.5" />Delete</button></div>}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
