'use client';

import React, { useState } from 'react';
import { DollarSign, FileSpreadsheet, Download, CheckCircle2, Cpu } from 'lucide-react';
import { processStaffMonthlyPayroll, generateNACHBankFile, StaffSalaryStructure, PayslipDetail } from '../../lib/payroll-service';

export function PayrollDisbursementConsole() {
  const [staffList] = useState<StaffSalaryStructure[]>([
    { staffId: 'fac_turing', staffName: 'Dr. Alan Turing', designation: 'Professor & HOD', accountNumber: '994100128834', ifscCode: 'APEX000104', basePay: 6000 },
    { staffId: 'fac_lamport', staffName: 'Dr. Leslie Lamport', designation: 'Associate Professor', accountNumber: '994100128835', ifscCode: 'APEX000104', basePay: 4500 },
  ]);

  const [payslips, setPayslips] = useState<PayslipDetail[]>([]);

  const handleRunMonthlyPayroll = () => {
    const computed = staffList.map((s) => processStaffMonthlyPayroll(s, 'February 2026'));
    setPayslips(computed);
  };

  const handleDownloadNACH = () => {
    const csv = generateNACHBankFile(payslips, staffList);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CampusOS_NACH_Bank_Salary_Disbursement.csv';
    a.click();
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <DollarSign size={20} className="text-emerald-500" />
            <span>Monthly Staff Payroll Engine & NACH Disbursement File</span>
          </h2>
          <p className="text-xs text-gray-500">
            HRA + DA + PF + TDS Income Tax withholding • Automated payslips • NACH / NEFT bank transfer export
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleRunMonthlyPayroll}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
          >
            <Cpu size={14} />
            <span>Execute Monthly Payroll Run</span>
          </button>

          {payslips.length > 0 && (
            <button
              onClick={handleDownloadNACH}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg transition"
            >
              <FileSpreadsheet size={14} />
              <span>Download NACH Bank File (CSV)</span>
            </button>
          )}
        </div>
      </div>

      {payslips.length > 0 && (
        <div className="space-y-4 animate-fade-in">
          <h3 className="text-xs uppercase font-bold text-gray-400">Generated Monthly Payslips</h3>

          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Base Pay</th>
                  <th className="p-3">HRA + DA</th>
                  <th className="p-3">Gross Salary</th>
                  <th className="p-3 text-rose-500 font-semibold">PF + TDS Deductions</th>
                  <th className="p-3 text-right font-extrabold text-emerald-500">Net Disbursement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800 font-mono">
                {payslips.map((p) => (
                  <tr key={p.payslipId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="p-3 font-bold font-sans text-gray-900 dark:text-white">{p.staffName}</td>
                    <td className="p-3">${p.basePay.toLocaleString()}</td>
                    <td className="p-3">${(p.hra + p.da).toLocaleString()}</td>
                    <td className="p-3 font-bold">${p.grossSalary.toLocaleString()}</td>
                    <td className="p-3 text-rose-500 font-semibold">-${p.totalDeductions.toLocaleString()}</td>
                    <td className="p-3 text-right font-extrabold text-emerald-500">${p.netPay.toLocaleString()}</td>
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
