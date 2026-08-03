'use client';

import React from 'react';
import { Download, AlertCircle, Eye } from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  method: string;
  invoiceNo: string;
  amount: number;
  status: 'SUCCESSFUL' | 'PROCESSING' | 'FAILED' | 'REFUNDED' | 'VERIFICATION_PENDING';
  receiptNo?: string;
}

const mockTransactions: Transaction[] = [];

export function RecentTransactionsTable() {
  const getStatusBadge = (status: Transaction['status']) => {
    switch (status) {
      case 'SUCCESSFUL':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-success-soft text-success uppercase">Successful</span>;
      case 'FAILED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-danger-soft text-danger uppercase">Failed</span>;
      case 'PROCESSING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-soft text-primary uppercase">Processing</span>;
      case 'VERIFICATION_PENDING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-warning-soft text-warning uppercase">Verification Pending</span>;
      case 'REFUNDED':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-muted text-text-secondary uppercase">Refunded</span>;
    }
  };

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mt-6">
      <div className="flex items-center justify-between p-5 border-b border-border">
        <h3 className="text-[16px] font-bold text-text-primary">Recent Transactions</h3>
        <button className="text-[13px] font-medium text-primary hover:text-primary-hover transition">
          View All Transactions
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted text-[12px] font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              <th className="p-4">Transaction ID</th>
              <th className="p-4">Date</th>
              <th className="p-4">Method</th>
              <th className="p-4">Invoice No.</th>
              <th className="p-4 text-right">Amount (₹)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-center">Receipt</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {mockTransactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500 text-sm">
                  No recent transactions found
                </td>
              </tr>
            ) : (
              mockTransactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border hover:bg-surface-muted/50 transition">
                  <td className="p-4 font-mono text-text-primary">{tx.id}</td>
                  <td className="p-4 text-text-secondary">{tx.date}</td>
                  <td className="p-4 text-text-secondary">{tx.method}</td>
                  <td className="p-4 text-text-secondary">{tx.invoiceNo}</td>
                  <td className="p-4 text-right font-medium text-text-primary">{tx.amount.toLocaleString('en-IN')}</td>
                  <td className="p-4 text-center">{getStatusBadge(tx.status)}</td>
                  <td className="p-4 text-center">
                    {tx.receiptNo ? (
                      <span className="font-mono text-primary text-[12px]">{tx.receiptNo}</span>
                    ) : (
                      <span className="text-text-muted text-[12px]">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {tx.status === 'SUCCESSFUL' && (
                        <button className="p-1.5 text-text-secondary hover:text-primary transition" title="Download Receipt">
                          <Download size={16} />
                        </button>
                      )}
                      <button className="p-1.5 text-text-secondary hover:text-primary transition" title="View Details">
                        <Eye size={16} />
                      </button>
                      {tx.status === 'FAILED' && (
                        <button className="p-1.5 text-text-secondary hover:text-danger transition" title="Report Issue">
                          <AlertCircle size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}</tbody>
        </table>
      </div>
    </div>
  );
}
