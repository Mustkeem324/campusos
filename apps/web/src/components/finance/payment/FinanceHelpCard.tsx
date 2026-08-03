'use client';

import React from 'react';
import { HelpCircle, ChevronRight } from 'lucide-react';

export function FinanceHelpCard() {
  return (
    <div className="bg-surface border border-border rounded-xl shadow-sm mt-6 p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary-soft flex items-center justify-center">
          <HelpCircle size={18} className="text-primary" />
        </div>
        <h3 className="text-[16px] font-bold text-text-primary">Need Help?</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-muted hover:border-border-strong transition group">
          <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary">Fee Payment Policy</span>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary" />
        </button>
        <button className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-muted hover:border-border-strong transition group">
          <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary">Refund Policy</span>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary" />
        </button>
        <button className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-muted hover:border-border-strong transition group">
          <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary">Frequently Asked Questions</span>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary" />
        </button>
        <button className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-surface-muted hover:border-border-strong transition group">
          <span className="text-[13px] font-medium text-text-secondary group-hover:text-text-primary">Contact Finance Office</span>
          <ChevronRight size={16} className="text-text-muted group-hover:text-text-primary" />
        </button>
      </div>
    </div>
  );
}
