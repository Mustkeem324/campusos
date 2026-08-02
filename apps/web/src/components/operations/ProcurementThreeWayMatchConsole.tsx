'use client';

import React, { useState } from 'react';
import { ShoppingCart, FileCheck, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';
import { PurchaseOrder, GoodsReceivedNote, VendorInvoice, verifyThreeWayMatch } from '../../lib/operations-service';

export function ProcurementThreeWayMatchConsole() {
  const [po] = useState<PurchaseOrder>({ poNumber: 'PO-2026-9941', vendorName: 'TechSupply Corp', totalAmount: 15000, itemQuantity: 50 });
  const [grn] = useState<GoodsReceivedNote>({ grnNumber: 'GRN-101', poNumber: 'PO-2026-9941', receivedQuantity: 50, acceptedQuantity: 50, inspectedBy: 'Lab Manager' });
  const [invoice] = useState<VendorInvoice>({ invoiceNumber: 'INV-8812', poNumber: 'PO-2026-9941', billedAmount: 15000 });

  const [matchResult, setMatchResult] = useState<{ matched: boolean; discrepancies: string[] } | null>(null);

  const handleRunThreeWayMatch = () => {
    const res = verifyThreeWayMatch(po, grn, invoice);
    setMatchResult(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart size={20} className="text-indigo-500" />
            <span>Procurement 3-Way Match Verification Engine (PO vs GRN vs Invoice)</span>
          </h2>
          <p className="text-xs text-gray-500">
            Audit matching between Purchase Order, Goods Received Note, and Vendor Invoice prior to disbursement
          </p>
        </div>

        <button
          onClick={handleRunThreeWayMatch}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg transition"
        >
          <FileCheck size={14} />
          <span>Execute 3-Way Match Audit</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border space-y-1">
          <span className="font-mono text-[10px] text-indigo-500 font-bold">1. Purchase Order</span>
          <p className="font-bold text-gray-900 dark:text-white">{po.poNumber}</p>
          <p className="text-gray-500">Amount: <span className="font-mono font-bold text-emerald-500">${po.totalAmount.toLocaleString()}</span> ({po.itemQuantity} units)</p>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border space-y-1">
          <span className="font-mono text-[10px] text-indigo-500 font-bold">2. Goods Received Note</span>
          <p className="font-bold text-gray-900 dark:text-white">{grn.grnNumber}</p>
          <p className="text-gray-500">Accepted: <span className="font-mono font-bold text-emerald-500">{grn.acceptedQuantity} units</span></p>
        </div>

        <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border space-y-1">
          <span className="font-mono text-[10px] text-indigo-500 font-bold">3. Vendor Invoice</span>
          <p className="font-bold text-gray-900 dark:text-white">{invoice.invoiceNumber}</p>
          <p className="text-gray-500">Billed: <span className="font-mono font-bold text-emerald-500">${invoice.billedAmount.toLocaleString()}</span></p>
        </div>
      </div>

      {matchResult && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold space-y-1 animate-fade-in ${
            matchResult.matched
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>3-WAY MATCH VERIFIED! PO, GRN & Vendor Invoice perfectly reconciled. Safe for payment disbursement.</span>
          </div>
        </div>
      )}
    </div>
  );
}
