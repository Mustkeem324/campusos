import type { RoleType } from '@prisma/client';

import type { ActivityItem, DashboardMetric, NoticeItem, QuickAction, RiskAlert } from './contracts';

export const OPERATIONAL_DASHBOARD_ROLES = [
  'REGISTRAR',
  'FINANCE_OFFICER',
  'EXAMINATION_CONTROLLER',
  'ADMISSIONS_COUNSELLOR',
] as const satisfies readonly RoleType[];

export type OperationalDashboardRole = (typeof OPERATIONAL_DASHBOARD_ROLES)[number];

export type OperationalRecord = {
  id: string;
  title: string;
  detail: string;
  status?: string;
  date?: string;
  href?: string;
};

export type OperationalSummaryItem = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  href?: string;
};

export type OperationalDashboardData = {
  role: OperationalDashboardRole;
  identity: {
    id: string;
    name: string;
    email: string;
    title: string;
  };
  heading: {
    eyebrow: string;
    title: string;
    description: string;
  };
  metrics: DashboardMetric[];
  summary: OperationalSummaryItem[];
  recordsTitle: string;
  recordsDescription: string;
  records: OperationalRecord[];
  notices: NoticeItem[];
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  recentActivity: ActivityItem[];
};

export function isOperationalDashboardRole(role: RoleType): role is OperationalDashboardRole {
  return OPERATIONAL_DASHBOARD_ROLES.includes(role as OperationalDashboardRole);
}
