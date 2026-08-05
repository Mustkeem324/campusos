import Link from 'next/link';
import {
  BellRing,
  BookOpenCheck,
  Bot,
  FileSpreadsheet,
  Landmark,
  ListChecks,
  LockKeyhole,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UsersRound,
} from 'lucide-react';

import { requireActiveUserContext } from '@/lib/active-user-context';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const privilegedRoles = new Set([
  'SUPER_ADMIN',
  'INSTITUTION_ADMIN',
  'REGISTRAR',
  'DEAN',
  'HOD',
  'FINANCE_OFFICER',
  'ACCOUNTANT',
  'HR_ADMIN',
  'WARDEN',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'PLACEMENT_OFFICER',
  'ADMISSIONS_COUNSELLOR',
  'EXAMINATION_CONTROLLER',
]);

export default async function Phase7Page() {
  const context = await requireActiveUserContext();
  const canReviewInstitutionWork = privilegedRoles.has(context.activeRole);
  const tenantScope = { tenantId: context.tenantId };
  const ownScope = { tenantId: context.tenantId, userId: context.userId };

  const [
    user,
    activeSessions,
    proposedAiActions,
    pendingRefunds,
    openSupportCases,
    invoiceCount,
    paymentCount,
    libraryTitles,
    circulationCount,
    unreadNotifications,
    notificationPreferences,
    queuedEmail,
    aiConversations,
    knowledgeDocuments,
    successCases,
    certifiedMetrics,
  ] = await Promise.all([
    prisma.user.findFirst({
      where: { id: context.userId, tenantId: context.tenantId, isActive: true },
      select: {
        name: true,
        email: true,
        mfaEnabled: true,
        emailVerified: true,
        lastLoginAt: true,
      },
    }),
    prisma.session.count({ where: { userId: context.userId, expiresAt: { gt: new Date() } } }),
    prisma.aiActionProposal.count({
      where: canReviewInstitutionWork
        ? { ...tenantScope, status: 'PROPOSED' }
        : { ...ownScope, status: 'PROPOSED' },
    }),
    prisma.refundRequest.count({
      where: canReviewInstitutionWork
        ? { ...tenantScope, status: { in: ['PENDING', 'UNDER_REVIEW'] } }
        : { ...ownScope, status: { in: ['PENDING', 'UNDER_REVIEW'] } },
    }),
    prisma.supportCase.count({
      where: canReviewInstitutionWork
        ? { ...tenantScope, status: { in: ['NEW', 'IN_PROGRESS'] } }
        : { ...ownScope, status: { in: ['NEW', 'IN_PROGRESS'] } },
    }),
    prisma.invoice.count({ where: tenantScope }),
    prisma.payment.count({ where: tenantScope }),
    prisma.libraryItem.count({ where: tenantScope }),
    prisma.loan.count({ where: { libraryItem: tenantScope } }),
    prisma.notification.count({ where: { ...ownScope, isRead: false } }),
    prisma.notificationPreference.count({ where: ownScope }),
    prisma.emailQueue.count({ where: { ...tenantScope, status: 'PENDING' } }),
    prisma.aiConversation.count({ where: ownScope }),
    prisma.aiKnowledgeDocument.count({
      where: {
        ...tenantScope,
        publicationStatus: 'PUBLISHED',
      },
    }),
    prisma.studentSuccessCase.count({
      where: canReviewInstitutionWork
        ? { ...tenantScope, status: { not: 'RESOLVED' } }
        : tenantScope,
    }),
    prisma.analyticsMetric.count({
      where: { ...tenantScope, certificationStatus: 'CERTIFIED' },
    }),
  ]);

  if (!user) return null;

  const modules = [
    {
      code: '7A',
      title: 'Action and Approval Centre',
      description: 'A single exception-first queue for AI proposals, refunds and support workflows already persisted in CampusOS.',
      icon: ListChecks,
      stats: [
        `${proposedAiActions} proposed AI action${proposedAiActions === 1 ? '' : 's'}`,
        `${pendingRefunds} refund review${pendingRefunds === 1 ? '' : 's'}`,
        `${openSupportCases} open support case${openSupportCases === 1 ? '' : 's'}`,
      ],
      actions: [
        { label: 'Open AI approvals', href: '/ai/governance' },
        { label: 'Open support cases', href: '/support/cases' },
      ],
    },
    {
      code: '7B',
      title: 'Account Security Centre',
      description: 'Password, MFA, email verification and persisted session controls for the authenticated account.',
      icon: LockKeyhole,
      stats: [
        user.mfaEnabled ? 'MFA enabled' : 'MFA not enabled',
        user.emailVerified ? 'Email verified' : 'Email verification pending',
        `${activeSessions} active session${activeSessions === 1 ? '' : 's'}`,
      ],
      actions: [
        { label: 'Open profile security', href: '/profile' },
        { label: 'Change password', href: '/profile/security' },
      ],
    },
    {
      code: '7C',
      title: 'Reports and Export Studio',
      description: 'Tenant-scoped exports generated on demand without exposing password, token or biometric fields.',
      icon: FileSpreadsheet,
      stats: [
        `${certifiedMetrics} certified metric${certifiedMetrics === 1 ? '' : 's'}`,
        `${invoiceCount} invoice row${invoiceCount === 1 ? '' : 's'} available`,
        `${libraryTitles} catalogue title${libraryTitles === 1 ? '' : 's'} available`,
      ],
      actions: [
        { label: 'Export users CSV', href: '/api/phase7/reports/users' },
        { label: 'Export finance CSV', href: '/api/phase7/reports/finance' },
      ],
    },
    {
      code: '7D',
      title: 'Finance and Library 2.0',
      description: 'Operational finance and circulation intelligence built only from supported invoice, payment, catalogue and loan records.',
      icon: Landmark,
      secondaryIcon: BookOpenCheck,
      stats: [
        `${invoiceCount} invoices · ${paymentCount} payments`,
        `${libraryTitles} catalogue titles`,
        `${circulationCount} circulation records`,
      ],
      actions: [
        { label: 'Open finance command', href: '/payments' },
        { label: 'Open library catalogue', href: '/opac' },
      ],
    },
    {
      code: '7E',
      title: 'Mobile PWA and Notifications',
      description: 'Installable shell, offline-safe navigation foundation and user-level communication preferences.',
      icon: Smartphone,
      secondaryIcon: BellRing,
      stats: [
        `${unreadNotifications} unread notification${unreadNotifications === 1 ? '' : 's'}`,
        `${notificationPreferences} saved preference${notificationPreferences === 1 ? '' : 's'}`,
        `${queuedEmail} queued institutional email${queuedEmail === 1 ? '' : 's'}`,
      ],
      actions: [
        { label: 'Open notifications', href: '/notifications' },
        { label: 'Notification settings', href: '/settings' },
      ],
    },
    {
      code: '7F',
      title: 'Safe AI Copilot and Student Success',
      description: 'Human-approved AI proposals, published knowledge and explainable student-success case management.',
      icon: Bot,
      secondaryIcon: UsersRound,
      stats: [
        `${aiConversations} personal AI conversation${aiConversations === 1 ? '' : 's'}`,
        `${knowledgeDocuments} published knowledge document${knowledgeDocuments === 1 ? '' : 's'}`,
        `${successCases} active student-success case${successCases === 1 ? '' : 's'}`,
      ],
      actions: [
        { label: 'Open CampusOS Copilot', href: '/ai' },
        { label: 'Review student success', href: '/student-success' },
      ],
    },
  ];

  return (
    <section className="space-y-6 pb-8" aria-labelledby="phase7-title">
      <header className="overflow-hidden rounded-[30px] border border-[#D7E1EE] bg-white shadow-[0_28px_80px_rgba(16,29,56,0.1)] dark:border-slate-800 dark:bg-slate-950">
        <div className="grid lg:grid-cols-[minmax(0,1.3fr)_minmax(300px,0.7fr)]">
          <div className="p-6 sm:p-8 lg:p-10">
            <span className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              Dashboard UI Phase 7
            </span>
            <h1 id="phase7-title" className="mt-5 max-w-4xl text-3xl font-extrabold tracking-[-0.045em] text-[#101D38] dark:text-white sm:text-4xl lg:text-5xl">
              Action, security, reports, operations, mobile and safe AI in one control plane
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#667085] dark:text-slate-400 sm:text-base">
              Welcome {user.name}. Phase 7 connects the dashboards to real persisted work while preserving tenant, role and user boundaries.
            </p>
          </div>
          <aside className="border-t border-[#2B456B] bg-[#101D38] p-6 text-white sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
            <ShieldCheck className="h-8 w-8 text-[#8EB4FF]" aria-hidden="true" />
            <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#9DB8E5]">Security assurance</p>
            <p className="mt-3 text-sm leading-6 text-[#D6E0EF]">
              Counts are loaded on the server using the authenticated tenant and user context. Unsupported finance, library or AI facts are not invented.
            </p>
            <p className="mt-5 text-xs text-[#9DB8E5]">
              Last successful sign-in: {formatDateTime(user.lastLoginAt)}
            </p>
          </aside>
        </div>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        {modules.map((module) => {
          const Icon = module.icon;
          const SecondaryIcon = module.secondaryIcon;
          return (
            <article key={module.code} className="rounded-[26px] border border-[#D8E2EF] bg-white p-5 shadow-[0_16px_48px_rgba(16,29,56,0.07)] dark:border-slate-800 dark:bg-slate-950 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8] dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-[#1754E8] dark:text-blue-300">Phase {module.code}</p>
                    <h2 className="mt-1 text-xl font-extrabold tracking-[-0.025em] text-[#101D38] dark:text-white">{module.title}</h2>
                  </div>
                </div>
                {SecondaryIcon && <SecondaryIcon className="h-5 w-5 shrink-0 text-[#98A2B3]" aria-hidden="true" />}
              </div>

              <p className="mt-4 text-sm leading-6 text-[#667085] dark:text-slate-400">{module.description}</p>

              <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                {module.stats.map((stat) => (
                  <li key={stat} className="rounded-2xl border border-[#E0E7F0] bg-[#F7F9FC] p-3 text-xs font-bold leading-5 text-[#526175] dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {stat}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-2">
                {module.actions.map((action) => (
                  <Link key={action.href} href={action.href} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#C9D8EE] bg-white px-4 text-xs font-extrabold text-[#1754E8] transition hover:bg-[#EDF3FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]/40 dark:border-slate-700 dark:bg-slate-950 dark:text-blue-300 dark:hover:bg-slate-900">
                    {action.label}
                  </Link>
                ))}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatDateTime(value: Date | null) {
  if (!value) return 'Not recorded';
  return new Intl.DateTimeFormat('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Kolkata',
  }).format(value);
}
