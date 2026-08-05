import Image from 'next/image';
import React from 'react';
import { Download, Phone } from 'lucide-react';
import { useAuthStore } from '../../../lib/auth-store';

export function PaymentPageHeader() {
  const { currentSession } = useAuthStore();

  if (!currentSession) {
    return null;
  }

  const initials = currentSession.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <div className="mb-6 space-y-4">
      <nav aria-label="Breadcrumb" className="flex text-[13px] text-text-secondary">
        <ol className="flex items-center space-x-2">
          <li>Home</li>
          <li aria-hidden="true">/</li>
          <li>Finance</li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="font-medium text-text-primary">
            Fees &amp; Payments
          </li>
        </ol>
      </nav>

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-[28px] font-bold leading-[36px] text-text-primary">Fees &amp; Payments</h1>
          <p className="text-[14px] text-text-secondary">
            Review invoices, pay outstanding fees and download verified receipts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-text-primary transition hover:bg-surface-muted"
          >
            <Download size={16} aria-hidden="true" />
            Download Fee Statement
          </button>
          <button
            type="button"
            className="flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 py-2 text-[14px] font-medium text-text-primary transition hover:bg-surface-muted"
          >
            <Phone size={16} aria-hidden="true" />
            Contact Finance Office
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-6 rounded-xl border border-border bg-surface p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          {currentSession.avatarUrl ? (
            <Image
              unoptimized
              src={currentSession.avatarUrl}
              alt={`${currentSession.name}'s avatar`}
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary"
            >
              {initials || 'U'}
            </div>
          )}
          <div>
            <h2 className="text-[16px] font-bold text-text-primary">{currentSession.name}</h2>
            <p className="text-[13px] text-text-secondary">
              {currentSession.id.toUpperCase().replace('USR_', '')}
            </p>
          </div>
        </div>

        <div className="hidden h-10 w-px bg-border md:block" aria-hidden="true" />

        <div className="grid flex-1 grid-cols-2 gap-4 md:grid-cols-3">
          <div>
            <p className="mb-1 text-[12px] text-text-secondary">Programme</p>
            <p className="text-[14px] font-medium text-text-primary">B.Tech Computer Science</p>
          </div>
          <div>
            <p className="mb-1 text-[12px] text-text-secondary">Batch</p>
            <p className="text-[14px] font-medium text-text-primary">2023–2027</p>
          </div>
          <div>
            <p className="mb-1 text-[12px] text-text-secondary">Semester</p>
            <p className="text-[14px] font-medium text-text-primary">IV</p>
          </div>
        </div>
      </div>
    </div>
  );
}
