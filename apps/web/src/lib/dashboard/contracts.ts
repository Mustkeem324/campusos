/**
 * Role-specific dashboard data contracts (Phase 95).
 *
 * Each dashboard returns ONLY the data authorised for that role. A single
 * universal payload is forbidden; these contracts are the server-side response
 * shapes produced by the role-specific loaders in `lib/dashboard/`.
 */

export type DashboardMetric = {
  id: string;
  label: string;
  value: string | number | null;
  detail: string;
  tone?: 'neutral' | 'positive' | 'warning' | 'danger';
};

export type QuickAction = {
  label: string;
  href: string;
};

export type ActivityItem = {
  id: string;
  action: string;
  entity: string;
  createdAt: string;
};

export type ClassSlot = {
  id: string;
  code: string;
  title: string;
  time: string;
  room: string;
  status: 'LIVE NOW' | 'UPCOMING' | 'COMPLETED';
};

export type AssignmentItem = {
  id: string;
  title: string;
  courseCode: string;
  dueDate: string;
  submitted: boolean;
  marksObtained: number | null;
};

export type NoticeItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export type RiskAlert = {
  id: string;
  level: 'info' | 'warning' | 'danger';
  message: string;
  href?: string;
};

export type FeeSummary = {
  outstandingAmount: number | null;
  totalInvoiced: number | null;
  nextDueDate: string | null;
  invoiceCount: number;
  status: 'CLEAR' | 'PARTIAL' | 'OUTSTANDING' | 'UNKNOWN';
};

export type ExaminationItem = {
  id: string;
  name: string;
  type: string;
  examDate: string;
  status: 'UPCOMING' | 'COMPLETED';
};

export type PublishedResultItem = {
  id: string;
  examinationName: string;
  sgpa: number;
  cgpa: number;
  status: string;
  publishedAt: string;
};

export type ServiceRequestItem = {
  id: string;
  caseNumber: string;
  title: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
};

export type HostelSummary = {
  hostelName: string;
  building: string;
  roomNumber: string;
} | null;

export type StudentNotificationItem = {
  id: string;
  title: string;
  body: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

/**
 * INSTITUTION_ADMIN / SUPER_ADMIN — administrator workspace.
 * Identity always represents the authenticated administrator. Students appear
 * only as tenant-scoped aggregates, never as the admin's own profile.
 */
export type AdminDashboardData = {
  role: 'INSTITUTION_ADMIN' | 'SUPER_ADMIN';
  identity: {
    id: string;
    name: string;
    email: string;
    title: string;
  };
  metrics: DashboardMetric[];
  userSummary: {
    students: number;
    faculty: number;
    parents: number;
    administrators: number;
    total: number;
  };
  academicsSummary: {
    departments: number;
    courses: number;
    courseOfferings: number;
    enrollments: number;
  };
  financeSummary: {
    invoiceCount: number;
    paymentCount: number;
    collectedAmount: number;
    outstandingAmount: number;
  };
  supportCases: ServiceRequestItem[];
  notices: NoticeItem[];
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];
};

/**
 * PARENT / GUARDIAN — verified linked-student portal.
 * Identity ALWAYS represents the authenticated guardian (e.g. Anita Verma),
 * never the ward. Each linked student is shown separately and every request
 * for a student's data must pass the guardian-relationship verification.
 */
export type ParentDashboardData = {
  role: 'PARENT';
  identity: {
    id: string;
    name: string;
    email: string;
    title: string;
  };
  /** All verified, active, same-tenant linked students. */
  linkedStudents: Array<{
    id: string;
    name: string;
    rollNumber: string;
    programme: string;
    batch: string;
    relationship: string;
  }>;
  /** The student currently being viewed (always a verified link). */
  selectedStudentId: string | null;
  /** Authorised data for the selected linked student only. */
  selectedStudent: {
    id: string;
    name: string;
    rollNumber: string;
    programme: string;
    batch: string;
    relationship: string;
    cgpa: number | null;
    attendance: { present: number; total: number; percentage: number | null } | null;
    publishedResults: PublishedResultItem[];
    feeSummary: FeeSummary;
  } | null;
  notices: NoticeItem[];
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];
};

/**
 * FACULTY — teaching workspace.
 * Identity ALWAYS represents the authenticated faculty member (e.g. Dr. Priya
 * Sharma), never a student. Students appear only as aggregates scoped to the
 * courses the faculty member actually teaches.
 */
export type FacultyDashboardData = {
  role: 'FACULTY';
  identity: {
    id: string;
    name: string;
    email: string;
    title: string;
    designation: string | null;
    departmentId: string | null;
  };
  academicPeriod: { label: string } | null;
  /** Only offerings the faculty member actually teaches. */
  assignedCourses: Array<{
    id: string;
    code: string;
    title: string;
    section: string | null;
    term: string;
    studentCount: number;
    assignmentCount: number;
    ungradedSubmissionCount: number;
    attendanceSessionCount: number;
  }>;
  todayClasses: ClassSlot[];
  pendingGrading: {
    total: number;
    perCourse: Array<{ courseCode: string; count: number }>;
  };
  attendance: {
    sessionCount: number;
    recordedToday: number;
  };
  metrics: DashboardMetric[];
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];
};

/**
 * STUDENT — the only dashboard fully implemented in the Phase 95 first cycle.
 * Identity always represents the authenticated student persona.
 */
export type StudentDashboardData = {
  role: 'STUDENT';
  identity: {
    id: string;
    name: string;
    email: string;
    rollNumber: string;
    programme: string;
    batch: string;
    section: string | null;
  };
  academicPeriod: { label: string } | null;
  cgpa: number | null;
  creditsEarned: number | null;
  todayClasses: ClassSlot[];
  attendance: { present: number; total: number; percentage: number | null } | null;
  assignments: AssignmentItem[];
  feeSummary: FeeSummary;
  examinations: ExaminationItem[];
  publishedResults: PublishedResultItem[];
  studentServices: ServiceRequestItem[];
  hostel: HostelSummary;
  notices: NoticeItem[];
  notifications: StudentNotificationItem[];
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];
};
