'use client';

import React, { useState } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { triggerEmergencyCampusBroadcast, DeliveryAuditEntry } from '../../lib/notification-engine';

export function EmergencyBroadcastConsole() {
  const [broadcastLogs, setBroadcastLogs] = useState<DeliveryAuditEntry[]>([]);

  const handleTriggerPanicButton = () => {
    const logs = triggerEmergencyCampusBroadcast(
      'EMERGENCY CAMPUS ALERT',
      'Severe Weather Warning: All afternoon classes are suspended. Please move to safe indoor assembly areas.'
    );
    setBroadcastLogs(logs);
  };

  return (
    <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-300 dark:border-rose-900 shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-rose-200 dark:border-rose-900 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-rose-900 dark:text-rose-100 flex items-center gap-2">
            <AlertOctagon size={24} className="text-rose-600 animate-pulse" />
            <span>Campus Emergency Panic Button & Instant Broadcast Console</span>
          </h2>
          <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
            Fires simultaneous emergency push notifications across WhatsApp, SMS, Email, and Push notifications bypassing quiet hours
          </p>
        </div>

        <button
          onClick={handleTriggerPanicButton}
          className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-2xl transition flex items-center gap-2 animate-bounce"
        >
          <Zap size={16} />
          <span>TRIGGER CAMPUS PANIC ALERT</span>
        </button>
      </div>

      {broadcastLogs.length > 0 && (
        <div className="p-4 rounded-xl bg-white dark:bg-gray-900 border border-rose-200 dark:border-rose-900 space-y-2">
          <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 size={16} />
            <span>Simultaneous Emergency Broadcast Dispatched Across All 4 Channels!</span>
          </h3>

          <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
            {broadcastLogs.map((l) => (
              <div key={l.id} className="p-2 rounded bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 text-emerald-600">
                {l.channel}: DELIVERED
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
