import type { Metadata } from 'next';
import Link from 'next/link';
import type { ElementType } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CloudCog,
  Database,
  ExternalLink,
  Globe2,
  RefreshCw,
  Server,
  ShieldCheck,
} from 'lucide-react';

import {
  getSystemHealth,
  type ComponentHealthStatus,
} from '@/lib/system-health';

export const metadata: Metadata = {
  title: 'System Status | CampusOS',
  description: 'Live availability and database health for the CampusOS platform.',
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type StatusCardProps = {
  title: string;
  detail: string;
  status: ComponentHealthStatus;
  icon: ElementType;
  metric?: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'medium',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(value));
}

function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

function StatusCard({ title, detail, status, icon: Icon, metric }: StatusCardProps) {
  const isOperational = status === 'operational';

  return (
    <article className="rounded-[22px] border border-[#D8E2EF] bg-white p-5 shadow-[0_12px_34px_rgba(16,29,56,0.05)] sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            isOperational
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-700'
          }`}
        >
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>

        <span
          className={`inline-flex min-h-7 items-center gap-1.5 rounded-full px-2.5 text-[11px] font-extrabold uppercase tracking-[0.08em] ${
            isOperational
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-amber-50 text-amber-800'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isOperational ? 'bg-emerald-600' : 'bg-amber-600'
            }`}
            aria-hidden="true"
          />
          {isOperational ? 'Operational' : 'Unavailable'}
        </span>
      </div>

      <h2 className="mt-5 text-base font-extrabold text-[#101D38]">{title}</h2>
      <p className="mt-2 min-h-12 text-sm leading-6 text-[#667085]">{detail}</p>

      {metric && (
        <p className="mt-4 border-t border-[#E7ECF3] pt-4 text-xs font-bold text-[#526175]">
          {metric}
        </p>
      )}
    </article>
  );
}

export default async function StatusPage() {
  const health = await getSystemHealth();
  const isOperational = health.status === 'operational';
  const databaseLatency = health.checks.database.latencyMs;

  return (
    <div className="bg-[#F7F9FC] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <section
          className="overflow-hidden rounded-[28px] border border-[#D8E2EF] bg-white shadow-[0_24px_70px_rgba(16,29,56,0.08)]"
          aria-labelledby="system-status-heading"
        >
          <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)]">
            <div className="p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8]">
                <Activity className="h-4 w-4" aria-hidden="true" />
                Live platform health
              </div>

              <h1
                id="system-status-heading"
                className="mt-5 text-3xl font-extrabold tracking-[-0.04em] text-[#101D38] sm:text-4xl"
              >
                CampusOS system status
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5F6C7B] sm:text-base">
                Real-time availability for the application runtime, API layer and
                primary database connection.
              </p>

              <div
                className={`mt-7 flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${
                  isOperational
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : 'border-amber-200 bg-amber-50/80'
                }`}
                role="status"
                aria-live="polite"
              >
                {isOperational ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden="true" />
                )}

                <div>
                  <p
                    className={`font-extrabold ${
                      isOperational ? 'text-emerald-900' : 'text-amber-950'
                    }`}
                  >
                    {isOperational
                      ? 'All monitored systems are operational'
                      : 'Some services are currently degraded'}
                  </p>
                  <p
                    className={`mt-1 text-sm leading-6 ${
                      isOperational ? 'text-emerald-800' : 'text-amber-900'
                    }`}
                  >
                    Last checked {formatDateTime(health.timestamp)}
                  </p>
                </div>
              </div>
            </div>

            <aside className="border-t border-[#2B456B] bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#385477] bg-[#172A4D] text-[#8CB2FF]">
                  <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#9DB8E5]">
                    Current environment
                  </p>
                  <p className="mt-1 font-extrabold capitalize">{health.environment}</p>
                </div>
              </div>

              <dl className="mt-7 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-[#2B456B] pb-4">
                  <dt className="text-[#B8C6D9]">Build</dt>
                  <dd className="font-bold text-white">{health.version}</dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-[#2B456B] pb-4">
                  <dt className="text-[#B8C6D9]">Runtime uptime</dt>
                  <dd className="font-bold text-white">{formatUptime(health.uptimeSeconds)}</dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="text-[#B8C6D9]">Region</dt>
                  <dd className="font-bold text-white">{health.region || 'Platform managed'}</dd>
                </div>
              </dl>
            </aside>
          </div>
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Service availability">
          <StatusCard
            title="Web application"
            detail="Public pages and authenticated workspaces are served by the current deployment."
            status={health.checks.application.status}
            icon={Globe2}
            metric="Current request served successfully"
          />
          <StatusCard
            title="API runtime"
            detail="Server-side routes, authentication handlers and health responses share the active runtime."
            status={health.checks.application.status}
            icon={Server}
            metric="Health endpoint available"
          />
          <StatusCard
            title="Primary database"
            detail="A live read query is performed for every health snapshot without exposing database details."
            status={health.checks.database.status}
            icon={Database}
            metric={databaseLatency === null ? 'No response received' : `${databaseLatency} ms response time`}
          />
          <StatusCard
            title="Production deployment"
            detail="The active build is serving this status page through the configured hosting environment."
            status={health.checks.application.status}
            icon={CloudCog}
            metric={`Build ${health.version}`}
          />
        </section>

        <section className="mt-6 grid gap-5 rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.05)] sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
              <Clock3 className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-extrabold text-[#101D38]">Need a fresh check?</h2>
              <p className="mt-1 text-sm leading-6 text-[#667085]">
                Refresh this page for a new database probe, or open the machine-readable
                endpoint for monitoring tools.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              href="/status"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#C9D8EE] bg-white px-4 text-sm font-extrabold text-[#101D38] transition hover:border-[#1754E8] hover:text-[#1754E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Refresh status
            </Link>
            <Link
              href="/api/health"
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-4 text-sm font-extrabold text-white transition hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 focus-visible:ring-offset-2"
            >
              Open health JSON
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
