'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Bell, Search, Settings, MoreVertical, Trash2, Clock, ExternalLink } from 'lucide-react';
import Link from 'next/link';

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

  const fetchNotifications = async (silently = false) => {
    if (!silently) setIsLoading(true);
    try {
      const url = new URL('/api/notifications', window.location.origin);
      if (filter === 'unread') url.searchParams.set('filter', 'unread');
      if (searchQuery) url.searchParams.set('search', searchQuery);
      
      const res = await fetch(url.toString());
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silently) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter, searchQuery]);

  // Polling for real-time updates
  useEffect(() => {
    if (isOpen) {
      const interval = setInterval(() => {
        fetchNotifications(true);
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen, filter, searchQuery]);

  const markRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await fetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, action: 'markRead' }),
      headers: { 'Content-Type': 'application/json' }
    });
    setOpenMenuId(null);
  };

  const markAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    await fetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'markAllRead' }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const snooze = async (id: string) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    setNotifications(prev => prev.filter(n => n.id !== id));
    await fetch('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify({ id, action: 'snooze', snoozeUntil: tomorrow.toISOString() }),
      headers: { 'Content-Type': 'application/json' }
    });
    setOpenMenuId(null);
  };

  const deleteNotification = async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
    setOpenMenuId(null);
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div 
        className={`fixed top-0 right-0 h-full w-full sm:w-[400px] bg-surface border-l border-border z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'} flex flex-col shadow-xl`}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-text-primary" />
            <h2 className="font-semibold text-text-primary">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/account/notifications" onClick={onClose} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition">
              <Settings size={18} />
            </Link>
            <button onClick={onClose} className="p-1.5 rounded-md text-text-secondary hover:bg-surface-muted transition">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="p-4 border-b border-border flex flex-col gap-3">
          <div className="flex items-center gap-2 bg-surface-muted border border-border rounded-md px-3 py-1.5 focus-within:border-primary">
            <Search size={14} className="text-text-muted" />
            <input 
              type="text" 
              placeholder="Search notifications..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none text-[13px] flex-1 text-text-primary"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex bg-surface-muted rounded-md p-0.5">
              <button 
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-[12px] font-medium rounded-sm ${filter === 'all' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 text-[12px] font-medium rounded-sm ${filter === 'unread' ? 'bg-surface shadow-sm text-text-primary' : 'text-text-secondary'}`}
              >
                Unread
              </button>
            </div>
            <button 
              onClick={markAllRead}
              className="text-[12px] font-medium text-primary hover:text-primary-hover"
            >
              Mark all read
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && notifications.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-[13px]">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center flex flex-col items-center justify-center h-full">
              <Bell size={32} className="text-border mb-3" />
              <p className="text-text-secondary text-[14px]">No notifications found</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((notif) => {
                const now = new Date();
                const snoozed = notif.snoozedUntil ? new Date(notif.snoozedUntil) > now : false;
                if (snoozed) return null; // Don't show snoozed
                
                return (
                  <div key={notif.id} className={`p-4 relative hover:bg-surface-muted transition ${notif.isRead ? 'opacity-70' : 'bg-primary/5'}`}>
                    <div className="flex gap-3">
                      {!notif.isRead && (
                        <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      )}
                      {notif.isRead && (
                        <div className="w-2 h-2 shrink-0 mt-1.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="text-[14px] font-medium text-text-primary pr-6">{notif.title}</h4>
                          <button 
                            className="text-text-muted hover:text-text-primary absolute right-3 top-3 p-1"
                            onClick={(e) => {
                              e.preventDefault();
                              setOpenMenuId(openMenuId === notif.id ? null : notif.id);
                            }}
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                        <p className="text-[13px] text-text-secondary mt-1">{notif.body}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[11px] text-text-muted">
                            {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {notif.actionUrl && (
                            <Link href={notif.actionUrl} className="text-[12px] font-medium text-primary flex items-center gap-1 hover:underline">
                              View <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Menu */}
                    {openMenuId === notif.id && (
                      <div className="absolute right-8 top-8 w-36 bg-surface border border-border rounded-md shadow-lg py-1 z-10 text-[13px]">
                        {!notif.isRead && (
                          <button 
                            className="w-full text-left px-3 py-1.5 hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                            onClick={() => markRead(notif.id)}
                          >
                            <Check size={14} /> Mark as read
                          </button>
                        )}
                        <button 
                          className="w-full text-left px-3 py-1.5 hover:bg-surface-muted flex items-center gap-2 text-text-primary"
                          onClick={() => snooze(notif.id)}
                        >
                          <Clock size={14} /> Snooze 1 day
                        </button>
                        <button 
                          className="w-full text-left px-3 py-1.5 hover:bg-surface-muted flex items-center gap-2 text-danger"
                          onClick={() => deleteNotification(notif.id)}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
