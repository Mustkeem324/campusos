'use client';

import React, { useState } from 'react';
import { CreditCard, QrCode, CheckCircle2, ShieldCheck, FileText, Download } from 'lucide-react';
import { processPaymentWebhookIdempotent } from '../../lib/finance-engine';
import crypto from 'crypto';

export function PaymentConsole() {
  const [activeMode, setActiveMode] = useState<'ONLINE' | 'OFFLINE'>('ONLINE');
  const [receiptResult, setReceiptResult] = useState<string | null>(null);

  const handleSimulatePayment = () => {
    const txId = `tx_sim_${Date.now()}`;
    const amount = 2400;
    const webhookSecret = 'whsec_campusos_secret_123';
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(`${txId}:${amount}`)
      .digest('hex');

    const res = processPaymentWebhookIdempotent({
      transactionId: txId,
      invoiceId: 'inv_btech_101',
      studentId: 'usr_student_01',
      amount,
      paymentMethod: 'UPI',
      signature,
    });

    if (res.success) {
      setReceiptResult(`PAID! ${res.message} (Receipt: ${res.receiptNumber})`);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard size={20} className="text-emerald-500" />
            <span>Multi-Channel Payment Gateway & Serialized Receipts</span>
          </h2>
          <p className="text-xs text-gray-500">
            Razorpay / Stripe / UPI QR / Netbanking / Offline Cash & Cheque recording
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveMode('ONLINE')}
            className={`px-3 py-1 rounded-lg ${activeMode === 'ONLINE' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Online Gateway / UPI
          </button>
          <button
            onClick={() => setActiveMode('OFFLINE')}
            className={`px-3 py-1 rounded-lg ${activeMode === 'OFFLINE' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400'}`}
          >
            Offline Ledger Recording
          </button>
        </div>
      </div>

      {activeMode === 'ONLINE' && (
        <div className="space-y-4 text-center py-4">
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 inline-block space-y-3">
            <QrCode size={120} className="mx-auto text-emerald-400" />
            <p className="text-xs text-emerald-300 font-mono font-bold">Scan to Pay via UPI / Razorpay / Stripe</p>
            <p className="text-[10px] text-slate-400">Total Invoice Amount: <span className="font-bold text-white">$2,400.00</span></p>
          </div>

          <div>
            <button
              onClick={handleSimulatePayment}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xl transition"
            >
              Simulate Instant UPI / Razorpay Payment Webhook
            </button>
          </div>

          {receiptResult && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200 text-xs font-bold font-mono animate-fade-in flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{receiptResult}</span>
              </div>
              <button className="px-3 py-1 rounded bg-emerald-600 text-white text-[10px] font-bold">
                Download Serial Receipt PDF
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
