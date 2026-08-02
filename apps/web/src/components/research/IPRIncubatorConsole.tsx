'use client';

import React, { useState } from 'react';
import { Award, DollarSign, CheckCircle2, Rocket } from 'lucide-react';
import { calculateRoyaltyDistribution } from '../../lib/research-service';

export function IPRIncubatorConsole() {
  const [royalty] = useState(() => calculateRoyaltyDistribution(10000)); // $10,000 royalty test

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Rocket size={20} className="text-purple-500" />
            <span>IPR Patent Disclosures & Startup Incubator Hub</span>
          </h2>
          <p className="text-xs text-gray-500">
            Patent filing status tracking • Automated royalty distribution split (70% Inventor / 20% Univ / 10% IP Cell)
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-900 space-y-2 text-xs">
        <h4 className="font-bold text-purple-900 dark:text-purple-200">$10,000 Patent Commercialization Royalty Split</h4>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 rounded bg-white dark:bg-gray-900 border">
            <span className="text-gray-400 text-[10px]">Inventor Share (70%)</span>
            <p className="font-bold text-purple-600">${royalty.inventorShare}</p>
          </div>
          <div className="p-2 rounded bg-white dark:bg-gray-900 border">
            <span className="text-gray-400 text-[10px]">Institution Share (20%)</span>
            <p className="font-bold text-indigo-600">${royalty.institutionShare}</p>
          </div>
          <div className="p-2 rounded bg-white dark:bg-gray-900 border">
            <span className="text-gray-400 text-[10px]">IP Cell Share (10%)</span>
            <p className="font-bold text-emerald-600">${royalty.ipCellShare}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
