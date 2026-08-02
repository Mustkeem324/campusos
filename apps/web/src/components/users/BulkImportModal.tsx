'use client';

import React, { useState } from 'react';
import { Upload, FileSpreadsheet, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';

export function BulkImportModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [stage, setStage] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');

  if (!isOpen) return null;

  const mockRows = [
    { row: 1, email: 'john.doe@apex.edu', name: 'John Doe', role: 'STUDENT', status: 'VALID' },
    { row: 2, email: 'jane.smith@apex.edu', name: 'Jane Smith', role: 'FACULTY', status: 'VALID' },
    { row: 3, email: 'invalid-email-format', name: 'Bob Wilson', role: 'STUDENT', status: 'ERROR', error: 'Invalid Email Format' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-2xl p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet size={20} className="text-emerald-500" />
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">
              Bulk CSV / Excel User Import Pipeline
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded bg-gray-100 dark:bg-gray-800">
            <X size={16} />
          </button>
        </div>

        {stage === 'upload' && (
          <div className="space-y-4 py-4 text-center">
            <div className="p-8 border-2 border-dashed border-indigo-200 dark:border-indigo-900 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20">
              <Upload size={36} className="mx-auto text-indigo-500 mb-2" />
              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Upload CSV or Excel file containing users
              </p>
              <p className="text-[10px] text-gray-400 mt-1">Columns required: Name, Email, Role, Department Code</p>
            </div>
            <button
              onClick={() => setStage('mapping')}
              className="px-5 py-2 rounded-xl bg-indigo-600 text-white font-extrabold text-xs"
            >
              Simulate File Upload
            </button>
          </div>
        )}

        {stage === 'mapping' && (
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300">Column Mapping Preview</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <MappingItem source="Full Name" target="user.name" />
              <MappingItem source="Institutional Email" target="user.email" />
              <MappingItem source="Assigned Role" target="user.role" />
              <MappingItem source="Dept ID" target="user.departmentId" />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStage('preview')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold"
              >
                Run Validation Dry-Run
              </button>
            </div>
          </div>
        )}

        {stage === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800 dark:text-gray-200">Validation Dry-Run Results</span>
              <span className="text-emerald-500 font-bold">2 Passed • 1 Failed</span>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="p-2">Row</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {mockRows.map((r) => (
                    <tr key={r.row} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="p-2 font-mono">{r.row}</td>
                      <td className="p-2">{r.name}</td>
                      <td className="p-2">{r.email}</td>
                      <td className="p-2">
                        {r.status === 'VALID' ? (
                          <span className="text-emerald-500 font-bold flex items-center gap-1">
                            <CheckCircle2 size={12} /> Valid
                          </span>
                        ) : (
                          <span className="text-rose-500 font-bold flex items-center gap-1">
                            <AlertTriangle size={12} /> {r.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStage('complete')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-extrabold text-xs"
              >
                Execute Partial Import (2 Valid Records)
              </button>
            </div>
          </div>
        )}

        {stage === 'complete' && (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">Import Execution Completed</h4>
            <p className="text-xs text-gray-500">2 Users Provisioned • 1 Error Logged to Audit Trail</p>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold text-xs"
            >
              Close Window
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function MappingItem({ source, target }: any) {
  return (
    <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
      <span className="font-semibold">{source}</span>
      <span className="font-mono text-indigo-500 text-[11px]">&rarr; {target}</span>
    </div>
  );
}
