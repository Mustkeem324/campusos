import { describe, expect, it } from 'vitest';

import type { Phase6ExperienceData } from './phase6-contracts';
import { buildPhase6ImprovementPlan } from './phase6-improvement';

const baseData: Phase6ExperienceData = {
  role: 'STUDENT',
  identity: {
    name: 'Synthetic Student',
    email: 'student@example.invalid',
    institution: 'Synthetic Institution',
  },
  blueprint: {
    role: 'STUDENT',
    signature: 'student-journey',
    layout: 'journey',
    accent: '#2563EB',
    softAccent: '#DBEAFE',
    icon: 'student',
    eyebrow: 'Student journey',
    title: 'Student role dashboard',
    mission: 'Use verified student records to identify the next useful academic action.',
    assurance: 'Only the authenticated student profile is included in the role experience.',
    primaryAction: { label: 'Open learning workspace', href: '/lms' },
  },
  metrics: [],
  signals: [
    {
      id: 'attendance',
      label: 'Attendance coverage',
      value: '68%',
      detail: 'Recorded attendance percentage',
      percentage: 68,
      href: '/attendance',
    },
    {
      id: 'submissions',
      label: 'Submission completion',
      value: '9/10',
      detail: 'Submitted assignments',
      percentage: 90,
      href: '/assignments',
    },
  ],
  queue: {
    title: 'Next academic actions',
    description: 'Pending student work',
    items: [
      {
        id: 'assignment-1',
        title: 'Submit applied project',
        detail: 'Due in two days',
        status: 'PENDING',
        href: '/assignments',
      },
    ],
    emptyMessage: 'No pending work',
  },
  context: {
    unreadNotifications: 2,
    openSupportCases: 0,
    relevantNotices: 3,
    recentActivity: 5,
    refreshedAt: new Date(0).toISOString(),
  },
};

describe('Phase 6 self-improvement planning', () => {
  it('derives strengths, focus and actions from authorised role evidence', () => {
    const plan = buildPhase6ImprovementPlan(baseData);

    expect(plan.evidenceCoverage).toBe(79);
    expect(plan.strongestArea?.label).toBe('Submission completion');
    expect(plan.focusArea?.label).toBe('Attendance coverage');
    expect(plan.actions.map((action) => action.href)).toEqual([
      '/attendance',
      '/assignments',
      '/notifications',
    ]);
  });

  it('falls back to the role primary action when no evidence or queue exists', () => {
    const plan = buildPhase6ImprovementPlan({
      ...baseData,
      signals: [],
      queue: { ...baseData.queue, items: [] },
      context: { ...baseData.context, unreadNotifications: 0, openSupportCases: 0 },
    });

    expect(plan.evidenceCoverage).toBe(0);
    expect(plan.actions).toEqual([
      expect.objectContaining({ href: '/lms', kind: 'maintain' }),
    ]);
  });
});
