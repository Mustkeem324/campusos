'use client';

import type { ElementType, KeyboardEvent } from 'react';
import { useId, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronRight,
  Clock3,
  CreditCard,
  Database,
  FileCheck2,
  FileText,
  GraduationCap,
  KeyRound,
  Layers3,
  LifeBuoy,
  LockKeyhole,
  Network,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UsersRound,
  Workflow,
} from 'lucide-react';

type WorkflowId =
  | 'admissions'
  | 'academics'
  | 'examinations'
  | 'finance'
  | 'services';

type StepStatus =
  | 'Verified'
  | 'Approved'
  | 'Created'
  | 'Published'
  | 'Recorded'
  | 'Flagged'
  | 'Notified'
  | 'Settled'
  | 'Completed'
  | 'Assigned';

type WorkflowMetric = {
  label: string;
  value: string;
  detail: string;
};

type WorkflowStep = {
  id: string;
  number: number;
  title: string;
  actor: string;
  description: string;
  actionLabel: string;
  status: StepStatus;
  outputs: readonly string[];
};

type WorkflowEvent = {
  name: string;
  description: string;
  affectedModules: readonly string[];
  auditFields: readonly string[];
};

type WorkflowData = {
  id: WorkflowId;
  title: string;
  shortLabel: string;
  icon: ElementType;
  roleContext: string;
  headline: string;
  description: string;
  metrics: readonly WorkflowMetric[];
  steps: readonly WorkflowStep[];
  event: WorkflowEvent;
};

const workflows: readonly WorkflowData[] = [
  {
    id: 'admissions',
    title: 'Admissions to Enrolment',
    shortLabel: 'Admissions',
    icon: UserCheck,
    roleContext: 'Admissions and Registrar teams',
    headline: 'Move an approved applicant into active student records',
    description:
      'Follow how verified application information can move through admission approval, student-record creation, fee setup and academic allocation without repeated manual entry.',
    metrics: [
      {
        label: 'Workflow stages',
        value: '4',
        detail: 'From verification to enrolment',
      },
      {
        label: 'Connected areas',
        value: '3',
        detail: 'Admissions, academics and finance',
      },
      {
        label: 'Governance',
        value: 'Role-scoped',
        detail: 'Actions follow assigned permissions',
      },
    ],
    steps: [
      {
        id: 'application-verification',
        number: 1,
        title: 'Application verification',
        actor: 'Admissions Officer',
        description:
          'Application information and submitted documents are reviewed against configured eligibility requirements.',
        actionLabel: 'VERIFY_APPLICATION',
        status: 'Verified',
        outputs: [
          'Verification outcome',
          'Reviewer identity',
          'Eligibility decision',
        ],
      },
      {
        id: 'admission-approval',
        number: 2,
        title: 'Admission approval',
        actor: 'Authorised Selection Team',
        description:
          'The eligible applicant is approved for the selected programme and intake.',
        actionLabel: 'APPROVE_ADMISSION',
        status: 'Approved',
        outputs: [
          'Admission decision',
          'Programme allocation',
          'Approval history',
        ],
      },
      {
        id: 'student-record',
        number: 3,
        title: 'Student record creation',
        actor: 'Student Records Service',
        description:
          'An institutional student profile is created using approved applicant information.',
        actionLabel: 'CREATE_STUDENT_RECORD',
        status: 'Created',
        outputs: [
          'Student identifier',
          'Academic profile',
          'Portal-access eligibility',
        ],
      },
      {
        id: 'enrolment-activation',
        number: 4,
        title: 'Enrolment activation',
        actor: 'Academic and Finance Services',
        description:
          'The student is connected to an academic cohort and an applicable fee structure.',
        actionLabel: 'ACTIVATE_ENROLMENT',
        status: 'Completed',
        outputs: [
          'Cohort assignment',
          'Fee-plan association',
          'Enrolment status',
        ],
      },
    ],
    event: {
      name: 'ADMISSION_APPROVED',
      description:
        'An approved admission can trigger authorised student-record, academic and finance workflows.',
      affectedModules: ['Student Records', 'Academics', 'Finance'],
      auditFields: ['Actor', 'Institution', 'Time', 'Decision', 'Record reference'],
    },
  },
  {
    id: 'academics',
    title: 'Academics and Attendance',
    shortLabel: 'Academics',
    icon: BookOpenCheck,
    roleContext: 'Academic administrators and Faculty',
    headline: 'Connect teaching activity with attendance intervention',
    description:
      'See how course configuration, class attendance and configured threshold rules can support timely academic intervention.',
    metrics: [
      {
        label: 'Workflow stages',
        value: '4',
        detail: 'Configuration through notification',
      },
      {
        label: 'Attendance channels',
        value: 'Configurable',
        detail: 'Based on institutional setup',
      },
      {
        label: 'Student access',
        value: 'Assignment-based',
        detail: 'Faculty see authorised students',
      },
    ],
    steps: [
      {
        id: 'course-configuration',
        number: 1,
        title: 'Course configuration',
        actor: 'Department Academic Team',
        description:
          'The course offering, timetable, faculty allocation and academic rules are configured.',
        actionLabel: 'CONFIGURE_COURSE',
        status: 'Approved',
        outputs: [
          'Course offering',
          'Faculty assignment',
          'Student cohort',
        ],
      },
      {
        id: 'attendance-session',
        number: 2,
        title: 'Attendance recording',
        actor: 'Assigned Faculty',
        description:
          'Attendance is recorded for students enrolled in the assigned course section.',
        actionLabel: 'RECORD_ATTENDANCE',
        status: 'Recorded',
        outputs: [
          'Session attendance',
          'Faculty confirmation',
          'Attendance history',
        ],
      },
      {
        id: 'threshold-evaluation',
        number: 3,
        title: 'Threshold evaluation',
        actor: 'Academic Rules Service',
        description:
          'Current attendance is compared with institution-configured academic thresholds.',
        actionLabel: 'EVALUATE_THRESHOLD',
        status: 'Flagged',
        outputs: [
          'Attendance percentage',
          'Threshold result',
          'Intervention eligibility',
        ],
      },
      {
        id: 'academic-notification',
        number: 4,
        title: 'Academic notification',
        actor: 'Notification Service',
        description:
          'Approved recipients receive an academic warning or intervention notice.',
        actionLabel: 'SEND_ACADEMIC_NOTICE',
        status: 'Notified',
        outputs: [
          'Student notice',
          'Advisor notification',
          'Communication history',
        ],
      },
    ],
    event: {
      name: 'ATTENDANCE_THRESHOLD_REACHED',
      description:
        'A configured attendance threshold can initiate an authorised intervention workflow.',
      affectedModules: ['Attendance', 'Student Support', 'Notifications'],
      auditFields: ['Course', 'Student reference', 'Rule', 'Actor', 'Time'],
    },
  },
  {
    id: 'examinations',
    title: 'Examinations and Results',
    shortLabel: 'Examinations',
    icon: GraduationCap,
    roleContext: 'Examination and Academic teams',
    headline: 'Coordinate marks submission, verification and publication',
    description:
      'Explore a controlled result lifecycle where authorised teams submit, verify, approve and publish academic outcomes.',
    metrics: [
      {
        label: 'Workflow stages',
        value: '4',
        detail: 'Scheduling through publication',
      },
      {
        label: 'Approval model',
        value: 'Multi-stage',
        detail: 'Configurable institutional review',
      },
      {
        label: 'Publication',
        value: 'Controlled',
        detail: 'Released after authorised approval',
      },
    ],
    steps: [
      {
        id: 'exam-configuration',
        number: 1,
        title: 'Examination configuration',
        actor: 'Examination Office',
        description:
          'Assessment schedules, eligible cohorts and publication rules are configured.',
        actionLabel: 'CONFIGURE_EXAMINATION',
        status: 'Approved',
        outputs: [
          'Assessment schedule',
          'Eligible cohort',
          'Evaluation structure',
        ],
      },
      {
        id: 'marks-submission',
        number: 2,
        title: 'Marks submission',
        actor: 'Authorised Evaluator',
        description:
          'Assessment marks are submitted for the evaluator’s assigned courses and students.',
        actionLabel: 'SUBMIT_MARKS',
        status: 'Recorded',
        outputs: [
          'Marks batch',
          'Evaluator identity',
          'Submission time',
        ],
      },
      {
        id: 'result-verification',
        number: 3,
        title: 'Result verification',
        actor: 'Academic Review Team',
        description:
          'Submitted marks are checked through the institution’s configured review process.',
        actionLabel: 'VERIFY_RESULTS',
        status: 'Verified',
        outputs: [
          'Verification decision',
          'Recorded observations',
          'Approval readiness',
        ],
      },
      {
        id: 'result-publication',
        number: 4,
        title: 'Result publication',
        actor: 'Controller of Examinations',
        description:
          'Approved results are released to authorised student and institutional views.',
        actionLabel: 'PUBLISH_RESULTS',
        status: 'Published',
        outputs: [
          'Published result',
          'Student notification',
          'Publication history',
        ],
      },
    ],
    event: {
      name: 'RESULT_BATCH_PUBLISHED',
      description:
        'An approved result batch becomes available through authorised academic and student views.',
      affectedModules: ['Examinations', 'Student Portal', 'Academic Records'],
      auditFields: ['Batch', 'Approver', 'Publication time', 'Academic period'],
    },
  },
  {
    id: 'finance',
    title: 'Finance and Payments',
    shortLabel: 'Finance',
    icon: CreditCard,
    roleContext: 'Finance teams and Authorised payers',
    headline: 'Connect fee configuration, payment and reconciliation',
    description:
      'Follow an institutional finance workflow from fee assignment through authorised payment, receipt generation and reconciliation review.',
    metrics: [
      {
        label: 'Workflow stages',
        value: '4',
        detail: 'Configuration through reconciliation',
      },
      {
        label: 'Payment options',
        value: 'Configurable',
        detail: 'Based on enabled integrations',
      },
      {
        label: 'Finance access',
        value: 'Permission-based',
        detail: 'Sensitive data remains restricted',
      },
    ],
    steps: [
      {
        id: 'fee-configuration',
        number: 1,
        title: 'Fee configuration',
        actor: 'Authorised Finance Team',
        description:
          'Applicable fee components, schedules, instalments and policies are configured.',
        actionLabel: 'CONFIGURE_FEE_STRUCTURE',
        status: 'Approved',
        outputs: [
          'Fee structure',
          'Payment schedule',
          'Applicable student groups',
        ],
      },
      {
        id: 'adjustment-application',
        number: 2,
        title: 'Approved adjustment',
        actor: 'Scholarship or Finance Reviewer',
        description:
          'An authorised scholarship, concession or adjustment is applied to the account.',
        actionLabel: 'APPLY_APPROVED_ADJUSTMENT',
        status: 'Approved',
        outputs: [
          'Adjustment value',
          'Approval reference',
          'Revised balance',
        ],
      },
      {
        id: 'payment-processing',
        number: 3,
        title: 'Payment processing',
        actor: 'Student or Authorised Payer',
        description:
          'The payer completes a transaction through an institution-enabled payment method.',
        actionLabel: 'PROCESS_PAYMENT',
        status: 'Settled',
        outputs: [
          'Transaction reference',
          'Payment status',
          'Receipt eligibility',
        ],
      },
      {
        id: 'reconciliation',
        number: 4,
        title: 'Reconciliation review',
        actor: 'Finance Operations',
        description:
          'The transaction is matched against the relevant account and settlement information.',
        actionLabel: 'RECONCILE_PAYMENT',
        status: 'Completed',
        outputs: [
          'Reconciliation status',
          'Receipt record',
          'Finance activity history',
        ],
      },
    ],
    event: {
      name: 'PAYMENT_CONFIRMED',
      description:
        'A confirmed payment can update authorised account, receipt and reconciliation workflows.',
      affectedModules: ['Fees', 'Payments', 'Receipts', 'Finance Reporting'],
      auditFields: [
        'Transaction reference',
        'Account reference',
        'Amount',
        'Method',
        'Time',
      ],
    },
  },
  {
    id: 'services',
    title: 'Student Services',
    shortLabel: 'Services',
    icon: LifeBuoy,
    roleContext: 'Students and Service teams',
    headline: 'Track student requests from submission to resolution',
    description:
      'See how service requests can be submitted, routed, reviewed and delivered through a transparent institutional workflow.',
    metrics: [
      {
        label: 'Workflow stages',
        value: '4',
        detail: 'Submission through delivery',
      },
      {
        label: 'Routing',
        value: 'Department-based',
        detail: 'Based on request type',
      },
      {
        label: 'Progress',
        value: 'Trackable',
        detail: 'Status visible to authorised users',
      },
    ],
    steps: [
      {
        id: 'request-submission',
        number: 1,
        title: 'Request submission',
        actor: 'Student',
        description:
          'A student submits a service request with the required information and documents.',
        actionLabel: 'CREATE_SERVICE_REQUEST',
        status: 'Recorded',
        outputs: [
          'Request reference',
          'Submitted information',
          'Initial status',
        ],
      },
      {
        id: 'department-routing',
        number: 2,
        title: 'Department routing',
        actor: 'Service Routing Rules',
        description:
          'The request is assigned to the appropriate institutional service team.',
        actionLabel: 'ROUTE_SERVICE_REQUEST',
        status: 'Assigned',
        outputs: [
          'Assigned department',
          'Responsible queue',
          'Target response information',
        ],
      },
      {
        id: 'request-review',
        number: 3,
        title: 'Request review',
        actor: 'Authorised Service Officer',
        description:
          'The assigned team verifies the request and completes the required institutional action.',
        actionLabel: 'REVIEW_SERVICE_REQUEST',
        status: 'Approved',
        outputs: [
          'Review decision',
          'Reviewer identity',
          'Service output',
        ],
      },
      {
        id: 'service-delivery',
        number: 4,
        title: 'Service delivery',
        actor: 'Student Services',
        description:
          'The completed outcome becomes available to the student through the authorised workspace.',
        actionLabel: 'DELIVER_SERVICE_RESULT',
        status: 'Completed',
        outputs: [
          'Completed request',
          'Student notification',
          'Resolution history',
        ],
      },
    ],
    event: {
      name: 'SERVICE_REQUEST_COMPLETED',
      description:
        'A resolved service request updates the student-facing status and authorised service history.',
      affectedModules: ['Student Services', 'Documents', 'Notifications'],
      auditFields: [
        'Request reference',
        'Department',
        'Reviewer',
        'Resolution',
        'Time',
      ],
    },
  },
];

const statusClasses: Record<StepStatus, string> = {
  Verified: 'border-[#B8E2D3] bg-[#EAF8F3] text-[#067A4E]',
  Approved: 'border-[#C5D7F7] bg-[#EDF3FF] text-[#1754E8]',
  Created: 'border-[#D5C8F3] bg-[#F3EFFF] text-[#6941C6]',
  Published: 'border-[#B8E2D3] bg-[#EAF8F3] text-[#067A4E]',
  Recorded: 'border-[#CAD8E8] bg-[#F2F5F9] text-[#475467]',
  Flagged: 'border-[#F2D1A8] bg-[#FFF6E8] text-[#A95500]',
  Notified: 'border-[#C5D7F7] bg-[#EDF3FF] text-[#1754E8]',
  Settled: 'border-[#B8E2D3] bg-[#EAF8F3] text-[#067A4E]',
  Completed: 'border-[#B8E2D3] bg-[#EAF8F3] text-[#067A4E]',
  Assigned: 'border-[#D5C8F3] bg-[#F3EFFF] text-[#6941C6]',
};

const governanceControls = [
  {
    title: 'Tenant-aware data access',
    description:
      'Institutional context can be applied throughout authorised application and data-access workflows.',
    icon: Database,
  },
  {
    title: 'Role-aware permissions',
    description:
      'Information and actions can be limited according to assigned institutional responsibilities.',
    icon: KeyRound,
  },
  {
    title: 'Auditable workflow history',
    description:
      'Important workflow decisions can retain actor, time, status and record-reference information.',
    icon: FileText,
  },
  {
    title: 'Controlled integrations',
    description:
      'External services can be connected through configured and monitored integration boundaries.',
    icon: Network,
  },
] as const;

function WorkflowTabs({
  activeId,
  onChange,
  idPrefix,
}: {
  activeId: WorkflowId;
  onChange: (id: WorkflowId) => void;
  idPrefix: string;
}) {
  const workflowIds = workflows.map((workflow) => workflow.id);

  function handleKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentId: WorkflowId,
  ) {
    const currentIndex = workflowIds.indexOf(currentId);
    let nextIndex = currentIndex;

    if (event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % workflowIds.length;
    } else if (event.key === 'ArrowLeft') {
      nextIndex =
        (currentIndex - 1 + workflowIds.length) % workflowIds.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = workflowIds.length - 1;
    } else {
      return;
    }

    event.preventDefault();

    const nextId = workflowIds[nextIndex];
    onChange(nextId);

    requestAnimationFrame(() => {
      document.getElementById(`${idPrefix}-tab-${nextId}`)?.focus();
    });
  }

  return (
    <div
      role="tablist"
      aria-label="CampusOS workflow demonstrations"
      className="mx-auto flex max-w-full gap-2 overflow-x-auto rounded-2xl border border-[#DCE4EF] bg-white p-1.5 shadow-[0_8px_24px_rgba(16,24,40,0.05)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {workflows.map((workflow) => {
        const Icon = workflow.icon;
        const selected = workflow.id === activeId;

        return (
          <button
            key={workflow.id}
            id={`${idPrefix}-tab-${workflow.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel-${workflow.id}`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(workflow.id)}
            onKeyDown={(event) => handleKeyDown(event, workflow.id)}
            className={[
              'inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl px-4',
              'text-sm font-semibold transition-colors',
              'focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-[#1754E8] focus-visible:ring-offset-2',
              selected
                ? 'bg-[#101D38] text-white'
                : 'text-[#5F6C7B] hover:bg-[#F1F5FB] hover:text-[#1754E8]',
            ].join(' ')}
          >
            <Icon className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            {workflow.shortLabel}
          </button>
        );
      })}
    </div>
  );
}

function WorkflowMetrics({
  metrics,
}: {
  metrics: readonly WorkflowMetric[];
}) {
  return (
    <div className="mt-7 grid gap-3 sm:grid-cols-3">
      {metrics.map((metric) => (
        <div
          key={metric.label}
          className="rounded-xl border border-[#DEE5EF] bg-white p-4 shadow-[0_5px_18px_rgba(16,24,40,0.04)]"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[#667085]">
            {metric.label}
          </p>

          <p className="mt-2 text-lg font-bold tracking-[-0.02em] text-[#101828]">
            {metric.value}
          </p>

          <p className="mt-1 text-[10px] leading-4 text-[#7C889A]">
            {metric.detail}
          </p>
        </div>
      ))}
    </div>
  );
}

function WorkflowSteps({
  workflow,
  activeStepId,
  onSelect,
}: {
  workflow: WorkflowData;
  activeStepId: string;
  onSelect: (stepId: string) => void;
}) {
  return (
    <div className="mt-8">
      <h4 className="text-xs font-bold uppercase tracking-[0.11em] text-[#344054]">
        Workflow stages
      </h4>

      <div className="mt-4 space-y-3">
        {workflow.steps.map((step) => {
          const active = step.id === activeStepId;

          return (
            <button
              key={step.id}
              type="button"
              aria-pressed={active}
              onClick={() => onSelect(step.id)}
              className={[
                'flex w-full items-start justify-between gap-4 rounded-xl border p-4 text-left',
                'transition-[border-color,background-color,box-shadow]',
                'focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-[#1754E8] focus-visible:ring-offset-2',
                active
                  ? 'border-[#1754E8] bg-white shadow-[0_8px_24px_rgba(23,84,232,0.10)]'
                  : 'border-[#DDE4EE] bg-white/65 hover:border-[#B8CCEF] hover:bg-white',
              ].join(' ')}
            >
              <span className="flex min-w-0 items-start gap-3">
                <span
                  className={[
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    'text-xs font-bold',
                    active
                      ? 'bg-[#1754E8] text-white'
                      : 'bg-[#E9EEF5] text-[#5F6C7B]',
                  ].join(' ')}
                >
                  {step.number}
                </span>

                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-[#101828]">
                    {step.title}
                  </span>

                  <span className="mt-1 block text-xs text-[#667085]">
                    {step.actor}
                  </span>
                </span>
              </span>

              <ChevronRight
                className={[
                  'mt-1 h-4 w-4 shrink-0 transition-transform',
                  active
                    ? 'translate-x-0.5 text-[#1754E8]'
                    : 'text-[#98A2B3]',
                ].join(' ')}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ExecutionDetails({
  workflow,
  step,
}: {
  workflow: WorkflowData;
  step: WorkflowStep;
}) {
  return (
    <div aria-live="polite">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Layers3
            className="h-5 w-5 text-[#1754E8]"
            aria-hidden="true"
          />

          <h3 className="text-base font-bold text-[#101828]">
            Selected workflow stage
          </h3>
        </div>

        <span className="rounded-full border border-[#D8E1EC] bg-[#F5F7FA] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#667085]">
          Stage {step.number} of {workflow.steps.length}
        </span>
      </div>

      <div className="mt-5 rounded-2xl border border-[#DCE4EF] bg-[#F7F9FC] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <span className="rounded-lg border border-[#C9D8F5] bg-white px-3 py-1.5 font-mono text-[11px] font-semibold text-[#1754E8]">
            {step.actionLabel}
          </span>

          <span
            className={[
              'inline-flex min-h-7 items-center gap-1.5 rounded-full border px-2.5',
              'text-[10px] font-bold uppercase tracking-[0.07em]',
              statusClasses[step.status],
            ].join(' ')}
          >
            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
            {step.status}
          </span>
        </div>

        <h4 className="mt-5 text-xl font-bold tracking-[-0.02em] text-[#101828]">
          {step.title}
        </h4>

        <p className="mt-2 text-sm leading-6 text-[#5F6C7B]">
          {step.description}
        </p>

        <div className="mt-6 border-t border-[#DCE4EF] pt-5">
          <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#344054]">
            Resulting records and states
          </p>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {step.outputs.map((output) => (
              <div
                key={output}
                className="flex items-center gap-2.5 rounded-lg border border-[#E0E6EF] bg-white px-3 py-2.5 text-xs font-medium text-[#475467]"
              >
                <CheckCircle2
                  className="h-4 w-4 shrink-0 text-[#078A57]"
                  aria-hidden="true"
                />

                {output}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-[#29466F] bg-[#101D38] p-5 text-white sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07] text-[#8CB2FF]">
            <Workflow className="h-5 w-5" aria-hidden="true" />
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#9FB5D6]">
              Illustrative event
            </p>

            <h4 className="mt-1 font-mono text-sm font-semibold text-white">
              {workflow.event.name}
            </h4>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-[#C4CDDD]">
          {workflow.event.description}
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#8FA7C9]">
              Connected modules
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {workflow.event.affectedModules.map((module) => (
                <span
                  key={module}
                  className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-[#D7E1EF]"
                >
                  {module}
                </span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.09em] text-[#8FA7C9]">
              Auditable context
            </p>

            <div className="mt-2 flex flex-wrap gap-2">
              {workflow.event.auditFields.map((field) => (
                <span
                  key={field}
                  className="rounded-lg border border-white/12 bg-white/[0.06] px-2.5 py-1.5 text-[10px] font-medium text-[#D7E1EF]"
                >
                  {field}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 border-t border-[#DEE5EF] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#101828]">
            Explore this workflow in a demonstration workspace
          </p>

          <p className="mt-1 text-xs leading-5 text-[#667085]">
            All demonstration records are fictional and isolated from production
            institutional information.
          </p>
        </div>

        <Link
          href="/demo"
          className="group inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#1754E8] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(23,84,232,0.22)] transition-colors hover:bg-[#103FC2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8] focus-visible:ring-offset-4"
        >
          Open demo workspace

          <ArrowRight
            className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-1"
            aria-hidden="true"
          />
        </Link>
      </div>
    </div>
  );
}

export function ProductTourSection() {
  const [activeWorkflowId, setActiveWorkflowId] =
    useState<WorkflowId>('admissions');

  const activeWorkflow =
    workflows.find((workflow) => workflow.id === activeWorkflowId) ??
    workflows[0];

  const [activeStepId, setActiveStepId] = useState<string>(
    activeWorkflow.steps[0].id,
  );

  const idPrefix = useId().replace(/:/g, '');

  const activeStep =
    activeWorkflow.steps.find((step) => step.id === activeStepId) ??
    activeWorkflow.steps[0];

  function changeWorkflow(id: WorkflowId) {
    const nextWorkflow =
      workflows.find((workflow) => workflow.id === id) ?? workflows[0];

    setActiveWorkflowId(nextWorkflow.id);
    setActiveStepId(nextWorkflow.steps[0].id);
  }

  return (
    <section
      id="product-tour"
      className="overflow-hidden border-t border-[#DEE5EF] bg-white px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-32"
      aria-labelledby="product-tour-heading"
    >
      <div className="mx-auto max-w-[1280px]">
        <header className="mx-auto max-w-[820px] text-center">
          <div className="inline-flex min-h-8 items-center gap-2 rounded-full border border-[#C8D8F5] bg-[#EDF3FF] px-4 text-xs font-bold uppercase tracking-[0.12em] text-[#1754E8]">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Connected workflow tour
          </div>

          <h2
            id="product-tour-heading"
            className="mt-6 text-balance text-3xl font-bold tracking-[-0.03em] text-[#101A32] sm:text-4xl lg:text-[48px] lg:leading-[1.12]"
          >
            See how institutional workflows connect across CampusOS
          </h2>

          <p className="mx-auto mt-6 max-w-[760px] text-base leading-7 text-[#5F6C7B] sm:text-lg sm:leading-8">
            Explore illustrative workflows connecting admissions, academics,
            examinations, finance and student services while preserving role
            context and institutional boundaries.
          </p>

          <p className="mx-auto mt-4 max-w-[680px] text-xs leading-5 text-[#7C889A]">
            The records, events and outcomes shown below are fictional product
            demonstrations and do not represent measured customer performance.
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-fit">
          <WorkflowTabs
            activeId={activeWorkflow.id}
            onChange={changeWorkflow}
            idPrefix={idPrefix}
          />
        </div>

        <div
          id={`${idPrefix}-panel-${activeWorkflow.id}`}
          role="tabpanel"
          aria-labelledby={`${idPrefix}-tab-${activeWorkflow.id}`}
          tabIndex={0}
          className="mt-10 overflow-hidden rounded-3xl border border-[#D6DFEB] bg-white shadow-[0_24px_70px_rgba(16,42,91,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1754E8]"
        >
          <div className="flex flex-col gap-3 border-b border-[#2A3B5C] bg-[#101D38] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.07]">
                <Activity className="h-4 w-4 text-[#8CB2FF]" aria-hidden="true" />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">
                  CampusOS connected workflow
                </p>

                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9FB0C9]">
                  Fictional demonstration environment
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-lg border border-white/12 bg-white/[0.06] px-3 py-1.5 text-[10px] font-medium text-[#D4DDEB]">
                {activeWorkflow.roleContext}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#317A65] bg-[#15372F] px-3 py-1.5 text-[10px] font-semibold text-[#73E1BA]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Role-aware
              </span>
            </div>
          </div>

          <div className="grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)]">
            <div className="border-b border-[#DEE5EF] bg-[#F7F9FC] p-5 sm:p-7 lg:border-b-0 lg:border-r lg:p-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-[#EDF3FF] text-[#1754E8]">
                  <activeWorkflow.icon
                    className="h-6 w-6"
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.1em] text-[#1754E8]">
                    {activeWorkflow.title}
                  </p>

                  <h3 className="mt-2 text-2xl font-bold tracking-[-0.025em] text-[#101828]">
                    {activeWorkflow.headline}
                  </h3>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-[#5F6C7B]">
                {activeWorkflow.description}
              </p>

              <WorkflowMetrics metrics={activeWorkflow.metrics} />

              <WorkflowSteps
                workflow={activeWorkflow}
                activeStepId={activeStep.id}
                onSelect={setActiveStepId}
              />

              <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#C9DAF8] bg-[#EDF3FF] p-4">
                <LockKeyhole
                  className="mt-0.5 h-5 w-5 shrink-0 text-[#1754E8]"
                  aria-hidden="true"
                />

                <p className="text-xs leading-5 text-[#344054]">
                  Workflow access should be enforced by authenticated
                  institutional context, assigned permissions and tenant-scoped
                  data queries.
                </p>
              </div>
            </div>

            <div className="p-5 sm:p-7 lg:p-8">
              <ExecutionDetails
                workflow={activeWorkflow}
                step={activeStep}
              />
            </div>
          </div>
        </div>

        <div className="mt-12 rounded-3xl border border-[#D8E2EF] bg-[#F7F9FC] p-6 sm:p-8 lg:p-10">
          <header className="mx-auto max-w-[720px] text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#C9DAF8] bg-white text-[#1754E8]">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>

            <h3 className="mt-5 text-2xl font-bold tracking-[-0.025em] text-[#101828]">
              Governance controls for connected workflows
            </h3>

            <p className="mt-3 text-sm leading-6 text-[#5F6C7B]">
              CampusOS can apply identity, permission, institutional context and
              workflow-history controls according to the configured deployment.
            </p>
          </header>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {governanceControls.map((control) => {
              const Icon = control.icon;

              return (
                <article
                  key={control.title}
                  className="rounded-2xl border border-[#DEE5EF] bg-white p-5 shadow-[0_6px_20px_rgba(16,24,40,0.04)]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDF3FF] text-[#1754E8]">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>

                  <h4 className="mt-4 text-[15px] font-semibold text-[#101828]">
                    {control.title}
                  </h4>

                  <p className="mt-2 text-[13px] leading-6 text-[#5F6C7B]">
                    {control.description}
                  </p>
                </article>
              );
            })}
          </div>

          <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#D8E1EC] bg-white p-4">
            <FileCheck2
              className="mt-0.5 h-5 w-5 shrink-0 text-[#078A57]"
              aria-hidden="true"
            />

            <p className="text-xs leading-5 text-[#667085]">
              Specific security capabilities and assurance claims should be
              validated against the selected CampusOS deployment,
              infrastructure configuration and available technical evidence.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}