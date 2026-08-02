'use client';

import React, { useState } from 'react';
import { DollarSign, AlertTriangle, FileSpreadsheet, Download, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { exportTallyERPLedger } from '../../lib/finance-engine';

export function FinanceTreasuryDashboard() {
  const [defaulters] = useState([
    { id: 'def_1', name: 'John Doe', rollNumber: 'CS2026-99', program: 'B.Tech CS', dueAmount: 1400, daysOverdue: 14, holdStatus: 'EXAM_REGISTRATION_HOLD' },
    { id: 'def_2', name: 'Mark Smith', rollNumber: 'ME2026-12', program: 'B.Tech ME', dueAmount: 850, daysOverdue: 22, holdStatus: 'RESULT_VIEW_HOLD' },
  ]);

  const handleExportTally = () => {
    const csv = exportTallyERPLedger([
      { id: 'l1', studentId: 'usr_student_01', description: 'Tuition Collection Term 2', debit: 0, credit: 2400, balance: 0, createdAt: new Date() },
    ]);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CampusOS_Tally_ERP_Export.csv';
    a.click();
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-500" />
            <span>Institutional Financial Treasury & Defaulters Console</span>
          </h2>
          <p className="text-xs text-gray-500">
            Collection vs Target • Automated Dues Defaulter Holds • Tally / ERP Export
          </p>
        </div>

        <button
          onClick={handleExportTally}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <FileSpreadsheet size={14} />
          <span>Export Tally ERP Ledger (CSV)</span>
        </button>
      </div>

      {/* Financial Health Gauges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Total Collection Term 2</span>
          <h3 className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-200 mt-1">$1.84M</h3>
          <p className="text-[10px] text-emerald-600 font-bold mt-0.5">84% of $2.20M Target</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900">
          <span className="text-[10px] uppercase font-bold text-amber-600">Total Pending Dues</span>
          <h3 className="text-2xl font-extrabold text-amber-900 dark:text-amber-200 mt-1">$360,000</h3>
          <p className="text-[10px] text-amber-600 font-bold mt-0.5">184 Defaulter Accounts</p>
        </div>

        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Reconciliation Rate</span>
          <h3 className="text-2xl font-extrabold text-indigo-900 dark:text-indigo-200 mt-1">99.98%</h3>
          <p className="text-[10px] text-indigo-600 font-bold mt-0.5">Zero Double-Ledger Entries</p>
        </div>
      </div>

      {/* Defaulter List Table */}
      <div className="space-y-3">
        <h3 className="text-xs uppercase font-bold text-gray-400 flex items-center gap-1.5">
          <AlertTriangle size={16} className="text-amber-500" />
          <span>Active Defaulter List & Automated Hold Flags</span>
        </h3>

        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
              <tr>
                <th className="p-3">Roll Number</th>
                <th className="p-3">Student Name</th>
                <th className="p-3">Overdue Amount</th>
                <th className="p-3">Days Overdue</th>
                <th className="p-3 text-right">Hold Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {defaulters.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="p-3 font-mono font-bold text-gray-500">{d.rollNumber}</td>
                  <td className="p-3 font-bold text-gray-900 dark:text-white">{d.name}</td>
                  <td className="p-3 font-mono font-bold text-rose-500">${d.dueAmount}</td>
                  <td className="p-3 font-mono">{d.daysOverdue} days</td>
                  <td className="p-3 text-right">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400">
                      {d.holdStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
