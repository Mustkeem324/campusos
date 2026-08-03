'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, ShieldCheck, Info, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  amount: number;
  paid: number;
  balance: number;
  feeHeads: { head: string; amount: number; paid: number; balance: number }[];
}

export function PaymentSummary({ selectedInvoices, onProceed }: { selectedInvoices: Invoice[], onProceed: () => void }) {
  const totalBalance = selectedInvoices.reduce((acc, inv) => acc + inv.balance, 0);

  // Aggregate fee heads from selected invoices for the breakdown
  const headTotals: Record<string, number> = {};
  selectedInvoices.forEach(inv => {
    inv.feeHeads.forEach(head => {
      if (head.balance > 0) {
        headTotals[head.head] = (headTotals[head.head] || 0) + head.balance;
      }
    });
  });

  const subTotal = Object.values(headTotals).reduce((a, b) => a + b, 0);
  const lateFee = selectedInvoices.some(inv => inv.id === 'inv_1') ? 500 : 0; // Mock late fee if overdue
  const scholarship = selectedInvoices.some(inv => inv.id === 'inv_2') ? 2000 : 0; // Mock scholarship
  
  // Tax calculation (e.g. 18% GST if applicable, often zero for education but shown for compliance)
  const taxes = 0; 

  const totalPayable = subTotal + lateFee - scholarship + taxes;

  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm sticky top-24 flex flex-col h-fit">
      <div className="p-5 border-b border-border flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold text-text-primary">Payment Summary</h3>
          <span className="text-[12px] font-medium text-text-secondary bg-surface-muted px-2 py-1 rounded">
            {selectedInvoices.length} {selectedInvoices.length === 1 ? 'invoice' : 'invoices'} selected
          </span>
        </div>
        <p className="text-[11px] text-text-secondary">Merchant: UPES Dehradun</p>
        <p className="text-[11px] text-text-secondary">Account: Student ID 500123984</p>
      </div>

      <div className="p-5 flex-1 space-y-4">
        {selectedInvoices.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-[13px]">
            Select one or more invoices to view the payment summary.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="text-[12px] font-semibold text-text-secondary mb-2 uppercase tracking-wider">Fee Breakdown</div>
              {Object.entries(headTotals).map(([head, amount]) => (
                <div key={head} className="flex justify-between items-center text-[13px]">
                  <span className="text-text-secondary">{head}</span>
                  <span className="font-medium text-text-primary">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
              
              <div className="pt-3 border-t border-border flex justify-between items-center text-[13px]">
                <span className="font-medium text-text-primary">Sub Total</span>
                <span className="font-bold text-text-primary">₹{subTotal.toLocaleString('en-IN')}</span>
              </div>

              {scholarship > 0 && (
                <div className="flex justify-between items-center text-[13px] text-success">
                  <span>Scholarship / Concession</span>
                  <span className="font-medium">- ₹{scholarship.toLocaleString('en-IN')}</span>
                </div>
              )}

              {lateFee > 0 && (
                <div className="flex justify-between items-center text-[13px] text-error">
                  <span>Late Fee</span>
                  <span className="font-medium">+ ₹{lateFee.toLocaleString('en-IN')}</span>
                </div>
              )}

              {taxes > 0 && (
                <div className="flex justify-between items-center text-[13px]">
                  <span className="text-text-secondary">Taxes</span>
                  <span className="font-medium text-text-primary">+ ₹{taxes.toLocaleString('en-IN')}</span>
                </div>
              )}
              
              <div className="flex justify-between items-center text-[13px]">
                <span className="text-text-secondary flex items-center gap-1">
                  Gateway/Convenience Fee <Info size={12} className="text-text-muted" />
                </span>
                <span className="font-medium text-text-primary">Calculated at next step</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border border-dashed flex justify-between items-center">
              <span className="text-[14px] font-bold text-text-primary">Total Payable</span>
              <span className="text-[22px] font-extrabold text-primary">₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>

            <button
              onClick={onProceed}
              disabled={selectedInvoices.length === 0}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary-hover disabled:bg-surface-muted disabled:text-text-muted text-white text-[14px] font-semibold rounded-lg transition"
            >
              <Lock size={16} />
              Continue to Secure Payment
            </button>
          </>
        )}
      </div>

      <div className="p-4 bg-surface-muted/50 border-t border-border space-y-4">
        <div>
          <h4 className="text-[12px] font-bold text-text-primary flex items-center gap-1.5 mb-2">
            <ShieldCheck size={14} className="text-success" /> Trusted & Secure Payment
          </h4>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            All payments are encrypted and processed securely. CampusOS does not store full card or UPI details. A formal receipt will be generated immediately upon successful confirmation.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px]">
          <Link href="/legal/refund-and-cancellation" target="_blank" className="text-primary hover:underline flex items-center gap-1">
            <FileText size={12} /> Refund Policy
          </Link>
          <Link href="/legal/payment-terms" target="_blank" className="text-primary hover:underline flex items-center gap-1">
            <FileText size={12} /> Payment Terms
          </Link>
          <Link href="/legal/privacy" target="_blank" className="text-primary hover:underline flex items-center gap-1">
            <FileText size={12} /> Privacy Notice
          </Link>
          <Link href="/payments/help" target="_blank" className="text-primary hover:underline flex items-center gap-1">
            <Info size={12} /> Support
          </Link>
        </div>
      </div>
    </div>
  );
}
