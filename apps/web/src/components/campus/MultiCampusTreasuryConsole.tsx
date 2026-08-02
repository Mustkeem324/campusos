'use client';

import React, { useState } from 'react';
import { Building2, DollarSign, Globe, Layers, ArrowUpRight } from 'lucide-react';
import { calculateConsolidatedGroupFinancials, CampusFinancialSummary } from '../../lib/multicampus-service';

export function MultiCampusTreasuryConsole() {
  const [campuses] = useState<CampusFinancialSummary[]>([
    { campusId: 'camp_main', campusName: 'Apex Main Campus (India)', currency: 'INR', tuitionCollectedLocal: 83000000 }, // 83M INR = $1M USD
    { campusId: 'camp_dubai', campusName: 'Apex Dubai Campus (UAE)', currency: 'AED', tuitionCollectedLocal: 3670000 },  // 3.67M AED = $1M USD
    { campusId: 'camp_ny', campusName: 'Apex New York Campus (USA)', currency: 'USD', tuitionCollectedLocal: 1500000 },   // $1.5M USD
  ]);

  const [groupFinancials] = useState(() => calculateConsolidatedGroupFinancials(campuses, 'USD'));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Globe size={20} className="text-indigo-500" />
            <span>Multi-Campus Group Treasury & Financial Consolidation</span>
          </h2>
          <p className="text-xs text-gray-500">
            Real-time multi-currency revenue aggregation across global campuses
          </p>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-900 dark:text-emerald-200">
        <span className="text-[10px] uppercase font-bold">Consolidated Group Revenue (USD)</span>
        <h3 className="text-3xl font-extrabold mt-1">
          ${groupFinancials.totalGroupRevenueTargetCurrency.toLocaleString()} USD
        </h3>
      </div>

      <div className="space-y-3">
        <h4 className="text-xs uppercase font-bold text-gray-400">Campus Revenue Breakdown</h4>
        <div className="space-y-2">
          {groupFinancials.breakdown.map((b) => (
            <div key={b.campusName} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border flex justify-between text-xs">
              <span className="font-bold text-gray-900 dark:text-white">{b.campusName}</span>
              <span className="font-mono font-extrabold text-emerald-500">${b.amountInTargetCurrency.toLocaleString()} USD</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
