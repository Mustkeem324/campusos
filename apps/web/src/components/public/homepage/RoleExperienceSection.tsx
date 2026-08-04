'use client';

import type { ElementType, KeyboardEvent } from 'react';
import { useId, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpenCheck,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  GraduationCap,
  IndianRupee,
  Landmark,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  WalletCards,
} from 'lucide-react';

type RoleId =
  | 'leadership'
  | 'administrator'
  | 'faculty'
  | 'student'
  | 'parent'
  | 'finance';

type MetricTone = 'default' | 'success' | 'warning' | 'danger';

type PreviewStatus = 'Completed' | 'Live' | 'Pending' | 'Upcoming' | 'Review';

type RoleMetric = {
  label: string;
  value: string;
  detail: string;
  tone?: MetricTone;
};

type PreviewItem = {
  title: string;
  meta: string;
  status: PreviewStatus;
};

type RoleExperience = {
  id: RoleId;
  label: string;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  icon: ElementType;
  benefits: readonly string[];
  preview: {
    title: string;
    subtitle: string;
    metrics: readonly RoleMetric[];
    sectionTitle: string;
    items: readonly PreviewItem[];
    attention: {
      title: string;
      description: string;
      action: string;
    };
  };
};

const roleExperiences: readonly RoleExperience[] = [
  {
    id: 'leadership',
    label: 'Leadership',
    title: 'Leadership Intelligence',
    description:
      'Give institutional leaders a consolidated view of academic performance, financial health, operational risk and strategic priorities.',
    href: '/roles/leadership',
    ctaLabel: 'Explore leadership experience',
    icon: Landmark,
    benefits: [
      'Institution-wide performance overview',
      'Strategic risk and exception monitoring',
      'Multi-campus comparison views',
      'Governance and approval visibility',
    ],
    preview: {
      title: 'Leadership Overview',
      subtitle: 'Institution-wide performance and strategic priorities',
      metrics: [
        {
          label: 'Active programmes',
          value: '42',
          detail: 'Across 8 academic schools',
        },
        {
          label: 'Pending approvals',
          value: '7',
          detail: 'Require leadership review',
          tone: 'warning',
        },
        {
          label: 'Priority risks',
          value: '3',
          detail: 'Academic and operational',
          tone: 'danger',
        },
      ],
      sectionTitle: 'Institutional priorities',
      items: [
        {
          title: 'Academic performance review',
          meta: 'Semester analysis prepared by the Registrar',
          status: 'Review',
        },
        {
          title: 'Annual operating plan',
          meta: 'Finance and HR inputs received',
          status: 'Pending',
        },
        {
          title: 'New programme proposal',
          meta: 'School of Computing',
          status: 'Upcoming',
        },
      ],
      attention: {
        title: 'Leadership attention',
        description:
          'Three strategic indicators require review before the next governance meeting.',
        action: 'Review institutional risks',
      },
    },
  },
  {
    id: 'administrator',
    label: 'Administrator',
    title: 'Administrative Workspace',
    description:
      'Coordinate institutional configuration, user access, academic structures, approvals and operational workflows from one secure workspace.',
    href: '/roles/administrators',
    ctaLabel: 'Explore administrator experience',
    icon: Settings2,
    benefits: [
      'Central user and role administration',
      'Academic structure configuration',
      'Cross-department workflow management',
      'Audit-ready activity visibility',
    ],
    preview: {
      title: 'Administration Overview',
      subtitle: 'Configuration, access and operational workflow status',
      metrics: [
        {
          label: 'Open requests',
          value: '26',
          detail: 'Across institutional teams',
          tone: 'warning',
        },
        {
          label: 'New user records',
          value: '14',
          detail: 'Awaiting verification',
        },
        {
          label: 'System notices',
          value: '3',
          detail: 'Configuration updates',
          tone: 'danger',
        },
      ],
      sectionTitle: 'Administrative queue',
      items: [
        {
          title: 'Faculty access requests',
          meta: '6 accounts awaiting approval',
          status: 'Pending',
        },
        {
          title: 'Academic term configuration',
          meta: 'Autumn term setup',
          status: 'Review',
        },
        {
          title: 'Department data import',
          meta: 'School of Management',
          status: 'Completed',
        },
      ],
      attention: {
        title: 'Configuration required',
        description:
          'The upcoming academic term has three incomplete workflow settings.',
        action: 'Review configuration',
      },
    },
  },
  {
    id: 'faculty',
    label: 'Faculty',
    title: 'Faculty Workspace',
    description:
      'Help educators manage classes, attendance, assignments, grading and student support without unnecessary administrative overhead.',
    href: '/roles/faculty',
    ctaLabel: 'Explore faculty experience',
    icon: GraduationCap,
    benefits: [
      'Fast class and attendance workflows',
      'Assignment and rubric-based grading',
      'Course communication tools',
      'Authorised student-risk indicators',
    ],
    preview: {
      title: 'Faculty Overview',
      subtitle: 'Teaching schedule, grading and student support',
      metrics: [
        {
          label: "Today's classes",
          value: '4',
          detail: 'Next class at 11:00',
        },
        {
          label: 'Pending grading',
          value: '18',
          detail: '6 submissions due today',
          tone: 'warning',
        },
        {
          label: 'Students requiring review',
          value: '3',
          detail: 'Assigned courses only',
          tone: 'danger',
        },
      ],
      sectionTitle: "Today's teaching schedule",
      items: [
        {
          title: 'CS-301 · Data Structures',
          meta: '09:00 · Computer Lab 4',
          status: 'Completed',
        },
        {
          title: 'CS-305 · Design of Algorithms',
          meta: '11:00 · Lecture Hall A',
          status: 'Live',
        },
        {
          title: 'CS-312 · Database Systems',
          meta: '14:00 · Room B-204',
          status: 'Upcoming',
        },
      ],
      attention: {
        title: 'Action required',
        description:
          'Three students in an assigned course are below the configured attendance threshold.',
        action: 'Review assigned students',
      },
    },
  },
  {
    id: 'student',
    label: 'Student',
    title: 'Student Workspace',
    description:
      'Give students one place to manage classes, attendance, assignments, examinations, fees and campus services.',
    href: '/roles/students',
    ctaLabel: 'Explore student experience',
    icon: BookOpenCheck,
    benefits: [
      'Live timetable and learning access',
      'Attendance and academic progress',
      'Assignments, examinations and results',
      'Fees, documents and student services',
    ],
    preview: {
      title: 'Student Overview',
      subtitle: 'Classes, academic progress and upcoming tasks',
      metrics: [
        {
          label: 'Overall attendance',
          value: '88.5%',
          detail: 'Above required threshold',
          tone: 'success',
        },
        {
          label: 'Upcoming tasks',
          value: '5',
          detail: 'Two due this week',
          tone: 'warning',
        },
        {
          label: 'Fee status',
          value: 'Paid',
          detail: 'Current term',
          tone: 'success',
        },
      ],
      sectionTitle: "Today's schedule",
      items: [
        {
          title: 'Physics Laboratory',
          meta: '10:00 · Laboratory 302',
          status: 'Upcoming',
        },
        {
          title: 'Calculus I',
          meta: '11:30 · Online classroom',
          status: 'Live',
        },
        {
          title: 'Data Structures Tutorial',
          meta: '14:00 · Room C-105',
          status: 'Upcoming',
        },
      ],
      attention: {
        title: 'Assignment due soon',
        description:
          'The Physics Laboratory report is due tomorrow at 5:00 PM.',
        action: 'Open assignment',
      },
    },
  },
  {
    id: 'parent',
    label: 'Parent',
    title: 'Parent and Guardian Portal',
    description:
      'Help authorised guardians follow a linked student’s attendance, published results, fees and important institutional notices.',
    href: '/roles/parents',
    ctaLabel: 'Explore parent experience',
    icon: UserRoundCheck,
    benefits: [
      'Verified linked-student access',
      'Attendance and progress visibility',
      'Published fee and result information',
      'Institutional notices and communication',
    ],
    preview: {
      title: 'Guardian Overview',
      subtitle: 'Authorised information for the linked student',
      metrics: [
        {
          label: 'Attendance',
          value: '88.5%',
          detail: 'Linked student',
          tone: 'success',
        },
        {
          label: 'Outstanding fees',
          value: '₹0',
          detail: 'No current balance',
          tone: 'success',
        },
        {
          label: 'New notices',
          value: '2',
          detail: 'Published by the institution',
        },
      ],
      sectionTitle: 'Recent student updates',
      items: [
        {
          title: 'Attendance summary published',
          meta: 'Current academic month',
          status: 'Completed',
        },
        {
          title: 'Mid-term result available',
          meta: 'Published by Examination Office',
          status: 'Review',
        },
        {
          title: 'Parent-teacher meeting',
          meta: 'Friday · 3:30 PM',
          status: 'Upcoming',
        },
      ],
      attention: {
        title: 'Guardian notice',
        description:
          'A new academic progress update is available for the linked student.',
        action: 'Review progress',
      },
    },
  },
  {
    id: 'finance',
    label: 'Finance',
    title: 'Finance Operations',
    description:
      'Support fee configuration, collection, reconciliation, refunds, concessions and institutional financial reporting.',
    href: '/roles/finance',
    ctaLabel: 'Explore finance experience',
    icon: IndianRupee,
    benefits: [
      'Fee structures and invoice workflows',
      'Collection and reconciliation',
      'Refund and concession approvals',
      'Role-aware financial reporting',
    ],
    preview: {
      title: 'Finance Overview',
      subtitle: 'Collections, reconciliation and financial exceptions',
      metrics: [
        {
          label: "Today's collections",
          value: '₹18.4L',
          detail: 'Across online and counter payments',
          tone: 'success',
        },
        {
          label: 'Pending reconciliation',
          value: '12',
          detail: 'Transactions require review',
          tone: 'warning',
        },
        {
          label: 'Refund requests',
          value: '6',
          detail: 'Awaiting authorised action',
        },
      ],
      sectionTitle: 'Finance operations queue',
      items: [
        {
          title: 'Payment gateway settlement',
          meta: 'Settlement batch PG-2408',
          status: 'Review',
        },
        {
          title: 'Scholarship adjustment',
          meta: '18 eligible student records',
          status: 'Pending',
        },
        {
          title: 'Daily collection report',
          meta: 'Generated at 5:30 PM',
          status: 'Completed',
        },
      ],
      attention: {
        title: 'Reconciliation exception',
        description:
          'Three transactions require manual verification before settlement closure.',
        action: 'Review exceptions',
      },
    },
  },
] as const;

const metricToneClasses: Record<MetricTone, string> = {
  default: 'text-[#101828]',
  success: 'text-[#078A57]',
  warning: 'text-[#B85C00]',
  danger: 'text-[#C43224]',
};

const statusClasses: Record<PreviewStatus, string> = {
  Completed: 'border-[#B7E4D3] bg-[#EAF8F3] text-[#067A4E]',
  Live: 'border-[#B9CEF8] bg-[#EDF3FF] text-[#1754E8]',
  Pending: 'border-[#F2D0A3] bg-[#FFF6E8] text-[#A95500]',
  Upcoming: 'border-[#D9E1EC] bg-[#F3F6FA] text-[#5F6C7B]',
  Review: 'border-[#D5C9F4] bg-[#F3EFFF] text-[#6941C6]',
};

function RoleTabs({
  activeRole,
  onRoleChange,
  tabIdPrefix,
}: {
  activeRole: RoleId;
  onRoleChange: (role: RoleId) => void;
  tabIdPrefix: string;
}) {
  const roleIds = roleExperiences.map((role) => role.id);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentRole: RoleId,
  ) {
    const currentIndex = roleIds.indexOf(currentRole);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % roleIds.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + roleIds.length) % roleIds.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = roleIds.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    const nextRole = roleIds[nextIndex];
    onRoleChange(nextRole);

    requestAnimationFrame(() => {
      document
        .getElementById(`${tabIdPrefix}-tab-${nextRole}`)
        ?.focus();
    });
  }

  return (
    <div
      role="tablist"
      aria-label="CampusOS role experiences"
      className="mx-auto flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.04] p-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {roleExperiences.map((role) => {
        const isActive = role.id === activeRole;

        return (
          <button
            key={role.id}
            id={`${tabIdPrefix}-tab-${role.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${tabIdPrefix}-panel-${role.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onRoleChange(role.id)}
            onKeyDown={(event) => handleKeyDown(event, role.id)}
            className={[
              'min-h-11 shrink-0 rounded-xl px-4 text-sm font-semibold',
              'transition-[background-color,color,box-shadow]',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[#8CB2FF] focus-visible:ring-offset-2',
              'focus-visible:ring-offset-[#101B33]',
              isActive
                ? 'bg-white text-[#101B33] shadow-sm'
                : 'text-[#BEC7D7] hover:bg-white/[0.08] hover:text-white',
            ].join(' ')}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}

function RoleDescription({ role }: { role: RoleExperience }) {
  const Icon = role.icon;

  return (
    <div className="flex flex-col">
      <div className="flex h-13 w-13 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.07] text-[#8CB2FF]">
        <Icon className="h-6 w-6" strokeWidth={2} aria-hidden="true" />
      </div>

      <p className="mt-6 text-xs font-bold uppercase tracking-[0.12em] text-[#8CB2FF]">
        {role.label} experience
      </p>

      <h3 className="mt-3 text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
        {role.title}
      </h3>

      <p className="mt-5 max-w-[560px] text-base leading-7 text-[#BEC7D7]">
        {role.description}
      </p>

      <ul className="mt-8 space-y-4">
        {role.benefits.map((benefit) => (
          <li
            key={benefit}
            className="flex items-start gap-3 text-[15px] leading-6 text-white"
          >
            <CheckCircle2
              className="mt-0.5 h-5 w-5 shrink-0 text-[#4DD1A1]"
              strokeWidth={2.2}
              aria-hidden="true"
            />

            <span>{benefit}</span>
          </li>
        ))}
      </ul>

      <Link
        href={role.href}
        className="group mt-9 inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#101B33] transition-colors hover:bg-[#EDF3FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-[#182642]"
      >
        {role.ctaLabel}

        <ArrowRight
          className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
          aria-hidden="true"
        />
      </Link>
    </div>
  );
}

function MetricCard({ metric }: { metric: RoleMetric }) {
  const tone = metric.tone ?? 'default';

  return (
    <div className="rounded-xl border border-[#DEE5EF] bg-white p-4 shadow-[0_5px_18px_rgba(16,24,40,0.04)]">
      <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
        {metric.label}
      </p>

      <p
        className={`mt-2 text-xl font-bold tracking-[-0.025em] ${metricToneClasses[tone]}`}
      >
        {metric.value}
      </p>

      <p className="mt-1.5 text-[10px] leading-4 text-[#7C889A]">
        {metric.detail}
      </p>
    </div>
  );
}

function RoleDashboardPreview({ role }: { role: RoleExperience }) {
  return (
    <div className="relative mx-auto w-full max-w-[760px]">
      <div className="absolute -inset-4 rounded-[28px] bg-[#24467B]/30 blur-2xl" />

      <div className="relative overflow-hidden rounded-2xl border border-[#CCD7E6] bg-white shadow-[0_28px_70px_rgba(0,0,0,0.24)]">
        <div className="flex min-h-14 items-center justify-between border-b border-[#DEE5EF] bg-white px-4 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#101828]">
              {role.preview.title}
            </p>

            <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[0.09em] text-[#8A95A6]">
              Illustrative CampusOS workspace
            </p>
          </div>

          <div className="flex items-center gap-2" aria-hidden="true">
            <div className="hidden min-h-8 items-center gap-1.5 rounded-lg border border-[#DEE5EF] bg-[#F7F9FC] px-2.5 text-[10px] font-medium text-[#667085] sm:flex">
              <CalendarDays className="h-3.5 w-3.5" />
              Today
            </div>

            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1754E8] text-[10px] font-bold text-white">
              {role.label.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </div>

        <div className="bg-[#F5F7FB] p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-[#101828]">
                {role.preview.title}
              </h4>

              <p className="mt-1 text-[10px] text-[#667085] sm:text-xs">
                {role.preview.subtitle}
              </p>
            </div>

            <span className="hidden rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-[#1754E8] sm:inline-flex">
              Fictional data
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 min-[430px]:grid-cols-3">
            {role.preview.metrics.map((metric) => (
              <MetricCard key={metric.label} metric={metric} />
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(190px,0.75fr)]">
            <div className="rounded-xl border border-[#DEE5EF] bg-white p-4 shadow-[0_5px_18px_rgba(16,24,40,0.04)]">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-xs font-semibold text-[#101828] sm:text-sm">
                  {role.preview.sectionTitle}
                </h4>

                <span className="text-[10px] font-semibold text-[#1754E8]">
                  View all
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {role.preview.items.map((item) => (
                  <div
                    key={`${item.title}-${item.meta}`}
                    className="flex items-start justify-between gap-3 rounded-lg border border-[#E3E8F0] bg-[#FAFBFC] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-semibold text-[#101828]">
                        {item.title}
                      </p>

                      <p className="mt-1 truncate text-[9px] text-[#667085]">
                        {item.meta}
                      </p>
                    </div>

                    <span
                      className={[
                        'inline-flex min-h-6 shrink-0 items-center rounded-full',
                        'border px-2 text-[8px] font-bold uppercase tracking-[0.06em]',
                        statusClasses[item.status],
                      ].join(' ')}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl bg-[#101D38] p-4 text-white shadow-[0_8px_24px_rgba(16,29,56,0.16)]">
                <div className="flex items-center gap-2">
                  <AlertTriangle
                    className="h-4 w-4 text-[#FFCB69]"
                    aria-hidden="true"
                  />

                  <h4 className="text-xs font-semibold">
                    {role.preview.attention.title}
                  </h4>
                </div>

                <p className="mt-2 text-[10px] leading-4 text-[#C4CDDD]">
                  {role.preview.attention.description}
                </p>

                <div className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-semibold text-white">
                  {role.preview.attention.action}
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </div>
              </div>

              <div className="rounded-xl border border-[#D8E3F2] bg-white p-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck
                    className="h-4 w-4 text-[#078A57]"
                    aria-hidden="true"
                  />

                  <h4 className="text-[11px] font-semibold text-[#101828]">
                    Role-aware access
                  </h4>
                </div>

                <p className="mt-2 text-[9px] leading-4 text-[#667085]">
                  Information and actions are limited to the responsibilities
                  and permissions of this role.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-[#DEE5EF] bg-white px-4 py-2.5 text-center text-[9px] text-[#7C889A]">
          Illustrative product interface. Availability depends on institutional
          configuration.
        </div>
      </div>
    </div>
  );
}

export function RoleExperienceSection() {
  const [activeRole, setActiveRole] = useState<RoleId>('student');
  const tabIdPrefix = useId().replace(/:/g, '');

  const selectedRole =
    roleExperiences.find((role) => role.id === activeRole) ??
    roleExperiences[0];

  return (
    <section
      className="overflow-hidden bg-[#101B33] px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="role-experience-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[800px] text-center">
          <div className="inline-flex min-h-8 items-center rounded-full border border-white/15 bg-white/[0.06] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#AFC7EE]">
            Role-aware workspaces
          </div>

          <h2
            id="role-experience-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            Purpose-built experiences for every institutional role
          </h2>

          <p className="mx-auto mt-5 max-w-[720px] text-base leading-7 text-[#BEC7D7] sm:text-lg sm:leading-8">
            Each CampusOS workspace presents the information, actions and
            approvals relevant to that user’s responsibilities.
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-fit">
          <RoleTabs
            activeRole={activeRole}
            onRoleChange={setActiveRole}
            tabIdPrefix={tabIdPrefix}
          />
        </div>

        <div
          id={`${tabIdPrefix}-panel-${selectedRole.id}`}
          role="tabpanel"
          aria-labelledby={`${tabIdPrefix}-tab-${selectedRole.id}`}
          tabIndex={0}
          className="mt-10 rounded-3xl border border-[#2A3B5C] bg-[#182642] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.22)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8CB2FF] sm:p-8 lg:p-12"
        >
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.32fr)] lg:gap-14">
            <RoleDescription role={selectedRole} />
            <RoleDashboardPreview role={selectedRole} />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 text-xs text-[#91A0B8]">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck
              className="h-4 w-4 text-[#56D4A7]"
              aria-hidden="true"
            />
            Permission-aware information
          </span>

          <span className="inline-flex items-center gap-2">
            <UsersRound
              className="h-4 w-4 text-[#83ACFF]"
              aria-hidden="true"
            />
            Separate role experiences
          </span>

          <span className="inline-flex items-center gap-2">
            <BarChart3
              className="h-4 w-4 text-[#A696FF]"
              aria-hidden="true"
            />
            Connected institutional workflows
          </span>
        </div>
      </div>
    </section>
  );
}