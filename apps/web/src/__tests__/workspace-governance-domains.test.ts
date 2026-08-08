import { describe, expect, it, vi } from 'vitest';
import { RoleType } from '@prisma/client';

// The workspace libs are server-only modules; the guard is a no-op under vitest.
vi.mock('server-only', () => ({}));

import {
  canManageGovernance,
  canViewGovernance,
  GOVERNANCE_MANAGER_ROLES,
  GOVERNANCE_VIEWER_ROLES,
} from '../lib/governance-workspace';
import { canViewInternational, flagEmoji } from '../lib/international-workspace';
import {
  canViewDataMigration,
  deriveDecisionGates,
  deriveMilestones,
  derivePipelineStages,
} from '../lib/data-migration-workspace';
import { canViewAIGovernance } from '../lib/ai-governance-workspace';

const ALL_ROLES = Object.values(RoleType);

describe('Governance workspace role gating', () => {
  it('restricts management to institution administrators, super admins and registrars', () => {
    expect(canManageGovernance(RoleType.INSTITUTION_ADMIN)).toBe(true);
    expect(canManageGovernance(RoleType.SUPER_ADMIN)).toBe(true);
    expect(canManageGovernance(RoleType.REGISTRAR)).toBe(true);
    expect(canManageGovernance(RoleType.DEAN)).toBe(false);
    expect(canManageGovernance(RoleType.STUDENT)).toBe(false);
    expect(canManageGovernance(RoleType.PARENT)).toBe(false);
  });

  it('lets governance oversight roles view but not manage', () => {
    expect(canViewGovernance(RoleType.DEAN)).toBe(true);
    expect(canViewGovernance(RoleType.HOD)).toBe(true);
    expect(canViewGovernance(RoleType.FACULTY)).toBe(false);
  });

  it('exposes only deliberate roles in the viewer set', () => {
    for (const role of ALL_ROLES) {
      if (GOVERNANCE_MANAGER_ROLES.has(role)) {
        expect(GOVERNANCE_VIEWER_ROLES.has(role)).toBe(true);
      }
    }
  });
});

describe('International workspace role gating', () => {
  it('allows registrars, admissions counsellors, deans and admins', () => {
    expect(canViewInternational(RoleType.INSTITUTION_ADMIN)).toBe(true);
    expect(canViewInternational(RoleType.SUPER_ADMIN)).toBe(true);
    expect(canViewInternational(RoleType.REGISTRAR)).toBe(true);
    expect(canViewInternational(RoleType.ADMISSIONS_COUNSELLOR)).toBe(true);
    expect(canViewInternational(RoleType.DEAN)).toBe(true);
  });

  it('blocks students, parents, faculty and unrelated operational roles', () => {
    expect(canViewInternational(RoleType.STUDENT)).toBe(false);
    expect(canViewInternational(RoleType.PARENT)).toBe(false);
    expect(canViewInternational(RoleType.FACULTY)).toBe(false);
    expect(canViewInternational(RoleType.WARDEN)).toBe(false);
    expect(canViewInternational(RoleType.LIBRARIAN)).toBe(false);
  });

  it('renders regional-indicator flag emojis from ISO-2 codes only', () => {
    expect(flagEmoji('NG')).toBe('🇳🇬');
    expect(flagEmoji('bd')).toBe('🇧🇩');
    expect(flagEmoji('USA')).toBe('🌐');
    expect(flagEmoji('')).toBe('🌐');
    expect(flagEmoji('XX')).toBe('🌐');
  });
});

describe('Data migration workspace role gating', () => {
  it('is restricted to institutional and platform administrators', () => {
    expect(canViewDataMigration(RoleType.INSTITUTION_ADMIN)).toBe(true);
    expect(canViewDataMigration(RoleType.SUPER_ADMIN)).toBe(true);
  });

  it('blocks every other role including registrars and finance', () => {
    expect(canViewDataMigration(RoleType.REGISTRAR)).toBe(false);
    expect(canViewDataMigration(RoleType.FINANCE_OFFICER)).toBe(false);
    expect(canViewDataMigration(RoleType.FACULTY)).toBe(false);
    expect(canViewDataMigration(RoleType.STUDENT)).toBe(false);
  });
});

describe('Data migration pipeline derivation', () => {
  it('marks earlier stages complete and later stages pending at low progress', () => {
    const stages = derivePipelineStages(32, 7964, 24);
    expect(stages.map((s) => [s.name, s.status])).toEqual([
      ['Extract', 'Complete'],
      ['Transform', 'In Progress'],
      ['Load', 'Pending'],
      ['Validate', 'Pending'],
      ['Publish', 'Pending'],
    ]);
    expect(stages[0].records).toBe(7964);
    expect(stages[0].errors).toBe(24);
  });

  it('completes every stage at 100% progress and rejects negative progress', () => {
    const stages = derivePipelineStages(100, 100, 0);
    expect(stages.every((s) => s.status === 'Complete')).toBe(true);
    expect(derivePipelineStages(-5, 0, 0).every((s) => s.status === 'Pending')).toBe(true);
  });

  it('keeps stage boundaries ordered so earlier stages never lag later ones', () => {
    for (const progress of [0, 19, 20, 39, 40, 59, 60, 79, 80, 99, 100]) {
      const statuses = derivePipelineStages(progress, 1, 0).map((s) => s.status);
      const rank = { Pending: 0, 'In Progress': 1, Complete: 2 } as const;
      for (let i = 1; i < statuses.length; i += 1) {
        // A stage can only be as far along as the stage before it.
        expect(rank[statuses[i]]).toBeLessThanOrEqual(rank[statuses[i - 1]]);
      }
    }
  });
});

describe('Data migration milestone and gate derivation', () => {
  it('derives milestones from real progress', () => {
    const milestones = deriveMilestones(45);
    expect(milestones.find((m) => m.phase === 'Discovery')?.status).toBe('Complete');
    expect(milestones.find((m) => m.phase === 'Data Mapping')?.status).toBe('Complete');
    expect(milestones.find((m) => m.phase === 'Dry Run')?.status).toBe('In Progress');
    expect(milestones.find((m) => m.phase === 'Go-Live')?.status).toBe('Pending');
  });

  it('opens gates as progress crosses readiness thresholds', () => {
    const pending = deriveDecisionGates(30, null);
    expect(pending.every((g) => g.status === 'Pending' && g.date === 'TBD')).toBe(true);
    const atGoLive = deriveDecisionGates(100, new Date('2026-01-15T00:00:00Z'));
    expect(atGoLive.every((g) => g.status === 'Go' && g.date !== 'TBD')).toBe(true);
  });
});

describe('AI governance workspace role gating', () => {
  it('is restricted to institutional and platform administrators', () => {
    expect(canViewAIGovernance(RoleType.INSTITUTION_ADMIN)).toBe(true);
    expect(canViewAIGovernance(RoleType.SUPER_ADMIN)).toBe(true);
  });

  it('blocks academic staff, students and parents', () => {
    expect(canViewAIGovernance(RoleType.DEAN)).toBe(false);
    expect(canViewAIGovernance(RoleType.FACULTY)).toBe(false);
    expect(canViewAIGovernance(RoleType.STUDENT)).toBe(false);
    expect(canViewAIGovernance(RoleType.PARENT)).toBe(false);
  });
});
