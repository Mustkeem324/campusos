import type { RoleType } from '@prisma/client';

export type RoleWorkspaceAction = {
  label: string;
  description: string;
  href: string;
  icon: 'records' | 'academics' | 'finance' | 'people' | 'operations' | 'support';
};

export type RoleWorkspaceProfile = {
  eyebrow: string;
  title: string;
  description: string;
  responsibilities: string[];
  actions: RoleWorkspaceAction[];
  guidance: string;
};

const ROLE_WORKSPACE_PROFILES = {
  REGISTRAR: {
    eyebrow: 'Registrar workspace',
    title: 'Academic records and institutional coordination',
    description:
      'Manage registration, official records, result publication and cross-department academic administration from one role-scoped workspace.',
    responsibilities: [
      'Review registration and academic-record workflows.',
      'Coordinate approved result and document publication.',
      'Resolve institutional record exceptions through auditable processes.',
    ],
    actions: [
      { label: 'Registration', description: 'Open registration and enrolment workflows.', href: '/registration', icon: 'records' },
      { label: 'Results', description: 'Review published academic outcomes.', href: '/results', icon: 'academics' },
      { label: 'Documents', description: 'Manage approved institutional documents.', href: '/documents', icon: 'records' },
      { label: 'Departments', description: 'Review department information and ownership.', href: '/departments', icon: 'people' },
    ],
    guidance: 'Use approved workflows for record changes. Avoid direct or undocumented edits to official academic history.',
  },
  DEAN: {
    eyebrow: 'Dean workspace',
    title: 'Academic leadership and programme oversight',
    description:
      'Review programme delivery, department activity, learner outcomes and academic governance without exposing unrelated operational data.',
    responsibilities: [
      'Monitor academic delivery across assigned programmes.',
      'Review department-level outcomes and exceptions.',
      'Coordinate governance actions with accountable owners.',
    ],
    actions: [
      { label: 'Departments', description: 'Review academic units and ownership.', href: '/departments', icon: 'people' },
      { label: 'Learning workspace', description: 'Open teaching and course delivery tools.', href: '/lms', icon: 'academics' },
      { label: 'Results', description: 'Review authorised academic outcomes.', href: '/results', icon: 'records' },
      { label: 'Governance', description: 'Open institutional governance workflows.', href: '/governance', icon: 'operations' },
    ],
    guidance: 'Dashboard links provide navigation only. Every underlying record remains subject to server-side role and tenant checks.',
  },
  HOD: {
    eyebrow: 'Head of department workspace',
    title: 'Department delivery, teaching and academic operations',
    description:
      'Coordinate timetable, attendance, teaching activity and department-level academic responsibilities in a focused workspace.',
    responsibilities: [
      'Coordinate teaching schedules and department workload.',
      'Review attendance and delivery exceptions.',
      'Support faculty and programme operations within assigned scope.',
    ],
    actions: [
      { label: 'Department', description: 'Review department structure and information.', href: '/departments', icon: 'people' },
      { label: 'Timetable', description: 'Open scheduled teaching activity.', href: '/timetable', icon: 'operations' },
      { label: 'Attendance', description: 'Review attendance workflows and exceptions.', href: '/attendance', icon: 'records' },
      { label: 'Learning workspace', description: 'Open assigned course delivery tools.', href: '/lms', icon: 'academics' },
    ],
    guidance: 'Department access must remain limited to assigned scope. Cross-department records require an authorised institutional workflow.',
  },
  FINANCE_OFFICER: {
    eyebrow: 'Finance officer workspace',
    title: 'Collections, dues and financial operations',
    description:
      'Review approved billing, collections, receipts and financial exceptions while preserving separation from unrelated academic records.',
    responsibilities: [
      'Review payment and outstanding-fee workflows.',
      'Resolve financial exceptions through approved processes.',
      'Maintain an auditable trail for institutional finance actions.',
    ],
    actions: [
      { label: 'Payments', description: 'Open payment and collection workflows.', href: '/payments', icon: 'finance' },
      { label: 'Receipts', description: 'Review issued receipts and transaction evidence.', href: '/receipts', icon: 'finance' },
      { label: 'Scholarships', description: 'Review approved scholarship workflows.', href: '/scholarships', icon: 'academics' },
      { label: 'Audit trail', description: 'Review authorised financial activity records.', href: '/audit', icon: 'records' },
    ],
    guidance: 'Do not use dashboard totals as a replacement for ledger reconciliation or approved institutional financial reports.',
  },
  ACCOUNTANT: {
    eyebrow: 'Accountant workspace',
    title: 'Transaction review and reconciliation support',
    description:
      'Access payment, receipt and audit workflows required for day-to-day accounting operations within the assigned institution.',
    responsibilities: [
      'Review recorded transactions and receipt evidence.',
      'Support reconciliation and exception resolution.',
      'Escalate discrepancies using documented approval routes.',
    ],
    actions: [
      { label: 'Payments', description: 'Review payment transactions and status.', href: '/payments', icon: 'finance' },
      { label: 'Receipts', description: 'Open issued receipt records.', href: '/receipts', icon: 'finance' },
      { label: 'Audit trail', description: 'Review authorised accounting activity.', href: '/audit', icon: 'records' },
      { label: 'Helpdesk', description: 'Raise or review a finance support request.', href: '/helpdesk', icon: 'support' },
    ],
    guidance: 'Accounting actions should remain traceable to an authorised user, institution, source record and approval path.',
  },
  HR_ADMIN: {
    eyebrow: 'HR administration workspace',
    title: 'People operations and institutional administration',
    description:
      'Coordinate staff administration, organisational settings and approved people operations without exposing student-only information.',
    responsibilities: [
      'Review staff-facing institutional settings and workflows.',
      'Coordinate department and role administration.',
      'Maintain accountable people-operation records.',
    ],
    actions: [
      { label: 'Settings', description: 'Open authorised institutional configuration.', href: '/settings', icon: 'operations' },
      { label: 'Departments', description: 'Review organisational units and ownership.', href: '/departments', icon: 'people' },
      { label: 'Audit trail', description: 'Review authorised administrative activity.', href: '/audit', icon: 'records' },
      { label: 'Helpdesk', description: 'Create or review an HR support request.', href: '/helpdesk', icon: 'support' },
    ],
    guidance: 'Sensitive staff records require a dedicated authorised workflow and must not be exposed through generic dashboard widgets.',
  },
  WARDEN: {
    eyebrow: 'Warden workspace',
    title: 'Residential operations and student support',
    description:
      'Coordinate hostel operations, resident communication and support cases within the assigned residential scope.',
    responsibilities: [
      'Review hostel occupancy and operational workflows.',
      'Coordinate resident communication and support.',
      'Escalate safety or welfare concerns through approved channels.',
    ],
    actions: [
      { label: 'Hostel operations', description: 'Open residential and hostel workflows.', href: '/hostel', icon: 'operations' },
      { label: 'Community', description: 'Review approved community communication.', href: '/community', icon: 'people' },
      { label: 'Helpdesk', description: 'Raise or review a residential support case.', href: '/helpdesk', icon: 'support' },
      { label: 'Notifications', description: 'Review relevant operational notices.', href: '/notifications', icon: 'records' },
    ],
    guidance: 'Emergency, welfare and disciplinary matters require the institution’s approved escalation and privacy process.',
  },
  LIBRARIAN: {
    eyebrow: 'Library workspace',
    title: 'Library discovery and service operations',
    description:
      'Manage discovery, library-service workflows and approved documentation from a focused institutional workspace.',
    responsibilities: [
      'Support catalogue discovery and library-service operations.',
      'Coordinate approved document workflows.',
      'Resolve user requests through accountable support routes.',
    ],
    actions: [
      { label: 'Library catalogue', description: 'Open catalogue and discovery services.', href: '/opac', icon: 'records' },
      { label: 'Documents', description: 'Review approved document workflows.', href: '/documents', icon: 'records' },
      { label: 'Notifications', description: 'Review library-related notices.', href: '/notifications', icon: 'operations' },
      { label: 'Helpdesk', description: 'Raise or review a library support case.', href: '/helpdesk', icon: 'support' },
    ],
    guidance: 'Catalogue access and borrower information must remain limited to the user’s authorised institution and role scope.',
  },
  TRANSPORT_MANAGER: {
    eyebrow: 'Transport management workspace',
    title: 'Transport routes, operations and service coordination',
    description:
      'Coordinate transport workflows, operational communication and support cases without exposing unrelated student records.',
    responsibilities: [
      'Review assigned transport routes and operations.',
      'Coordinate service notices and issue resolution.',
      'Escalate safety concerns using approved workflows.',
    ],
    actions: [
      { label: 'Transport', description: 'Open route and transport operations.', href: '/transport', icon: 'operations' },
      { label: 'Community', description: 'Review approved transport communication.', href: '/community', icon: 'people' },
      { label: 'Notifications', description: 'Review operational announcements.', href: '/notifications', icon: 'records' },
      { label: 'Helpdesk', description: 'Create or review a transport support request.', href: '/helpdesk', icon: 'support' },
    ],
    guidance: 'Operational location or passenger information must not be exposed beyond the minimum role-authorised requirement.',
  },
  PLACEMENT_OFFICER: {
    eyebrow: 'Placement workspace',
    title: 'Career services and opportunity coordination',
    description:
      'Coordinate approved career communication, student-service records and placement support from one role-focused workspace.',
    responsibilities: [
      'Coordinate approved opportunity and career-service communication.',
      'Support student documentation and placement workflows.',
      'Track support requests through accountable channels.',
    ],
    actions: [
      { label: 'Community', description: 'Publish or review approved opportunity notices.', href: '/community', icon: 'people' },
      { label: 'Documents', description: 'Review approved placement documentation.', href: '/documents', icon: 'records' },
      { label: 'Notifications', description: 'Review career-service announcements.', href: '/notifications', icon: 'operations' },
      { label: 'Helpdesk', description: 'Create or review a placement support case.', href: '/helpdesk', icon: 'support' },
    ],
    guidance: 'Do not disclose candidate or student application information outside the institution’s approved placement process.',
  },
  ADMISSIONS_COUNSELLOR: {
    eyebrow: 'Admissions workspace',
    title: 'Applicant guidance and admissions operations',
    description:
      'Support prospective applicants, documentation workflows and admissions communication within the assigned institution.',
    responsibilities: [
      'Guide applicants through approved admissions steps.',
      'Review submitted documentation through authorised workflows.',
      'Escalate exceptions without bypassing institutional controls.',
    ],
    actions: [
      { label: 'Admissions hub', description: 'Open institution admissions workflows.', href: '/platform/admissions', icon: 'academics' },
      { label: 'Documents', description: 'Review approved applicant documents.', href: '/documents', icon: 'records' },
      { label: 'Notifications', description: 'Review admissions communication.', href: '/notifications', icon: 'operations' },
      { label: 'Helpdesk', description: 'Create or review an admissions support case.', href: '/helpdesk', icon: 'support' },
    ],
    guidance: 'Admission decisions and applicant record changes must remain within approved server-side workflows and permissions.',
  },
  EXAMINATION_CONTROLLER: {
    eyebrow: 'Examination control workspace',
    title: 'Assessment governance and result operations',
    description:
      'Coordinate examination workflows, authorised result publication and evidence review without exposing unrelated institutional records.',
    responsibilities: [
      'Review examination scheduling and operational workflows.',
      'Coordinate moderation and approved result publication.',
      'Maintain an auditable trail for assessment actions.',
    ],
    actions: [
      { label: 'Examinations', description: 'Open assessment and examination workflows.', href: '/examinations', icon: 'academics' },
      { label: 'Results', description: 'Review authorised result publication.', href: '/results', icon: 'records' },
      { label: 'Documents', description: 'Review approved examination documents.', href: '/documents', icon: 'records' },
      { label: 'Audit trail', description: 'Review authorised examination activity.', href: '/audit', icon: 'records' },
    ],
    guidance: 'Marks, moderation and published results must only change through authorised, auditable examination workflows.',
  },
} satisfies Partial<Record<RoleType, RoleWorkspaceProfile>>;

const GENERIC_PROFILE: RoleWorkspaceProfile = {
  eyebrow: 'Role workspace',
  title: 'Your CampusOS workspace',
  description: 'Access the modules available to your role through the shared CampusOS navigation.',
  responsibilities: [
    'Use only the workflows assigned to your current role.',
    'Keep institutional and personal information within approved systems.',
    'Escalate access or data issues through the helpdesk.',
  ],
  actions: [
    { label: 'Notifications', description: 'Review institutional notices and updates.', href: '/notifications', icon: 'records' },
    { label: 'Community', description: 'Open the institution community workspace.', href: '/community', icon: 'people' },
    { label: 'Helpdesk', description: 'Create or review a support request.', href: '/helpdesk', icon: 'support' },
  ],
  guidance: 'Available modules are determined by the active server-verified role and tenant context.',
};

export function roleWorkspaceProfileForRole(role: RoleType): RoleWorkspaceProfile {
  return ROLE_WORKSPACE_PROFILES[role] ?? GENERIC_PROFILE;
}

export function roleLabel(role: RoleType): string {
  return role
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
