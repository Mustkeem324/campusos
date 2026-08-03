'use client';

import React, { useState } from 'react';
import { PaymentPageHeader } from './PaymentPageHeader';
import { FinancialSummaryGrid } from './FinancialSummaryGrid';
import { InvoiceTable } from './InvoiceTable';
import { PaymentSummary } from './PaymentSummary';
import { RecentTransactionsTable } from './RecentTransactionsTable';
import { FinanceHelpCard } from './FinanceHelpCard';
import { PaymentMethodDrawer } from './PaymentMethodDrawer';

export function PaymentPage() {
  const [selectedInvoices, setSelectedInvoices] = useState<any[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in pb-24 lg:pb-8">
      <PaymentPageHeader />
      <FinancialSummaryGrid />
      
      <div className="flex flex-col xl:flex-row gap-4 mt-6">
        <div className="w-full xl:w-[74%] space-y-6">
          <InvoiceTable onSelect={setSelectedInvoices} />
          <RecentTransactionsTable />
        </div>
        <div className="w-full xl:w-[26%] space-y-6">
          <PaymentSummary 
            selectedInvoices={selectedInvoices} 
            onProceed={() => setIsDrawerOpen(true)} 
          />
          <FinanceHelpCard />
        </div>
      </div>

      {isDrawerOpen && (
        <PaymentMethodDrawer 
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          selectedInvoices={selectedInvoices}
        />
      )}
    </div>
  );
}
