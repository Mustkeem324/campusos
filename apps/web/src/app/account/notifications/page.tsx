'use client';

import React, { useState, useEffect } from 'react';

type Preference = {
  type: string;
  email: boolean;
  push: boolean;
  inApp: boolean;
};

const NOTIFICATION_TYPES = [
  { id: 'SYSTEM', label: 'System Alerts', description: 'Important system maintenance and security alerts.' },
  { id: 'MESSAGE', label: 'Direct Messages', description: 'Messages from staff, teachers, or students.' },
  { id: 'ASSIGNMENT', label: 'Assignments', description: 'New assignments, grading, and due dates.' },
  { id: 'ALERT', label: 'General Alerts', description: 'General notices and announcements.' },
];

export default function NotificationsPreferencesPage() {
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/notification-preferences')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPreferences(data);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const getPref = (type: string) => {
    return preferences.find(p => p.type === type) || { type, email: true, push: true, inApp: true };
  };

  const updatePref = async (type: string, field: 'email' | 'push' | 'inApp', value: boolean) => {
    const current = getPref(type);
    const updated = { ...current, [field]: value };
    
    setPreferences(prev => {
      const exists = prev.find(p => p.type === type);
      if (exists) return prev.map(p => p.type === type ? updated : p);
      return [...prev, updated];
    });

    await fetch('/api/notification-preferences', {
      method: 'PATCH',
      body: JSON.stringify({ type, [field]: value }),
      headers: { 'Content-Type': 'application/json' }
    });
  };

  if (isLoading) {
    return <div className="p-8 text-center text-text-muted">Loading preferences...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Notification Preferences</h1>
      <p className="text-text-secondary mb-8">Manage how and when you receive notifications.</p>

      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted border-b border-border">
              <th className="py-3 px-4 font-medium text-[13px] text-text-secondary w-1/2">Notification Type</th>
              <th className="py-3 px-4 font-medium text-[13px] text-text-secondary text-center">In-App</th>
              <th className="py-3 px-4 font-medium text-[13px] text-text-secondary text-center">Email</th>
              <th className="py-3 px-4 font-medium text-[13px] text-text-secondary text-center">Push</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {NOTIFICATION_TYPES.map(type => {
              const pref = getPref(type.id);
              return (
                <tr key={type.id} className="hover:bg-surface-muted/50 transition">
                  <td className="py-4 px-4">
                    <p className="font-medium text-text-primary text-[14px]">{type.label}</p>
                    <p className="text-[12px] text-text-secondary mt-1">{type.description}</p>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={pref.inApp}
                      onChange={(e) => updatePref(type.id, 'inApp', e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={pref.email}
                      onChange={(e) => updatePref(type.id, 'email', e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                    />
                  </td>
                  <td className="py-4 px-4 text-center">
                    <input 
                      type="checkbox" 
                      checked={pref.push}
                      onChange={(e) => updatePref(type.id, 'push', e.target.checked)}
                      className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
