'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';

/** Error state for the student dashboard. Keeps the shell intact and offers a retry route. */
export function StudentDashboardError({ message }: { message: string }) {
  return (
    <section className="rounded-2xl border border-danger/30 bg-danger-soft p-6" role="alert" aria-live="assertive">
      <div className="flex gap-3">
        <AlertCircle className="shrink-0 text-danger" size={20} />
        <div>
          <h2 className="font-semibold text-text-primary">Unable to load your dashboard</h2>
          <p className="mt-1 text-sm leading-6 text-text-secondary">{message}</p>
          <Link
            href="/dashboard/student"
            className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-soft"
          >
            Try again <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  );
}

/** Skeleton used while the dashboard payload is being resolved. */
export function StudentDashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading student dashboard" aria-busy="true">
      <div className="h-40 animate-pulse rounded-2xl border border-border bg-surface-muted" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-32 animate-pulse rounded-2xl border border-border bg-surface-muted" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-muted lg:col-span-7" />
        <div className="h-64 animate-pulse rounded-2xl border border-border bg-surface-muted lg:col-span-5" />
      </div>
    </div>
  );
}
