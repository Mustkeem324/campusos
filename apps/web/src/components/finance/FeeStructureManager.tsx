'use client';

import React, { useState } from 'react';
import { DollarSign, Layers, Plus, Calendar, AlertTriangle } from 'lucide-react';
import { FeeStructureDetail } from '../../lib/finance-engine';

export function FeeStructureManager() {
  const [structures] = useState<FeeStructureDetail[]>([
    {
      id: 'fee_btech_cs_2026',
      tenantId: 'inst_apex_univ',
      name: 'B.Tech CS Term 2 Fee Structure',
      programId: 'prog_btech_cs',
      batchId: 'batch_2026',
      dueDate: '2026-02-15',
      lateFeePerDay: 10,
      totalAmount: 2400,
      heads: [
        { id: 'h1', name: 'Tuition Fee', amount: 1800, isRecurring: true },
        { id: 'h2', name: 'Development & Tech Fee', amount: 400, isRecurring: true },
        { id: 'h3', name: 'Library & Lab Access', amount: 200, isRecurring: false },
      ],
    },
  ]);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-500" />
            <span>Institutional Fee Structures & Component Heads</span>
          </h2>
          <p className="text-xs text-gray-500">
            Configure term tuition, component fee heads, installment slabs, and late fee rules
          </p>
        </div>

        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg">
          <Plus size={14} />
          <span>Create Fee Structure</span>
        </button>
      </div>

      <div className="space-y-4">
        {structures.map((fs) => (
          <div key={fs.id} className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-indigo-500 font-bold">{fs.id}</span>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{fs.name}</h3>
              </div>
              <div className="text-right">
                <span className="text-lg font-extrabold text-emerald-500">${fs.totalAmount}</span>
                <span className="block text-[10px] text-gray-400 font-mono">Due Date: {fs.dueDate}</span>
              </div>
            </div>

            {/* Component Heads List */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
                  <tr>
                    <th className="p-3">Fee Head Name</th>
                    <th className="p-3">Type</th>
                    <th className="p-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {fs.heads.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-100/50 dark:hover:bg-gray-800/50">
                      <td className="p-3 font-semibold text-gray-800 dark:text-gray-200">{h.name}</td>
                      <td className="p-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          h.isRecurring ? 'bg-indigo-100 dark:bg-indigo-950 text-indigo-600' : 'bg-gray-200 dark:bg-gray-700 text-gray-600'
                        }`}>
                          {h.isRecurring ? 'Recurring' : 'One-Time'}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${h.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between">
              <span>Late Fee Rule: ${fs.lateFeePerDay}/day after due date ({fs.dueDate})</span>
              <span className="text-[10px] font-mono font-bold bg-amber-200 dark:bg-amber-900 px-2 py-0.5 rounded">
                SLAB RULE ACTIVE
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
