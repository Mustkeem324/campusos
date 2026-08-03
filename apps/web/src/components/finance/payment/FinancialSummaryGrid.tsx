import React from 'react';
import { ShieldCheck, Calendar, Download, Award } from 'lucide-react';

export function FinancialSummaryGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Card 1: Outstanding Balance */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[14px] font-medium text-text-secondary">Outstanding Balance</p>
          <div className="w-8 h-8 rounded-full bg-primary-soft flex items-center justify-center">
            <ShieldCheck size={16} className="text-primary" />
          </div>
        </div>
        <div>
          <h3 className="text-[22px] font-bold text-text-primary mb-2">₹24,000.00</h3>
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-danger-soft text-danger uppercase tracking-wider">
              Due
            </span>
            <button className="text-[13px] font-medium text-primary hover:text-primary-hover transition">
              Pay Now
            </button>
          </div>
        </div>
      </div>

      {/* Card 2: Next Due Date */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[14px] font-medium text-text-secondary">Next Due Date</p>
          <div className="w-8 h-8 rounded-full bg-danger-soft flex items-center justify-center">
            <Calendar size={16} className="text-danger" />
          </div>
        </div>
        <div>
          <h3 className="text-[22px] font-bold text-text-primary mb-2">15 May 2025</h3>
          <p className="text-[13px] text-warning font-medium">5 days remaining</p>
        </div>
      </div>

      {/* Card 3: Last Payment */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[14px] font-medium text-text-secondary">Last Payment</p>
          <div className="w-8 h-8 rounded-full bg-success-soft flex items-center justify-center">
            <Download size={16} className="text-success" />
          </div>
        </div>
        <div>
          <h3 className="text-[22px] font-bold text-text-primary mb-2">₹45,000.00</h3>
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-text-secondary">10 Apr 2025</p>
            <button className="text-[13px] font-medium text-primary hover:text-primary-hover transition">
              Download Receipt
            </button>
          </div>
        </div>
      </div>

      {/* Card 4: Scholarships / Credits */}
      <div className="bg-surface border border-border rounded-xl p-5 flex flex-col justify-between shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <p className="text-[14px] font-medium text-text-secondary">Scholarships / Credits</p>
          <div className="w-8 h-8 rounded-full bg-warning-soft flex items-center justify-center">
            <Award size={16} className="text-warning" />
          </div>
        </div>
        <div>
          <h3 className="text-[22px] font-bold text-text-primary mb-2">₹5,000.00</h3>
          <p className="text-[13px] text-success font-medium">Applied</p>
        </div>
      </div>
    </div>
  );
}
