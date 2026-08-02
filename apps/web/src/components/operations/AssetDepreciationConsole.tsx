'use client';

import React, { useState } from 'react';
import { Layers, Calendar, DollarSign, QrCode } from 'lucide-react';
import { generateAssetDepreciationSchedule, PhysicalAsset, DepreciationYear } from '../../lib/operations-service';

export function AssetDepreciationConsole() {
  const [asset] = useState<PhysicalAsset>({
    assetId: 'AST-LAB-2026-99',
    assetName: 'High-Performance AI Compute Server Node',
    purchaseCost: 20000,
    salvageValue: 2000,
    usefulLifeYears: 5,
    purchaseYear: 2026,
  });

  const [schedule] = useState<DepreciationYear[]>(() => generateAssetDepreciationSchedule(asset));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers size={20} className="text-amber-500" />
            <span>Asset Tracking & Straight-Line Depreciation Schedule</span>
          </h2>
          <p className="text-xs text-gray-500">
            QR/RFID physical asset tagging • Straight-line book value depreciation calculator
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <div>
          <span className="font-mono text-xs text-amber-500 font-bold">{asset.assetId}</span>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">{asset.assetName}</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Initial Cost: <span className="font-bold text-gray-800 dark:text-gray-200">${asset.purchaseCost.toLocaleString()}</span> • Useful Life: {asset.usefulLifeYears} Years
          </p>
        </div>

        <div className="p-2 bg-white rounded-lg border">
          <QrCode size={36} className="text-gray-900" />
        </div>
      </div>

      {/* Depreciation Schedule Table */}
      <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-gray-50 dark:bg-gray-800 text-[10px] uppercase font-bold text-gray-500">
            <tr>
              <th className="p-3">Year</th>
              <th className="p-3">Beginning Value</th>
              <th className="p-3">Annual Expense</th>
              <th className="p-3">Accumulated Depreciation</th>
              <th className="p-3 text-right">Ending Book Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {schedule.map((row) => (
              <tr key={row.year} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 font-mono">
                <td className="p-3 font-bold text-indigo-500">{row.year}</td>
                <td className="p-3">${row.beginningValue.toLocaleString()}</td>
                <td className="p-3 text-rose-500 font-semibold">-${row.depreciationExpense.toLocaleString()}</td>
                <td className="p-3 text-gray-400">${row.accumulatedDepreciation.toLocaleString()}</td>
                <td className="p-3 text-right font-extrabold text-emerald-500">${row.endingBookValue.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
