import React from 'react';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Cpu, ShieldCheck, CheckCircle2, Activity } from 'lucide-react';

export default async function SmartCampusPage() {
  const session = await getSessionFromCookies();
  if (!session) {
    redirect('/login');
  }

  const devices = await prisma.smartDevice.findMany({
    where: { tenantId: session.tenantId },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-[#101828]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DFE6F0] pb-5">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-7 h-7 text-[#1754E8]" />
            <h1 className="text-2xl font-bold text-[#101A32]">Smart Campus & IoT Operations Command Centre</h1>
          </div>
          <p className="text-sm text-[#5F6C7B] mt-1">
            Real-time classroom occupancy sensors, building energy meters, access control telemetry, and environmental alerts.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-[#EDF3FF] text-[#1754E8] text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#078A57]" />
            <span>Human-in-the-Loop Incident Confirmation</span>
          </span>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-white border border-[#DFE6F0] rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-[#1754E8] bg-[#EDF3FF] px-2 py-0.5 rounded">
                {device.deviceType}
              </span>
              <span className="text-xs font-bold text-[#078A57] bg-[#E6F4ED] px-2 py-0.5 rounded flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {device.status}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#101828]">{device.deviceName}</h3>
              <p className="text-xs text-[#5F6C7B] mt-0.5">Location: {device.spaceName}</p>
            </div>
            <div className="bg-[#F6F8FC] p-3 rounded-lg border border-[#DFE6F0] text-xs space-y-1">
              <div className="text-[#5F6C7B] flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-[#1754E8]" />
                Latest Reading
              </div>
              <div className="font-bold text-sm text-[#101828]">{device.lastReading}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
