'use client';

import Link from 'next/link';
import React, { useCallback, useEffect, useState } from 'react';
import { Bell, Check, Clock, ExternalLink, MoreVertical, Search, Settings, Trash2, X } from 'lucide-react';

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
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const fetchNotifications = useCallback(async (silently = false) => {
    if (!silently) setIsLoading(true);

    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (filter === 'unread') url.searchParams.set('filter', 'unread');
      if (searchQuery.trim()) url.searchParams.set('search', searchQuery.trim());

      const response = await fetch(url.toString(), { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Notification request failed with status ${response.status}`);
      }

      const data: unknown = await response.json();
      setNotifications(Array.isArray(data) ? (data as Notification[]) : []);
    } catch (error: unknown) {
      console.error('Unable to load notifications', error);
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

    const interval = window.setInterval(() => {
      void fetchNotifications(true);
    }, 10_000);

    return () => window.clearInterval(interval);
  }, [fetchNotifications, isOpen]);

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

  return (
    <>
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 cursor-default bg-black/20 transition-opacity"
          onClick={onClose}
          aria-label="Close notifications"
        />
      )}

      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full transform flex-col border-l border-border bg-surface shadow-xl transition-transform duration-300 ease-in-out sm:w-[400px] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        aria-hidden={!isOpen}
        aria-label="Notifications"
      >
        <div className="flex items-center justify-between border-b border-border p-4">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-text-primary" aria-hidden="true" />
            <h2 className="font-semibold text-text-primary">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/account/notifications"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-secondary transition hover:bg-surface-muted"
              aria-label="Notification settings"
            >
              <Settings size={18} aria-hidden="true" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-text-secondary transition hover:bg-surface-muted"
              aria-label="Close notifications"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border p-4">
          <label className="flex items-center gap-2 rounded-md border border-border bg-surface-muted px-3 py-1.5 focus-within:border-primary">
            <Search size={14} className="text-text-muted" aria-hidden="true" />
            <span className="sr-only">Search notifications</span>
            <input
              type="search"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="flex-1 border-none bg-transparent text-[13px] text-text-primary outline-none"
            />
          </label>
          <div className="flex items-center justify-between">
            <div className="flex rounded-md bg-surface-muted p-0.5" role="group" aria-label="Notification filter">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`rounded-sm px-3 py-1 text-[12px] font-medium ${
                  filter === 'all' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'
                }`}
                aria-pressed={filter === 'all'}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`rounded-sm px-3 py-1 text-[12px] font-medium ${
                  filter === 'unread' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'
                }`}
                aria-pressed={filter === 'unread'}
              >
                Unread
              </button>
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              className="text-[12px] font-medium text-primary hover:text-primary-hover"
            >
              Mark all read
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto" aria-live="polite">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-[13px] text-text-muted">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center p-8 text-center">
              <Bell size={32} className="mb-3 text-border" aria-hidden="true" />
              <p className="text-[14px] text-text-secondary">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notification) => {
                const snoozed = notification.snoozedUntil
                  ? new Date(notification.snoozedUntil).getTime() > Date.now()
                  : false;
                if (snoozed) return null;

                return (
                  <article
                    key={notification.id}
                    className={`relative p-4 transition hover:bg-surface-muted ${
                      notification.isRead ? 'opacity-70' : 'bg-primary/5'
                    }`}
                  >
                    <div className="flex gap-3">
                      <div
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                          notification.isRead ? 'bg-transparent' : 'bg-primary'
                        }`}
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="pr-6 text-[14px] font-medium text-text-primary">{notification.title}</h3>
                          <button
                            type="button"
                            className="absolute right-3 top-3 p-1 text-text-muted hover:text-text-primary"
                            onClick={() => setOpenMenuId(openMenuId === notification.id ? null : notification.id)}
                            aria-label={`Actions for ${notification.title}`}
                            aria-expanded={openMenuId === notification.id}
                          >
                            <MoreVertical size={14} aria-hidden="true" />
                          </button>
                        </div>
                        <p className="mt-1 text-[13px] text-text-secondary">{notification.body}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <time dateTime={notification.createdAt} className="text-[11px] text-text-muted">
                            {new Date(notification.createdAt).toLocaleDateString()}{' '}
                            {new Date(notification.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </time>
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              className="flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                            >
                              View <ExternalLink size={12} aria-hidden="true" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>

                    {openMenuId === notification.id && (
                      <div
                        className="absolute right-8 top-8 z-10 w-36 rounded-md border border-border bg-surface py-1 text-[13px] shadow-lg"
                        role="menu"
                      >
                        {!notification.isRead && (
                          <button
                            type="button"
                            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-text-primary hover:bg-surface-muted"
                            onClick={() => void markRead(notification.id)}
                            role="menuitem"
                          >
                            <Check size={14} aria-hidden="true" /> Mark as read
                          </button>
                        )}
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-text-primary hover:bg-surface-muted"
                          onClick={() => void snooze(notification.id)}
                          role="menuitem"
                        >
                          <Clock size={14} aria-hidden="true" /> Snooze 1 day
                        </button>
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-danger hover:bg-surface-muted"
                          onClick={() => void deleteNotification(notification.id)}
                          role="menuitem"
                        >
                          <Trash2 size={14} aria-hidden="true" /> Delete
                        </button>
                      </div>
                    )}
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
