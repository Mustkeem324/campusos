import { describe, expect, it } from 'vitest';

import { canEscalateTo, escalationTargetsForRole, initialHelpdeskQueue, slaHoursForPriority } from './helpdesk-policy';

describe('role-aware helpdesk routing', () => {
  it('routes ordinary student academic questions to faculty, never directly to Dean', () => {
    expect(initialHelpdeskQueue('STUDENT', 'ACADEMIC')).toBe('FACULTY');
    expect(initialHelpdeskQueue('STUDENT', 'EXAMINATION')).toBe('EXAMINATION_CONTROLLER');
    expect(initialHelpdeskQueue('STUDENT', 'FACULTY_CONCERN')).toBe('HOD');
  });

  it('enforces the Faculty -> HOD -> Dean escalation chain', () => {
    expect(escalationTargetsForRole('FACULTY')).toEqual(['HOD']);
    expect(canEscalateTo('FACULTY', 'DEAN')).toBe(false);
    expect(canEscalateTo('FACULTY', 'HOD')).toBe(true);
    expect(canEscalateTo('HOD', 'DEAN')).toBe(true);
  });

  it('allows examination cases to move upward without giving students direct senior access', () => {
    expect(escalationTargetsForRole('EXAMINATION_CONTROLLER')).toContain('DEAN');
    expect(canEscalateTo('EXAMINATION_CONTROLLER', 'DEAN')).toBe(true);
    expect(canEscalateTo('STUDENT', 'DEAN')).toBe(false);
  });

  it('uses shorter SLA windows for higher priority cases', () => {
    expect(slaHoursForPriority('URGENT')).toBe(4);
    expect(slaHoursForPriority('HIGH')).toBe(12);
    expect(slaHoursForPriority('NORMAL')).toBe(48);
    expect(slaHoursForPriority('LOW')).toBe(72);
  });
});
