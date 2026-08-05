import type { RoleType } from '@prisma/client';

/**
 * Central typed dashboard registry (Phase 95).
 *
 * Maps each supported role to its dedicated dashboard composition. Permission
 * enforcement always stays on the server (see dashboard loaders); this registry
 * is the single source of truth for routes, titles, navigation, quick actions
 * and data-contract identifiers.
 */

export type DashboardNavItem = {
  label: string;
  href: string;
  /** Optional permission string (resource:action:scope) that gates the item. */
  permission?: string;
};

export type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

export type DashboardQuickAction = {
  label: string;
  href: string;
};

export type DashboardWidgetDefinition = {
  id: string;
  roles: RoleType[];
  /** Server-gated permission required for the widget's data. */
  permission: string;
  dataSource: string;
  drillDown?: string;
  states: Array<'loading' | 'empty' | 'error' | 'ready'>;
};

export type DashboardDefinition = {
  role: RoleType;
  route: string;
  title: string;
  description: string;
  permissions: string[];
  navigation: DashboardNavGroup[];
  quickActions: DashboardQuickAction[];
  widgets: DashboardWidgetDefinition[];
  dataContract: string;
};

/** Roles that currently have a fully implemented dashboard composition. */
export const IMPLEMENTED_DASHBOARD_ROLES: RoleType[] = ['STUDENT', 'INSTITUTION_ADMIN', 'SUPER_ADMIN', 'PARENT', 'FACULTY', 'FINANCE_OFFICER', 'ACCOUNTANT'];

/** All roles known to the domain model. */
export const KNOWN_ROLES: RoleType[] = [
  'SUPER_ADMIN',
  'INSTITUTION_ADMIN',
  'REGISTRAR',
  'DEAN',
  'HOD',
  'FACULTY',
  'STUDENT',
  'PARENT',
  'FINANCE_OFFICER',
  'ACCOUNTANT',
  'HR_ADMIN',
  'WARDEN',
  'LIBRARIAN',
  'TRANSPORT_MANAGER',
  'PLACEMENT_OFFICER',
  'ADMISSIONS_COUNSELLOR',
  'EXAMINATION_CONTROLLER',
];

/**
 * Shared finance dashboard composition for FINANCE_OFFICER and ACCOUNTANT.
 * A single factory prevents the two role definitions from drifting.
 */
function buildFinanceDefinition(role: 'FINANCE_OFFICER' | 'ACCOUNTANT'): DashboardDefinition {
  return {
    role,
    route: '/dashboard/finance',
    title: 'Finance Operations Workspace',
    description: 'Fee collections, outstanding balances, reconciliation and finance schemes.',
    permissions: ['fees:manage:institution', 'fees:read:institution', 'fees:pay:institution', 'receipts:read:institution', 'audit:read:institution'],
    navigation: [
      {
        label: 'FINANCE OPERATIONS',
        items: [
          { label: 'Dashboard', href: '/dashboard/finance' },
          { label: 'Fees & Payments', href: '/payments' },
          { label: 'Receipts', href: '/receipts' },
          { label: 'Scholarships', href: '/scholarships' },
          { label: 'Audit Logs', href: '/audit', permission: 'audit:read:institution' },
        ],
      },
    ],
    quickActions: [
      { label: 'Open fee collections', href: '/payments' },
      { label: 'Issue receipt', href: '/receipts' },
      { label: 'Manage scholarships', href: '/scholarships' },
      { label: 'View audit logs', href: '/audit' },
    ],
    widgets: [
      { id: 'finance-metrics', roles: ['FINANCE_OFFICER', 'ACCOUNTANT'], permission: 'fees:read:institution', dataSource: 'GET /api/dashboard/finance', states: ['loading', 'empty', 'error', 'ready'] },
      { id: 'finance-outstanding', roles: ['FINANCE_OFFICER', 'ACCOUNTANT'], permission: 'fees:read:institution', dataSource: 'GET /api/dashboard/finance', drillDown: '/payments', states: ['loading', 'empty', 'error', 'ready'] },
      { id: 'finance-recent-payments', roles: ['FINANCE_OFFICER', 'ACCOUNTANT'], permission: 'fees:read:institution', dataSource: 'GET /api/dashboard/finance', drillDown: '/receipts', states: ['loading', 'empty', 'error', 'ready'] },
      { id: 'finance-invoice-status', roles: ['FINANCE_OFFICER', 'ACCOUNTANT'], permission: 'fees:read:institution', dataSource: 'GET /api/dashboard/finance', states: ['loading', 'empty', 'error', 'ready'] },
      { id: 'finance-schemes', roles: ['FINANCE_OFFICER', 'ACCOUNTANT'], permission: 'fees:read:institution', dataSource: 'GET /api/dashboard/finance', drillDown: '/scholarships', states: ['loading', 'empty', 'error', 'ready'] },
    ],
    dataContract: 'FinanceDashboardData',
  };
}

/** Safe navigation shown when a role has no dedicated dashboard yet. */
const FALLBACK_NAVIGATION: DashboardNavGroup[] = [
  {
    label: 'WORKSPACE',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Community', href: '/community' },
      { label: 'Notifications', href: '/notifications' },
      { label: 'Helpdesk', href: '/helpdesk' },
      { label: 'Support', href: '/support/cases' },
    ],
  },
];

/**
 * Returns the dashboard definition for a role, or a safe fallback definition
 * for known-but-unimplemented roles (never an admin/faculty dashboard).
 */
export function dashboardDefinitionForRole(role: RoleType): DashboardDefinition {
  const definition = DASHBOARD_DEFINITIONS[role];
  if (definition) return definition;

  return {
    role,
    route: '/dashboard',
    title: 'Role workspace',
    description: 'Your role workspace is being prepared.',
    permissions: [],
    navigation: FALLBACK_NAVIGATION,
    quickActions: [],
    widgets: [],
    dataContract: 'Unconfigured',
  };
}

/** Server-authorised landing route for a role. Never returns a redirect-to-self loop. */
export function dashboardRouteForRole(role: RoleType): string {
  const definition = DASHBOARD_DEFINITIONS[role];
  // Implemented dashboards have dedicated routes; unhandled roles land on the
  // role-scoped shell page at /dashboard instead of looping.
  return definition ? definition.route : '/dashboard';
}

export const DASHBOARD_DEFINITIONS: Partial<Record<RoleType, DashboardDefinition>> = {
  INSTITUTION_ADMIN: {
    role: 'INSTITUTION_ADMIN',
    route: '/dashboard/admin',
    title: 'Institution Administration Portal',
    description: 'Institutional configuration, users, workflows, approvals and operational exceptions.',
    permissions: [
      'users:manage:institution',
      'academics:manage:institution',
      'courses:manage:institution',
      'fees:manage:institution',
      'attendance:read:institution',
      'audit:read:institution',
      'notices:manage:institution',
    ],
    navigation: [
      {
        label: 'ADMINISTRATION',
        items: [
          { label: 'Dashboard', href: '/dashboard/admin' },
          { label: 'Admissions Hub', href: '/platform/admissions', permission: 'academics:manage:institution' },
          { label: 'Departments', href: '/departments', permission: 'academics:manage:institution' },
          { label: 'Governance', href: '/governance' },
          { label: 'Legal & Risk', href: '/legal-risk' },
          { label: 'AI Governance', href: '/ai-governance' },
          { label: 'Data Migration', href: '/data-migration' },
          { label: 'Sustainability', href: '/sustainability' },
          { label: 'Audit Logs', href: '/audit', permission: 'audit:read:institution' },
        ],
      },
      {
        label: 'SETTINGS',
        items: [{ label: 'Settings', href: '/settings' }],
      },
    ],
    quickActions: [
      { label: 'Review users', href: '/settings' },
      { label: 'Open admissions hub', href: '/platform/admissions' },
      { label: 'View departments', href: '/departments' },
      { label: 'Open audit logs', href: '/audit' },
      { label: 'AI governance', href: '/ai-governance' },
    ],
    widgets: [
      {
        id: 'admin-metrics',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'users:manage:institution',
        dataSource: 'getAdminDashboardData',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'admin-user-summary',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'users:manage:institution',
        dataSource: 'getAdminDashboardData',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'admin-finance-summary',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'fees:manage:institution',
        dataSource: 'getAdminDashboardData',
        drillDown: '/receipts',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'admin-notices',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'notices:manage:institution',
        dataSource: 'getAdminDashboardData',
        drillDown: '/notifications',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'admin-support-cases',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'users:manage:institution',
        dataSource: 'getAdminDashboardData',
        drillDown: '/support/cases',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'admin-recent-activity',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'audit:read:institution',
        dataSource: 'getAdminDashboardData',
        drillDown: '/audit',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'admin-risk-alerts',
        roles: ['INSTITUTION_ADMIN', 'SUPER_ADMIN'],
        permission: 'fees:manage:institution',
        dataSource: 'getAdminDashboardData',
        states: ['loading', 'empty', 'error', 'ready'],
      },
    ],
    dataContract: 'AdminDashboardData',
  },
  SUPER_ADMIN: {
    role: 'SUPER_ADMIN',
    route: '/dashboard/admin',
    title: 'Platform Administration',
    description: 'Platform-wide institutional overview and administration.',
    permissions: ['*:manage:all'],
    navigation: [
      {
        label: 'ADMINISTRATION',
        items: [
          { label: 'Dashboard', href: '/dashboard/admin' },
          { label: 'Admissions Hub', href: '/platform/admissions' },
          { label: 'Departments', href: '/departments' },
          { label: 'Governance', href: '/governance' },
          { label: 'Legal & Risk', href: '/legal-risk' },
          { label: 'AI Governance', href: '/ai-governance' },
          { label: 'Data Migration', href: '/data-migration' },
          { label: 'Sustainability', href: '/sustainability' },
          { label: 'Audit Logs', href: '/audit' },
        ],
      },
      {
        label: 'SETTINGS',
        items: [{ label: 'Settings', href: '/settings' }],
      },
    ],
    quickActions: [],
    widgets: [],
    dataContract: 'PlatformAdminDashboardData (planned)',
  },
  FACULTY: {
    role: 'FACULTY',
    route: '/dashboard/faculty',
    title: 'Faculty Teaching Workspace',
    description: 'Assigned teaching responsibilities, grading work and assigned-student support.',
    permissions: [
      'attendance:mark:own_section',
      'attendance:read:own_section',
      'courses:read:department',
      'assignments:manage:own_section',
      'grades:manage:own_section',
      'marks:submit:own_section',
      'notices:create:department',
    ],
    navigation: [
      {
        label: 'FACULTY WORKSPACE',
        items: [
          { label: 'Dashboard', href: '/dashboard/faculty' },
          { label: 'My Courses (LMS)', href: '/lms' },
          { label: 'Timetable', href: '/timetable' },
          { label: 'Attendance', href: '/attendance' },
          { label: 'Assignments', href: '/assignments' },
          { label: 'Examinations', href: '/examinations' },
          { label: 'Results', href: '/results' },
          { label: 'Community', href: '/community' },
        ],
      },
    ],
    quickActions: [
      { label: 'Grade submissions', href: '/assignments' },
      { label: 'Mark attendance', href: '/attendance' },
      { label: 'Open my courses', href: '/lms' },
    ],
    widgets: [
      { id: 'faculty-assigned-courses', roles: ['FACULTY'], permission: 'courses:read:department', dataSource: 'GET /api/dashboard/faculty', drillDown: '/lms', states: ['loading', 'empty', 'error', 'ready'] },
      { id: 'faculty-pending-grading', roles: ['FACULTY'], permission: 'assignments:manage:own_section', dataSource: 'GET /api/dashboard/faculty', drillDown: '/assignments', states: ['loading', 'empty', 'error', 'ready'] },
      { id: 'faculty-today-classes', roles: ['FACULTY'], permission: 'attendance:read:own_section', dataSource: 'GET /api/dashboard/faculty', drillDown: '/timetable', states: ['loading', 'empty', 'error', 'ready'] },
    ],
    dataContract: 'FacultyDashboardData',
  },
  FINANCE_OFFICER: buildFinanceDefinition('FINANCE_OFFICER'),
  ACCOUNTANT: buildFinanceDefinition('ACCOUNTANT'),
  PARENT: {
    role: 'PARENT',
    route: '/dashboard/parent',
    title: 'Parent & Guardian Portal',
    description: 'Authorised academic and financial information for verified linked students.',
    permissions: ['attendance:read:own', 'grades:read:own', 'fees:pay:own', 'notices:read:institution', 'hostel:approve_outpass:own'],
    navigation: [
      {
        label: 'PARENT PORTAL',
        items: [
          { label: 'Dashboard', href: '/dashboard/parent' },
          { label: 'Attendance', href: '/attendance', permission: 'attendance:read:own' },
          { label: 'Results', href: '/results', permission: 'grades:read:own' },
          { label: 'Fees & Dues', href: '/payments' },
          { label: 'Notices', href: '/community' },
          { label: 'Support', href: '/helpdesk' },
        ],
      },
    ],
    quickActions: [
      { label: 'View ward attendance', href: '/attendance' },
      { label: 'View published results', href: '/results' },
      { label: 'Review fees & dues', href: '/payments' },
      { label: 'Institutional notices', href: '/community' },
    ],
    widgets: [
      {
        id: 'parent-identity',
        roles: ['PARENT'],
        permission: 'grades:read:own',
        dataSource: 'getParentDashboardData',
        states: ['ready'],
      },
      {
        id: 'parent-linked-students',
        roles: ['PARENT'],
        permission: 'grades:read:own',
        dataSource: 'getParentDashboardData',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'parent-ward-attendance',
        roles: ['PARENT'],
        permission: 'attendance:read:own',
        dataSource: 'getParentDashboardData',
        drillDown: '/attendance',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'parent-ward-results',
        roles: ['PARENT'],
        permission: 'grades:read:own',
        dataSource: 'getParentDashboardData',
        drillDown: '/results',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'parent-ward-fees',
        roles: ['PARENT'],
        permission: 'fees:pay:own',
        dataSource: 'getParentDashboardData',
        drillDown: '/payments',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'parent-notices',
        roles: ['PARENT'],
        permission: 'notices:read:institution',
        dataSource: 'getParentDashboardData',
        drillDown: '/community',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'parent-risk-alerts',
        roles: ['PARENT'],
        permission: 'grades:read:own',
        dataSource: 'getParentDashboardData',
        states: ['loading', 'empty', 'error', 'ready'],
      },
    ],
    dataContract: 'ParentDashboardData',
  },
  STUDENT: {
    role: 'STUDENT',
    route: '/dashboard/student',
    title: 'Student Dashboard',
    description: 'Today’s academic work, progress, financial obligations and student services.',
    permissions: [
      'attendance:read:own',
      'grades:read:own',
      'fees:pay:own',
      'assignments:submit:own',
      'courses:read:institution',
      'notices:read:institution',
      'certificates:request:own',
    ],
    navigation: [
      {
        label: 'ACADEMICS',
        items: [
          { label: 'Dashboard', href: '/dashboard/student' },
          { label: 'Learning (LMS)', href: '/lms' },
          { label: 'Assignments', href: '/assignments', permission: 'assignments:submit:own' },
          { label: 'Timetable', href: '/timetable' },
          { label: 'Attendance', href: '/attendance', permission: 'attendance:read:own' },
          { label: 'Registration', href: '/registration' },
          { label: 'Examinations', href: '/examinations' },
          { label: 'Results', href: '/results', permission: 'grades:read:own' },
          { label: 'Microcredentials', href: '/microcredentials' },
        ],
      },
      {
        label: 'CAMPUS SERVICES',
        items: [
          { label: 'Helpdesk', href: '/helpdesk' },
          { label: 'Hostel', href: '/hostel' },
          { label: 'Library (OPAC)', href: '/opac' },
          { label: 'Transport', href: '/transport' },
          { label: 'Digital ID', href: '/digital-id' },
          { label: 'Student Benefits', href: '/student-benefits' },
          { label: 'Forum', href: '/forum' },
        ],
      },
      {
        label: 'FINANCE & ACCOUNT',
        items: [
          { label: 'Fees & Payments', href: '/payments', permission: 'fees:pay:own' },
          { label: 'Scholarships', href: '/scholarships' },
          { label: 'Receipts', href: '/receipts' },
          { label: 'Documents', href: '/documents' },
          { label: 'My Profile', href: '/student-profile' },
        ],
      },
    ],
    quickActions: [
      { label: 'Open timetable', href: '/timetable' },
      { label: 'View attendance', href: '/attendance' },
      { label: 'Open assignments', href: '/assignments' },
      { label: 'View results', href: '/results' },
      { label: 'Review fee account', href: '/payments' },
      { label: 'Submit service request', href: '/helpdesk' },
      { label: 'Open student ID', href: '/digital-id' },
    ],
    widgets: [
      {
        id: 'student-greeting',
        roles: ['STUDENT'],
        permission: 'attendance:read:own',
        dataSource: 'getStudentDashboardData',
        states: ['ready'],
      },
      {
        id: 'student-today-classes',
        roles: ['STUDENT'],
        permission: 'courses:read:institution',
        dataSource: 'getStudentDashboardData',
        drillDown: '/timetable',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'student-attendance',
        roles: ['STUDENT'],
        permission: 'attendance:read:own',
        dataSource: 'getStudentDashboardData',
        drillDown: '/attendance',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'student-assignments',
        roles: ['STUDENT'],
        permission: 'assignments:submit:own',
        dataSource: 'getStudentDashboardData',
        drillDown: '/assignments',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'student-fees',
        roles: ['STUDENT'],
        permission: 'fees:pay:own',
        dataSource: 'getStudentDashboardData',
        drillDown: '/payments',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'student-notices',
        roles: ['STUDENT'],
        permission: 'notices:read:institution',
        dataSource: 'getStudentDashboardData',
        drillDown: '/notifications',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'student-risk-alerts',
        roles: ['STUDENT'],
        permission: 'grades:read:own',
        dataSource: 'getStudentDashboardData',
        drillDown: '/student-success',
        states: ['loading', 'empty', 'error', 'ready'],
      },
      {
        id: 'student-quick-actions',
        roles: ['STUDENT'],
        permission: 'attendance:read:own',
        dataSource: 'registry',
        states: ['ready'],
      },
      {
        id: 'student-recent-activity',
        roles: ['STUDENT'],
        permission: 'grades:read:own',
        dataSource: 'getStudentDashboardData',
        states: ['loading', 'empty', 'error', 'ready'],
      },
    ],
    dataContract: 'StudentDashboardData',
  },
};
