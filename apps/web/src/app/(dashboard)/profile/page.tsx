import type { ElementType } from 'react';
import { redirect } from 'next/navigation';
import {
  BadgeCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  KeyRound,
  Laptop2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react';

import { ProfileSessionActions } from '@/components/profile/ProfileSessionActions';
import { requireActiveUserContext } from '@/lib/active-user-context';
import { getSessionFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const [context, tokenPayload] = await Promise.all([
    requireActiveUserContext().catch(() => null),
    getSessionFromCookies(),
  ]);

  if (!context || !tokenPayload) redirect('/login');

  const user = await prisma.user.findFirst({
    where: {
      id: context.userId,
      tenantId: context.tenantId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      avatarUrl: true,
      role: true,
      isActive: true,
      emailVerified: true,
      mfaEnabled: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      institution: {
        select: {
          name: true,
          code: true,
          status: true,
        },
      },
      sessions: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          token: true,
          device: true,
          ipAddress: true,
          userAgent: true,
          expiresAt: true,
          createdAt: true,
        },
      },
    },
  });

  if (!user) redirect('/login');

  const sessions = user.sessions.map((session) => ({
    id: session.id,
    isCurrent: session.token === tokenPayload.sessionId,
    device: session.device || describeDevice(session.userAgent),
    userAgent: session.userAgent || 'Browser details not recorded',
    ipAddress: session.ipAddress || 'IP not recorded',
    createdAt: session.createdAt,
    expiresAt: session.expiresAt,
  }));

  return (
    <section className="space-y-5 sm:space-y-6" aria-labelledby="profile-page-title">
      <header className="overflow-hidden rounded-[26px] border border-[#D8E2EF] bg-white shadow-[0_24px_70px_rgba(16,29,56,0.09)] dark:border-slate-800 dark:bg-slate-950 sm:rounded-[30px]">
        <div className="grid lg:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="p-5 sm:p-8 lg:p-10">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Account profile
            </span>
            <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
              <ProfileAvatar name={user.name} />
              <div className="min-w-0">
                <h1 id="profile-page-title" className="break-words text-3xl font-extrabold tracking-[-0.045em] text-[#101D38] dark:text-white sm:text-4xl">
                  {user.name}
                </h1>
                <p className="mt-2 break-all text-sm text-[#667085] dark:text-slate-400">{user.email}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <StatusPill label={formatRole(user.role)} />
                  <StatusPill label={user.institution.name} />
                  <StatusPill label={user.isActive ? 'Active account' : 'Inactive account'} positive={user.isActive} />
                </div>
              </div>
            </div>
          </div>

          <aside className="border-t border-[#2B456B] bg-[#101D38] p-5 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9DB8E5]">Security overview</p>
            <div className="mt-5 space-y-3">
              <SecurityRow
                icon={Mail}
                label="Email verification"
                value={user.emailVerified ? 'Verified' : 'Not verified'}
                positive={Boolean(user.emailVerified)}
              />
              <SecurityRow
                icon={KeyRound}
                label="Multi-factor authentication"
                value={user.mfaEnabled ? 'Enabled' : 'Not enabled'}
                positive={user.mfaEnabled}
              />
              <SecurityRow
                icon={Laptop2}
                label="Active sessions"
                value={`${sessions.length} session${sessions.length === 1 ? '' : 's'}`}
                positive={sessions.length === 1}
              />
            </div>
            <p className="mt-5 text-xs leading-5 text-[#B8C6D9]">
              Session controls below revoke persisted database sessions as well as the browser cookie.
            </p>
          </aside>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-12 xl:gap-6">
        <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-7" aria-labelledby="identity-details-title">
          <SectionHeading id="identity-details-title" icon={BadgeCheck} title="Identity and institution" />
          <dl className="mt-5 grid gap-3 sm:grid-cols-2">
            <InformationCard icon={Mail} label="Email address" value={user.email} />
            <InformationCard icon={Phone} label="Phone number" value={user.phone || 'Not provided'} />
            <InformationCard icon={Building2} label="Institution" value={user.institution.name} detail={`Code ${user.institution.code}`} />
            <InformationCard icon={ShieldCheck} label="Institution status" value={formatStatus(user.institution.status)} />
            <InformationCard icon={CalendarDays} label="Member since" value={formatDate(user.createdAt)} />
            <InformationCard icon={Clock3} label="Last successful sign-in" value={formatDateTime(user.lastLoginAt)} />
          </dl>
        </section>

        <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6 xl:col-span-5" aria-labelledby="account-controls-title">
          <SectionHeading id="account-controls-title" icon={ShieldCheck} title="Account controls" />
          <p className="mt-3 text-sm leading-6 text-[#667085] dark:text-slate-400">
            Sign out only this browser or revoke every active session linked to your account.
          </p>
          <div className="mt-5">
            <ProfileSessionActions />
          </div>
          <div className="mt-5 rounded-2xl border border-[#D8E2EF] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#7B8798] dark:text-slate-500">Profile record</p>
            <p className="mt-3 text-sm font-extrabold text-[#101D38] dark:text-white">Last updated {formatDateTime(user.updatedAt)}</p>
            <p className="mt-2 text-xs leading-5 text-[#667085] dark:text-slate-400">
              Sensitive authentication values, password hashes and session tokens are never shown in this interface.
            </p>
          </div>
        </section>
      </div>

      <section className="rounded-[24px] border border-[#D8E2EF] bg-white p-5 shadow-[0_14px_40px_rgba(16,29,56,0.06)] dark:border-slate-800 dark:bg-slate-950 sm:p-6" aria-labelledby="active-sessions-title">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="active-sessions-title" icon={Laptop2} title="Active sessions" />
          <p className="text-xs text-[#7B8798] dark:text-slate-500">Only unexpired persisted sessions are shown.</p>
        </div>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#C9D6E6] bg-[#F8FAFD] p-6 text-center dark:border-slate-700 dark:bg-slate-900">
            <CheckCircle2 className="mx-auto h-6 w-6 text-[#718096] dark:text-slate-500" aria-hidden="true" />
            <p className="mt-3 text-sm text-[#667085] dark:text-slate-400">No active database sessions are available.</p>
          </div>
        ) : (
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
            {sessions.map((session) => (
              <li key={session.id} className="rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                      {session.device.toLowerCase().includes('mobile') ? (
                        <Smartphone className="h-5 w-5" aria-hidden="true" />
                      ) : (
                        <Laptop2 className="h-5 w-5" aria-hidden="true" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-[#101D38] dark:text-white">{session.device}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#667085] dark:text-slate-400">{session.userAgent}</p>
                    </div>
                  </div>
                  {session.isCurrent && (
                    <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.08em] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                      Current
                    </span>
                  )}
                </div>
                <dl className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <SessionDetail icon={MapPin} label="IP address" value={session.ipAddress} />
                  <SessionDetail icon={CalendarDays} label="Started" value={formatDateTime(session.createdAt)} />
                  <SessionDetail icon={Clock3} label="Expires" value={formatDateTime(session.expiresAt)} />
                  <SessionDetail icon={ShieldCheck} label="Status" value="Active" />
                </dl>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function ProfileAvatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <span aria-hidden="true" className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[24px] bg-[#1754E8] text-2xl font-extrabold text-white shadow-[0_16px_34px_rgba(23,84,232,0.28)]">
      {initials || 'U'}
    </span>
  );
}

function StatusPill({ label, positive }: { label: string; positive?: boolean }) {
  return (
    <span className={`rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.08em] ${positive ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300' : 'border-[#D8E2EF] bg-[#F7F9FC] text-[#526175] dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'}`}>
      {label}
    </span>
  );
}

function SectionHeading({ id, icon: Icon, title }: { id: string; icon: ElementType; title: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <h2 id={id} className="text-lg font-extrabold tracking-[-0.02em] text-[#101D38] dark:text-white sm:text-xl">{title}</h2>
    </div>
  );
}

function SecurityRow({
  icon: Icon,
  label,
  value,
  positive,
}: {
  icon: ElementType;
  label: string;
  value: string;
  positive: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#385477] bg-[#0D1A2E] p-4">
      <Icon className="h-5 w-5 shrink-0 text-[#9DB8E5]" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#9DB8E5]">{label}</p>
        <p className="mt-1 truncate text-sm font-extrabold text-white">{value}</p>
      </div>
      <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${positive ? 'bg-emerald-400' : 'bg-amber-400'}`} aria-hidden="true" />
    </div>
  );
}

function InformationCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: ElementType;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2 text-[#7B8798] dark:text-slate-500">
        <Icon className="h-4 w-4" aria-hidden="true" />
        <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em]">{label}</dt>
      </div>
      <dd className="mt-3 break-words text-sm font-extrabold text-[#101D38] dark:text-white">{value}</dd>
      {detail && <p className="mt-1 text-xs text-[#667085] dark:text-slate-400">{detail}</p>}
    </div>
  );
}

function SessionDetail({ icon: Icon, label, value }: { icon: ElementType; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#E0E7F0] bg-white p-3 dark:border-slate-700 dark:bg-slate-950">
      <dt className="flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[#7B8798] dark:text-slate-500">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-2 break-words text-xs font-bold text-[#101D38] dark:text-white">{value}</dd>
    </div>
  );
}

function describeDevice(userAgent: string | null): string {
  if (!userAgent) return 'Unknown device';
  const mobile = /mobile|android|iphone|ipad/i.test(userAgent);
  const browser = userAgent.includes('Edg/')
    ? 'Edge'
    : userAgent.includes('Chrome/')
      ? 'Chrome'
      : userAgent.includes('Firefox/')
        ? 'Firefox'
        : userAgent.includes('Safari/')
          ? 'Safari'
          : 'Browser';
  return `${mobile ? 'Mobile' : 'Desktop'} · ${browser}`;
}

function formatRole(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatStatus(value: string): string {
  return value.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatDate(value: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(value);
}

function formatDateTime(value: Date | null): string {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}
