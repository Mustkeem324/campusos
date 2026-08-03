import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Network, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export default async function IntegrationCatalogPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const connections = await prisma.integrationConnection.findMany({
    where: { tenantId: session.tenantId },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Integration Hub & Enterprise Ecosystem</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Centralized connection management for DigiLocker, Razorpay, Google Workspace, MS Teams, and Canvas LMS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#078A57] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Encrypted Credentials • Server-Side Scoped</span>
          </span>
        </div>
      </div>

      {/* Connection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((conn) => (
          <div key={conn.id} className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-[#1754E8] bg-[#EDF3FF] px-2 py-0.5 rounded uppercase">
                {conn.category}
              </span>
              <span className="text-xs font-bold text-[#078A57] bg-[#E6F4ED] px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {conn.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#101828] uppercase">{conn.provider}</h3>
              <p className="text-xs text-[#5F6C7B] mt-1">Sync Frequency: {conn.syncFrequency}</p>
            </div>
            <div className="pt-3 border-t border-[#DFE6F0] text-xs text-[#5F6C7B] flex items-center gap-1">
              <RefreshCw className="w-3 h-3 text-[#1754E8]" />
              <span>Last synced: {new Date(conn.lastSyncAt).toLocaleTimeString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
