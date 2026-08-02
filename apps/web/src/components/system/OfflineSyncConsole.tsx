'use client';

import React, { useState } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, Database, Smartphone } from 'lucide-react';
import { globalOfflineSyncQueue, OfflineMutation } from '../../lib/offline-sync-engine';

export function OfflineSyncConsole() {
  const [mutations, setMutations] = useState<OfflineMutation[]>([]);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleSimulateOfflineMutation = () => {
    const item = globalOfflineSyncQueue.enqueue({
      entityType: 'ATTENDANCE',
      payload: { studentId: 's1', courseId: 'CS401', status: 'PRESENT' },
      clientTimestamp: Date.now(),
    });
    setMutations([...globalOfflineSyncQueue.getPendingMutations()]);
  };

  const handleRunSync = () => {
    const res = globalOfflineSyncQueue.processSyncQueue();
    setMutations([...globalOfflineSyncQueue.getPendingMutations()]);
    setSyncStatus(`SYNC COMPLETE! Synced ${res.syncedCount} offline records via Last-Write-Wins (LWW) strategy.`);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <WifiOff size={20} className="text-sky-500" />
            <span>Offline-First PWA & Conflict-Resolving Mobile Sync Queue</span>
          </h2>
          <p className="text-xs text-gray-500">
            Local SQLite buffer • Last-Write-Wins (LWW) conflict resolution queue
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleSimulateOfflineMutation}
            className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-gray-800 dark:text-gray-200 font-bold text-xs"
          >
            + Simulate Offline Attendance Mark
          </button>
          <button
            onClick={handleRunSync}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs shadow"
          >
            <RefreshCw size={14} />
            <span>Trigger Background Sync</span>
          </button>
        </div>
      </div>

      {syncStatus && (
        <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/50 border border-sky-200 text-sky-900 dark:text-sky-200 text-xs font-bold font-mono flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{syncStatus}</span>
        </div>
      )}
    </div>
  );
}
