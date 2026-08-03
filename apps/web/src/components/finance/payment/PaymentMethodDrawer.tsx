'use client';

import React, { useState } from 'react';
import { X, CreditCard, Building2, Smartphone, Receipt, CheckCircle2 } from 'lucide-react';
import { processPaymentWebhookIdempotent } from '../../../lib/finance-engine';
import crypto from 'crypto';

interface Invoice {
  id: string;
  amount: number;
  paid: number;
  balance: number;
  feeHeads: { head: string; amount: number; paid: number; balance: number }[];
}

export function PaymentMethodDrawer({ 
  isOpen, 
  onClose, 
  selectedInvoices 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  selectedInvoices: Invoice[] 
}) {
  const [step, setStep] = useState<'SELECT_METHOD' | 'UPI_QR' | 'SUCCESS'>('SELECT_METHOD');
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  
  const totalBalance = selectedInvoices.reduce((acc, inv) => acc + inv.balance, 0);
  const totalPayable = totalBalance + (selectedInvoices.some(i => i.id === 'inv_1') ? 500 : 0); // Adding late fee logic from summary

  const handleSimulateUpi = () => {
    // We mock the idempotency and webhook callback directly here
    const txId = `tx_sim_${Date.now()}`;
    const webhookSecret = 'whsec_campusos_secret_123';
    
    // Simulate server side crypto call for demo purposes
    // Note: In real production, this is done on the backend.
    // For this client demo, we just pass a fake signature if crypto fails or use simple text.
    const signature = "demo-signature"; 

    const res = processPaymentWebhookIdempotent({
      transactionId: txId,
      invoiceId: selectedInvoices[0]?.id || 'inv_unknown',
      studentId: 'usr_student_01',
      amount: totalPayable,
      paymentMethod: 'UPI',
      signature,
    });

    if (res.success) {
      setReceiptNumber(res.receiptNumber || null);
      setStep('SUCCESS');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-navy/20 backdrop-blur-sm z-40 transition-opacity" onClick={onClose}></div>
      <div className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-surface shadow-2xl z-50 flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-[18px] font-bold text-text-primary">Secure Payment</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-surface-muted text-text-secondary transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'SELECT_METHOD' && (
            <div className="space-y-6">
              <div className="bg-primary-soft rounded-xl p-4 flex justify-between items-center">
                <span className="text-[14px] font-medium text-primary">Amount Payable</span>
                <span className="text-[20px] font-extrabold text-primary">₹{totalPayable.toLocaleString('en-IN')}</span>
              </div>

              <div>
                <h3 className="text-[14px] font-bold text-text-primary mb-3">Select Payment Method</h3>
                <div className="space-y-3">
                  <button onClick={() => setStep('UPI_QR')} className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-surface-muted transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border shadow-sm group-hover:border-primary/30">
                        <Smartphone size={20} className="text-text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-text-primary">UPI QR</p>
                        <p className="text-[12px] text-text-secondary">Google Pay, PhonePe, Paytm</p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-surface-muted transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border shadow-sm group-hover:border-primary/30">
                        <CreditCard size={20} className="text-text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-text-primary">Credit / Debit Card</p>
                        <p className="text-[12px] text-text-secondary">Visa, Mastercard, RuPay</p>
                      </div>
                    </div>
                  </button>

                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-surface-muted transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border shadow-sm group-hover:border-primary/30">
                        <Building2 size={20} className="text-text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-text-primary">Net Banking</p>
                        <p className="text-[12px] text-text-secondary">All major Indian banks</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary hover:bg-surface-muted transition group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center border border-border shadow-sm group-hover:border-primary/30">
                        <Receipt size={20} className="text-text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="text-[14px] font-bold text-text-primary">Offline Payment</p>
                        <p className="text-[12px] text-text-secondary">NEFT/RTGS, Cheque submission</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 'UPI_QR' && (
            <div className="flex flex-col items-center justify-center space-y-6 h-full text-center">
              <div>
                <h3 className="text-[18px] font-bold text-text-primary mb-1">Scan to Pay</h3>
                <p className="text-[13px] text-text-secondary">Open any UPI app to scan and pay</p>
              </div>

              <div className="p-4 bg-white border border-border rounded-2xl shadow-sm">
                {/* Fake QR code for mockup purposes */}
                <div className="w-[200px] h-[200px] bg-slate-900 rounded-lg flex items-center justify-center">
                   <div className="grid grid-cols-4 grid-rows-4 gap-1 p-2 w-full h-full opacity-80">
                     {Array.from({length: 16}).map((_, i) => (
                       <div key={i} className="bg-white rounded-sm"></div>
                     ))}
                   </div>
                </div>
              </div>

              <div className="text-[24px] font-extrabold text-primary">₹{totalPayable.toLocaleString('en-IN')}</div>
              
              <div className="bg-surface-muted px-4 py-2 rounded-lg border border-border flex items-center justify-between w-full max-w-[260px]">
                <span className="text-[13px] text-text-secondary">campusos.upes@icici</span>
                <button className="text-[12px] font-bold text-primary">Copy</button>
              </div>

              <button 
                onClick={handleSimulateUpi}
                className="w-full max-w-[260px] py-3 bg-success hover:bg-success/90 text-white rounded-xl text-[14px] font-semibold transition"
              >
                Simulate Payment Success
              </button>

              <p className="text-[12px] text-text-muted mt-4">Powered by Razorpay Secure</p>
            </div>
          )}

          {step === 'SUCCESS' && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-success-soft flex items-center justify-center mb-2">
                <CheckCircle2 size={40} className="text-success" />
              </div>
              <h3 className="text-[24px] font-bold text-text-primary">Payment Successful!</h3>
              <p className="text-[14px] text-text-secondary max-w-xs">
                Your payment of <span className="font-bold text-text-primary">₹{totalPayable.toLocaleString('en-IN')}</span> has been received.
              </p>
              <div className="bg-surface-muted px-4 py-3 rounded-lg border border-border mt-4 w-full max-w-[300px]">
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="text-text-secondary">Receipt No:</span>
                  <span className="font-bold text-text-primary">{receiptNumber}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span className="text-text-secondary">Transaction ID:</span>
                  <span className="font-bold text-text-primary">tx_sim_{Date.now().toString().slice(-6)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {step === 'SUCCESS' && (
          <div className="p-5 border-t border-border">
            <button 
              onClick={onClose}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-[14px] font-semibold transition"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </>
  );
}
