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
  notices: NoticeItem[];
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];
};
