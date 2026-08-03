'use client';

import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  invoiceNo: string;
  feePeriod: string;
  description: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  paid: number;
  balance: number;
  status: 'DUE' | 'UPCOMING' | 'PAID' | 'OVERDUE' | 'VERIFICATION_PENDING';
  feeHeads: { head: string; amount: number; paid: number; balance: number }[];
}

const mockInvoices: Invoice[] = [];

export function InvoiceTable({ onSelect }: { onSelect: (selected: Invoice[]) => void }) {
  const [activeTab, setActiveTab] = useState<'OUTSTANDING' | 'UPCOMING' | 'PAID' | 'ALL'>('OUTSTANDING');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const toggleSelect = (invoice: Invoice) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(invoice.id)) {
      newSelected.delete(invoice.id);
    } else {
      if (invoice.status !== 'PAID') {
        newSelected.add(invoice.id);
      }
    }
    setSelectedIds(newSelected);
    onSelect(mockInvoices.filter(inv => newSelected.has(inv.id)));
  };

  const getStatusBadge = (status: Invoice['status']) => {
    switch (status) {
      case 'DUE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-danger-soft text-danger uppercase">Due</span>;
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-danger text-white uppercase">Overdue</span>;
      case 'UPCOMING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary-soft text-primary uppercase">Upcoming</span>;
      case 'PAID':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-success-soft text-success uppercase">Paid</span>;
      case 'VERIFICATION_PENDING':
        return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-warning-soft text-warning uppercase">Verification Pending</span>;
    }
  };

  const filteredInvoices = mockInvoices.filter(inv => {
    if (activeTab === 'OUTSTANDING') return inv.status === 'DUE' || inv.status === 'OVERDUE';
    if (activeTab === 'UPCOMING') return inv.status === 'UPCOMING';
    if (activeTab === 'PAID') return inv.status === 'PAID';
    return true;
  });

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Header Tabs */}
      <div className="flex items-center border-b border-border px-2">
        <button
          onClick={() => setActiveTab('OUTSTANDING')}
          className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'OUTSTANDING' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Outstanding <span className="ml-1.5 bg-danger-soft text-danger px-1.5 py-0.5 rounded-full text-[10px] font-bold">1</span>
        </button>
        <button
          onClick={() => setActiveTab('UPCOMING')}
          className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'UPCOMING' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Upcoming <span className="ml-1.5 bg-surface-muted text-text-secondary px-1.5 py-0.5 rounded-full text-[10px] font-bold">0</span>
        </button>
        <button
          onClick={() => setActiveTab('PAID')}
          className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'PAID' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Paid
        </button>
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-3 text-[13px] font-medium border-b-2 transition-colors ${
            activeTab === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          All Invoices
        </button>
      </div>

      {/* Filters Row */}
      <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border bg-surface-muted/30">
        <div className="relative w-full sm:w-64">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search invoices..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-[13px] text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select className="pl-3 pr-8 py-2 rounded-lg border border-border bg-surface text-[13px] text-text-secondary focus:outline-none appearance-none">
            <option>Academic Year 2024-25</option>
            <option>Academic Year 2023-24</option>
          </select>
          <button className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-surface text-[13px] font-medium text-text-secondary hover:bg-surface-muted transition">
            <Filter size={16} />
            Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-muted text-[12px] font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
              <th className="p-4 w-12 text-center">
                <input type="checkbox" className="rounded border-border text-primary focus:ring-primary" disabled />
              </th>
              <th className="p-4">Invoice No.</th>
              <th className="p-4">Fee Period</th>
              <th className="p-4">Issue Date</th>
              <th className="p-4">Due Date</th>
              <th className="p-4 text-right">Amount (₹)</th>
              <th className="p-4 text-right">Balance (₹)</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-[13px]">
            {filteredInvoices.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-text-muted">
                  No invoices found
                </td>
              </tr>
            ) : (
              filteredInvoices.map((inv) => (
                <React.Fragment key={inv.id}>
                  <tr 
                    className={`border-b border-border hover:bg-surface-muted/50 transition cursor-pointer ${selectedIds.has(inv.id) ? 'bg-primary-50/10' : ''}`}
                    onClick={() => setExpandedRowId(expandedRowId === inv.id ? null : inv.id)}
                  >
                    <td className="p-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20"
                          checked={selectedIds.has(inv.id)}
                          onChange={() => toggleSelect(inv)}
                          disabled={inv.status === 'PAID' || inv.status === 'VERIFICATION_PENDING'}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-text-primary mb-1">{inv.invoiceNo}</div>
                      <div className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">{inv.feePeriod}</div>
                    </td>
                    <td className="p-4">
                      <div className="text-text-primary font-medium">{inv.description}</div>
                      <div className="text-[12px] text-text-secondary mt-1 flex gap-3">
                        <span>Issued: {inv.issueDate}</span>
                        <span className={inv.status === 'OVERDUE' ? 'text-danger font-medium' : ''}>Due: {inv.dueDate}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-medium text-text-primary">₹{inv.amount.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right text-text-secondary">₹{inv.paid.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-right font-semibold text-text-primary">₹{inv.balance.toLocaleString('en-IN')}</td>
                    <td className="p-4 text-center">{getStatusBadge(inv.status)}</td>
                    <td className="p-4 text-center">
                      <button className="p-1.5 text-text-secondary hover:text-primary transition rounded-full hover:bg-surface-muted">
                        <ChevronDown size={18} className={`transition-transform duration-200 ${expandedRowId === inv.id ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedRowId === inv.id && (
                    <tr className="bg-surface-muted/30 border-b border-border">
                      <td colSpan={8} className="p-0">
                        <div className="p-6 ml-12">
                          <h4 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
                            <FileText size={16} className="text-text-secondary" />
                            Fee Head Breakdown
                          </h4>
                          <div className="bg-surface rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-left text-[13px]">
                              <thead className="bg-surface-muted text-text-secondary">
                                <tr>
                                  <th className="p-3 font-medium">Fee Component</th>
                                  <th className="p-3 font-medium text-right">Amount</th>
                                  <th className="p-3 font-medium text-right">Paid</th>
                                  <th className="p-3 font-medium text-right">Balance</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {inv.feeHeads.map((head, idx) => (
                                  <tr key={idx}>
                                    <td className="p-3 text-text-primary">{head.head}</td>
                                    <td className="p-3 text-right text-text-primary">₹{head.amount.toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-right text-text-secondary">₹{head.paid.toLocaleString('en-IN')}</td>
                                    <td className="p-3 text-right font-medium text-text-primary">₹{head.balance.toLocaleString('en-IN')}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border flex items-center justify-between bg-surface">
        <p className="text-[12px] text-text-secondary">Showing 1 to {filteredInvoices.length} of {filteredInvoices.length} invoices</p>
        <div className="flex items-center gap-1">
          <button className="w-7 h-7 rounded flex items-center justify-center border border-border text-text-secondary hover:bg-surface-muted disabled:opacity-50" disabled>
            <ChevronLeft size={14} />
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center bg-primary text-white text-[12px] font-medium">
            1
          </button>
          <button className="w-7 h-7 rounded flex items-center justify-center border border-border text-text-secondary hover:bg-surface-muted disabled:opacity-50" disabled>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Just defining ChevronLeft here because it wasn't imported from lucide-react above.
function ChevronLeft({ size = 24, className = "" }: { size?: number, className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 18-6-6 6-6"/>
    </svg>
  );
}
