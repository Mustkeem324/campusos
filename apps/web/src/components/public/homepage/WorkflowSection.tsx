import type { ElementType } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileCheck2,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  UserRoundPlus,
  Workflow,
} from 'lucide-react';

type WorkflowStatus =
  | 'Approved'
  | 'Created'
  | 'Generated'
  | 'Assigned'
  | 'Recorded'
  | 'Published';

type WorkflowStep = {
  id: string;
  number: number;
  title: string;
  description: string;
  owner: string;
  status: WorkflowStatus;
  icon: ElementType;
};

type ActivityItem = {
  id: string;
  time: string;
  title: string;
  source: string;
  status: WorkflowStatus;
};

const workflowSteps: readonly WorkflowStep[] = [
  {
    id: 'admission-approved',
    number: 1,
    title: 'Admission approved',
    description:
      'An authorised admissions team confirms the applicant’s offer and programme allocation.',
    owner: 'Admissions',
    status: 'Approved',
    icon: UserCheck,
  },
  {
    id: 'student-profile-created',
    number: 2,
    title: 'Student profile created',
    description:
      'Approved applicant information is used to create the institutional student record.',
    owner: 'Student Records',
    status: 'Created',
    icon: UserRoundPlus,
  },
  {
    id: 'fee-invoice-generated',
    number: 3,
    title: 'Fee structure assigned',
    description:
      'The applicable institutional fee structure and payment schedule are connected to the student.',
    owner: 'Finance',
    status: 'Generated',
    icon: CreditCard,
  },
  {
    id: 'courses-registered',
    number: 4,
    title: 'Academic plan assigned',
    description:
      'The student is linked to the appropriate programme, curriculum and course structure.',
    owner: 'Academics',
    status: 'Assigned',
    icon: BookOpenCheck,
  },
  {
    id: 'timetable-assigned',
    number: 5,
    title: 'Timetable assigned',
    description:
      'Academic sections, teaching groups and scheduled learning activities become available.',
    owner: 'Timetabling',
    status: 'Assigned',
    icon: CalendarCheck2,
  },
  {
    id: 'attendance-recorded',
    number: 6,
    title: 'Attendance recorded',
    description:
      'Authorised faculty can record attendance for students in their assigned course sections.',
    owner: 'Faculty',
    status: 'Recorded',
    icon: FileCheck2,
  },
  {
    id: 'results-published',
    number: 7,
    title: 'Results published',
    description:
      'Approved academic outcomes become available through authorised student and institutional views.',
    owner: 'Examinations',
    status: 'Published',
    icon: GraduationCap,
  },
];

const illustrativeActivity: readonly ActivityItem[] = [
  {
    id: 'activity-admission',
    time: '09:41',
    title: 'Admission decision approved',
    source: 'Admissions workflow',
    status: 'Approved',
  },
  {
    id: 'activity-profile',
    time: '09:41',
    title: 'Student record created',
    source: 'Student Records service',
    status: 'Created',
  },
  {
    id: 'activity-fee',
    time: '09:42',
    title: 'Applicable fee structure assigned',
    source: 'Finance workflow',
    status: 'Generated',
  },
  {
    id: 'activity-academic',
    time: '09:43',
    title: 'Academic programme and section assigned',
    source: 'Academic workflow',
    status: 'Assigned',
  },
];

const statusClasses: Record<WorkflowStatus, string> = {
  Approved: 'border-[#B7E4D3] bg-[#EAF8F3] text-[#067A4E]',
  Created: 'border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8]',
  Generated: 'border-[#D8CBF4] bg-[#F3EFFF] text-[#6941C6]',
  Assigned: 'border-[#C8D8F5] bg-[#EDF3FF] text-[#1754E8]',
  Recorded: 'border-[#D8E0EB] bg-[#F3F6FA] text-[#475467]',
  Published: 'border-[#B7E4D3] bg-[#EAF8F3] text-[#067A4E]',
};

function StatusBadge({ status }: { status: WorkflowStatus }) {
  return (
    <span
      className={[
        'inline-flex min-h-7 items-center rounded-full border px-2.5',
        'text-[10px] font-bold uppercase tracking-[0.08em]',
        statusClasses[status],
      ].join(' ')}
    >
      {status}
    </span>
  );
}

function WorkflowStepCard({
  step,
  isLast,
}: {
  step: WorkflowStep;
  isLast: boolean;
}) {
  const Icon = step.icon;

  return (
    <li className="relative flex gap-4 lg:block lg:min-w-0">
      {!isLast && (
        <>
          <div
            className="absolute bottom-[-32px] left-[23px] top-12 w-px bg-[#CAD5E5] lg:hidden"
            aria-hidden="true"
          />

          <div
            className="absolute left-[calc(50%+30px)] right-[calc(-50%+30px)] top-7 hidden h-px bg-[#CAD5E5] lg:block"
            aria-hidden="true"
          />
        </>
      )}

      <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-[#1754E8] bg-white text-sm font-bold text-[#1754E8] shadow-[0_0_0_7px_#FFFFFF] lg:mx-auto lg:h-14 lg:w-14">
        {step.number}
      </div>

      <div className="min-w-0 flex-1 rounded-2xl border border-[#DFE6F0] bg-white p-5 shadow-[0_8px_26px_rgba(16,24,40,0.05)] lg:mt-6 lg:text-center">
        <div className="flex items-start justify-between gap-3 lg:flex-col lg:items-center">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
            <Icon className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </div>

          <StatusBadge status={step.status} />
        </div>

        <h3 className="mt-4 text-[15px] font-bold leading-6 text-[#101828]">
          {step.title}
        </h3>

        <p className="mt-2 text-[13px] leading-6 text-[#5F6C7B]">
          {step.description}
        </p>

        <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7C889A]">
          Responsible area
        </p>

        <p className="mt-1 text-xs font-semibold text-[#344054]">
          {step.owner}
        </p>
      </div>
    </li>
  );
}

function ActivityLog() {
  return (
    <div className="overflow-hidden rounded-3xl border border-[#D8E2EF] bg-white shadow-[0_18px_52px_rgba(16,42,91,0.09)]">
      <div className="flex flex-col gap-4 border-b border-[#DEE5EF] bg-[#F7F9FC] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#C8D8F5] bg-white text-[#1754E8]">
            <Workflow className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <h3 className="text-sm font-bold text-[#101828] sm:text-base">
              Illustrative enrolment activity
            </h3>

            <p className="mt-1 text-xs text-[#667085]">
              Example of connected workflow updates
            </p>
          </div>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#1754E8]">
          <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
          Fictional timeline
        </span>
      </div>

      <ol className="divide-y divide-[#E5EAF1] px-5 sm:px-6">
        {illustrativeActivity.map((activity) => (
          <li
            key={activity.id}
            className="grid gap-3 py-5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
          >
            <time className="font-mono text-xs font-semibold text-[#667085]">
              {activity.time}
            </time>

            <div className="min-w-0">
              <p className="text-sm font-semibold text-[#101828]">
                {activity.title}
              </p>

              <p className="mt-1 text-xs text-[#667085]">
                {activity.source}
              </p>
            </div>

            <StatusBadge status={activity.status} />
          </li>
        ))}
      </ol>

      <div className="flex items-start gap-3 border-t border-[#DEE5EF] bg-[#F9FAFC] px-5 py-4 sm:px-6">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-[#078A57]"
          aria-hidden="true"
        />

        <p className="text-xs leading-5 text-[#667085]">
          These events are illustrative. Actual workflow behavior depends on
          institutional configuration, permissions and enabled CampusOS
          modules.
        </p>
      </div>
    </div>
  );
}

export function WorkflowSection() {
  return (
    <section
      className="overflow-hidden border-t border-[#DEE5EF] bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="workflow-section-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[820px] text-center">
          <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            <Workflow className="h-4 w-4" aria-hidden="true" />
            Connected institutional workflows
          </div>

          <h2
            id="workflow-section-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            Information moves with the student throughout their journey
          </h2>

          <p className="mx-auto mt-6 max-w-[760px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            CampusOS can connect approved admissions information with student
            records, finance, academics, attendance and results while
            preserving role and institutional context.
          </p>

          <p className="mx-auto mt-4 max-w-[700px] text-xs leading-5 text-[#7C889A]">
            Workflow stages and automation behavior depend on institution
            configuration, assigned permissions and enabled integrations.
          </p>
        </header>

        <ol className="mx-auto mt-14 grid max-w-[1180px] gap-8 lg:mt-16 lg:grid-cols-7 lg:gap-4">
          {workflowSteps.map((step, index) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              isLast={index === workflowSteps.length - 1}
            />
          ))}
        </ol>

        <div className="mx-auto mt-16 max-w-[900px]">
          <ActivityLog />
        </div>

        <div className="mx-auto mt-10 flex max-w-[900px] flex-col gap-6 rounded-3xl border border-[#D8E2EF] bg-[#F7F9FC] px-6 py-8 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-[620px]">
            <h3 className="text-xl font-bold tracking-[-0.02em] text-[#101828]">
              Explore connected workflows in CampusOS
            </h3>

            <p className="mt-2 text-sm leading-6 text-[#5F6C7B]">
              Review how academic, administrative and financial modules can
              coordinate around authorised institutional records.
            </p>
          </div>

          <Link
            href="/platform"
            className="group inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_26px_rgba(23,84,232,0.22)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4 focus-visible:ring-offset-[#F7F9FC]"
          >
            Explore the platform

            <ArrowRight
              className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="mx-auto mt-8 flex max-w-[900px] items-start gap-3 rounded-2xl border border-[#D8E3F2] bg-white p-5">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]"
            aria-hidden="true"
          />

          <p className="text-xs leading-5 text-[#667085]">
            The section uses one responsive workflow structure rather than
            separate desktop and mobile markup, reducing duplicated code and
            keeping the journey consistent at every viewport size.
          </p>
        </div>
      </div>
    </section>
  );
}