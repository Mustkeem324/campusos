import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Store, ShieldCheck, CheckCircle2, Lock } from 'lucide-react';

export default async function MarketplaceAppsPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const apps = await prisma.marketplaceApp.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Store className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">CampusOS Developer Marketplace & App Portal</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Verified third-party higher education apps with explicit permission review and tenant isolation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#EDF3FF] text-[#1754E8] text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#078A57]" />
            <span>Scoped OAuth Permission Review</span>
          </span>
        </div>
      </div>

      {/* App Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {apps.map((app) => (
          <div key={app.id} className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-[#1754E8] bg-[#EDF3FF] px-2 py-0.5 rounded">
                  {app.category}
                </span>
                <span className="text-xs font-bold text-[#078A57] bg-[#E6F4ED] px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {app.status}
                </span>
              </div>
              <div>
                <h3 className="font-bold text-base text-[#101828]">{app.name}</h3>
                <p className="text-xs text-[#5F6C7B] mt-0.5">Publisher: {app.publisher}</p>
              </div>
              <p className="text-xs text-[#5F6C7B] leading-relaxed line-clamp-2">{app.description}</p>
            </div>

            <div className="pt-3 border-t border-[#DFE6F0] space-y-2">
              <div className="text-[11px] font-semibold text-[#5F6C7B] flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#1754E8]" />
                Requested Permissions: {app.requestedPermissions.join(', ')}
              </div>
              <button className="w-full bg-[#1754E8] text-white hover:bg-[#103FC2] font-semibold py-2 rounded-lg text-xs transition-colors">
                Review & Install App
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
