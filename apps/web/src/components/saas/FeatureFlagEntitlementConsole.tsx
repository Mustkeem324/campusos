'use client';

import React, { useState } from 'react';
import { Layers, ShieldCheck, CheckCircle2, XCircle, DollarSign } from 'lucide-react';
import { evaluatePlanFeatureFlags, calculateSaaSMonthlyInvoice, SubscriptionTier } from '../../lib/saas-billing-service';

export function FeatureFlagEntitlementConsole() {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier>('GROWTH');
  const [flags] = useState(() => evaluatePlanFeatureFlags(selectedTier));
  const [invoice] = useState(() => calculateSaaSMonthlyInvoice(2500, selectedTier));

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers size={20} className="text-indigo-500" />
            <span>Plan Entitlement Feature Flags & Per-Student Usage Metering</span>
          </h2>
          <p className="text-xs text-gray-500">
            Redis-backed feature flag evaluation • $1/student/month active pricing engine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Flags Entitlement Matrix */}
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border space-y-3 text-xs">
          <h3 className="font-bold text-gray-900 dark:text-white">Active Plan Entitlements ({selectedTier})</h3>
          <div className="space-y-2">
            {Object.entries(flags).map(([flag, enabled]) => (
              <div key={flag} className="flex items-center justify-between p-2 rounded bg-white dark:bg-gray-900 border">
                <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{flag}</span>
                {enabled ? (
                  <span className="text-emerald-500 font-bold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 size={14} /> ENABLED
                  </span>
                ) : (
                  <span className="text-gray-400 font-bold flex items-center gap-1 text-[10px]">
                    <XCircle size={14} /> LOCKED
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pricing & Usage Meter Card */}
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 text-indigo-900 dark:text-indigo-200 space-y-3 text-xs">
          <h3 className="font-bold">Calculated Monthly SaaS Billing (2,500 Active Students)</h3>
          <div className="space-y-1 font-mono">
            <div className="flex justify-between">
              <span>Base Student Rate:</span>
              <span className="font-bold">${invoice.basePrice.toLocaleString()} / mo</span>
            </div>
            <div className="flex justify-between">
              <span>Storage Overage:</span>
              <span className="font-bold">${invoice.storageOverage} / mo</span>
            </div>
            <div className="pt-2 border-t flex justify-between text-sm font-extrabold text-indigo-600 dark:text-indigo-300">
              <span>Total Monthly Bill:</span>
              <span>${invoice.totalMonthly.toLocaleString()} / mo</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
