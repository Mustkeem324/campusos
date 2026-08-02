'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, AlertCircle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { dispatchOmnichannelNotification, DeliveryAuditEntry } from '../../lib/notification-engine';

export function OmnichannelCommsConsole() {
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [logs, setLogs] = useState<DeliveryAuditEntry[]>([]);

  const handleSendNotification = () => {
    const res = dispatchOmnichannelNotification(
      {
        recipientId: 'usr_student_01',
        recipientName: 'Alex Vance',
        recipientPhone: '+1 555-0199',
        recipientEmail: 'alex.vance@apex.edu',
        title: 'Attendance Shortage Warning',
        body: 'Your attendance in CS401 is currently 66.6%. Please meet your faculty advisor.',
        category: 'ATTENDANCE',
      },
      simulateFailure
    );
    setLogs(res.auditLog);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-500" />
            <span>Omnichannel Communications Hub & Fallback Engine</span>
          </h2>
          <p className="text-xs text-gray-500">
            WhatsApp $\rightarrow$ SMS $\rightarrow$ Email automatic fallback • Quiet hours enforcement • Delivery audit logs
          </p>
        </div>

        <button
          onClick={handleSendNotification}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <Send size={14} />
          <span>Dispatch Notification</span>
        </button>
      </div>

      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between text-xs">
        <span className="font-bold text-gray-700 dark:text-gray-300">
          Simulate Primary WhatsApp Delivery Failure (Triggers Fallback)
        </span>
        <input
          type="checkbox"
          checked={simulateFailure}
          onChange={(e) => setSimulateFailure(e.target.checked)}
          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
        />
      </div>

      {/* Delivery Audit Log Table */}
      {logs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs uppercase font-bold text-gray-400">Delivery Audit Log</h3>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-3">Channel</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 font-mono font-bold text-indigo-500">{log.channel}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                        log.status === 'DELIVERED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600'
                          : log.status === 'FALLBACK_TRIGGERED'
                          ? 'bg-amber-100 text-amber-600'
                          : 'bg-rose-100 text-rose-600'
                      }`}>
                        {log.status} {log.failureReason ? `(${log.failureReason})` : ''}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono text-gray-400">
                      {new Date(log.attemptTimestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
