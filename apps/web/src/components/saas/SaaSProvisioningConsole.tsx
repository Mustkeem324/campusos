'use client';

import React, { useState } from 'react';
import { Building2, Sparkles, CheckCircle2, Rocket, ArrowRight } from 'lucide-react';
import { provisionSelfServeTenant, TenantSubscription, SubscriptionTier } from '../../lib/saas-billing-service';

export function SaaSProvisioningConsole() {
  const [instName, setInstName] = useState('Stanford Institute of Technology');
  const [subdomain, setSubdomain] = useState('stanford');
  const [tier, setTier] = useState<SubscriptionTier>('GROWTH');

  const [provisionedTenant, setProvisionedTenant] = useState<TenantSubscription | null>(null);

  const handleProvision = () => {
    const res = provisionSelfServeTenant({
      institutionName: instName,
      subdomainPrefix: subdomain,
      adminEmail: 'admin@stanford.edu',
      tier,
      initialStudentCount: 2500,
    });
    setProvisionedTenant(res);
  };

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-4">
        <div>
          <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Rocket size={20} className="text-indigo-500" />
            <span>Self-Serve Multi-Tenant SaaS Provisioning Wizard</span>
          </h2>
          <p className="text-xs text-gray-500">
            Instant 3-minute tenant onboarding • Subdomain reservation (`tenant.campusos.app`) • Plan entitlement seeding
          </p>
        </div>
      </div>

      <div className="space-y-4 max-w-lg">
        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Institution Name</label>
          <input
            type="text"
            value={instName}
            onChange={(e) => setInstName(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border text-xs font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Subdomain Reservation</label>
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border text-xs font-mono font-bold text-indigo-500"
            />
            <span className="text-xs font-mono text-gray-400">.campusos.app</span>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">Select Subscription Tier</label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as SubscriptionTier)}
            className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border text-xs font-bold"
          >
            <option value="STARTER">STARTER ($1.00/student/mo)</option>
            <option value="GROWTH">GROWTH ($1.50/student/mo - Inc AI Copilot)</option>
            <option value="ENTERPRISE">ENTERPRISE ($2.00/student/mo - Custom Domain)</option>
          </select>
        </div>

        <button
          onClick={handleProvision}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-xl transition flex items-center justify-center gap-2"
        >
          <Rocket size={16} />
          <span>Provision Tenant Subdomain & Seed Database</span>
        </button>
      </div>

      {provisionedTenant && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold space-y-2 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-sm flex items-center gap-1.5">
              <CheckCircle2 size={18} /> Tenant Successfully Provisioned in 3 Minutes!
            </span>
            <span className="font-mono text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded">
              PROVISIONED ACTIVE
            </span>
          </div>
          <p className="font-mono text-xs text-emerald-700 dark:text-emerald-300">
            Subdomain: <span className="font-extrabold underline">{provisionedTenant.subdomain}</span> • Tenant ID: {provisionedTenant.tenantId} • Plan: {provisionedTenant.tier}
          </p>
        </div>
      )}
    </div>
  );
}
