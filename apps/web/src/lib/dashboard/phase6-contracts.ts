import type { RoleType } from '@prisma/client';

export type Phase6Layout =
  | 'constellation'
  | 'control-grid'
  | 'ledger'
  | 'portfolio'
  | 'matrix'
  | 'timeline'
  | 'journey'
  | 'watch'
  | 'treasury'
  | 'reconciliation'
  | 'people'
  | 'occupancy'
  | 'catalogue'
  | 'route'
  | 'pipeline'
  | 'intake'
  | 'calendar';

export type Phase6MetricTone = 'neutral' | 'positive' | 'warning' | 'danger';

export type Phase6Metric = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  tone: Phase6MetricTone;
};

export type Phase6Signal = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  percentage: number;
  href?: string;
};

export type Phase6QueueItem = {
  id: string;
  title: string;
  detail: string;
  status?: string;
  href: string;
};

export type Phase6Blueprint = {
  role: RoleType;
  signature: string;
  layout: Phase6Layout;
  accent: string;
  softAccent: string;
  icon:
    | 'orbit'
    | 'building'
    | 'files'
    | 'graduation'
    | 'network'
    | 'presentation'
    | 'student'
    | 'family'
    | 'wallet'
    | 'calculator'
    | 'users'
    | 'bed'
    | 'library'
    | 'bus'
    | 'briefcase'
    | 'user-plus'
    | 'calendar';
  eyebrow: string;
  title: string;
  mission: string;
  assurance: string;
  primaryAction: { label: string; href: string };
};

export type Phase6ExperienceData = {
  role: RoleType;
  identity: {
    name: string;
    email: string;
    institution: string;
  };
  blueprint: Phase6Blueprint;
  metrics: Phase6Metric[];
  signals: Phase6Signal[];
  queue: {
    title: string;
    description: string;
    items: Phase6QueueItem[];
    emptyMessage: string;
  };
  context: {
    unreadNotifications: number;
    openSupportCases: number;
    relevantNotices: number;
    recentActivity: number;
    refreshedAt: string;
  };
};

export const PHASE6_BLUEPRINTS: Record<RoleType, Phase6Blueprint> = {
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    signature: 'platform-constellation',
    layout: 'constellation',
    accent: '#7C3AED',
    softAccent: '#F3E8FF',
    icon: 'orbit',
    eyebrow: 'Platform constellation',
    title: 'Institution network, platform health and governance reach',
    mission: 'See the operating footprint of CampusOS across institutions while preserving tenant boundaries and evidence trails.',
    assurance: 'Platform indicators remain aggregate-only and never expose another institution’s private operational records.',
    primaryAction: { label: 'Open platform governance', href: '/governance' },
  },
  INSTITUTION_ADMIN: {
    role: 'INSTITUTION_ADMIN',
    signature: 'institution-control-grid',
    layout: 'control-grid',
    accent: '#1754E8',
    softAccent: '#EAF1FF',
    icon: 'building',
    eyebrow: 'Institution control grid',
    title: 'People, academics, finance and service readiness in one command layer',
    mission: 'Coordinate institution-wide operations using verified tenant-scoped evidence and exception-first navigation.',
    assurance: 'Every indicator is restricted to the active institution and server-authorised role context.',
    primaryAction: { label: 'Open administration', href: '/settings' },
  },
  REGISTRAR: {
    role: 'REGISTRAR',
    signature: 'academic-ledger',
    layout: 'ledger',
    accent: '#0F766E',
    softAccent: '#CCFBF1',
    icon: 'files',
    eyebrow: 'Academic ledger',
    title: 'Record completeness, cohort structure and academic-period control',
    mission: 'Keep institutional academic records complete, traceable and ready for progression, examination and reporting workflows.',
    assurance: 'Student identity remains inside authorised records modules; this layer reports operational aggregates only.',
    primaryAction: { label: 'Open academic records', href: '/departments' },
  },
  DEAN: {
    role: 'DEAN',
    signature: 'portfolio-command',
    layout: 'portfolio',
    accent: '#C2410C',
    softAccent: '#FFEDD5',
    icon: 'graduation',
    eyebrow: 'Academic portfolio',
    title: 'Programme portfolio, department balance and outcome evidence',
    mission: 'Direct academic scale and quality through programme readiness, department coverage and outcome visibility.',
    assurance: 'Leadership views remain aggregate and do not replace approved academic or examination decisions.',
    primaryAction: { label: 'Review departments', href: '/departments' },
  },
  HOD: {
    role: 'HOD',
    signature: 'department-matrix',
    layout: 'matrix',
    accent: '#0369A1',
    softAccent: '#E0F2FE',
    icon: 'network',
    eyebrow: 'Department matrix',
    title: 'Faculty capacity, course coverage and programme readiness',
    mission: 'Run the assigned department with a focused view of teaching capacity, offerings and programme configuration.',
    assurance: 'The server resolves the HOD department from the persisted staff profile before loading any metric.',
    primaryAction: { label: 'Open department workspace', href: '/departments' },
  },
  FACULTY: {
    role: 'FACULTY',
    signature: 'teaching-timeline',
    layout: 'timeline',
    accent: '#4F46E5',
    softAccent: '#EEF2FF',
    icon: 'presentation',
    eyebrow: 'Teaching timeline',
    title: 'Classes, grading and attendance across assigned offerings',
    mission: 'Move from today’s teaching schedule to grading and attendance actions without leaving the assigned-course scope.',
    assurance: 'Only offerings attached to the authenticated faculty staff profile are included.',
    primaryAction: { label: 'Open assignments', href: '/assignments' },
  },
  STUDENT: {
    role: 'STUDENT',
    signature: 'student-journey',
    layout: 'journey',
    accent: '#2563EB',
    softAccent: '#DBEAFE',
    icon: 'student',
    eyebrow: 'Student journey',
    title: 'Today, progress, submissions and obligations',
    mission: 'Turn academic progress, attendance, assignments and fees into a clear next-action journey.',
    assurance: 'Every metric belongs to the authenticated student profile in the active institution.',
    primaryAction: { label: 'Open learning workspace', href: '/lms' },
  },
  PARENT: {
    role: 'PARENT',
    signature: 'guardian-watch',
    layout: 'watch',
    accent: '#9333EA',
    softAccent: '#F3E8FF',
    icon: 'family',
    eyebrow: 'Guardian watch',
    title: 'Linked-student attendance, results and fee visibility',
    mission: 'Keep verified guardians informed about the selected linked student while protecting unrelated student data.',
    assurance: 'Only students explicitly linked to the authenticated guardian can appear.',
    primaryAction: { label: 'Review linked student', href: '/attendance' },
  },
  FINANCE_OFFICER: {
    role: 'FINANCE_OFFICER',
    signature: 'treasury-command',
    layout: 'treasury',
    accent: '#047857',
    softAccent: '#D1FAE5',
    icon: 'wallet',
    eyebrow: 'Treasury command',
    title: 'Collections, outstanding exposure and payment-channel performance',
    mission: 'Prioritise collection health and time-sensitive receivables from verified transaction records.',
    assurance: 'Operational totals support action but do not replace approved ledger close or statutory reporting.',
    primaryAction: { label: 'Open payments', href: '/payments' },
  },
  ACCOUNTANT: {
    role: 'ACCOUNTANT',
    signature: 'reconciliation-desk',
    layout: 'reconciliation',
    accent: '#B45309',
    softAccent: '#FEF3C7',
    icon: 'calculator',
    eyebrow: 'Reconciliation desk',
    title: 'Exceptions, failed transactions and supporting evidence',
    mission: 'Resolve payment exceptions and review time-sensitive records with a reconciliation-first workflow.',
    assurance: 'Student and transaction references remain masked in the dashboard command layer.',
    primaryAction: { label: 'Open reconciliation', href: '/receipts' },
  },
  HR_ADMIN: {
    role: 'HR_ADMIN',
    signature: 'people-operations',
    layout: 'people',
    accent: '#BE123C',
    softAccent: '#FFE4E6',
    icon: 'users',
    eyebrow: 'People operations',
    title: 'Workforce coverage, account state and organisation readiness',
    mission: 'Coordinate active accounts, role distribution and staff assignment exceptions without exposing sensitive HR records.',
    assurance: 'Only operational profile metadata is surfaced; confidential personnel data remains in authorised workflows.',
    primaryAction: { label: 'Open people settings', href: '/settings' },
  },
  WARDEN: {
    role: 'WARDEN',
    signature: 'residence-occupancy',
    layout: 'occupancy',
    accent: '#7C2D12',
    softAccent: '#FFEDD5',
    icon: 'bed',
    eyebrow: 'Residence occupancy',
    title: 'Hostel capacity, room readiness and residential operations',
    mission: 'Balance room capacity and allocation demand using supported residence records and clear exception states.',
    assurance: 'Resident identity and unsupported welfare assumptions are excluded from the command layer.',
    primaryAction: { label: 'Open hostel operations', href: '/hostel' },
  },
  LIBRARIAN: {
    role: 'LIBRARIAN',
    signature: 'catalogue-intelligence',
    layout: 'catalogue',
    accent: '#0E7490',
    softAccent: '#CFFAFE',
    icon: 'library',
    eyebrow: 'Catalogue intelligence',
    title: 'Catalogue quality, circulation and collection-use signals',
    mission: 'Improve discovery and collection utility through catalogue coverage and circulation evidence.',
    assurance: 'Borrower identity, due dates and returns are never inferred where the current schema does not support them.',
    primaryAction: { label: 'Open library catalogue', href: '/opac' },
  },
  TRANSPORT_MANAGER: {
    role: 'TRANSPORT_MANAGER',
    signature: 'route-operations',
    layout: 'route',
    accent: '#1D4ED8',
    softAccent: '#DBEAFE',
    icon: 'bus',
    eyebrow: 'Route operations',
    title: 'Route coverage, service demand and transport communication',
    mission: 'Coordinate configured routes and transport support demand through an exception-led operating view.',
    assurance: 'No vehicle, GPS, stop or passenger metric is invented when the domain model does not contain it.',
    primaryAction: { label: 'Open transport workspace', href: '/transport' },
  },
  PLACEMENT_OFFICER: {
    role: 'PLACEMENT_OFFICER',
    signature: 'career-pipeline',
    layout: 'pipeline',
    accent: '#6D28D9',
    softAccent: '#EDE9FE',
    icon: 'briefcase',
    eyebrow: 'Career pipeline',
    title: 'Employer activity, applications and outcome progression',
    mission: 'Move opportunities through the placement pipeline using supported company and application evidence.',
    assurance: 'Candidate identity is not inferred because placement applications are aggregate records in the current schema.',
    primaryAction: { label: 'Open career workspace', href: '/community' },
  },
  ADMISSIONS_COUNSELLOR: {
    role: 'ADMISSIONS_COUNSELLOR',
    signature: 'admissions-intake',
    layout: 'intake',
    accent: '#DB2777',
    softAccent: '#FCE7F3',
    icon: 'user-plus',
    eyebrow: 'Admissions intake',
    title: 'Intake readiness, programme capacity and applicant-service work',
    mission: 'Coordinate admissions readiness and service activity using only persisted institution records.',
    assurance: 'No applicant funnel is fabricated where a reviewed applicant data model is unavailable.',
    primaryAction: { label: 'Open admissions hub', href: '/platform/admissions' },
  },
  EXAMINATION_CONTROLLER: {
    role: 'EXAMINATION_CONTROLLER',
    signature: 'assessment-calendar',
    layout: 'calendar',
    accent: '#DC2626',
    softAccent: '#FEE2E2',
    icon: 'calendar',
    eyebrow: 'Assessment calendar',
    title: 'Schedule readiness, result volume and examination operations',
    mission: 'Coordinate examination definitions, schedules and result operations without exposing candidate marks in the command layer.',
    assurance: 'Individual marks and candidate records remain inside authorised examination workflows.',
    primaryAction: { label: 'Open examinations', href: '/examinations' },
  },
};

export function phase6BlueprintForRole(role: RoleType): Phase6Blueprint {
  return PHASE6_BLUEPRINTS[role];
}

export function clampPhase6Percentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
