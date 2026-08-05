import type { RoleType } from '@prisma/client';

import type { ActivityItem, NoticeItem, QuickAction, RiskAlert } from './contracts';

export const PHASE5_DASHBOARD_ROLES = [
  'DEAN',
  'HOD',
  'HR_ADMIN',
  'WARDEN',
  'TRANSPORT_MANAGER',
  'PLACEMENT_OFFICER',
] as const satisfies readonly RoleType[];

export type Phase5DashboardRole = (typeof PHASE5_DASHBOARD_ROLES)[number];

export type Phase5Metric = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  tone: 'neutral' | 'positive' | 'warning' | 'danger';
};

export type Phase5Insight = {
  id: string;
  label: string;
  value: string | number;
  detail: string;
  percentage?: number;
  href?: string;
};

export type Phase5QueueItem = {
  id: string;
  title: string;
  detail: string;
  reference?: string;
  status: string;
  href: string;
};

export type Phase5DashboardData = {
  role: Phase5DashboardRole;
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
  metrics: Phase5Metric[];
  insights: {
    title: string;
    description: string;
    items: Phase5Insight[];
  };
  queue: {
    title: string;
    description: string;
    items: Phase5QueueItem[];
    emptyMessage: string;
  };
  riskAlerts: RiskAlert[];
  quickActions: QuickAction[];
  notices: NoticeItem[];
  recentActivity: ActivityItem[];
};

export function isPhase5DashboardRole(role: RoleType): role is Phase5DashboardRole {
  return PHASE5_DASHBOARD_ROLES.includes(role as Phase5DashboardRole);
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
