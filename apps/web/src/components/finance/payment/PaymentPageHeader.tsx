import React from 'react';
import { Download, Phone } from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';

export function PaymentPageHeader() {
  const { currentSession } = useAuthStore();

  return (
    <div className="mb-6 space-y-4">
      {/* Breadcrumb */}
      <nav className="flex text-[13px] text-text-secondary">
        <ol className="flex items-center space-x-2">
          <li>Home</li>
          <li>/</li>
          <li>Finance</li>
          <li>/</li>
          <li className="text-text-primary font-medium">Fees & Payments</li>
        </ol>
      </nav>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold text-text-primary leading-[36px]">Fees & Payments</h1>
          <p className="text-text-secondary text-[14px]">
            Review invoices, pay outstanding fees and download verified receipts.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-text-primary hover:bg-surface-muted transition">
            <Download size={16} />
            Download Fee Statement
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border text-[14px] font-medium text-text-primary hover:bg-surface-muted transition">
            <Phone size={16} />
            Contact Finance Office
          </button>
        </div>
      </div>

      {/* Student Context Card */}
      <div className="bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-6 mt-4">
        <div className="flex items-center gap-4">
          <img
            src={currentSession.avatarUrl}
            alt={currentSession.name}
            className="w-12 h-12 rounded-full object-cover"
          />
          <div>
            <h2 className="text-[16px] font-bold text-text-primary">{currentSession.name}</h2>
            <p className="text-text-secondary text-[13px]">{currentSession.id.toUpperCase().replace('USR_', '')}</p>
          </div>
        </div>

        <div className="hidden md:block w-px h-10 bg-border"></div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[12px] text-text-secondary mb-1">Programme</p>
            <p className="text-[14px] font-medium text-text-primary">B.Tech Computer Science</p>
          </div>
          <div>
            <p className="text-[12px] text-text-secondary mb-1">Batch</p>
            <p className="text-[14px] font-medium text-text-primary">2023–2027</p>
          </div>
          <div>
            <p className="text-[12px] text-text-secondary mb-1">Semester</p>
            <p className="text-[14px] font-medium text-text-primary">IV</p>
          </div>
        </div>
      </div>
    </div>
  );
}
