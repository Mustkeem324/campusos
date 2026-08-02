'use client';

import React, { useState } from 'react';
import { FileText, Search, Shield, Filter, Eye } from 'lucide-react';
import { getAuditLogs, AuditRecord } from '../../lib/audit-service';
import { useAuthStore } from '../../lib/auth-store';

export function AuditLogViewer() {
  const { currentSession } = useAuthStore();
  const [filter, setFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditRecord | null>(null);

  const logs = getAuditLogs(currentSession.tenantId);

  const sampleLogs: AuditRecord[] = logs.length > 0 ? logs : [
    {
      id: 'audit_101',
      tenantId: currentSession.tenantId,
      userId: 'usr_super_01',
      action: 'ROLE_PERMISSION_UPDATE',
      entity: 'Role',
      beforeState: { role: 'FACULTY', permissions: ['attendance:mark'] },
      afterState: { role: 'FACULTY', permissions: ['attendance:mark', 'grades:manage'] },
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      createdAt: new Date(),
    },
    {
      id: 'audit_102',
      tenantId: currentSession.tenantId,
      userId: 'usr_admin_01',
      action: 'USER_LOCKOUT_RELEASE',
      entity: 'User',
      beforeState: { email: 'student@apex.edu', isLocked: true },
      afterState: { email: 'student@apex.edu', isLocked: false },
      ipAddress: '10.0.0.12',
      userAgent: 'Chrome/124.0.0.0',
      createdAt: new Date(Date.now() - 3600000),
    }
  ];

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
        <div className="flex items-center gap-2">
          <Shield size={20} className="text-indigo-500" />
          <div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Institutional Audit & Security Trail
            </h3>
            <p className="text-[11px] text-gray-500">
              Immutable logs for tenant: <span className="font-mono text-indigo-500">{currentSession.tenantId}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Filter by action or user..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs focus:outline-none"
          />
        </div>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">IP Address</th>
              <th className="p-3 text-right">State Diff</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {sampleLogs.map((log) => (
              <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <td className="p-3 font-mono text-[11px] text-gray-500">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </td>
                <td className="p-3 font-bold text-indigo-600 dark:text-indigo-400">
                  {log.action}
                </td>
                <td className="p-3">{log.entity}</td>
                <td className="p-3 font-mono text-gray-400 text-[11px]">{log.ipAddress}</td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100"
                  >
                    <Eye size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedLog && (
        <div className="p-4 rounded-xl bg-slate-950 text-slate-100 font-mono text-[11px] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-400">
            <span>JSON State Before/After Diff ({selectedLog.id})</span>
            <button onClick={() => setSelectedLog(null)} className="text-gray-400 hover:text-white">✕</button>
          </div>
          <pre className="overflow-x-auto p-2 bg-slate-900 rounded-lg text-emerald-400">
            {JSON.stringify(
              {
                before: selectedLog.beforeState,
                after: selectedLog.afterState,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
