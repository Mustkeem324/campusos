import type { RoleType } from '@prisma/client';

import type { ActivityItem, NoticeItem, QuickAction, RiskAlert } from './contracts';

export const PHASE4_DASHBOARD_ROLES = [
  'FINANCE_OFFICER',
  'ACCOUNTANT',
  'LIBRARIAN',
] as const satisfies readonly RoleType[];

export type Phase4DashboardRole = (typeof PHASE4_DASHBOARD_ROLES)[number];

export type Phase4Metric = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
};

export type Phase4BreakdownItem = {
  id: string;
  label: string;
  value: number;
  formattedValue: string;
  percentage: number;
  detail?: string;
};

export type Phase4QueueItem = {
  id: string;
  title: string;
  reference: string;
  detail: string;
  status: string;
  date?: string;
  href: string;
};

export type Phase4SummaryItem = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  href?: string;
};

export type Phase4DashboardData = {
  role: Phase4DashboardRole;
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
    assurance: string;
  };
  metrics: Phase4Metric[];
  summaries: Phase4SummaryItem[];
  breakdown: {
    title: string;
    description: string;
    items: Phase4BreakdownItem[];
    emptyMessage: string;
  };
  queue: {
    title: string;
    description: string;
    items: Phase4QueueItem[];
    emptyMessage: string;
  };
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  notices: NoticeItem[];
  recentActivity: ActivityItem[];
};

export function isPhase4DashboardRole(role: RoleType): role is Phase4DashboardRole {
  return PHASE4_DASHBOARD_ROLES.includes(role as Phase4DashboardRole);
}

export function normalisePercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
